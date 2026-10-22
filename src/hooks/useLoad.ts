import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useAppStore } from "../store/useAppStore";
import { message } from "../utils/values";
export function useLoad<T>(loader: () => Promise<T>, initial: T, key = "") {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const loadRef = useRef(loader);
  loadRef.current = loader;
  const revision = useAppStore((s) => s.revision);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError("");
      loadRef
        .current()
        .then((value) => {
          if (active) setData(value);
        })
        .catch((e) => {
          if (active) setError(message(e));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [key, revision, attempt]),
  );
  return { data, loading, error, reload: () => setAttempt((a) => a + 1) };
}
