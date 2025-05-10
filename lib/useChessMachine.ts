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
      (window as any).__chessActor = chessService;
    }
    
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