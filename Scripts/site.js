(function initialiseSite() {
    const body = document.body;
    const header = document.querySelector('[data-site-header]');
    const menuToggle = document.querySelector('.menu-toggle');
    const navigation = document.querySelector('.site-nav');
    const servicesNav = document.querySelector('.services-nav');
    const servicesToggle = document.querySelector('.services-nav__toggle');
    const mobileBreakpoint = window.matchMedia('(max-width: 900px)');
    let lockedScrollPosition = 0;
    let scrollIsLocked = false;
    let previousBodyTop = '';

    function lockPageScroll() {
        if (scrollIsLocked) return;

        lockedScrollPosition = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
        previousBodyTop = body.style.top;
        body.style.top = '-' + lockedScrollPosition + 'px';
        document.documentElement.classList.add('nav-open');
        body.classList.add('nav-open');
        scrollIsLocked = true;
    }

    function unlockPageScroll() {
        document.documentElement.classList.remove('nav-open');
        body.classList.remove('nav-open');

        if (!scrollIsLocked) return;

        body.style.top = previousBodyTop;
        const previousScrollBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, lockedScrollPosition);
        document.documentElement.style.scrollBehavior = previousScrollBehavior;
        scrollIsLocked = false;
    }

    function setMenu(open) {
        if (!menuToggle || !navigation) return;
        const wasOpen = menuToggle.getAttribute('aria-expanded') === 'true';
        const shouldOpen = Boolean(open && mobileBreakpoint.matches);
        navigation.classList.toggle('is-open', shouldOpen);
        menuToggle.setAttribute('aria-expanded', String(shouldOpen));

        if (shouldOpen) {
            lockPageScroll();
            if (!wasOpen) {
                window.requestAnimationFrame(function () {
                    if (menuToggle.getAttribute('aria-expanded') !== 'true') return;
                    const firstNavigationControl = navigation.querySelector('a[href], button:not([disabled])');
                    if (!firstNavigationControl) return;

                    try {
                        firstNavigationControl.focus({ preventScroll: true });
                    } catch (error) {
                        firstNavigationControl.focus();
                    }
                });
            }
        } else {
            unlockPageScroll();
            setServicesMenu(false);

            if (wasOpen && navigation.contains(document.activeElement)) {
                try {
                    menuToggle.focus({ preventScroll: true });
                } catch (error) {
                    menuToggle.focus();
                }
            }
        }

        const icon = menuToggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('bi-list', !shouldOpen);
            icon.classList.toggle('bi-x-lg', shouldOpen);
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
        if (event.key === 'Tab' && header && menuToggle && navigation && menuToggle.getAttribute('aria-expanded') === 'true') {
            const focusableControls = Array.from(header.querySelectorAll('a[href], button:not([disabled])')).filter(function (control) {
                return control.getClientRects().length > 0 && control.getAttribute('aria-hidden') !== 'true';
            });
            const firstControl = focusableControls[0];
            const lastControl = focusableControls[focusableControls.length - 1];

            if (firstControl && lastControl && event.shiftKey && document.activeElement === firstControl) {
                event.preventDefault();
                lastControl.focus();
            } else if (firstControl && lastControl && !event.shiftKey && document.activeElement === lastControl) {
                event.preventDefault();
                firstControl.focus();
            }
            return;
        }

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

    function handleBreakpointChange() {
        setMenu(false);
    }

    if (typeof mobileBreakpoint.addEventListener === 'function') {
        mobileBreakpoint.addEventListener('change', handleBreakpointChange);
    } else if (typeof mobileBreakpoint.addListener === 'function') {
        mobileBreakpoint.addListener(handleBreakpointChange);
    }

    window.addEventListener('pageshow', function (event) {
        if (event.persisted) setMenu(false);
    });

    setMenu(false);

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
    const bar = player.querySelector('.directions-player__bar');
    const panel = player.querySelector('[data-directions-panel]');
    const toggleLabel = player.querySelector('[data-directions-toggle-label]');
    const playButton = player.querySelector('[data-directions-play]');
    const playIcon = playButton ? playButton.querySelector('i') : null;
    const currentTrack = player.querySelector('[data-directions-current]');
    const position = player.querySelector('[data-directions-position]');
    const expandedPlaySlot = player.querySelector('[data-directions-play-slot]');
    const playbackState = player.querySelector('[data-directions-state]');
    const status = player.querySelector('[data-directions-status]');
    const tracks = Array.from(player.querySelectorAll('[data-directions-track]'));
    const customControls = player.querySelector('[data-directions-controls]');
    const seekControl = player.querySelector('[data-directions-seek]');
    const currentTimeNode = player.querySelector('[data-directions-current-time]');
    const durationNode = player.querySelector('[data-directions-duration]');
    const muteButton = player.querySelector('[data-directions-mute]');
    const muteIcon = muteButton ? muteButton.querySelector('i') : null;
    const volumeControl = player.querySelector('[data-directions-volume]');
    const volumeControls = player.querySelector('[data-directions-volume-controls]');

    if (!audio || !disclosure || !bar || !panel || !playButton || !tracks.length) return;

    const canUseCustomControls = Boolean(
        customControls && seekControl && currentTimeNode && durationNode &&
        muteButton && muteIcon && volumeControl && volumeControls
    );
    let activeIndex = Math.max(0, tracks.findIndex(function (track) {
        return track.getAttribute('aria-current') === 'true';
    }));
    let hasStarted = false;
    let isSeeking = false;
    let lastNonZeroVolume = audio.volume > 0 ? audio.volume : 1;

    function titleFor(index) {
        const track = tracks[index];
        return track ? String(track.dataset.trackTitle || 'Directions') : 'Directions';
    }

    function fallbackDurationFor(index) {
        const track = tracks[index];
        const duration = track ? Number(track.dataset.trackDuration) : 0;
        return Number.isFinite(duration) && duration > 0 ? duration : 0;
    }

    function formatTime(seconds) {
        const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
        const minutes = Math.floor(safeSeconds / 60);
        return minutes + ':' + String(safeSeconds % 60).padStart(2, '0');
    }

    function describeTime(seconds) {
        const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
        const minutes = Math.floor(safeSeconds / 60);
        const remainder = safeSeconds % 60;
        const parts = [];

        if (minutes) parts.push(minutes + ' ' + (minutes === 1 ? 'minute' : 'minutes'));
        if (remainder || !minutes) parts.push(remainder + ' ' + (remainder === 1 ? 'second' : 'seconds'));
        return parts.join(' ');
    }

    function setTimeNode(node, seconds) {
        if (!node) return;
        const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
        node.textContent = formatTime(safeSeconds);
        node.setAttribute('datetime', 'PT' + Math.floor(safeSeconds) + 'S');
    }

    function setRangeProgress(control, current, maximum) {
        if (!control) return;
        const progress = maximum > 0 ? Math.min(100, Math.max(0, (current / maximum) * 100)) : 0;
        control.style.setProperty('--range-progress', progress.toFixed(2) + '%');
    }

    function announce(message) {
        if (!status) return;
        status.textContent = '';
        window.requestAnimationFrame(function () {
            status.textContent = message;
        });
    }

    function setOpen(open) {
        const useExpandedSlot = open && expandedPlaySlot && player.classList.contains('has-custom-audio');
        const destination = useExpandedSlot ? expandedPlaySlot : bar;

        if (open) panel.hidden = false;
        if (destination && playButton.parentElement !== destination) destination.appendChild(playButton);
        if (!open) panel.hidden = true;

        player.classList.toggle('is-open', open);
        disclosure.setAttribute('aria-expanded', String(open));
        disclosure.setAttribute('aria-label', (open ? 'Hide' : 'View') + ' tracks for Directions');
        if (toggleLabel) toggleLabel.textContent = open ? 'Hide tracks' : 'View tracks';
    }

    function setPlaybackState(label) {
        if (playbackState) playbackState.textContent = label || 'Selected track';
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

        if (seekControl) seekControl.setAttribute('aria-label', 'Seek within ' + title);
    }

    function updatePlaybackControls() {
        const title = titleFor(activeIndex);
        const isPlaying = !audio.paused && !audio.ended;

        player.classList.toggle('is-playing', isPlaying);
        playButton.classList.toggle('is-playing', isPlaying);
        playButton.setAttribute('aria-label', (isPlaying ? 'Pause ' : 'Play ') + title + ' from Directions');

        if (playIcon) {
            playIcon.classList.toggle('bi-play-fill', !isPlaying);
            playIcon.classList.toggle('bi-pause-fill', isPlaying);
        }
    }

    function resetTimeline() {
        if (!canUseCustomControls) return;

        const fallbackDuration = fallbackDurationFor(activeIndex);
        isSeeking = false;
        seekControl.disabled = true;
        seekControl.min = '0';
        seekControl.max = '0';
        seekControl.value = '0';
        seekControl.setAttribute('aria-valuetext', '0 seconds of ' + describeTime(fallbackDuration));
        setRangeProgress(seekControl, 0, fallbackDuration);
        setTimeNode(currentTimeNode, 0);
        setTimeNode(durationNode, fallbackDuration);
    }

    function updateTimeline(force) {
        if (!canUseCustomControls) return;

        const mediaDuration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
        const displayedDuration = mediaDuration || fallbackDurationFor(activeIndex);
        const mediaTime = Number.isFinite(audio.currentTime) && audio.currentTime > 0 ? audio.currentTime : 0;
        const current = displayedDuration > 0 ? Math.min(mediaTime, displayedDuration) : mediaTime;

        seekControl.disabled = !mediaDuration;
        seekControl.max = mediaDuration ? String(mediaDuration) : '0';
        if (!isSeeking || force) seekControl.value = String(mediaDuration ? Math.min(current, mediaDuration) : 0);

        const displayedCurrent = isSeeking && !force ? Number(seekControl.value) : current;
        setTimeNode(currentTimeNode, displayedCurrent);
        setTimeNode(durationNode, displayedDuration);
        setRangeProgress(seekControl, Number(seekControl.value), mediaDuration || displayedDuration);
        seekControl.setAttribute('aria-valuetext', describeTime(displayedCurrent) + ' of ' + describeTime(displayedDuration));
    }

    function previewSeek() {
        if (!canUseCustomControls || seekControl.disabled) return;

        const maximum = Number(seekControl.max);
        const requestedTime = Number(seekControl.value);
        if (!Number.isFinite(maximum) || maximum <= 0 || !Number.isFinite(requestedTime)) return;

        const nextTime = Math.min(maximum, Math.max(0, requestedTime));
        isSeeking = true;
        setTimeNode(currentTimeNode, nextTime);
        setRangeProgress(seekControl, nextTime, maximum);
        seekControl.setAttribute('aria-valuetext', describeTime(nextTime) + ' of ' + describeTime(maximum));

        try {
            audio.currentTime = nextTime;
        } catch (error) {
            // Keep the native audio fallback usable if the media is not seekable yet.
        }
    }

    function finishSeeking() {
        if (!canUseCustomControls) return;
        isSeeking = false;
        updateTimeline(true);
    }

    function updateVolumeControls() {
        if (!canUseCustomControls) return;

        const volume = Number.isFinite(audio.volume) ? audio.volume : 1;
        const isMuted = audio.muted || volume === 0;
        muteButton.setAttribute('aria-pressed', String(isMuted));
        muteIcon.classList.toggle('bi-volume-up-fill', !isMuted);
        muteIcon.classList.toggle('bi-volume-mute-fill', isMuted);
        volumeControl.value = String(volume);
        volumeControl.setAttribute('aria-valuetext', Math.round(volume * 100) + ' percent');
        setRangeProgress(volumeControl, volume, 1);

        if (!isMuted && volume > 0) lastNonZeroVolume = volume;
    }

    function supportsScriptVolume() {
        const originalVolume = audio.volume;
        const testVolume = originalVolume > 0.98 ? 0.97 : Math.min(1, originalVolume + 0.02);

        try {
            audio.volume = testVolume;
            const supported = Math.abs(audio.volume - testVolume) < 0.001;
            audio.volume = originalVolume;
            return supported;
        } catch (error) {
            try {
                audio.volume = originalVolume;
            } catch (restoreError) {
                // Hardware volume remains available when script volume is unsupported.
            }
            return false;
        }
    }

    function playCurrentTrack() {
        const playRequest = audio.play();
        if (playRequest && typeof playRequest.catch === 'function') {
            playRequest.catch(function () {
                player.classList.remove('is-buffering');
                setPlaybackState('Ready');
                announce(titleFor(activeIndex) + ' is ready. Use the play button to try again.');
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
            setPlaybackState('Playing');
            announce('Playing ' + titleFor(index) + '.');
            updateTrackSelection();
            updatePlaybackControls();
            return;
        }

        activeIndex = index;

        if (audio.src !== source && audio.currentSrc !== source) {
            hasStarted = false;
            player.classList.remove('is-buffering');
            resetTimeline();
            audio.src = source;
            audio.load();
        } else if (audio.ended) {
            audio.currentTime = 0;
        }

        updateTrackSelection();
        updatePlaybackControls();
        updateTimeline(true);
        setPlaybackState('Selected track');
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
        setPlaybackState('Playing');
        announce('Playing ' + titleFor(activeIndex) + '.');
        updatePlaybackControls();
    });

    audio.addEventListener('playing', function () {
        player.classList.remove('is-buffering');
        setPlaybackState('Playing');
        updatePlaybackControls();
    });

    audio.addEventListener('pause', function () {
        player.classList.remove('is-buffering');
        if (hasStarted && !audio.ended) {
            setPlaybackState('Paused');
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
        setPlaybackState('Finished');
        announce('Directions EP finished.');
        updateTimeline(true);
        updatePlaybackControls();
    });

    audio.addEventListener('waiting', function () {
        if (!hasStarted) return;
        player.classList.add('is-buffering');
        setPlaybackState('Loading');
    });

    audio.addEventListener('canplay', function () {
        player.classList.remove('is-buffering');
        if (hasStarted && !audio.paused) setPlaybackState('Playing');
        updateTimeline(true);
    });

    audio.addEventListener('loadedmetadata', function () {
        updateTimeline(true);
    });

    audio.addEventListener('durationchange', function () {
        updateTimeline(true);
    });

    audio.addEventListener('timeupdate', function () {
        updateTimeline(false);
    });

    audio.addEventListener('error', function () {
        hasStarted = false;
        player.classList.remove('is-buffering');
        setPlaybackState('Unavailable');
        announce('This track could not be loaded. Please choose another track.');
        resetTimeline();
        updatePlaybackControls();
    });

    updateTrackSelection();
    updatePlaybackControls();
    setOpen(false);

    if (!canUseCustomControls) return;

    try {
        seekControl.addEventListener('pointerdown', function () {
            if (!seekControl.disabled) isSeeking = true;
        });
        seekControl.addEventListener('input', previewSeek);
        seekControl.addEventListener('change', finishSeeking);
        seekControl.addEventListener('pointerup', finishSeeking);
        seekControl.addEventListener('pointercancel', finishSeeking);
        seekControl.addEventListener('blur', finishSeeking);

        muteButton.addEventListener('click', function () {
            const isMuted = audio.muted || audio.volume === 0;

            if (isMuted) {
                audio.muted = false;
                if (audio.volume === 0) {
                    try {
                        audio.volume = lastNonZeroVolume || 1;
                    } catch (error) {
                        // Mobile hardware volume remains available.
                    }
                }
            } else {
                if (audio.volume > 0) lastNonZeroVolume = audio.volume;
                audio.muted = true;
            }

            updateVolumeControls();
        });

        volumeControl.addEventListener('input', function () {
            const nextVolume = Math.min(1, Math.max(0, Number(volumeControl.value)));
            if (!Number.isFinite(nextVolume)) return;

            try {
                audio.volume = nextVolume;
                audio.muted = nextVolume === 0;
                if (nextVolume > 0) lastNonZeroVolume = nextVolume;
            } catch (error) {
                volumeControl.hidden = true;
                volumeControls.classList.add('has-hardware-volume');
            }

            updateVolumeControls();
        });

        audio.addEventListener('volumechange', updateVolumeControls);

        if (!supportsScriptVolume()) {
            volumeControl.hidden = true;
            volumeControls.classList.add('has-hardware-volume');
        }

        resetTimeline();
        updateTimeline(true);
        updateVolumeControls();
        audio.controls = false;
        audio.hidden = true;
        customControls.hidden = false;
        player.classList.add('has-custom-audio');
    } catch (error) {
        audio.controls = true;
        audio.hidden = false;
        customControls.hidden = true;
        player.classList.remove('has-custom-audio');
    }
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

function setTurnstileGateState(form, state, options) {
    if (!form) return;

    const gate = form.querySelector('[data-verification-gate]');
    const title = form.querySelector('[data-verification-title]');
    const message = form.querySelector('[data-verification-message]');
    const loading = form.querySelector('[data-verification-loading]');
    const verification = form.querySelector('[data-verification-wrap]');
    const fallback = form.querySelector('[data-verification-fallback]');
    const failureMessage = form.querySelector('[data-verification-failure-message]');
    const settings = options || {};

    if (!gate) return;

    if (state !== 'loading' && window.contactVerificationFallbackTimer) {
        window.clearTimeout(window.contactVerificationFallbackTimer);
        window.contactVerificationFallbackTimer = null;
    }

    gate.dataset.verificationState = state;
    gate.setAttribute('aria-busy', String(state === 'loading'));
    if (title && settings.title) title.textContent = settings.title;
    if (message && settings.message) message.textContent = settings.message;
    if (failureMessage && settings.failureMessage) failureMessage.textContent = settings.failureMessage;
    if (loading) loading.hidden = state !== 'loading';
    if (verification) {
        verification.hidden = state !== 'ready';
        if (state === 'loading') verification.classList.remove('has-error');
    }
    if (fallback) fallback.hidden = state !== 'error' && state !== 'unavailable';
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
    const verificationRetry = form.querySelector('[data-turnstile-retry]');

    setContactVerificationState(false);
    initialiseTurnstileWidget(form);

    if (verificationRetry) {
        verificationRetry.addEventListener('click', function () {
            initialiseTurnstileWidget(form, true);
            const verificationGate = form.querySelector('[data-verification-gate]');
            if (verificationGate) verificationGate.focus();
        });
    }

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
        ['name', 'email', 'service', 'message', 'turnstileToken'].forEach(function (name) {
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
            message: String(field('message') ? field('message').value : '').trim(),
            turnstileToken: String(field('turnstileToken') ? field('turnstileToken').value : '').trim()
        };
    }

    function validate(data) {
        const errors = {};
        if (data.name.length < 2) errors.name = 'Please enter your name.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Please enter a valid email address.';
        if (!data.service) errors.service = 'Please choose a service.';
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
                        setTurnstileGateState(form, 'ready', {
                            title: 'Verify to continue',
                            message: 'Complete the security check again to return to your enquiry.'
                        });
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

async function initialiseTurnstileWidget(form, forceRetry) {
    const widget = form.querySelector('[data-turnstile-widget]');
    const error = form.querySelector('[data-error-for="turnstileToken"]');
    if (!widget) return;

    const input = form.querySelector('input[name="turnstileToken"]');
    const attempt = Number(form.dataset.turnstileAttempt || 0) + 1;
    form.dataset.turnstileAttempt = String(attempt);

    if (input) {
        input.value = '';
        input.setAttribute('aria-invalid', 'false');
    }
    if (error) error.textContent = '';

    if (forceRetry) {
        if (form._turnstileWidgetId !== undefined && window.turnstile && typeof window.turnstile.remove === 'function') {
            try {
                window.turnstile.remove(form._turnstileWidgetId);
            } catch (removeError) {
                // The widget may already have removed itself after a load failure.
            }
        }
        form._turnstileWidgetId = undefined;
        widget.replaceChildren();
    }

    setContactVerificationState(false);
    setTurnstileGateState(form, 'loading', {
        title: 'Preparing your enquiry form',
        message: 'Loading the secure verification\u2026'
    });

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

    if (String(attempt) !== form.dataset.turnstileAttempt) return;

    const useLocalTestKey = isLocalPreview
        && new URLSearchParams(window.location.search).get('turnstile-test') === '1';

    if (!siteKey && useLocalTestKey) {
        siteKey = '1x00000000000000000000AA';
    }

    if (!siteKey) {
        setTurnstileGateState(form, 'unavailable', {
            title: 'Online enquiries are temporarily unavailable',
            message: 'The secure form is not available right now, but you can still contact Tim directly.',
            failureMessage: 'Try again in a moment, or use one of the direct contact options below.'
        });
        return;
    }

    for (let attempt = 0; attempt < 25; attempt += 1) {
        if (window.turnstile && typeof window.turnstile.render === 'function') break;
        await new Promise(function (resolve) { window.setTimeout(resolve, 200); });
    }

    if (String(attempt) !== form.dataset.turnstileAttempt) return;

    if (!window.turnstile || typeof window.turnstile.render !== 'function') {
        setTurnstileGateState(form, 'error', {
            title: 'The security check did not load',
            message: 'Check your connection or content blocker, then try again.',
            failureMessage: 'The secure verification service could not be reached.'
        });
        return;
    }

    try {
        form._turnstileWidgetId = window.turnstile.render(widget, {
            sitekey: siteKey,
            theme: 'dark',
            size: window.matchMedia('(max-width: 359px)').matches ? 'compact' : 'flexible',
            callback: window.onTurnstileSuccess,
            'expired-callback': window.onTurnstileExpired,
            'error-callback': window.onTurnstileError
        });

        const verificationGate = form.querySelector('[data-verification-gate]');
        if (verificationGate && verificationGate.dataset.verificationState === 'loading') {
            setTurnstileGateState(form, 'ready', {
                title: 'Verify to continue',
                message: 'Complete the quick security check to open the enquiry form.'
            });
        }
    } catch (renderError) {
        form._turnstileWidgetId = undefined;
        setTurnstileGateState(form, 'error', {
            title: 'The security check did not load',
            message: 'Check your connection or content blocker, then try again.',
            failureMessage: 'The secure verification service could not be started.'
        });
    }
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
    const form = document.getElementById('contactForm');
    setTurnstileGateState(form, 'verified', {});
    setContactVerificationState(true);
    const formTitle = form ? form.querySelector('#form-title') : null;
    if (formTitle) {
        window.requestAnimationFrame(function () {
            formTitle.focus();
        });
    }
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
    const form = document.getElementById('contactForm');
    setTurnstileGateState(form, 'ready', {
        title: 'Verification expired',
        message: 'Complete the security check again to open the enquiry form.'
    });
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
    const form = document.getElementById('contactForm');
    setTurnstileGateState(form, 'error', {
        title: 'The security check did not load',
        message: 'Check your connection or content blocker, then try again.',
        failureMessage: 'The secure verification service reported an error.'
    });
};
