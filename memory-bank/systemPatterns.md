# Chess Application - System Patterns

## Architecture
The application follows a component-based architecture facilitated by Next.js (React). The core game logic is decoupled from the UI through a state management pattern.

## State Management
- **XState:** Used for managing the complex game state (e.g., player turn, piece selection, board state, game over conditions). This provides a robust and predictable way to handle game flow and transitions.
- **Centralized Logic:** The `chessMachine.ts` encapsulates all game rules and state transitions.

## Key Technical Decisions
- **TypeScript:** Ensures type safety throughout the application, reducing runtime errors and improving code maintainability.
- **Modular Design:** Separation of concerns between UI (`app/page.tsx`), game logic (`lib/chessMachine.ts`), and type definitions (`lib/chessTypes.ts`).
- **Deep Copying State:** Ensuring that state objects (like the board and castling rights) are deeply copied before modification to prevent unintended side effects, especially within the XState machine's context updates.

## Component Relationships
- `page.tsx` (UI) interacts with `chessMachine.ts` (Logic) via the `useChessMachine.ts` hook.
- `chessMachine.ts` utilizes helper functions for move validation, check detection, etc., which operate on the `board` and other context data.
- `chessTypes.ts` provides shared data structures for the UI and logic layers.

## Critical Implementation Paths
- **Move Validation:** The `isValidMove` function is critical for enforcing chess rules.
- **Check/Checkmate Detection:** Functions like `isKingInCheck`, `isPlayerInCheckmate`, and `isPlayerInStalemate` are crucial for determining game state.
- **State Updates in `movePiece` action:** This action is central to applying moves, updating castling rights, and determining the next game state (check, checkmate, stalemate, player turn).
