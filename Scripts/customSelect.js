(function enhanceSelect() {
  const native = document.querySelector('select[data-custom="glass"]');
  if (!native) return;

  native.style.display = 'none';

  const wrapper = document.createElement('div');
  wrapper.className = 'glass-select';
  native.parentNode.insertBefore(wrapper, native);
  wrapper.appendChild(native);

  const display = document.createElement('button');
  display.type = 'button';
  display.className = 'display';
  display.setAttribute('aria-haspopup', 'listbox');
  display.setAttribute('aria-expanded', 'false');
  display.textContent = native.options[native.selectedIndex]?.text || native.options[0]?.text || 'Select';

  const caret = document.createElement('span');
  caret.className = 'caret';
  caret.innerHTML = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>";

  const menu = document.createElement('div');
  menu.className = 'menu';
  menu.role = 'listbox';

  for (let i = 0; i < native.options.length; i++) {
    const opt = native.options[i];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.role = 'option';
    btn.textContent = opt.text;
    btn.setAttribute('data-value', opt.value);
    if (opt.selected) btn.setAttribute('aria-selected', 'true');
    btn.addEventListener('click', () => {
      for (const b of menu.querySelectorAll('button[aria-selected]')) b.removeAttribute('aria-selected');
      btn.setAttribute('aria-selected', 'true');
      display.textContent = opt.text;
      display.appendChild(caret);
      native.value = opt.value;
      native.dispatchEvent(new Event('change', { bubbles: true }));
      wrapper.classList.remove('open');
      display.setAttribute('aria-expanded', 'false');
    });
    menu.appendChild(btn);
  }

  display.addEventListener('click', () => {
    const open = wrapper.classList.toggle('open');
    display.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      wrapper.classList.remove('open');
      display.setAttribute('aria-expanded', 'false');
    }
  });

  wrapper.appendChild(display);
  display.appendChild(caret);
  wrapper.appendChild(menu);
})();


