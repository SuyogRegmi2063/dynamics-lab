/* Quiz: 15 multiple-choice questions, three levels. Math uses KaTeX \( \) delimiters (rendered by common.js). */
(function () {
  'use strict';
  var R = String.raw;

  var QUESTIONS = [
    { level: 'beginner', q: R`What is the natural circular frequency of an undamped SDOF system with mass \(m\) and stiffness \(k\)?`,
      options: [R`\(\sqrt{m/k}\)`, R`\(\sqrt{k/m}\)`, R`\(k/m\)`, R`\(2\pi\sqrt{k/m}\)`], answer: 1,
      explain: R`\(\omega_n=\sqrt{k/m}\) in rad/s. The expression \(2\pi\sqrt{k/m}\) is not a frequency at all, while \(2\pi/\omega_n\) would be the period.` },
    { level: 'beginner', q: R`A tank has mass 4000 kg and lateral stiffness \(1.6\times10^6\) N/m. What is its natural frequency in Hz?`,
      options: ['20 Hz', '3.18 Hz', '125.7 Hz', '0.31 Hz'], answer: 1,
      explain: R`\(\omega_n=\sqrt{1.6\times10^6/4000}=20\) rad/s, so \(f_n=20/2\pi=3.18\) Hz. The value 20 is in rad/s, and 0.31 is the period in seconds.` },
    { level: 'beginner', q: R`A structure has damping ratio \(\xi=0.05\). Its free vibration after a disturbance is best described as:`,
      options: ['Oscillation with constant amplitude', 'Oscillation with decaying amplitude', 'A slow return to rest with no oscillation', 'Growing oscillation'], answer: 1,
      explain: R`For \(\xi\lt1\) the system is underdamped: it oscillates at \(\omega_D\) inside a decaying exponential envelope. Non-oscillatory return occurs only for \(\xi\ge1\).` },
    { level: 'beginner', q: R`How many degrees of freedom does a 4-storey shear building have if the floors are rigid and the columns are axially rigid?`,
      options: ['1', '2', '4', '8'], answer: 2,
      explain: 'Each rigid floor can only translate sideways, giving one independent coordinate per storey, so 4 DOF.' },
    { level: 'beginner', q: R`A lightly damped system (\(\xi=0.02\)) is loaded harmonically exactly at its natural frequency. What is the approximate dynamic amplification factor?`,
      options: ['2', '25', '50', '0.02'], answer: 1,
      explain: R`At resonance \(D=1/(2\xi)=1/0.04=25\). The response is 25 times the static deflection \(p_0/k\).` },

    { level: 'intermediate', q: 'An undamped SDOF system is subjected to a constant force suddenly applied at t = 0 (a step load). What is the maximum displacement relative to the static deflection?',
      options: ['Equal to it', 'Twice as large', 'Half as large', 'It grows without limit'], answer: 1,
      explain: R`\(u(t)=(p_0/k)(1-\cos\omega_n t)\) reaches \(2p_0/k\). Damping reduces the factor slightly below 2.` },
    { level: 'intermediate', q: R`Which expression gives the damped natural frequency?`,
      options: [R`\(\omega_D=\omega_n\sqrt{1-\xi^2}\)`, R`\(\omega_D=\omega_n(1+\xi)\)`, R`\(\omega_D=\omega_n/\sqrt{1-\xi^2}\)`, R`\(\omega_D=\omega_n\xi\)`], answer: 0,
      explain: R`Damping slightly lowers the oscillation frequency. For \(\xi=5\%\) the reduction is only 0.13%.` },
    { level: 'intermediate', q: R`Two successive peaks in a free-vibration record differ by a factor \(e^{\delta}\). For small damping, \(\xi=0.05\) gives a logarithmic decrement \(\delta\) of about:`,
      options: ['0.05', '0.314', '3.14', '0.0314'], answer: 1,
      explain: R`\(\delta\approx2\pi\xi=2\pi(0.05)=0.314\). Successive peaks shrink by a factor \(e^{-0.314}=0.73\), i.e. each peak is about 27% lower than the one before.` },
    { level: 'intermediate', q: "Newmark's average acceleration method (β = 1/4, γ = 1/2) for a linear system is:",
      options: ['Conditionally stable only for large time steps', 'Unconditionally stable', 'Always unstable', 'Stable only with zero damping'], answer: 1,
      explain: 'It is unconditionally stable, so the time step is chosen for accuracy (about T/10 or smaller), not stability.' },
    { level: 'intermediate', q: 'A machine on springs transmits less force to the floor than it applies only if the frequency ratio r = ω̄/ωₙ is:',
      options: [R`\(r\lt1\)`, R`\(r=1\)`, R`\(r\gt\sqrt2\)`, R`\(r\gt1\) and \(\xi=0\) only`], answer: 2,
      explain: R`Transmissibility is below 1 only beyond \(r=\sqrt2\). Mounts with natural frequency above the machine frequency amplify the force.` },
    { level: 'intermediate', q: R`The pseudo-acceleration spectrum ordinate \(S_a\) is related to the spectral displacement \(S_d\) by:`,
      options: [R`\(S_a=\omega_n S_d\)`, R`\(S_a=\omega_n^2 S_d\)`, R`\(S_a=S_d/\omega_n^2\)`, R`\(S_a=S_d\,\xi\)`], answer: 1,
      explain: R`\(S_a=\omega_n^2S_d\), and the equivalent static base shear is \(V_b=mS_a=kS_d\).` },

    { level: 'advanced', q: 'Which statement describes mode-shape orthogonality for an undamped MDOF system with mass matrix M?',
      options: [R`\(\boldsymbol\phi_i^T\mathbf M\boldsymbol\phi_j=0\) for \(i\ne j\)`, R`\(\boldsymbol\phi_i^T\boldsymbol\phi_j=0\) for all \(i,j\)`, R`\(\boldsymbol\phi_i^T\mathbf M\boldsymbol\phi_i=0\)`, R`\(\mathbf M\boldsymbol\phi_i=\omega_i\boldsymbol\phi_i\)`], answer: 0,
      explain: 'Orthogonality is with respect to M (and K), not the plain dot product. It is what decouples the equations of motion in modal coordinates.' },
    { level: 'advanced', q: 'Summing the effective modal masses over all modes of an MDOF system under uniform base excitation gives:',
      options: ['Zero', 'The mass of the first floor', 'The total mass of the system', 'The mass of the roof only'], answer: 2,
      explain: 'The effective masses (one per mode) add up to the total mass. Codes typically require enough modes to capture at least 90%.' },
    { level: 'advanced', q: R`For Rayleigh damping \(\mathbf C=a_0\mathbf M+a_1\mathbf K\), the damping ratio of mode \(n\) is:`,
      options: [R`\(\xi_n=a_0\omega_n+a_1/\omega_n\)`, R`\(\xi_n=\dfrac{a_0}{2\omega_n}+\dfrac{a_1\omega_n}{2}\)`, R`\(\xi_n=\dfrac{a_0+a_1}{2}\)`, R`\(\xi_n=a_0a_1\omega_n\)`], answer: 1,
      explain: 'The mass-proportional term damps low modes more, the stiffness-proportional term damps high modes more. You choose a₀ and a₁ to match target damping at two frequencies.' },
    { level: 'advanced', q: 'For a simply supported uniform beam, how is the second natural frequency related to the first?',
      options: [R`\(\omega_2=2\omega_1\)`, R`\(\omega_2=4\omega_1\)`, R`\(\omega_2=\omega_1\sqrt2\)`, R`\(\omega_2=9\omega_1\)`], answer: 1,
      explain: R`\(\omega_n=(n\pi/L)^2\sqrt{EI/\bar m}\) grows with \(n^2\), so \(\omega_2/\omega_1=4\) (and \(\omega_3/\omega_1=9\)).` },
    { level: 'advanced', q: R`A 2-storey shear building has equal masses \(m\) and equal storey stiffnesses \(k\). What is its fundamental frequency?`,
      options: [R`\(0.618\sqrt{k/m}\)`, R`\(1.618\sqrt{k/m}\)`, R`\(\sqrt{k/m}\)`, R`\(0.382\sqrt{k/m}\)`], answer: 0,
      explain: R`The characteristic equation \(\lambda^2-3\lambda+1=0\) gives \(\lambda=\omega^2m/k=0.382\) and \(2.618\). So \(\omega_1=\sqrt{0.382}\sqrt{k/m}=0.618\sqrt{k/m}\).` }
  ];

  var state = { filter: 'all', answered: {}, correct: {} };
  var list = document.getElementById('quizList');

  function visible() {
    return QUESTIONS.map(function (q, i) { return { q: q, i: i }; })
      .filter(function (o) { return state.filter === 'all' || o.q.level === state.filter; });
  }

  function updateScore() {
    var v = visible(), tot = 0, ok = 0;
    v.forEach(function (o) {
      if (state.answered[o.i] !== undefined) { tot++; if (state.correct[o.i]) ok++; }
    });
    document.getElementById('score').textContent = ok + ' / ' + tot + '  (of ' + v.length + ' questions)';
  }

  function render() {
    list.innerHTML = '';
    visible().forEach(function (o, n) {
      var q = o.q, i = o.i;
      var card = document.createElement('div');
      card.className = 'card q-card';
      var html = '<span class="badge ' + q.level + '">' + q.level + '</span>' +
        '<div class="q-text">' + (n + 1) + '. ' + q.q + '</div><div class="q-opts"></div><div class="q-explain" hidden></div>';
      card.innerHTML = html;
      var opts = card.querySelector('.q-opts'), exp = card.querySelector('.q-explain');
      q.options.forEach(function (text, k) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'q-opt'; b.innerHTML = text;
        b.addEventListener('click', function () { choose(i, k, opts, exp, q); });
        opts.appendChild(b);
      });
      if (state.answered[i] !== undefined) reveal(i, state.answered[i], opts, exp, q);
      list.appendChild(card);
    });
    updateScore();
    if (window.DL) DL.renderMath(list);
  }

  function reveal(i, picked, opts, exp, q) {
    var btns = opts.querySelectorAll('button');
    btns.forEach(function (b, k) {
      b.disabled = true;
      if (k === q.answer) b.classList.add('correct');
      else if (k === picked) b.classList.add('wrong');
    });
    exp.hidden = false;
    exp.innerHTML = '<strong>' + (picked === q.answer ? 'Correct. ' : 'Not quite. ') + '</strong>' + q.explain;
  }

  function choose(i, k, opts, exp, q) {
    if (state.answered[i] !== undefined) return;
    state.answered[i] = k;
    state.correct[i] = k === q.answer;
    reveal(i, k, opts, exp, q);
    updateScore();
    if (window.DL) DL.renderMath(exp.parentNode);
  }

  document.querySelectorAll('#quizFilter button').forEach(function (b) {
    b.addEventListener('click', function () {
      state.filter = b.dataset.filter;
      document.querySelectorAll('#quizFilter button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      render();
    });
  });
  document.getElementById('resetQuiz').addEventListener('click', function () {
    state.answered = {}; state.correct = {}; render();
  });

  render();
})();
