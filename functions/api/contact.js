import {
    enforceRateLimit,
    jsonResponse,
    parseAndValidateContactRequest,
    sendContactEmail,
    verifyTurnstile
} from '../_utils/contact.js';

const requiredEnvironmentValues = [
    'TURNSTILE_SECRET_KEY',
    'CONTACT_TO_EMAIL',
    'RESEND_API_KEY'
];

export async function onRequestPost(context) {
    const env = context.env;
    const request = context.request;

    for (const key of requiredEnvironmentValues) {
        if (!env[key]) {
            return jsonResponse(500, {
                ok: false,
                error: {
                    code: 'server_misconfigured',
                    message: 'The contact service is not fully configured.'
                }
            });
        }
    }

    const rateLimitResult = await enforceRateLimit(request, env);
    if (!rateLimitResult.allowed) {
        return jsonResponse(429, {
            ok: false,
            error: {
                code: 'rate_limited',
                message: 'Too many requests. Please retry shortly.'
            }
        }, {
            'Retry-After': String(rateLimitResult.retryAfterSeconds)
        });
    }

    let body;
    try {
        body = await request.json();
    } catch (error) {
        return jsonResponse(400, {
            ok: false,
            error: {
                code: 'invalid_json',
                message: 'Request body must be valid JSON.'
            }
        });
    }

    const parsed = parseAndValidateContactRequest(body);
    if (parsed.error) {
        return jsonResponse(400, {
            ok: false,
            error: parsed.error
        });
    }

    const turnstileResult = await verifyTurnstile(parsed.data.turnstileToken, request, env);
    if (!turnstileResult.success) {
        const firstErrorCode = turnstileResult.errorCodes[0] || 'unknown';
        console.warn('Turnstile verification failed', {
            httpStatus: turnstileResult.httpStatus,
            errorCodes: turnstileResult.errorCodes,
            cfRay: request.headers.get('CF-Ray') || null
        });

        return jsonResponse(400, {
            ok: false,
            error: {
                code: 'turnstile_failed',
                message: 'Secure verification failed. Please retry.',
                fields: {
                    turnstileToken: 'Secure verification failed (' + firstErrorCode + '). Please retry.'
                }
            }
        });
    }

    try {
        await sendContactEmail(parsed.data, env);
        return jsonResponse(200, {
            ok: true,
            message: 'Message sent successfully.'
        });
    } catch (error) {
        console.error('Contact submission email error', error);
        return jsonResponse(502, {
            ok: false,
            error: {
                code: 'delivery_failed',
                message: 'Message could not be delivered right now. Please retry or contact Tim directly.'
            }
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            Allow: 'POST, OPTIONS'
        }
    });
}
