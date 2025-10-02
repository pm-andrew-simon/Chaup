/**
 * AI PLAYER MODULE
 *
 * Handles computer opponent logic for single-player mode.
 *
 * Features:
 * - Automatic dice rolling
 * - Intelligent move selection based on validMovesTable
 * - Animated piece movement
 * - Turn management with delays for readability
 * - Priority-based decision making
 *
 * Dependencies:
 * - game-core.js (requires: validMovesTable, rollPlayerDice, performMove, checkTurnCompletion)
 * - game-ui.js (optional: for visual feedback)
 */

// ============================================================================
// AI STATE
// ============================================================================

/**
 * Флаг блокировки для предотвращения одновременного выполнения хода компьютера
 * @type {boolean}
 */
let isComputerMoving = false;

/**
 * Конфигурация типов игроков
 * @type {Array<{playerNum: number, type: 'human'|'computer'}>}
 */
let playerTypes = [];

/**
 * Скорость игры компьютера (задержки в миллисекундах)
 * @type {{diceRoll: number, moveExecution: number, betweenMoves: number}}
 */
let aiSpeed = {
    diceRoll: 1000,      // Задержка перед броском кубиков
    moveExecution: 800,  // Задержка на анимацию хода
    betweenMoves: 600    // Задержка между двумя ходами
};

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Инициализирует типы игроков для игры
 * @param {Array<{playerNum: number, type: 'human'|'computer'}>} types - Конфигурация игроков
 * @example
 * initPlayerTypes([
 *   {playerNum: 1, type: 'human'},
 *   {playerNum: 2, type: 'computer'},
 *   {playerNum: 3, type: 'human'},
 *   {playerNum: 4, type: 'computer'}
 * ]);
 */
function initPlayerTypes(types) {
    playerTypes = types;
    console.log('🤖 Типы игроков инициализированы:', playerTypes);
}

/**
 * Получает тип игрока по номеру
 * @param {number} playerNum - Номер игрока (1-4)
 * @returns {'human'|'computer'|null}
 */
function getPlayerType(playerNum) {
    const player = playerTypes.find(p => p.playerNum === playerNum);
    return player ? player.type : null;
}

/**
 * Устанавливает скорость игры компьютера
 * @param {'slow'|'fast'|'instant'} speed - Предустановка скорости
 */
function setAISpeed(speed) {
    switch (speed) {
        case 'instant':
            aiSpeed = { diceRoll: 100, moveExecution: 200, betweenMoves: 100 };
            break;
        case 'fast':
            aiSpeed = { diceRoll: 300, moveExecution: 400, betweenMoves: 200 };
            break;
        case 'slow':
        default:
            aiSpeed = { diceRoll: 1000, moveExecution: 800, betweenMoves: 600 };
            break;
    }
    console.log('🤖 Скорость ИИ установлена:', speed, aiSpeed);
}

// ============================================================================
// AI DECISION MAKING
// ============================================================================

/**
 * Выбирает лучший ход из доступных вариантов
 * @param {Array} validMoves - Таблица доступных ходов (validMovesTable)
 * @returns {Array|null} Выбранный ход или null
 *
 * Приоритеты:
 * 1. formulaResult = 3 (два хода возможны)
 * 2. formulaResult = 2 (один ход или дубль)
 * 3. Случайный выбор из ходов с одинаковым приоритетом
 * 4. Приоритет выхода из START_ZONE
 * 5. Приоритет движения вперед по пути
 */
function selectBestMove(validMoves) {
    if (!validMoves || validMoves.length === 0) {
        return null;
    }

    // Группируем ходы по formulaResult (последний элемент массива)
    const movesByPriority = validMoves.reduce((acc, move) => {
        const formulaResult = move[move.length - 1];
        if (!acc[formulaResult]) acc[formulaResult] = [];
        acc[formulaResult].push(move);
        return acc;
    }, {});

    // Выбираем группу с наивысшим приоритетом
    let bestMoves = movesByPriority[3] || movesByPriority[2] || movesByPriority[1] || [];

    if (bestMoves.length === 0) {
        return null;
    }

    // Если несколько ходов с одинаковым приоритетом - выбираем случайный
    const randomIndex = Math.floor(Math.random() * bestMoves.length);
    const selectedMove = bestMoves[randomIndex];

    console.log(`🤖 ИИ выбрал ход из ${bestMoves.length} доступных (formulaResult = ${selectedMove[selectedMove.length - 1]}):`, selectedMove);

    return selectedMove;
}

/**
 * Анализирует ход и определяет, какие фишки и координаты использовать
 * @param {Array} move - Ход из validMovesTable [coord1, coord2, target1, target2, canMove1, canMove2, diceComp, formula]
 * @returns {Array<{from: string, to: string}>} Массив перемещений
 */
function analyzeMoveSequence(move) {
    const [coord1, coord2, target1, target2, canMove1, canMove2, diceComparison, formulaResult] = move;
    const moves = [];

    if (formulaResult === 3) {
        // Два хода: coord1→target1, coord2→target2
        if (canMove1) moves.push({ from: coord1, to: target1 });
        if (canMove2) moves.push({ from: coord2, to: target2 });
    } else if (formulaResult === 2 || formulaResult === 1) {
        // Один ход: используем первый доступный
        if (canMove1) {
            moves.push({ from: coord1, to: target1 });
        } else if (canMove2) {
            moves.push({ from: coord2, to: target2 });
        }
    }

    return moves;
}

// ============================================================================
// AI MOVE EXECUTION
// ============================================================================

/**
 * Выполняет ход компьютера с анимацией
 * @param {string} fromCoord - Исходная координата
 * @param {string} toCoord - Целевая координата
 * @param {number} playerNum - Номер игрока
 * @returns {Promise<boolean>} true если ход выполнен успешно
 */
async function executeMoveWithAnimation(fromCoord, toCoord, playerNum) {
    console.log(`🤖 [Компьютер ${playerNum}] Выполняет ход: ${fromCoord} → ${toCoord}`);

    try {
        // Находим фишку на исходной позиции
        const piece = findPieceAtCoord(fromCoord, playerNum);

        if (!piece) {
            console.error(`🤖 Фишка не найдена на ${fromCoord} для игрока ${playerNum}`);
            return false;
        }

        // Выполняем ход через игровую логику
        const moveResult = performMove(piece, toCoord);

        if (moveResult) {
            // Задержка для визуализации
            await delay(aiSpeed.moveExecution);
            return true;
        }

        return false;
    } catch (error) {
        console.error('🤖 Ошибка при выполнении хода:', error);
        return false;
    }
}

/**
 * Основная функция выполнения хода компьютером
 * @param {number} playerNum - Номер игрока-компьютера
 * @returns {Promise<void>}
 */
async function performComputerMove(playerNum) {
    // Проверка блокировки
    if (isComputerMoving) {
        console.warn('⚠️ Компьютер уже делает ход, пропускаем вызов');
        return;
    }

    // Установка блокировки
    isComputerMoving = true;

    try {
        console.log(`🤖 [Компьютер ${playerNum}] Начинает ход`);

        // Обновляем сообщение для пользователя
        if (typeof updateGameMessage === 'function') {
            updateGameMessage(`🤖 Компьютер ${playerNum} думает...`);
        }

        // 1. Задержка перед броском кубиков
        await delay(aiSpeed.diceRoll);

        // 2. Бросок кубиков
        console.log(`🤖 [Компьютер ${playerNum}] Бросает кубики`);
        rollPlayerDice(playerNum);

        // 3. Ожидание обновления validMovesTable (обрабатывается в handleGamePlay)
        await delay(500);

        // 4. Проверка доступных ходов
        if (!validMovesTable || validMovesTable.length === 0) {
            console.log(`🤖 [Компьютер ${playerNum}] Нет доступных ходов`);

            if (typeof updateGameMessage === 'function') {
                updateGameMessage(`🤖 Компьютер ${playerNum} не может сделать ход`);
            }

            // checkTurnCompletion обработает автопропуск
            return;
        }

        // 5. Выбор лучшего хода
        const selectedMove = selectBestMove(validMovesTable);

        if (!selectedMove) {
            console.log(`🤖 [Компьютер ${playerNum}] Не удалось выбрать ход`);
            return;
        }

        // 6. Анализ последовательности ходов
        const moveSequence = analyzeMoveSequence(selectedMove);

        if (moveSequence.length === 0) {
            console.log(`🤖 [Компьютер ${playerNum}] Пустая последовательность ходов`);
            return;
        }

        // 7. Выполнение ходов
        for (let i = 0; i < moveSequence.length; i++) {
            const { from, to } = moveSequence[i];

            if (typeof updateGameMessage === 'function') {
                updateGameMessage(`🤖 Компьютер ${playerNum} делает ход ${i + 1}/${moveSequence.length}`);
            }

            const success = await executeMoveWithAnimation(from, to, playerNum);

            if (!success) {
                console.error(`🤖 [Компьютер ${playerNum}] Ход ${i + 1} не выполнен`);
                break;
            }

            // Задержка между ходами (если их несколько)
            if (i < moveSequence.length - 1) {
                await delay(aiSpeed.betweenMoves);
            }
        }

        // 8. Проверка завершения хода (выполняется автоматически через performMove → checkTurnCompletion)
        console.log(`🤖 [Компьютер ${playerNum}] Ход завершен`);

    } catch (error) {
        console.error(`🤖 [Компьютер ${playerNum}] Критическая ошибка:`, error);
    } finally {
        // Снятие блокировки (ВСЕГДА)
        isComputerMoving = false;
    }
}

// ============================================================================
// INTEGRATION HOOKS
// ============================================================================

/**
 * Вызывается при смене игрока (интеграция с nextPlayer)
 * @param {number} newPlayerNum - Номер нового активного игрока
 */
function onPlayerChanged(newPlayerNum) {
    const playerType = getPlayerType(newPlayerNum);

    if (playerType === 'computer') {
        console.log(`🤖 Новый игрок - компьютер (${newPlayerNum}), запускаем ход`);

        // Задержка перед запуском хода компьютера
        setTimeout(() => {
            if (!isComputerMoving) {
                performComputerMove(newPlayerNum);
            }
        }, 800);
    } else if (playerType === 'human') {
        console.log(`👤 Новый игрок - человек (${newPlayerNum})`);

        // Активация UI для человека
        if (typeof enableDiceRollForCurrentPlayer === 'function') {
            enableDiceRollForCurrentPlayer();
        }
    }
}

/**
 * Проверяет, является ли текущий игрок компьютером
 * @param {number} playerNum - Номер игрока
 * @returns {boolean}
 */
function isComputerPlayer(playerNum) {
    return getPlayerType(playerNum) === 'computer';
}

/**
 * Блокирует UI для хода компьютера
 * @param {number} playerNum - Номер игрока
 */
function disableUIForComputer(playerNum) {
    if (isComputerPlayer(playerNum)) {
        // Блокировка всех кнопок кубиков
        document.querySelectorAll('.dice-button').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });

        // Блокировка перемещения фишек
        document.querySelectorAll('.piece').forEach(piece => {
            piece.draggable = false;
            piece.style.cursor = 'default';
        });
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Промис-обертка для setTimeout
 * @param {number} ms - Задержка в миллисекундах
 * @returns {Promise<void>}
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Находит фишку на заданной координате для конкретного игрока
 * @param {string} coord - Координата
 * @param {number} playerNum - Номер игрока
 * @returns {HTMLElement|null}
 */
function findPieceAtCoord(coord, playerNum) {
    if (!gameBoard[coord]) return null;

    const piecesAtCoord = Array.isArray(gameBoard[coord]) ? gameBoard[coord] : [gameBoard[coord]];

    for (const pieceId of piecesAtCoord) {
        const piece = document.getElementById(pieceId);
        if (piece && piece.dataset.player == playerNum) {
            return piece;
        }
    }

    return null;
}

// ============================================================================
// EXPORTS (for future modularization)
// ============================================================================

// Если используется как модуль:
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initPlayerTypes,
        getPlayerType,
        setAISpeed,
        performComputerMove,
        onPlayerChanged,
        isComputerPlayer,
        disableUIForComputer,
        selectBestMove,
        delay
    };
}
