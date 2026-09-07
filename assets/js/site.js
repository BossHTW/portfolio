/* Boss Huang — portfolio
   Theme toggle (persisted), stat count-up, work filters, contact form. No dependencies. */
(function () {
  var root = document.documentElement;

  // ---- Theme -------------------------------------------------------------
  function stored() { try { return localStorage.getItem('theme'); } catch (e) { return null; } }
  function apply(t) { root.setAttribute('data-theme', t); }
  var pref = stored() || 'dark';
  apply(pref);
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-theme-toggle]');
    if (!b) return;
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    apply(next);
    try { localStorage.setItem('theme', next); } catch (err) {}
  });

  // ---- Count-up on stats -------------------------------------------------
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nums = document.querySelectorAll('[data-count]');
  if (nums.length && !reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, final = el.textContent;
        var m = final.match(/^([^0-9]*)([0-9][0-9,\.]*)(.*)$/);
        if (!m) return;
        var pre = m[1], target = parseFloat(m[2].replace(/,/g, '')), post = m[3];
        var dec = (m[2].split('.')[1] || '').length, t0 = null, dur = 900;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur), ease = 1 - Math.pow(1 - p, 3);
          var v = (target * ease).toFixed(dec);
          el.textContent = pre + Number(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + post;
          if (p < 1) requestAnimationFrame(step); else el.textContent = final;
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    nums.forEach(function (n) { io.observe(n); });
  }

  // ---- Work filters ------------------------------------------------------
  var filters = document.querySelector('[data-filters]');
  if (filters) {
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('[data-filter]');
      if (!b) return;
      var f = b.getAttribute('data-filter');
      filters.querySelectorAll('[data-filter]').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      document.querySelectorAll('[data-tracks]').forEach(function (c) {
        var ok = f === 'all' || (' ' + c.getAttribute('data-tracks') + ' ').indexOf(' ' + f + ' ') > -1;
        c.hidden = !ok;
      });
    });
  }

  // ---- Contact form (Web3Forms) ------------------------------------------
  var form = document.querySelector('form[data-w3f]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var key = form.querySelector('[name="access_key"]').value;
      var status = form.querySelector('[data-status]');
      var btn = form.querySelector('button[type="submit"]');
      if (!key || key.indexOf('YOUR_') === 0) {
        status.textContent = 'Form isn’t wired up yet — please email bosshtw@gmail.com directly.';
        return;
      }
      btn.disabled = true; status.textContent = 'Sending…';
      fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) })
        .then(function (r) { return r.json(); })
        .then(function (d) { status.textContent = d.success ? 'Thanks — I’ll get back to you soon.' : 'Something went wrong. Please email me instead.'; if (d.success) form.reset(); })
        .catch(function () { status.textContent = 'Network error. Please email me instead.'; })
        .finally(function () { btn.disabled = false; });
    });
  }

  // ---- Click-to-play YouTube ------------------------------------------
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-yt]');
    if (!b) return;
    var box = b.parentNode, id = b.getAttribute('data-yt'), title = b.getAttribute('aria-label') || 'Video';
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0';
    f.title = title; f.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    box.replaceChildren(f);
  });

  // ---- Photo gallery: masonry + lightbox ---------------------------------
  var gal = document.querySelector('[data-gallery]');
  if (gal) {
    var unit = 8;
    function layout() {
      gal.classList.add('masonry');
      var gap = parseFloat(getComputedStyle(gal).rowGap) || 16;
      gal.querySelectorAll('.shot').forEach(function (s) {
        if (s.hidden) return;
        s.style.gridRowEnd = 'auto';
        var h = s.getBoundingClientRect().height;
        s.style.gridRowEnd = 'span ' + Math.ceil((h + gap) / (unit + gap));
      });
    }
    var rt; function relayout() { clearTimeout(rt); rt = setTimeout(layout, 40); }
    layout();
    window.addEventListener('load', layout);
    window.addEventListener('resize', relayout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    if (filters) filters.addEventListener('click', function () { setTimeout(layout, 0); });

    var dlg = document.querySelector('.lb');
    if (dlg && typeof dlg.showModal === 'function') {
      var lbImg = dlg.querySelector('img'), lbT = dlg.querySelector('[data-t]'), lbM = dlg.querySelector('[data-m]'), lbC = dlg.querySelector('[data-c]');
      var shots = Array.prototype.slice.call(gal.querySelectorAll('.shot')), cur = -1;
      function visible() { return shots.filter(function (s) { return !s.hidden; }); }
      function step(d, from) { var v = visible(); var i = v.indexOf(from || shots[cur]); return v[(i + d + v.length) % v.length]; }
      function show(s) {
        if (!s) return;
        cur = shots.indexOf(s);
        var b = s.querySelector('button');
        lbImg.src = b.getAttribute('data-full'); lbImg.alt = b.querySelector('img').alt;
        lbT.textContent = s.getAttribute('data-title'); lbM.textContent = s.getAttribute('data-meta');
        var v = visible(); lbC.textContent = (v.indexOf(s) + 1) + ' / ' + v.length;
        [step(1, s), step(-1, s)].forEach(function (x) { if (x && x !== s) { var i = new Image(); i.src = x.querySelector('button').getAttribute('data-full'); } });
        if (!dlg.open) dlg.showModal();
      }
      gal.addEventListener('click', function (e) { var b = e.target.closest('.shot button'); if (!b) return; show(b.closest('.shot')); });
      dlg.addEventListener('click', function (e) {
        if (e.target.closest('.n')) show(step(1));
        else if (e.target.closest('.p')) show(step(-1));
        else if (e.target.closest('.x') || e.target === dlg || e.target.classList.contains('in')) dlg.close();
      });
      dlg.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); show(step(1)); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); show(step(-1)); }
      });
      var tx = null;
      dlg.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].clientX; }, { passive: true });
      dlg.addEventListener('touchend', function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; tx = null; if (Math.abs(dx) > 50) show(step(dx < 0 ? 1 : -1)); }, { passive: true });
      dlg.addEventListener('close', function () { lbImg.removeAttribute('src'); if (cur > -1) { var b = shots[cur].querySelector('button'); if (b) b.focus(); } });
    }
  }

  // ---- Current year ------------------------------------------------------
  document.querySelectorAll('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });
})();
