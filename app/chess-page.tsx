'use client';
import { useActor } from '@xstate/react';
import { useEffect } from 'react';
import chessService from '../lib/chessService';

export default function Home() {
  // Start the service when the component mounts
  useEffect(() => {
    chessService.start();
    
    // Stop the service when the component unmounts
    return () => chessService.stop();
  }, []);
  
  // Get the current state and send function from the service
  const [state, send] = useActor(chessService);
  
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
    send({ type: 'RESET_GAME' });
  };
  
  // Function to calculate valid moves for a piece (simplified version)
  const getValidMoves = (board: string[][], row: number, col: number): {row: number, col: number}[] => {
    const piece = board[row][col];
    if (!piece) return [];
    
    const pieceType = piece.charAt(1);
    const isWhite = piece.charAt(0) === 'w';
    // Rest of the existing getValidMoves function
    // ... (keep the existing logic)
    
    return []; // Replace this with your existing logic
  };
  
  // Rest of your component code
  // ... (keep the existing render logic but use the state from XState)
  
  return (
    <div>
      <h1>Chess Game</h1>
      {/* Render your chess board using the state from XState */}
      {/* Update your existing rendering to use the state machine context */}
    </div>
  );
}
