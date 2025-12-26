import { useRef, useEffect, useCallback, useState } from 'react';

interface AsyncState<T> {
  value: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseAsyncResult<T, TArgs extends readonly unknown[]> {
  value: T | null;
  isLoading: boolean;
  error: Error | null;
  execute: (...args: TArgs) => Promise<T | undefined>;
}

/**
 * Custom hook for managing async operation state (value, isLoading, error).
 * Prevents out-of-order responses from overwriting newer results using request IDs.
 *
 * @template T - The type of data returned by the async function
 * @template TArgs - The argument types for the async function
 * @param asyncFunction - Function returning a promise for the async work
 * @param immediate - When true, executes once on mount. Default: true
 * @returns Object containing value, isLoading, error states and execute function
 *
 * @example
 * // Immediate execution on mount
 * const { value, isLoading, error } = useAsync(() => fetchUser(id));
 *
 * @example
 * // Manual execution with arguments
 * const { value, execute } = useAsync((userId: string) => fetchUser(userId), false);
 * // Later: const result = await execute('123');
 */
export function useAsync<T, TArgs extends readonly unknown[] = []>(
  asyncFunction: (...args: TArgs) => Promise<T>,
  immediate = true
): UseAsyncResult<T, TArgs> {
  const [state, setState] = useState<AsyncState<T>>({
    value: null,
    isLoading: immediate,
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

  const execute = useCallback(async (...args: TArgs): Promise<T | undefined> => {
    // Prevent state updates if component is unmounted
    if (!isMountedRef.current) return undefined;

    const requestId = ++latestRequestIdRef.current;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await asyncFunctionRef.current(...args);
      if (!isMountedRef.current || requestId !== latestRequestIdRef.current) return undefined;
      setState({ value: response, isLoading: false, error: null });
      return response;
    } catch (caughtError: unknown) {
      if (!isMountedRef.current || requestId !== latestRequestIdRef.current) return undefined;
      const error = caughtError instanceof Error ? caughtError : new Error('An error occurred');
      setState(prev => ({ ...prev, isLoading: false, error }));
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (!immediate) return undefined;
    void execute(...([] as unknown as TArgs));
  }, [execute, immediate]);

  return { ...state, execute };
}
