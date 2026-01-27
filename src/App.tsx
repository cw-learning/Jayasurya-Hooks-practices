import { useState } from 'react';
import { TimerList } from './components/TimerList';
import { SummaryWidget } from './components/SummaryWidget';

// ❌ PROBLEM: No useContext for shared theme/config
// ❌ PROBLEM: Inline callbacks
// ❌ PROBLEM: State that could be derived

function App() {
  const [view, setView] = useState<'list' | 'summary'>('list');
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Timer & Task Management
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setView('list')}
                  className={`px-4 py-2 rounded-md ${
                    view === 'list'
                      ? 'bg-blue-500 text-white'
                      : darkMode
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Timer List
                </button>
                <button
                  onClick={() => setView('summary')}
                  className={`px-4 py-2 rounded-md ${
                    view === 'summary'
                      ? 'bg-blue-500 text-white'
                      : darkMode
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Summary
                </button>
              </div>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`px-4 py-2 rounded-md ${
                darkMode ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-white'
              }`}
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>
      </header>

      <main className="py-8">{view === 'list' ? <TimerList /> : <SummaryWidget />}</main>

      <footer
        className={`${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'} mt-12`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm">
          <p>Timer Dashboard - Built with React, TypeScript, and Tailwind CSS</p>
          <p className="mt-1 text-xs">
            ⚠️ This codebase intentionally contains React Hooks anti-patterns for learning purposes
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
