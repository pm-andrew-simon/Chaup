# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web application implementing Chaupar, a traditional Indian board game. The game logic is contained within `index.html` with embedded CSS and JavaScript, supported by additional informational pages.

**Live site:** https://chaupar.ru (configured via `CNAME` file)

**Site Structure:**
- `index.html`: Main game interface with full game logic
- `rules.html`: Game rules and instructions
- `situations.html`: Common game scenarios and explanations  
- `contacts.html`: Contact information and support

## Architecture

The application is built as a vanilla HTML/CSS/JavaScript single-file game with no external dependencies or build process.

### Core Components

**Game State Management:**
- `gamePhase`: Controls game flow ('setup' → 'order-determination' → 'playing')
- `currentPlayer`: Tracks active player (1-4)
- `selectedPiece`: Manages piece selection for click-to-move system
- `players`: Array storing game participants

**Board System:**
- `BOARD_CELLS`: Array of 70+ coordinate strings (A1-O15 grid system) including waiting zones
- `START_ZONES`: Player starting positions (6 pieces each): Red: M1:O2, Yellow: A14:C15, Green: N13:O15, Purple: A1:B3
- `WAITING_ZONES`: Pre-game holding areas (up to 6 pieces distributed): Red: K1:K4, Yellow: E12:E15, Green: L11:O11, Purple: A5:D5
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
- `calculatePossibleMoves()`: Computes valid moves based on piece location (start→waiting→board→finish)
- `getPiecePosition()`: Returns piece location type ('start', 'waiting', 'board') and coordinates
- `showMoveHints()` / `clearMoveHints()`: Display/hide numbered move indicators (1-12 steps)
- Multi-piece cell support: Arrays for start/waiting zones, single pieces on main board

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
- Three-phase piece movement: Start Zones → Waiting Zones → Game Board → Finish
- Each player follows a unique clockwise path around the board perimeter
- Player paths are stored as arrays in `PLAYER_PATHS` (Red: I1→I7→O7→..., Yellow: G15→G9→..., etc.)
- Waiting zones support up to 6 pieces distributed across 4 cells with visual offsets
- Special fields automatically move pieces to adjacent cells but count as normal moves
- Move hints calculate up to 12 steps along the player's designated path

**Mobile Compatibility:** The game supports:
- Touch events with passive/non-passive handling
- Viewport scaling and pinch-to-zoom  
- Click-to-select as fallback for complex drag operations
- Animated move hints with CSS transitions

**Analytics:** Yandex.Metrika integrated with ID `103866554` for the chaupar.ru domain.

**Game Persistence:** Supabase integration for save/load functionality:
- Client initialized via CDN: `@supabase/supabase-js@2`
- Game state serialization/deserialization with `serializeGameState()` and `deserializeGameState()`
- Unique game ID generation with format `CHPR-XXXXXXXX`

## Git Workflow

Since this is a GitHub Pages deployment:
1. Edit files directly (`index.html` for game logic, other `.html` for content)
2. Commit and push to `main` branch  
3. Changes automatically deploy to https://chaupar.ru

The repository uses standard Git operations - no special build or deployment scripts required.

## Navigation Architecture

Shared navigation component across all pages (`<nav class="navigation">`) with consistent styling:
- Glassmorphism design with backdrop blur
- Responsive mobile-first layout
- Current page highlighting with `.current` class
- All pages share the same base CSS structure and color scheme