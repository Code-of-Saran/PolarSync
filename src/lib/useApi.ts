'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from './api';
import { useAppStore } from './store';

/** Fetch JSON from the API with loading / error / reload state. Pass null to skip. */
export function useApi<T>(path: string | null, opts: { auth?: boolean } = {}) {
  const hydrated = useAppStore((s) => s.hydrated);
  const token = useAppStore((s) => s.token);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState<boolean>(!!path);
  const reqId = useRef(0);

  const load = useCallback(async () => {
    if (!path) { setLoading(false); return; }
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await api<T>(path);
      if (id === reqId.current) setData(res);
    } catch (e) {
      if (id === reqId.current) setError(e instanceof ApiError ? e : new ApiError(0, String(e)));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    // authenticated endpoints wait for the persisted token to be restored
    if (opts.auth && !hydrated) return;
    load();
  }, [load, opts.auth, hydrated, opts.auth ? token : null]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, error, loading, reload: load, setData };
}
