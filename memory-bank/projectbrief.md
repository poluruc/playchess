# Chess Application - Project Overview

## Introduction
This project is a chess application built using Next.js and XState. It demonstrates how to create an interactive chess game with proper state management and follows test-driven development practices.

## Key Technologies
- **Next.js** - Framework for building the application
- **XState** - State management for complex game logic
- **TypeScript** - Type safety across the application
- **Jest** - Testing framework
- **React Testing Library** - For component testing

## Project Structure

```
mychess/
├── app/               # Next.js app directory
│   ├── page.tsx       # Main chess page component
│   └── layout.tsx     # Layout component
├── lib/               # Core logic
│   ├── chessMachine.ts   # XState machine for chess logic
│   └── chessTypes.ts     # Type definitions
├── __tests__/         # Test files
│   ├── chessMachine.test.ts     # Tests for state machine
│   ├── chessMoveValidation.test.ts  # Tests for chess rules
│   └── page.test.tsx             # Tests for UI components
└── memory-bank/       # Documentation
    ├── testStrategy.md     # Test strategy documentation
    └── stateMachine.md     # State machine architecture
```

## Core Features
1. **Interactive Chess Board** - Visual representation of the chess game
2. **State Management** - XState machine managing game state
3. **Chess Rules** - Implementation of chess piece movement rules
4. **Player Turns** - Alternating turns between white and black
5. **Move Validation** - Enforcing legal chess moves

## Implementation Details

### Chess State Machine
The core game logic is implemented as an XState state machine, which models:
- Game states (waiting for selection, piece selected)
- Turn management
- Move validation
- Board state

### User Interface
The UI provides:
- Visual chess board with pieces
- Highlighting of selected pieces
- Indication of valid moves
- Player turn display
- Game reset functionality

### Testing Strategy
We follow TDD with a three-layer testing approach:
- Unit tests for the state machine
- Validation tests for chess rules
- Component tests for the UI

## Future Work
1. **Complete Chess Rules** - Add all piece movements, check, checkmate
2. **Game History** - Recording moves and allowing replay
3. **Time Controls** - Adding chess clocks
4. **Save/Load Games** - Persistence of game state
5. **Multiplayer** - Support for online play
