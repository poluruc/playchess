import { assign, setup } from 'xstate';
import type { ChessContext, ChessEvents, Position } from './chessTypes';

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

// Function to check if a move is valid
const isValidMove = (
  board: string[][],
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): boolean => {
  const piece = board[fromRow][fromCol];
  if (!piece) return false;
  
  // Basic validation: can't capture your own pieces
  const targetPiece = board[toRow][toCol];
  if (targetPiece && piece.charAt(0) === targetPiece.charAt(0)) {
    return false;
  }
  
  const pieceType = piece.charAt(1);
  const isWhite = piece.charAt(0) === 'w';
  
  // Simple piece movement logic
  switch (pieceType) {
    case 'P': // Pawn
      const direction = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;
      
      // Forward one square
      if (toCol === fromCol && toRow === fromRow + direction && !board[toRow][toCol]) {
        return true;
      }
      
      // Forward two squares from starting position
      if (toCol === fromCol && fromRow === startRow && 
          toRow === fromRow + 2 * direction && 
          !board[fromRow + direction][fromCol] && 
          !board[toRow][toCol]) {
        return true;
      }
      
      // Capture diagonally
      if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction) {
        return !!board[toRow][toCol] && board[toRow][toCol].charAt(0) !== piece.charAt(0);
      }
      
      return false;
    
    case 'R': // Rook
      // Must move horizontally or vertically
      if (fromRow !== toRow && fromCol !== toCol) return false;
      
      // Check for pieces in between
      if (fromRow === toRow) {
        // Horizontal move
        const start = Math.min(fromCol, toCol);
        const end = Math.max(fromCol, toCol);
        
        for (let col = start + 1; col < end; col++) {
          if (board[fromRow][col]) return false;
        }
      } else {
        // Vertical move
        const start = Math.min(fromRow, toRow);
        const end = Math.max(fromRow, toRow);
        
        for (let row = start + 1; row < end; row++) {
          if (board[row][fromCol]) return false;
        }
      }
      
      return true;
    
    case 'N': // Knight
      // Knight moves in an L shape: 2 squares in one direction, 1 square perpendicular
      const rowDiff = Math.abs(toRow - fromRow);
      const colDiff = Math.abs(toCol - fromCol);
      
      return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    
    case 'B': // Bishop
      // Must move diagonally
      if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
      
      // Check for pieces in between
      const rowStep = toRow > fromRow ? 1 : -1;
      const colStep = toCol > fromCol ? 1 : -1;
      
      let row = fromRow + rowStep;
      let col = fromCol + colStep;
      
      while (row !== toRow && col !== toCol) {
        if (board[row][col]) return false;
        row += rowStep;
        col += colStep;
      }
      
      return true;
    
    case 'Q': // Queen (combines rook and bishop movements)
      // Check if the move is like a rook or a bishop
      const isRookLike = fromRow === toRow || fromCol === toCol;
      const isBishopLike = Math.abs(toRow - fromRow) === Math.abs(toCol - fromCol);
      
      if (!isRookLike && !isBishopLike) return false;
      
      // If it's a rook-like move
      if (isRookLike) {
        if (fromRow === toRow) {
          // Horizontal move
          const start = Math.min(fromCol, toCol);
          const end = Math.max(fromCol, toCol);
          
          for (let col = start + 1; col < end; col++) {
            if (board[fromRow][col]) return false;
          }
        } else {
          // Vertical move
          const start = Math.min(fromRow, toRow);
          const end = Math.max(fromRow, toRow);
          
          for (let row = start + 1; row < end; row++) {
            if (board[row][fromCol]) return false;
          }
        }
      } 
      // If it's a bishop-like move
      else {
        const rowStep = toRow > fromRow ? 1 : -1;
        const colStep = toCol > fromCol ? 1 : -1;
        
        let row = fromRow + rowStep;
        let col = fromCol + colStep;
        
        while (row !== toRow && col !== toCol) {
          if (board[row][col]) return false;
          row += rowStep;
          col += colStep;
        }
      }
      
      return true;
    
    case 'K': // King
      // King moves one square in any direction
      const kingRowDiff = Math.abs(toRow - fromRow);
      const kingColDiff = Math.abs(toCol - fromCol);
      
      return kingRowDiff <= 1 && kingColDiff <= 1 && !(kingRowDiff === 0 && kingColDiff === 0);
    
    default:
      return false;
  }
};

// Calculate valid moves for a piece
const calculateValidMoves = (board: string[][], position: Position): Position[] => {
  const { row, col } = position;
  const piece = board[row][col];
  if (!piece) return [];
  
  const validMoves: Position[] = [];
  
  // Check all possible positions on the board
  for (let toRow = 0; toRow < 8; toRow++) {
    for (let toCol = 0; toCol < 8; toCol++) {
      if (isValidMove(board, row, col, toRow, toCol)) {
        validMoves.push({ row: toRow, col: toCol });
      }
    }
  }
  
  return validMoves;
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
    },
    isValidMoveTarget: ({ context, event }) => {
      if (event.type !== 'MOVE_PIECE' || !context.selectedPiece) return false;
      try {
        const { row: fromRow, col: fromCol } = context.selectedPiece;
        const { row: toRow, col: toCol } = event.position;
        
        return isValidMove(context.board, fromRow, fromCol, toRow, toCol);
      } catch (error) {
        console.error('Error in isValidMoveTarget guard:', error);
        return false;
      }
    }
  },

  // Define actions
  actions: {
    selectPiece: assign(({ context, event }) => {
      if (event.type !== 'SELECT_PIECE') return {};
      
      // Calculate valid moves for the selected piece
      const validMoves = calculateValidMoves(context.board, event.position);
      
      return {
        selectedPiece: event.position,
        possibleMoves: validMoves
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
    }),
    movePiece: assign(({ context, event }) => {
      if (event.type !== 'MOVE_PIECE' || !context.selectedPiece) return {};
      
      const { row: fromRow, col: fromCol } = context.selectedPiece;
      const { row: toRow, col: toCol } = event.position;
      
      // Create a new board with the updated piece positions
      const newBoard = context.board.map(row => [...row]);
      
      // Move the piece
      newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
      newBoard[fromRow][fromCol] = '';
      
      // Switch players
      const newCurrentPlayer = context.currentPlayer === 'white' ? 'black' : 'white';
      
      return {
        board: newBoard,
        currentPlayer: newCurrentPlayer,
        selectedPiece: null,
        possibleMoves: []
      };
    })
  },
  // Add async services for move calculation
  services: {
    calculateValidMoves: ({ context, event }) => {
      // Return a promise that resolves with the valid moves
      return new Promise((resolve) => {
        if (event.type !== 'SELECT_PIECE') return resolve([]);
        
        const validMoves = calculateValidMoves(context.board, event.position);
        resolve(validMoves);
      });
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
        MOVE_PIECE: {
          target: 'idle',
          guard: 'isValidMoveTarget',
          actions: ['movePiece', 'storeStateAction']
        },
        RESET_GAME: {
          target: 'idle',
          actions: ['resetGame', 'storeStateAction']
        }
      }
    }
  }
});