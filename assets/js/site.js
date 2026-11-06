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
  var errorBox = form.querySelector('.form-error');
  var submit = form.querySelector('button[type=submit]');
  var WA = '<a href="https://wa.me/905325661114" target="_blank" rel="noopener">WhatsApp</a>';
  var fail = function (html) { errorBox.innerHTML = html; errorBox.hidden = false; };
  form.elements.t.value = Date.now();

  // Turnstile is switched on by filling data-sitekey in the markup
  var captcha = form.querySelector('.cf-turnstile');
  if (captcha.dataset.sitekey) {
    captcha.hidden = false;
    var ts = document.createElement('script');
    ts.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    ts.async = true;
    document.head.appendChild(ts);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    form.querySelectorAll('[required]').forEach(function (f) {
      var bad = f.type === 'checkbox' ? !f.checked : !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      (f.type === 'checkbox' ? f.closest('.check') : f).classList.toggle('invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) { fail('Lütfen yıldızlı alanları doldurun ve aydınlatma metnini onaylayın.'); return; }
    errorBox.hidden = true;
    submit.disabled = true;

    var data = Object.fromEntries(new FormData(form));
    fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (res) {
        if (res.ok) {
          track('demo_form_submit');
          form.reset();
          form.elements.t.value = Date.now();
          show('done');
        } else if (res.error === 'validation') {
          fail('Lütfen bilgilerinizi kontrol edip tekrar deneyin.');
        } else if (res.error === 'captcha') {
          fail('Doğrulama tamamlanamadı, lütfen tekrar deneyin.');
        } else {
          fail('Talebiniz şu an gönderilemedi. Lütfen ' + WA + ' üzerinden yazın ya da +90 (216) 345 67 45 numarasını arayın.');
        }
      })
      .catch(function () {
        fail('Bağlantı hatası. Lütfen ' + WA + ' üzerinden yazın ya da +90 (216) 345 67 45 numarasını arayın.');
      })
      .then(function () {
        submit.disabled = false;
        if (window.turnstile && captcha.dataset.sitekey) window.turnstile.reset();
      });
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
