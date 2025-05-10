'use client';

import { createActor } from 'xstate';
import { chessMachine } from './chessMachine';

// Create an actor using v5's actor model with proper inspection setup
const chessService = createActor(chessMachine);

// Start the service
chessService.start();

// Export the service as default
export default chessService;