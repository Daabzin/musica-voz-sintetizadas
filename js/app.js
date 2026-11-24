(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ===== MÍDIAS: para inserir um material, preencha o data-src do espaço correspondente no index.html
     Ex.: <figure class="slot" data-media="audio" data-src="assets/audio/meu-audio.mp3"> ===== */
  const T = { raster: ['Imagem raster', 'JPG, PNG ou WebP', 'images/raster'], vector: ['Imagem vetorial', 'SVG', 'images/vector'],
    audio: ['Áudio digitalizado', 'MP3, WAV ou OGG', 'audio'], midi: ['Música MIDI', '.mid', 'midi'],
    video: ['Vídeo', 'MP4 (H.264)', 'video'], animation: ['Animação', 'SVG animado, GIF/WebP ou MP4 em loop', 'animations'] };
  const esc = s => s.replace(/"/g, '&quot;');
  /* MIDI: player que toca o próprio .mid (js/midi-player.js) + link para baixar o arquivo */
  const midi = src => (customElements.get('midi-player') ? `<midi-player src="${esc(src)}"></midi-player>` : '<p class="note">Player MIDI indisponível neste navegador.</p>')
    + `<p class="mp-row"><a class="btn ghost" href="${esc(src)}" download>Baixar arquivo MIDI</a></p>`;
  function media(t, src, alt) {
    if (t === 'audio') return `<audio controls preload="metadata" src="${esc(src)}"></audio>`;
    if (t === 'video' || (t === 'animation' && /\.(mp4|webm)$/i.test(src)))
      return `<video ${t === 'video' ? 'controls' : 'autoplay loop muted'} playsinline src="${esc(src)}"></video>`;
    if (t === 'midi') return midi(src);
    return `<img loading="lazy" src="${esc(src)}" alt="${esc(alt)}">`;
  }
  $$('.slot').forEach(f => {
    const t = f.dataset.media, src = f.dataset.src;
    const body = src ? media(t, src, f.dataset.alt || f.dataset.caption || T[t][0])
      : `<div class="ph"><strong>${T[t][0]}</strong><span>Espaço reservado para o material do grupo (${T[t][1]})</span><code>assets/${T[t][2]}/</code></div>`;
    f.innerHTML = body + `<figcaption>${f.dataset.caption || ''}</figcaption>`;
  });
  /* Galeria editorial: cada tipo tem uma composição própria (elementos gráficos abstratos, não são materiais do grupo) */
  const V = {
    raster: '<div class="px"></div>',
    vector: '<svg viewBox="0 0 200 120" class="draw" aria-hidden="true"><path pathLength="1" d="M10 100C50 -10 120 130 190 20"/><path class="st" pathLength="1" d="M10 100L50 -10M190 20L120 130"/><circle cx="10" cy="100" r="4"/><circle cx="190" cy="20" r="4"/></svg>',
    audio: '<div class="eq wide"></div>',
    midi: '<p class="md">90 <span>3C</span> 64<br>80 <span>3C</span> 00</p>',
    video: '<div class="vf"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l9 6-9 6z"/></svg></div>',
    animation: '<div class="orb"><i></i><i></i><i></i></div>' };
  const FN = { raster: 'Fotografia do grupo realizando o trabalho', vector: 'Desenho em SVG de uma onda sonora', audio: 'Voz real de um integrante (versão editada), para comparar com a voz sintetizada',
    midi: 'Beat de piano do grupo, música descrita por instruções', video: 'Integrante explicando o que é voz sintetizada', animation: 'Onda sonora em movimento' };
  /* quando o arquivo existe, a galeria mostra uma prévia dele (sem controles, pois a linha inteira é um link para o capítulo) */
  const ST = { raster: 'width:100%;height:100%;object-fit:cover;object-position:50% 35%;border-radius:8px;display:block', vector: 'width:100%;max-height:12rem;object-fit:contain;display:block',
    video: 'max-width:100%;max-height:16rem;border-radius:8px;display:block', animation: 'max-width:100%;max-height:10rem;border-radius:8px;display:block' };
  function GV(t, sl) {
    const f = sl.find(x => x.dataset.src), src = f && f.dataset.src; if (!src) return V[t];
    if (t === 'raster' || t === 'vector') return `<img loading="lazy" src="${esc(src)}" alt="" style="${ST[t]}">`;
    if (t === 'video') return `<video muted playsinline preload="metadata" src="${esc(src)}#t=0.1" style="${ST[t]}"></video>`;
    if (t === 'animation') return `<video autoplay loop muted playsinline src="${esc(src)}" style="${ST[t]}"></video>`;
    return V[t];
  }
  $('#gal').innerHTML = Object.keys(T).map(t => {
    const sl = $$('.slot').filter(f => f.dataset.media === t), ok = sl.some(f => f.dataset.src);
    const id = sl[0].closest('section').id;
    if (t === 'midi' && ok) { /* com o arquivo carregado, a linha vira um player (um <a> não pode conter botões) */
      const s = sl.find(f => f.dataset.src).dataset.src;
      return `<div class="g gs-${t}" data-r><div class="gh"><h3>${T[t][0]}</h3><span class="fmt">${FN[t]}</span><span class="fmt">${T[t][1]}</span><a class="fmt" href="#${id}">Ver no capítulo MIDI</a><span class="tag ok">Carregado</span></div><div class="gv">${midi(s)}</div></div>`;
    }
    return `<a class="g gs-${t}" data-r href="#${id}"><div class="gh"><h3>${T[t][0]}</h3><span class="fmt">${FN[t]}</span><span class="fmt">${T[t][1]}</span><span class="tag ${ok ? 'ok' : ''}">${ok ? 'Carregado' : 'Aguardando material'}</span></div><div class="gv">${GV(t, sl)}</div></a>`;
  }).join('');

  /* ===== Navegação e efeitos ===== */
  const top = $('.top'), nav = $('.top nav'), burger = $('.burger');
  const setMenu = o => { nav.classList.toggle('open', o); burger.setAttribute('aria-expanded', o); };
  burger.onclick = () => setMenu(!nav.classList.contains('open'));
  $$('.top nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  const onScroll = () => top.classList.toggle('scrolled', scrollY > 20); onScroll(); addEventListener('scroll', onScroll, { passive: true });
  const links = $$('.top nav a');
  const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting)
    links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section').forEach(s => spy.observe(s));
  $$('.tabs').forEach(tb => tb.onclick = e => { const b = e.target.closest('button'); if (!b) return;
    $$('button', tb).forEach(x => x.classList.toggle('on', x === b));
    $$('.panel').forEach(p => p.classList.toggle('on', p.id === b.dataset.t)); });
  $$('.eq').forEach(eq => { const n = eq.classList.contains('wide') ? 64 : 12;
    eq.innerHTML = Array.from({ length: n }, (_, i) => `<i style="--h:${(.3 + Math.abs(Math.sin(i * .55)) * .7).toFixed(2)};--d:${(.9 + (i % 7) * .15).toFixed(2)}s;--s:${(i * -.12).toFixed(2)}s"></i>`).join(''); });
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function count(el) { const to = +el.dataset.count, dec = +el.dataset.dec || 0, t0 = performance.now();
    const f = t => { const p = Math.min((t - t0) / 1200, 1); el.textContent = (to * (1 - Math.pow(1 - p, 3))).toFixed(dec).replace('.', ','); if (p < 1) requestAnimationFrame(f); };
    still ? el.textContent = String(to.toFixed(dec)).replace('.', ',') : requestAnimationFrame(f); }
  const rv = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; e.target.classList.add('in');
    $$('[data-count]', e.target).forEach(count); rv.unobserve(e.target); }), { threshold: .15 });
  $$('[data-r]').forEach(el => rv.observe(el));

  /* ===== Voz sintetizada (Web Speech API) ===== */
  const ss = window.speechSynthesis;
  $$('#tts input[type=range]').forEach(r => r.oninput = () => r.nextElementSibling.value = r.value);
  if (!ss || !window.SpeechSynthesisUtterance) {
    $('#tts-msg').textContent = 'Este navegador não oferece a Web Speech API. Use Chrome, Edge ou Safari.';
    $$('#tts button').forEach(b => b.disabled = true);
  } else {
    const sel = $('#voice'); let vs = [];
    const load = () => { vs = ss.getVoices(); const pt = vs.filter(v => v.lang.toLowerCase().startsWith('pt'));
      sel.innerHTML = (pt.length ? pt : vs).map(v => `<option value="${vs.indexOf(v)}">${v.name} (${v.lang})</option>`).join(''); };
    load(); ss.onvoiceschanged = load;
    $('#speak').onclick = () => { ss.cancel(); const u = new SpeechSynthesisUtterance($('#text').value), v = vs[sel.value];
      u.lang = v ? v.lang : 'pt-BR'; if (v) u.voice = v; u.rate = +$('#rate').value; u.pitch = +$('#pitch').value;
      const set = on => { $('#tts').classList.toggle('speaking', on); $('#state').textContent = on ? 'Falando' : 'Em espera'; };
      u.onstart = () => set(true); u.onend = u.onerror = () => set(false); ss.speak(u); };
    $('#stop').onclick = () => { ss.cancel(); $('#tts').classList.remove('speaking'); $('#state').textContent = 'Em espera'; };
  }
})();
