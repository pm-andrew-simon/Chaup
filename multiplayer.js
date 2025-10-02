/**
 * MULTIPLAYER.JS
 *
 * This module contains all multiplayer and game persistence functionality for the Chaupar game.
 * It handles Supabase integration for real-time synchronization, game state serialization,
 * save/load functionality, and game ID management.
 *
 * Components:
 * - Supabase client initialization
 * - Game state serialization/deserialization
 * - Save/load game functionality
 * - Real-time multiplayer synchronization via Supabase Realtime
 * - Game ID generation and clipboard management
 * - Auto-save functionality with state sync
 *
 * Dependencies:
 * - Supabase JS Client (loaded via CDN in index.html)
 * - Game state variables from main game logic
 */

// ============================================================================
// SUPABASE CONFIGURATION & VARIABLES
// ============================================================================

const SUPABASE_URL = 'https://xegejrwsaozxymhzowac.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZ2VqcndzYW96eHltaHpvd2FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNzk4NDksImV4cCI6MjA3MTk1NTg0OX0.sT4t4wih618BFCjttDnmAqjZK4G3wQc7vCJ7op1xybQ';
let supabaseClient = null;
let currentGameId = null; // ID текущей игры для автосохранения
let gameChannel = null; // Канал для синхронизации игры в реальном времени
let isRestoringState = false; // Флаг предотвращения циклических обновлений

// ============================================================================
// SUPABASE INITIALIZATION
// ============================================================================

/**
 * Инициализация Supabase клиента
 * Создает подключение к Supabase с настройками Realtime
 */
function initSupabase() {
    if (typeof supabase !== 'undefined') {
        try {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                realtime: {
                    params: {
                        eventsPerSecond: 10
                    }
                }
            });

            // Проверяем доступность Realtime
            setTimeout(() => {
                if (supabaseClient.realtime) {
                } else {
                    console.warn('⚠️ Realtime недоступен');
                }
            }, 1000);
        } catch (error) {
            console.error('❌ Ошибка создания Supabase клиента:', error);
            supabaseClient = null;
        }
    } else {
        console.error('❌ Supabase библиотека не загружена');
    }
}

// ============================================================================
// GAME ID GENERATION & MANAGEMENT
// ============================================================================

/**
 * Генерация уникального ID для игры
 * Формат: CHPR-XXXXXXXX (8 случайных символов)
 * @returns {string} Уникальный ID игры
 */
function generateGameId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'CHPR-';
    for (let i = 0; i < 8; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

/**
 * Управление видимостью контейнера с ID игры
 * Показывает ID текущей игры для копирования
 */
function showGameId() {
    const container = document.getElementById('game-id-container');
    const input = document.getElementById('game-id-input');
    if (container && currentGameId) {
        container.classList.add('visible');
        input.value = currentGameId;
    }
}

/**
 * Скрывает контейнер с ID игры
 */
function hideGameId() {
    const container = document.getElementById('game-id-container');
    if (container) {
        container.classList.remove('visible');
    }
}

/**
 * Копирование ID игры в буфер обмена
 * Показывает визуальное подтверждение успешного копирования
 */
function copyGameId() {
    const input = document.getElementById('game-id-input');
    if (input && input.value) {
        copyToClipboard(input.value);

        // Показать уведомление о копировании
        const btn = document.getElementById('copy-game-id-btn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Скопировано';
        btn.style.background = '#4CAF50';

        // Показать уведомление в самом поле
        const originalPlaceholder = input.placeholder;
        input.placeholder = 'ID скопирован!';
        input.style.background = 'rgba(76, 175, 80, 0.1)';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = 'rgba(102, 126, 234, 0.8)';
            input.placeholder = originalPlaceholder;
            input.style.background = 'rgba(255, 255, 255, 0.9)';
        }, 1500);
    }
}

/**
 * Копирование текста в буфер обмена
 * @param {string} text - Текст для копирования
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
}

// ============================================================================
// GAME STATE SERIALIZATION
// ============================================================================

/**
 * Сериализация состояния игры в объект для сохранения
 * Собирает все данные игры включая позиции фишек, текущего игрока, фазу игры и т.д.
 * @returns {Object} Объект с полным состоянием игры
 */
function serializeGameState() {
    // Сериализуем текущие позиции фишек
    const piecesData = {};
    for (let player = 1; player <= playerCount; player++) {
        if (pieces[player]) {
            piecesData[player] = pieces[player].map(piece => {
                // Используем позицию из массива pieces (должна быть актуальной после обновления)
                // Но также проверим текущую визуальную позицию как резерв
                const storedPosition = piece.position;
                const currentPosition = getCurrentPosition(piece.element);
                return {
                    position: storedPosition || currentPosition,
                    id: piece.element.dataset.id
                };
            });
        }
    }

    const gameState = {
        currentPlayer: currentPlayer,
        gamePhase: gamePhase,
        rollCount: rollCount,
        maxRolls: maxRolls,
        lastDiceRoll: lastDiceRoll,
        diceUsed: diceUsed,
        consecutiveDoubles: consecutiveDoubles,
        playersOrder: playersOrder,
        diceLog: diceLog,
        orderResults: orderResults,
        playersToRoll: playersToRoll,
        firstMoveWinner: firstMoveWinner,
        selectedPiece: selectedPiece ? {
            player: selectedPiece.dataset.player,
            id: selectedPiece.dataset.id
        } : null,
        cachedValidMoves: selectedPiece ? cachedValidMoves : [],
        playerCount: playerCount,
        piecesData: piecesData,
        playerDiceValues: playerDiceValues,
        gameMessages: gameMessages,
        skippedTurns: skippedTurns,
        piecesTeleportHistory: piecesTeleportHistory,
        currentTurnNumber: currentTurnNumber,
        timestamp: new Date().toISOString()
    };

    return gameState;
}

/**
 * Десериализация состояния игры из объекта
 * Восстанавливает все переменные игры и воссоздает фишки на доске
 * @param {Object} gameState - Объект с сохраненным состоянием игры
 */
function deserializeGameState(gameState) {

    currentPlayer = gameState.currentPlayer;
    gamePhase = gameState.gamePhase;
    rollCount = gameState.rollCount || 0;
    maxRolls = gameState.maxRolls || 3;
    lastDiceRoll = gameState.lastDiceRoll || [0, 0];
    diceUsed = gameState.diceUsed || [false, false];
    consecutiveDoubles = gameState.consecutiveDoubles || 0;
    playersOrder = gameState.playersOrder || [];
    gameMessages = gameState.gameMessages || [];
    skippedTurns = gameState.skippedTurns || [];
    piecesTeleportHistory = gameState.piecesTeleportHistory || {};
    currentTurnNumber = gameState.currentTurnNumber || 0;
    diceLog = gameState.diceLog || [];

    // Восстанавливаем кеш ходов из состояния игры
    cachedValidMoves = gameState.cachedValidMoves || [];
    orderResults = gameState.orderResults || [];
    playersToRoll = gameState.playersToRoll || [];
    firstMoveWinner = gameState.firstMoveWinner;
    // Восстанавливаем selectedPiece
    if (gameState.selectedPiece) {
        const targetPlayer = parseInt(gameState.selectedPiece.player);
        const targetId = gameState.selectedPiece.id;

        // Отложим восстановление выделения до после создания фишек
        setTimeout(() => {
            const piece = pieces[targetPlayer]?.find(p => p.element.dataset.id === targetId);
            if (piece) {
                isUpdatingSelection = true;
                selectPiece(piece.element);

                // Показываем подсказки из восстановленного кеша
                if (cachedValidMoves.length > 0) {
                    showCachedMoveHints();
                } else {
                }

                isUpdatingSelection = false;
            } else {
                selectedPiece = null;
            }
        }, 200);
    } else {
        selectedPiece = null;
        // Очищаем подсказки, если никакая фишка не выбрана
        clearMoveHints();
    }
    playerCount = gameState.playerCount || 2;
    playerDiceValues = gameState.playerDiceValues || {1: [0, 0], 2: [0, 0], 3: [0, 0], 4: [0, 0]};


    // Очищаем текущие фишки с доски
    document.querySelectorAll('.piece').forEach(piece => piece.remove());

    // Очищаем текущее состояние игровой доски
    gameBoard = {};
    pieces = {};

    // Воссоздаем фишки на основе сохраненных данных
    if (gameState.piecesData) {
        for (let player = 1; player <= playerCount; player++) {
            pieces[player] = [];
            if (gameState.piecesData[player]) {
                gameState.piecesData[player].forEach((pieceData, index) => {
                    // Проверяем валидность данных фишки
                    if (!pieceData.position) {
                        return;
                    }

                    // Создаем новый элемент фишки
                    const piece = document.createElement('div');
                    const colors = ['player1', 'player2', 'player3', 'player4'];
                    piece.className = `piece ${colors[player-1]}`;
                    piece.dataset.player = player;
                    piece.dataset.id = pieceData.id || `p${player}_${index}`;
                    // Отключаем drag-n-drop, используем только click-to-select
            // piece.draggable = true;

                    // Добавляем обработчики событий (drag-n-drop отключен)
                    // piece.addEventListener('dragstart', handleDragStart);
                    // piece.addEventListener('dragend', handleDragEnd);
                    piece.addEventListener('touchstart', handleTouchStart, {passive: true});
                    piece.addEventListener('touchmove', handleTouchMove, {passive: false});
                    piece.addEventListener('touchend', handleTouchEnd, {passive: false});
                    piece.addEventListener('click', function(e) {
                        e.stopPropagation();
                        handlePieceClick(piece);
                    });

                    // Добавляем всплывающую подсказку
                    addPieceTooltip(piece);

                    // Используем ту же функцию что и для локальных ходов
                    movePiece(piece, pieceData.position);

                    // Добавляем к игровой доске
                    const gameBoardElement = document.getElementById('game-board');
                    if (gameBoardElement) {
                        gameBoardElement.appendChild(piece);
                    }

                    // Добавляем фишку в массив pieces (movePiece обновит позицию)
                    pieces[player].push({element: piece, position: pieceData.position});
                });
            }
        }
    }

    // Воссоздаем кубики игроков
    createPlayerDice();

    // Обновляем UI для gameMessages после восстановления
    if (gameMessages.length > 0) {
        const displayMessage = [...gameMessages].reverse().join('\n\n───────────────\n\n');
        document.getElementById('game-message').textContent = displayMessage;
    }

}

// ============================================================================
// GAME STATE DATABASE OPERATIONS
// ============================================================================

/**
 * Обновление состояния игры в Supabase
 * @param {string} gameId - ID игры для обновления
 * @param {Object} gameState - Сериализованное состояние игры
 * @param {string} updatedAt - Временная метка обновления
 */
async function updateGameState(gameId, gameState, updatedAt) {
    if (!supabaseClient || !gameId) {
        return;
    }


    try {
        const { data, error } = await supabaseClient
            .from('saved_games')
            .update({
                game_state: gameState,
                updated_at: updatedAt
            })
            .eq('CHPR_id', gameId);

        if (error) {
            console.error('❌ UPDATE: Ошибка обновления состояния игры:', error);
        } else {
            }
    } catch (error) {
        console.error('❌ UPDATE: Исключение при обновлении:', error);
    }
}

/**
 * Автоматическое сохранение состояния игры
 * Вызывается после каждого изменения игры для синхронизации с БД
 */
async function autoSaveGame() {
    if (!currentGameId || isRestoringState) {
        return;
    }
    const gameState = serializeGameState();
    const updatedAt = new Date().toISOString();

    try {
        await updateGameState(currentGameId, gameState, updatedAt);

        // Включить кнопку "Передать ход" после успешного автосохранения
        const nextPlayerBtn = document.getElementById('next-player-btn');
        if (nextPlayerBtn && gamePhase === 'playing') {
            nextPlayerBtn.disabled = false;
            nextPlayerBtn.textContent = 'Передать ход';
        }
    } catch (error) {
        // В случае ошибки все равно разблокировать кнопку через 3 секунды
        setTimeout(() => {
            const nextPlayerBtn = document.getElementById('next-player-btn');
            if (nextPlayerBtn && gamePhase === 'playing') {
                nextPlayerBtn.disabled = false;
                nextPlayerBtn.textContent = 'Передать ход';
            }
        }, 3000);
    }
}

/**
 * Инициализация автосохранения при старте игры
 * Создает новую запись в БД и устанавливает ID для автосохранения
 */
async function initializeAutoSave() {

    // Ждем инициализации Supabase клиента
    if (!supabaseClient) {
        await new Promise(resolve => {
            const checkClient = () => {
                if (supabaseClient) {
                    resolve();
                } else {
                    setTimeout(checkClient, 100);
                }
            };
            checkClient();
        });
    }

    try {
        currentGameId = generateGameId();
        const gameState = serializeGameState();
        const now = new Date().toISOString();

        const { data, error } = await supabaseClient
            .from('saved_games')
            .insert([
                {
                    CHPR_id: currentGameId,
                    game_state: gameState,
                    created_at: now,
                    updated_at: now
                }
            ]);

        if (error) {
            console.error('Ошибка создания начального сохранения:', error);
            currentGameId = null;
        } else {
            // Показать ID игры сразу после создания
            showGameId();
            // Подписаться на изменения игры
            subscribeToGameChanges(currentGameId);
        }
    } catch (error) {
        console.error('Ошибка инициализации автосохранения:', error);
        currentGameId = null;
    }
}

// ============================================================================
// SAVE/LOAD FUNCTIONALITY
// ============================================================================

/**
 * Сохранение игры (ручное)
 * Создает новую запись в БД и показывает ID для передачи другим игрокам
 */
async function saveGame() {
    if (!supabaseClient) {
        alert('Ошибка подключения к базе данных');
        return;
    }

    try {
        const gameId = generateGameId();
        const gameState = serializeGameState();

        const { data, error } = await supabaseClient
            .from('saved_games')
            .insert([
                {
                    CHPR_id: gameId,
                    game_state: gameState,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]);

        if (error) {
            throw error;
        }

        // Показать ID игры пользователю
        const resultDiv = document.createElement('div');
        resultDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            text-align: center;
        `;
        // Создаем элементы безопасно
        const heading = document.createElement('h3');
        heading.textContent = 'Игра успешно сохранена!';

        // Создаем параграф с ID
        const idParagraph = document.createElement('p');
        idParagraph.textContent = 'ID игры: ';
        const strongId = document.createElement('strong');
        strongId.textContent = gameId;
        idParagraph.appendChild(strongId);

        // Создаем инструкцию
        const instructionP = document.createElement('p');
        instructionP.style.fontSize = '14px';
        instructionP.style.color = '#666';
        instructionP.textContent = 'Скопируйте этот ID для загрузки игры';

        // Создаем кнопки
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Копировать ID';
        copyButton.style.cssText = 'margin: 10px; padding: 10px 20px; border-radius: 10px; border: none; background: #667eea; color: white; cursor: pointer;';
        copyButton.onclick = () => copyToClipboard(gameId);

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Закрыть';
        closeButton.style.cssText = 'margin: 10px; padding: 10px 20px; border-radius: 10px; border: none; background: #ccc; color: #333; cursor: pointer;';
        closeButton.onclick = () => resultDiv.remove();

        // Добавляем все элементы
        resultDiv.appendChild(heading);
        resultDiv.appendChild(idParagraph);
        resultDiv.appendChild(instructionP);
        resultDiv.appendChild(copyButton);
        resultDiv.appendChild(closeButton);
        document.body.appendChild(resultDiv);

    } catch (error) {
        console.error('Ошибка сохранения игры:', error);
        alert('Ошибка при сохранении игры: ' + error.message);
    }
}

/**
 * Загрузка игры с исправленной логикой
 * Запрашивает ID игры у пользователя и загружает состояние из БД
 */
async function loadGame() {
    // Затем запрашиваем ID сохраненной игры
    const gameId = prompt('Введите ID сохраненной игры:');
    if (!gameId) {
        // Если пользователь отменил ввод, инициализируем новую игру
        playerCount = 2;
        startGame();
        return;
    }

    // Показываем индикатор загрузки
    updateGameMessage('Загрузка игры...');

    // Используем setTimeout для разделения операций
    setTimeout(async () => {
        // Инициализируем стандартную новую игру с 2 участниками
        playerCount = 2;
        startGame();

        await loadGameData(gameId);
    }, 10);
}

/**
 * Отдельная функция для загрузки данных игры
 * @param {string} gameId - ID игры для загрузки
 */
async function loadGameData(gameId) {
    if (!supabaseClient) {
        alert('Ошибка подключения к базе данных. Продолжаем с новой игрой.');
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('saved_games')
            .select('game_state')
            .eq('CHPR_id', gameId.trim())
            .single();

        if (error) {
            throw error;
        }

        if (!data) {
            alert('Игра с таким ID не найдена. Продолжаем с новой игрой.');
            return;
        }

        // Заменяем состояние игры на сохраненное
        try {
            currentGameId = gameId.trim(); // Устанавливаем ID для автосохранения

            // При загрузке игры не нужно использовать флаг восстановления
            deserializeGameState(data.game_state);

            // Обновляем интерфейс после загрузки
            updatePlayerDisplay();
            updateDiceLogDisplay();

            // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Активируем кубики текущего игрока!
            updatePlayerDiceStates();

            // Обновляем сообщение игрока
            if (gamePhase === 'playing') {
                updateGameMessage(`Очередь игрока: ${playerColors[currentPlayer-1]}`);
                showGameId();
            } else if (gamePhase === 'determining-order') {
                /*updateGameMessage('Определение очередности хода. Бросайте кубики!')*/;
            }

            // Подписаться на изменения загруженной игры
            subscribeToGameChanges(currentGameId);

            // Добавляем тестовую функцию для проверки автосохранения после загрузки
            window.testAutoSaveAfterLoad = () => {
                autoSaveGame();
            };

            // Обновляем состояние кнопок - продолжаем игру с того же состояния
            const rollDiceBtn = document.getElementById('roll-dice-btn');
            const nextPlayerBtn = document.getElementById('next-player-btn');

            if (gamePhase === 'playing') {
                // Включаем возможность бросать кубики - игрок может продолжать ход
                if (rollDiceBtn) rollDiceBtn.disabled = false;
                if (nextPlayerBtn) {
                    // Активируем кнопку "Передать ход" чтобы игрок мог передать ход
                    nextPlayerBtn.disabled = false;
                }
            } else if (gamePhase === 'determining-order') {
                // Во время определения очередности кнопка "Передать ход" неактивна
                if (nextPlayerBtn) {
                    nextPlayerBtn.disabled = true;
                }
            }

            // Сообщаем о успешной загрузке
            const currentPlayerColor = playerColors[currentPlayer - 1];
            updateGameMessage(`Сессия загружена. Игрок в команде. Ход игрока: ${currentPlayerColor}`);

        } catch (deserializeError) {
            console.error('Ошибка при десериализации:', deserializeError);
            alert('Ошибка при восстановлении игры. Продолжаем с новой игрой.');
        }

    } catch (error) {
        console.error('Ошибка загрузки игры:', error);
        alert('Ошибка при загрузке игры. Продолжаем с новой игрой.');
    }
}

// ============================================================================
// REAL-TIME MULTIPLAYER SYNCHRONIZATION
// ============================================================================

/**
 * Подписка на изменения игры в реальном времени
 * Создает канал Supabase Realtime для синхронизации с другими игроками
 * @param {string} gameId - ID игры для подписки
 */
function subscribeToGameChanges(gameId) {
    if (!supabaseClient || !gameId) {
        console.warn('Realtime недоступен: нет клиента или ID игры');
        return;
    }

    try {
    // Отписываемся от предыдущего канала, если он существует
    let isReplacingChannel = false;
    if (gameChannel) {
        isReplacingChannel = true;
        supabaseClient.removeChannel(gameChannel);
        gameChannel = null;
    }

    // Создаем новый канал для подписки

    gameChannel = supabaseClient.channel(`game-${gameId}`)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'saved_games',
            filter: `CHPR_id=eq.${gameId}`
        }, (payload) => {
            if (payload.new && payload.new.game_state) {
                // Проверяем, не выполняется ли случайный ход
                if (isPerformingRandomMove) {
                    return;
                }
                restoreGameState(payload.new.game_state);
            } else {
                console.warn('Получен пустой game_state');
            }
        })
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                // Успешная подписка, автосохранение работает
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ REALTIME ERROR: Ошибка канала:', err);
                updateGameMessage('⚠️ Ошибка синхронизации. Игра работает локально.');
            } else if (status === 'TIMED_OUT') {
                console.error('⏱️ REALTIME ERROR: Таймаут подписки:', err);
                updateGameMessage('⚠️ Таймаут соединения. Игра работает локально.');
            } else if (status === 'CLOSED') {
                if (!isReplacingChannel) {
                    console.warn('⚠️ REALTIME WARNING: Канал закрыт неожиданно');
                    updateGameMessage('ℹ️ Мультиплеер недоступен. Игра работает локально.');
                }
                // Отключаем попытки повторного подключения
                if (gameChannel) {
                    gameChannel = null;
                }
            }
        });


    } catch (error) {
        console.warn('⚠️ Ошибка при настройке Realtime:', error.message);
        updateGameMessage('ℹ️ Мультиплеер недоступен. Игра работает локально.');
    }
}

/**
 * Восстановление состояния игры с анимацией
 * Вызывается при получении обновления от Realtime
 * @param {Object} newGameState - Новое состояние игры
 */
function restoreGameState(newGameState) {

    // Если уже идет восстановление, пропускаем
    if (isRestoringState) {
        return;
    }

    // Проверяем, отличается ли новое состояние от текущего
    const currentState = serializeGameState();

    // Сравниваем ключевые поля, а не всё состояние целиком
    const isStateChanged =
        currentState.currentPlayer !== newGameState.currentPlayer ||
        currentState.gamePhase !== newGameState.gamePhase ||
        JSON.stringify(currentState.playerDiceValues) !== JSON.stringify(newGameState.playerDiceValues) ||
        JSON.stringify(currentState.diceLog) !== JSON.stringify(newGameState.diceLog) ||
        JSON.stringify(currentState.diceUsed) !== JSON.stringify(newGameState.diceUsed) ||
        currentState.rollCount !== newGameState.rollCount ||
        JSON.stringify(currentState.selectedPiece) !== JSON.stringify(newGameState.selectedPiece);


    if (!isStateChanged) {
        return;
    }


    // Устанавливаем флаг восстановления, чтобы избежать циклических обновлений
    isRestoringState = true;

    // Получаем текущие позиции всех фишек для анимации
    const currentPieces = {};
    document.querySelectorAll('.piece').forEach(piece => {
        const player = piece.dataset.player;
        const pieceIndex = piece.dataset.pieceIndex;
        const currentPos = getCurrentPosition(piece);
        if (!currentPieces[player]) currentPieces[player] = {};
        currentPieces[player][pieceIndex] = {
            element: piece,
            oldPosition: currentPos
        };
    });

    // Восстанавливаем состояние игры
    deserializeGameState(newGameState);

    // Обновляем интерфейс после восстановления
    updatePlayerDisplay();
    updateDiceLogDisplay();

    // Обновляем сообщение игрока в зависимости от фазы игры
    if (gamePhase === 'playing') {
        /*updateGameMessage(`Очередь игрока1: ${playerColors[currentPlayer-1]}`)*/;
    } else if (gamePhase === 'determining-order') {
        /*updateGameMessage('Определение очередности хода. Бросайте кубики!')*/;
    }

    // Фишки перемещены через movePiece() с использованием CSS transitions (0.3s)

    // Обновляем состояние кубиков игроков после восстановления
    updatePlayerDiceStates();

    // Снимаем флаг восстановления через 1 секунду
    setTimeout(() => {
        isRestoringState = false;
    }, 1000);
}

// ============================================================================
// CLEANUP & EVENT HANDLERS
// ============================================================================

/**
 * Отписка от канала при закрытии страницы
 * Предотвращает утечки памяти и проблемы с подключениями
 */
window.addEventListener('beforeunload', function() {
    if (gameChannel) {
        supabaseClient.removeChannel(gameChannel);
    }
});
