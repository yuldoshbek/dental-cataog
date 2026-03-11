/**
 * src/hooks/useProducts.js
 * Хук для работы с API товаров.
 * Кэшированием занимается сам хук через useRef.
 */

import { useState, useEffect, useCallback } from 'react';
import { productsApi } from '../api/index.js';

export function useProducts(filters = {}) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const filterKey = JSON.stringify(filters);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await productsApi.getAll(filters);
            setProducts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterKey]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    return { products, loading, error, refetch: fetchProducts };
}

export function useProduct(id) {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        productsApi.getById(id)
            .then(setProduct)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    return { product, loading, error };
}

export function useSharedProduct(slug) {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!slug) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        productsApi.getShared(slug)
            .then(setProduct)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [slug]);

    return { product, loading, error };
}
