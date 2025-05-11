'use client';
import { useEffect, useMemo, useState } from 'react';
import { toast } from "sonner";
import { initialBoard } from '../lib/chessMachine';
import { useChessMachine } from '../lib/useChessMachine';

export default function Home() {
  // Use our custom chess machine hook to get state and send function
  const [state, send] = useChessMachine();

  // Safely extract context values using v5's snapshot pattern
  const board = state.context?.board || initialBoard;
  const currentPlayer = state.context?.currentPlayer || 'white';
  const selectedPiece = state.context?.selectedPiece || null;
  // Wrap possibleMoves in useMemo
  const possibleMoves = useMemo(() => state.context?.possibleMoves || [], [state.context?.possibleMoves]);
  const error = state.context?.error;
  const isCheck = state.context?.isCheck || false;
  const isCheckmate = state.context?.isCheckmate || false;
  // const isStalemate = state.context?.isStalemate || false; // Commented out as unused
  const gameOver = state.context?.gameOver || false;
  const winner = state.context?.winner || null;

  // Show toast when error changes
  useEffect(() => {
    if (error) {
      toast.error(error, {
        duration: 3000,
      });
    }
  }, [error]);
  
  // Enhanced check detection when board changes
  useEffect(() => {
    // Import the check detection and necessary helper functions
    import('../lib/chessMachine').then(({ isKingInCheck, findKingPosition }) => {
      // First check if the current player is in check
      const isCurrentlyInCheck = isKingInCheck(board, currentPlayer, state.context.castlingRights);
      
      // If there's a mismatch between actual check status and state
      if (isCurrentlyInCheck !== isCheck) {
        console.log(`Check status mismatch - Actual: ${isCurrentlyInCheck}, State: ${isCheck}`);
        
        // Get king position for better logging
        const kingPos = findKingPosition(board, currentPlayer);
        if (kingPos) {
          console.log(`${currentPlayer}'s king position: [${kingPos.row},${kingPos.col}]`);
          
          // Additional diagnostic for pieces attacking the king
          if (isCurrentlyInCheck) {
            console.log(`Looking for pieces attacking ${currentPlayer}'s king at [${kingPos.row},${kingPos.col}]`);
          }
        }
        
        // Update the state machine to reflect the actual check status
        send({ type: 'CHECK_BOARD' });
        
        // Show a notification to the user about the check
        if (isCurrentlyInCheck) {
          toast.error(`${currentPlayer === 'white' ? 'White' : 'Black'} is in check!`, {
            duration: 3000,
          });
        }
      }
      
      // Check the opponent as well, since they might be in check after the move
      const opponent = currentPlayer === 'white' ? 'black' : 'white';
      const isOpponentInCheck = isKingInCheck(board, opponent, state.context.castlingRights);
      
      if (isOpponentInCheck) {
        console.log(`Opponent (${opponent}) is in check!`);
      }
    });
    
    // REMOVED: Set interval to periodically re-check for check conditions (helps catch edge cases)
    // REMOVED: The interval is actually important as it catches issues that might be missed during normal flow
    // const checkInterval = setInterval(() => {
    //   // Re-check the board state periodically
    //   send({ type: 'CHECK_BOARD' });
    // }, 1500); // More frequent checks for better responsiveness
    
    // REMOVED: Clean up the interval
    // return () => clearInterval(checkInterval);
  }, [board, currentPlayer, isCheck, send, state.context.castlingRights]);
  
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
    // Prevent interactions when the game is over
    if (gameOver) {
      return;
    }
    
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
      // Check if we're clicking on the same piece that's already selected
      const isClickingSelectedPiece = selectedPiece.row === rowNum && selectedPiece.col === colNum;
      
      if (isClickingSelectedPiece) {
        // If clicking on the same piece, use SELECT_PIECE to trigger deselection
        console.log('Clicking on selected piece - should deselect:', position);
        handlePieceClick(rowNum, colNum);
        setValidMoves([]);
      } else {
        // Check if we're clicking on a possible move target
        const isMovingTo = possibleMoves.some(move => move.row === rowNum && move.col === colNum);
        
        // If clicking on any other cell while a piece is selected, treat it as a move attempt
        console.log('Attempting to move piece to:', position);
        handleMovePiece(rowNum, colNum);
        
        // If this was a valid move, update last move for highlighting
        if (isMovingTo) {
          setLastMove({
            from: {row: selectedPiece.row, col: selectedPiece.col},
            to: {row: rowNum, col: colNum}
          });
          
          // Clear valid moves display since the move is now complete
          setValidMoves([]);
        }
      }
    } 
    // If no piece is selected yet and there's a piece at the clicked position
    else if (clickedPiece) {
      // Check if it's the current player's piece
      const isCurrentPlayersPiece = (clickedPiece.charAt(0) === 'w' && currentPlayer === 'white') || 
                                  (clickedPiece.charAt(0) === 'b' && currentPlayer === 'black');
      
      // Always send the SELECT_PIECE event - the state machine will handle validation
      // If it's the opponent's piece, the state machine will set the appropriate error
      handlePieceClick(rowNum, colNum);
      
      // Only update valid moves if it's the current player's piece
      if (isCurrentPlayersPiece) {
        setValidMoves([...possibleMoves]);
      }
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

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-900">
      <div className="z-10 w-full max-w-2xl items-center justify-between font-mono text-sm flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-white mb-2">Chess Game</h1>
        
        {/* Player Info - Top (Black) */}
        <div className="flex justify-between items-center w-full mb-1 px-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-black border-2 border-white shadow-sm"></div>
            <span className="text-gray-100 font-medium">poluruc</span>
            {currentPlayer === 'black' && (
              <>
                {isCheckmate && winner === 'white' && (
                  <span className="text-red-500 font-bold ml-2">CHECKMATE!</span>
                )}
                {isCheck && !isCheckmate && (
                  <span className="text-red-500 font-bold ml-2">CHECK!</span>
                )}
              </>
            )}
          </div>
          {currentPlayer === 'black' && !gameOver && (
            <div className="px-3 py-1 bg-blue-600 rounded-md text-white text-xs font-semibold shadow-md">
              Current turn
            </div>
          )}
        </div>
        
        {/* Main container for board and coordinates */}
        <div className="flex flex-col items-center">
          {/* Row for Ranks and Board */}
          <div className="flex flex-row">
            {/* Rank Coordinates (1-8) */}
            <div className="flex flex-col justify-around items-center w-6 mr-1 text-sm font-bold text-gray-400 h-[320px] sm:h-[400px] md:h-[480px]">
              {ranks.map((rank) => (
                <div
                  key={rank}
                  className="h-[calc(100%/8)] flex items-center justify-center" // Adjusted height to be relative to new parent height
                >
                  {rank}
                </div>
              ))}
            </div>

            {/* Chessboard Grid */}
            <div
              className="grid grid-cols-8 grid-rows-8 w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] md:w-[480px] md:h-[480px] rounded-sm shadow-xl"
            >
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isBlackSquare = (rowIndex + colIndex) % 2 === 1;
                  const cellClass = isBlackSquare 
                    ? 'bg-amber-800 hover:bg-amber-700' 
                    : 'bg-amber-100 hover:bg-amber-50';
                  
                  return (
                    <div 
                      key={`${rowIndex}-${colIndex}`} 
                      data-testid={`cell-${rowIndex}-${colIndex}`} // Added data-testid
                      className={`
                        ${cellClass} 
                        flex items-center justify-center 
                        cursor-pointer 
                        w-full aspect-square // Changed from h-full to aspect-square
                        ${selectedPiece && selectedPiece.row === rowIndex && selectedPiece.col === colIndex ? 
                          'ring-4 ring-blue-500 ring-inset z-10' : ''}
                        ${validMoves.some(move => move.row === rowIndex && move.col === colIndex) ? 
                          cell ? 'ring-4 ring-red-500 ring-inset' : 'after:content-[\\"\\"] after:w-4 after:h-4 after:bg-green-500 after:rounded-full after:opacity-60' : ''}
                        ${lastMove && ((lastMove.from.row === rowIndex && lastMove.from.col === colIndex) || 
                                       (lastMove.to.row === rowIndex && lastMove.to.col === colIndex)) ? 
                          'bg-yellow-500 bg-opacity-30' : ''}
                      `}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {cell && (
                        <div 
                          className={`
                            text-3xl sm:text-4xl md:text-5xl font-bold 
                            ${cell.charAt(0) === 'w' 
                              ? isBlackSquare 
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
              )}
            </div>
          </div>

          {/* File Coordinates (a-h) */}
          <div className="flex flex-row justify-around items-center h-6 mt-1 w-[320px] sm:w-[400px] md:w-[480px] text-sm font-bold text-gray-400">
            {files.map((file) => (
              <div
                key={file}
                className="w-[calc(100%/8)] flex items-center justify-center"
              >
                {file}
              </div>
            ))}
          </div>
        </div>
        
        {/* Player Info - Bottom (White) */}
        <div className="flex justify-between items-center w-full mt-1 px-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-white border-2 border-black shadow-sm"></div>
            <span className="text-gray-100 font-medium">Player</span>
            {currentPlayer === 'white' && (
              <>
                {isCheckmate && winner === 'black' && (
                  <span className="text-red-500 font-bold ml-2">CHECKMATE!</span>
                )}
                {isCheck && !isCheckmate && (
                  <span className="text-red-500 font-bold ml-2">CHECK!</span>
                )}
              </>
            )}
          </div>
          {currentPlayer === 'white' && !gameOver && (
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
        
        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-20 rounded-lg opacity-80">
            <div className="text-3xl font-bold text-white mb-4">
              {isCheckmate ? 
                `${winner === 'white' ? 'White' : 'Black'} wins by checkmate!` : 
                'Game drawn by stalemate!'
              }
            </div>
            <button 
              onClick={resetGame}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 transition-colors font-medium shadow-lg text-lg opacity-100"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}