/**
 * GAME UI MODULE - Chaupar Game
 *
 * This module contains all UI-related components and functions for the Chaupar game:
 * - UI state variables (selectedPiece, touchStartPos, boardScale, etc.)
 * - Board rendering functions (createBoard, createPieces, coordToPosition, positionToCoord)
 * - Event handlers (touch, click, drag events)
 * - Visual feedback functions (showMoveHints, updateGameMessage, tooltips)
 * - Dice UI (createPlayerDice, updatePlayerDiceStates, createDiceFace)
 * - Animation and CSS class manipulation
 *
 * This module works in conjunction with game-core.js which contains game logic.
 */

// ============================================================================
// UI STATE VARIABLES
// ============================================================================

let boardScale = 1;
let boardTranslateX = 0;
let boardTranslateY = 0;
let selectedPiece = null;
let touchStartPos = null;
let touchPiece = null;
let currentTooltip = null;

// Flags for preventing circular updates
let isUpdatingSelection = false;

// ============================================================================
// COORDINATE SYSTEM FUNCTIONS
// ============================================================================

/**
 * Converts board coordinate (e.g., "A1") to pixel position
 */
function coordToPosition(coord) {
    const col = coord.charCodeAt(0) - 65; // A=0, B=1, ..., O=14
    const row = parseInt(coord.substring(1)) - 1; // 1=0, 2=1, ..., 15=14

    let boardSize;
    if (window.innerWidth <= 768) {
        // На мобильных устройствах используем полную ширину экрана
        boardSize = window.innerWidth;
    } else {
        // На десктопе ограничиваем размер
        boardSize = Math.min(window.innerWidth * 0.9, 600);
    }

    let cellSize;
    if (window.innerWidth <= 768) {
        // На мобильных устройствах делаем клетки ровно 1/15 от размера поля
        cellSize = (boardSize-20) / 15;
    } else {
        // На десктопе используем оригинальную пропорцию
        cellSize = boardSize * 35 / 600;
    }

    // Рассчитываем отступ так, чтобы сетка 15x15 была точно по центру
    // Общая ширина/высота игрового поля: 15 * cellSize
    const gameFieldSize = 15 * cellSize;
    const offset = (boardSize - gameFieldSize) / 2;

    return {
        x: col * cellSize + offset,
        y: row * cellSize + offset
    };
}

/**
 * Converts pixel position to board coordinate
 */
function positionToCoord(x, y) {
    let boardSize;
    if (window.innerWidth <= 768) {
        boardSize = window.innerWidth;
    } else {
        boardSize = Math.min(window.innerWidth * 0.9, 600);
    }

    let cellSize;
    if (window.innerWidth <= 768) {
        // На мобильных устройствах делаем клетки ровно 1/15 от размера поля
        cellSize = boardSize / 15;
    } else {
        // На десктопе используем оригинальную пропорцию
        cellSize = boardSize * 35 / 600;
    }

    // Используем тот же расчет отступа, что и в coordToPosition
    const gameFieldSize = 15 * cellSize;
    const offset = (boardSize - gameFieldSize) / 2;

    const col = Math.floor((x - offset) / cellSize);
    const row = Math.floor((y - offset) / cellSize);
    if (col < 0 || col > 14 || row < 0 || row > 14) return null;
    return String.fromCharCode(65 + col) + (row + 1);
}

/**
 * Calculates dice area center position
 */
function calculateDiceAreaPosition(area) {
    const fromPos = coordToPosition(area.from);
    const toPos = coordToPosition(area.to);

    if (!fromPos || !toPos) return null;

    // Центр области
    const centerX = (fromPos.x + toPos.x) / 2;
    const centerY = (fromPos.y + toPos.y) / 2;

    return { centerX, centerY };
}

/**
 * Calculates piece position with offset for multiple pieces in same cell
 */
function calculatePiecePosition(coord) {
    const basePos = coordToPosition(coord);
    const isWaitingZone = Object.values(WAITING_ZONES).flat().includes(coord);
    const isStartZone = Object.values(START_ZONES).flat().includes(coord);

    if (isWaitingZone || isStartZone) {
        const piecesInCell = gameBoard[coord] ? gameBoard[coord].length : 0;
        const offset = piecesInCell * 3;
        return {
            x: basePos.x + offset,
            y: basePos.y + offset
        };
    }

    return basePos;
}

// ============================================================================
// BOARD RENDERING FUNCTIONS
// ============================================================================

/**
 * Creates the game board with all cells, zones, and decorations
 */
function createBoard() {
    const board = document.getElementById('game-board');
    if (!board) {
        console.error('Элемент game-board не найден при создании доски!');
        return;
    }

    board.innerHTML = '';

    // Create main board cells
    BOARD_CELLS.forEach((coord, index) => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.coord = coord;

        const pos = coordToPosition(coord);
        cell.style.left = pos.x + 'px';
        cell.style.top = pos.y + 'px';

        // Add click handler for cells
        cell.addEventListener('click', function(e) {
            e.stopPropagation();
            handleCellClick(coord);
        });

        board.appendChild(cell);
        gameBoard[coord] = null;
    });

    // Create start zones
    for (let player = 1; player <= 4; player++) {
        START_ZONES[player].forEach(coord => {
            const cell = document.createElement('div');
            cell.className = 'cell start-zone';
            cell.dataset.coord = coord;
            cell.dataset.player = player;

            const pos = coordToPosition(coord);
            cell.style.left = pos.x + 'px';
            cell.style.top = pos.y + 'px';

            cell.addEventListener('click', function(e) {
                e.stopPropagation();
                handleCellClick(coord);
            });

            board.appendChild(cell);
            gameBoard[coord] = [];
        });
    }

    // Create waiting zones
    for (let player = 1; player <= 4; player++) {
        WAITING_ZONES[player].forEach(coord => {
            const cell = document.createElement('div');
            cell.className = 'cell waiting-zone';
            cell.dataset.coord = coord;
            cell.dataset.player = player;

            const pos = coordToPosition(coord);
            cell.style.left = pos.x + 'px';
            cell.style.top = pos.y + 'px';

            cell.addEventListener('click', function(e) {
                e.stopPropagation();
                handleCellClick(coord);
            });

            board.appendChild(cell);
            gameBoard[coord] = [];
        });
    }

    // Create direction arrows
    createDirectionArrows();

    // Create temples and jails
    createTemplesAndJails();

    // Create teleport icons
    createTeleportIcons();
}

/**
 * Creates direction arrow indicators on the board
 */
function createDirectionArrows() {
    const board = document.getElementById('game-board');
    if (!board) return;

    const arrowSVG = `<svg id="_Слой_2" data-name="Слой 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">
        <defs>
            <style>
                .cls-1, .cls-2 { fill: #809786; }
                .cls-2 { stroke-miterlimit: 10; stroke-width: 40px; }
                .cls-2, .cls-3 { stroke: #809786; }
                .cls-3 { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-width: 50px; }
            </style>
        </defs>
        <line class="cls-3" x1="540" y1="100" x2="540" y2="760"/>
        <path class="cls-2" d="M534.74,97.9l-143.42,238.02c-2.01,3.33.39,7.58,4.28,7.58h286.84c3.89,0,6.29-4.25,4.28-7.58l-143.42-238.02c-1.94-3.23-6.62-3.23-8.57,0Z"/>
        <circle class="cls-1" cx="540" cy="867.65" r="30"/>
    </svg>`;

    const arrows = [
        { coords: ['O12', 'O10', 'G15'], rotation: 0 },
        { coords: ['D15', 'F15', 'A7'], rotation: 90 },
        { coords: ['A4', 'A6', 'I1'], rotation: 180 },
        { coords: ['L1', 'J1', 'O9'], rotation: 270 }
    ];

    arrows.forEach(arrowGroup => {
        arrowGroup.coords.forEach(coord => {
            let cell = board.querySelector(`[data-coord="${coord}"]`);

            if (!cell) {
                cell = document.createElement('div');
                cell.style.position = 'absolute';
                cell.style.background = 'transparent';
                cell.style.border = 'none';
                cell.style.pointerEvents = 'none';
                cell.dataset.coord = coord;

                const pos = coordToPosition(coord);
                cell.style.left = pos.x + 'px';
                cell.style.top = pos.y + 'px';
                cell.style.width = 'calc(min(90vw, 600px) * 35 / 600)';
                cell.style.height = 'calc(min(90vw, 600px) * 35 / 600)';

                board.appendChild(cell);
            }

            if (cell) {
                const arrowElement = document.createElement('div');
                arrowElement.className = `direction-arrow arrow-${arrowGroup.rotation}`;
                arrowElement.innerHTML = arrowSVG;

                cell.appendChild(arrowElement);
            }
        });
    });
}

/**
 * Creates temple and jail icons with tooltips
 */
function createTemplesAndJails() {
    const board = document.getElementById('game-board');
    if (!board) return;

    const templeSVG = `<svg id="_Слой_2" data-name="Слой 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">
        <defs>
            <style>
                .cls-1 { fill: #809786; }
                .cls-2 { fill: none; stroke: #809786; stroke-linecap: round; stroke-linejoin: round; stroke-width: 50px; }
            </style>
        </defs>
        <path class="cls-1" d="M674.31,653.29v220.38h-264.56v-220.38h264.56M696.09,631.51h-308.12v263.93h308.12v-263.93h0Z"/>
        <path class="cls-1" d="M366.19,633.74v239.92h-150.58v-239.92h150.58M387.97,611.97h-194.13v283.48h194.13v-283.48h0Z"/>
        <g>
            <rect class="cls-1" x="217.57" y="561.25" width="145.7" height="43.45"/>
            <path class="cls-1" d="M356.01,568.51v28.94h-131.18v-28.94h131.18M370.53,553.99h-160.22v57.97h160.22v-57.97h0Z"/>
        </g>
        <path class="cls-1" d="M868.45,633.74v239.92h-150.58v-239.92h150.58M890.23,611.97h-194.13v283.48h194.13v-283.48h0Z"/>
        <g>
            <rect class="cls-1" x="719.82" y="561.25" width="145.7" height="43.45"/>
            <path class="cls-1" d="M858.26,568.51v28.94h-131.18v-28.94h131.18M872.78,553.99h-160.22v57.97h160.22v-57.97h0Z"/>
        </g>
        <path class="cls-1" d="M674.31,557.52v52.21h-265.29v-52.21h265.29M696.09,535.74h-308.84v95.77h308.84v-95.77h0Z"/>
        <path class="cls-1" d="M548.41,686.42c30.85,0,55.95,25.1,55.95,55.95v130.1h-124.66v-130.1c0-30.85,25.1-55.95,55.95-55.95h12.75M548.41,664.64h-12.75c-42.93,0-77.73,34.8-77.73,77.73v151.88h168.21v-151.88c0-42.93-34.8-77.73-77.73-77.73h0Z"/>
        <path class="cls-1" d="M558.8,276.96h0,0M542.59,288.22c12.17,10.26,29.93,25.57,51.17,44.36,35.81,31.68,63.94,57.77,71.65,66.47,1.24,1.4,11.99,15.19,6.65,67.1-1.24,12.09-3.12,23.63-4.97,33.29h-251.12c-1.75-8.27-3.45-18.07-4.52-28.54-3.35-32.83.95-58.79,12.12-73.08,15.32-19.61,42.17-46.14,75.6-74.69,17.52-14.97,32.65-26.88,43.42-34.92M544.76,243.75c-7.55,0-107.79,77.99-149.78,131.74-42.6,54.52-7,160.26-7,160.26h308.12s33.11-119.46-3.52-160.77c-21.4-24.14-141.58-128.98-147.55-131.18-.07-.03-.16-.05-.27-.05h0Z"/>
        <line class="cls-2" x1="542.67" y1="184.56" x2="542.67" y2="253.2"/>
        <line class="cls-2" x1="157.71" y1="894.25" x2="922.29" y2="894.25"/>
    </svg>`;

    const jailSVG = `<svg id="_Слой_2" data-name="Слой 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">
        <defs>
            <style>
                .cls-1 { stroke-width: 60px; }
                .cls-1, .cls-2 { fill: none; stroke: #809786; stroke-linecap: round; stroke-linejoin: round; }
                .cls-2 { stroke-width: 50px; }
            </style>
        </defs>
        <line class="cls-1" x1="320" y1="100" x2="320" y2="947.48"/>
        <line class="cls-1" x1="760" y1="116.26" x2="760" y2="963.74"/>
        <line class="cls-2" x1="374.62" y1="265.38" x2="265.38" y2="374.62"/>
        <line class="cls-2" x1="814.62" y1="705.38" x2="705.38" y2="814.62"/>
        <line class="cls-2" x1="814.62" y1="366.49" x2="705.38" y2="257.25"/>
        <line class="cls-2" x1="374.62" y1="806.49" x2="265.38" y2="697.25"/>
        <line class="cls-1" x1="971.87" y1="320" x2="124.39" y2="320"/>
        <line class="cls-1" x1="955.61" y1="760" x2="108.13" y2="760"/>
    </svg>`;

    const templeCoords = ['K6', 'J11', 'E10', 'F5'];
    const jailCoords = ['N6', 'J14', 'B10', 'F2'];

    // Create temples
    templeCoords.forEach(coord => {
        let cell = board.querySelector(`[data-coord="${coord}"]`);

        if (!cell) {
            cell = document.createElement('div');
            cell.style.position = 'absolute';
            cell.style.background = 'transparent';
            cell.style.border = 'none';
            cell.style.pointerEvents = 'none';
            cell.dataset.coord = coord;

            const pos = coordToPosition(coord);
            cell.style.left = pos.x + 'px';
            cell.style.top = pos.y + 'px';
            cell.style.width = 'calc(min(90vw, 600px) * 35 / 600)';
            cell.style.height = 'calc(min(90vw, 600px) * 35 / 600)';

            board.appendChild(cell);
        }

        if (cell) {
            const templeElement = document.createElement('div');
            templeElement.className = 'temple-icon';
            templeElement.innerHTML = templeSVG;
            templeElement.title = 'Здесь фишка защищена от сбивания. Только одна фишка одновременно. Фишка может покинуть Храм в любой свой ход. Мимо фишек, зашедших в Храм, можно пройти.';

            templeElement.addEventListener('mouseenter', function(e) {
                if (selectedPiece === null) {
                    showTooltip(e, 'Здесь фишка защищена от сбивания. Только одна фишка одновременно. Фишка может покинуть Храм в любой свой ход. Мимо фишек, зашедших в Храм, можно пройти.');
                }
            });

            templeElement.addEventListener('mouseleave', function() {
                hideTooltip();
            });

            cell.appendChild(templeElement);
        }
    });

    // Create jails
    jailCoords.forEach(coord => {
        let cell = board.querySelector(`[data-coord="${coord}"]`);

        if (!cell) {
            cell = document.createElement('div');
            cell.style.position = 'absolute';
            cell.style.background = 'transparent';
            cell.style.border = 'none';
            cell.style.pointerEvents = 'none';
            cell.dataset.coord = coord;

            const pos = coordToPosition(coord);
            cell.style.left = pos.x + 'px';
            cell.style.top = pos.y + 'px';
            cell.style.width = 'calc(min(90vw, 600px) * 35 / 600)';
            cell.style.height = 'calc(min(90vw, 600px) * 35 / 600)';

            board.appendChild(cell);
        }

        if (cell) {
            const jailElement = document.createElement('div');
            jailElement.className = 'jail-icon';
            jailElement.innerHTML = jailSVG;
            jailElement.title = 'Тюрьма: Попав сюда, вы «застряли». Чтобы выйти, нужно выбросить хотя бы одну 6 - это плата за выход, а вторая кость укажет, на сколько шагов вы двигаетесь. На этом поле может находиться только одна фишка одновременно. Фишка защищена от сбивания, мимо фишки в тюрьме можно пройти.';

            jailElement.addEventListener('mouseenter', function(e) {
                if (selectedPiece === null) {
                    showTooltip(e, 'Тюрьма: Попав сюда, вы «застряли». Чтобы выйти, нужно выбросить хотя бы одну 6 - это плата за выход, а вторая кость укажет, на сколько шагов вы двигаетесь. На этом поле может находиться только одна фишка одновременно. Фишка защищена от сбивания, мимо фишки в тюрьме можно пройти.');
                }
            });

            jailElement.addEventListener('mouseleave', function() {
                hideTooltip();
            });

            cell.appendChild(jailElement);
        }
    });
}

/**
 * Creates teleport icons for each player
 */
function createTeleportIcons() {
    const board = document.getElementById('game-board');
    if (!board) return;

    const teleportSVG = `<svg id="_Слой_2" data-name="Слой 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">
        <path class="teleport-path" d="M866.57,852.97c-244.78,120.03-517.09,49.7-623.37-119.8-70.66-112.68-71.2-274.38,16.19-398.05,80.05-113.28,230.86-190.36,380.5-162.31,24.28,4.55,195.35,36.62,238.83,181.63,30.83,102.84-16.59,215.55-105.25,274.38-103.07,68.4-267.23,67.53-340.02-27.05-53.8-69.91-58.76-192.41,16.19-251.19,61.05-47.88,177.25-55.16,214.54,3.86,25.09,39.72,10.64,103.46-36.43,154.58"/>
    </svg>`;

    const teleportConfig = [
        { coord: 'I7', color: '#ff4444' },
        { coord: 'I9', color: '#228B22' },
        { coord: 'G9', color: '#FFD700' },
        { coord: 'G7', color: '#8A2BE2' }
    ];

    teleportConfig.forEach(config => {
        let cell = board.querySelector(`[data-coord="${config.coord}"]`);
        if (!cell) {
            cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.coord = config.coord;

            const pos = coordToPosition(config.coord);
            cell.style.position = 'absolute';
            cell.style.left = pos.x + 'px';
            cell.style.top = pos.y + 'px';
            cell.style.width = '35px';
            cell.style.height = '35px';

            board.appendChild(cell);
        }

        const teleportElement = document.createElement('div');
        teleportElement.innerHTML = teleportSVG;
        const cellSize = window.innerWidth <= 768
            ? `calc(100vw / 15 * 0.8)`
            : `calc(min(90vw, 600px) * 35 / 600 * 0.8)`;

        teleportElement.style.cssText = `
            position: absolute;
            width: ${cellSize};
            height: ${cellSize};
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: auto;
            z-index: 5;
        `;

        const pathElement = teleportElement.querySelector('.teleport-path');
        if (pathElement) {
            pathElement.style.fill = 'none';
            pathElement.style.stroke = config.color;
            pathElement.style.strokeWidth = '50px';
            pathElement.style.strokeLinecap = 'round';
            pathElement.style.strokeLinejoin = 'round';
        }

        const tooltipText = 'Телепорт: Позволяет на следующем ходу переместиться в телепорт другого игрока: на 1 на кубике – следующий по часовой стрелке, на 3 - напротив, на 6 - следующий против часовой стрелки (ближний к дому). Доступно только из телепорта своего цвета.';
        teleportElement.title = tooltipText;

        teleportElement.addEventListener('mouseover', function(e) {
            if (selectedPiece === null) {
                showTooltip(e, tooltipText);
            }
        });
        teleportElement.addEventListener('mouseout', function() {
            hideTooltip();
        });

        cell.appendChild(teleportElement);
    });
}

/**
 * Creates player pieces on the board
 */
function createPieces() {
    const board = document.getElementById('game-board');
    const colors = ['player1', 'player2', 'player3', 'player4'];
    pieces = {};

    for (let player = 1; player <= playerCount; player++) {
        pieces[player] = [];
        const startCoords = START_ZONES[player];

        startCoords.forEach((coord, index) => {
            const piece = document.createElement('div');
            piece.className = `piece ${colors[player-1]}`;
            piece.dataset.player = player;
            piece.dataset.id = `p${player}_${index}`;

            const pos = coordToPosition(coord);
            piece.style.left = pos.x + 'px';
            piece.style.top = pos.y + 'px';
            piece.style.zIndex = '10';
            piece.style.position = 'absolute';

            // Touch events for mobile devices
            piece.addEventListener('touchstart', handleTouchStart, {passive: true});
            piece.addEventListener('touchmove', handleTouchMove, {passive: false});
            piece.addEventListener('touchend', handleTouchEnd, {passive: false});

            // Click handler for piece selection
            piece.addEventListener('click', function(e) {
                e.stopPropagation();
                handlePieceClick(piece);
            });

            // Add piece tooltip
            addPieceTooltip(piece);

            board.appendChild(piece);
            pieces[player].push({element: piece, position: coord});

            if (!gameBoard[coord]) {
                gameBoard[coord] = [];
            }
            gameBoard[coord].push(piece);
        });
    }
}

// ============================================================================
// DICE UI FUNCTIONS
// ============================================================================

/**
 * Creates player dice on the board
 */
function createPlayerDice() {
    const board = document.getElementById('game-board');
    if (!board) return;

    // Remove existing player dice
    document.querySelectorAll('.player-dice').forEach(dice => dice.remove());

    for (let player = 1; player <= 4; player++) {
        const area = DICE_AREAS[player];
        const areaPos = calculateDiceAreaPosition(area);

        if (!areaPos) continue;

        // Create two dice for each player
        for (let diceIndex = 0; diceIndex < 2; diceIndex++) {
            const dice = document.createElement('div');
            dice.className = 'player-dice inactive';
            dice.id = `player-dice-${player}-${diceIndex + 1}`;
            dice.dataset.player = player;
            dice.dataset.diceIndex = diceIndex;

            const face = document.createElement('div');
            face.className = 'dice-face';
            face.textContent = '?';
            dice.appendChild(face);

            const diceSize = Math.min(90 * window.innerWidth / 100, 600) * 37.5 / 600;
            const spacing = 8;
            const offsetX = diceIndex === 0 ? -diceSize/2 - spacing/2 : diceSize/2 + spacing/2;

            dice.style.left = (areaPos.centerX + offsetX) + 'px';
            dice.style.top = (areaPos.centerY - diceSize/2) + 'px';

            dice.addEventListener('click', () => handlePlayerDiceClick(player));

            board.appendChild(dice);
        }
    }
}

/**
 * Handler for player dice click
 */
function handlePlayerDiceClick(player) {
    if (player !== currentPlayer) {
        updateGameMessage('Не ваш ход!');
        return;
    }

    if (gamePhase !== 'determining-order' && gamePhase !== 'playing') {
        updateGameMessage('Бросок кубиков сейчас недоступен');
        return;
    }

    rollPlayerDice();
}

/**
 * Updates player dice states (active/inactive)
 */
function updatePlayerDiceStates() {
    // Log current dice state for active player
    if (currentPlayer >= 1 && currentPlayer <= 4) {
        const dice1 = lastDiceRoll[0];
        const dice2 = lastDiceRoll[1];
        const usedInfo = [];
        const availableInfo = [];

        if (diceUsed[0]) {
            usedInfo.push(`${dice1} (использован)`);
        } else {
            availableInfo.push(`${dice1}`);
        }

        if (diceUsed[1]) {
            usedInfo.push(`${dice2} (использован)`);
        } else {
            availableInfo.push(`${dice2}`);
        }

        const statusParts = [];
        if (availableInfo.length > 0) statusParts.push(`доступны: ${availableInfo.join(', ')}`);
        if (usedInfo.length > 0) statusParts.push(`использованы: ${usedInfo.join(', ')}`);

        if (statusParts.length > 0) {
            console.log(`⚡ СОСТОЯНИЕ: Игрок ${currentPlayer} - ${statusParts.join(', ')}`);
        }
    }

    for (let player = 1; player <= 4; player++) {
        const dice1 = document.getElementById(`player-dice-${player}-1`);
        const dice2 = document.getElementById(`player-dice-${player}-2`);

        if (dice1 && dice2) {
            const isActive = player === currentPlayer;
            const className = isActive ? 'player-dice active' : 'player-dice inactive';

            dice1.className = className;
            dice2.className = className;

            const values = playerDiceValues[player];
            updatePlayerDiceFace(dice1, values[0]);
            updatePlayerDiceFace(dice2, values[1]);
        }
    }
}

/**
 * Updates a single dice face with dots
 */
function updatePlayerDiceFace(diceElement, value) {
    const faceElement = diceElement.querySelector('.dice-face');
    if (value === 0) {
        faceElement.textContent = '?';
        faceElement.className = 'dice-face';
    } else {
        const faceData = createDiceFace(value);
        faceElement.className = 'dice-face ' + faceData.className;
        faceElement.innerHTML = faceData.html;
    }
}

/**
 * Creates dice face HTML with dots
 */
function createDiceFace(value) {
    const faceClasses = ['', 'one', 'two', 'three', 'four', 'five', 'six'];
    const dotCounts = [0, 1, 2, 3, 4, 5, 6];

    let html = '';
    for (let i = 0; i < dotCounts[value]; i++) {
        html += '<div class="dice-dot"></div>';
    }

    return {
        html: html,
        className: faceClasses[value]
    };
}

// ============================================================================
// EVENT HANDLERS - TOUCH
// ============================================================================

function handleTouchStart(e) {
    const piece = e.target;
    const piecePlayer = parseInt(piece.dataset.player);

    if (gamePhase === 'playing' && piecePlayer !== currentPlayer) {
        updateGameMessage(`Сейчас ход игрока: ${playerColors[currentPlayer-1]}`);
        return;
    }

    const startTime = Date.now();
    touchPiece = piece;

    const touch = e.touches[0];
    const rect = document.getElementById('game-board').getBoundingClientRect();
    touchStartPos = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        startTime: startTime
    };
}

function handleTouchMove(e) {
    if (!touchPiece || !touchStartPos) return;

    const touch = e.touches[0];
    const rect = document.getElementById('game-board').getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const deltaX = Math.abs(x - touchStartPos.x);
    const deltaY = Math.abs(y - touchStartPos.y);
    const isDrag = deltaX > 10 || deltaY > 10;

    if (isDrag) {
        e.preventDefault();
        touchPiece.classList.add('dragging');

        const coord = positionToCoord(x, y);

        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('highlight');
        });

        if (coord && (BOARD_CELLS.includes(coord) || Object.values(START_ZONES).flat().includes(coord))) {
            const cell = document.querySelector(`[data-coord="${coord}"]`);
            if (cell) cell.classList.add('highlight');
        }
    }
}

function handleTouchEnd(e) {
    if (!touchPiece || !touchStartPos) return;

    const touch = e.changedTouches[0];
    const rect = document.getElementById('game-board').getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const targetCoord = positionToCoord(x, y);

    const deltaX = Math.abs(x - touchStartPos.x);
    const deltaY = Math.abs(y - touchStartPos.y);
    const duration = Date.now() - touchStartPos.startTime;
    const wasDragging = touchPiece.classList.contains('dragging');

    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('highlight');
    });

    touchPiece.classList.remove('dragging');

    if (wasDragging && targetCoord) {
        e.preventDefault();
        performMove(touchPiece, targetCoord);
    } else if (duration < 300 && deltaX < 10 && deltaY < 10) {
        // Quick tap - let click event fire
    }

    touchPiece = null;
    touchStartPos = null;
}

// ============================================================================
// EVENT HANDLERS - CLICK
// ============================================================================

/**
 * Handles click on a piece
 */
function handlePieceClick(piece) {
    const piecePlayer = parseInt(piece.dataset.player);
    const pieceCoord = getCurrentPosition(piece);

    // Smart handling of clicks on opponent pieces
    if (gamePhase === 'playing' && piecePlayer !== currentPlayer) {
        if (selectedPiece) {
            performMove(selectedPiece, pieceCoord);
            clearMoveHints();
            updateSelectedPiece(null);
        } else {
            updateGameMessage(`Нельзя выделить чужую фишку. Сейчас ход игрока: ${playerColors[currentPlayer-1]}`);
        }
        return;
    }

    // Handle clicks on own pieces
    if (selectedPiece === piece) {
        updateSelectedPiece(null);
        updateGameMessage('Выделение фишки отменено');
    } else {
        updateSelectedPiece(piece);
        updateGameMessage('Фишка выделена. Теперь коснитесь поля для перемещения');
    }
}

/**
 * Handles click on a cell
 */
function handleCellClick(coord) {
    if (selectedPiece && gamePhase === 'playing') {
        performMove(selectedPiece, coord);
        clearMoveHints();
        updateSelectedPiece(null);
    } else if (!selectedPiece) {
        updateGameMessage('Сначала выберите фишку для перемещения');
    } else if (gamePhase !== 'playing') {
        updateGameMessage('Дождитесь окончания определения очередности');
    }
}

// ============================================================================
// PIECE SELECTION
// ============================================================================

/**
 * Selects a piece (visual only)
 */
function selectPiece(piece) {
    if (selectedPiece) {
        selectedPiece.classList.remove('selected');
    }

    selectedPiece = piece;
    if (piece) {
        piece.classList.add('selected');
    }
}

/**
 * Updates selected piece with move hints calculation
 */
function updateSelectedPiece(piece, syncToServer = true) {
    if (isUpdatingSelection) {
        return;
    }

    selectPiece(piece);

    if (piece) {
        cachedValidMoves = calculateAndCacheValidMoves(piece);
        showCachedMoveHints();
    } else {
        cachedValidMoves = [];
        clearMoveHints();
    }

    if (syncToServer && currentGameId) {
        autoSaveGame();
    }
}

// ============================================================================
// MOVE HINTS
// ============================================================================

/**
 * Shows move hints for a piece
 */
function showMoveHints(piece) {
    clearMoveHints();

    // Don't show hints during order determination
    if (diceLog.length > 0 && diceLog[0].isFirstMoveWinner) {
        return;
    }

    const dice1 = diceUsed[0] ? 0 : lastDiceRoll[0];
    const dice2 = diceUsed[1] ? 0 : lastDiceRoll[1];

    const piecePosition = getCurrentPosition(piece);
    const isInJail = JAIL_COORDS.includes(piecePosition);

    // Special logic for pieces in jail
    if (isInJail && dice1 !== 0 && dice2 !== 0) {
        const hasSix = dice1 === 6 || dice2 === 6;

        if (!hasSix) {
            return;
        }

        const exitDiceValue = dice1 === 6 ? dice2 : dice1;
        const allPossibleMoves = calculatePossibleMoves(piece);
        const jailExitMoves = allPossibleMoves.filter(move => move.steps === exitDiceValue);
        const validMoves = filterMovesWithObstacles(jailExitMoves, piece, exitDiceValue, exitDiceValue);

        validMoves.forEach(move => {
            showSingleMoveHint(move);
        });
        return;
    }

    // If no dice rolled, show all possible moves
    if (dice1 === 0 && dice2 === 0) {
        const possibleMoves = calculatePossibleMoves(piece);
        possibleMoves.forEach(move => {
            showSingleMoveHint(move);
        });
        return;
    }

    // Determine available moves based on unused dice
    const availableMoves = new Set();

    if (!diceUsed[0] && dice1 > 0) availableMoves.add(dice1);
    if (!diceUsed[1] && dice2 > 0) availableMoves.add(dice2);

    if (!diceUsed[0] && !diceUsed[1] && dice1 > 0 && dice2 > 0) {
        availableMoves.add(dice1 + dice2);
    }

    // Special check for pieces in START_ZONES: need 1 to exit
    const currentPiecePosition = getPiecePosition(piece);
    if (currentPiecePosition.type === 'start') {
        const hasOne = availableMoves.has(1);
        if (!hasOne) {
            return;
        }
    }

    const allPossibleMoves = calculatePossibleMoves(piece, 12, dice1, dice2);
    const diceFilteredMoves = allPossibleMoves.filter(move => availableMoves.has(move.steps));
    const validMoves = filterMovesWithObstacles(diceFilteredMoves, piece, dice1, dice2);
    const teleportMoves = calculateTeleportMoves(piece, dice1, dice2);
    const allMoves = [...validMoves, ...teleportMoves];

    allMoves.forEach(move => {
        showSingleMoveHint(move);
    });
}

/**
 * Shows a single move hint on the board
 */
function showSingleMoveHint(move) {
    const cell = document.querySelector(`[data-coord="${move.coord}"]`);
    if (cell) {
        const hint = document.createElement('div');
        hint.className = move.isTeleport ? 'move-hint teleport-hint' : 'move-hint';

        hint.textContent = move.isTeleport ? `Т${move.steps}` : move.steps;

        const isTeleporation = move.isTeleport;
        const backgroundColor = isTeleporation ? 'rgba(138, 43, 226, 0.9)' : 'rgba(255, 255, 255, 0.9)';
        const borderColor = isTeleporation ? '#8A2BE2' : '#007bff';
        const textColor = isTeleporation ? '#fff' : '#007bff';
        const boxShadow = isTeleporation ? '0 4px 8px rgba(138, 43, 226, 0.4)' : '0 2px 4px rgba(0,0,0,0.2)';

        const existingHints = cell.querySelectorAll('.move-hint');
        const offset = existingHints.length * 25;

        hint.style.cssText = `
            position: absolute;
            top: calc(50% + ${offset}px);
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${backgroundColor};
            border: 1.5px solid ${borderColor};
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            color: ${textColor};
            z-index: 1000;
            pointer-events: none;
            box-shadow: ${boxShadow};
        `;

        cell.appendChild(hint);
        cell.classList.add('possible-move');
    }
}

/**
 * Shows cached move hints
 */
function showCachedMoveHints() {
    clearMoveHints();

    cachedValidMoves.forEach(move => {
        showSingleMoveHint(move);
    });
}

/**
 * Clears all move hints from the board
 */
function clearMoveHints() {
    document.querySelectorAll('.move-hint').forEach(hint => hint.remove());
    document.querySelectorAll('.possible-move').forEach(cell => {
        cell.classList.remove('possible-move');
    });
}

// ============================================================================
// GAME MESSAGE & UI UPDATES
// ============================================================================

/**
 * Updates game message display
 */
function updateGameMessage(message) {
    gameMessages.push(message);

    if (gameMessages.length > 7) {
        gameMessages = gameMessages.slice(-7);
    }

    const displayMessage = [...gameMessages].reverse().join('\n\n───────────────\n\n');
    document.getElementById('game-message').textContent = displayMessage;
}

/**
 * Updates player name display
 */
function updatePlayerDisplay() {
    const playerName = playerColors[currentPlayer - 1];
    document.getElementById('player-name').textContent = playerName;
    document.getElementById('player-name').style.color = getPlayerColor(currentPlayer);
}

/**
 * Gets player color for UI display
 */
function getPlayerColor(player) {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcf7f', '#9775fa'];
    return colors[player - 1];
}

/**
 * Enables dice roll for current player
 */
function enableDiceRollForCurrentPlayer() {
    updateSelectedPiece(null);

    const rollBtn = document.getElementById('roll-dice-btn');
    const nextPlayerBtn = document.getElementById('next-player-btn');
    const randomMoveBtn = document.getElementById('random-move-btn');

    if (rollBtn) {
        rollBtn.disabled = false;
        rollBtn.style.display = 'block';
    }

    if (nextPlayerBtn) {
        nextPlayerBtn.disabled = false;
        nextPlayerBtn.textContent = 'Далее';
    }
    if (randomMoveBtn) {
        randomMoveBtn.disabled = false;
    }

    showPlayerDice(currentPlayer);
}

/**
 * Enables/disables piece movement
 */
function enablePieceMovement(enable) {
    const allPieces = document.querySelectorAll('.piece');
    allPieces.forEach(piece => {
        piece.style.pointerEvents = enable ? 'auto' : 'none';
        piece.style.opacity = enable ? '1' : '0.7';
    });
}

// ============================================================================
// TOOLTIPS
// ============================================================================

/**
 * Shows a tooltip at mouse position
 */
function showTooltip(event, text) {
    hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;

    document.body.appendChild(tooltip);

    const rect = event.target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.top - tooltipRect.height - 10;

    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top < 10) {
        top = rect.bottom + 10;
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';

    requestAnimationFrame(() => {
        tooltip.classList.add('show');
    });

    currentTooltip = tooltip;
}

/**
 * Hides current tooltip
 */
function hideTooltip() {
    if (currentTooltip) {
        currentTooltip.remove();
        currentTooltip = null;
    }
}

/**
 * Generates tooltip text for a piece
 */
function getPieceTooltipText(piece) {
    const player = parseInt(piece.dataset.player);
    const pieceId = piece.dataset.id;

    const pieceNumber = parseInt(pieceId.split('_')[1]) + 1;

    const colorNames = {
        1: 'Красная',
        2: 'Желтая',
        3: 'Зеленая',
        4: 'Фиолетовая'
    };

    return `${colorNames[player]} ${pieceNumber}`;
}

/**
 * Adds tooltip handlers to a piece
 */
function addPieceTooltip(piece) {
    piece.addEventListener('mouseenter', function(e) {
        const tooltipText = getPieceTooltipText(piece);
        showTooltip(e, tooltipText);
    });

    piece.addEventListener('mouseleave', function() {
        hideTooltip();
    });
}

// ============================================================================
// GAME ID UI
// ============================================================================

/**
 * Shows game ID in UI
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
 * Hides game ID from UI
 */
function hideGameId() {
    const container = document.getElementById('game-id-container');
    if (container) {
        container.classList.remove('visible');
    }
}

/**
 * Copies game ID to clipboard
 */
function copyGameId() {
    const input = document.getElementById('game-id-input');
    if (input && input.value) {
        copyToClipboard(input.value);

        const btn = document.getElementById('copy-game-id-btn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Скопировано';
        btn.style.background = '#4CAF50';

        const originalPlaceholder = input.placeholder;
        input.placeholder = 'ID скопирован!';
        input.style.background = 'rgba(76, 175, 80, 0.1)';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
            input.placeholder = originalPlaceholder;
            input.style.background = '';
        }, 2000);
    }
}

/**
 * Copies text to clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
}

// ============================================================================
// BOARD SCALING & RESIZE
// ============================================================================

/**
 * Handles window resize
 */
function handleResize() {
    if (document.getElementById('game-layout').style.display !== 'none') {
        updateBoardSize();
    }
}

/**
 * Updates board size on resize
 */
function updateBoardSize() {
    const allCells = document.querySelectorAll('.cell');
    allCells.forEach(cell => {
        const coord = cell.dataset.coord;
        const pos = coordToPosition(coord);
        cell.style.left = pos.x + 'px';
        cell.style.top = pos.y + 'px';
    });

    const allPieces = document.querySelectorAll('.piece');
    allPieces.forEach(piece => {
        const currentPos = getCurrentPosition(piece);
        if (currentPos) {
            const pos = coordToPosition(currentPos);
            piece.style.left = pos.x + 'px';
            piece.style.top = pos.y + 'px';
        }
    });
}

/**
 * Initializes event handlers for pinch zoom
 */
function initializeEventHandlers() {
    const board = document.getElementById('game-board');
    const container = board.parentElement;

    let initialDistance = 0;
    let initialScale = 1;
    let isGesturing = false;

    container.addEventListener('touchstart', function(e) {
        if (e.touches.length === 2) {
            e.preventDefault();
            isGesturing = true;
            initialDistance = getDistance(e.touches[0], e.touches[1]);
            initialScale = boardScale;
        }
    }, {passive: false});

    container.addEventListener('touchmove', function(e) {
        if (e.touches.length === 2 && isGesturing) {
            e.preventDefault();
            const currentDistance = getDistance(e.touches[0], e.touches[1]);
            const scale = (currentDistance / initialDistance) * initialScale;
            setBoardScale(scale);
        }
    }, {passive: false});

    container.addEventListener('touchend', function(e) {
        if (e.touches.length < 2) {
            isGesturing = false;
        }
    });

    container.addEventListener('wheel', function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setBoardScale(boardScale * delta);
        }
    }, {passive: false});
}

/**
 * Calculates distance between two touch points
 */
function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Sets board scale
 */
function setBoardScale(scale) {
    boardScale = Math.max(0.5, Math.min(3, scale));
    const board = document.getElementById('game-board');
    board.style.transform = `scale(${boardScale}) translate(${boardTranslateX}px, ${boardTranslateY}px)`;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets current position of a piece
 */
function getCurrentPosition(piece) {
    const rect = piece.getBoundingClientRect();
    const boardRect = document.getElementById('game-board').getBoundingClientRect();
    const x = rect.left - boardRect.left + 17;
    const y = rect.top - boardRect.top + 17;
    return positionToCoord(x, y);
}

/**
 * Moves a piece to target coordinate
 */
function movePiece(piece, targetCoord) {
    const currentPos = getCurrentPosition(piece);
    if (currentPos) {
        removePieceFromCell(piece, currentPos);
    }

    const pos = calculatePiecePosition(targetCoord);
    piece.style.left = pos.x + 'px';
    piece.style.top = pos.y + 'px';

    addPieceToCell(piece, targetCoord);

    const piecePlayer = parseInt(piece.dataset.player);
    if (pieces[piecePlayer]) {
        const pieceData = pieces[piecePlayer].find(p => p.element === piece);
        if (pieceData) {
            pieceData.position = targetCoord;
        }
    }

    // Track teleport history
    const pieceId = piece.dataset.id;
    const playerTeleport = TELEPORT_COORDS[piecePlayer];

    if (targetCoord === playerTeleport) {
        if (piecesTeleportHistory[pieceId] === undefined) {
            piecesTeleportHistory[pieceId] = currentTurnNumber;
        }
    } else if (piecesTeleportHistory[pieceId] !== undefined) {
        delete piecesTeleportHistory[pieceId];
    }
}

/**
 * Removes piece from a cell
 */
function removePieceFromCell(piece, coord) {
    if (gameBoard[coord]) {
        if (Array.isArray(gameBoard[coord])) {
            const index = gameBoard[coord].indexOf(piece);
            if (index > -1) {
                gameBoard[coord].splice(index, 1);
            }
        } else if (gameBoard[coord] === piece) {
            gameBoard[coord] = null;
        }
    }
}

/**
 * Adds piece to a cell
 */
function addPieceToCell(piece, coord) {
    const isWaitingZone = Object.values(WAITING_ZONES).flat().includes(coord);
    const isStartZone = Object.values(START_ZONES).flat().includes(coord);

    if (isWaitingZone || isStartZone) {
        if (!gameBoard[coord]) {
            gameBoard[coord] = [];
        }
        gameBoard[coord].push(piece);
    } else {
        gameBoard[coord] = piece;
    }
}
