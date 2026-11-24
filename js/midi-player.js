/* <midi-player src="arquivo.mid"></midi-player>
   Player MIDI local, sem dependências e sem internet: lê o próprio arquivo .mid (Standard MIDI File),
   agenda as notas e gera o som com Web Audio (síntese, a mesma ideia do capítulo "MIDI").
   Usa o mesmo nome de tag do html-midi-player. Se esse pacote for carregado ANTES deste script,
   ele é quem responde pela tag e este arquivo não faz nada (veja o README). */
(() => {
  if (customElements.get('midi-player')) return;

  /* ---------- 1. Leitura do arquivo MIDI ---------- */
  const cache = new Map();
  function parse(buf) {
    const d = new DataView(buf), u = new Uint8Array(buf);
    const str = (o, n) => String.fromCharCode(...u.subarray(o, o + n));
    if (str(0, 4) !== 'MThd') throw new Error('não é um arquivo MIDI');
    const ntr = d.getUint16(10), div = d.getUint16(12);
    if (div & 0x8000) throw new Error('divisão de tempo SMPTE não suportada');
    let p = 8 + d.getUint32(4);
    const ev = [], tempos = [{ tick: 0, us: 500000 }];
    for (let t = 0; t < ntr && p + 8 <= u.length; t++) {
      const len = d.getUint32(p + 4); let i = p + 8; const end = Math.min(i + len, u.length); p = i + len;
      let tick = 0, rs = 0;
      const vlq = () => { let v = 0, b; do { b = u[i++]; v = (v << 7) | (b & 127); } while (b & 128 && i < end); return v; };
      while (i < end) {
        tick += vlq(); let s = u[i];
        if (s === 0xFF) { const ty = u[i + 1]; i += 2; const l = vlq();
          if (ty === 0x51 && l === 3) tempos.push({ tick, us: (u[i] << 16) | (u[i + 1] << 8) | u[i + 2] });
          i += l; continue; }
        if (s === 0xF0 || s === 0xF7) { i++; i += vlq(); continue; }
        if (s & 0x80) { rs = s; i++; } else s = rs;
        const k = s >> 4, ch = s & 15, a = u[i];
        if (k === 0xC || k === 0xD) { i += 1; continue; }
        const b = u[i + 1]; i += 2;
        if (k === 9 && b > 0) ev.push({ tick, on: true, ch, n: a, v: b });
        else if (k === 8 || k === 9) ev.push({ tick, on: false, ch, n: a });
      }
    }
    /* tick → segundos, respeitando as mudanças de andamento */
    tempos.sort((x, y) => x.tick - y.tick);
    let acc = 0, last = tempos[0];
    for (const t of tempos) { acc += (t.tick - last.tick) * last.us / div / 1e6; t.s = acc; last = t; }
    const sec = tk => { let t = tempos[0]; for (const x of tempos) if (x.tick <= tk) t = x; else break; return t.s + (tk - t.tick) * t.us / div / 1e6; };
    ev.sort((x, y) => x.tick - y.tick || (x.on ? 1 : 0) - (y.on ? 1 : 0));
    const open = new Map(), notes = [];
    for (const e of ev) {
      const key = e.ch * 128 + e.n;
      if (e.on) { if (open.has(key)) { const o = open.get(key); o.end = sec(e.tick); } open.set(key, { t: sec(e.tick), end: null, n: e.n, v: e.v, ch: e.ch }); notes.push(open.get(key)); }
      else if (open.has(key)) { open.get(key).end = sec(e.tick); open.delete(key); }
    }
    let total = 0;
    for (const n of notes) { if (n.end == null) n.end = n.t + 0.5; n.d = Math.max(n.end - n.t, 0.04); total = Math.max(total, n.t + n.d); }
    notes.sort((x, y) => x.t - y.t);
    return { notes, duration: total };
  }
  const load = src => { if (!cache.has(src)) cache.set(src, fetch(src).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); }).then(parse)); return cache.get(src); };

  /* ---------- 2. Síntese do som ---------- */
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);
  const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  let wave;
  function voice(ctx, out, n, when, dur, vel) {
    wave = wave || ctx.createPeriodicWave(Float32Array.from([0, 0, 0, 0, 0, 0, 0]), Float32Array.from([0, 1, .45, .28, .14, .08, .04]));
    const f = hz(n.n), g = Math.pow(vel / 127, 1.4) * 0.34;
    const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), e = ctx.createGain();
    o.setPeriodicWave(wave); o.frequency.value = f;
    lp.type = 'lowpass'; lp.Q.value = .5;
    lp.frequency.setValueAtTime(Math.min(f * 9 + 1500, 12000), when);              /* ataque brilhante... */
    lp.frequency.exponentialRampToValueAtTime(Math.min(f * 2.5 + 400, 6000), when + .5); /* ...que escurece, como a corda do piano */
    const decay = Math.max(0.35, 2.6 - f / 700), rel = 0.22, stop = when + dur;
    e.gain.setValueAtTime(0.0001, when);
    e.gain.linearRampToValueAtTime(g, when + .006);
    e.gain.setTargetAtTime(g * .35, when + .006, decay / 3);
    e.gain.setTargetAtTime(0.0001, stop, rel / 3);
    o.connect(lp); lp.connect(e); e.connect(out);
    o.start(when); o.stop(stop + rel * 2.2);
    return { o, e };
  }
  function drum(ctx, out, n, when, vel) { /* canal 10 (percussão): sons simples de bumbo e de chiado */
    const g = Math.pow(vel / 127, 1.2) * .5, e = ctx.createGain(); e.connect(out);
    if (n.n === 35 || n.n === 36) {
      const o = ctx.createOscillator(); o.frequency.setValueAtTime(140, when); o.frequency.exponentialRampToValueAtTime(40, when + .15);
      e.gain.setValueAtTime(g, when); e.gain.exponentialRampToValueAtTime(.0001, when + .25); o.connect(e); o.start(when); o.stop(when + .3); return { o, e };
    }
    const len = Math.floor(ctx.sampleRate * .2), b = ctx.createBuffer(1, len, ctx.sampleRate), c = b.getChannelData(0);
    for (let i = 0; i < len; i++) c[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5000; s.buffer = b;
    e.gain.setValueAtTime(g * .5, when); e.gain.exponentialRampToValueAtTime(.0001, when + (n.n === 46 ? .2 : .07));
    s.connect(hp); hp.connect(e); s.start(when); return { o: s, e };
  }

  /* ---------- 3. Elemento <midi-player> ---------- */
  const players = new Set();
  class MidiPlayer extends HTMLElement {
    static get observedAttributes() { return ['src']; }
    connectedCallback() {
      if (this._ready) return; this._ready = true; players.add(this);
      this.classList.add('mp'); this.setAttribute('role', 'group'); this.setAttribute('aria-label', 'Player de música MIDI');
      this.innerHTML = '<button type="button" class="mp-b" aria-label="Tocar" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path class="mp-play" d="M8 5.5v13l11-6.5z"/><path class="mp-pause" d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg></button>'
        + '<input class="mp-s" type="range" min="0" max="1000" value="0" step="1" aria-label="Posição da música" disabled>'
        + '<span class="mp-t" aria-live="off">0:00 / 0:00</span><span class="mp-m" role="status"></span>';
      this._b = this.querySelector('.mp-b'); this._s = this.querySelector('.mp-s'); this._t = this.querySelector('.mp-t'); this._m = this.querySelector('.mp-m');
      this._pos = 0; this._playing = false; this._dur = 0;
      this._b.onclick = () => this.playing ? this.pause() : this.start();
      this._s.oninput = () => { this._dragging = true; this._pos = this._s.value / 1000 * this._dur; this._draw(); };
      this._s.onchange = () => { this._dragging = false; this.seek(this._s.value / 1000 * this._dur); };
      if (this.getAttribute('src')) this._load();
    }
    disconnectedCallback() { this.pause(); players.delete(this); this._ready = false; }
    attributeChangedCallback(n, o, v) { if (n === 'src' && this._ready && o !== v) { this.stop(); this._load(); } }
    get playing() { return this._playing; }
    get duration() { return this._dur; }
    get currentTime() { return this._now(); }
    async _load() {
      const src = this.getAttribute('src'); this._m.textContent = 'Carregando…'; this._b.disabled = this._s.disabled = true;
      try { this._song = await load(src); } catch (err) { this._m.textContent = 'Não foi possível carregar o MIDI (' + err.message + '). Use o botão de baixar.'; return; }
      this._dur = this._song.duration; this._pos = 0; this._m.textContent = ''; this._b.disabled = this._s.disabled = false; this._draw();
      this.dispatchEvent(new CustomEvent('load'));
    }
    _now() { return this._playing ? Math.min(this._pos + (this._ctx.currentTime - this._t0), this._dur) : this._pos; }
    _draw() {
      const t = this._dragging ? this._pos : this._now();
      if (!this._dragging) this._s.value = this._dur ? t / this._dur * 1000 : 0;
      this._s.style.setProperty('--p', (this._dur ? t / this._dur * 100 : 0) + '%');
      this._t.textContent = fmt(t) + ' / ' + fmt(this._dur);
      this._b.setAttribute('aria-label', this._playing ? 'Pausar' : 'Tocar'); this.classList.toggle('on', this._playing);
    }
    _audio() {
      if (!this._ctx) {
        const Ctx = window.AudioContext || window.webkitAudioContext; this._ctx = new Ctx();
        this.analyser = this._ctx.createAnalyser(); this.analyser.fftSize = 2048;
        const comp = this._ctx.createDynamicsCompressor(); this._out = this._ctx.createGain(); this._out.gain.value = .9;
        this._out.connect(comp); comp.connect(this.analyser); this.analyser.connect(this._ctx.destination);
      }
      return this._ctx;
    }
    async start() {
      if (!this._song) return;
      for (const p of players) if (p !== this) p.pause();
      const ctx = this._audio(); try { await ctx.resume(); } catch (e) { /* o navegador pode recusar sem gesto do usuário */ }
      if (this._pos >= this._dur - .05) this._pos = 0;
      this._t0 = ctx.currentTime + .05; this._i = this._song.notes.findIndex(n => n.t >= this._pos); if (this._i < 0) this._i = this._song.notes.length;
      this._live = new Set(); this._playing = true; this._tick(); this._timer = setInterval(() => this._tick(), 60);
      this._raf = () => { if (!this._playing) return; this._draw(); requestAnimationFrame(this._raf); }; this._raf();
      this.dispatchEvent(new CustomEvent('start'));
    }
    _tick() { /* agenda as notas dos próximos 0,5 s no relógio do áudio */
      const ctx = this._ctx, N = this._song.notes, now = this._pos + (ctx.currentTime - this._t0);
      if (now >= this._dur + .3) { this._finish(); return; }
      while (this._i < N.length && N[this._i].t < now + .5) {
        const n = N[this._i++], when = this._t0 + (n.t - this._pos); if (when < ctx.currentTime) continue;
        const v = n.ch === 9 ? drum(ctx, this._out, n, when, n.v) : voice(ctx, this._out, n, when, n.d, n.v);
        this._live.add(v); v.o.onended = () => this._live.delete(v);
      }
    }
    _silence() { if (!this._live) return; const t = this._ctx.currentTime; for (const v of this._live) { try { v.e.gain.cancelScheduledValues(t); v.e.gain.setTargetAtTime(0.0001, t, .03); v.o.stop(t + .15); } catch (e) { /* já terminou */ } } this._live.clear(); }
    _halt() { clearInterval(this._timer); this._silence(); this._playing = false; }
    pause() { if (!this._playing) return; this._pos = this._now(); this._halt(); this._draw(); this.dispatchEvent(new CustomEvent('stop')); }
    stop() { const was = this._playing; if (was) this._halt(); this._pos = 0; this._draw(); if (was) this.dispatchEvent(new CustomEvent('stop')); }
    _finish() { this._halt(); this._pos = 0; this._draw(); this.dispatchEvent(new CustomEvent('stop', { detail: { finished: true } })); }
    seek(t) { const was = this._playing; if (was) this._halt(); this._pos = Math.max(0, Math.min(t, this._dur)); this._draw(); if (was) this.start(); }
  }
  customElements.define('midi-player', MidiPlayer);
})();
