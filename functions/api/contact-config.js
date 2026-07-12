import { jsonResponse } from '../_utils/contact.js';

export async function onRequestGet(context) {
    const siteKey = String(context.env.PUBLIC_TURNSTILE_SITE_KEY || '').trim();

    if (!siteKey) {
        return jsonResponse(500, {
            ok: false,
            error: {
                code: 'server_misconfigured',
                message: 'Secure verification is not configured.'
            }
        });
    }

    return jsonResponse(200, {
        ok: true,
        siteKey
    });
}
