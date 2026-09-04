import crypto from 'crypto';

// eSewa ePay v2. The sandbox ("RC") environment accepts the public EPAYTEST
// merchant code and its published secret, so the whole flow is demoable without
// a merchant account. Test logins: 9711111111 / Nepal@123, OTP 123456.
const ESEWA_URLS = {
    sandbox: {
        form: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
        status: 'https://rc.esewa.com.np/api/epay/transaction/status/'
    },
    production: {
        form: 'https://epay.esewa.com.np/api/epay/main/v2/form',
        status: 'https://esewa.com.np/api/epay/transaction/status/'
    }
};

// eSewa signs exactly these three fields, in exactly this order.
export const SIGNED_FIELD_NAMES = 'total_amount,transaction_uuid,product_code';

export const getEsewaConfig = () => {
    const mode = process.env.ESEWA_ENV === 'production' ? 'production' : 'sandbox';
    return {
        mode,
        productCode: process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST',
        secretKey: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
        formUrl: ESEWA_URLS[mode].form,
        statusUrl: ESEWA_URLS[mode].status
    };
};

const hmacBase64 = (message, secretKey) =>
    crypto.createHmac('sha256', secretKey).update(message).digest('base64');

const signatureMatches = (a = '', b = '') => {
    const left = Buffer.from(String(a));
    const right = Buffer.from(String(b));
    if (left.length !== right.length) {
        return false;
    }
    return crypto.timingSafeEqual(left, right);
};

// Builds the exact `key=value,key=value` string eSewa hashes.
const buildSignatureMessage = (fieldNames, values) =>
    fieldNames
        .split(',')
        .map((name) => name.trim())
        .map((name) => `${name}=${values[name]}`)
        .join(',');

export const signEsewaPayload = ({ totalAmount, transactionUuid, productCode, secretKey }) =>
    hmacBase64(
        buildSignatureMessage(SIGNED_FIELD_NAMES, {
            total_amount: totalAmount,
            transaction_uuid: transactionUuid,
            product_code: productCode
        }),
        secretKey
    );

// Returns the action URL plus every field the browser must POST. The amount is
// stringified once and reused for both the field and the signature - signing a
// differently formatted number than the one submitted is the classic failure here.
export const buildEsewaCheckout = ({ amount, transactionUuid, successUrl, failureUrl }) => {
    const { productCode, secretKey, formUrl } = getEsewaConfig();
    const totalAmount = String(Math.round(amount));

    const fields = {
        amount: totalAmount,
        tax_amount: '0',
        total_amount: totalAmount,
        transaction_uuid: transactionUuid,
        product_code: productCode,
        product_service_charge: '0',
        product_delivery_charge: '0',
        success_url: successUrl,
        failure_url: failureUrl,
        signed_field_names: SIGNED_FIELD_NAMES
    };

    fields.signature = signEsewaPayload({
        totalAmount,
        transactionUuid,
        productCode,
        secretKey
    });

    return { action: formUrl, fields };
};

// eSewa hands the browser back a single base64 `data` query param. The raw JSON
// text is kept alongside the parsed object because the signature is computed
// over the values exactly as they were written - see readRawField below.
export const decodeEsewaCallback = (data) => {
    if (!data) {
        return null;
    }
    try {
        const raw = Buffer.from(data, 'base64').toString('utf8');
        return { payload: JSON.parse(raw), raw };
    } catch {
        return null;
    }
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Reads a field's value straight out of the JSON text rather than out of the
 * parsed object.
 *
 * eSewa signs `total_amount=1000.0`, but JSON.parse turns 1000.0 into the number
 * 1000, which stringifies back as "1000" and yields a completely different HMAC.
 * Verified against the worked example in eSewa's own docs, where only the
 * literal `1000.0` reproduces their published signature.
 */
const readRawField = (raw, name) => {
    const match = raw.match(
        new RegExp(`"${escapeRegExp(name)}"\\s*:\\s*("(?:[^"\\\\]|\\\\.)*"|[^,}\\s]+)`)
    );
    if (!match) {
        return undefined;
    }
    // Strings get unescaped; numbers keep the exact text eSewa sent.
    return match[1].startsWith('"') ? JSON.parse(match[1]) : match[1];
};

// Re-signs whatever fields the callback says were signed and compares.
export const verifyEsewaCallbackSignature = (decoded) => {
    const { payload, raw } = decoded ?? {};
    if (!payload?.signature || !payload?.signed_field_names) {
        return false;
    }

    const { secretKey } = getEsewaConfig();
    const values = {};
    payload.signed_field_names.split(',').forEach((name) => {
        const field = name.trim();
        values[field] = readRawField(raw, field) ?? payload[field];
    });

    const expected = hmacBase64(
        buildSignatureMessage(payload.signed_field_names, values),
        secretKey
    );
    return signatureMatches(expected, payload.signature);
};

// Server-to-server confirmation. The redirect alone is not proof of payment -
// this is what we actually trust before marking a booking paid.
export const fetchEsewaTransactionStatus = async ({ transactionUuid, totalAmount }) => {
    const { productCode, statusUrl } = getEsewaConfig();
    const url = new URL(statusUrl);
    url.searchParams.set('product_code', productCode);
    url.searchParams.set('total_amount', String(Math.round(totalAmount)));
    url.searchParams.set('transaction_uuid', transactionUuid);

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
        throw new Error(`eSewa status check failed with ${res.status}`);
    }
    return res.json();
};
