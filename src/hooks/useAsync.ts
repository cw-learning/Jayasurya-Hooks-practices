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

export function useAsync<T>(asyncFunction: () => Promise<T>, immediate = true): UseAsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const latestRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    const requestId = ++latestRequestIdRef.current;
    setState({ data: null, loading: true, error: null });

    try {
      const response = await asyncFunction();
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
  }, [asyncFunction]);

  useEffect(() => {
    if (!immediate) return;
    void execute();
  }, [execute, immediate]);

  return { ...state, execute };
}
