// Gateways redirect the browser back to us, so callback routes answer with a
// 303 to a page the user can actually read.

export const resolveBaseUrl = (request) => {
    const configured = process.env.NEXT_PUBLIC_DOMAIN;
    if (configured) {
        return configured.replace(/\/$/, '');
    }
    return new URL(request.url).origin;
};

export const redirectTo = (baseUrl, path, params = {}) => {
    const url = new URL(`${baseUrl}${path}`);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, value);
        }
    });
    return Response.redirect(url.toString(), 303);
};

export const redirectToBooking = (baseUrl, bookingId, payment) =>
    bookingId
        ? redirectTo(baseUrl, `/bookings/${bookingId}`, { payment })
        : redirectTo(baseUrl, '/bookings', { payment });
