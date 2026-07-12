(function initialiseSite() {
    const body = document.body;
    const header = document.querySelector('[data-site-header]');
    const menuToggle = document.querySelector('.menu-toggle');
    const navigation = document.querySelector('.site-nav');
    const servicesNav = document.querySelector('.services-nav');
    const servicesToggle = document.querySelector('.services-nav__toggle');
    const mobileBreakpoint = window.matchMedia('(max-width: 900px)');

    function setMenu(open) {
        if (!menuToggle || !navigation) return;
        navigation.classList.toggle('is-open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        body.classList.toggle('nav-open', open && mobileBreakpoint.matches);

        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('bi-list', !open);
            icon.classList.toggle('bi-x-lg', open);
        }
    }

    function setServicesMenu(open) {
        if (!servicesNav || !servicesToggle) return;
        servicesNav.classList.toggle('is-open', open);
        servicesToggle.setAttribute('aria-expanded', String(open));
    }

    if (menuToggle && navigation) {
        menuToggle.addEventListener('click', function () {
            setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
        });

        navigation.addEventListener('click', function (event) {
            if (event.target.closest('a')) {
                setMenu(false);
                setServicesMenu(false);
            }
        });
    }

    if (servicesToggle) {
        servicesToggle.addEventListener('click', function () {
            setServicesMenu(servicesToggle.getAttribute('aria-expanded') !== 'true');
        });
    }

    document.addEventListener('click', function (event) {
        if (servicesNav && !servicesNav.contains(event.target)) {
            setServicesMenu(false);
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;

        if (servicesToggle && servicesToggle.getAttribute('aria-expanded') === 'true') {
            setServicesMenu(false);
            servicesToggle.focus();
            return;
        }

        if (menuToggle && menuToggle.getAttribute('aria-expanded') === 'true') {
            setMenu(false);
            menuToggle.focus();
        }
    });

    mobileBreakpoint.addEventListener('change', function () {
        setMenu(false);
        setServicesMenu(false);
    });

    function updateHeader() {
        if (header) header.classList.toggle('is-scrolled', window.scrollY > 18);
    }

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || !('IntersectionObserver' in window)) {
        revealItems.forEach(function (item) {
            item.classList.add('is-visible');
        });
    } else {
        const revealObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, {
            rootMargin: '0px 0px -10% 0px',
            threshold: 0.12
        });

        revealItems.forEach(function (item, index) {
            item.style.transitionDelay = String(Math.min(index % 3, 2) * 70) + 'ms';
            revealObserver.observe(item);
        });
    }

    const sectionLinks = Array.from(document.querySelectorAll('.site-nav__links > a[href^="#"]'));
    const servicesSection = document.getElementById('services');
    const sectionRecords = sectionLinks.map(function (link) {
        return {
            section: document.querySelector(link.getAttribute('href')),
            link: link,
            services: false
        };
    }).filter(function (record) { return Boolean(record.section); });

    if (servicesSection) {
        sectionRecords.push({ section: servicesSection, link: null, services: true });
    }

    if (sectionRecords.length) {
        let sectionUpdateQueued = false;

        function updateSectionNavigation() {
            sectionUpdateQueued = false;
            const headerOffset = header ? header.offsetHeight : 0;
            const marker = window.scrollY + headerOffset + Math.min(window.innerHeight * 0.28, 280);
            const orderedRecords = sectionRecords.slice().sort(function (a, b) {
                return a.section.offsetTop - b.section.offsetTop;
            });
            let activeRecord = orderedRecords[0];

            orderedRecords.forEach(function (record) {
                if (record.section.offsetTop <= marker) activeRecord = record;
            });

            sectionLinks.forEach(function (link) {
                if (activeRecord.link === link) {
                    link.setAttribute('aria-current', 'location');
                } else {
                    link.removeAttribute('aria-current');
                }
            });

            if (servicesToggle) {
                servicesToggle.classList.toggle('is-section-current', activeRecord.services);
            }
        }

        function queueSectionNavigationUpdate() {
            if (sectionUpdateQueued) return;
            sectionUpdateQueued = true;
            window.requestAnimationFrame(updateSectionNavigation);
        }

        updateSectionNavigation();
        window.addEventListener('scroll', queueSectionNavigationUpdate, { passive: true });
        window.addEventListener('resize', queueSectionNavigationUpdate);
    }

    document.querySelectorAll('[data-current-year]').forEach(function (node) {
        node.textContent = String(new Date().getFullYear());
    });

    initialiseFeaturedVideo();
    initialiseDirectionsPlayer();
    initialiseContactForm();
})();

function initialiseFeaturedVideo() {
    const player = document.querySelector('[data-video-player]');
    const triggers = Array.from(document.querySelectorAll('[data-video-play]'));
    if (!player || !triggers.length) return;

    let iframe = null;

    function loadPlayer() {
        document.querySelectorAll('audio').forEach(function (audio) {
            if (!audio.paused) audio.pause();
        });

        if (iframe) {
            iframe.focus();
            return;
        }

        const status = player.querySelector('[data-video-status]');
        const videoOrigin = encodeURIComponent(window.location.origin);
        iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/FvdDH5vmQ40?autoplay=1&rel=0&enablejsapi=1&origin=' + videoOrigin;
        iframe.title = 'Tim Lukey Music showreel';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allowFullscreen = true;

        player.replaceChildren(iframe);
        if (status) {
            status.textContent = 'Showreel player loaded.';
            player.appendChild(status);
        }
        iframe.focus();
    }

    triggers.forEach(function (trigger) {
        trigger.addEventListener('click', loadPlayer);
    });
}

function pauseFeaturedVideo() {
    const iframe = document.querySelector('[data-video-player] iframe');
    if (!iframe || !iframe.contentWindow) return;

    try {
        iframe.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: 'pauseVideo',
            args: []
        }), 'https://www.youtube-nocookie.com');
    } catch (error) {
        // Playback remains usable even if the embedded player rejects the command.
    }
}

function initialiseDirectionsPlayer() {
    const player = document.querySelector('[data-directions-player]');
    if (!player) return;

    const audio = player.querySelector('[data-directions-audio]');
    const disclosure = player.querySelector('[data-directions-toggle]');
    const panel = player.querySelector('[data-directions-panel]');
    const toggleLabel = player.querySelector('[data-directions-toggle-label]');
    const playButton = player.querySelector('[data-directions-play]');
    const playIcon = playButton ? playButton.querySelector('i') : null;
    const currentTrack = player.querySelector('[data-directions-current]');
    const position = player.querySelector('[data-directions-position]');
    const summary = player.querySelector('[data-directions-summary]');
    const status = player.querySelector('[data-directions-status]');
    const tracks = Array.from(player.querySelectorAll('[data-directions-track]'));

    if (!audio || !disclosure || !panel || !playButton || !tracks.length) return;

    let activeIndex = Math.max(0, tracks.findIndex(function (track) {
        return track.getAttribute('aria-current') === 'true';
    }));
    let hasStarted = false;

    function titleFor(index) {
        const track = tracks[index];
        return track ? String(track.dataset.trackTitle || 'Directions') : 'Directions';
    }

    function announce(message) {
        if (!status) return;
        status.textContent = '';
        window.requestAnimationFrame(function () {
            status.textContent = message;
        });
    }

    function setOpen(open) {
        panel.hidden = !open;
        player.classList.toggle('is-open', open);
        disclosure.setAttribute('aria-expanded', String(open));
        disclosure.setAttribute('aria-label', (open ? 'Hide' : 'View') + ' tracks for Directions');
        if (toggleLabel) toggleLabel.textContent = open ? 'Hide tracks' : 'View tracks';
    }

    function setSummary(label) {
        if (!summary) return;
        summary.textContent = label || '2018 EP · 5 tracks';
    }

    function updateTrackSelection() {
        const title = titleFor(activeIndex);

        tracks.forEach(function (track, index) {
            if (index === activeIndex) {
                track.setAttribute('aria-current', 'true');
            } else {
                track.removeAttribute('aria-current');
            }
        });

        if (currentTrack) currentTrack.textContent = title;
        if (position) {
            position.textContent = String(activeIndex + 1).padStart(2, '0') + ' / ' + String(tracks.length).padStart(2, '0');
        }
    }

    function updatePlaybackControls() {
        const title = titleFor(activeIndex);
        const isPlaying = !audio.paused && !audio.ended;

        playButton.classList.toggle('is-playing', isPlaying);
        playButton.setAttribute('aria-label', (isPlaying ? 'Pause ' : 'Play ') + title + ' from Directions');

        if (playIcon) {
            playIcon.classList.toggle('bi-play-fill', !isPlaying);
            playIcon.classList.toggle('bi-pause-fill', isPlaying);
        }
    }

    function playCurrentTrack() {
        setOpen(true);
        const playRequest = audio.play();
        if (playRequest && typeof playRequest.catch === 'function') {
            playRequest.catch(function () {
                setSummary('Ready · ' + titleFor(activeIndex));
                announce(titleFor(activeIndex) + ' is ready. Use the audio controls to play.');
                updatePlaybackControls();
            });
        }
    }

    function selectTrack(index, shouldPlay) {
        const track = tracks[index];
        if (!track) return;

        const source = new URL(track.dataset.trackSrc, window.location.href).href;
        const isSameTrack = activeIndex === index && (audio.src === source || audio.currentSrc === source);

        if (isSameTrack && !audio.paused && !audio.ended) {
            setOpen(true);
            setSummary('Playing · ' + titleFor(index));
            announce('Playing ' + titleFor(index) + '.');
            updateTrackSelection();
            updatePlaybackControls();
            return;
        }

        if (audio.src !== source && audio.currentSrc !== source) {
            audio.src = source;
            audio.load();
        } else if (audio.ended) {
            audio.currentTime = 0;
        }

        activeIndex = index;
        hasStarted = false;
        updateTrackSelection();
        updatePlaybackControls();
        setSummary('Selected · ' + titleFor(index));
        setOpen(true);
        announce('Selected track ' + (index + 1) + ' of ' + tracks.length + ': ' + titleFor(index) + '.');

        if (shouldPlay) playCurrentTrack();
    }

    disclosure.addEventListener('click', function () {
        setOpen(disclosure.getAttribute('aria-expanded') !== 'true');
    });

    playButton.addEventListener('click', function () {
        if (audio.paused || audio.ended) {
            if (audio.ended) audio.currentTime = 0;
            playCurrentTrack();
        } else {
            audio.pause();
        }
    });

    tracks.forEach(function (track, index) {
        track.addEventListener('click', function () {
            selectTrack(index, true);
        });
    });

    audio.addEventListener('play', function () {
        hasStarted = true;
        pauseFeaturedVideo();
        setSummary('Playing · ' + titleFor(activeIndex));
        announce('Playing ' + titleFor(activeIndex) + '.');
        updatePlaybackControls();
    });

    audio.addEventListener('pause', function () {
        if (hasStarted && !audio.ended) {
            setSummary('Paused · ' + titleFor(activeIndex));
            announce('Paused ' + titleFor(activeIndex) + '.');
        }
        updatePlaybackControls();
    });

    audio.addEventListener('ended', function () {
        if (activeIndex < tracks.length - 1) {
            selectTrack(activeIndex + 1, true);
            return;
        }

        hasStarted = false;
        setSummary('Finished · Directions');
        announce('Directions EP finished.');
        updatePlaybackControls();
    });

    audio.addEventListener('error', function () {
        hasStarted = false;
        setSummary('Unavailable · ' + titleFor(activeIndex));
        announce('This track could not be loaded. Please choose another track.');
        updatePlaybackControls();
    });

    updateTrackSelection();
    updatePlaybackControls();
    setOpen(false);
}

function setContactVerificationState(verified) {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const gate = form.querySelector('[data-verification-gate]');
    const fields = form.querySelector('[data-contact-fields]');
    const success = form.querySelector('[data-contact-success]');

    if (gate) gate.hidden = verified;
    if (fields) fields.hidden = !verified;
    if (success) success.hidden = true;
    form.classList.toggle('is-verified', verified);
}

function showContactSuccess() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const gate = form.querySelector('[data-verification-gate]');
    const fields = form.querySelector('[data-contact-fields]');
    const success = form.querySelector('[data-contact-success]');

    if (gate) gate.hidden = true;
    if (fields) fields.hidden = true;
    if (success) {
        success.hidden = false;
        success.focus();
    }
    form.classList.remove('is-verified');
}

function initialiseContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const submitButton = form.querySelector('button[type="submit"]');
    const submitLabel = submitButton ? submitButton.querySelector('[data-submit-label]') : null;
    const status = form.querySelector('[data-form-status]');

    setContactVerificationState(false);
    initialiseTurnstileWidget(form);

    function field(name) {
        return form.elements.namedItem(name);
    }

    function errorElement(name) {
        return form.querySelector('[data-error-for="' + name + '"]');
    }

    function setFieldError(name, message) {
        const input = field(name);
        const error = errorElement(name);
        if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
        if (error) error.textContent = message || '';
        if (name === 'turnstileToken') {
            const verification = form.querySelector('.verification-wrap');
            if (verification) verification.classList.toggle('has-error', Boolean(message));
        }
    }

    function focusField(name) {
        if (name === 'turnstileToken') {
            const verificationFrame = form.querySelector('[data-turnstile-widget] iframe');
            if (verificationFrame) verificationFrame.focus();
            return;
        }

        const input = field(name);
        if (input && typeof input.focus === 'function') input.focus();
    }

    function clearErrors() {
        ['name', 'email', 'service', 'subject', 'message', 'turnstileToken'].forEach(function (name) {
            setFieldError(name, '');
        });
    }

    function setStatus(message, type) {
        if (!status) return;
        status.textContent = message || '';
        status.classList.toggle('is-error', type === 'error');
        status.classList.toggle('is-success', type === 'success');
    }

    function setSending(sending) {
        if (!submitButton) return;
        submitButton.disabled = sending;
        submitButton.setAttribute('aria-busy', String(sending));
        if (submitLabel) submitLabel.textContent = sending ? 'Sending…' : 'Send message';
        const icon = submitButton.querySelector('i');
        if (icon) {
            icon.classList.toggle('bi-send', !sending);
            icon.classList.toggle('bi-arrow-repeat', sending);
            icon.classList.toggle('is-spinning', sending);
        }
    }

    function values() {
        return {
            name: String(field('name') ? field('name').value : '').trim(),
            email: String(field('email') ? field('email').value : '').trim(),
            service: String(field('service') ? field('service').value : '').trim(),
            subject: String(field('subject') ? field('subject').value : '').trim(),
            message: String(field('message') ? field('message').value : '').trim(),
            turnstileToken: String(field('turnstileToken') ? field('turnstileToken').value : '').trim()
        };
    }

    function validate(data) {
        const errors = {};
        if (data.name.length < 2) errors.name = 'Please enter your name.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Please enter a valid email address.';
        if (!data.service) errors.service = 'Please choose a service.';
        if (data.subject.length < 3) errors.subject = 'Please add a short subject.';
        if (data.message.length < 12) errors.message = 'Please include a little more detail.';
        if (field('turnstileToken') && !data.turnstileToken) errors.turnstileToken = 'Please complete the verification.';
        return errors;
    }

    form.addEventListener('input', function (event) {
        if (event.target && event.target.name) setFieldError(event.target.name, '');
    });

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        clearErrors();
        setStatus('', '');

        const data = values();
        const errors = validate(data);
        const firstErrorName = Object.keys(errors)[0];

        Object.keys(errors).forEach(function (name) {
            setFieldError(name, errors[name]);
        });

        if (firstErrorName) {
            focusField(firstErrorName);
            setStatus('Please review the highlighted fields.', 'error');
            return;
        }

        setSending(true);
        setStatus('Sending your message…', '');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            let result = {};
            try {
                result = await response.json();
            } catch (parseError) {
                result = {};
            }

            if (!response.ok) {
                const fieldErrors = result.errors || (result.error && result.error.fields);
                if (fieldErrors && typeof fieldErrors === 'object') {
                    if (fieldErrors.turnstileToken) {
                        const turnstileInput = field('turnstileToken');
                        if (turnstileInput) turnstileInput.value = '';
                        if (window.turnstile && typeof window.turnstile.reset === 'function') {
                            window.turnstile.reset();
                        }
                        setContactVerificationState(false);
                    }

                    Object.keys(fieldErrors).forEach(function (name) {
                        setFieldError(name, fieldErrors[name]);
                    });
                    const firstServerError = Object.keys(fieldErrors)[0];
                    if (firstServerError) {
                        window.setTimeout(function () { focusField(firstServerError); }, 0);
                    }
                }

                const previewMessage = response.status === 404 || response.status === 405 || response.status === 501
                    ? 'Sending is not connected in this local preview yet. The production form uses the secure website endpoint.'
                    : ((result.error && result.error.message) || result.error || 'Message failed to send. Please try again.');

                throw new Error(previewMessage);
            }

            form.reset();
            if (window.turnstile && typeof window.turnstile.reset === 'function') {
                window.turnstile.reset();
            }
            setStatus('', '');
            showContactSuccess();
        } catch (error) {
            const message = error && error.message
                ? error.message
                : 'Network error. Please try again in a moment.';
            setStatus(message, 'error');
        } finally {
            setSending(false);
        }
    });
}

async function initialiseTurnstileWidget(form) {
    const widget = form.querySelector('[data-turnstile-widget]');
    const error = form.querySelector('[data-error-for="turnstileToken"]');
    if (!widget) return;

    const localHosts = ['localhost', '127.0.0.1', '::1'];
    const isLocalPreview = localHosts.includes(window.location.hostname);
    let siteKey = '';

    try {
        const response = await fetch('/api/contact-config', {
            headers: { Accept: 'application/json' },
            cache: 'no-store'
        });
        if (response.ok) {
            const config = await response.json();
            siteKey = String(config.siteKey || '').trim();
        }
    } catch (errorFromConfig) {
        siteKey = '';
    }

    if (!siteKey && isLocalPreview) {
        siteKey = '1x00000000000000000000AA';
    }

    if (!siteKey) {
        if (error) error.textContent = 'Secure verification is not configured for this deployment.';
        return;
    }

    for (let attempt = 0; attempt < 25; attempt += 1) {
        if (window.turnstile && typeof window.turnstile.render === 'function') break;
        await new Promise(function (resolve) { window.setTimeout(resolve, 200); });
    }

    if (!window.turnstile || typeof window.turnstile.render !== 'function') {
        if (error) error.textContent = 'Secure verification could not load. Please refresh and try again.';
        return;
    }

    window.turnstile.render(widget, {
        sitekey: siteKey,
        theme: 'dark',
        size: window.matchMedia('(max-width: 359px)').matches ? 'compact' : 'flexible',
        callback: window.onTurnstileSuccess,
        'expired-callback': window.onTurnstileExpired,
        'error-callback': window.onTurnstileError
    });
}

window.onTurnstileSuccess = function (token) {
    const input = document.querySelector('input[name="turnstileToken"]');
    const error = document.querySelector('[data-error-for="turnstileToken"]');
    if (input) {
        input.value = token;
        input.setAttribute('aria-invalid', 'false');
    }
    if (error) error.textContent = '';
    const verification = document.querySelector('.verification-wrap');
    if (verification) verification.classList.remove('has-error');
    setContactVerificationState(true);
};

window.onTurnstileExpired = function () {
    const input = document.querySelector('input[name="turnstileToken"]');
    const error = document.querySelector('[data-error-for="turnstileToken"]');
    if (input) {
        input.value = '';
        input.setAttribute('aria-invalid', 'true');
    }
    if (error) error.textContent = 'Verification expired. Please try again.';
    const verification = document.querySelector('.verification-wrap');
    if (verification) verification.classList.add('has-error');
    setContactVerificationState(false);
};

window.onTurnstileError = function () {
    const input = document.querySelector('input[name="turnstileToken"]');
    const error = document.querySelector('[data-error-for="turnstileToken"]');
    if (input) {
        input.value = '';
        input.setAttribute('aria-invalid', 'true');
    }
    if (error) error.textContent = 'Verification could not load. Please refresh and try again.';
    const verification = document.querySelector('.verification-wrap');
    if (verification) verification.classList.add('has-error');
    setContactVerificationState(false);
};
