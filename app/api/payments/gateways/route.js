import { getEsewaConfig } from '@/lib/payments/esewa';
import { getKhaltiConfig, isKhaltiEnabled } from '@/lib/payments/khalti';

export const dynamic = 'force-dynamic';

// GET /api/payments/gateways
// Lets the checkout UI show only the wallets this deployment can actually reach.
// eSewa always works because its sandbox merchant (EPAYTEST) is public; Khalti
// needs a secret key, so it stays hidden until one is configured.
export const GET = async () => {
    const esewa = getEsewaConfig();
    const khalti = getKhaltiConfig();

    const gateways = [
        {
            id: 'esewa',
            label: 'eSewa',
            enabled: true,
            mode: esewa.mode
        },
        {
            id: 'khalti',
            label: 'Khalti',
            enabled: isKhaltiEnabled(),
            mode: khalti.mode
        }
    ];

    return new Response(JSON.stringify(gateways), { status: 200 });
};
