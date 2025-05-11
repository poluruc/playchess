'use client';

import { createActor } from 'xstate';
import { chessMachine } from './chessMachine';

// Create an actor using v5's actor model with proper inspection setup
const chessService = createActor(chessMachine, {
  // Set up inspection to monitor state changes
  inspect: (inspectable) => {
    if (inspectable.type === '@xstate.snapshot') {
      // This runs after the machine is initialized, but we'll handle the check 
      // detection via the explicit CHECK_BOARD event sent in useChessMachine
      console.log('Chess machine state updated:', (inspectable.snapshot as unknown as { value: unknown }).value);
    }
  },
});

// Start the service
chessService.start();

// Export the service as default
export default chessService;