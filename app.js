import { course, courseMeta } from './courseData.js';

const app = document.querySelector('#app-main');
const nav = document.querySelector('#module-nav');
const overlay = document.querySelector('#search-overlay');
const searchInput = document.querySelector('#global-search');
const searchResults = document.querySelector('#search-results');
const readKey = 'bd-study-progress-v1';
const themeKey = 'bd-study-theme-v1';
const scrollBehavior = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? 'auto' : 'smooth';

const savedRead = JSON.parse(localStorage.getItem(readKey) || '[]');
const state = {
  active: null,
  cheat: false,
  read: new Set(savedRead),
  theme: localStorage.getItem(themeKey) || 'light',
  ui: { compareDim: 0, compareView: 'digital', conceptNode: 'value', timeline: 0, webEra: 0, technology: 'internet', actor: 'platform', effect: 0, case: 0, roadmap: 0, mechanic: 'network', modelFamily: 'Semua', model: 'marketplace', bmc: 'segments', bmcCase: 0, fit: 'problem' },
  flash: {}, quiz: {}, searchItems: [], searchCursor: -1, searchHighlightTimer: null,
};

const $ = (selector, root = document) => root.querySelector(selector);
const esc = (value = '') => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const currentModule = () => course.find(item => item.id === state.active);
const icon = name => {
  const paths = {
    sun: '<circle cx="12" cy="12" r="3.5"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
    moon: '<path d="M20.4 15.2A8.5 8.5 0 0 1 8.8 3.6 8.6 8.6 0 1 0 20.4 15.2Z"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.check}</svg>`;
};

function progressFor(mod) {
  const count = mod.sections.length;
  const done = mod.sections.reduce((n, _, i) => n + (state.read.has(`${mod.id}:${i}`) ? 1 : 0), 0);
  return Math.round(done / count * 100);
}

function overallProgress() {
  const total = course.reduce((sum, mod) => sum + mod.sections.length, 0);
  const done = state.read.size;
  return Math.round(done / total * 100);
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  $('#theme-icon').innerHTML = icon(state.theme === 'light' ? 'moon' : 'sun');
  document.querySelector('meta[name="theme-color"]').content = state.theme === 'light' ? '#f8f7f4' : '#0f1012';
}

function renderNav() {
  nav.innerHTML = course.map(mod => {
    const percent = progressFor(mod);
    return `<button class="module-link ${state.active === mod.id ? 'active' : ''}" data-action="module" data-module="${mod.id}" aria-current="${state.active === mod.id ? 'page' : 'false'}">
      <span class="module-number">${mod.no}</span><span class="module-name"><strong>${esc(mod.title)}</strong><span>${esc(mod.short)}</span></span><span class="module-percent">${percent}%</span>
      <span class="module-progress"><span style="--progress-value:${percent / 100}"></span></span>
    </button>`;
  }).join('');
  const overall = overallProgress();
  $('#overall-progress-label').textContent = `${overall}%`;
  $('#overall-progress-bar').style.transform = `scaleX(${overall / 100})`;
}

function setBreadcrumb() {
  const crumb = $('#breadcrumbs');
  const mod = currentModule();
  crumb.innerHTML = `<span>RUANG BELAJAR</span><i>/</i><span>${mod ? `${mod.no} · ${esc(mod.title).toUpperCase()}` : 'OVERVIEW'}</span>`;
}

function renderDashboard() {
  document.querySelector('.side-home')?.classList.add('active');
  const overall = overallProgress();
  const next = course.find(mod => progressFor(mod) < 100) || course[0];
  const completed = course.filter(mod => progressFor(mod) === 100).length;
  app.innerHTML = `
    <section class="dashboard-head">
      <div><div class="eyebrow">PENGANTAR BISNIS DIGITAL <span>·</span> 3 SKS</div><h1>Ruang belajar</h1><p>Enam pertemuan materi, visualisasi interaktif, dan perangkat uji pemahaman dalam satu ruang belajar.</p></div>
      <div class="course-code"><strong>${courseMeta.author}</strong>Materi perkuliahan<br/>6 modul pembelajaran</div>
    </section>
    <section class="dashboard-bento" aria-label="Ringkasan progres">
      <div class="overview-panel"><div class="overview-copy"><div class="mono-label">PROGRES BELAJAR</div><h2>${completed ? `${completed} dari 6 modul selesai` : 'Progres Anda tersimpan di sini'}</h2><p>Bagian yang Anda tandai selesai disimpan otomatis pada perangkat ini. Buka modul untuk membaca materi dan mengecek pemahaman.</p></div><div class="overall-ring" style="--progress:${overall}%"><strong>${overall}%</strong></div></div>
      <div class="overview-side"><div><div class="mono-label">LANJUTKAN BELAJAR</div><strong>${esc(next.title)}</strong><p>Pertemuan ${next.no} · ${progressFor(next)}% selesai dibaca</p></div><button class="text-link" data-action="module" data-module="${next.id}">Buka materi <span>↗</span></button></div>
    </section>
    <section aria-labelledby="module-list-title"><div class="module-index-head"><h2 id="module-list-title">Daftar materi</h2><span>01 — 06 / PERTEMUAN</span></div><ol class="dashboard-module-list">${course.map(mod => {
      const percent = progressFor(mod);
      return `<li class="dashboard-module" role="button" tabindex="0" data-action="module" data-module="${mod.id}"><span class="dash-number">${mod.no}</span><span class="dash-title"><strong>${esc(mod.title)}</strong><span>${mod.sections.length} topik · visualisasi, flashcards & kuis</span></span><span class="dash-outcome">${esc(mod.outcome)}</span><span class="dash-progress">${percent}%<i><span style="--progress-value:${percent / 100}"></span></i></span><span class="dash-arrow">↗</span></li>`;
    }).join('')}</ol></section>
    <div class="dashboard-note"><span><strong>Cara memakai ruang belajar</strong> — pilih topik, tandai bagian yang selesai dibaca, lalu uji ingatan melalui flashcards dan kuis.</span><span>Materi lengkap <strong>${course.reduce((n, mod) => n + mod.sections.length, 0)} subbab</strong></span></div>
    <details class="course-admin"><summary>Administrasi perkuliahan · penilaian, nilai, dan syarat ujian</summary><div class="admin-body"><div><span class="mono-label">KOMPONEN PENILAIAN</span><ul>${courseMeta.assessment.breakdown.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div><div><span class="mono-label">KONVERSI NILAI</span><table class="grade-table"><thead><tr><th>Nilai angka</th><th>Huruf</th><th>Bobot</th></tr></thead><tbody>${courseMeta.assessment.grades.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div><span class="mono-label">SYARAT UTS / UAS</span><ul>${courseMeta.assessment.eligibility.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div></div></details>`;
}

function renderModule() {
  const mod = currentModule();
  if (!mod) return renderDashboard();
  const percent = progressFor(mod);
  const quick = state.cheat;
  app.innerHTML = `
    <article class="module-page accent-${mod.accent}">
      <header class="module-head">
        <div class="module-head-top"><div class="eyebrow">PERTEMUAN ${mod.no} <span>·</span> ${mod.sections.length} TOPIK</div><div class="visual-label">${percent}% SELESAI DIBACA</div></div>
        <h1 id="${mod.id}-module-title" class="search-result-target" tabindex="-1">${esc(mod.title)}</h1><p class="module-outcome"><b>CAPAIAN</b><span>${esc(mod.outcome)}</span></p><div class="module-source">${esc(mod.source)}</div>
      </header>
      <div class="module-toolbar"><div class="view-toggle" role="group" aria-label="Tampilan materi"><button class="${!quick ? 'active' : ''}" data-action="view-full">Materi lengkap</button><button class="${quick ? 'active' : ''}" data-action="view-cheat">Ringkasan ujian</button></div><button class="complete-button ${percent === 100 ? 'done' : ''}" data-action="complete-module" data-module="${mod.id}">${icon('check')}<span>${percent === 100 ? 'Tandai belum selesai' : 'Tandai modul selesai'}</span></button></div>
      ${quick ? `<section class="quick-sheet"><div class="quick-sheet-title"><div class="mono-label">RANGKUMAN SKS</div><h2>Yang perlu diingat.</h2><p>Inti materi ${mod.no} dalam poin ringkas.</p></div><ul class="quick-list">${mod.summary.map(item => `<li>${esc(item)}</li>`).join('')}</ul></section>` : `<section class="module-visuals" id="module-visuals"><div class="section-kicker">VISUALISASI & EKSPLORASI</div>${renderVisuals(mod)}</section>
      <section class="reading-content" aria-label="Materi lengkap">${mod.sections.map((section, i) => renderSection(mod, section, i)).join('')}</section>
      ${mod.references?.length ? `<details class="references"><summary>Rujukan materi · ${mod.references.length} sumber</summary><ol>${mod.references.map(item => `<li>${esc(item)}</li>`).join('')}</ol></details>` : ''}
      ${renderRecall(mod)}`}
    </article>`;
}

function renderSection(mod, section, i) {
  const key = `${mod.id}:${i}`;
  const done = state.read.has(key);
  return `<section class="content-section" id="${mod.id}-section-${i}">
    <header class="content-section-head"><div><span class="section-number">${mod.no}.${String(i + 1).padStart(2, '0')}</span><h2 id="${mod.id}-section-title-${i}" class="search-result-target" tabindex="-1">${esc(section.title)}</h2></div><span class="slides">SLIDE ${esc(section.slides)}</span></header>
    <p class="section-intro">${esc(section.intro)}</p>
    <div class="concept-list">${section.concepts.map((concept, conceptIndex) => `<div id="${mod.id}-concept-${i}-${conceptIndex}" class="concept-item search-result-target" tabindex="-1"><div class="concept-title"><h3>${esc(concept.name)}</h3><span>Konsep inti</span></div><div class="concept-body">${[
      ['Definisi inti', concept.definition, ''], ['Cara kerja / mekanisme', concept.mechanism, ''], ['Contoh nyata', concept.example, ''], ['Poin kunci ujian', concept.takeaway, 'takeaway']
    ].map(([label, text, cls]) => `<div class="concept-detail ${cls}"><strong>${label}</strong><p>${esc(text)}</p></div>`).join('')}</div></div>`).join('')}</div>
    ${section.matrix ? `<div class="table-scroll" role="region" aria-label="Tabel perbandingan bisnis konvensional dan digital" tabindex="0"><table class="compare-table"><thead><tr><th>Dimensi</th><th>Bisnis konvensional</th><th>Bisnis digital</th></tr></thead><tbody>${section.matrix.map((row, rowIndex) => `<tr id="${mod.id}-matrix-${i}-${rowIndex}" class="search-result-target" tabindex="-1">${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}
    ${section.exercise ? `<div id="${mod.id}-exercise-${i}" class="section-exercise search-result-target" tabindex="-1"><strong>Latihan dari materi</strong>${esc(section.exercise)}</div>` : ''}
    <div class="section-complete-line"><button class="mark-section ${done ? 'done' : ''}" data-action="mark-section" data-key="${key}">${done ? '✓ Selesai dibaca' : '+ Tandai selesai dibaca'}</button></div>
  </section>`;
}

function renderRecall(mod) {
  return `<section class="recall-section" id="recall"><div class="recall-head"><div><div class="eyebrow">ACTIVE RECALL · PERTEMUAN ${mod.no}</div><h2>Uji pemahaman</h2></div><p>Ingat kembali sebelum membuka jawaban.</p></div>
    <div class="flashcard-row">${mod.flashcards.map(([front, back], i) => {
      const flipped = Boolean(state.flash[`${mod.id}:${i}`]);
      return `<button id="search-flashcard-${mod.id}-${i}" class="flashcard search-result-target ${flipped ? 'flipped' : ''}" data-action="flashcard" data-index="${i}"><span class="flash-label">${flipped ? 'JAWABAN · KLIK UNTUK BALIK' : `FLASHCARD ${String(i + 1).padStart(2, '0')} · KLIK UNTUK BUKA`}</span><span class="flash-content">${esc(flipped ? back : front)}</span></button>`;
    }).join('')}</div>
    <div class="quiz-wrap"><div class="quiz-heading"><h3>Mini quiz</h3><span>${mod.quiz.length} SOAL · PILIHAN GANDA</span></div>${mod.quiz.map((item, qi) => {
      const answer = state.quiz[`${mod.id}:${qi}`];
      return `<div id="search-quiz-${mod.id}-${qi}" class="quiz-item search-result-target" tabindex="-1"><span class="quiz-num">${String(qi + 1).padStart(2, '0')}</span><div><p class="quiz-question">${esc(item.q)}</p><div class="quiz-options">${item.options.map((option, oi) => {
        const selected = answer === oi;
        const cls = selected ? (oi === item.answer ? 'selected-correct' : 'selected-wrong') : '';
        return `<button class="quiz-option ${cls}" data-action="quiz-answer" data-q="${qi}" data-option="${oi}"><span class="option-marker">${String.fromCharCode(65 + oi)}</span><span>${esc(option)}</span></button>`;
      }).join('')}</div>${answer !== undefined ? `<div class="quiz-feedback ${answer === item.answer ? 'correct' : 'incorrect'}"><strong>${answer === item.answer ? 'Tepat.' : `Belum tepat. Jawaban: ${String.fromCharCode(65 + item.answer)}.`}</strong> ${esc(item.why)}</div>` : ''}</div></div>`;
    }).join('')}</div></section>`;
}

const pill = (label, action, value, active) => `<button class="pill-button ${active ? 'active' : ''}" data-action="${action}" data-value="${esc(value)}">${esc(label)}</button>`;
const panelHead = (title, description, tag = 'INTERAKTIF') => `<div class="visual-panel-head"><div><h3>${title}</h3><p>${description}</p></div><span class="visual-label">${tag}</span></div>`;
const detailBox = (title, text, extra = '') => `<div class="detail-box"><strong>${esc(title)}</strong><p>${esc(text)}${extra}</p></div>`;

function renderVisuals(mod) {
  if (mod.id === 'm1') return renderM1();
  if (mod.id === 'm2') return renderM2();
  if (mod.id === 'm3') return renderM3();
  if (mod.id === 'm4') return renderM4();
  if (mod.id === 'm5') return renderM5();
  if (mod.id === 'm6') return renderM6();
  return '';
}

function renderM1() {
  const item = course[0].compare[state.ui.compareDim];
  const focusTraditional = state.ui.compareView === 'traditional';
  const node = course[0].conceptNodes.find(value => value.id === state.ui.conceptNode) || course[0].conceptNodes[0];
  return `<div class="visual-grid accent-terracotta">
    <section class="visual-panel">${panelHead('Bisnis konvensional vs digital', 'Pilih dimensi untuk melihat perbedaan langsung berdasarkan materi pertemuan.')}
      <div class="pill-row">${course[0].compare.map((dim, i) => pill(dim.label, 'compare-dim', i, Number(state.ui.compareDim) === i)).join('')}</div>
      <div class="pill-row" aria-label="Sorot sisi perbandingan">${pill('Tradisional', 'compare-view', 'traditional', focusTraditional)}${pill('Digital', 'compare-view', 'digital', !focusTraditional)}</div>
      <div class="table-scroll" role="region" aria-label="Perbandingan bisnis konvensional dan digital; geser tabel ke samping untuk melihat kolom lain" tabindex="0"><table class="compare-table"><thead><tr><th>Dimensi</th><th class="${focusTraditional ? 'is-focus' : ''}">Konvensional</th><th class="${!focusTraditional ? 'is-focus' : ''}">Digital</th></tr></thead><tbody>${course[0].compare.map((dim, i) => `<tr><td>${esc(dim.label)}</td><td class="${focusTraditional && i === Number(state.ui.compareDim) ? 'is-focus' : ''}">${esc(dim.traditional)}</td><td class="${!focusTraditional && i === Number(state.ui.compareDim) ? 'is-focus' : ''}">${esc(dim.digital)}</td></tr>`).join('')}</tbody></table></div>
      <div class="compare-insight"><strong>${esc(item.label)} · </strong>${esc(focusTraditional ? item.traditional : item.digital)} <span>— bisnis modern juga dapat bersifat hybrid.</span></div>
    </section>
    <section class="visual-panel">${panelHead('Peta konsep bisnis digital', 'Pilih node untuk menelusuri hubungan antarkomponen.')}
      <div class="concept-map">${course[0].conceptNodes.map(n => `<button class="map-node ${n.id === 'value' ? 'center' : ''} ${state.ui.conceptNode === n.id ? 'selected' : ''}" data-action="concept-node" data-value="${n.id}">${esc(n.label)}</button>`).join('')}</div>
      ${detailBox(node.label, node.detail)}
    </section>
  </div>`;
}

function renderM2() {
  const era = course[1].timeline[state.ui.timeline] || course[1].timeline[0];
  const web = course[1].webEras[state.ui.webEra] || course[1].webEras[0];
  const tech = course[1].technologies.find(item => item.id === state.ui.technology) || course[1].technologies[0];
  return `<div class="visual-grid accent-indigo">
    <section class="visual-panel span-2">${panelHead('Evolusi industri dan perkembangan web', 'Pilih satu era industri; di bawahnya jelajahi perubahan dari Web 1.0 sampai Web 5.0.')}
      <div class="timeline-track">${course[1].timeline.map((item, i) => `<button class="timeline-point ${i === Number(state.ui.timeline) ? 'active' : ''}" data-action="timeline" data-value="${i}"><i></i><strong>${esc(item.label)}</strong><span>${esc(item.period)}</span></button>`).join('')}</div>
      <div class="timeline-detail"><h4>${esc(era.title)}</h4><div class="detail-column"><strong>Teknologi pemicu</strong><p>${esc(era.tech)}</p></div><div class="detail-column"><strong>Perubahan lanskap bisnis</strong><p>${esc(era.impact)}</p></div></div>
      <div class="web-era-row">${course[1].webEras.map((item, i) => `<button class="web-era-button ${i === Number(state.ui.webEra) ? 'active' : ''}" data-action="web-era" data-value="${i}"><strong>${esc(item.label)}</strong>${esc(item.title)}</button>`).join('')}</div><div class="web-detail"><strong>${esc(web.period)} · ${esc(web.tech)}.</strong> ${esc(web.impact)}</div>
    </section>
    <section class="visual-panel span-2">${panelHead('Tech-impact explorer', 'Teknologi dalam materi dipilih untuk menelusuri dampak operasional dan contoh penerapannya.')}
      <div class="technology-grid">${course[1].technologies.map(item => `<button id="search-technology-${item.id}" class="technology-button search-result-target ${item.id === tech.id ? 'active' : ''}" data-action="technology" data-value="${item.id}"><strong>${esc(item.name)}</strong><span>${esc(item.tag)}</span></button>`).join('')}</div>
      <div class="impact-detail">${detailBox(`${tech.name} · Dampak bisnis`, tech.impact, `<p><strong>Contoh:</strong> ${esc(tech.example)}</p>`)}</div>
    </section>
  </div>`;
}

function renderM3() {
  const actor = course[2].actors.find(item => item.id === state.ui.actor) || course[2].actors[0];
  const activeConnections = new Set([actor.id, ...actor.connects]);
  const caseStudy = course[2].cases[state.ui.case] || course[2].cases[0];
  const effectSteps = ['Customer bertambah', 'Transaksi meningkat', 'Merchant tertarik bergabung', 'Pilihan produk bertambah', 'Customer semakin tertarik', 'Customer bertambah lagi'];
  return `<div class="visual-grid accent-emerald">
    <section class="visual-panel span-2">${panelHead('Arsitektur ekosistem digital', 'Klik atau arahkan fokus ke aktor untuk menyorot hubungan dan pertukaran nilainya.')}
      <div class="ecosystem-layout"><div class="ecosystem-map"><span class="eco-caption"></span>${course[2].actors.map(item => `<button id="search-actor-${item.id}" class="eco-node search-result-target ${item.id} ${state.ui.actor === item.id ? 'selected' : ''} ${activeConnections.has(item.id) ? 'connected' : ''}" data-action="actor" data-value="${item.id}">${esc(item.label)}</button>`).join('')}</div>
        <div class="eco-side">${detailBox(actor.label, actor.role)}<div class="visual-label">TERHUBUNG DENGAN</div><div class="pill-row">${actor.connects.map(id => `<span class="pill-button active">${esc(course[2].actors.find(a => a.id === id)?.label || id)}</span>`).join('')}</div></div></div>
      <div class="case-select-wrap" style="margin-top:14px"><label class="visual-label" for="ecosystem-case">TELUSURI STUDI KASUS</label><select class="case-select" id="ecosystem-case" data-action="case-select">${course[2].cases.map((item, i) => `<option value="${i}" ${Number(state.ui.case) === i ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select><div class="case-flow"><strong>${esc(caseStudy.actors)}</strong><br/><br/>${esc(caseStudy.flow)}</div></div>
    </section>
    <section class="visual-panel">${panelHead('Siklus network effect silang', 'Pilih tahap pada lingkaran pertumbuhan marketplace; tahap yang sama saling memperkuat.')}
      <div class="effect-loop">${effectSteps.map((step, i) => `<button class="effect-step ${Number(state.ui.effect) === i ? 'active' : ''}" data-action="effect-step" data-value="${i}">${esc(step)}</button>`).join('')}</div>
      <p class="effect-note">${Number(state.ui.effect) === 0 ? 'Pertumbuhan pengguna meningkatkan aktivitas, menarik merchant, menambah pilihan, lalu memperkuat daya tarik bagi pengguna berikutnya.' : `Tahap ${Number(state.ui.effect) + 1}: ${esc(effectSteps[Number(state.ui.effect)])}. Efek silang terjadi karena pertambahan satu kelompok menambah nilai bagi kelompok lainnya.`}</p>
    </section>
  </div>`;
}

function renderM4() {
  const step = course[3].roadmap[Number(state.ui.roadmap)] || course[3].roadmap[0];
  const mechanic = course[3].mechanics.find(item => item.id === state.ui.mechanic) || course[3].mechanics[0];
  const flows = {
    network: ['Pengguna', 'Transaksi / koneksi', 'Nilai jaringan meningkat', 'Pengguna tertarik'],
    marginal: ['Investasi / infrastruktur awal', 'Produk digital', 'Pengguna tambahan', 'Biaya marjinal rendah'],
    platform: ['Produsen / penyedia', 'Platform / pencocokan', 'Konsumen / pengguna', 'Pertukaran nilai'],
    data: ['Data aktivitas', 'Insight', 'Keputusan / personalisasi', 'Nilai bisnis'],
  }[mechanic.id];
  return `<div class="visual-grid accent-terracotta">
    <section class="visual-panel span-2">${panelHead('Entrepreneurship roadmap', 'Pilih satu tahap proses usaha untuk melihat tindakan dan bukti yang perlu dikumpulkan.')}
      <div class="roadmap">${course[3].roadmap.map((item, i) => `<button class="roadmap-step ${i === Number(state.ui.roadmap) ? 'active' : ''}" data-action="roadmap" data-value="${i}"><strong>${esc(item.label)}</strong></button>`).join('')}</div>
      <div class="roadmap-detail"><strong>${esc(step.label)}.</strong> ${esc(step.detail)}</div>
    </section>
    <section class="visual-panel span-2">${panelHead('Digital economy mechanics', 'Skema kualitatif untuk menelusuri mekanisme ekonomi digital; bukan data kuantitatif.')}
      <div class="pill-row">${course[3].mechanics.map(item => pill(item.label, 'mechanic', item.id, item.id === mechanic.id)).join('')}</div>
      <p class="mechanics-formula">${esc(mechanic.formula)}</p>
      <div class="flow-diagram">${flows.map((label, i) => `${i ? '<span class="flow-arrow">→</span>' : ''}<div class="flow-node ${i === 1 ? 'platform-node' : ''}">${esc(label)}</div>`).join('')}</div>
      ${detailBox(mechanic.label, mechanic.detail, `<p><strong>Contoh:</strong> ${esc(mechanic.example)}</p>`)}</section>
  </div>`;
}

function renderM5() {
  const models = course[4].businessModels;
  const chosen = models.find(item => item.id === state.ui.model) || models[0];
  const families = ['Semua', ...new Set(models.map(item => item.family))];
  const filtered = state.ui.modelFamily === 'Semua' ? models : models.filter(item => item.family === state.ui.modelFamily);
  return `<div class="visual-grid accent-indigo">
    <section class="visual-panel span-2">${panelHead('Business model blueprint', 'Filter model berdasarkan logika nilai, lalu pilih model untuk memetakan pelanggan dan monetisasinya.')}
      <div class="model-filter">${families.map(family => pill(family, 'model-family', family, family === state.ui.modelFamily)).join('')}</div>
       <div class="model-gallery">${filtered.map(item => `<button id="search-model-${item.id}" class="model-option search-result-target ${item.id === chosen.id ? 'active' : ''}" data-action="business-model" data-value="${item.id}"><span class="model-tag">${esc(item.family)}</span><strong>${esc(item.name)}</strong><span>${esc(item.example)}</span></button>`).join('')}</div>
    </section>
    <section class="visual-panel span-2">${panelHead(`Alur nilai & pendapatan · ${esc(chosen.name)}`, 'Alur produk/jasa dipisahkan dari alur pembayaran untuk melihat siapa menerima dan menangkap nilai.')}
      <div class="flow-diagram">${chosen.flow.map((label, i) => `${i ? '<span class="flow-arrow">→</span>' : ''}<div class="flow-node ${label.toLowerCase().includes('platform') ? 'platform-node' : ''}">${esc(label)}</div>`).join('')}</div>
      <div class="revenue-flow"><strong>Revenue stream →</strong> ${esc(chosen.revenue)}<br/><span>${esc(chosen.money)}</span></div>
      <div class="detail-box" style="margin-top:10px"><strong>Sumber nilai</strong><p>${esc(chosen.value)}. Contoh di materi: ${esc(chosen.example)}.</p></div>
    </section>
  </div>`;
}

function renderM6() {
  const blocks = course[5].bmc;
  const selected = blocks.find(item => item.id === state.ui.bmc) || blocks[0];
  const fit = course[5].fitMatrix.find(item => item.id === state.ui.fit) || course[5].fitMatrix[0];
  const caseNames = ['Ride-hailing', 'Lapangan olahraga online', 'Slide berjudul “Percetakan Online”'];
  const sportsCases = {
    segments: 'B2C: pemain futsal/padel kasual, kapten tim/komunitas, pemain solo. B2B: pemilik/pengelola arena futsal, klub padel, kompleks olahraga.',
    proposition: 'Pemain: jadwal pasti real-time, auto-split bill, open match, diskon jam sepi. Venue: isi off-peak, kurangi no-show dengan DP, dashboard kasir/lampu/jadwal.',
    channels: 'Aplikasi Android/iOS atau web; QR fisik di resepsionis arena; media sosial.',
    relationships: 'Self-service untuk booking/bayar/akses; komunitas online, grup matchmaking, leaderboard antar-tim.',
    revenue: 'Komisi transaksi; langganan B2B SaaS Venue Management System; convenience fee; slot iklan/sponsored match.',
    resources: 'Platform; payment gateway dan WhatsApp API notifikasi; database jadwal.',
    activities: 'Pengembangan aplikasi; akuisisi venue; pemasaran komunitas dan retensi pengguna.',
    partners: 'Pemilik/pengelola lapangan; Midtrans/Xendit/QRIS; server; komunitas dan asosiasi olahraga.',
    costs: 'Cloud/server; pemasaran, akuisisi pengguna dan promo; tim teknologi, sales/BD dan operasional.',
  };
  const caseDescription = Number(state.ui.bmcCase) === 1 ? (sportsCases[selected.id] || selected.case) : selected.case;
  const caseNote = Number(state.ui.bmcCase) === 2 ? 'Isi slide yang berjudul “Percetakan Online” tampak identik dengan isi contoh ride-hailing (driver, rider, matching, komisi order). Tidak ditambahkan detail percetakan yang tidak tercantum di materi.' : '';
  return `<div class="visual-grid accent-emerald">
    <section class="visual-panel span-2">${panelHead('Interactive 9-block Business Model Canvas', 'Klik blok untuk membuka pertanyaan analisis, indikator evaluasi, dan bukti studi kasus.')}
      <div class="bmc-case-select">${caseNames.map((name, i) => `<button class="pill-button ${Number(state.ui.bmcCase) === i ? 'active' : ''}" data-action="bmc-case" data-value="${i}">${esc(name)}</button>`).join('')}</div>
       <div class="bmc-layout"><div class="bmc-grid">${blocks.map((block, i) => `<button id="search-bmc-${block.id}" class="bmc-block search-result-target bmc-${block.id} ${block.id === selected.id ? 'selected' : ''}" data-action="bmc-block" data-value="${block.id}"><span class="bmc-index">0${i + 1}</span><strong>${esc(block.name)}</strong><span>${esc(block.short)}</span></button>`).join('')}</div>
        <aside class="bmc-detail"><div class="visual-label">BLOK TERPILIH</div><h4>${esc(selected.name)}</h4><p>${esc(selected.short)}</p><h5>Pertanyaan analisis</h5><ul>${selected.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ul><h5>Indikator evaluasi</h5><ul>${selected.indicators.map(q => `<li>${esc(q)}</li>`).join('')}</ul><div class="bmc-case-note"><strong>Simulasi studi kasus</strong><br/>${esc(caseDescription)}${caseNote ? `<br/><br/><em>${esc(caseNote)}</em>` : ''}</div></aside></div>
    </section>
    <section class="visual-panel span-2">${panelHead('Analytical framework · konsistensi dan fit', 'Kerangka analisis yang tersedia pada file pertemuan 6 adalah pemeriksaan konsistensi BMC dan kelayakan ekonomi.')}
      <div class="fit-layout"><div class="fit-list">${course[5].fitMatrix.map(item => `<button class="fit-button ${state.ui.fit === item.id ? 'active' : ''}" data-action="fit" data-value="${item.id}">${esc(item.label)}</button>`).join('')}</div>
      <div class="fit-detail"><div class="visual-label">UJI KONSISTENSI ANTARBLOK</div><h4>${esc(fit.label)}</h4><p>${esc(fit.question)}</p><strong>Bukti / indikator</strong><p>${esc(fit.evidence)}</p><strong>Yang perlu diperiksa</strong><p>${esc(fit.check)}</p></div></div>
      <p class="effect-note">Materi pertemuan 6 berfokus pada BMC; SWOT atau metode kompetitif lain tidak dicantumkan di file sumber ini.</p>
    </section>
  </div>`;
}

// Search indexes the source-derived teaching material, not only module headings.
const searchStopWords = new Set(['apa', 'yang', 'dan', 'di', 'ke', 'dari', 'dengan', 'untuk', 'dalam', 'adalah', 'itu', 'ini', 'bagaimana', 'tentang', 'pada', 'atau', 'pengertian', 'definisi', 'penjelasan', 'jelaskan', 'sebutkan', 'uraikan', 'gambarkan', 'perbedaan', 'antara', 'beberapa', 'aspek', 'peran']);
const searchSynonyms = {
  kewirausahaan: ['wirausaha', 'entrepreneurship'], wirausaha: ['kewirausahaan', 'entrepreneurship'], entrepreneurship: ['kewirausahaan', 'wirausaha'],
  inovasi: ['innovation'], innovation: ['inovasi'], pendapatan: ['revenue', 'penghasilan'], revenue: ['pendapatan', 'penghasilan'],
  pendanaan: ['funding', 'pembiayaan'], funding: ['pendanaan', 'pembiayaan'], pembiayaan: ['pendanaan', 'funding'],
  developer: ['pengembang'], pengembang: ['developer'], pemerintah: ['government'], government: ['pemerintah'],
};
const normalizeSearch = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('id').replace(/[^a-z0-9]+/g, ' ').trim();
const searchTerms = query => {
  const all = normalizeSearch(query).split(' ').filter(Boolean);
  const useful = all.filter(term => term.length > 1 && !searchStopWords.has(term));
  return useful.length ? useful : all;
};

function oneEditAway(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let left = 0, right = 0, differences = 0;
  while (left < a.length && right < b.length) {
    if (a[left] === b[right]) { left++; right++; continue; }
    if (++differences > 1) return false;
    if (a.length > b.length) left++;
    else if (b.length > a.length) right++;
    else { left++; right++; }
  }
  return differences + Number(left < a.length || right < b.length) <= 1;
}

function hasWordPrefix(words, prefix) {
  for (const word of words) if (word.startsWith(prefix)) return true;
  return false;
}

function prepareSearchItem(item) {
  const title = normalizeSearch(item.title);
  const text = normalizeSearch(item.text);
  const kind = normalizeSearch(item.kind);
  return { ...item, search: { title, text, kind, titleWords: title.split(' ').filter(Boolean), textWords: new Set(text.split(' ').filter(Boolean)), kindWords: new Set(kind.split(' ').filter(Boolean)) } };
}

function scoreSearchItem(item, phrase, terms) {
  const { title, text, kind, titleWords, textWords, kindWords } = item.search;
  let score = 0, titleMatches = 0, bodyMatches = 0, kindMatches = 0, matchedWeight = 0;

  if (title === phrase) score += 1400;
  else if (title.startsWith(phrase)) score += 900;
  else if (phrase.length > 2 && title.includes(phrase)) score += 650;
  if (phrase.length > 2 && text.includes(phrase)) score += 220;
  if (phrase.length > 2 && kind.includes(phrase)) score += 140;

  for (const term of terms) {
    const variants = [term, ...(searchSynonyms[term] || [])];
    const frequency = variants.reduce((sum, variant) => sum + (state.searchFrequency.get(variant) || 0), 0);
    const weight = Math.min(4, 1 + Math.log((state.searchItems.length + 1) / (frequency + 1)));
    if (variants.some(variant => titleWords.includes(variant))) { score += 115 * weight; titleMatches++; matchedWeight += weight; }
    else if (variants.some(variant => variant.length > 2 && titleWords.some(word => word.startsWith(variant)))) { score += 62 * weight; titleMatches++; matchedWeight += weight; }
    else if (variants.some(variant => textWords.has(variant))) { score += 25 * weight; bodyMatches++; matchedWeight += weight; }
    else if (variants.some(variant => variant.length > 3 && hasWordPrefix(textWords, variant))) { score += 12 * weight; bodyMatches++; matchedWeight += weight; }
    else if (variants.some(variant => kindWords.has(variant))) { score += 18 * weight; kindMatches++; matchedWeight += weight; }
    else if (term.length > 3 && titleWords.some(word => oneEditAway(term, word))) { score += 16 * weight; matchedWeight += weight; }
  }
  if (titleMatches === terms.length && terms.length) score += 26 * matchedWeight;
  else if (titleMatches + bodyMatches + kindMatches === terms.length && terms.length) score += 14 * matchedWeight;
  if (item.kind.startsWith('PERTEMUAN') && !terms.includes('pertemuan') && title !== phrase) score *= .68;
  return score;
}

function searchSnippet(text, query, limit = 145) {
  const value = String(text ?? '');
  const lower = value.toLocaleLowerCase('id');
  const positions = searchTerms(query).map(term => lower.indexOf(term)).filter(index => index >= 0);
  const matchAt = positions.length ? Math.min(...positions) : 0;
  const start = Math.max(0, Math.min(value.length - limit, matchAt - 42));
  const end = Math.min(value.length, start + limit);
  return `${start ? '…' : ''}${value.slice(start, end).trim()}${end < value.length ? '…' : ''}`;
}

function highlightSearchText(text, query) {
  const terms = [...new Set(searchTerms(query))].sort((a, b) => b.length - a.length);
  if (!terms.length) return esc(text);
  const matcher = new RegExp(`(${terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const source = String(text ?? '');
  let result = '', cursor = 0, match;
  while ((match = matcher.exec(source))) {
    result += `${esc(source.slice(cursor, match.index))}<mark>${esc(match[0])}</mark>`;
    cursor = match.index + match[0].length;
  }
  return result + esc(source.slice(cursor));
}

function buildSearchIndex() {
  const items = [];
  for (const mod of course) {
    items.push({ module: mod.id, section: null, target: `${mod.id}-module-title`, title: mod.title, text: `${mod.outcome} ${mod.source}`, kind: `PERTEMUAN ${mod.no}` });
    mod.sections.forEach((section, i) => {
      items.push({ module: mod.id, section: i, target: `${mod.id}-section-title-${i}`, title: section.title, text: section.intro, kind: `SUBBAB · SLIDE ${section.slides}` });
      section.concepts.forEach((concept, conceptIndex) => items.push({ module: mod.id, section: i, target: `${mod.id}-concept-${i}-${conceptIndex}`, title: concept.name, text: `${concept.definition} ${concept.mechanism} ${concept.example} ${concept.takeaway}`, kind: `KONSEP · PERTEMUAN ${mod.no}` }));
      section.matrix?.forEach((row, rowIndex) => items.push({ module: mod.id, section: i, target: `${mod.id}-matrix-${i}-${rowIndex}`, title: row[0], text: row.join(' '), kind: `TABEL · ${section.title}` }));
      if (section.exercise) items.push({ module: mod.id, section: i, target: `${mod.id}-exercise-${i}`, title: `Latihan: ${section.title}`, text: section.exercise, kind: 'LATIHAN MATERI' });
    });
    mod.flashcards.forEach(([front, back], i) => items.push({ module: mod.id, section: null, target: `search-flashcard-${mod.id}-${i}`, title: front, text: back, kind: `FLASHCARD · PERTEMUAN ${mod.no}` }));
    mod.quiz.forEach((item, i) => items.push({ module: mod.id, section: null, target: `search-quiz-${mod.id}-${i}`, title: item.q, text: `${item.options.join(' ')} ${item.why}`, kind: `KUIS · PERTEMUAN ${mod.no}` }));
    if (mod.businessModels) mod.businessModels.forEach(item => items.push({ module: mod.id, section: 1, target: `search-model-${item.id}`, uiState: { model: item.id, modelFamily: 'Semua' }, title: item.name, text: `${item.value} ${item.revenue} ${item.money} ${item.example}`, kind: 'MODEL BISNIS · 05' }));
    if (mod.actors) mod.actors.forEach(item => items.push({ module: mod.id, section: 1, target: `search-actor-${item.id}`, uiState: { actor: item.id }, title: item.label, text: item.role, kind: 'AKTOR EKOSISTEM · 03' }));
    if (mod.technologies) mod.technologies.forEach(item => items.push({ module: mod.id, section: 2, target: `search-technology-${item.id}`, uiState: { technology: item.id }, title: item.name, text: `${item.tag} ${item.impact} ${item.example}`, kind: 'TEKNOLOGI · 02' }));
    if (mod.bmc) mod.bmc.forEach(item => items.push({ module: mod.id, section: 1, target: `search-bmc-${item.id}`, uiState: { bmc: item.id }, title: item.name, text: `${item.short} ${item.questions.join(' ')} ${item.indicators.join(' ')}`, kind: 'BMC · 06' }));
  }
  return items;
}
state.searchItems = buildSearchIndex().map(prepareSearchItem);
state.searchFrequency = new Map();
for (const item of state.searchItems) {
  const words = new Set([...item.search.titleWords, ...item.search.textWords, ...item.search.kindWords]);
  for (const word of words) state.searchFrequency.set(word, (state.searchFrequency.get(word) || 0) + 1);
}

function showSearch() {
  overlay.classList.add('open'); overlay.setAttribute('aria-hidden', 'false');
  searchInput.value = ''; searchResults.innerHTML = '<p class="search-hint">Ketik untuk mencari di seluruh materi.</p>'; state.searchCursor = -1;
  requestAnimationFrame(() => searchInput.focus());
}
function hideSearch() { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden', 'true'); searchInput.blur(); }
function doSearch(query) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) { searchResults.innerHTML = '<p class="search-hint">Ketik untuk mencari di seluruh materi.</p>'; state.searchCursor = -1; return; }
  const terms = searchTerms(query);
  const phrase = terms.join(' ');
  const results = state.searchItems.map((item, order) => ({ item, order, score: scoreSearchItem(item, phrase, terms) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, 20);
  if (!results.length) { searchResults.innerHTML = '<p class="search-hint">Tidak ditemukan. Coba istilah lain, misalnya “network effect”, “cloud”, atau “revenue”.</p>'; state.searchCursor = -1; return; }
  searchResults.innerHTML = results.map(({ item }, i) => {
    const mod = course.find(m => m.id === item.module);
    const snippet = searchSnippet(item.text, query);
    return `<button class="search-result ${i === 0 ? 'active' : ''}" data-action="search-result" data-module="${mod.id}" data-section="${item.section ?? ''}" data-target="${esc(item.target)}" data-ui-state="${esc(JSON.stringify(item.uiState || {}))}" aria-label="${esc(`${item.title}, ${item.kind}`)}"><span class="result-number">${mod.no}</span><span class="result-text"><strong>${highlightSearchText(item.title, query)}</strong><span>${highlightSearchText(item.kind, query)} · ${highlightSearchText(snippet, query)}</span></span></button>`;
  }).join('');
  state.searchCursor = 0;
}

function updateNavAndDashboard() {
  renderNav();
  if (!state.active) renderDashboard();
  else if (currentModule()) {
    const headProgress = $('.module-head-top .visual-label');
    if (headProgress) headProgress.textContent = `${progressFor(currentModule())}% SELESAI DIBACA`;
    const complete = $('.complete-button');
    if (complete) {
      const percent = progressFor(currentModule());
      complete.classList.toggle('done', percent === 100);
      complete.innerHTML = `${icon('check')}<span>${percent === 100 ? 'Tandai belum selesai' : 'Tandai modul selesai'}</span>`;
    }
  }
}

function openModule(moduleId, section = null, targetId = null) {
  if (!course.some(mod => mod.id === moduleId)) return;
  clearTimeout(state.searchHighlightTimer);
  state.searchHighlightTimer = null;
  state.active = moduleId; state.cheat = false;
  renderNav(); setBreadcrumb(); renderModule();
  document.querySelectorAll('.side-home').forEach(el => el.classList.remove('active'));
  closeSidebar();
  if (targetId) {
    requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      if (!target) {
        if (section !== null && section !== '') document.getElementById(`${moduleId}-section-${section}`)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
        return;
      }
      target.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
      target.focus?.({ preventScroll: true });
      clearTimeout(state.searchHighlightTimer);
      document.querySelector('.search-result-target.search-result-hit')?.classList.remove('search-result-hit');
      target.classList.add('search-result-hit');
      state.searchHighlightTimer = setTimeout(() => target.classList.remove('search-result-hit'), 1450);
    });
  } else if (section !== null && section !== '') {
    requestAnimationFrame(() => document.getElementById(`${moduleId}-section-${section}`)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' }));
  } else window.scrollTo({ top: 0, behavior: scrollBehavior() });
}

function openDashboard() {
  state.active = null; state.cheat = false;
  document.querySelectorAll('.side-home').forEach(el => el.classList.add('active'));
  renderNav(); setBreadcrumb(); renderDashboard(); closeSidebar(); window.scrollTo({ top: 0, behavior: scrollBehavior() });
}

function updateVisuals() {
  const mod = currentModule();
  const root = $('#module-visuals');
  if (!mod || !root) return;
  root.innerHTML = `<div class="section-kicker">VISUALISASI & EKSPLORASI</div>${renderVisuals(mod)}`;
  if (!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches && root.animate) {
    root.getAnimations().forEach(animation => animation.cancel());
    root.animate([{ opacity: .76 }, { opacity: 1 }], { duration: 140, easing: 'cubic-bezier(.2, .8, .2, 1)' });
  }
}

function closeSidebar() {
  $('#sidebar').classList.remove('open'); $('#sidebar-scrim').classList.remove('open');
}
function toast(message) {
  const el = $('#toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 1700);
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'dashboard') { openDashboard(); return; }
  if (action === 'module') { openModule(button.dataset.module); return; }
  if (action === 'open-sidebar') { $('#sidebar').classList.add('open'); $('#sidebar-scrim').classList.add('open'); return; }
  if (action === 'close-sidebar') { closeSidebar(); return; }
  if (action === 'open-search') { showSearch(); return; }
  if (action === 'close-search') { hideSearch(); return; }
  if (action === 'theme') { state.theme = state.theme === 'light' ? 'dark' : 'light'; localStorage.setItem(themeKey, state.theme); applyTheme(); return; }
  if (action === 'view-full') { state.cheat = false; renderModule(); return; }
  if (action === 'view-cheat') { state.cheat = true; renderModule(); return; }
  if (action === 'mark-section') {
    const key = button.dataset.key;
    state.read.has(key) ? state.read.delete(key) : state.read.add(key);
    localStorage.setItem(readKey, JSON.stringify([...state.read]));
    button.classList.toggle('done', state.read.has(key));
    button.innerHTML = state.read.has(key) ? '✓ Selesai dibaca' : '+ Tandai selesai dibaca';
    updateNavAndDashboard(); return;
  }
  if (action === 'complete-module') {
    const mod = course.find(item => item.id === button.dataset.module);
    if (!mod) return;
    const allDone = progressFor(mod) === 100;
    mod.sections.forEach((_, i) => allDone ? state.read.delete(`${mod.id}:${i}`) : state.read.add(`${mod.id}:${i}`));
    localStorage.setItem(readKey, JSON.stringify([...state.read]));
    renderNav(); renderModule(); toast(allDone ? 'Progres modul diatur ulang.' : 'Modul ditandai selesai.'); return;
  }
  if (action === 'compare-dim') { state.ui.compareDim = Number(button.dataset.value); updateVisuals(); return; }
  if (action === 'compare-view') { state.ui.compareView = button.dataset.value; updateVisuals(); return; }
  if (action === 'concept-node') { state.ui.conceptNode = button.dataset.value; updateVisuals(); return; }
  if (action === 'timeline') { state.ui.timeline = Number(button.dataset.value); updateVisuals(); return; }
  if (action === 'web-era') { state.ui.webEra = Number(button.dataset.value); updateVisuals(); return; }
  if (action === 'technology') { state.ui.technology = button.dataset.value; updateVisuals(); return; }
  if (action === 'actor') { state.ui.actor = button.dataset.value; updateVisuals(); return; }
  if (action === 'effect-step') { state.ui.effect = Number(button.dataset.value); updateVisuals(); return; }
  if (action === 'roadmap') { state.ui.roadmap = Number(button.dataset.value); updateVisuals(); return; }
  if (action === 'mechanic') { state.ui.mechanic = button.dataset.value; updateVisuals(); return; }
  if (action === 'model-family') { state.ui.modelFamily = button.dataset.value; updateVisuals(); return; }
  if (action === 'business-model') { state.ui.model = button.dataset.value; updateVisuals(); return; }
  if (action === 'bmc-block') { state.ui.bmc = button.dataset.value; updateVisuals(); return; }
  if (action === 'bmc-case') { state.ui.bmcCase = Number(button.dataset.value); updateVisuals(); return; }
  if (action === 'fit') { state.ui.fit = button.dataset.value; updateVisuals(); return; }
  if (action === 'flashcard') {
    const key = `${state.active}:${button.dataset.index}`;
    state.flash[key] = !state.flash[key];
    const recall = $('#recall'); if (recall) recall.innerHTML = renderRecall(currentModule()).replace(/^<section[^>]*>|<\/section>$/g, '');
    return;
  }
  if (action === 'quiz-answer') {
    const key = `${state.active}:${button.dataset.q}`;
    state.quiz[key] = Number(button.dataset.option);
    const quizWrap = $('.quiz-wrap');
    if (quizWrap) {
      const mod = currentModule();
      const fresh = renderRecall(mod);
      const temp = document.createElement('div'); temp.innerHTML = fresh;
      const newQuiz = $('.quiz-wrap', temp); quizWrap.innerHTML = newQuiz.innerHTML;
    }
    return;
  }
  if (action === 'search-result') {
    const moduleId = button.dataset.module;
    const section = button.dataset.section;
    let uiState = {};
    try { uiState = JSON.parse(button.dataset.uiState || '{}'); } catch { /* Ignore malformed optional visual state. */ }
    Object.assign(state.ui, uiState);
    hideSearch(); openModule(moduleId, section === '' ? null : section, button.dataset.target); return;
  }
});

document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); showSearch(); return; }
  if (event.key === 'Escape') { hideSearch(); closeSidebar(); return; }
  if (event.key === 'Enter' && event.target.matches('.dashboard-module')) { openModule(event.target.dataset.module); }
  if (overlay.classList.contains('open') && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
    event.preventDefault();
    const list = [...searchResults.querySelectorAll('.search-result')];
    if (!list.length) return;
    state.searchCursor = (state.searchCursor + (event.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length;
    list.forEach((item, i) => item.classList.toggle('active', i === state.searchCursor));
    list[state.searchCursor].scrollIntoView({ block: 'nearest' });
  }
  if (overlay.classList.contains('open') && event.key === 'Enter') {
    const active = searchResults.querySelector('.search-result.active'); if (active) active.click();
  }
});
searchInput.addEventListener('input', event => doSearch(event.target.value));
document.addEventListener('change', event => {
  if (event.target.matches('[data-action="case-select"]')) {
    state.ui.case = Number(event.target.value);
    updateVisuals();
  }
});

applyTheme(); renderNav(); setBreadcrumb(); renderDashboard();
