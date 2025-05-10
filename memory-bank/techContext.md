# Chess Application - Tech Context

## Technologies Used
- **Next.js (v13+ with App Router):** React framework for UI, routing, and server-side capabilities.
- **React (v18+):** Library for building user interfaces.
- **XState (v5):** State management library for orchestrating game logic and state transitions.
- **TypeScript:** Superset of JavaScript adding static typing for improved code quality and developer experience.
- **Jest:** JavaScript testing framework.
- **React Testing Library:** Utilities for testing React components.
- **PNPM:** Package manager.

## Development Setup
- **Node.js:** Required runtime environment.
- **PNPM:** Used for installing and managing dependencies.
- **VS Code:** Recommended IDE with extensions for TypeScript, ESLint, Prettier.
- **Git:** Version control system.

## Technical Constraints
- Browser-based application.
- State management must handle complex game rules and transitions effectively.
- Maintainability and testability are key concerns.

## Dependencies
- `xstate`: Core state machine functionality.
- `react`, `react-dom`, `next`: UI framework.
- Development dependencies: `typescript`, `@types/node`, `@types/react`, `jest`, `@testing-library/react`, etc.

## Tool Usage Patterns
- **XState `setup` API:** Used for defining machine actions, guards, and actors with type safety in XState v5.
- **`assign` action:** Primary mechanism for updating the XState machine's context.
- **Deep Cloning:** `JSON.parse(JSON.stringify(context.castlingRights))` or `board.map(row => [...row])` used for creating mutable copies of context data to avoid direct state mutation.
- **Testing:** Unit tests for logic functions, state machine behavior, and UI components.
