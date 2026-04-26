'use client';

import { useState, useEffect, useCallback } from 'react';
import { WATCHLIST_DEFAULT } from './utils';

const LS_KEY = 'watchlist';

function lsLoad(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return WATCHLIST_DEFAULT;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : WATCHLIST_DEFAULT;
  } catch {
    return WATCHLIST_DEFAULT;
  }
}

function lsSave(tickers: string[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(tickers)); } catch {}
}

export function useWatchlist() {
  const [tickers, setTickers] = useState<string[]>(WATCHLIST_DEFAULT);

  // client mount 後才讀 localStorage（SSR 安全）
  useEffect(() => {
    setTickers(lsLoad());
  }, []);

  const add = useCallback((ticker: string) => {
    const t = ticker.toUpperCase().trim();
    if (!t) return;
    setTickers(prev => {
      if (prev.includes(t)) return prev;
      const next = [...prev, t];
      lsSave(next);
      return next;
    });
  }, []);

  const remove = useCallback((ticker: string) => {
    setTickers(prev => {
      const next = prev.filter(t => t !== ticker);
      lsSave(next);
      return next;
    });
  }, []);

  const has = useCallback(
    (ticker: string) => tickers.includes(ticker.toUpperCase()),
    [tickers]
  );

  return { tickers, add, remove, has };
}
