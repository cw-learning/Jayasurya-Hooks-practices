import { useState, useEffect } from 'react';
import { Timer } from '../types/timer';
import { timerApi } from '../api/timerApi';
import { TimerCard } from './TimerCard';

// ❌ PROBLEM 1: Component too large (400+ lines)
// ❌ PROBLEM 2: Excessive useState instead of useReducer
// ❌ PROBLEM 3: Duplicated timer logic from TimerCard
// ❌ PROBLEM 4: No custom hooks
// ❌ PROBLEM 5: Derived values calculated on every render (no useMemo)
// ❌ PROBLEM 6: Inline callbacks everywhere
// ❌ PROBLEM 7: API calls in render logic
// ❌ PROBLEM 8: No error boundaries
// ❌ PROBLEM 9: Missing dependency arrays
// ❌ PROBLEM 10: Poor separation of concerns

export const TimerList: React.FC = () => {
  // ❌ PROBLEM: Too many useState calls, should use useReducer
  const [timers, setTimers] = useState<Timer[]>([]);
  const [filteredTimers, setFilteredTimers] = useState<Timer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'running' | 'paused'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'elapsed' | 'createdAt'>('createdAt');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTimerName, setNewTimerName] = useState('');
  const [newTimerDescription, setNewTimerDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // ❌ PROBLEM: Derived value calculated on every render (should use useMemo)
  const totalElapsed = timers.reduce((sum, timer) => sum + timer.elapsed, 0);
  const runningCount = timers.filter(t => t.isRunning).length;
  const pausedCount = timers.filter(t => !t.isRunning).length;
  // const averageElapsed = timers.length > 0 ? totalElapsed / timers.length : 0; // Unused but shows anti-pattern

  // ❌ PROBLEM: Formatting logic repeated (should be in utility or custom hook)
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ❌ PROBLEM: API call in useEffect without proper cleanup or loading states
  useEffect(() => {
    loadTimers();
  }, []); // ❌ Should include loadTimers in deps or use useCallback

  // ❌ PROBLEM: Async function defined inside component (not memoized)
  const loadTimers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await timerApi.getAllTimers();
      if (response.error) {
        setError(response.error);
      } else {
        setTimers(response.data);
      }
    } catch {
      setError('Failed to load timers');
    } finally {
      setIsLoading(false);
    }
  };

  // ❌ PROBLEM: Filter logic runs on every render (should use useMemo)
  useEffect(() => {
    let filtered = [...timers];

    // Apply status filter
    if (filter === 'running') {
      filtered = filtered.filter(t => t.isRunning);
    } else if (filter === 'paused') {
      filtered = filtered.filter(t => !t.isRunning);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        t =>
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'elapsed') {
        return b.elapsed - a.elapsed;
      } else {
        return b.createdAt - a.createdAt;
      }
    });

    setFilteredTimers(filtered);
  }, [timers, filter, searchTerm, sortBy]);

  // ❌ PROBLEM: Inline callback (not memoized with useCallback)
  const handleTimerUpdate = (updatedTimer: Timer) => {
    setTimers(prev => prev.map(t => (t.id === updatedTimer.id ? updatedTimer : t)));
  };

  // ❌ PROBLEM: Inline callback
  const handleTimerDelete = (id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  // ❌ PROBLEM: Inline callback
  const handleCreateTimer = async () => {
    if (!newTimerName.trim()) {
      setError('Timer name is required');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await timerApi.createTimer({
        name: newTimerName,
        description: newTimerDescription,
        elapsed: 0,
        isRunning: false,
        createdAt: Date.now(),
      });

      if (response.error) {
        setError(response.error);
      } else {
        setTimers(prev => [...prev, response.data]);
        setNewTimerName('');
        setNewTimerDescription('');
        setShowAddForm(false);
      }
    } catch {
      setError('Failed to create timer');
    } finally {
      setIsCreating(false);
    }
  };

  // ❌ PROBLEM: Inline callback
  const handleStartAll = () => {
    // ❌ PROBLEM: Multiple API calls in loop (should be batched)
    timers.forEach(timer => {
      if (!timer.isRunning) {
        timerApi
          .updateTimer(timer.id, { isRunning: true, startedAt: Date.now() })
          .then(response => {
            if (response.data) {
              handleTimerUpdate(response.data);
            }
          });
      }
    });
  };

  // ❌ PROBLEM: Inline callback
  const handlePauseAll = () => {
    timers.forEach(timer => {
      if (timer.isRunning) {
        timerApi.updateTimer(timer.id, { isRunning: false }).then(response => {
          if (response.data) {
            handleTimerUpdate(response.data);
          }
        });
      }
    });
  };

  // ❌ PROBLEM: Inline callback
  const handleResetAll = () => {
    if (window.confirm('Are you sure you want to reset all timers?')) {
      timers.forEach(timer => {
        timerApi.updateTimer(timer.id, { elapsed: 0, isRunning: false }).then(response => {
          if (response.data) {
            handleTimerUpdate(response.data);
          }
        });
      });
    }
  };

  // ❌ PROBLEM: Complex rendering logic not extracted
  const renderStats = () => {
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600 font-medium">Total Timers</div>
          <div className="text-2xl font-bold text-blue-900">{timers.length}</div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600 font-medium">Running</div>
          <div className="text-2xl font-bold text-green-900">{runningCount}</div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-sm text-yellow-600 font-medium">Paused</div>
          <div className="text-2xl font-bold text-yellow-900">{pausedCount}</div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-600 font-medium">Total Time</div>
          <div className="text-2xl font-bold text-purple-900">{formatTime(totalElapsed)}</div>
        </div>
      </div>
    );
  };

  // ❌ PROBLEM: Complex rendering logic
  const renderControls = () => {
    return (
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search timers..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filter}
            onChange={e => setFilter(e.target.value as string)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Timers</option>
            <option value="running">Running</option>
            <option value="paused">Paused</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as string)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="elapsed">Sort by Time</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            {showAddForm ? 'Cancel' : 'Add Timer'}
          </button>

          <button
            onClick={handleStartAll}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Start All
          </button>

          <button
            onClick={handlePauseAll}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
          >
            Pause All
          </button>

          <button
            onClick={handleResetAll}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Reset All
          </button>

          <button
            onClick={loadTimers}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  };

  // ❌ PROBLEM: Complex form rendering
  const renderAddForm = () => {
    if (!showAddForm) return null;

    return (
      <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Create New Timer</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timer Name *</label>
            <input
              type="text"
              value={newTimerName}
              onChange={e => setNewTimerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter timer name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newTimerDescription}
              onChange={e => setNewTimerDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter description"
              rows={3}
            />
          </div>

          <button
            onClick={handleCreateTimer}
            disabled={isCreating}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300"
          >
            {isCreating ? 'Creating...' : 'Create Timer'}
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading timers...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Timer Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage and track your timers</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {renderStats()}
      {renderControls()}
      {renderAddForm()}

      {filteredTimers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No timers found</p>
          <p className="text-gray-400 text-sm mt-2">
            {searchTerm || filter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first timer to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTimers.map(timer => (
            <TimerCard
              key={timer.id}
              timer={timer}
              onUpdate={handleTimerUpdate}
              onDelete={handleTimerDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
