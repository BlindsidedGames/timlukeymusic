// Lightweight client-side email submitter with EmailJS support and mailto fallback
// Expects globals set in the page: EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID

(function attachContactFormHandler() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    function isEmailJsConfigured() {
        return Boolean(window.emailjs && window.EMAILJS_PUBLIC_KEY && window.EMAILJS_SERVICE_ID && window.EMAILJS_TEMPLATE_ID);
    }

    function serializeForm(formElement) {
        const raw = Object.fromEntries(new FormData(formElement).entries());
        const fullName = (raw.fullName || `${raw.firstName || ''} ${raw.lastName || ''}`).trim();
        return {
            firstName: (raw.firstName || '').trim(), // kept for backward compat (unused when fullName provided)
            lastName: (raw.lastName || '').trim(),
            email: (raw.email || '').trim(),
            service: (raw.service || '').trim(),
            message: (raw.message || '').trim(),
            fullName,
        };
    }

    function validate(data) {
        if (!data.fullName || !data.email || !data.message || !data.service) {
            return 'Please fill in all required fields.';
        }
        const emailOk = /.+@.+\..+/.test(data.email);
        if (!emailOk) return 'Please enter a valid email address.';
        return '';
    }

    async function sendWithEmailJs(data) {
        try {
            if (!isEmailJsConfigured()) return false;
            emailjs.init(window.EMAILJS_PUBLIC_KEY);
            const response = await emailjs.send(window.EMAILJS_SERVICE_ID, window.EMAILJS_TEMPLATE_ID, {
                firstName: data.firstName,
                lastName: data.lastName,
                fullName: data.fullName,
                email: data.email,
                service: data.service,
                message: data.message,
            });
            return response && (response.status === 200 || response.text === 'OK');
        } catch (err) {
            console.error('EmailJS error', err);
            return false;
        }
    }

    function sendWithMailto(data) {
        const subject = encodeURIComponent(`Contact - new message from ${data.fullName}`);
        const body = encodeURIComponent(
            `Message sent by ${data.fullName} (${data.email})\nService: ${data.service}\n\n${data.message}`
        );
        const mailtoLink = `mailto:timlukeymusic@gmail.com?subject=${subject}&body=${body}`;
        window.location.href = mailtoLink;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = serializeForm(form);
        const error = validate(data);
        if (error) {
            alert(error);
            return;
        }

        // Try EmailJS; if not configured or fails, fallback to mailto
        const sent = await sendWithEmailJs(data);
        if (sent) {
            alert('Thanks! Your message has been sent.');
            form.reset();
            return;
        }

        sendWithMailto(data);
    });
})();
