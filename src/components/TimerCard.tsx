import { useState, useEffect } from 'react';
import { Timer } from '../types/timer';
import { timerApi } from '../api/timerApi';

// ❌ PROBLEM 1: This component is way too large (300+ lines)
// ❌ PROBLEM 2: Business logic mixed with JSX
// ❌ PROBLEM 3: Interval IDs stored in state (causes re-renders)
// ❌ PROBLEM 4: No cleanup for intervals
// ❌ PROBLEM 5: API calls inside render logic
// ❌ PROBLEM 6: Missing dependency arrays in useEffect
// ❌ PROBLEM 7: Excessive useState for derived values
// ❌ PROBLEM 8: No useMemo for expensive calculations
// ❌ PROBLEM 9: Inline callbacks (causes child re-renders)
// ❌ PROBLEM 10: Duplicated timer logic

interface TimerCardProps {
  timer: Timer;
  onUpdate: (timer: Timer) => void;
  onDelete: (id: string) => void;
}

export const TimerCard: React.FC<TimerCardProps> = ({ timer, onUpdate, onDelete }) => {
  // ❌ PROBLEM: Interval ID stored in state causes unnecessary re-renders
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(timer.elapsed);
  const [isRunning, setIsRunning] = useState(timer.isRunning);
  const [name, setName] = useState(timer.name);
  const [description, setDescription] = useState(timer.description);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ❌ PROBLEM: Derived values recalculated on every render (no useMemo)
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Calculate percentage of day (expensive calculation, no memoization)
  const percentOfDay = (elapsed / 86400) * 100;
  const progressColor =
    percentOfDay > 50 ? 'bg-red-500' : percentOfDay > 25 ? 'bg-yellow-500' : 'bg-green-500';

  // ❌ PROBLEM: API call in useEffect without proper error handling
  useEffect(() => {
    // Sync with API on mount
    timerApi.getTimer(timer.id).then(response => {
      if (response.data) {
        setElapsed(response.data.elapsed);
        setIsRunning(response.data.isRunning);
      }
    });
  }, [timer.id]);

  // ❌ PROBLEM: Timer logic with no cleanup
  useEffect(() => {
    if (isRunning) {
      // ❌ PROBLEM: Storing interval ID in state
      const id = window.setInterval(() => {
        setElapsed(prev => prev + 1);

        // ❌ PROBLEM: API call on every tick (performance issue)
        timerApi.updateTimer(timer.id, { elapsed: elapsed + 1 });
      }, 1000);

      setIntervalId(id);
      return () => {
        clearInterval(id);
      };
    } else {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    }
  }, [isRunning, intervalId, elapsed, timer.id]);

  // ❌ PROBLEM: Inline callback (causes re-renders in child components)
  const handleStart = () => {
    setIsRunning(true);
    setError(null);

    // ❌ PROBLEM: API call in event handler without proper async handling
    timerApi
      .updateTimer(timer.id, {
        isRunning: true,
        startedAt: Date.now(),
      })
      .then(response => {
        if (response.error) {
          setError(response.error);
          setIsRunning(false);
        } else {
          onUpdate(response.data);
        }
      });
  };

  // ❌ PROBLEM: Inline callback (not memoized)
  const handlePause = () => {
    setIsRunning(false);

    timerApi
      .updateTimer(timer.id, {
        isRunning: false,
        elapsed: elapsed,
      })
      .then(response => {
        if (response.error) {
          setError(response.error);
        } else {
          onUpdate(response.data);
        }
      });
  };

  // ❌ PROBLEM: Inline callback
  const handleReset = () => {
    setElapsed(0);
    setIsRunning(false);

    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    timerApi
      .updateTimer(timer.id, {
        elapsed: 0,
        isRunning: false,
      })
      .then(response => {
        if (response.error) {
          setError(response.error);
        } else {
          onUpdate(response.data);
        }
      });
  };

  // ❌ PROBLEM: Inline callback
  const handleSave = () => {
    setIsSaving(true);
    setError(null);

    timerApi
      .updateTimer(timer.id, {
        name,
        description,
      })
      .then(response => {
        setIsSaving(false);
        if (response.error) {
          setError(response.error);
        } else {
          setIsEditing(false);
          onUpdate(response.data);
        }
      })
      .catch(() => {
        setIsSaving(false);
        setError('Failed to save timer');
      });
  };

  // ❌ PROBLEM: Inline callback
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this timer?')) {
      if (intervalId) {
        clearInterval(intervalId);
      }

      timerApi
        .deleteTimer(timer.id)
        .then(() => {
          onDelete(timer.id);
        })
        .catch(() => {
          setError('Failed to delete timer');
        });
    }
  };

  // ❌ PROBLEM: Inline callback
  const handleCancel = () => {
    setName(timer.name);
    setDescription(timer.description);
    setIsEditing(false);
    setError(null);
  };

  // ❌ PROBLEM: Complex rendering logic in component body
  const renderEditMode = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timer Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter timer name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter description"
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // ❌ PROBLEM: Complex rendering logic
  const renderViewMode = () => {
    return (
      <>
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800">{timer.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{timer.description}</p>
        </div>

        <div className="mb-4">
          <div className="text-4xl font-mono font-bold text-center text-gray-900">
            {formattedTime}
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div
              className={`${progressColor} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${Math.min(percentOfDay, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Start
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            >
              Pause
            </button>
          )}

          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Reset
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="flex-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {isEditing ? renderEditMode() : renderViewMode()}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Created: {new Date(timer.createdAt).toLocaleDateString()}
        </div>
        {timer.startedAt && (
          <div className="text-xs text-gray-500">
            Started: {new Date(timer.startedAt).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};
