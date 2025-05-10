import { assign, setup } from 'xstate';
import type { ChessContext, ChessEvents } from './chessTypes';

// Initial chess board setup
export const initialBoard: string[][] = [
  ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
  ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
  ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'],
];

// Initial context for the chess machine
const initialContext: ChessContext = {
  board: initialBoard,
  currentPlayer: 'white',
  selectedPiece: null,
  possibleMoves: [],
};

// Simple function to check if a piece belongs to the current player
const checkIsCurrentPlayersPiece = (piece: string, currentPlayer: 'white' | 'black'): boolean => {
  if (!piece) return false;
  return (piece.charAt(0) === 'w' && currentPlayer === 'white') || 
         (piece.charAt(0) === 'b' && currentPlayer === 'black');
};

// Helper function to store the state in localStorage
const storeState = (context: ChessContext) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('chessState', JSON.stringify(context));
      console.log('Chess state stored in localStorage');
    } catch (error) {
      console.error('Failed to store chess state:', error);
    }
  }
};

// XState v5 machine with setup
export const chessMachine = setup({
  // Define types for the machine
  types: {
    context: {} as ChessContext,
    events: {} as ChessEvents,
  },
  // Define guards
  guards: {
    isCurrentPlayersPiece: ({ context, event }) => {
      if (event.type !== 'SELECT_PIECE') return false;
      try {
        console.log('Guard checking piece ownership:', event);
        
        // Check if context is undefined
        if (!context) {
          console.error('Context is undefined in guard function');
          return false;
        }
        
        // Check if board is undefined
        if (!context.board) {
          console.error('Board is undefined in context');
          return false;
        }
        
        const { row, col } = event.position;
        
        // Safety checks
        if (typeof row !== 'number' || typeof col !== 'number' ||
            row < 0 || row >= context.board.length || 
            col < 0 || col >= context.board[0].length) {
          console.error('Invalid position:', { row, col });
          return false;
        }
        
        const piece = context.board[row][col];
        
        // Debug info
        console.log('Checking piece:', {
          piece,
          position: { row, col },
          currentPlayer: context.currentPlayer
        });
        
        return checkIsCurrentPlayersPiece(piece, context.currentPlayer);
      } catch (error) {
        console.error('Error in isCurrentPlayersPiece guard:', error);
        return false;
      }
    },
    isSamePiece: ({ context, event }) => {
      if (event.type !== 'SELECT_PIECE' || !context.selectedPiece) return false;
      try {
        const { row, col } = event.position;
        return context.selectedPiece.row === row && context.selectedPiece.col === col;
      } catch (error) {
        console.error('Error in isSamePiece guard:', error);
        return false;
      }
    }
  },

  // Define actions
  actions: {
    selectPiece: assign(({ context, event }) => {
      if (event.type !== 'SELECT_PIECE') return {};
      return {
        selectedPiece: event.position,
        possibleMoves: [] // In a full implementation, calculate moves here
      };
    }),
    clearSelection: assign({
      selectedPiece: null,
      possibleMoves: []
    }),
    storeStateAction: ({ context }) => storeState(context),
    resetGame: assign({
      board: initialBoard,
      currentPlayer: 'white',
      selectedPiece: null,
      possibleMoves: []
    })
  },
  // Add async services for move calculation
  services: {
    calculateValidMoves: ({ context, event }) => {
      // Return a promise that resolves with the valid moves
      return Promise.resolve([]);
      
      // In a real implementation, this would be:
      /* return new Promise((resolve) => {
        if (event.type !== 'SELECT_PIECE') return resolve([]);
        
        const { row, col } = event.position;
        const piece = context.board[row][col];
        
        // Calculate valid moves based on piece type, position, etc.
        // This could be moved to a utility function
        const validMoves = calculatePieceMoves(piece, row, col, context.board);
        resolve(validMoves);
      }); */
    }
  }
}).createMachine({
  id: 'chess',
  initial: 'idle',
  context: initialContext,
  states: {
    idle: {
      on: {
        SELECT_PIECE: {
          target: 'pieceSelected',
          guard: 'isCurrentPlayersPiece',
          actions: ['selectPiece', 'storeStateAction']
        },
        RESET_GAME: {
          target: 'idle',
          actions: ['resetGame', 'storeStateAction']
        }
      }
    },
    pieceSelected: {
      // Optional: invoke the async move calculator service
      // invoke: {
      //   src: 'calculateValidMoves',
      //   onDone: {
      //     actions: assign({
      //       possibleMoves: ({ event }) => event.output
      //     })
      //   }
      // },
      on: {
        SELECT_PIECE: [
          {
            // If selecting the same piece again, deselect it
            target: 'idle',
            guard: 'isSamePiece',
            actions: ['clearSelection', 'storeStateAction']
          },
          {
            // If selecting different piece of same player, update selection
            target: 'pieceSelected',
            guard: 'isCurrentPlayersPiece',
            actions: ['selectPiece', 'storeStateAction']
          }
        ],
        RESET_GAME: {
          target: 'idle',
          actions: ['resetGame', 'storeStateAction']
        }
      }
    }
  }
});