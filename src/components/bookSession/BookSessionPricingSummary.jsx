import { Link } from 'react-router-dom';

const REFUND_POLICY_URL = '/about';

const BookSessionPricingSummary = ({
  sessionCount,
  learnerCount,
  totalHours,
  sessionCost,
  serviceFee,
  packageDiscount = 0,
  promoDiscount = 0,
  creditApplied = 0,
  total,
  discountCode,
  onDiscountCodeChange,
  onApplyPromo,
  validatingCode,
  codeValidation,
  showActions = false,
  onPayNow,
  onAddToCart,
  onCancelAll,
  isSubmitting,
}) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <h3 className="mb-4 text-lg font-semibold text-gray-900">Pricing Summary</h3>

    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-600">Session Cost</span>
        <span className="font-medium text-gray-900">${sessionCost.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Service Fee</span>
        <span className="font-medium text-gray-900">${serviceFee.toFixed(2)}</span>
      </div>
      {packageDiscount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Package Discount</span>
          <span>-${packageDiscount.toFixed(2)}</span>
        </div>
      )}
      {promoDiscount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Promo Discount</span>
          <span>-${promoDiscount.toFixed(2)}</span>
        </div>
      )}
      {creditApplied > 0 && (
        <div className="flex justify-between text-brand-medium-blue">
          <span>Credits Applied</span>
          <span>-${creditApplied.toFixed(2)}</span>
        </div>
      )}
    </div>

    <div className="my-3 border-t border-gray-200 pt-3">
      <div className="flex items-center justify-between text-base font-bold text-gray-900">
        <span className="flex items-center gap-1">
          Total
          <Link
            to={REFUND_POLICY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-medium-blue text-xs font-bold text-white hover:bg-brand-dark-blue"
            title="View Refund Policy"
            aria-label="View Refund Policy"
          >
            ?
          </Link>
        </span>
        <span>${Math.max(total, 0).toFixed(2)}</span>
      </div>
      {sessionCount > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {sessionCount} Session{sessionCount !== 1 ? 's' : ''} | {learnerCount} Learner
          {learnerCount !== 1 ? 's' : ''}
          {totalHours > 0 ? ` · ${totalHours} Hour${totalHours !== 1 ? 's' : ''}` : ''}
        </p>
      )}
    </div>

    {showActions && (
      <>
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-600">Promo Code</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => onDiscountCodeChange(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand-medium-blue/30"
            />
            <button
              type="button"
              onClick={onApplyPromo}
              disabled={validatingCode || !discountCode.trim()}
              className="rounded-lg bg-brand-medium-blue px-3 py-2 text-sm font-medium text-white disabled:bg-gray-300"
            >
              {validatingCode ? '…' : 'Apply'}
            </button>
          </div>
          {codeValidation && (
            <p
              className={`mt-1 text-xs ${codeValidation.valid ? 'text-green-700' : 'text-amber-700'}`}
            >
              {codeValidation.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onPayNow}
            disabled={isSubmitting || sessionCount === 0}
            className="w-full rounded-lg bg-green-600 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-green-700 disabled:bg-gray-300"
          >
            {isSubmitting ? 'Processing…' : 'Pay Now'}
          </button>
          <button
            type="button"
            onClick={onAddToCart}
            disabled={sessionCount === 0}
            className="w-full rounded-lg bg-brand-gold py-3 text-sm font-bold uppercase tracking-wide text-gray-900 hover:brightness-95 disabled:bg-gray-200"
          >
            Add to Cart
          </button>
          <button
            type="button"
            onClick={onCancelAll}
            className="w-full rounded-lg border border-gray-300 py-2 text-xs font-semibold uppercase text-gray-600 hover:bg-gray-50"
          >
            Cancel All Selections
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-gray-500">
          You may reschedule or cancel up to 24 hours before the session.
        </p>
      </>
    )}
  </div>
);

export default BookSessionPricingSummary;
