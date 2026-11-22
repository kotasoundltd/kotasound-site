// Kota Sound site behaviour: menu, phyllotaxis drawings, golden-angle lab, copy-email.
(() => {
  const GOLDEN = 137.50776405003785; // degrees: 360 * (1 - 1/phi)
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile menu
  const btn = document.querySelector('.menu-btn');
  const nav = document.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Vogel's model of a sunflower head: seed n at radius c*sqrt(n), angle n*alpha.
  function drawPhyllo(ctx, w, h, opts) {
    const { n, angle, cx, cy, scale, colour, accent, grow } = opts;
    ctx.clearRect(0, 0, w, h);
    const a = angle * Math.PI / 180;
    for (let i = 1; i <= n; i++) {
      const r = scale * Math.sqrt(i);
      const t = i * a;
      const x = cx + r * Math.cos(t), y = cy + r * Math.sin(t);
      if (x < -10 || y < -10 || x > w + 10 || y > h + 10) continue;
      const size = Math.max(0.6, (grow || 0.9) * Math.sqrt(scale) * (0.35 + 0.65 * (i / n)));
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = (i % 21 === 0 || i % 34 === 0) ? accent : colour;
      ctx.fill();
    }
  }

  // Hero field: a slow phyllotaxis bloom behind the headline.
  const hero = document.getElementById('phyllo');
  if (hero) {
    const ctx = hero.getContext('2d');
    let count = reduce ? 1400 : 60;
    const sizeIt = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      hero.width = hero.clientWidth * dpr; hero.height = hero.clientHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };
    const paint = () => {
      const w = hero.width, h = hero.height;
      drawPhyllo(ctx, w, h, { n: count, angle: GOLDEN, cx: w * 0.92, cy: h * 0.12,
        scale: Math.max(w, h) / 46, colour: 'rgba(201,204,208,.16)', accent: 'rgba(212,168,90,.55)', grow: 0.55 });
    };
    sizeIt(); paint();
    window.addEventListener('resize', () => { sizeIt(); paint(); });
    if (!reduce) {
      const step = () => { count = Math.min(1400, Math.round(count * 1.035) + 2); paint(); if (count < 1400) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
  }

  // Golden-angle lab on the Science page.
  const lab = document.getElementById('lab');
  if (lab) {
    const ctx = lab.getContext('2d');
    const range = document.getElementById('angle');
    const out = document.getElementById('angleOut');
    const note = document.getElementById('angleNote');
    const sizeIt = () => { const dpr = Math.min(window.devicePixelRatio || 1, 2); lab.width = lab.clientWidth * dpr; lab.height = lab.clientHeight * dpr; };
    const describe = (deg) => {
      const d = Math.abs(deg - GOLDEN);
      if (d < 0.05) return 'The golden angle. No two seeds ever line up on the same ray, so the disc fills evenly right to the edge.';
      if (Math.abs(deg - 180) < 0.3) return 'Half a turn. Every seed lands on one of two lines; the rest of the disc stays empty.';
      if (Math.abs(deg - 120) < 0.3 || Math.abs(deg - 90) < 0.3) return 'A simple fraction of a turn. Seeds stack into a few straight spokes with gaps between them.';
      if (d < 1) return 'Close to the golden angle, but the error adds up: spokes start to appear further out.';
      return 'A rational-looking angle soon repeats itself, so the seeds clump into arms and leave gaps.';
    };
    const paint = () => {
      const deg = parseFloat(range.value);
      out.textContent = deg.toFixed(3) + '°';
      note.textContent = describe(deg);
      const w = lab.width, h = lab.height;
      drawPhyllo(ctx, w, h, { n: 900, angle: deg, cx: w / 2, cy: h / 2, scale: w / 64,
        colour: 'rgba(201,204,208,.85)', accent: 'rgba(212,168,90,1)', grow: 0.75 });
    };
    range.addEventListener('input', paint);
    document.querySelectorAll('[data-angle]').forEach((b) => b.addEventListener('click', () => {
      range.value = b.dataset.angle;
      document.querySelectorAll('[data-angle]').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      paint();
    }));
    sizeIt(); paint();
    window.addEventListener('resize', () => { sizeIt(); paint(); });
  }

  // Copy email
  document.querySelectorAll('[data-copy]').forEach((b) => {
    b.addEventListener('click', async () => {
      const text = b.dataset.copy;
      try { await navigator.clipboard.writeText(text); b.textContent = 'Copied'; }
      catch (e) {
        const el = document.getElementById(b.dataset.target);
        if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
        b.textContent = 'Selected, press Ctrl+C';
      }
      setTimeout(() => { b.textContent = 'Copy address'; }, 2400);
    });
  });

  // Pause background loops when off screen (saves battery on phones).
  const loops = document.querySelectorAll('video[data-loop]');
  if ('IntersectionObserver' in window && loops.length) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting && !reduce) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause();
    }), { threshold: 0.2 });
    loops.forEach((v) => io.observe(v));
  }
})();
