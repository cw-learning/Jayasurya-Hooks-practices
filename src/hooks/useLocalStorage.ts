import { useState, useCallback, useEffect, SetStateAction, Dispatch, useMemo } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (raw: string) => T;
  }
): [T, Dispatch<SetStateAction<T>>] {
  const serialize = useMemo(() => options?.serialize ?? JSON.stringify, [options?.serialize]);
  const deserialize = useMemo(
    () => options?.deserialize ?? ((raw: string) => JSON.parse(raw) as T),
    [options?.deserialize]
  );

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item === null ? initialValue : deserialize(item);
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    value => {
      setStoredValue(prev => {
        const valueToStore =
          typeof value === 'function' ? (value as (prevState: T) => T)(prev) : value;

        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(key, serialize(valueToStore));
          } catch (storageError) {
            console.error(`Error setting localStorage key "${key}":`, storageError);
          }
        }
        return valueToStore;
      });
    },
    [key, serialize]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const item = window.localStorage.getItem(key);
      setStoredValue(item === null ? initialValue : deserialize(item));
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      setStoredValue(initialValue);
    }
  }, [key, initialValue, deserialize]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) return;
      if (event.key !== key) return;

      if (event.newValue === null) {
        setStoredValue(initialValue);
        return;
      }
      try {
        setStoredValue(deserialize(event.newValue));
      } catch (error) {
        console.error(`Error parsing storage event for key "${key}":`, error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue, deserialize]);

  return [storedValue, setValue];
}
