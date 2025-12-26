import { useRef, useEffect, useCallback, useState } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAsyncResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: () => Promise<void>;
}

/**
 * Custom hook for managing async operation state (data, loading, error).
 * Prevents out-of-order responses from overwriting newer results using request IDs.
 *
 * @template T - The type of data returned by the async function
 * @param asyncFunction - Function returning a promise for the async work
 * @param immediate - When true, executes once on mount. Default: true
 * @returns Object containing data, loading, error states and execute function
 *
 * @example
 * // Immediate execution on mount
 * const { data, loading, error } = useAsync(() => fetchUser(id));
 *
 * @example
 * // Manual execution
 * const { data, execute } = useAsync(() => fetchData(), false);
 * // Later: execute();
 */
export function useAsync<T>(asyncFunction: () => Promise<T>, immediate = true): UseAsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const asyncFunctionRef = useRef(asyncFunction);
  const latestRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  // Keep the latest asyncFunction reference
  useEffect(() => {
    asyncFunctionRef.current = asyncFunction;
  }, [asyncFunction]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    // Prevent state updates if component is unmounted
    if (!isMountedRef.current) return;

    const requestId = ++latestRequestIdRef.current;
    setState({ data: null, loading: true, error: null });

    try {
      const response = await asyncFunctionRef.current();
      if (!isMountedRef.current || requestId !== latestRequestIdRef.current) return;
      setState({ data: response, loading: false, error: null });
    } catch (caughtError: unknown) {
      if (!isMountedRef.current || requestId !== latestRequestIdRef.current) return;
      setState({
        data: null,
        loading: false,
        error: caughtError instanceof Error ? caughtError.message : 'An error occurred',
      });
    }
  }, []);

  useEffect(() => {
    if (!immediate) return undefined;
    void execute();
  }, [execute, immediate]);

  return { ...state, execute };
}
