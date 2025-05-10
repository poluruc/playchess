'use client';
import { useSelector } from '@xstate/react';
import chessService from '../lib/chessService';

export default function Home() {
  // No need for useEffect to start/stop the service 
  // since it's already started in chessService.ts
  
  // Use useSelector instead of useActor for an ActorRef in XState v5
  const state = useSelector(chessService, state => state);
  const send = chessService.send;
  
  // Destructure the context from state
  const { board, currentPlayer, selectedPiece, possibleMoves } = state.context;
  
  // Handler for selecting a piece
  const handleSelectPiece = (row: number, col: number) => {
    send({ type: 'SELECT_PIECE' as const, position: { row, col } });
  };
  
  // Handler for moving a piece
  const handleMovePiece = (row: number, col: number) => {
    if (selectedPiece) {
      send({ type: 'MOVE_PIECE' as const, position: { row, col } });
    }
  };
  
  // Handler for resetting the game
  const handleResetGame = () => {
    send({ type: 'RESET_GAME' as const });
  };
  
  // Display the game based on state machine context...
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold">Chess Game using XState v5</h2>
      <p>Current player: {currentPlayer}</p>
      
      <div className="grid grid-cols-8 gap-1 my-4">
        {board.map((row, rowIndex) => 
          row.map((cell, colIndex) => (
            <div 
              key={`${rowIndex}-${colIndex}`}
              className={`
                w-12 h-12 flex items-center justify-center
                ${(rowIndex + colIndex) % 2 === 0 ? 'bg-amber-100' : 'bg-amber-800'}
                ${selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex ? 
                  'ring-2 ring-blue-500' : ''}
                ${possibleMoves.some(move => move.row === rowIndex && move.col === colIndex) ?
                  'ring-2 ring-green-500' : ''}
                cursor-pointer
              `}
              onClick={() => {
                if (selectedPiece && possibleMoves.some(move => 
                  move.row === rowIndex && move.col === colIndex)) {
                  handleMovePiece(rowIndex, colIndex);
                } else {
                  handleSelectPiece(rowIndex, colIndex);
                }
              }}
            >
              {cell && (
                <span className={`text-xl ${cell.startsWith('w') ? 'text-white' : 'text-black'}`}>
                  {(() => {
                    const pieceType = cell.charAt(1);
                    switch (pieceType) {
                      case 'K': return cell.startsWith('w') ? '♔' : '♚';
                      case 'Q': return cell.startsWith('w') ? '♕' : '♛';
                      case 'R': return cell.startsWith('w') ? '♖' : '♜';
                      case 'B': return cell.startsWith('w') ? '♗' : '♝';
                      case 'N': return cell.startsWith('w') ? '♘' : '♞';
                      case 'P': return cell.startsWith('w') ? '♙' : '♟';
                      default: return cell;
                    }
                  })()}
                </span>
              )}
            </div>
          ))
        )}
      </div>
      
      <button 
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded" 
        onClick={handleResetGame}
      >
        Reset Game
      </button>
    </div>
  );
}
