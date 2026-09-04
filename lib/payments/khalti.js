// Khalti ePayment (KPG-2). Unlike eSewa there is no public sandbox merchant, so
// this gateway only shows up in the UI once KHALTI_SECRET_KEY is set - grab a
// test key from https://test-admin.khalti.com.
const KHALTI_BASE_URLS = {
    sandbox: 'https://dev.khalti.com/api/v2',
    production: 'https://khalti.com/api/v2'
};

// Khalti works in paisa and will not accept less than Rs 10.
const PAISA_PER_RUPEE = 100;
export const KHALTI_MIN_PAISA = 1000;

export const getKhaltiConfig = () => {
    const mode = process.env.KHALTI_ENV === 'production' ? 'production' : 'sandbox';
    return {
        mode,
        secretKey: process.env.KHALTI_SECRET_KEY || '',
        baseUrl: KHALTI_BASE_URLS[mode]
    };
};

export const isKhaltiEnabled = () => Boolean(getKhaltiConfig().secretKey);

export const toPaisa = (rupees) => Math.round(rupees * PAISA_PER_RUPEE);
export const toRupees = (paisa) => paisa / PAISA_PER_RUPEE;

const khaltiRequest = async (path, body) => {
    const { secretKey, baseUrl } = getKhaltiConfig();
    if (!secretKey) {
        throw new Error('Khalti is not configured');
    }

    const res = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
            Authorization: `Key ${secretKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        cache: 'no-store'
    });

    const payload = await res.json().catch(() => null);

    // Khalti answers 400 for expired/cancelled payments but still returns a
    // usable body, so hand that back rather than throwing on non-2xx alone.
    if (!res.ok && !payload) {
        throw new Error(`Khalti request to ${path} failed with ${res.status}`);
    }
    return { ok: res.ok, status: res.status, payload };
};

export const initiateKhaltiPayment = async ({
    amount,
    purchaseOrderId,
    purchaseOrderName,
    returnUrl,
    websiteUrl,
    customer
}) => {
    // Deliberately not clamped up to the minimum: sending more than we recorded
    // would make the amount check on the callback fail. Callers screen for this.
    const paisa = toPaisa(amount);

    const { ok, payload } = await khaltiRequest('/epayment/initiate/', {
        return_url: returnUrl,
        website_url: websiteUrl,
        amount: paisa,
        purchase_order_id: purchaseOrderId,
        purchase_order_name: purchaseOrderName,
        customer_info: {
            name: customer?.name || '',
            email: customer?.email || '',
            phone: customer?.phone || ''
        }
    });

    if (!ok || !payload?.pidx || !payload?.payment_url) {
        throw new Error(
            payload?.detail ||
                payload?.error_key ||
                'Khalti could not start this payment'
        );
    }

    return { pidx: payload.pidx, paymentUrl: payload.payment_url, amountPaisa: paisa };
};

// Server-to-server confirmation. Only status === 'Completed' counts as paid.
export const lookupKhaltiPayment = async (pidx) => {
    const { payload } = await khaltiRequest('/epayment/lookup/', { pidx });
    return payload;
};
