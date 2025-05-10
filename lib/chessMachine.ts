import { assign, createMachine } from 'xstate';

// Define the context (state) and events
export interface Position {
  row: number;
  col: number;
}

export interface ChessContext {
  board: string[][];
  currentPlayer: 'white' | 'black';
  selectedPiece: Position | null;
  possibleMoves: Position[];
}

export type ChessEvent = 
  | { type: 'SELECT_PIECE'; position: Position }
  | { type: 'MOVE_PIECE'; position: Position }
  | { type: 'RESET_GAME' };

// Create the chess state machine
export const chessMachine = createMachine({
  id: 'chess',
  initial: 'waitingForSelection',
  context: {
    board: initializeBoard(),
    currentPlayer: 'white' as const,
    selectedPiece: null,
    possibleMoves: [],
  },
  states: {
    waitingForSelection: {
      on: {
        SELECT_PIECE: {
          target: 'pieceSelected',
          actions: 'selectPiece',
          guard: ({context, event}) => {
            if (!event || event.type !== 'SELECT_PIECE' || !event.position) {
              return false;
            }
            
            const { row, col } = event.position;
            if (row < 0 || row > 7 || col < 0 || col > 7) {
              return false;
            }
            
            const piece = context.board[row][col];
            if (!piece) {
              return false;
            }
            
            const pieceColor = piece.charAt(0) === 'w' ? 'white' : 'black';
            return pieceColor === context.currentPlayer;
          }
        }
      }
    },
    pieceSelected: {
      on: {
        MOVE_PIECE: {
          target: 'waitingForSelection',
          actions: ['movePiece', 'switchPlayer'],
          guard: ({context, event}) => {
            if (!event || event.type !== 'MOVE_PIECE' || !event.position) {
              return false;
            }
            
            return context.possibleMoves.some(
              move => move.row === event.position.row && move.col === event.position.col
            );
          }
        },
        SELECT_PIECE: [
          {
            target: 'pieceSelected',
            actions: 'selectPiece',
            guard: ({context, event}) => {
              if (!event || event.type !== 'SELECT_PIECE' || !event.position) {
                return false;
              }
              
              const { row, col } = event.position;
              if (row < 0 || row > 7 || col < 0 || col > 7) {
                return false;
              }
              
              const piece = context.board[row][col];
              if (!piece) {
                return false;
              }
              
              const pieceColor = piece.charAt(0) === 'w' ? 'white' : 'black';
              return pieceColor === context.currentPlayer;
            }
          },
          {
            target: 'waitingForSelection',
            actions: 'clearSelection'
          }
        ]
      }
    }
  },
  on: {
    RESET_GAME: {
      actions: 'resetGame',
      target: '.waitingForSelection'
    }
  }
}, {
  actions: {
    selectPiece: assign((context, event: any) => {
      if (event && event.type === 'SELECT_PIECE' && event.position) {
        console.log('Selecting piece:', event.position);
        return {
          selectedPiece: event.position,
          possibleMoves: calculatePossibleMoves(context, event.position)
        };
      }
      return {};
    }),
    clearSelection: assign({
      selectedPiece: () => null,
      possibleMoves: () => []
    }),
    movePiece: assign((context, event) => {
      if (event && typeof event === 'object' && 'type' in event && event.type === 'MOVE_PIECE' && event.position && context.selectedPiece) {
        console.log('Debug - Moving piece from', context.selectedPiece, 'to', event.position);
        const newBoard = context.board.map(row => [...row]);
        const { row: fromRow, col: fromCol } = context.selectedPiece;
        const { row: toRow, col: toCol } = event.position;
        
        // Move the piece
        newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
        newBoard[fromRow][fromCol] = '';
        
        return {
          board: newBoard,
          selectedPiece: null,
          possibleMoves: []
        };
      }
      return {};
    }),
    switchPlayer: assign({
      currentPlayer: (context) => context.currentPlayer === 'white' ? 'black' : 'white'
    }),
    resetGame: assign({
      board: () => initializeBoard(),
      currentPlayer: () => 'white',
      selectedPiece: () => null,
      possibleMoves: () => []
    })
  }
});

// Helper function to initialize the chess board
function initializeBoard(): string[][] {
  const board: string[][] = Array(8).fill(null).map(() => Array(8).fill(''));
  
  // Set up pawns
  for (let i = 0; i < 8; i++) {
    board[1][i] = 'bP'; // Black pawns
    board[6][i] = 'wP'; // White pawns
  }
  
  // Set up the back rows
  const backRow = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  for (let i = 0; i < 8; i++) {
    board[0][i] = 'b' + backRow[i]; // Black back row
    board[7][i] = 'w' + backRow[i]; // White back row
  }
  
  return board;
}

// Helper function to calculate possible moves
function calculatePossibleMoves(
  context: ChessContext,
  position: Position
): Position[] {
  const { row, col } = position;
  const piece = context.board[row][col];
  
  if (!piece) return [];
  
  const pieceType = piece.charAt(1);
  const color = piece.charAt(0) === 'w' ? 'white' : 'black';
  
  // For simplicity, we'll just implement basic pawn movement
  // In a complete chess game, you'd need to implement rules for all piece types
  if (pieceType === 'P') {
    const moves: Position[] = [];
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;
    
    // Move forward one square
    if (
      row + direction >= 0 &&
      row + direction < 8 &&
      context.board[row + direction][col] === ''
    ) {
      moves.push({ row: row + direction, col });
      
      // Move forward two squares from starting position
      if (
        row === startRow &&
        context.board[row + 2 * direction][col] === ''
      ) {
        moves.push({ row: row + 2 * direction, col });
      }
    }
    
    // Capture diagonally
    for (const colOffset of [-1, 1]) {
      if (
        row + direction >= 0 &&
        row + direction < 8 &&
        col + colOffset >= 0 &&
        col + colOffset < 8
      ) {
        const targetPiece = context.board[row + direction][col + colOffset];
        if (
          targetPiece &&
          (color === 'white' ? targetPiece.charAt(0) === 'b' : targetPiece.charAt(0) === 'w')
        ) {
          moves.push({ row: row + direction, col: col + colOffset });
        }
      }
    }
    
    return moves;
  }
  
  // For other piece types, we'd implement their movement rules here
  // For now, returning empty array for non-pawn pieces
  return [];
}