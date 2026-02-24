import { useState, useEffect } from 'react';
import { transactions as txApi } from '../utils/api';

export function useTransactions({ page = 1, limit = 20, category, from, to, search } = {}) {
  const [data, setData] = useState({ transactions: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData({ transactions: [], pagination: {} });
    txApi.list({ page, limit, category, from, to, search })
      .then(({ data: res }) => {
        if (!cancelled) {
          const body = res?.data != null ? res.data : res;
          const transactions = body?.transactions ?? res?.transactions ?? [];
          const pagination = body?.pagination ?? res?.pagination ?? {};
          setData({
            transactions: Array.isArray(transactions) ? transactions : [],
            pagination: pagination && typeof pagination === 'object' ? pagination : {},
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.error || err.message);
          // Keep previous data on error so we don't flash 0
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page, limit, category, from, to, search, refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);
  return { ...data, loading, error, refetch };
}

export function useTransactionsSummary(params = {}) {
  const [data, setData] = useState({ summary: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData({ summary: [], total: 0 });
    txApi.summary(params)
      .then(({ data: res }) => {
        if (!cancelled) {
          const body = res?.data != null ? res.data : res;
          const summary = body?.summary ?? res?.summary ?? [];
          const total = body?.total ?? res?.total;
          setData({
            summary: Array.isArray(summary) ? summary : [],
            total: typeof total === 'number' ? total : (Array.isArray(summary) ? summary.reduce((s, x) => s + (Number(x?.amount) || 0), 0) : 0),
            from: body?.from ?? res?.from,
            to: body?.to ?? res?.to,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || err.message);
        // Keep previous data on error so we don't flash 0
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [params.from, params.to]);

  return { ...data, loading, error };
}

export function useDailyTrend(options = {}) {
  const { days = 7, from, to } = typeof options === 'number' ? { days: options } : options;
  const [data, setData] = useState({ trend: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = from && to ? { from, to } : { days };
    txApi.dailyTrend(params)
      .then(({ data: res }) => {
        if (!cancelled) setData({ trend: res?.trend || [], days: res?.days, from: res?.from, to: res?.to });
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [days, from, to]);

  return { ...data, loading, error };
}
