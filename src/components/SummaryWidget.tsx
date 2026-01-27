import { useState, useEffect } from 'react';
import { Timer } from '../types/timer';
import { timerApi } from '../api/timerApi';

// ❌ PROBLEM 1: Duplicated timer logic (3rd time!)
// ❌ PROBLEM 2: No custom hooks for reusable logic
// ❌ PROBLEM 3: Expensive calculations on every render
// ❌ PROBLEM 4: API calls in render logic
// ❌ PROBLEM 5: Interval management issues
// ❌ PROBLEM 6: No useMemo/useCallback

interface SummaryWidgetProps {
  timers?: Timer[];
}

export const SummaryWidget: React.FC<SummaryWidgetProps> = ({ timers: propTimers }) => {
  // ❌ PROBLEM: Duplicated state management
  const [timers, setTimers] = useState<Timer[]>(propTimers || []);
  const [isLoading, setIsLoading] = useState(!propTimers);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // ❌ PROBLEM: Duplicated formatting logic (appears in TimerCard and TimerList too)
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ❌ PROBLEM: Expensive calculations on every render (no useMemo)
  const totalTimers = timers.length;
  const runningTimers = timers.filter(t => t.isRunning);
  const pausedTimers = timers.filter(t => !t.isRunning);
  const totalElapsed = timers.reduce((sum, timer) => sum + timer.elapsed, 0);
  const averageElapsed = totalTimers > 0 ? totalElapsed / totalTimers : 0;
  const longestTimer = timers.reduce(
    (max, timer) => (timer.elapsed > max.elapsed ? timer : max),
    timers[0] || ({ elapsed: 0 } as Timer)
  );
  // const shortestTimer = timers.reduce((min, timer) =>
  //   timer.elapsed < min.elapsed ? timer : min,
  //   timers[0] || { elapsed: Infinity } as Timer
  // ); // Unused but shows anti-pattern

  // ❌ PROBLEM: More expensive calculations
  const todayTimers = timers.filter(t => {
    const today = new Date();
    const timerDate = new Date(t.createdAt);
    return timerDate.toDateString() === today.toDateString();
  });

  const thisWeekTimers = timers.filter(t => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return t.createdAt > weekAgo.getTime();
  });

  const totalRunningTime = runningTimers.reduce((sum, t) => sum + t.elapsed, 0);
  const totalPausedTime = pausedTimers.reduce((sum, t) => sum + t.elapsed, 0);

  // Calculate productivity metrics (expensive!)
  const productivityScore = totalTimers > 0 ? (runningTimers.length / totalTimers) * 100 : 0;

  const completionRate = totalTimers > 0 ? (pausedTimers.length / totalTimers) * 100 : 0;

  // ❌ PROBLEM: API call without proper dependency management
  useEffect(() => {
    if (!propTimers) {
      loadTimers();
    }
  }, [propTimers]);

  // ❌ PROBLEM: Auto-refresh logic with interval issues
  useEffect(() => {
    if (autoRefresh) {
      const id = window.setInterval(() => {
        loadTimers();
        setLastUpdated(new Date());
      }, 5000); // Refresh every 5 seconds

      setRefreshInterval(id);
      return () => {
        clearInterval(id);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh, refreshInterval]);

  // ❌ PROBLEM: Inline async function
  const loadTimers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await timerApi.getAllTimers();
      if (response.error) {
        setError(response.error);
      } else {
        setTimers(response.data);
        setLastUpdated(new Date());
      }
    } catch {
      setError('Failed to load timer data');
    } finally {
      setIsLoading(false);
    }
  };

  // ❌ PROBLEM: Inline callback
  const handleRefresh = () => {
    loadTimers();
  };

  // ❌ PROBLEM: Inline callback
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-600">Loading summary...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-red-600">{error}</div>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Summary Dashboard</h2>
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <button
            onClick={toggleAutoRefresh}
            className={`px-3 py-1 text-sm rounded-md ${
              autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="text-sm text-blue-600 font-medium">Total Timers</div>
          <div className="text-3xl font-bold text-blue-900">{totalTimers}</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
          <div className="text-sm text-green-600 font-medium">Running</div>
          <div className="text-3xl font-bold text-green-900">{runningTimers.length}</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
          <div className="text-sm text-yellow-600 font-medium">Paused</div>
          <div className="text-3xl font-bold text-yellow-900">{pausedTimers.length}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="text-sm text-purple-600 font-medium">Total Time</div>
          <div className="text-2xl font-bold text-purple-900">{formatTime(totalElapsed)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 font-medium mb-2">Average Time</div>
          <div className="text-xl font-bold text-gray-900">
            {formatTime(Math.floor(averageElapsed))}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 font-medium mb-2">Productivity Score</div>
          <div className="text-xl font-bold text-gray-900">{productivityScore.toFixed(1)}%</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-indigo-50 p-4 rounded-lg">
          <div className="text-sm text-indigo-600 font-medium mb-1">Longest Timer</div>
          <div className="text-lg font-semibold text-indigo-900">
            {longestTimer.name || 'N/A'} - {formatTime(longestTimer.elapsed || 0)}
          </div>
        </div>

        <div className="bg-pink-50 p-4 rounded-lg">
          <div className="text-sm text-pink-600 font-medium mb-1">Created Today</div>
          <div className="text-lg font-semibold text-pink-900">{todayTimers.length} timers</div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-sm text-orange-600 font-medium mb-1">This Week</div>
          <div className="text-lg font-semibold text-orange-900">
            {thisWeekTimers.length} timers
          </div>
        </div>

        <div className="bg-teal-50 p-4 rounded-lg">
          <div className="text-sm text-teal-600 font-medium mb-1">Running Time vs Paused Time</div>
          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <div className="text-xs text-teal-700">Running</div>
              <div className="text-lg font-semibold text-teal-900">
                {formatTime(totalRunningTime)}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-teal-700">Paused</div>
              <div className="text-lg font-semibold text-teal-900">
                {formatTime(totalPausedTime)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Completion Rate:</span>
            <span className="ml-2 font-semibold text-gray-900">{completionRate.toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-gray-600">Active Sessions:</span>
            <span className="ml-2 font-semibold text-gray-900">{runningTimers.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
