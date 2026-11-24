(() => {
  const box = document.getElementById('quiz-box'), TOTAL = 5;
  let bank = [], set = [], i = 0, hits = 0;
  const shuffle = a => { a = [...a]; for (let n = a.length - 1; n > 0; n--) { const k = Math.floor(Math.random() * (n + 1)); [a[n], a[k]] = [a[k], a[n]]; } return a; };

  async function load() {
    try { const r = await fetch('data/questions.json'); if (!r.ok) throw 0; bank = await r.json(); start(); }
    catch { box.innerHTML = '<h3>Não foi possível carregar o quiz</h3><p>O navegador bloqueia a leitura do JSON quando o <code>index.html</code> é aberto direto. Rode <code>python -m http.server</code> na pasta do projeto e acesse <code>http://localhost:8000</code>.</p>'; }
  }
  function start() { set = shuffle(bank).slice(0, TOTAL); i = 0; hits = 0; show(); }

  /* Cada pergunta é uma "faixa" do quiz: segmentos no topo mostram o avanço */
  function show() {
    const q = set[i];
    box.innerHTML = `<div class="qtop"><div class="segs">${Array.from({ length: TOTAL }, (_, k) => `<i class="${k < i ? 'done' : k === i ? 'now' : ''}"></i>`).join('')}</div><span>Pergunta ${i + 1} de ${TOTAL}</span></div>
      <div class="qstage"><div class="qnum" aria-hidden="true">${i + 1}</div><div class="qbody"><h3 class="qq">${q.q}</h3>
      <div class="opts">${q.o.map((t, n) => `<button class="opt" data-n="${n}"><b>${'ABCD'[n]}</b><span>${t}</span></button>`).join('')}</div>
      <div id="fb"><button class="btn" id="ok" disabled>Confirmar resposta</button></div></div></div>`;
    let pick = -1; const ok = document.getElementById('ok');
    box.querySelectorAll('.opt').forEach(b => b.onclick = () => { pick = +b.dataset.n; ok.disabled = false;
      box.querySelectorAll('.opt').forEach(x => x.classList.toggle('sel', x === b)); });
    ok.onclick = () => answer(pick);
  }
  function answer(n) {
    const q = set[i]; if (n === q.a) hits++;
    box.querySelectorAll('.opt').forEach((b, k) => { b.disabled = true; b.classList.remove('sel'); b.classList.toggle('right', k === q.a); b.classList.toggle('wrong', k === n && n !== q.a); });
    box.querySelectorAll('.segs i')[i].className = 'done';
    const last = i === TOTAL - 1, good = n === q.a;
    document.getElementById('fb').innerHTML = `<div class="explain ${good ? 'good' : 'bad'}"><b>${good ? 'Correto!' : 'Não foi dessa vez.'}</b><p>${q.e}</p></div><button class="btn" id="next">${last ? 'Ver resultado' : 'Próxima pergunta'}</button>`;
    document.getElementById('next').onclick = () => { if (last) result(); else { i++; show(); } };
  }

  /* Resultado: o "sinal" fica mais limpo e forte quanto maior o acerto; com poucos acertos ele fica fraco e com ruído */
  function result() {
    const pct = Math.round(hits / TOTAL * 100);
    const msg = pct >= 80 ? ['Sinal forte e limpo.', 'Você dominou o tema.'] : pct >= 60 ? ['Bom sinal, com alguma interferência.', 'Revise alguns pontos e tente de novo.'] : pct >= 40 ? ['Sinal fraco.', 'Releia os capítulos e faça um novo quiz.'] : ['Muito ruído.', 'Explore os capítulos e tente novamente.'];
    const amp = 8 + 44 * pct / 100, noise = (1 - pct / 100) * 16; let d = '';
    for (let x = 0; x <= 600; x += 4) d += (x ? 'L' : 'M') + x + ' ' + (60 + amp * Math.sin(x * .045) + noise * (Math.random() * 2 - 1)).toFixed(1);
    box.innerHTML = `<div class="qtop"><div class="segs">${'<i class="done"></i>'.repeat(TOTAL)}</div><span>Resultado</span></div>
      <div class="res"><div class="pct" id="pct">0%</div><div class="sig"><svg viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="${d}"/></svg></div>
      <div class="rmsg"><h3>${msg[0]}</h3><p>${msg[1]} Você acertou ${hits} de ${TOTAL} perguntas.</p><button class="btn" id="again">Fazer novo quiz</button></div></div>`;
    document.getElementById('again').onclick = start;
    let p = 0; const t = setInterval(() => { p = Math.min(pct, p + 4); document.getElementById('pct').textContent = p + '%'; if (p >= pct) clearInterval(t); }, 25);
  }
  load();
})();
