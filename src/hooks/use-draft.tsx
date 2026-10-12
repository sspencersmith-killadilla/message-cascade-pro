import { useEffect, useState } from "react";

/** State that survives a page refresh (saved in this browser). Loaded after hydration to avoid SSR mismatch. */
export function useDraft<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {}
    setLoaded(true);
  }, [key]);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value, loaded]);
  const clear = () => { try { localStorage.removeItem(key); } catch {} };
  return [value, setValue, clear] as const;
}
