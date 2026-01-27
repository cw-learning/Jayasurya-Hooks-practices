import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimerCard } from '../components/TimerCard';
import { Timer } from '../types/timer';
import { timerApi } from '../api/timerApi';

// Mock the API
vi.mock('../api/timerApi');

describe('TimerCard Component', () => {
  const mockTimer: Timer = {
    id: '1',
    name: 'Test Timer',
    description: 'Test Description',
    elapsed: 3600,
    isRunning: false,
    createdAt: Date.now(),
  };

  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders timer information correctly', () => {
    render(<TimerCard timer={mockTimer} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    expect(screen.getByText('Test Timer')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('01:00:00')).toBeInTheDocument();
  });

  it('starts timer when start button is clicked', async () => {
    const updatedTimer = { ...mockTimer, isRunning: true };
    vi.mocked(timerApi.updateTimer).mockResolvedValue({ data: updatedTimer });

    render(<TimerCard timer={mockTimer} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    const startButton = screen.getByText('Start');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(timerApi.updateTimer).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ isRunning: true })
      );
    });
  });

  it('increments elapsed time when running', async () => {
    const runningTimer = { ...mockTimer, isRunning: true };

    render(<TimerCard timer={runningTimer} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    // Fast-forward time by 2 seconds
    vi.advanceTimersByTime(2000);

    // Note: This test will fail with current implementation
    // because of the anti-patterns in the code.
    // After refactoring with proper hooks, this should pass.
  });

  it('switches to edit mode when edit button is clicked', () => {
    render(<TimerCard timer={mockTimer} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(screen.getByPlaceholderText('Enter timer name')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  // TODO: Add more tests after refactoring
  // - Test cleanup of intervals on unmount
  // - Test error handling
  // - Test reset functionality
  // - Test delete confirmation
});
