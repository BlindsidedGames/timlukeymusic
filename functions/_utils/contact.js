const inMemoryRateLimitState = new Map();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitiseValue(value, maxLength) {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, maxLength);
}

export function parseAndValidateContactRequest(input) {
    if (!input || typeof input !== 'object') {
        return {
            error: {
                code: 'invalid_payload',
                message: 'Request body must be JSON.'
            }
        };
    }

    const data = {
        name: sanitiseValue(input.name, 120),
        email: sanitiseValue(input.email, 160),
        service: sanitiseValue(input.service, 120),
        message: sanitiseValue(input.message, 5000),
        turnstileToken: sanitiseValue(input.turnstileToken, 4000)
    };

    const fields = {};
    if (data.name.length < 2) fields.name = 'Name must be at least 2 characters.';
    if (!EMAIL_REGEX.test(data.email)) fields.email = 'Enter a valid email address.';
    if (!data.service) fields.service = 'Choose the service you are interested in.';
    if (data.message.length < 12) fields.message = 'Message must be at least 12 characters.';
    if (!data.turnstileToken) fields.turnstileToken = 'Secure verification is required.';

    if (Object.keys(fields).length) {
        return {
            error: {
                code: 'validation_failed',
                message: 'Please correct the highlighted fields.',
                fields
            }
        };
    }

    return { data };
}

export function jsonResponse(status, payload, extraHeaders) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            ...(extraHeaders || {})
        }
    });
}

function getClientIp(request) {
    return request.headers.get('CF-Connecting-IP') || 'unknown';
}

async function hashRateLimitKey(value) {
    const encoded = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
        .map(function (byte) { return byte.toString(16).padStart(2, '0'); })
        .join('');
}

export async function enforceRateLimit(request, env) {
    const key = 'contact:' + await hashRateLimitKey(getClientIp(request));
    const now = Date.now();
    const configuredWindow = Number(env.CONTACT_RATE_LIMIT_WINDOW_SECONDS || 600);
    const configuredMaximum = Number(env.CONTACT_RATE_LIMIT_MAX_REQUESTS || 5);
    const windowSeconds = Number.isFinite(configuredWindow) && configuredWindow > 0 ? configuredWindow : 600;
    const maxRequests = Number.isFinite(configuredMaximum) && configuredMaximum > 0 ? configuredMaximum : 5;
    const initialState = { count: 0, resetAt: now + windowSeconds * 1000 };

    if (env.CONTACT_RATE_LIMIT_KV) {
        const currentEntry = await env.CONTACT_RATE_LIMIT_KV.get(key, { type: 'json' });
        const state = currentEntry && currentEntry.resetAt > now ? currentEntry : initialState;

        if (state.count >= maxRequests) {
            return {
                allowed: false,
                retryAfterSeconds: Math.max(1, Math.ceil((state.resetAt - now) / 1000))
            };
        }

        state.count += 1;
        await env.CONTACT_RATE_LIMIT_KV.put(key, JSON.stringify(state), {
            expirationTtl: windowSeconds
        });
        return { allowed: true };
    }

    const currentEntry = inMemoryRateLimitState.get(key);
    const state = currentEntry && currentEntry.resetAt > now ? currentEntry : initialState;

    if (state.count >= maxRequests) {
        return {
            allowed: false,
            retryAfterSeconds: Math.max(1, Math.ceil((state.resetAt - now) / 1000))
        };
    }

    state.count += 1;
    inMemoryRateLimitState.set(key, state);
    return { allowed: true };
}

export async function verifyTurnstile(token, request, env) {
    const body = new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token
    });

    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) body.set('remoteip', ip);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
    });

    let result = {};
    try {
        result = await response.json();
    } catch (error) {
        result = {};
    }

    const errorCodes = Array.isArray(result['error-codes'])
        ? result['error-codes'].filter(function (code) { return typeof code === 'string'; })
        : [];

    return {
        success: response.ok && Boolean(result.success),
        errorCodes,
        httpStatus: response.status
    };
}

export async function sendContactEmail(payload, env) {
    const from = env.CONTACT_EMAIL_FROM || 'Tim Lukey Music <no-reply@timlukeymusic.com>';
    const enquiryType = /\b(?:enquiry|inquiry|enquiries|inquiries)$/i.test(payload.service)
        ? payload.service
        : payload.service + ' enquiry';
    const messageText = [
        'Name: ' + payload.name,
        'Email: ' + payload.email,
        'Service: ' + payload.service,
        '',
        payload.message
    ].join('\n');

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + env.RESEND_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from,
            to: [env.CONTACT_TO_EMAIL],
            reply_to: payload.email,
            subject: enquiryType + ' from ' + payload.name,
            text: messageText
        })
    });

    if (!response.ok) {
        const responseBody = await response.text();
        throw new Error('Resend email failure: ' + response.status + ' ' + responseBody);
    }
}
