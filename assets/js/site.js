// Vidco 17020 - v2
(function () {
  // Lite YouTube: load the player only when the visitor clicks the poster
  document.querySelectorAll('.yt').forEach(function (el) {
    el.addEventListener('click', function () {
      if (el.classList.contains('playing')) return;
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + el.dataset.yt + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
      iframe.title = el.dataset.title || 'Vidco video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      el.appendChild(iframe);
      el.classList.add('playing');
    });
  });

  // Mobile menu
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Header border once the page scrolls
  var header = document.querySelector('.site-header');
  var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Gentle reveal for content blocks
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.section-head, .story, .module, .reasons li, .figure, .product-film').forEach(function (el) {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  // Demo dialog: WhatsApp or the in-site form
  var demo = document.getElementById('demo');
  var track = function (event) { (window.dataLayer = window.dataLayer || []).push({ event: event }); };
  var show = function (step) {
    demo.querySelectorAll('.demo-step').forEach(function (el) { el.hidden = el.dataset.step !== step; });
    var first = demo.querySelector('[data-step="' + step + '"] input:not([type=hidden]), [data-step="' + step + '"] .demo-option');
    if (first) first.focus();
  };
  if (typeof demo.showModal === 'function') {
    document.querySelectorAll('[data-demo]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        show('choose');
        demo.showModal();
        track('demo_open');
      });
    });
  }
  demo.addEventListener('click', function (e) {
    if (e.target === demo || e.target.closest('[data-close]')) demo.close();
    var go = e.target.closest('[data-goto]');
    if (go) show(go.dataset.goto);
    if (e.target.closest('[data-track]')) track(e.target.closest('[data-track]').dataset.track);
  });

  var form = demo.querySelector('.demo-form');
  form.addEventListener('submit', function (e) {
    var ok = true;
    form.querySelectorAll('[required]').forEach(function (f) {
      var bad = f.type === 'checkbox' ? !f.checked : !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      (f.type === 'checkbox' ? f.closest('.check') : f).classList.toggle('invalid', bad);
      if (bad) ok = false;
    });
    form.querySelector('.form-error').hidden = ok;
    if (!ok) { e.preventDefault(); return; }
    // The backend has no company field, so company and note travel in the message body
    form.elements.message.value = 'Firma: ' + document.getElementById('f-company').value.trim() +
      '\nKaynak: 17020muayene.vidco.com.tr' +
      (document.getElementById('f-note').value.trim() ? '\n\n' + document.getElementById('f-note').value.trim() : '');
    form.querySelector('button[type=submit]').disabled = true;
    track('demo_form_submit');
    // The POST goes to a hidden iframe, so the visitor stays on the page
    setTimeout(function () {
      show('done');
      form.reset();
      form.querySelector('button[type=submit]').disabled = false;
    }, 600);
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
