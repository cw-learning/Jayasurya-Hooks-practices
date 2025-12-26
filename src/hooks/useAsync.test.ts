import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAsync } from './useAsync';

describe('useAsync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads data successfully on mount when immediate is true', async () => {
    const mockAsyncFn = vi.fn(() => Promise.resolve('success'));
    const { result } = renderHook(() => useAsync(mockAsyncFn));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.value).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.value).toBe('success');
    expect(result.current.error).toBeNull();
    expect(mockAsyncFn).toHaveBeenCalledTimes(1);
  });

  it('handles errors and sets error message', async () => {
    const mockAsyncFn = vi.fn(() => Promise.reject(new Error('Failed to load data')));
    const { result } = renderHook(() => useAsync(mockAsyncFn));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.value).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to load data');
  });

  it('does not execute immediately when immediate is false', () => {
    const mockAsyncFn = vi.fn(() => Promise.resolve('success'));
    const { result } = renderHook(() => useAsync(mockAsyncFn, false));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toBeNull();
    expect(result.current.error).toBeNull();
    expect(mockAsyncFn).not.toHaveBeenCalled();
  });

  it('allows manual execution via execute function', async () => {
    const mockAsyncFn = vi.fn(() => Promise.resolve('manual result'));
    const { result } = renderHook(() => useAsync(mockAsyncFn, false));

    expect(result.current.value).toBeNull();

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.value).toBe('manual result');
    expect(mockAsyncFn).toHaveBeenCalledTimes(1);
  });

  it('handles non-Error exceptions with generic error message', async () => {
    const mockAsyncFn = vi.fn(() => Promise.reject('String error'));
    const { result } = renderHook(() => useAsync(mockAsyncFn));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('An error occurred');
    expect(result.current.value).toBeNull();
  });

  it('executes new async function on re-execution', async () => {
    const mockAsyncFn = vi.fn(() => Promise.resolve('first result'));
    const { result } = renderHook(() => useAsync(mockAsyncFn, false));

    await act(async () => {
      await result.current.execute();
    });
    await waitFor(() => {
      expect(result.current.value).toBe('first result');
    });

    mockAsyncFn.mockImplementation(() => Promise.resolve('second result'));

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.value).toBe('second result');
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockAsyncFn).toHaveBeenCalledTimes(2);
  });

  it('can handle rapid re-executions', async () => {
    const mockAsyncFn = vi.fn(() => Promise.resolve('result'));
    const { result } = renderHook(() => useAsync(mockAsyncFn, false));

    await act(async () => {
      const promise1 = result.current.execute();
      const promise2 = result.current.execute();
      const promise3 = result.current.execute();

      await Promise.all([promise1, promise2, promise3]);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.value).toBe('result');
    expect(mockAsyncFn).toHaveBeenCalledTimes(3);
  });

  it('keeps the latest result when earlier request resolves later', async () => {
    let resolveFirst: ((value: string) => void) | null = null;
    let resolveSecond: ((value: string) => void) | null = null;

    const mockAsyncFn = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<string>(resolve => {
            resolveFirst = resolve;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise<string>(resolve => {
            resolveSecond = resolve;
          })
      );

    const { result } = renderHook(() => useAsync(mockAsyncFn, false));

    await act(async () => {
      const first = result.current.execute();
      const second = result.current.execute();

      // Resolve second request first, then first request
      resolveSecond?.('second');
      resolveFirst?.('first');

      await Promise.all([first, second]);
    });

    await waitFor(() => {
      expect(result.current.value).toBe('second');
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('does not update state when execute is called after unmount', async () => {
    const mockAsyncFn = vi.fn(() => Promise.resolve('success'));
    const { result, unmount } = renderHook(() => useAsync(mockAsyncFn, false));

    // Capture execute function before unmount
    const executeRef = result.current.execute;

    unmount();

    // Call execute after unmount - should not cause React warnings or call async function
    await act(async () => {
      await executeRef();
    });

    // Should not have called the async function because component is unmounted
    expect(mockAsyncFn).not.toHaveBeenCalled();
  });

  it('keeps the latest error when earlier request rejects later', async () => {
    let rejectFirst: ((error: Error) => void) | null = null;
    let rejectSecond: ((error: Error) => void) | null = null;

    const mockAsyncFn = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<string>((_resolve, reject) => {
            rejectFirst = reject;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise<string>((_resolve, reject) => {
            rejectSecond = reject;
          })
      );

    const { result } = renderHook(() => useAsync(mockAsyncFn, false));

    await act(async () => {
      const first = result.current.execute();
      const second = result.current.execute();

      // Reject second request first, then first request
      rejectSecond?.(new Error('second error'));
      rejectFirst?.(new Error('first error'));

      await Promise.allSettled([first, second]);
    });

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('second error');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.value).toBeNull();
  });
});
