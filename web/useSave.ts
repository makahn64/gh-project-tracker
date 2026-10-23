import { useEffect, useRef, useState } from 'react';

/**
 * Shows a new value immediately and saves it. On success adopts what the
 * server returned; on failure puts the old value back and exposes the error.
 */
export function useSave<T>(initial: T, save: (next: T, prev: T) => Promise<T>) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valueRef = useRef(initial);

  useEffect(() => {
    valueRef.current = initial;
    setValue(initial);
  }, [initial]);

  async function set(next: T) {
    if (busy) return;
    const prev = valueRef.current;
    setValue(next);
    setBusy(true);
    try {
      const saved = await save(next, prev);
      valueRef.current = saved;
      setValue(saved);
      setError(null);
    } catch (e) {
      setValue(prev);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return { value, busy, error, set };
}
