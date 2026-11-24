/* Efeitos visuais: atmosfera de fundo, luz do mouse, texto digitado, onda do laboratório e demonstração de amostragem. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Texto digitado no hero */
  const ty = $('#type');
  if (ty) {
    const txt = ty.dataset.t;
    if (still) ty.textContent = txt;
    else { let i = 0; const step = () => { ty.textContent = txt.slice(0, ++i); if (i < txt.length) setTimeout(step, 60 + Math.random() * 55); }; setTimeout(step, 1200); }
  }

  /* Demonstração de amostragem e quantização */
  const samp = $('#samp');
  if (samp) {
    const sn = $('#sn'), sb = $('#sb'), cap = $('#scap'), A = 105, M = 130, Wd = 900, CY = 2;
    const f = x => Math.sin(x / Wd * Math.PI * 2 * CY);
    const draw = () => {
      const n = +sn.value, b = +sb.value, L = 2 ** b, N = n * CY;
      sn.nextElementSibling.value = n; sb.nextElementSibling.value = b;
      let h = '';
      if (b <= 4) for (let i = 0; i < L; i++) { const y = M - A * (-1 + 2 * i / (L - 1)); h += `<line class="lv" x1="0" x2="${Wd}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }
      h += `<line class="ax" x1="0" x2="${Wd}" y1="${M}" y2="${M}"/>`;
      let d = ''; for (let x = 0; x <= Wd; x += 6) d += (x ? 'L' : 'M') + x + ' ' + (M - A * f(x)).toFixed(1);
      const pts = []; for (let i = 0; i <= N; i++) { const x = i * Wd / N, q = Math.round((f(x) + 1) / 2 * (L - 1)) / (L - 1) * 2 - 1; pts.push([x.toFixed(1), (M - A * q).toFixed(1)]); }
      h += `<path class="orig" d="${d}"/><polyline class="rec" points="${pts.map(p => p.join(',')).join(' ')}"/>`;
      pts.forEach(p => h += `<line class="stem" x1="${p[0]}" x2="${p[0]}" y1="${M}" y2="${p[1]}"/><circle cx="${p[0]}" cy="${p[1]}" r="3.2"/>`);
      samp.innerHTML = h;
      cap.textContent = `${n} amostras por ciclo e ${L} níveis de volume (${b} ${b > 1 ? 'bits' : 'bit'}). ` +
        (n < 7 ? 'Poucas amostras: a onda reconstruída perde o formato.' : b < 3 ? 'Poucos bits: o volume vira degraus e surge ruído.' : 'Quanto mais amostras e bits, mais a linha clara se aproxima da onda original.');
    };
    sn.oninput = sb.oninput = draw; draw();
  }

  /* Atmosfera: partículas que vibram sobre linhas de onda (tons de azul e violeta) */
  const cv = $('#bg'), cx = cv.getContext('2d'), light = $('.light');
  let W, H, P = [], mx = -999, my = -999, lx = .5, ly = .35, tx = .5, ty2 = .35;
  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = W < 700 ? 40 : Math.min(90, Math.round(W * H / 16000)), r = Math.random;
    P = Array.from({ length: n }, () => ({ x: r() * W, b: r() * H, a: 6 + r() * 26, k: .004 + r() * .012, p: r() * 6.28, w: .2 + r() * .6, v: .08 + r() * .28, s: .7 + r() * 1.4, o: .14 + r() * .4, h: 215 + r() * 50, l: 62 + r() * 20, dx: 0, dy: 0 }));
  }
  size(); addEventListener('resize', size);
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; tx = mx / W; ty2 = my / H; }, { passive: true });
  function bg(t) {
    cx.clearRect(0, 0, W, H);
    for (const p of P) {
      if (!still) p.x += p.v; if (p.x > W + 10) p.x = -10;
      let y = p.b + p.a * Math.sin(p.k * p.x + t * p.w + p.p) - scrollY * .06 * p.s; y = ((y % H) + H) % H;
      const ddx = p.x - mx, ddy = y - my, d = Math.hypot(ddx, ddy) || 1, f = d < 130 ? (1 - d / 130) * 16 : 0;
      p.dx += (ddx / d * f - p.dx) * .08; p.dy += (ddy / d * f - p.dy) * .08;
      const m = .2 + .8 * (.5 + .5 * Math.sin(p.x * .0035 + t * .12) * Math.cos(y * .003 - t * .09));
      cx.fillStyle = `hsla(${p.h},88%,${p.l}%,${(p.o * m).toFixed(3)})`;
      cx.beginPath(); cx.arc(p.x + p.dx, y + p.dy, p.s, 0, 6.283); cx.fill();
    }
    /* luz do mouse: muda a iluminação do fundo bem devagar */
    lx += (tx - lx) * .025; ly += (ty2 - ly) * .025;
    light.style.setProperty('--lx', (lx * 100).toFixed(1) + '%'); light.style.setProperty('--ly', (ly * 100).toFixed(1) + '%');
  }

  /* Laboratório: a onda reage quando a voz está tocando */
  const lab = $('#tts'), lp = $('#lw path');
  let labOn = false, labAmp = 3;
  lab && new IntersectionObserver(e => labOn = e[0].isIntersecting).observe(lab);
  function labWave(t) {
    const target = lab.classList.contains('speaking') ? 24 + 14 * Math.abs(Math.sin(t * 9) * Math.sin(t * 3.1)) : 3;
    labAmp += (target - labAmp) * .1; let d = '';
    for (let x = 0; x <= 600; x += 4) d += (x ? 'L' : 'M') + x + ' ' + (45 + labAmp * Math.sin(x * .05 + t * 6) * Math.sin(x * .012 + t)).toFixed(1);
    lp.setAttribute('d', d);
  }
  /* Títulos de capítulo: o texto é revelado como se fosse digitado, uma única vez */
  if (!still) document.querySelectorAll('.ch h2').forEach(h2 => {
    const txt = h2.textContent; h2.setAttribute('aria-label', txt);
    h2.innerHTML = '<span></span><span class="tw-g" aria-hidden="true"></span>';
    const [vis, ghost] = h2.children; vis.setAttribute('aria-hidden', 'true'); ghost.textContent = txt;
    new IntersectionObserver((e, o) => { if (!e[0].isIntersecting) return; o.disconnect(); let i = 0; h2.classList.add('typing');
      const step = () => { i++; vis.textContent = txt.slice(0, i); ghost.textContent = txt.slice(i); if (i < txt.length) setTimeout(step, 38); else setTimeout(() => h2.classList.remove('typing'), 700); }; step(); }, { threshold: .8 }).observe(h2);
  });

  const t0 = performance.now();
  function loop(now) { const t = (now - t0) / 1000; bg(t); if (labOn && lp) labWave(t); requestAnimationFrame(loop); }
  if (still) { bg(0); lp && labWave(0); } else requestAnimationFrame(loop);
})();
