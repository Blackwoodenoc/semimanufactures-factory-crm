import { useState, useEffect, useCallback, useRef } from "react";

const POLL_INTERVAL = 6000;

export function usePersisted(key, init) {
  const initVal = typeof init === "function" ? init() : init;
  const [val, setValRaw] = useState(initVal);
  const lastSaved = useRef(null);

  useEffect(() => {
    fetch(`/api/state/${key}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data !== null) {
          lastSaved.current = JSON.stringify(data);
          setValRaw(data);
        }
      })
      .catch(() => {});
  }, [key]); // eslint-disable-line

  useEffect(() => {
    const id = setInterval(() => {
      fetch(`/api/state/${key}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data !== null) {
            const serialized = JSON.stringify(data);
            if (serialized !== lastSaved.current) {
              lastSaved.current = serialized;
              setValRaw(data);
            }
          }
        })
        .catch(() => {});
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [key]); // eslint-disable-line

  const setVal = useCallback((updater) => {
    setValRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const serialized = JSON.stringify(next);
      lastSaved.current = serialized;
      fetch(`/api/state/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: serialized,
      }).catch(() => {});
      return next;
    });
  }, [key]); // eslint-disable-line

  return [val, setVal];
}
