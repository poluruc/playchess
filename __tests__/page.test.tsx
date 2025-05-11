import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import Home from '../app/page';
import { useChessMachine } from '../lib/useChessMachine';

// Mock the useChessMachine hook
jest.mock('../lib/useChessMachine', () => ({
  useChessMachine: jest.fn()
}));

describe('Home', () => {
  const mockSend = jest.fn();
  const mockState = {
    value: 'idle',
    context: {
      board: [
        ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
        ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
        ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'],
      ],
      currentPlayer: 'white',
      selectedPiece: null,
      possibleMoves: []
    }
  };
  
  beforeEach(() => {
    (useChessMachine as jest.Mock).mockReturnValue([mockState, mockSend]);
  });
  
  it('renders a chess board', () => {
    render(<Home />);
    expect(screen.getByText('Chess Game')).toBeInTheDocument();
  });
  
  it('calls send with SELECT_PIECE when a piece is clicked', () => {
    render(<Home />);
    
    // Find a chess piece (white pawn at 6,0) by its data-testid and click it
    const whitePawnCell = screen.getByTestId('cell-6-0');
    
    fireEvent.click(whitePawnCell);
    
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SELECT_PIECE',
        position: expect.objectContaining({ row: 6, col: 0 })
      })
    );
  });
  
  it('calls send with RESET_GAME when the reset button is clicked', () => {
    render(<Home />);
    
    const resetButton = screen.getByText('Reset Game');
    fireEvent.click(resetButton);
    
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'RESET_GAME' })
    );
  });
});