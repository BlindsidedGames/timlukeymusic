import { jsonResponse } from '../_utils/contact.js';

export async function onRequestGet(context) {
    const env = context.env;
    const siteKey = String(env.PUBLIC_TURNSTILE_SITE_KEY || '').trim();
    const serviceIsReady = Boolean(
        siteKey
        && String(env.TURNSTILE_SECRET_KEY || '').trim()
        && String(env.CONTACT_TO_EMAIL || '').trim()
        && String(env.RESEND_API_KEY || '').trim()
    );

    if (!serviceIsReady) {
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
