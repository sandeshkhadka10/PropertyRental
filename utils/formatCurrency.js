// Shared Nepali Rupee (NPR) formatting helpers.
// A rate can reach these as a String on older documents, so anything that needs
// to do arithmetic or formatting should go through toAmount() first.

export const CURRENCY_SYMBOL = '₨';
export const CURRENCY_CODE = 'NPR';

// Turns a rate of unknown type into a finite Number, or null when unusable.
export const toAmount = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    const amount =
        typeof value === 'number'
            ? value
            : Number(String(value).replace(/[^0-9.-]/g, ''));

    return Number.isFinite(amount) ? amount : null;
};

// Nepal groups digits the same way India does (2,2,3), so en-IN gives us
// ₨12,34,567 rather than the ₨1,234,567 the default locale would produce.
export const formatNPR = (value) => {
    const amount = toAmount(value);
    if (amount === null) {
        return '';
    }
    return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-IN', {
        maximumFractionDigits: 2
    })}`;
};

// The headline price shown on property cards. A listing is charged by the day,
// so there is only ever the one rate to show.
export const formatRateDisplay = (rates = {}) => {
    const daily = toAmount(rates.daily);
    return daily === null ? '' : `${formatNPR(daily)}/day`;
};
