import { setup } from 'xstate';
import { ChessContext } from '../../lib/chessTypes';

// Create a simple test machine that just stores the context
export const createTestMachine = (context: ChessContext) => {
  return setup({
    types: {
      context: {} as ChessContext,
    }
  }).createMachine({
    id: 'testChess',
    initial: 'idle',
    context,
    states: {
      idle: {}
    }
  });
};
