import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchCart,
  removeFromCart,
  clearCart,
} from '../services/onDemandLearningService';

const OnDemandCartPage = () => {
  const [cart, setCart] = useState({ items: [], count: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCart();
      setCart({
        items: data?.items ?? [],
        count: data?.count ?? data?.items?.length ?? 0,
      });
    } catch {
      setCart({ items: [], count: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemove = async (contentId) => {
    try {
      const data = await removeFromCart(contentId);
      setCart({
        items: data?.items ?? [],
        count: data?.count ?? data?.items?.length ?? 0,
      });
    } catch {
      await load();
    }
  };

  const handleClear = async () => {
    try {
      await clearCart();
      setCart({ items: [], count: 0 });
    } catch {
      await load();
    }
  };

  const totalEstimate = cart.items.reduce(
    (sum, item) =>
      sum + Number(item.pricePerMinute || 0) * Number(item.durationMinutes || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-brand-dark-blue to-brand-medium-blue text-white py-12">
        <div className="max-w-3xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Your Cart</h1>
          <Link
            to="/on-demand-learning"
            className="text-brand-light-blue hover:text-white text-sm font-medium"
          >
            ← Back to On-Demand Learning
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <p className="text-gray-500 text-center py-12">Loading cart…</p>
        ) : cart.items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-gray-600 mb-4">Your cart is empty.</p>
            <Link
              to="/on-demand-learning"
              className="inline-block bg-brand-medium-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-dark-blue"
            >
              Browse lessons
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-4 mb-6">
              {cart.items.map((item) => (
                <li
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <h2 className="font-semibold text-brand-dark-blue">{item.title}</h2>
                    <p className="text-sm text-gray-500">
                      {item.subject} · {item.gradeLevel} · By {item.tutorName}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      ${Number(item.pricePerMinute).toFixed(2)}/min × {item.durationMinutes}{' '}
                      min
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium shrink-0"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Estimated total</p>
                <p className="text-2xl font-bold text-brand-dark-blue">
                  ${totalEstimate.toFixed(2)}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Clear cart
                </button>
                <button
                  type="button"
                  disabled
                  title="Checkout coming soon"
                  className="px-6 py-2 bg-brand-gold text-brand-dark-blue rounded-lg font-bold text-sm opacity-80 cursor-not-allowed"
                >
                  Checkout (coming soon)
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OnDemandCartPage;
