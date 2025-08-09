// Enhanced mobile nav: animated hamburger, title injection, class-based open/close
const dropdownButton = document.querySelector('.dropdown-button');
const tabs = document.querySelector('.tabs');

if (dropdownButton && tabs) {
  dropdownButton.setAttribute('aria-controls', 'primary-navigation');
  dropdownButton.setAttribute('aria-expanded', 'false');
  dropdownButton.setAttribute('aria-label', 'Toggle navigation');
  tabs.id = 'primary-navigation';

  // Inject a small title to the right of the hamburger on mobile if missing
  const ensureHeaderTitle = () => {
    const hasTitle = document.querySelector('.header-title');
    const active = document.querySelector('.tabs .tab-active') || document.querySelector('.tabs a');
    const pageTitle = (active?.textContent || 'Menu').trim();
    if (!hasTitle && window.innerWidth < 900) {
      const title = document.createElement('div');
      title.className = 'header-title';
      title.textContent = pageTitle;
      dropdownButton.insertAdjacentElement('afterend', title);
    } else if (hasTitle) {
      // Update title text on resize / navigation
      hasTitle.textContent = pageTitle;
      if (window.innerWidth >= 900) hasTitle.remove();
    }
  };

  const setDesktopState = () => {
    tabs.classList.remove('open');
    tabs.style.display = 'flex';
    dropdownButton.setAttribute('aria-expanded', 'false');
  };

  const setMobileState = () => {
    tabs.classList.remove('open');
    tabs.style.display = 'none';
    dropdownButton.setAttribute('aria-expanded', 'false');
  };

  const setResponsiveState = () => {
    if (window.innerWidth >= 900) setDesktopState(); else setMobileState();
    ensureHeaderTitle();
  };

  setResponsiveState();
  window.addEventListener('resize', setResponsiveState);

  dropdownButton.addEventListener('click', () => {
    const willOpen = !tabs.classList.contains('open');
    tabs.style.display = willOpen ? 'flex' : 'none';
    tabs.classList.toggle('open', willOpen);
    dropdownButton.setAttribute('aria-expanded', String(willOpen));
  });

  // On mobile, do not navigate when tapping the Services label; it's just a section header
  const serviceDropdown = document.querySelector('.dropdown');
  if (serviceDropdown) {
    const toggle = serviceDropdown.querySelector('.dropdown-toggle');
    if (toggle) {
      toggle.addEventListener('click', (e) => {
        if (window.innerWidth < 900) {
          e.preventDefault();
        }
      });
    }
  }
}