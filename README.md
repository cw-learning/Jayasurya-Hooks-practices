# Timer & Task Management Dashboard

A React + TypeScript project built to demonstrate React Hooks concepts, patterns, and best practices through intentional anti-patterns that need to be fixed.

## 🎯 Project Purpose

This project is **intentionally built with React Hooks anti-patterns** to provide a realistic codebase for learning and practicing proper hook implementation through Pull Requests.

## 🔴 Current Problems (Intentional)

The codebase currently contains the following issues that need to be addressed:

### 1. State Management Issues

- ❌ Excessive `useState` usage for complex state
- ❌ Should use `useReducer` for timer state transitions
- ❌ Shared state duplicated across components
- ❌ No separation between UI state and business logic

### 2. Side Effects & Lifecycle Problems

- ❌ Timers created without proper cleanup
- ❌ API calls mixed with render logic
- ❌ `useEffect` missing dependency arrays
- ❌ Effects rerun unnecessarily

### 3. Performance Bottlenecks

- ❌ Heavy calculations executed on every render
- ❌ Inline callbacks causing child re-renders
- ❌ No `useMemo` for expensive computations
- ❌ No `useCallback` for event handlers
- ❌ Lists re-render completely on small updates

### 4. Imperative & Mutable Logic Misuse

- ❌ Interval IDs stored in state (causing re-renders)
- ❌ Previous timer values recalculated incorrectly
- ❌ Should use `useRef` for mutable values
- ❌ DOM manipulation without refs

### 5. Repeated Logic Across Components

- ❌ Timer logic duplicated in `TimerList`, `TimerCard`, `SummaryWidget`
- ❌ API loading/error handling repeated everywhere
- ❌ No custom hooks for reusable logic
- ❌ Missing hooks: `useTimer`, `useInterval`, `useAsync`

### 6. Poor Code Organization

- ❌ Components exceed 300 lines
- ❌ Business logic mixed with JSX
- ❌ Hard to test and reason about
- ❌ No hook extraction & composition

### 7. Missing Context API

- ❌ No `useContext` for theme
- ❌ No global timer configuration
- ❌ Props drilling in some areas

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Vitest** - Unit testing
- **React Testing Library** - Component testing

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
src/
├── api/
│   └── timerApi.ts          # Mock API for timer persistence
├── components/
│   ├── TimerCard.tsx         # Individual timer component (300+ lines) ❌
│   ├── TimerList.tsx         # Timer list with filters (400+ lines) ❌
│   └── SummaryWidget.tsx     # Summary statistics (250+ lines) ❌
├── types/
│   └── timer.ts              # TypeScript interfaces
├── test/
│   └── setup.ts              # Test configuration
├── App.tsx                   # Main app component
├── main.tsx                  # Entry point
└── index.css                 # Global styles with Tailwind
```

## 🎓 Learning Objectives

By fixing the intentional problems in this codebase, you will learn:

1. **useState vs useReducer**
   - When to use each
   - Managing complex state transitions
   - Predictable state updates

2. **useEffect Best Practices**
   - Dependency arrays
   - Cleanup functions
   - Avoiding infinite loops
   - Side effect management

3. **Performance Optimization**
   - `useMemo` for expensive calculations
   - `useCallback` for stable function references
   - Preventing unnecessary re-renders
   - React.memo for component memoization

4. **useRef Use Cases**
   - Storing mutable values without re-renders
   - Accessing DOM elements
   - Storing interval/timeout IDs
   - Previous value tracking

5. **Custom Hooks**
   - Extracting reusable logic
   - `useTimer` - Timer state management
   - `useInterval` - Declarative intervals
   - `useAsync` - API call handling
   - Hook composition

6. **useContext**
   - Global state management
   - Theme context
   - Configuration context
   - Avoiding prop drilling

7. **Testing Hooks**
   - Using `@testing-library/react-hooks`
   - Testing custom hooks in isolation
   - Mocking timers and APIs

## 🔧 Suggested Refactoring Tasks (PRs)

### PR 1: Extract Custom Hooks

- [ ] Create `useTimer` hook
- [ ] Create `useInterval` hook
- [ ] Create `useAsync` hook
- [ ] Create `useLocalStorage` hook

### PR 2: Optimize Performance

- [ ] Add `useMemo` for derived calculations
- [ ] Add `useCallback` for event handlers
- [ ] Implement `React.memo` where appropriate
- [ ] Fix re-render issues

### PR 3: Fix Side Effects

- [ ] Add proper `useEffect` cleanup
- [ ] Fix dependency arrays
- [ ] Move API calls to custom hooks
- [ ] Implement proper error boundaries

### PR 4: State Management

- [ ] Replace `useState` with `useReducer` in TimerList
- [ ] Create timer reducer with actions
- [ ] Centralize state management

### PR 5: Use Refs Properly

- [ ] Replace state-based interval IDs with refs
- [ ] Add focus management with refs
- [ ] Track previous values with refs

### PR 6: Add Context

- [ ] Create ThemeContext
- [ ] Create TimerConfigContext
- [ ] Implement context providers

### PR 7: Testing

- [ ] Write tests for custom hooks
- [ ] Add component integration tests
- [ ] Test timer logic in isolation

## 📚 Key React Hooks Reference

| Hook          | Use Case               | Example in This Project       |
| ------------- | ---------------------- | ----------------------------- |
| `useState`    | Simple local state     | Edit mode, form inputs        |
| `useReducer`  | Complex state logic    | Timer state management        |
| `useEffect`   | Side effects           | API calls, timers             |
| `useRef`      | Mutable values         | Interval IDs, previous values |
| `useMemo`     | Expensive calculations | Statistics, filtered lists    |
| `useCallback` | Stable callbacks       | Event handlers                |
| `useContext`  | Global state           | Theme, configuration          |
| Custom Hooks  | Reusable logic         | useTimer, useAsync            |

## 🚀 Getting Started with Fixes

1. Start with **extracting custom hooks** - this will make other refactoring easier
2. Then focus on **performance optimizations**
3. Fix **useEffect** issues
4. Finally, add **useContext** for shared state

## 📖 Additional Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [useReducer vs useState](https://react.dev/learn/extracting-state-logic-into-a-reducer)
- [Custom Hooks Guide](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Performance Optimization](https://react.dev/learn/render-and-commit)

## ⚠️ Important Notes

- This codebase **intentionally contains anti-patterns**
- Do not use this as a reference for production code
- The purpose is educational - to learn by fixing
- Each problem is marked with ❌ comments in the code

## 📝 License

MIT - This is an educational project

---

**Happy Learning! 🎉**

Remember: The best way to learn React Hooks is by identifying and fixing problems in real code.
