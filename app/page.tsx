'use client';
import { useEffect, useMemo, useState } from 'react';
import { initialBoard } from '../lib/chessMachine';
import { useChessMachine } from '../lib/useChessMachine';

export default function Home() {
  // Use our custom chess machine hook to get state and send function
  const [state, send] = useChessMachine();
  
  // Safely extract context values using v5's snapshot pattern
  const board = state.context?.board || initialBoard;
  const currentPlayer = state.context?.currentPlayer || 'white';
  const selectedPiece = state.context?.selectedPiece || null;
  const possibleMoves = state.context?.possibleMoves || [];
  
  // Handlers for chess actions
  const handlePieceClick = (row: number, col: number) => {
    // Convert to numbers and verify they are valid
    const rowNum = Number(row);
    const colNum = Number(col);
    
    if (isNaN(rowNum) || isNaN(colNum)) {
      console.error('Invalid position values in handlePieceClick:', { row, col });
      return;
    }
    
    // Debug the values being sent
    console.log('Sending SELECT_PIECE event with position:', { row: rowNum, col: colNum });
    
    // Create a properly typed event with XState v5 syntax
    const selectPieceEvent = {
      type: 'SELECT_PIECE' as const,
      position: { 
        row: rowNum, 
        col: colNum 
      }
    };
    
    // Debug the full event
    console.log('Full event object:', selectPieceEvent);
    
    try {
      // Send the event using v5 style
      send(selectPieceEvent);
    } catch (error) {
      console.error('Error sending SELECT_PIECE event:', error);
    }
  };
  
    const handleResetGame = () => {
    send({ type: 'RESET_GAME' as const });
  };
  
  // We no longer need this function as moves are calculated by the state machine
  // Keeping a comment here for reference

  // Using state from the XState machine instead of local state
  // The board and currentPlayer are now managed by the state machine
  
  // We still need these local states for UI purposes
  const [validMoves, setValidMoves] = useState<{row: number, col: number}[]>([]);
  const [lastMove, setLastMove] = useState<{from: {row: number, col: number}, to: {row: number, col: number}} | null>(null);

  // Handle cell click - using the state machine
  const handleCellClick = (row: number, col: number) => {
    // Ensure row and col are numbers (not strings)
    const rowNum = Number(row);
    const colNum = Number(col);
    
    // Check if the conversion resulted in valid numbers
    if (isNaN(rowNum) || isNaN(colNum)) {
      console.error('Invalid coordinates passed to handleCellClick:', { row, col });
      return;
    }
    
    console.log('handleCellClick called with:', { 
      rowNum, 
      colNum, 
      typeof: { row: typeof rowNum, col: typeof colNum },
      isNaN: { row: isNaN(rowNum), col: isNaN(colNum) }
    });
    
    // Create a proper position object that will be used in events
    const position = { row: rowNum, col: colNum };
    
    // Get the piece at clicked position
    const clickedPiece = board[rowNum][colNum];
    
    // If there's a selected piece and we're clicking on a different cell
    if (selectedPiece) {
      // Check if we're clicking on a possible move target
      const isMovingTo = possibleMoves.some(move => move.row === rowNum && move.col === colNum);
      
      if (isMovingTo) {
        // If clicking on a valid move target, send MOVE_PIECE event
        console.log('Moving piece to:', position);
        handleMovePiece(rowNum, colNum);
        
        // Update last move for highlighting
        setLastMove({
          from: {row: selectedPiece.row, col: selectedPiece.col},
          to: {row: rowNum, col: colNum}
        });
        
        // Clear valid moves display since the move is now complete
        setValidMoves([]);
      } else if (board[rowNum][colNum] && 
                ((board[rowNum][colNum].charAt(0) === 'w' && currentPlayer === 'white') || 
                 (board[rowNum][colNum].charAt(0) === 'b' && currentPlayer === 'black'))) {
        // If clicking on another of our pieces, select that piece instead
        console.log('Selecting different piece:', position);
        handlePieceClick(rowNum, colNum);
        
        // The valid moves will be calculated by the state machine and available in possibleMoves
      setValidMoves([...possibleMoves]);
      } else {
        // If clicking elsewhere, just try selecting/deselecting
        console.log('Deselecting current piece');
        handlePieceClick(rowNum, colNum);
        setValidMoves([]);
      }
    }      // If no piece is selected yet, select one if it belongs to the current player
    else if (clickedPiece && 
        ((clickedPiece.charAt(0) === 'w' && currentPlayer === 'white') || 
         (clickedPiece.charAt(0) === 'b' && currentPlayer === 'black'))) {
      
      // Use the state machine's handler
      handlePieceClick(rowNum, colNum);
      
      // The valid moves will come from the state machine's context
      setValidMoves([...possibleMoves]);
    }
  };

  // Reset game function - using state machine's handler
  const resetGame = () => {
    handleResetGame(); // Use the state machine's reset function
    setValidMoves([]);
    setLastMove(null);
  };

  // Chess piece symbols with improved rendering
  const getPieceSymbol = (piece: string): string => {
    if (!piece) return '';
    
    const pieceType = piece.charAt(1);
    const isWhite = piece.charAt(0) === 'w';
    
    // Using larger Unicode chess symbols for better visibility
    switch (pieceType) {
      case 'K': return isWhite ? '♔' : '♚';
      case 'Q': return isWhite ? '♕' : '♛';
      case 'R': return isWhite ? '♖' : '♜';
      case 'B': return isWhite ? '♗' : '♝';
      case 'N': return isWhite ? '♘' : '♞';
      case 'P': return isWhite ? '♙' : '♟';
      default: return piece;
    }
  };

  // New function to handle moving pieces
  const handleMovePiece = (row: number, col: number) => {
    // Convert to numbers and verify they are valid
    const rowNum = Number(row);
    const colNum = Number(col);
    
    if (isNaN(rowNum) || isNaN(colNum)) {
      console.error('Invalid position values in handleMovePiece:', { row, col });
      return;
    }
    
    // Debug the values being sent
    console.log('Sending MOVE_PIECE event with position:', { row: rowNum, col: colNum });
    
    // Create a properly typed event with XState v5 syntax
    const movePieceEvent = {
      type: 'MOVE_PIECE' as const,
      position: { 
        row: rowNum, 
        col: colNum 
      }
    };
    
    // Debug the full event
    console.log('Full event object:', movePieceEvent);
    
    try {
      // Send the event using v5 style
      send(movePieceEvent);
    } catch (error) {
      console.error('Error sending MOVE_PIECE event:', error);
    }
  };

  // Use an effect to update valid moves whenever possibleMoves changes in the state machine
  // Using useMemo to wrap the possibleMoves value to avoid unnecessary re-renders
  const memoizedPossibleMoves = useMemo(() => possibleMoves || [], [possibleMoves]);
  
  useEffect(() => {
    setValidMoves([...memoizedPossibleMoves]);
  }, [memoizedPossibleMoves]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900">
      <div className="z-10 w-full max-w-2xl items-center justify-between font-mono text-sm flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-white mb-2">Chess Game</h1>
        
        {/* Chess Board Container */}
        <div className="relative bg-gray-800 p-10 rounded-lg shadow-xl">
          {/* Player Info - Top (Black) */}
          <div className="flex justify-between items-center w-full mb-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-black border-2 border-white shadow-sm"></div>
              <span className="text-gray-100 font-medium">poluruc</span>
            </div>
            {currentPlayer === 'black' && (
              <div className="px-3 py-1 bg-blue-600 rounded-md text-white text-xs font-semibold shadow-md">
                Current turn
              </div>
            )}
          </div>
          
          {/* Chess Board with border */}
          <div className="border-[6px] border-amber-950 rounded-sm overflow-hidden shadow-xl">
            {/* Chess Board */}
            <div className="w-[480px] h-[480px] grid grid-cols-8 grid-rows-8 relative shadow-inner">
              {/* Board coordinates - files (columns) */}
              <div className="absolute -bottom-7 left-0 right-0 flex justify-around text-gray-300 text-sm font-semibold">
                {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(file => (
                  <span key={file} className="w-[60px] text-center">{file}</span>
                ))}
              </div>
              
              {/* Board coordinates - ranks (rows) */}
              <div className="absolute -left-7 top-0 bottom-0 flex flex-col justify-around text-gray-300 text-sm font-semibold">
                {['8', '7', '6', '5', '4', '3', '2', '1'].map(rank => (
                  <span key={rank} className="h-[60px] flex items-center">{rank}</span>
                ))}
              </div>
              
              {/* Chess squares and pieces */}
              {board.map((row, rowIndex) => (
                row.map((cell, colIndex) => {
                  // Determine cell color
                  const isBlack = (rowIndex + colIndex) % 2 === 1;
                  // Cell styling
                  const cellClass = isBlack 
                    ? 'bg-amber-800 hover:bg-amber-700' 
                    : 'bg-amber-100 hover:bg-amber-50';

                  return (
                    <div 
                      key={`${rowIndex}-${colIndex}`} 
                      className={`
                        ${cellClass} 
                        flex items-center justify-center 
                        cursor-pointer 
                        w-[60px] h-[60px]
                        ${selectedPiece && selectedPiece.row === rowIndex && selectedPiece.col === colIndex ? 
                          'ring-4 ring-blue-500 ring-inset z-10' : ''}
                        ${validMoves.some(move => move.row === rowIndex && move.col === colIndex) ? 
                          cell ? 'ring-4 ring-red-500 ring-inset' : 'after:content-[""] after:w-4 after:h-4 after:bg-green-500 after:rounded-full after:opacity-60' : ''}
                        ${lastMove && ((lastMove.from.row === rowIndex && lastMove.from.col === colIndex) || 
                                       (lastMove.to.row === rowIndex && lastMove.to.col === colIndex)) ? 
                          'bg-yellow-500 bg-opacity-30' : ''}
                      `}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {cell && (
                        <div 
                          className={`
                            text-5xl font-bold 
                            ${cell.charAt(0) === 'w' 
                              ? isBlack 
                                ? 'text-white drop-shadow-[0_0_2px_#000]' 
                                : 'text-white drop-shadow-[0_0_3px_#000]' 
                              : 'text-gray-900'
                            }
                            transform transition-transform hover:scale-110
                          `}
                          style={{
                            textShadow: cell.charAt(0) === 'w' 
                              ? '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' 
                              : 'none'
                          }}
                        >
                          {getPieceSymbol(cell)}
                        </div>
                      )}
                    </div>
                  );
                })
              ))}
            </div>
          </div>
          
          {/* Player Info - Bottom (White) */}
          <div className="flex justify-between items-center w-full mt-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-400 shadow-sm"></div>
              <span className="text-gray-100 font-medium">VCisneiros</span>
            </div>
            {currentPlayer === 'white' && (
              <div className="px-3 py-1 bg-blue-600 rounded-md text-white text-xs font-semibold shadow-md">
                Current turn
              </div>
            )}
          </div>
          
          {/* Game Controls */}
          <div className="mt-6 flex justify-center">
            <button 
              onClick={resetGame} 
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 transition-colors font-medium shadow-lg"
            >
              Reset Game
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
