// How much of a stay is taken up front to secure it.
// No database or React import, so the model, the API routes and the booking UI
// can all agree on the same number.

import {toAmount} from '@/utils/formatCurrency';

// Share of the stay total collected as a deposit. NEXT_PUBLIC_ because the
// booking UI quotes the same figure it charges - were this server-only, the
// browser would silently fall back to 20% and show a percentage nobody is using.
export const DEPOSIT_PERCENT = (() => {
    const configured = toAmount(process.env.NEXT_PUBLIC_BOOKING_DEPOSIT_PERCENT);
    return configured !== null && configured > 0 && configured <= 100 ? configured : 20;
})();

// Khalti will not accept less than Rs 10 (1000 paisa), so anything below this
// cannot be collected through a wallet at all.
export const MIN_DEPOSIT_NPR = 10;

/**
 * Whole rupees only. Both gateways sign the amount as a string, and a stray
 * decimal in that string is the usual cause of a signature mismatch.
 *
 * The deposit is never allowed to exceed the stay itself, which matters for a
 * cheap one-day booking where the Rs 10 floor would otherwise overshoot.
 */
export const calculateDepositAmount = (totalPrice) => {
    const total = toAmount(totalPrice);
    if (total === null || total <= 0) {
        return 0;
    }
    const deposit = Math.round((total * DEPOSIT_PERCENT) / 100);
    return Math.min(Math.max(deposit, MIN_DEPOSIT_NPR), Math.round(total));
};

// What is still owed to the owner on arrival.
export const calculateBalanceDue = (totalPrice, depositAmount) => {
    const total = toAmount(totalPrice) ?? 0;
    const paid = toAmount(depositAmount) ?? 0;
    return Math.max(Math.round(total - paid), 0);
};
