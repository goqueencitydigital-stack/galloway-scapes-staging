(() => {
  const d = document, w = window, G = w.GS || {};
  const $ = (s, r = d) => r.querySelector(s), $$ = (s, r = d) => [...r.querySelectorAll(s)];
  const reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- analytics (no PII ever) ----------
  w.dataLayer = w.dataLayer || [];
  w.__events = [];
  const track = (event, params = {}) => {
    const e = { event, page_path: location.pathname, ...params };
    w.dataLayer.push(e); w.__events.push(e);
    if (/debug=1/.test(location.search)) console.log('[track]', e);
  };
  const onProd = location.hostname.replace(/^www\./, '') === G.prodHost;
  if (onProd) {
    let loaded = false;
    const load = () => {
      if (loaded) return; loaded = true;
      w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      const s = d.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtm.js?id=' + G.gtm; d.head.appendChild(s);
      if (G.clarity) { (function (c, l, a, r, i) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; const t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i; l.head.appendChild(t); })(w, d, 'clarity', 'script', G.clarity); }
    };
    ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(ev => w.addEventListener(ev, load, { once: true, passive: true }));
    setTimeout(load, 3500);
  }
  d.addEventListener('click', e => {
    const a = e.target.closest('a,button'); if (!a) return;
    if (a.matches('a[href^="tel:"]')) track('phone_click', { click_location: a.dataset.call || 'inline' });
    if (a.dataset.social) track('social_click', { cta: a.dataset.social });
    if (a.dataset.est) {
      track('estimate_cta_click', { click_location: a.dataset.est });
      if (a.dataset.svc) setService(a.dataset.svc);
      if (a.dataset.svc === 'lawn-program') track('lawn_program_cta', { click_location: a.dataset.est });
    }
  });

  // ---------- header ----------
  const hdr = $('#hdr');
  if (hdr && !hdr.classList.contains('always')) {
    const f = () => hdr.classList.toggle('solid', w.scrollY > 40); f(); w.addEventListener('scroll', f, { passive: true });
  }
  if (hdr) {
    let last = w.scrollY;
    w.addEventListener('scroll', () => {
      const y = w.scrollY, busy = hdr.querySelector('.nav li.open, .nav li:hover') || d.body.classList.contains('menu-open');
      if (y < 120 || y < last - 6 || busy) hdr.classList.remove('hide');
      else if (y > last + 6 && y > w.innerHeight * .5) hdr.classList.add('hide');
      if (Math.abs(y - last) > 6) last = y;
    }, { passive: true });
  }
  $$('.nav > li > button').forEach(b => b.addEventListener('click', () => {
    const li = b.parentElement, open = !li.classList.contains('open');
    $$('.nav > li.open').forEach(x => { x.classList.remove('open'); $('button', x).setAttribute('aria-expanded', 'false'); });
    li.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
  }));
  d.addEventListener('click', e => { if (!e.target.closest('.nav')) $$('.nav > li.open').forEach(x => x.classList.remove('open')); });
  const drawer = $('#drawer'), mb = $('.menu-btn');
  const setDrawer = o => { drawer.classList.toggle('open', o); drawer.setAttribute('aria-hidden', String(!o)); mb.setAttribute('aria-expanded', String(o)); d.body.style.overflow = o ? 'hidden' : ''; if (o) $('.x', drawer).focus(); };
  mb && mb.addEventListener('click', () => setDrawer(true));
  drawer && $('.x', drawer).addEventListener('click', () => { setDrawer(false); mb.focus(); });
  drawer && $$('a', drawer).forEach(a => a.addEventListener('click', () => setDrawer(false)));
  d.addEventListener('keydown', e => { if (e.key === 'Escape') { if (drawer.classList.contains('open')) setDrawer(false); $$('.nav > li.open').forEach(x => x.classList.remove('open')); } });

  // ---------- reveal ----------
  const els = $$('.rv-up,.rv-img');
  if ('IntersectionObserver' in w && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    els.forEach(el => io.observe(el));
  } else els.forEach(el => el.classList.add('in'));

  // ---------- scroll story ----------
  $$('[data-story]').forEach(st => {
    const pics = $$('.stage img', st), stepsEl = $$('.step', st), cnt = $('[data-count]', st);
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const i = stepsEl.indexOf(e.target);
      stepsEl.forEach((s, j) => s.classList.toggle('on', j === i));
      pics.forEach((p, j) => p.classList.toggle('on', j === i));
      if (cnt) cnt.textContent = String(i + 1).padStart(2, '0');
    }), { rootMargin: '-45% 0px -45% 0px' });
    stepsEl.forEach(s => io.observe(s));
  });

  // ---------- pinned story (home) ----------
  $$('[data-tale]').forEach(sec => {
    const frs = $$('.tale-stage .fr', sec), txs = $$('.tale-text .tx', sec), navs = $$('.tale-nav button', sec);
    const bar = $('.tale-bar', sec), cnt = $('[data-count]', sec), n = frs.length; let cur = 0;
    const set = i => { if (i === cur) return; cur = i;
      frs.forEach((f, j) => f.classList.toggle('on', j === i)); txs.forEach((t, j) => t.classList.toggle('on', j === i));
      navs.forEach((b, j) => j === i ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current'));
      if (cnt) cnt.textContent = String(i + 1).padStart(2, '0'); };
    const span = () => sec.offsetHeight - innerHeight;
    const onScroll = () => { if (innerWidth < 901) return;
      const p = Math.min(1, Math.max(0, -sec.getBoundingClientRect().top / span()));
      bar && bar.style.setProperty('--p', p.toFixed(3));
      set(Math.min(n - 1, Math.floor(p * n * 0.999))); };
    addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();
    navs.forEach((b, i) => b.addEventListener('click', () => {
      const y = sec.getBoundingClientRect().top + scrollY + span() * ((i + 0.5) / n);
      scrollTo({ top: y, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }));
  });

  // ---------- reels ----------
  $$('.reel').forEach(r => {
    const v = $('video', r), btn = $('.poster', r);
    btn && btn.addEventListener('click', () => {
      $$('.reel video').forEach(o => { if (o !== v) { o.pause(); } });
      r.classList.add('playing'); v.play().catch(() => {}); v.focus();
      track('social_click', { cta: 'reel-play', reel_id: r.dataset.reel });
    });
    v && v.addEventListener('play', () => $$('.reel video').forEach(o => { if (o !== v) o.pause(); }));
  });

  // ---------- estimate form ----------
  const form = $('#est-form');
  const svcSel = $('#f-service');
  let svcDetail = '', svcDetailKey = '';
  function setService(v, lock = true) {
    if (!svcSel || !v) return;
    const sub = (G.subs || {})[v];
    const hub = sub ? sub[0] : v;
    if (![...svcSel.options].some(o => o.value === hub)) return;
    svcSel.value = hub; svcDetail = sub ? sub[1] : ''; svcDetailKey = sub ? v : '';
    const chip = $('.svc-chip', form);
    if (chip && lock) { $('[data-svc-label]', chip).textContent = svcDetail || svcSel.options[svcSel.selectedIndex].text; chip.hidden = false; svcSel.hidden = true; }
  }
  if (form) {
    const qs = new URLSearchParams(location.search).get('service');
    setService(qs || form.dataset.defaultService || '');
    $('[data-svc-change]', form).addEventListener('click', () => { svcDetail = ''; svcDetailKey = ''; $('.svc-chip', form).hidden = true; svcSel.hidden = false; svcSel.focus(); });
    const msg = $('.msg', form), btn = $('button[type=submit]', form), born = Date.now();
    let started = false;
    form.addEventListener('focusin', () => { if (!started) { started = true; track('estimate_start', { form_service: svcSel.value || 'none' }); } });
    // contact method switches the one contact field between phone and email
    const cin = $('#f-contact'), cl = $('#f-contact-l'), cerr = cin.closest('.f').querySelector('.err');
    const method = () => (form.querySelector('input[name=method]:checked') || {}).value || 'call';
    const syncMethod = () => {
      const em = method() === 'email';
      cl.textContent = em ? 'Email address' : (method() === 'text' ? 'Mobile number' : 'Phone number');
      cin.type = em ? 'email' : 'tel'; cin.autocomplete = em ? 'email' : 'tel'; cin.inputMode = em ? 'email' : 'tel';
      cerr.textContent = em ? cerr.dataset.email : cerr.dataset.tel;
    };
    $$('input[name=method]', form).forEach(r => r.addEventListener('change', () => { syncMethod(); if (cin.closest('.f').classList.contains('bad')) validate(); }));
    // photos: resized in the browser so uploads stay small on a phone connection
    const photos = []; const plist = $('.ph-list', form), pin = $('#f-photo');
    const shrink = file => new Promise((res, rej) => {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => { const m = 1600, k = Math.min(1, m / Math.max(im.width, im.height)); const c = d.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', .8)); };
      im.onerror = () => { URL.revokeObjectURL(url); rej(); }; im.src = url;
    });
    const drawPhotos = () => {
      plist.innerHTML = photos.map((p, i) => `<span class="ph-it"><img src="${p.data}" alt="Photo ${i + 1} you added"><button type="button" aria-label="Remove photo ${i + 1}" data-rm="${i}">×</button></span>`).join('');
      $('.ph-btn span', form).firstChild.textContent = photos.length ? (photos.length < 3 ? 'Add another photo ' : 'Up to 3 photos ') : 'Add a photo of your yard ';
      pin.disabled = photos.length >= 3;
    };
    pin.addEventListener('change', async () => {
      const f = pin.closest('.f'); f.classList.remove('bad');
      for (const file of [...pin.files].slice(0, 3 - photos.length)) {
        try { photos.push({ name: (file.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg', data: await shrink(file) }); } catch { f.classList.add('bad'); }
      }
      pin.value = ''; drawPhotos();
    });
    plist.addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b) { photos.splice(+b.dataset.rm, 1); drawPhotos(); } });
    const fld = id => $('#' + id).closest('.f');
    const validate = () => {
      let ok = true; const v = id => $('#' + id).value.trim();
      const set = (id, bad) => { fld(id).classList.toggle('bad', bad); $('#' + id).setAttribute('aria-invalid', String(bad)); if (bad) ok = false; };
      set('f-name', !v('f-name'));
      set('f-zip', !/^\d{5}(-?\d{4})?$/.test(v('f-zip')) && v('f-zip').length < 3);
      const c = v('f-contact');
      set('f-contact', method() === 'email' ? !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c) : c.replace(/\D/g, '').length < 10);
      set('f-service', !svcSel.value);
      if (!svcSel.value) { $('.svc-chip', form).hidden = true; svcSel.hidden = false; }
      return ok;
    };
    form.addEventListener('input', e => { const f = e.target.closest('.f'); if (f && f.classList.contains('bad')) validate(); });
    form.addEventListener('submit', async e => {
      e.preventDefault(); msg.className = 'msg'; msg.textContent = '';
      if (!validate()) { const first = $('.f.bad input, .f.bad select', form); first && first.focus(); track('form_error', { form_service: svcSel.value || 'none', reason: 'validation' }); return; }
      const F = form.elements; if (F._honey && F._honey.value) return;
      const svc = svcDetailKey || svcSel.value, svcLabel = svcDetail || svcSel.options[svcSel.selectedIndex].text, m = method(), c = F.contact.value.trim();
      const data = { name: F.name.value.trim(), zip: F.zip.value.trim(), method: m, phone: m === 'email' ? '' : c, email: m === 'email' ? c : '', service: svcLabel, service_key: svc, message: F.message.value.trim(), photos, page: location.href.split('?')[0].split('#')[0], env: G.env || 'staging', t: Date.now() - born };
      btn.disabled = true; btn.firstChild.textContent = photos.length ? 'Sending photos… ' : 'Sending… ';
      try {
        const res = await fetch(G.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data), redirect: 'follow' });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || j.ok !== true) throw new Error(j.error || 'Send failed');
        form.classList.add('sent'); msg.className = 'msg ok';
        msg.innerHTML = '<strong>Thanks, ' + escapeHtml(data.name.split(' ')[0]) + '. Your request is in.</strong><br>We’ll ' + (m === 'email' ? 'email you' : m === 'text' ? 'text you' : 'call you') + ' within 24 hours. If it’s urgent, call <a class="nw" href="tel:' + G.tel + '">(803) 487-5240</a>.';
        msg.focus();
        track('generate_lead', { form_service: svc, form_location: location.pathname, contact_method: m, has_photo: photos.length > 0 });
        if (svc === 'lawn-program') track('lawn_program_inquiry', { form_location: location.pathname });
      } catch (err) {
        msg.className = 'msg no';
        msg.innerHTML = 'Sorry, that didn’t go through. Please try again, or call <a class="nw" href="tel:' + G.tel + '">(803) 487-5240</a> and we’ll take it by phone.';
        track('form_error', { form_service: svc, reason: 'send' });
      } finally { btn.disabled = false; btn.firstChild.textContent = 'Get a Free Estimate '; }
    });
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  // ---------- hero film: poster first, muted loop, pause control, no autoplay on reduced motion or data saver ----------
  const saveData = (navigator.connection && navigator.connection.saveData) || false;
  $$('.film-hero,.hx-hero').forEach(h => {
    const pbs = $$('.vpause', h);
    const pick = () => w.matchMedia('(max-width:900px)').matches ? $('.bg .hvid', h) : $('.hfilm .hvid', h);
    let v = null, paused = reduce || saveData;
    const start = () => {
      if (paused) return; v = pick(); if (!v) return;
      if (!v.src) v.src = v.dataset.src;
      v.play().then(() => h.classList.add('playing')).catch(() => {});
    };
    const sync = () => pbs.forEach(b => { b.setAttribute('aria-pressed', String(paused)); b.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video'); });
    if (paused) { h.classList.add('still'); sync(); }
    pbs.forEach(pb => pb.addEventListener('click', () => {
      paused = !paused; sync();
      if (paused) { $$('.hvid', h).forEach(x => x.pause()); h.classList.add('still'); } else { h.classList.remove('still'); start(); }
    }));
    if (d.readyState === 'complete') setTimeout(start, 600); else w.addEventListener('load', () => setTimeout(start, 600));
    d.addEventListener('visibilitychange', () => { if (!v) return; d.hidden ? v.pause() : (!paused && v.play().catch(() => {})); });
  });

  // ---------- review track ----------
  $$('[data-rtrack]').forEach(b => b.addEventListener('click', () => { const r = b.closest('section').querySelector('.hx-rtrack'); r.scrollBy({ left: +b.dataset.rtrack * r.clientWidth * .7, behavior: reduce ? 'auto' : 'smooth' }); }));
  // ---------- photo rail ----------
  $$('[data-rail]').forEach(b => b.addEventListener('click', () => { const r = b.closest('section').querySelector('.rail'); r.scrollBy({ left: +b.dataset.rail * r.clientWidth * .8, behavior: reduce ? 'auto' : 'smooth' }); }));

  // ---------- sticky call bar never covers the form ----------
  const bar = $('#mbar'), est = $('#estimate'), ftr = $('.ftr');
  if (bar && 'IntersectionObserver' in w) {
    const vis = new Set();
    let top = true;
    const upd = () => bar.classList.toggle('off', vis.size > 0 || top);
    const io = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? vis.add(e.target) : vis.delete(e.target)); upd(); });
    est && io.observe(est); ftr && io.observe(ftr);
    const sc = () => { const t = w.scrollY < Math.min(520, w.innerHeight * .6); if (t !== top) { top = t; upd(); } };
    sc(); upd(); w.addEventListener('scroll', sc, { passive: true });
    const fm = $('#est-form'); if (fm) { fm.addEventListener('focusin', () => { vis.add(fm); upd(); }); fm.addEventListener('focusout', () => setTimeout(() => { if (!fm.contains(d.activeElement)) { vis.delete(fm); upd(); } }, 50)); }
  }
})();
