import { useState, useEffect } from 'react';
import { transactions as txApi } from '../utils/api';

export function useTransactions({ page = 1, limit = 20, category, from, to, search } = {}) {
  const [data, setData] = useState({ transactions: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    txApi.list({ page, limit, category, from, to, search })
      .then(({ data: res }) => {
        if (!cancelled) {
          setData({
            transactions: res.transactions || [],
            pagination: res.pagination || {},
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page, limit, category, from, to, search]);

  return { ...data, loading, error };
}

export function useTransactionsSummary(params = {}) {
  const [data, setData] = useState({ summary: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    txApi.summary(params)
      .then(({ data: res }) => {
        if (!cancelled) {
          setData({
            summary: res.summary || [],
            total: res.total || 0,
            from: res.from,
            to: res.to,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [params.from, params.to]);

  return { ...data, loading, error };
}

export function useDailyTrend(days = 7) {
  const [data, setData] = useState({ trend: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    txApi.dailyTrend({ days })
      .then(({ data: res }) => {
        if (!cancelled) setData({ trend: res.trend || [], days: res.days });
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [days]);

  return { ...data, loading, error };
}
