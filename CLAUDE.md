# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ IMPORTANT WORKFLOW RULES

**DO NOT create git commits automatically!** Always ask the user first before committing changes. The user will explicitly request commits when ready.

## Project Overview

This is a web application implementing Chaupar, a traditional Indian board game. The game logic is contained within `index.html` with embedded CSS and JavaScript, supported by additional informational pages.

**Live site:** https://chaupar.ru (configured via `CNAME` file)

**Site Structure:**
- `index.html`: Main game interface with full game logic
- `rules.html`: Game rules and instructions
- `situations.html`: Common game scenarios and explanations
- `contacts.html`: Contact information and support
- `news.html`: Project news and updates

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
- Teleport icons with SVG graphics and tooltips indicating special movement cells

## Key Functions

**Game Flow:**
- `startGame()`: Initializes board and player setup
- `handleOrderDetermination()`: Manages turn order via dice rolls
- `performMove()`: Executes piece movements with validation and special field handling
- `handleGamePlay()`: Central dice processing logic with double handling and auto-skip
- `rollPlayerDice()`: Dice rolling animation and result processing
- `nextPlayer()`: Player turn transitions with state management

**Move Calculation System:**
- `calculatePossibleMoves()`: Computes valid moves based on piece location (start→waiting→board→finish)
- `getPiecePosition()`: Returns piece location type ('start', 'waiting', 'board') and coordinates
- `showMoveHints()` / `clearMoveHints()`: Display/hide numbered move indicators (1-12 steps)
- `filterMovesWithObstacles()`: Critical function that validates moves by checking for blocking pieces
- `analyzePossibleMoves()`: Provides detailed move analysis for UI display (must use obstacle filtering)
- `checkNoValidMoves()`: Determines if auto-skip should occur (must use obstacle filtering)
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

**Environment Configuration:**
- Supabase credentials are stored in `.env` file (not committed to git)
- Environment variables use VITE_ prefix for potential future build tool compatibility
- Application reads configuration directly from .env via JavaScript fetch

**Game Logic Implementation:**
- Three-phase piece movement: Start Zones → Waiting Zones → Game Board → Finish
- Each player follows a unique clockwise path around the board perimeter
- Player paths are stored as arrays in `PLAYER_PATHS` (Red: I1→I7→O7→..., Yellow: G15→G9→..., etc.)
- Waiting zones support up to 6 pieces distributed across 4 cells with visual offsets
- Special fields automatically move pieces to adjacent cells but count as normal moves
- Move hints calculate up to 12 steps along the player's designated path

**Dice System & Special Rules:**
- Double detection: Only 1:1 and 6:6 grant additional rolls (up to 3 times)
- Dice consumption tracking: `diceUsed[]` array prevents reusing dice values
- Auto-skip mechanism: `checkNoValidMoves()` triggers automatic turn progression
- START_ZONES exit: Requires dice value of 1 (combo moves go to board path, not waiting zones)
- Jail mechanics: Requires dice value of 6 to exit, second die determines movement
- Temple/Portal protection: Pieces in special zones cannot be captured

**Mobile Compatibility:** The game supports:
- Touch events with passive/non-passive handling
- Viewport scaling and pinch-to-zoom  
- Click-to-select as fallback for complex drag operations
- Animated move hints with CSS transitions

**Analytics:** Yandex.Metrika integrated with ID `103866554` for the chaupar.ru domain.

**Game Persistence & Multiplayer:** Supabase integration for save/load and real-time multiplayer:
- Client initialized via CDN: `@supabase/supabase-js@2`
- Configuration loaded from `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Game state serialization/deserialization with `serializeGameState()` and `deserializeGameState()`
- Unique game ID generation with format `CHPR-XXXXXXXX`
- Real-time multiplayer synchronization using Supabase Realtime channels
- Automatic game state saving and bidirectional sync between clients
- Player turn and dice log synchronization for live multiplayer sessions
- **Critical**: `loadGame()` must call `updatePlayerDiceStates()` to activate dice after loading
- **Critical**: `restoreGameState()` creates sync conflicts - prevent with `isRestoringState` flag

## Common Development Commands

**Testing the application locally:**
```bash
# Open in browser - the game runs entirely client-side
start index.html
```

**No build process required** - this is a static site that runs entirely in the browser.

**Allowed Git Operations:** The `.claude/settings.local.json` permits these commands without user confirmation:
- `git init`, `git remote add`, `git branch`
- `git add`, `git commit`, `git config` 
- `git push`, `git pull`
- `start index.html` for local testing

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

## Important Implementation Details

**Coordinate System:**
- 15x15 grid using A1-O15 coordinate notation (A-O columns, 1-15 rows)
- `coordToPosition()` converts coordinates to pixel positions
- `positionToCoord()` converts pixel positions back to coordinates

**Game State Variables (Global):**
- `gamePhase`: 'setup' | 'order-determination' | 'playing'
- `currentPlayer`: 1-4 (active player index)
- `gameBoard`: Object mapping coordinates to piece arrays
- `pieces`: Object storing piece elements by player
- `selectedPiece`: Currently selected piece for click-to-move
- `currentGameId`: Auto-generated game session ID for Supabase sync

**File Organization:**
- All game logic, CSS, and HTML in single `index.html` file (~3400 lines)
- Additional pages are standalone HTML files sharing navigation CSS
- SVG assets for game UI: `teleport.svg`, `arrow.svg`, `jail.svg`, `temle.svg`
- No external JavaScript files or dependencies except Supabase CDN
- Environment variables stored in `.env` file for Supabase configuration

**SEO Configuration:**
- `CNAME`: Points to chaupar.ru domain
- `sitemap.xml`: Structured site map for search engines
- `robots.txt`: Allows indexing with restrictions on dynamic paths

## Environment & Security

**Environment Variables (.env):**
- Configuration stored in `.env` file (not committed to git)
- Contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for database connection
- Loaded via JavaScript fetch() for client-side configuration
- Required for multiplayer/save functionality

**Development Security:**
- Supabase anon key is safe for client-side exposure (Row Level Security enforced)
- No server-side secrets or private keys in repository
- All authentication handled through Supabase security policies

## Critical Implementation Notes

**Move Logic Consistency:**
- `showMoveHints()`, `analyzePossibleMoves()`, and `checkNoValidMoves()` MUST all use `filterMovesWithObstacles()`
- Any function calculating possible moves without obstacle checking will cause UI inconsistencies
- Always verify that theoretical moves (dice-based) match practical moves (obstacle-filtered)

**Double (Dice Pairs) Logic:**
- Only 1:1 and 6:6 trigger additional rolls - other doubles (2:2, 3:3, 4:4, 5:5) are normal turns
- Double logic has priority over auto-skip - provide additional rolls even with no valid moves
- After 3 consecutive doubles, normal auto-skip rules apply

**Auto-Skip Debugging:**
- If auto-skip fails, check: `gamePhase === 'playing'`, `setTimeout()` execution, `nextPlayer()` state
- Use diagnostic logging to trace: dice detection → move validation → timer setup → execution

**State Management:**
- Game state changes trigger Supabase sync, which can cause `restoreGameState()` loops
- Use `isRestoringState` flag to prevent cycles during multiplayer sync
- Always call `updatePlayerDiceStates()` after state restoration to activate correct player's dice