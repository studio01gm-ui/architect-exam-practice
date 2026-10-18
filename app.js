(() => {
  const data = window.EXAM_DATA || [];
  const $ = (id) => document.getElementById(id);
  const state = { set: data[0], mode: 'instant', index: 0, answers: {}, submitted: false, remaining: 7200, timerId: null };
  const keys = ['A', 'B', 'C', 'D'];

  function renderLibrary() {
    $('subjectCount').textContent = `${data.length} 組`;
    $('totalQuestions').textContent = data.reduce((sum, item) => sum + item.questions.length, 0);
    $('libraryList').innerHTML = data.map((item, i) => `<button class="library-item ${i === 0 ? 'active' : ''}" data-index="${i}"><span class="year">${item.year} EXAM</span><strong>${item.subject}</strong><small>${item.officialSubject} · ${item.questions.length} 題</small></button>`).join('');
    document.querySelectorAll('.library-item').forEach(btn => btn.addEventListener('click', () => { selectSet(Number(btn.dataset.index)); }));
  }

  function selectSet(index) {
    state.set = data[index]; state.index = 0; state.answers = {}; state.submitted = false; state.remaining = state.set.durationMinutes * 60;
    document.querySelectorAll('.library-item').forEach((el, i) => el.classList.toggle('active', i === index));
    $('quizTitle').textContent = `${state.set.year} · ${state.set.subject}`;
    $('quizSubtitle').textContent = `${state.set.officialSubject} · 共 ${state.set.questions.length} 題 · ${state.set.durationMinutes} 分鐘`;
    $('timer').textContent = '02:00:00';
    renderQuestion();
  }

  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
    $('instantBadge').textContent = mode === 'instant' ? '即時回饋開啟' : '完成後統一檢查';
    $('submitBtn').classList.toggle('hidden', mode !== 'timed');
    $('tipText').textContent = mode === 'instant' ? '即時模式會在選擇後立即顯示正確答案。' : '計時模式不會立即揭露答案，交卷後才會統一檢查。';
    if (mode === 'timed') startTimer(); else stopTimer();
    renderQuestion();
  }

  function startTimer() { stopTimer(); state.timerId = setInterval(() => { if (state.remaining > 0) state.remaining--; updateTimer(); if (state.remaining === 0) submitExam(); }, 1000); updateTimer(); }
  function stopTimer() { if (state.timerId) clearInterval(state.timerId); state.timerId = null; }
  function updateTimer() { const h = Math.floor(state.remaining / 3600); const m = Math.floor((state.remaining % 3600) / 60); const s = state.remaining % 60; $('timer').textContent = [h, m, s].map(v => String(v).padStart(2, '0')).join(':'); if (state.remaining < 300) $('timer').classList.add('pulse'); else $('timer').classList.remove('pulse'); }

  function renderQuestion() {
    const item = state.set.questions[state.index];
    if (!item) return;
    const chosen = state.answers[item.number];
    $('questionNo').textContent = `QUESTION ${String(item.number).padStart(2, '0')}`;
    $('questionText').textContent = item.prompt;
    $('progressText').textContent = `${Object.keys(state.answers).length} / ${state.set.questions.length}`;
    $('progressBar').style.width = `${(Object.keys(state.answers).length / state.set.questions.length) * 100}%`;
    $('options').innerHTML = item.options.map((text, i) => { const key = keys[i]; let cls = ''; if (chosen === key) cls += ' selected'; if (state.mode === 'instant' && chosen) { if (key === item.answer) cls += ' correct'; else if (key === chosen) cls += ' wrong'; } if (state.submitted && key === item.answer) cls += ' correct'; if (state.submitted && chosen === key && key !== item.answer) cls += ' wrong'; return `<button class="option${cls}" data-key="${key}" ${chosen || state.submitted ? 'disabled' : ''}><span class="option-key">${key}</span>${text}</button>`; }).join('');
    document.querySelectorAll('.option').forEach(btn => btn.addEventListener('click', () => choose(btn.dataset.key)));
    let feedback = ''; let feedbackClass = 'neutral';
    if (chosen && state.mode === 'instant') { feedback = chosen === item.answer ? `答對了！答案是 ${item.answer}。` : `再想一下：正確答案是 ${item.answer}。`; feedbackClass = chosen === item.answer ? 'good' : 'bad'; }
    if (state.submitted && chosen) { feedback = chosen === item.answer ? `答對了！答案是 ${item.answer}。` : `正確答案是 ${item.answer}。`; feedbackClass = chosen === item.answer ? 'good' : 'bad'; }
    $('feedback').className = `feedback ${feedbackClass}`; $('feedback').textContent = feedback;
    $('prevBtn').disabled = state.index === 0; $('nextBtn').disabled = state.index === state.set.questions.length - 1;
    $('questionJump').innerHTML = state.set.questions.map((q, i) => `<button class="jump-btn ${i === state.index ? 'current' : ''} ${state.answers[q.number] ? 'done' : ''}" data-jump="${i}">${q.number}</button>`).join('');
    document.querySelectorAll('.jump-btn').forEach(btn => btn.addEventListener('click', () => { state.index = Number(btn.dataset.jump); renderQuestion(); }));
  }

  function choose(key) { const item = state.set.questions[state.index]; state.answers[item.number] = key; renderQuestion(); }
  function submitExam() { state.submitted = true; stopTimer(); const score = state.set.questions.reduce((sum, q) => sum + (state.answers[q.number] === q.answer ? 1 : 0), 0); $('feedback').className = 'feedback neutral'; $('feedback').textContent = `已完成檢查：${score} / ${state.set.questions.length} 題正確。可用題號列回看每一題。`; renderQuestion(); }
  function reset() { state.index = 0; state.answers = {}; state.submitted = false; state.remaining = state.set.durationMinutes * 60; if (state.mode === 'timed') startTimer(); else stopTimer(); renderQuestion(); }

  $('prevBtn').addEventListener('click', () => { if (state.index > 0) { state.index--; renderQuestion(); } });
  $('nextBtn').addEventListener('click', () => { if (state.index < state.set.questions.length - 1) { state.index++; renderQuestion(); } });
  $('submitBtn').addEventListener('click', submitExam); $('resetBtn').addEventListener('click', reset);
  document.querySelectorAll('.mode-btn').forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
  renderLibrary(); selectSet(0);
})();
