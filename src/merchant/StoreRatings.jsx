import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useMerchant } from '../context/MerchantContext';
import { timeAgo } from '../utils/format';

// Partner portal: store rating, each product's rating, and the latest customer reviews.
export default function StoreRatings() {
  const { store, products } = useMerchant();
  const [result, setResult] = useState({ storeId: null, summary: null, items: [], reviews: [] });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase.rpc('store_rating_summaries'),
      supabase.rpc('product_rating_summaries', { p_store_id: store.id }),
      supabase.rpc('store_reviews_list', { p_store_id: store.id, p_limit: 10 }),
    ]).then(([all, items, reviews]) => {
      if (cancelled) return;
      setResult({
        storeId: store.id,
        summary: (all.data ?? []).find((r) => r.store_id === store.id) ?? null,
        items: items.data ?? [],
        reviews: reviews.data ?? [],
      });
    });
    return () => {
      cancelled = true;
    };
  }, [store.id]);

  if (result.storeId !== store.id) return null;
  const total = Number(result.summary?.total ?? 0);
  const nameOf = (id) => products.find((p) => p.id === id)?.name ?? 'Removed product';
  const items = [...result.items].sort((a, b) => b.total - a.total).slice(0, 8);

  return (
    <section className="card ratings-card">
      <div className="card-head">
        <h2>Customer ratings</h2>
        {total > 0 && (
          <p className="ratings-avg">
            <Star size={18} aria-hidden="true" />
            {Number(result.summary.average).toFixed(1)}
            <span className="muted small">
              {' '}
              from {total} {total === 1 ? 'rating' : 'ratings'}
            </span>
          </p>
        )}
      </div>

      {total === 0 ? (
        <p className="muted">No ratings yet. Customers can rate your store and food after each delivery.</p>
      ) : (
        <div className="ratings-grid">
          <div>
            <p className="field-label-text">Your products</p>
            {items.length === 0 ? (
              <p className="muted small">No product ratings yet.</p>
            ) : (
              <ul className="ratings-items">
                {items.map((i) => (
                  <li key={i.product_id}>
                    <span>{nameOf(i.product_id)}</span>
                    <span className="ratings-item-score">
                      ★ {Number(i.average).toFixed(1)} <span className="muted small">({i.total})</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="field-label-text">Latest reviews</p>
            <ul className="store-reviews">
              {result.reviews.map((r, i) => (
                <li key={`${r.created_at}-${i}`}>
                  <p>
                    <span className="review-stars">
                      {'★'.repeat(r.stars)}
                      <span className="review-off">{'★'.repeat(5 - r.stars)}</span>
                    </span>{' '}
                    <span className="muted small">
                      {r.reviewer}
                      {r.order_code ? ` · ${r.order_code}` : ''} · {timeAgo(r.created_at)}
                    </span>
                  </p>
                  {r.tags?.length > 0 && <p className="muted small">{r.tags.join(' · ')}</p>}
                  {r.comment && <p className="review-comment">“{r.comment}”</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}