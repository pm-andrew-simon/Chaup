# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a single-page web application implementing Chaupar, a traditional Indian board game. The entire game is contained within a single `index.html` file with embedded CSS and JavaScript.

**Live site:** https://chaupar.ru (configured via `CNAME` file)

## Architecture

The application is built as a vanilla HTML/CSS/JavaScript single-file game with no external dependencies or build process.

### Core Components

**Game State Management:**
- `gamePhase`: Controls game flow ('setup' → 'order-determination' → 'playing')
- `currentPlayer`: Tracks active player (1-4)
- `selectedPiece`: Manages piece selection for click-to-move system
- `players`: Array storing game participants

**Board System:**
- `BOARD_CELLS`: Array of 60+ coordinate strings (A1-O15 grid system)
- `START_ZONES`: Object mapping player colors to starting positions
- `PLAYER_PATHS`: Clockwise movement paths for each player (1-4) with ~60 cells each
- `SPECIAL_MOVES`: Auto-movement fields (K7→K6, N7→N6, etc.)
- `ENTRY_CELLS`: Starting positions for each player on the main board
- Custom coordinate mapping with `coordToPosition()` and `positionToCoord()` functions

**Interaction Systems:**
- Dual input support: drag-and-drop (desktop) + click-to-select (mobile)
- Touch gesture recognition distinguishing taps from drags
- Pinch-to-zoom functionality for mobile devices
- Move hints system: displays numbered circles (1-12) showing possible moves

**UI Layout:**
- Responsive design with CSS Grid (15x15 game board)
- Mobile-first approach with media queries
- Glassmorphism styling with backdrop filters

## Key Functions

**Game Flow:**
- `startGame()`: Initializes board and player setup
- `handleOrderDetermination()`: Manages turn order via dice rolls
- `performMove()`: Executes piece movements with validation and special field handling

**Move Calculation System:**
- `calculatePossibleMoves()`: Computes valid moves along player path (up to 12 steps)
- `showMoveHints()` / `clearMoveHints()`: Display/hide numbered move indicators
- `getPiecePosition()`: Determines if piece is in start zone or on board

**Input Handling:**
- `handleDragStart/End()`: Desktop drag-and-drop system
- `handleTouchStart/Move/End()`: Mobile touch events with gesture detection
- `handlePieceClick()` + `handleCellClick()`: Alternative input method with hint integration

**Board Rendering:**
- `createBoard()`: Generates 15x15 CSS Grid with coordinate labels
- `createPieces()`: Places colored player pieces in start zones

## Development Notes

**No Build Process:** This is a static site - edit `index.html` directly and deploy.

**Game Logic Implementation:**
- Each player follows a unique clockwise path around the board perimeter
- Player paths are stored as arrays in `PLAYER_PATHS` (Red: I1→I7→O7→..., Yellow: G15→G9→..., etc.)
- Special fields automatically move pieces to adjacent cells but count as normal moves
- Move hints calculate up to 12 steps along the player's designated path

**Mobile Compatibility:** The game supports:
- Touch events with passive/non-passive handling
- Viewport scaling and pinch-to-zoom  
- Click-to-select as fallback for complex drag operations
- Animated move hints with CSS transitions

**Analytics:** Yandex.Metrika integrated with ID `103866554` for the chaupar.ru domain.

## Git Workflow

Since this is a GitHub Pages deployment:
1. Edit `index.html` for any changes
2. Commit and push to `main` branch
3. Changes automatically deploy to https://chaupar.ru

The repository uses standard Git operations - no special build or deployment scripts required.