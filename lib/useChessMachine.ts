'use client';
import { useSelector } from '@xstate/react';
import { useEffect } from 'react';
import chessService from './chessService';

/**
 * Custom hook for using the chess machine with proper V5 setup
 */
export function useChessMachine() {
  // Start the actor when the component mounts
  useEffect(() => {
    // Log when the actor is started
    console.log('Chess actor initialized:', chessService.id);
    
    // Make actor available in dev tools for debugging
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as Window & typeof globalThis & { __chessActor: typeof chessService }).__chessActor = chessService;
    }
    
    // Detect check status on initialization with more thorough approach
    // First, send the CHECK_BOARD event
    chessService.send({ type: 'CHECK_BOARD' });
    
    // Then perform a more thorough check with multiple attempts to ensure initialization completes
    const checkForCheckCondition = (attempt = 1) => {
      // Get the current snapshot
      const snapshot = chessService.getSnapshot();
      
      // If we have a board and player, check for check directly
      if (snapshot.context?.board && snapshot.context?.currentPlayer) {
        import('./chessMachine').then(({ isKingInCheck }) => {
          // Check both white and black king status
          const whiteInCheck = isKingInCheck(snapshot.context.board, 'white', snapshot.context.castlingRights);
          const blackInCheck = isKingInCheck(snapshot.context.board, 'black', snapshot.context.castlingRights);
          const currentPlayer = snapshot.context.currentPlayer;
          const currentCheck = currentPlayer === 'white' ? whiteInCheck : blackInCheck;
          
          console.log(`Check detection run (attempt ${attempt}): White in check: ${whiteInCheck}, Black in check: ${blackInCheck}`);
          
          // If the check status doesn't match what's in the state
          if (currentCheck !== snapshot.context.isCheck) {
            console.log('Direct check detection found check mismatch in state, forcing update');
            chessService.send({ 
              type: 'CHECK_DETECTION',
              isCheck: currentCheck,
              message: `${currentPlayer === 'white' ? 'White' : 'Black'} is in check!`
            });
          }
          
          // Always follow up with a CHECK_BOARD event to ensure the state is updated
          chessService.send({ type: 'CHECK_BOARD' });
        });
      } else if (attempt < 3) {
        // Retry with increasing delays if the context isn't loaded yet
        console.log(`Check detection waiting for context (attempt ${attempt})`);
        setTimeout(() => checkForCheckCondition(attempt + 1), attempt * 100);
      }
    };
    
    // Run the check after a short delay to ensure initialization
    setTimeout(() => checkForCheckCondition(), 100);
    
    // Clean up on unmount - optional as actors can persist
    return () => {
      // You might want to stop the actor or leave it running
      // chessService.stop();
    };
  }, []);
  
  // Use useSelector instead of useActor with the ActorRef
  const state = useSelector(chessService, (state) => state);
  const send = chessService.send;
  
  // Return the state and send function
  return [state, send] as const;
}