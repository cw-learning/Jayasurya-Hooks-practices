import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));

    expect(result.current[0]).toBe('initialValue');
  });

  it('should return stored value from localStorage', () => {
    window.localStorage.setItem('testKey', JSON.stringify('storedValue'));

    const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));

    expect(result.current[0]).toBe('storedValue');
  });

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));

    act(() => {
      result.current[1]('newValue');
    });

    expect(result.current[0]).toBe('newValue');
    expect(window.localStorage.getItem('testKey')).toBe(JSON.stringify('newValue'));
  });

  it('should handle function updates', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 10));

    act(() => {
      result.current[1](prev => prev + 5);
    });

    expect(result.current[0]).toBe(15);
    expect(window.localStorage.getItem('testKey')).toBe(JSON.stringify(15));
  });

  it('should work with complex objects', () => {
    const initialObject = { name: 'John', age: 30 };
    const { result } = renderHook(() => useLocalStorage('testKey', initialObject));

    expect(result.current[0]).toEqual(initialObject);

    const updatedObject = { name: 'Jane', age: 25 };

    act(() => {
      result.current[1](updatedObject);
    });

    expect(result.current[0]).toEqual(updatedObject);
    expect(JSON.parse(window.localStorage.getItem('testKey')!)).toEqual(updatedObject);
  });

  it('should work with arrays', () => {
    const initialArray = [1, 2, 3];
    const { result } = renderHook(() => useLocalStorage('testKey', initialArray));

    expect(result.current[0]).toEqual(initialArray);

    act(() => {
      result.current[1](prev => [...prev, 4]);
    });

    expect(result.current[0]).toEqual([1, 2, 3, 4]);
    expect(JSON.parse(window.localStorage.getItem('testKey')!)).toEqual([1, 2, 3, 4]);
  });

  it('should handle parse errors gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.localStorage.setItem('testKey', 'invalid JSON');

    const { result } = renderHook(() => useLocalStorage('testKey', 'fallback'));

    expect(result.current[0]).toBe('fallback');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error reading localStorage key'),
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle localStorage setItem errors gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

    act(() => {
      result.current[1]('newValue');
    });

    // State should still update even if localStorage fails
    expect(result.current[0]).toBe('newValue');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error setting localStorage key'),
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  it('should persist value across hook instances', () => {
    const { result: result1 } = renderHook(() => useLocalStorage('sharedKey', 'initial'));

    act(() => {
      result1.current[1]('updated');
    });

    // Create new hook instance with same key
    const { result: result2 } = renderHook(() => useLocalStorage('sharedKey', 'initial'));

    expect(result2.current[0]).toBe('updated');
  });

  it('should handle boolean values', () => {
    const { result } = renderHook(() => useLocalStorage('boolKey', false));

    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1](true);
    });

    expect(result.current[0]).toBe(true);
    expect(JSON.parse(window.localStorage.getItem('boolKey')!)).toBe(true);
  });

  it('should handle null values', () => {
    const { result } = renderHook(() => useLocalStorage<string | null>('nullKey', null));

    expect(result.current[0]).toBe(null);

    act(() => {
      result.current[1]('notNull');
    });

    expect(result.current[0]).toBe('notNull');

    act(() => {
      result.current[1](null);
    });

    expect(result.current[0]).toBe(null);
  });
});
