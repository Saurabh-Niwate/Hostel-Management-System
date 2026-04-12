import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

type FetchResult<T> = {
  data: T[];
  loading: boolean;
  error: string;
  params: any;
  setParams: (p: any) => void;
  refetch: () => Promise<void>;
};

export function useListFetch<T = any>(endpoint: string, initialParams: any = {}, debounceMs = 300): FetchResult<T> {
  const [params, setParams] = useState<any>(initialParams);
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<number | null>(null);

  const doFetch = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(endpoint, { params });
      setData(res.data?.students ?? res.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message || String(err) || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void doFetch();
    }, debounceMs) as unknown as number;
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, JSON.stringify(params), debounceMs]);

  return {
    data,
    loading,
    error,
    params,
    setParams,
    refetch: doFetch
  };
}
