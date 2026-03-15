"use client";

import { useEffect, useState } from "react";

type CacheEntry<T> = {
    data?: T;
    expires: number;
    promise?: Promise<T>;
};

const cache = new Map<string, CacheEntry<unknown>>();

async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }
    return res.json() as Promise<T>;
}

export function useCachedJson<T>(url: string, ttlMs = 60_000) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const now = Date.now();
        const cached = cache.get(url) as CacheEntry<T> | undefined;

        if (cached?.data && cached.expires > now) {
            setData(cached.data);
            setLoading(false);
            return;
        }

        const promise = cached?.promise ?? fetchJson<T>(url);
        cache.set(url, {
            data: cached?.data,
            expires: now + ttlMs,
            promise,
        });

        promise
            .then((json) => {
                if (!mounted) return;
                cache.set(url, { data: json, expires: Date.now() + ttlMs });
                setData(json);
            })
            .catch((err: Error) => {
                if (!mounted) return;
                setError(err.message);
            })
            .finally(() => {
                if (!mounted) return;
                setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [url, ttlMs]);

    return { data, loading, error };
}

