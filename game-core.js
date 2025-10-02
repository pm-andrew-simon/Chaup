/**
 * CHAUPAR GAME CORE LOGIC MODULE
 *
 * This module contains the core game logic for the Chaupar board game, extracted from index.html.
 * It includes all game constants, state variables, and core functions necessary for game mechanics.
 *
 * Contents:
 * - Game Constants: BOARD_CELLS, PLAYER_PATHS, START_ZONES, WAITING_ZONES, etc.
 * - Global State Variables: gameBoard, currentPlayer, gamePhase, pieces, etc.
 * - Core Game Functions: startGame(), handleGamePlay(), nextPlayer(), performMove()
 * - Move Calculation: calculatePossibleMoves(), calculateTargetCoordinate(), filterMovesWithObstacles()
 * - Validation Functions: canMakeMoveFromTo(), getPiecePosition(), isValidMove(), checkNoValidMoves()
 *
 * This module can be used as a standalone game engine or imported into other modules.
 */

// ===========================
// GAME CONSTANTS
// ===========================

const BOARD_CELLS = [
    "G1", "H1", "I1",
    "F2", "G2", "H2", "I2",
    "G3", "H3", "I3",
    "G4", "H4", "I4",
    "F5", "G5", "H5", "I5",
    "G6", "H6", "I6", "K6", "N6",
    "A7", "B7", "C7", "D7", "E7", "F7", "G7", "I7", "J7", "K7", "L7", "M7", "N7", "O7",
    "A8", "B8", "C8", "D8", "E8", "F8", "J8", "K8", "L8", "M8", "N8", "O8",
    "A9", "B9", "C9", "D9", "E9", "F9", "G9", "I9", "J9", "K9", "L9", "M9", "N9", "O9",
    "B10", "E10", "G10", "H10", "I10",
    "G11", "H11", "I11", "J11",
    "G12", "H12", "I12",
    "G13", "H13", "I13",
    "G14", "H14", "I14", "J14",
    "G15", "H15", "I15"
];

const START_ZONES = {
    1: ["M1", "N1", "O1", "M2", "N2", "O2"],
    2: ["A14", "B14", "C14", "A15", "B15", "C15"],
    3: ["N13", "O13", "N14", "O14", "N15", "O15"],
    4: ["A1", "B1", "A2", "B2", "A3", "B3"]
};

const WAITING_ZONES = {
    1: ["K1", "K2", "K3", "K4"],
    2: ["E12", "E13", "E14", "E15"],
    3: ["L11", "M11", "N11", "O11"],
    4: ["A5", "B5", "C5", "D5"]
};

const ENTRY_CELLS = {
    1: 'I1',  // красный
    2: 'G15', // желтый
    3: 'O9',  // зеленый
    4: 'A7'   // фиолетовый
};

const TEMPLE_COORDS = ['K6', 'J11', 'E10', 'F5'];
const JAIL_COORDS = ['N6', 'J14', 'B10', 'F2'];

const TELEPORT_COORDS = {
    1: 'I7',  // Красный
    2: 'G9',  // Желтый
    3: 'I9',  // Зеленый
    4: 'G7'   // Фиолетовый
};

const TELEPORT_MAPPINGS = {
    'I7': { // Красный телепорт
        1: 'I9', // На 1 → следующий по часовой (Зеленый)
        3: 'G9', // На 3 → напротив (Желтый)
        6: 'G7'  // На 6 → против часовой (Фиолетовый)
    },
    'G9': { // Желтый телепорт
        1: 'G7', // На 1 → следующий по часовой (Фиолетовый)
        3: 'I7', // На 3 → напротив (Зеленый)
        6: 'I9'  // На 6 → против часовой (Красный)
    },
    'I9': { // Зеленый телепорт
        1: 'G9', // На 1 → следующий по часовой (Фиолетовый)
        3: 'G7', // На 3 → напротив (Красный)
        6: 'I7'  // На 6 → против часовой (Желтый)
    },
    'G7': { // Фиолетовый телепорт
        1: 'I7', // На 1 → следующий по часовой (Красный)
        3: 'I9', // На 3 → напротив (Желтый)
        6: 'G9'  // На 6 → против часовой (Зеленый)
    }
};

const PLAYER_PATHS = {
    1: [ // Красный: I1 → I7 → O7 → O9 → I9 → I15 → G15 → G9 → A9 → A7 → G7 → G1 → H1 → [дом H6-H1]
        'I1', 'I2', 'I3', 'I4', 'I5', 'I6', 'I7',
        'J7', 'K7', 'L7', 'M7', 'N7', 'O7',
        'O8', 'O9',
        'N9', 'M9', 'L9', 'K9', 'J9', 'I9',
        'I10', 'I11', 'I12', 'I13', 'I14', 'I15',
        'H15', 'G15',
        'G14', 'G13', 'G12', 'G11', 'G10', 'G9',
        'F9', 'E9', 'D9', 'C9', 'B9', 'A9',
        'A8', 'A7',
        'B7', 'C7', 'D7', 'E7', 'F7', 'G7',
        'G6', 'G5', 'G4', 'G3', 'G2', 'G1',
        'H1',
        // Дом (финишная прямая)
        'H2', 'H3', 'H4', 'H5', 'H6'
    ],
    2: [ // Желтый: G15 → G9 → A9 → A7 → G7 → G1 → I1 → I7 → O7 → O9 → I9 → I15 → H15 → [дом H10-H15]
        'G15', 'G14', 'G13', 'G12', 'G11', 'G10', 'G9',
        'F9', 'E9', 'D9', 'C9', 'B9', 'A9',
        'A8', 'A7',
        'B7', 'C7', 'D7', 'E7', 'F7', 'G7',
        'G6', 'G5', 'G4', 'G3', 'G2', 'G1',
        'H1', 'I1',
        'I2', 'I3', 'I4', 'I5', 'I6', 'I7',
        'J7', 'K7', 'L7', 'M7', 'N7', 'O7',
        'O8', 'O9',
        'N9', 'M9', 'L9', 'K9', 'J9', 'I9',
        'I10', 'I11', 'I12', 'I13', 'I14', 'I15',
        'H15',
        // Дом (финишная прямая)
        'H14', 'H13', 'H12', 'H11', 'H10'
    ],
    3: [ // Зеленый: O9 → I9 → I15 → G15 → G9 → A9 → A7 → G7 → G1 → I1 → I7 → O7 → O8 → [дом J8-O8]
        'O9', 'N9', 'M9', 'L9', 'K9', 'J9', 'I9',
        'I10', 'I11', 'I12', 'I13', 'I14', 'I15',
        'H15', 'G15',
        'G14', 'G13', 'G12', 'G11', 'G10', 'G9',
        'F9', 'E9', 'D9', 'C9', 'B9', 'A9',
        'A8', 'A7',
        'B7', 'C7', 'D7', 'E7', 'F7', 'G7',
        'G6', 'G5', 'G4', 'G3', 'G2', 'G1',
        'H1', 'I1',
        'I2', 'I3', 'I4', 'I5', 'I6', 'I7',
        'J7', 'K7', 'L7', 'M7', 'N7', 'O7',
        'O8',
        // Дом (финишная прямая)
        'N8', 'M8', 'L8', 'K8', 'J8'
    ],
    4: [ // Фиолетовый: A7 → G7 → G1 → I1 → I7 → O7 → O9 → I9 → I15 → G15 → G9 → A9 → A8 → [дом G8-A8]
        'A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7',
        'G6', 'G5', 'G4', 'G3', 'G2', 'G1',
        'H1', 'I1',
        'I2', 'I3', 'I4', 'I5', 'I6', 'I7',
        'J7', 'K7', 'L7', 'M7', 'N7', 'O7',
        'O8', 'O9',
        'N9', 'M9', 'L9', 'K9', 'J9', 'I9',
        'I10', 'I11', 'I12', 'I13', 'I14', 'I15',
        'H15', 'G15',
        'G14', 'G13', 'G12', 'G11', 'G10', 'G9',
        'F9', 'E9', 'D9', 'C9', 'B9', 'A9',
        'A8',
        // Дом (финишная прямая)
        'B8', 'C8', 'D8', 'E8', 'F8', 'G8'
    ]
};

const SPECIAL_MOVES = {
    'K7': 'K6',
    'N7': 'N6',
    'I11': 'J11',
    'I14': 'J14',
    'E9': 'E10',
    'B9': 'B10',
    'G5': 'F5',
    'G2': 'F2'
};

const MOVE_CALCULATION_OVERRIDES = {
    'F5': 'G5',
    'F2': 'G2',
    'K6': 'K7',
    'N6': 'N7',
    'J11': 'I11',
    'J14': 'I14',
    'E10': 'E9',
    'B10': 'B9'
};

// ===========================
// GLOBAL STATE VARIABLES
// ===========================

let gameBoard = {};
let playerCount = 2;
let pieces = {};
let currentPlayer = 1;
let gamePhase = 'setup'; // setup, determining-order, playing
let rollCount = 0;
let maxRolls = 3;
let lastDiceRoll = [0, 0];
let diceUsed = [false, false]; // Отслеживание использованных кубиков [dice1, dice2]
let consecutiveDoubles = 0; // Счетчик последовательных дублей для текущего игрока
let isStartZoneComboMove = false; // Флаг для комбо-хода из стартовой зоны
let piecesTeleportHistory = {}; // Хранит номер хода, когда фишка попала в телепорт
let currentTurnNumber = 0; // Счетчик ходов игры

let playersOrder = [];
let gameMessages = []; // История игровых сообщений (максимум 2)
let skippedTurns = []; // История пропущенных ходов {player, reason, timestamp}
let playerDiceValues = {1: [0, 0], 2: [0, 0], 3: [0, 0], 4: [0, 0]};
let playerColors = ['Красный', 'Желтый', 'Зеленый', 'Фиолетовый'];
let diceLog = []; // Журнал всех бросков (максимум 10)
let orderResults = []; // Результаты определения очередности
let playersToRoll = []; // Игроки, которые должны бросать кубики
let firstMoveWinner = null; // Игрок, который ходит первым

let boardScale = 1;
let boardTranslateX = 0;
let boardTranslateY = 0;
let selectedPiece = null;
let cachedValidMoves = []; // Кеш возможных ходов для выделенной фишки
let pieceCombinationsTable = []; // Таблица комбинаций координат фишек
let validMovesTable = []; // Глобальная таблица с лучшими доступными ходами
let expectedMovesCount = 0; // Сколько ходов ожидается (1 или 2)
let performedMovesCount = 0; // Сколько ходов уже сделано

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Проверяет, является ли комбинация кубиков дублем (1:1 или 6:6)
 */
function isDouble(dice1, dice2) {
    return (dice1 === dice2) && (dice1 === 1 || dice1 === 6);
}

/**
 * Получает текущую позицию фишки
 */
function getCurrentPosition(piece) {
    const coord = piece.dataset.position;
    return coord;
}

/**
 * Определяет игрока по координатам зоны ожидания
 */
function getPlayerForWaitingZone(coord) {
    for (let player in WAITING_ZONES) {
        if (WAITING_ZONES[player].includes(coord)) {
            return parseInt(player);
        }
    }
    return null;
}

/**
 * Определяет игрока по координатам стартовой зоны
 */
function getPlayerForStartZone(coord) {
    for (let player in START_ZONES) {
        if (START_ZONES[player].includes(coord)) {
            return parseInt(player);
        }
    }
    return null;
}

/**
 * Находит свободную позицию в стартовой зоне игрока
 */
function findFreeStartPosition(player) {
    const startCoords = START_ZONES[player];
    for (let coord of startCoords) {
        const piecesAtCoord = gameBoard[coord] || [];
        if (piecesAtCoord.length === 0) {
            return coord;
        }
    }
    return null;
}

/**
 * Находит фишку игрока на указанной координате
 */
function findPieceAtCoord(coord, playerNum) {
    const piecesAtCoord = gameBoard[coord];
    if (!piecesAtCoord || piecesAtCoord.length === 0) {
        return null;
    }

    for (let piece of piecesAtCoord) {
        const piecePlayer = parseInt(piece.dataset.player);
        if (piecePlayer === playerNum) {
            return piece;
        }
    }

    return null;
}

/**
 * Проверяет, находится ли координата в специальной защищенной зоне (храм или тюрьма)
 */
function isInSpecialZone(coord) {
    return TEMPLE_COORDS.includes(coord) || JAIL_COORDS.includes(coord);
}

/**
 * Получает позицию фишки (стартовая зона, зона ожидания или игровое поле)
 */
function getPiecePosition(piece) {
    const currentCoord = getCurrentPosition(piece);
    const playerNum = parseInt(piece.dataset.player);

    if (START_ZONES[playerNum].includes(currentCoord)) {
        return { type: 'start', coord: currentCoord };
    } else if (WAITING_ZONES[playerNum].includes(currentCoord)) {
        return { type: 'waiting', coord: currentCoord };
    } else {
        return { type: 'board', coord: currentCoord };
    }
}

/**
 * Получает позицию фишки на пути игрока (индекс в PLAYER_PATHS)
 */
function getPieceProgressPosition(coord, playerNum) {
    const playerPath = PLAYER_PATHS[playerNum];

    // Проверяем переопределения (reverse mapping для корректного поиска)
    let searchCoord = coord;
    if (MOVE_CALCULATION_OVERRIDES[coord]) {
        searchCoord = MOVE_CALCULATION_OVERRIDES[coord];
    }

    const position = playerPath.indexOf(searchCoord);
    return position;
}

// ===========================
// BOARD MANAGEMENT FUNCTIONS
// ===========================

/**
 * Удаляет фишку из клетки в gameBoard
 */
function removePieceFromCell(piece, coord) {
    if (gameBoard[coord]) {
        const index = gameBoard[coord].indexOf(piece);
        if (index > -1) {
            gameBoard[coord].splice(index, 1);
            if (gameBoard[coord].length === 0) {
                delete gameBoard[coord];
            }
        }
    }
}

/**
 * Добавляет фишку в клетку в gameBoard
 */
function addPieceToCell(piece, coord) {
    if (!gameBoard[coord]) {
        gameBoard[coord] = [];
    }
    gameBoard[coord].push(piece);
}

/**
 * Создает копию gameBoard для симуляции ходов
 */
function cloneGameBoard() {
    const clonedBoard = {};
    for (let coord in gameBoard) {
        if (gameBoard.hasOwnProperty(coord)) {
            clonedBoard[coord] = [...gameBoard[coord]];
        }
    }
    return clonedBoard;
}

/**
 * Симулирует перемещение фишки из одной клетки в другую
 */
function simulateMove(fromCoord, toCoord, playerNum) {
    const backupBoard = cloneGameBoard();

    const piece = findPieceAtCoord(fromCoord, playerNum);
    if (!piece) {
        return backupBoard;
    }

    removePieceFromCell(piece, fromCoord);

    const piecesAtTarget = gameBoard[toCoord] || [];
    for (let existingPiece of piecesAtTarget) {
        const existingPlayer = parseInt(existingPiece.dataset.player);
        if (existingPlayer !== playerNum) {
            const startCoord = findFreeStartPosition(existingPlayer);
            if (startCoord) {
                removePieceFromCell(existingPiece, toCoord);
                addPieceToCell(existingPiece, startCoord);
            }
        }
    }

    addPieceToCell(piece, toCoord);

    return backupBoard;
}

/**
 * Симулирует телепортацию фишки
 */
function simulateTeleportMove(fromCoord, toCoord, playerNum) {
    const backupBoard = cloneGameBoard();

    const piece = findPieceAtCoord(fromCoord, playerNum);
    if (!piece) {
        return backupBoard;
    }

    removePieceFromCell(piece, fromCoord);

    const piecesAtTarget = gameBoard[toCoord] || [];
    for (let existingPiece of piecesAtTarget) {
        const existingPlayer = parseInt(existingPiece.dataset.player);
        if (existingPlayer !== playerNum) {
            const startCoord = findFreeStartPosition(existingPlayer);
            if (startCoord) {
                removePieceFromCell(existingPiece, toCoord);
                addPieceToCell(existingPiece, startCoord);
            }
        }
    }

    addPieceToCell(piece, toCoord);

    return backupBoard;
}

/**
 * Восстанавливает gameBoard из резервной копии
 */
function restoreGameBoard(backupBoard) {
    gameBoard = {};
    for (let coord in backupBoard) {
        if (backupBoard.hasOwnProperty(coord)) {
            gameBoard[coord] = [...backupBoard[coord]];
        }
    }
}

// ===========================
// MOVE CALCULATION FUNCTIONS
// ===========================

/**
 * Вычисляет целевую координату после перемещения на заданное количество шагов
 */
function calculateTargetCoordinate(currentCoord, steps, playerNum) {
    const playerPath = PLAYER_PATHS[playerNum];

    let searchCoord = currentCoord;
    if (MOVE_CALCULATION_OVERRIDES[currentCoord]) {
        searchCoord = MOVE_CALCULATION_OVERRIDES[currentCoord];
    }

    const currentIndex = playerPath.indexOf(searchCoord);

    if (currentIndex === -1) {
        return null;
    }

    let targetIndex = currentIndex + steps;

    if (targetIndex >= playerPath.length) {
        return null;
    }

    let targetCoord = playerPath[targetIndex];

    if (SPECIAL_MOVES[targetCoord]) {
        targetCoord = SPECIAL_MOVES[targetCoord];
    }

    return targetCoord;
}

/**
 * Рассчитывает последовательные ходы из тюрьмы
 * Используется для определения возможных комбинаций выхода из тюрьмы с двумя кубиками
 */
function calculateJailSequentialMoves(startCoord, dice1, dice2, playerNum) {
    const playerPath = PLAYER_PATHS[playerNum];
    let availableMoves = [];

    // Проверяем наличие 6 для выхода из тюрьмы
    if (dice1 !== 6 && dice2 !== 6) {
        return availableMoves;
    }

    // Определяем, какой кубик используется для выхода, а какой для движения
    let exitDice, moveDice;
    if (dice1 === 6 && dice2 === 6) {
        // Оба кубика 6 - используем любой для выхода
        exitDice = dice1;
        moveDice = dice2;
    } else if (dice1 === 6) {
        exitDice = dice1;
        moveDice = dice2;
    } else {
        exitDice = dice2;
        moveDice = dice1;
    }

    // Выходим из тюрьмы на entry cell
    const entryCell = ENTRY_CELLS[playerNum];
    const jailExitMove = {
        coord: entryCell,
        steps: exitDice,
        usedDice: [exitDice],
        formula: `jail → entry (${exitDice})`,
        priority: 6
    };

    // Если второй кубик тоже 6 и дубль, добавляем только выход
    if (dice1 === 6 && dice2 === 6 && isDouble(dice1, dice2)) {
        availableMoves.push(jailExitMove);
        return availableMoves;
    }

    // Рассчитываем второй ход от entry cell
    const secondTarget = calculateTargetCoordinate(entryCell, moveDice, playerNum);

    if (secondTarget) {
        const comboMove = {
            coord: secondTarget,
            steps: exitDice + moveDice,
            usedDice: [exitDice, moveDice],
            isCombo: true,
            intermediateCoord: entryCell,
            formula: `jail → ${entryCell} (${exitDice}) → ${secondTarget} (${moveDice})`,
            priority: 7 // Приоритет для комбо-хода из тюрьмы
        };
        availableMoves.push(comboMove);
    } else {
        // Если комбо невозможен, добавляем только выход
        availableMoves.push(jailExitMove);
    }

    return availableMoves;
}

/**
 * Рассчитывает последовательные ходы (использование обоих кубиков поочередно)
 */
function calculateSequentialMoves(startCoord, dice1, dice2, playerNum) {
    let moves = [];

    // Ход A: dice1 затем dice2
    const targetA1 = calculateTargetCoordinate(startCoord, dice1, playerNum);
    if (targetA1) {
        const targetA2 = calculateTargetCoordinate(targetA1, dice2, playerNum);
        if (targetA2) {
            moves.push({
                coord: targetA2,
                steps: dice1 + dice2,
                usedDice: [dice1, dice2],
                isCombo: true,
                intermediateCoord: targetA1,
                sequence: [dice1, dice2],
                formula: `${startCoord} → ${targetA1} (${dice1}) → ${targetA2} (${dice2})`
            });
        }
    }

    // Ход B: dice2 затем dice1 (если кубики разные)
    if (dice1 !== dice2) {
        const targetB1 = calculateTargetCoordinate(startCoord, dice2, playerNum);
        if (targetB1) {
            const targetB2 = calculateTargetCoordinate(targetB1, dice1, playerNum);
            if (targetB2) {
                // Проверяем, что этот ход отличается от хода A
                const existingMove = moves.find(m => m.coord === targetB2);
                if (!existingMove) {
                    moves.push({
                        coord: targetB2,
                        steps: dice2 + dice1,
                        usedDice: [dice2, dice1],
                        isCombo: true,
                        intermediateCoord: targetB1,
                        sequence: [dice2, dice1],
                        formula: `${startCoord} → ${targetB1} (${dice2}) → ${targetB2} (${dice1})`
                    });
                }
            }
        }
    }

    return moves;
}

/**
 * Проверяет, можно ли переместиться из одной клетки в другую на игровом поле
 */
function canMakeMoveFromToGameBoard(fromCoord, toCoord, steps, playerNum, dice1, dice2) {
    const playerPath = PLAYER_PATHS[playerNum];

    let searchFromCoord = fromCoord;
    if (MOVE_CALCULATION_OVERRIDES[fromCoord]) {
        searchFromCoord = MOVE_CALCULATION_OVERRIDES[fromCoord];
    }

    let searchToCoord = toCoord;
    if (MOVE_CALCULATION_OVERRIDES[toCoord]) {
        searchToCoord = MOVE_CALCULATION_OVERRIDES[toCoord];
    }

    const fromIndex = playerPath.indexOf(searchFromCoord);
    const toIndex = playerPath.indexOf(searchToCoord);

    if (fromIndex === -1 || toIndex === -1) {
        return false;
    }

    const actualSteps = toIndex - fromIndex;

    // Проверяем прямой ход
    if (actualSteps === dice1 || actualSteps === dice2) {
        return true;
    }

    // Проверяем комбо-ход
    if (actualSteps === dice1 + dice2) {
        return true;
    }

    return false;
}

/**
 * Более общая проверка возможности хода (включая выход из зон)
 */
function canMakeMoveFromTo(fromCoord, toCoord, steps, playerNum) {
    // Выход из стартовой зоны
    if (START_ZONES[playerNum].includes(fromCoord)) {
        if (steps === 1 && toCoord === ENTRY_CELLS[playerNum]) {
            return true;
        }
        return false;
    }

    // Выход из зоны ожидания
    if (WAITING_ZONES[playerNum].includes(fromCoord)) {
        if (steps === 1 && toCoord === ENTRY_CELLS[playerNum]) {
            return true;
        }
        return false;
    }

    // Движение по игровому полю
    return canMakeMoveFromToGameBoard(fromCoord, toCoord, steps, playerNum, 0, 0);
}

/**
 * Вычисляет возможные ходы для фишки
 */
function calculatePossibleMoves(piece, steps = 12, dice1 = 0, dice2 = 0) {
    const playerNum = parseInt(piece.dataset.player);
    const currentPosition = getCurrentPosition(piece);

    let possibleMoves = [];

    // Проверяем, находится ли фишка в стартовой зоне
    if (START_ZONES[playerNum].includes(currentPosition)) {
        // Выход из стартовой зоны требует значения 1 на кубике
        if (dice1 === 1 || dice2 === 1) {
            const entryCell = ENTRY_CELLS[playerNum];
            possibleMoves.push({
                coord: entryCell,
                steps: 1,
                usedDice: dice1 === 1 ? [dice1] : [dice2],
                formula: `start → entry (1)`,
                priority: 1
            });

            // Если есть второй кубик (не 1), пытаемся сделать комбо-ход
            const otherDice = dice1 === 1 ? dice2 : dice1;
            if (otherDice !== 1 && otherDice > 0) {
                const comboTarget = calculateTargetCoordinate(entryCell, otherDice, playerNum);
                if (comboTarget) {
                    possibleMoves.push({
                        coord: comboTarget,
                        steps: 1 + otherDice,
                        usedDice: [1, otherDice],
                        isCombo: true,
                        intermediateCoord: entryCell,
                        formula: `start → ${entryCell} (1) → ${comboTarget} (${otherDice})`,
                        priority: 2
                    });
                }
            }
        }
        return possibleMoves;
    }

    // Проверяем, находится ли фишка в зоне ожидания
    if (WAITING_ZONES[playerNum].includes(currentPosition)) {
        // Выход из зоны ожидания требует значения 1 на кубике
        if (dice1 === 1 || dice2 === 1) {
            const entryCell = ENTRY_CELLS[playerNum];
            possibleMoves.push({
                coord: entryCell,
                steps: 1,
                usedDice: dice1 === 1 ? [dice1] : [dice2],
                formula: `waiting → entry (1)`,
                priority: 3
            });
        }
        return possibleMoves;
    }

    // Проверяем, находится ли фишка в тюрьме
    if (JAIL_COORDS.includes(currentPosition)) {
        // Выход из тюрьмы требует значения 6 на кубике
        if (dice1 === 6 || dice2 === 6) {
            const jailMoves = calculateJailSequentialMoves(currentPosition, dice1, dice2, playerNum);
            possibleMoves = possibleMoves.concat(jailMoves);
        }
        return possibleMoves;
    }

    // Фишка находится на игровом поле - рассчитываем обычные ходы
    if (dice1 > 0 && dice2 > 0) {
        // Есть два кубика - рассчитываем одиночные и комбо ходы
        const target1 = calculateTargetCoordinate(currentPosition, dice1, playerNum);
        if (target1) {
            possibleMoves.push({
                coord: target1,
                steps: dice1,
                usedDice: [dice1],
                formula: `${currentPosition} → ${target1} (${dice1})`,
                priority: 4
            });
        }

        const target2 = calculateTargetCoordinate(currentPosition, dice2, playerNum);
        if (target2 && target2 !== target1) {
            possibleMoves.push({
                coord: target2,
                steps: dice2,
                usedDice: [dice2],
                formula: `${currentPosition} → ${target2} (${dice2})`,
                priority: 4
            });
        }

        // Комбо-ходы
        const comboMoves = calculateSequentialMoves(currentPosition, dice1, dice2, playerNum);
        possibleMoves = possibleMoves.concat(comboMoves);
    } else {
        // Показываем все возможные ходы (режим подсказок)
        for (let step = 1; step <= steps; step++) {
            const target = calculateTargetCoordinate(currentPosition, step, playerNum);
            if (target) {
                possibleMoves.push({
                    coord: target,
                    steps: step,
                    formula: `${currentPosition} → ${target} (${step})`
                });
            }
        }
    }

    return possibleMoves;
}

/**
 * Вычисляет одиночный ход телепортации
 */
function calculateSingleTeleportMove(teleportCoord, diceValue, playerNum) {
    if (!TELEPORT_MAPPINGS[teleportCoord]) {
        return null;
    }

    const targetCoord = TELEPORT_MAPPINGS[teleportCoord][diceValue];

    if (!targetCoord) {
        return null;
    }

    return {
        coord: targetCoord,
        steps: diceValue,
        usedDice: [diceValue],
        isTeleport: true,
        formula: `teleport ${teleportCoord} → ${targetCoord} (${diceValue})`,
        priority: 8
    };
}

/**
 * Вычисляет возможные телепортационные ходы
 */
function calculateTeleportMoves(piece, dice1, dice2) {
    const playerNum = parseInt(piece.dataset.player);
    const currentPosition = getCurrentPosition(piece);
    const playerTeleport = TELEPORT_COORDS[playerNum];

    let teleportMoves = [];

    // Проверяем, находится ли фишка на своем телепорте
    if (currentPosition !== playerTeleport) {
        return teleportMoves;
    }

    // Проверяем, использовался ли телепорт в этом ходу
    const pieceId = piece.dataset.id;
    if (piecesTeleportHistory[pieceId] === currentTurnNumber) {
        return teleportMoves;
    }

    // Рассчитываем телепортационные ходы для каждого кубика
    if (dice1 === 1 || dice1 === 3 || dice1 === 6) {
        const move1 = calculateSingleTeleportMove(currentPosition, dice1, playerNum);
        if (move1) {
            teleportMoves.push(move1);
        }
    }

    if (dice2 === 1 || dice2 === 3 || dice2 === 6) {
        const move2 = calculateSingleTeleportMove(currentPosition, dice2, playerNum);
        if (move2 && move2.coord !== teleportMoves[0]?.coord) {
            teleportMoves.push(move2);
        }
    }

    return teleportMoves;
}

/**
 * Фильтрует возможные ходы, проверяя наличие препятствий
 * КРИТИЧЕСКИ ВАЖНАЯ ФУНКЦИЯ - должна использоваться везде, где вычисляются валидные ходы
 */
function filterMovesWithObstacles(possibleMoves, movingPiece, dice1, dice2) {
    const playerNum = parseInt(movingPiece.dataset.player);
    const currentPosition = getCurrentPosition(movingPiece);

    let validMoves = [];

    for (let move of possibleMoves) {
        const targetCoord = move.coord;
        let canMove = true;

        // Проверяем телепортационные ходы отдельно
        if (move.isTeleport) {
            const piecesAtTarget = gameBoard[targetCoord] || [];
            const ownPiecesAtTarget = piecesAtTarget.filter(p => parseInt(p.dataset.player) === playerNum);

            // Телепорт возможен, если на целевой клетке нет своих фишек или это защищенная зона
            if (ownPiecesAtTarget.length === 0 || isInSpecialZone(targetCoord)) {
                validMoves.push(move);
            }
            continue;
        }

        // Проверка комбо-ходов
        if (move.isCombo && move.intermediateCoord) {
            // Симулируем первый ход
            const backupBoard = simulateMove(currentPosition, move.intermediateCoord, playerNum);

            // Проверяем блокировку промежуточной позиции
            const piecesAtIntermediate = gameBoard[move.intermediateCoord] || [];
            const ownPiecesAtIntermediate = piecesAtIntermediate.filter(p => parseInt(p.dataset.player) === playerNum && p !== movingPiece);

            if (ownPiecesAtIntermediate.length > 0 && !isInSpecialZone(move.intermediateCoord)) {
                canMove = false;
            }

            // Проверяем блокировку конечной позиции
            if (canMove) {
                const piecesAtTarget = gameBoard[targetCoord] || [];
                const ownPiecesAtTarget = piecesAtTarget.filter(p => parseInt(p.dataset.player) === playerNum && p !== movingPiece);

                if (ownPiecesAtTarget.length > 0 && !isInSpecialZone(targetCoord)) {
                    canMove = false;
                }
            }

            // Восстанавливаем состояние доски
            restoreGameBoard(backupBoard);
        } else {
            // Одиночный ход - проверяем только конечную позицию
            const piecesAtTarget = gameBoard[targetCoord] || [];
            const ownPiecesAtTarget = piecesAtTarget.filter(p => parseInt(p.dataset.player) === playerNum && p !== movingPiece);

            if (ownPiecesAtTarget.length > 0 && !isInSpecialZone(targetCoord)) {
                canMove = false;
            }
        }

        if (canMove) {
            validMoves.push(move);
        }
    }

    return validMoves;
}

/**
 * Проверяет, есть ли у текущего игрока возможные ходы с учетом препятствий
 */
function checkNoValidMoves(dice1, dice2) {
    const currentPlayerPieces = pieces[currentPlayer];

    if (!currentPlayerPieces || currentPlayerPieces.length === 0) {
        return true;
    }

    for (let pieceInfo of currentPlayerPieces) {
        const piece = pieceInfo.element;
        const possibleMoves = calculatePossibleMoves(piece, 12, dice1, dice2);
        const validMoves = filterMovesWithObstacles(possibleMoves, piece, dice1, dice2);

        if (validMoves.length > 0) {
            return false;
        }
    }

    return true;
}

/**
 * Логирует все возможные комбинации ходов для текущего игрока
 * Создает таблицу validMovesTable с лучшими доступными ходами
 */
function logPieceCombinations() {
    const currentPlayerPieces = Array.from(document.querySelectorAll(`.piece.player${currentPlayer}`));

    if (currentPlayerPieces.length === 0) {
        return;
    }

    validMovesTable = [];
    pieceCombinationsTable = [];

    // Собираем все координаты фишек
    const pieceCoords = currentPlayerPieces.map(p => ({
        piece: p,
        coord: getCurrentPosition(p)
    }));

    // Генерируем все комбинации пар фишек
    for (let i = 0; i < currentPlayerPieces.length; i++) {
        for (let j = 0; j < currentPlayerPieces.length; j++) {
            if (i === j) continue;

            const piece1 = currentPlayerPieces[i];
            const piece2 = currentPlayerPieces[j];

            const coord1 = getCurrentPosition(piece1);
            const coord2 = getCurrentPosition(piece2);

            const possibleMoves1 = calculatePossibleMoves(piece1, 12, lastDiceRoll[0], lastDiceRoll[1]);
            const possibleMoves2 = calculatePossibleMoves(piece2, 12, lastDiceRoll[0], lastDiceRoll[1]);

            const validMoves1 = filterMovesWithObstacles(possibleMoves1, piece1, lastDiceRoll[0], lastDiceRoll[1]);
            const validMoves2 = filterMovesWithObstacles(possibleMoves2, piece2, lastDiceRoll[0], lastDiceRoll[1]);

            // Анализируем каждую комбинацию ходов
            for (let move1 of validMoves1) {
                for (let move2 of validMoves2) {
                    // Проверяем, что ходы используют разные кубики
                    const dice1Used = move1.usedDice || [];
                    const dice2Used = move2.usedDice || [];

                    const totalDice = [...dice1Used, ...dice2Used];
                    if (totalDice.length > 2) continue; // Превышен лимит кубиков

                    // Проверяем уникальность использования кубиков
                    const uniqueDice = [...new Set(totalDice)];
                    if (uniqueDice.length !== totalDice.length && totalDice.length === 2) {
                        // Оба кубика одинаковые - это валидно только для дубля
                        if (!isDouble(lastDiceRoll[0], lastDiceRoll[1])) {
                            continue;
                        }
                    }

                    validMovesTable.push({
                        piece1: piece1,
                        coord1: coord1,
                        move1: move1,
                        piece2: piece2,
                        coord2: coord2,
                        move2: move2,
                        priority: (move1.priority || 0) + (move2.priority || 0)
                    });
                }
            }
        }
    }

    // Сортируем по приоритету
    validMovesTable.sort((a, b) => b.priority - a.priority);
}

// ===========================
// GAME FLOW FUNCTIONS
// ===========================

/**
 * Проверяет завершение хода и автоматически переходит к следующему игроку
 */
function checkTurnCompletion() {
    // Проверяем, что мы в режиме игры
    if (gamePhase !== 'playing') {
        return;
    }

    // Проверяем приоритет дублей
    const isSpecialDouble = isDouble(lastDiceRoll[0], lastDiceRoll[1]);

    if (isSpecialDouble && consecutiveDoubles < 3) {
        // Дубль дает право на дополнительный бросок
        return; // Не передаем ход
    }

    // Проверяем, использованы ли все кубики
    const allDiceUsed = diceUsed[0] && diceUsed[1];

    if (!allDiceUsed) {
        // Есть неиспользованные кубики - проверяем наличие валидных ходов
        const hasValidMoves = checkNoValidMoves(
            diceUsed[0] ? 0 : lastDiceRoll[0],
            diceUsed[1] ? 0 : lastDiceRoll[1]
        );

        if (!hasValidMoves) {
            // Нет валидных ходов - передаем ход
            nextPlayer();
        }
    } else {
        // Все кубики использованы
        if (isSpecialDouble && consecutiveDoubles < 3) {
            // Дубль - даем еще один бросок
            consecutiveDoubles++;
            diceUsed = [false, false];
            isStartZoneComboMove = false;
        } else {
            // Обычная ситуация или лимит дублей - передаем ход
            nextPlayer();
        }
    }
}

/**
 * Переход к следующему игроку
 */
function nextPlayer() {
    if (gamePhase === 'playing') {
        const playerIndex = playersOrder.findIndex(p => p.player === currentPlayer);
        const nextIndex = (playerIndex + 1) % playersOrder.length;
        currentPlayer = playersOrder[nextIndex].player;

        cachedValidMoves = [];
        currentTurnNumber++;

        rollCount = 0;
        consecutiveDoubles = 0;
        isStartZoneComboMove = false;
        expectedMovesCount = 0;
        performedMovesCount = 0;
    }
}

/**
 * Обрабатывает результат броска кубиков в режиме игры
 */
function handleGamePlay(dice1, dice2) {
    let message = `Игрок ${playerColors[currentPlayer-1]} выбросил: ${dice1} и ${dice2}`;

    // Логируем комбинации фишек для отладки
    logPieceCombinations();

    // Проверяем наличие валидных ходов
    const noValidMoves = checkNoValidMoves(dice1, dice2);

    // ПРИОРИТЕТ ДУБЛЕЙ: Проверяем дубли ПЕРЕД проверкой отсутствия ходов
    const isSpecialDouble = isDouble(dice1, dice2);

    if (isSpecialDouble) {
        consecutiveDoubles++;

        if (consecutiveDoubles < 3 && noValidMoves) {
            // Дубль и нет ходов, но лимит не исчерпан
            message += ` - Дубль ${consecutiveDoubles}/3! Нет ходов, бросайте снова.`;
            diceUsed = [false, false];
            updateGameMessage(message);
            return;
        } else if (consecutiveDoubles >= 3 && noValidMoves) {
            // Лимит дублей исчерпан и нет ходов
            message += ` - Дубль! Максимум дублей (3/3), ход переходит к следующему игроку.`;
            updateGameMessage(message);
            setTimeout(() => {
                nextPlayer();
            }, 3000);
            return;
        } else if (consecutiveDoubles < 3 && !noValidMoves) {
            // Дубль и есть ходы
            message += ` - Дубль ${consecutiveDoubles}/3! Сделайте ход и бросайте снова.`;
        } else {
            // Лимит дублей исчерпан, но есть ходы
            message += ` - Дубль! Максимум дублей (3/3), после хода ход перейдет к следующему игроку.`;
        }
    }

    // Обработка автоматического пропуска при отсутствии ходов
    if (noValidMoves && !isSpecialDouble) {
        const playerColor = playerColors[currentPlayer - 1];
        const skipMessage = `У игрока ${playerColor} нет возможных ходов. Ход передан следующему игроку.`;

        updateGameMessage(message + '\n\n' + skipMessage);

        setTimeout(() => {
            nextPlayer();
        }, 3000);

        return;
    }

    updateGameMessage(message);
}

/**
 * Выполняет перемещение фишки на целевую координату
 * Включает обработку захвата фишек, специальных полей и телепортации
 */
function performMove(piece, targetCoord) {
    const playerNum = parseInt(piece.dataset.player);
    const currentCoord = getCurrentPosition(piece);

    // Проверяем валидность хода
    const possibleMoves = calculatePossibleMoves(piece, 12, lastDiceRoll[0], lastDiceRoll[1]);
    const validMoves = filterMovesWithObstacles(possibleMoves, piece, lastDiceRoll[0], lastDiceRoll[1]);

    const validMove = validMoves.find(m => m.coord === targetCoord);

    if (!validMove) {
        return false;
    }

    // Удаляем фишку из текущей позиции
    removePieceFromCell(piece, currentCoord);

    // Обрабатываем захват фишек противника
    const piecesAtTarget = gameBoard[targetCoord] || [];
    for (let existingPiece of [...piecesAtTarget]) {
        const existingPlayer = parseInt(existingPiece.dataset.player);
        if (existingPlayer !== playerNum && !isInSpecialZone(targetCoord)) {
            // Возвращаем фишку противника в стартовую зону
            const startCoord = findFreeStartPosition(existingPlayer);
            if (startCoord) {
                removePieceFromCell(existingPiece, targetCoord);
                addPieceToCell(existingPiece, startCoord);
                existingPiece.dataset.position = startCoord;
            }
        }
    }

    // Перемещаем фишку на целевую позицию
    addPieceToCell(piece, targetCoord);
    piece.dataset.position = targetCoord;

    // Обрабатываем специальные поля (автоматическое перемещение)
    if (SPECIAL_MOVES[targetCoord]) {
        const specialTarget = SPECIAL_MOVES[targetCoord];
        removePieceFromCell(piece, targetCoord);
        addPieceToCell(piece, specialTarget);
        piece.dataset.position = specialTarget;
    }

    // Отмечаем использованные кубики
    if (validMove.usedDice) {
        for (let dice of validMove.usedDice) {
            const index = lastDiceRoll.indexOf(dice);
            if (index !== -1 && !diceUsed[index]) {
                diceUsed[index] = true;
                break;
            }
        }
    }

    // Обрабатываем телепортацию
    if (validMove.isTeleport) {
        const pieceId = piece.dataset.id;
        piecesTeleportHistory[pieceId] = currentTurnNumber;
    }

    // Увеличиваем счетчик выполненных ходов
    performedMovesCount++;

    // Проверяем завершение хода
    checkTurnCompletion();

    return true;
}

/**
 * Инициализирует новую игру
 */
function startGame() {
    // Сброс состояния игры
    gameBoard = {};
    currentPlayer = 1;
    gamePhase = 'determining-order';
    rollCount = 0;
    consecutiveDoubles = 0;
    isStartZoneComboMove = false;
    currentTurnNumber = 0;
    diceUsed = [false, false];
    lastDiceRoll = [0, 0];
    validMovesTable = [];
    pieceCombinationsTable = [];
    expectedMovesCount = 0;
    performedMovesCount = 0;

    // Очистка истории
    gameMessages = [];
    skippedTurns = [];
    diceLog = [];
    orderResults = [];
    playersOrder = [];

    // Инициализация фишек игроков
    pieces = {};
    for (let player = 1; player <= playerCount; player++) {
        pieces[player] = [];
        const startCoords = START_ZONES[player];

        for (let i = 0; i < 6; i++) {
            const coord = startCoords[i];
            // Создаем объект фишки (в реальной реализации это DOM-элемент)
            const piece = {
                element: null, // Здесь должен быть DOM-элемент
                position: coord
            };
            pieces[player].push(piece);
            addPieceToCell(piece.element, coord);
        }
    }
}

// ===========================
// EXPORT (для использования как модуль)
// ===========================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Constants
        BOARD_CELLS,
        START_ZONES,
        WAITING_ZONES,
        ENTRY_CELLS,
        TEMPLE_COORDS,
        JAIL_COORDS,
        TELEPORT_COORDS,
        TELEPORT_MAPPINGS,
        PLAYER_PATHS,
        SPECIAL_MOVES,
        MOVE_CALCULATION_OVERRIDES,

        // State variables
        gameBoard,
        pieces,
        currentPlayer,
        gamePhase,
        lastDiceRoll,
        diceUsed,
        consecutiveDoubles,
        validMovesTable,
        expectedMovesCount,
        performedMovesCount,

        // Functions
        isDouble,
        getCurrentPosition,
        getPlayerForWaitingZone,
        getPlayerForStartZone,
        findFreeStartPosition,
        findPieceAtCoord,
        isInSpecialZone,
        getPiecePosition,
        getPieceProgressPosition,
        removePieceFromCell,
        addPieceToCell,
        cloneGameBoard,
        simulateMove,
        simulateTeleportMove,
        restoreGameBoard,
        calculateTargetCoordinate,
        calculateJailSequentialMoves,
        calculateSequentialMoves,
        canMakeMoveFromToGameBoard,
        canMakeMoveFromTo,
        calculatePossibleMoves,
        calculateSingleTeleportMove,
        calculateTeleportMoves,
        filterMovesWithObstacles,
        checkNoValidMoves,
        logPieceCombinations,
        checkTurnCompletion,
        nextPlayer,
        handleGamePlay,
        performMove,
        startGame
    };
}
