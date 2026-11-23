/* ============================================================
   தமிழ் சுடர் — app logic
   Plain JavaScript. All content lives in stories.js.
   ============================================================ */

(() => {
  "use strict";

  const STORIES = window.STORIES || [];
  if (!STORIES.length) {
    console.error("No stories found. Check stories.js");
    return;
  }

  const KEYS = {
    bookmarks: "tamil-sudhar:bookmarks",
    progress: "tamil-sudhar:progress",
    theme: "tamil-sudhar:theme",
    language: "tamil-sudhar:language",
    largeText: "tamil-sudhar:large-text",
  };

  const $ = (id) => document.getElementById(id);
  const esc = (value) =>
    String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Private browsing / full storage — the app still works in memory. */
    }
  }

  const state = {
    query: "",
    category: "all",
    savedOnly: false,
    bookmarks: new Set(load(KEYS.bookmarks, [])),
    progress: load(KEYS.progress, {}),
    theme: load(KEYS.theme, "night") === "day" ? "day" : "night",
    language: load(KEYS.language, "ta"),
    largeText: load(KEYS.largeText, false) === true,
    current: null,
    lastFocused: null,
    activeLine: -1,
  };

  const grid = $("storyGrid");
  const filters = $("filters");
  const searchInput = $("searchInput");
  const reader = $("reader");
  const audio = $("audio");
  const storyText = $("storyText");
  const quizForm = $("quizForm");
  const scorePanel = $("scorePanel");
  const toastEl = $("toast");

  let toastTimer;

  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2200);
  }

  /* ---------------- Theme ---------------- */
  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    const use = $("themeBtn").querySelector("use");
    use.setAttribute("href", state.theme === "night" ? "#i-sun" : "#i-moon");
    $("themeBtn").setAttribute(
      "aria-label",
      state.theme === "night" ? "பகல் தோற்றத்திற்கு மாறு" : "இரவு தோற்றத்திற்கு மாறு"
    );
    document.querySelector('meta[name="theme-color"]').content =
      state.theme === "night" ? "#150e2e" : "#fff6ea";
  }

  $("themeBtn").addEventListener("click", () => {
    state.theme = state.theme === "night" ? "day" : "night";
    save(KEYS.theme, state.theme);
    applyTheme();
  });

  /* ---------------- Filters & grid ---------------- */
  function categories() {
    const seen = new Map();
    STORIES.forEach((s) => {
      if (!seen.has(s.category)) seen.set(s.category, s.categoryKey);
    });
    return [...seen].map(([label, key]) => ({ key, label }));
  }

  function renderFilters() {
    const options = [
      { key: "all", label: "அனைத்தும்" },
      { key: "saved", label: "⭐ சேமித்தவை" },
      ...categories(),
    ];
    filters.innerHTML = options
      .map(
        (o) => `<button type="button" class="filter-btn ${
          (o.key === "saved" && state.savedOnly) ||
          (o.key !== "saved" && !state.savedOnly && o.key === state.category)
            ? "is-active"
            : ""
        }" data-filter="${esc(o.key)}">${esc(o.label)}</button>`
      )
      .join("");
  }

  function visibleStories() {
    const q = state.query.trim().toLocaleLowerCase();
    return STORIES.filter((s) => {
      if (state.savedOnly && !state.bookmarks.has(s.id)) return false;
      if (!state.savedOnly && state.category !== "all" && s.categoryKey !== state.category)
        return false;
      if (!q) return true;
      const haystack = [
        s.title,
        s.titleEn,
        s.tag,
        s.category,
        s.tamil.join(" "),
      ]
        .join(" ")
        .toLocaleLowerCase();
      return haystack.includes(q);
    });
  }

  function renderGrid() {
    const list = visibleStories();
    grid.innerHTML = list
      .map((s, index) => {
        const saved = state.bookmarks.has(s.id);
        const done = state.progress[s.id] !== undefined;
        return `
          <article class="story-card" role="button" tabindex="0"
                   data-id="${s.id}" data-category="${esc(s.categoryKey)}"
                   style="animation-delay:${Math.min(index * 28, 400)}ms">
            <span class="sr-only">கதையைத் திறக்க</span>
            <div class="card-top">
              <span class="card-num">கதை ${String(s.id).padStart(2, "0")}</span>
              <button type="button" class="card-bookmark ${saved ? "is-saved" : ""}"
                      data-bookmark="${s.id}" aria-label="${saved ? "சேமிப்பை நீக்கு" : "கதையைச் சேமி"}"
                      title="${saved ? "சேமிப்பை நீக்கு" : "கதையைச் சேமி"}">
                <svg><use href="#i-bookmark"/></svg>
              </button>
            </div>
            <div class="card-glyph" aria-hidden="true">${esc(s.glyph)}</div>
            <h3>${esc(s.title)}</h3>
            <span class="card-tag">${esc(s.tag)}</span>
            <div class="card-foot">
              <span>${s.tamil.length} வரிகள் · ${s.quiz.length} வினாக்கள்</span>
              ${done ? '<span class="done"><svg><use href="#i-check"/></svg> படித்தது</span>' : ""}
            </div>
          </article>`;
      })
      .join("");

    $("emptyState").hidden = list.length > 0;
    renderFilters();
  }

  function updateStats() {
    const learned = Object.keys(state.progress).length;
    const percent = Math.round((learned / STORIES.length) * 100);
    $("learnedStat").textContent = learned;
    $("progressValue").textContent = `${percent}%`;
    document.querySelector(".progress-ring").style.setProperty("--p", `${percent}%`);

    const count = state.bookmarks.size;
    const badge = $("bookmarkCount");
    badge.textContent = count;
    badge.hidden = count === 0;
  }

  function toggleBookmark(id) {
    if (state.bookmarks.has(id)) {
      state.bookmarks.delete(id);
      toast("சேமிப்பிலிருந்து நீக்கப்பட்டது");
    } else {
      state.bookmarks.add(id);
      toast("⭐ கதை சேமிக்கப்பட்டது");
    }
    save(KEYS.bookmarks, [...state.bookmarks]);
    updateStats();
    renderGrid();
    if (state.current) syncReaderBookmark();
  }

  grid.addEventListener("click", (event) => {
    const bookmarkBtn = event.target.closest("[data-bookmark]");
    if (bookmarkBtn) {
      event.stopPropagation();
      toggleBookmark(Number(bookmarkBtn.dataset.bookmark));
      return;
    }
    const card = event.target.closest(".story-card");
    if (card) openStory(Number(card.dataset.id));
  });

  grid.addEventListener("keydown", (event) => {
    const card = event.target.closest(".story-card");
    if (!card || event.target.closest("[data-bookmark]")) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openStory(Number(card.dataset.id));
    }
  });

  filters.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-filter]");
    if (!btn) return;
    const key = btn.dataset.filter;
    if (key === "saved") {
      state.savedOnly = !state.savedOnly;
    } else {
      state.savedOnly = false;
      state.category = key;
    }
    renderGrid();
  });

  $("bookmarksBtn").addEventListener("click", () => {
    state.savedOnly = !state.savedOnly;
    $("bookmarksBtn").classList.toggle("is-active", state.savedOnly);
    renderGrid();
    $("library").scrollIntoView({ behavior: "smooth", block: "start" });
    if (state.savedOnly && state.bookmarks.size === 0)
      toast("இன்னும் எந்தக் கதையும் சேமிக்கப்படவில்லை");
  });

  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderGrid();
  });

  $("clearFilters").addEventListener("click", () => {
    state.query = "";
    state.category = "all";
    state.savedOnly = false;
    searchInput.value = "";
    $("bookmarksBtn").classList.remove("is-active");
    renderGrid();
  });

  $("browseBtn").addEventListener("click", () =>
    $("library").scrollIntoView({ behavior: "smooth", block: "start" })
  );

  $("surpriseBtn").addEventListener("click", () => {
    const pick = STORIES[Math.floor(Math.random() * STORIES.length)];
    openStory(pick.id);
  });

  /* ---------------- Reader ---------------- */
  function openStory(id) {
    const story = STORIES.find((s) => s.id === id);
    if (!story) return;

    state.lastFocused = document.activeElement;
    state.current = id;
    state.activeLine = -1;

    audio.pause();
    audio.src = story.audio;
    audio.load();

    $("readerNumber").textContent = `கதை ${String(id).padStart(2, "0")} · ${story.tag}`;
    $("readerTitle").textContent = story.title;
    $("readerGlyph").textContent = story.glyph;

    storyText.classList.toggle("is-large", state.largeText);
    setLanguage(state.language);
    renderQuiz(story);
    syncReaderBookmark();

    scorePanel.hidden = true;
    $("retryQuiz").hidden = true;
    $("checkAnswers").hidden = false;

    reader.hidden = false;
    document.body.classList.add("has-reader");
    $("readerBack").focus();

    const hash = `#story-${id}`;
    if (location.hash !== hash) history.replaceState(null, "", hash);
  }

  function closeStory() {
    if (reader.hidden) return;
    audio.pause();
    reader.hidden = true;
    document.body.classList.remove("has-reader");
    state.current = null;
    if (location.hash.startsWith("#story-"))
      history.replaceState(null, "", location.pathname + location.search);
    if (state.lastFocused && document.contains(state.lastFocused)) state.lastFocused.focus();
  }

  function syncReaderBookmark() {
    const saved = state.bookmarks.has(state.current);
    const btn = $("readerBookmark");
    btn.classList.toggle("is-active", saved);
    btn.setAttribute("aria-label", saved ? "சேமிப்பை நீக்கு" : "கதையைச் சேமி");
    btn.title = saved ? "சேமிப்பை நீக்கு" : "கதையைச் சேமி";
  }

  $("readerBookmark").addEventListener("click", () => {
    if (state.current) toggleBookmark(state.current);
  });
  $("readerBack").addEventListener("click", closeStory);
  document.querySelectorAll("[data-close-reader]").forEach((el) =>
    el.addEventListener("click", closeStory)
  );

  function stepStory(direction) {
    const index = STORIES.findIndex((s) => s.id === state.current);
    if (index === -1) return;
    const next = STORIES[(index + direction + STORIES.length) % STORIES.length];
    openStory(next.id);
    document.querySelector(".reader-content").scrollTo({ top: 0, behavior: "smooth" });
  }

  $("prevStory").addEventListener("click", () => stepStory(-1));
  $("nextStory").addEventListener("click", () => stepStory(1));

  /* ---------------- Bilingual text + audio follow-along ---------------- */
  function setLanguage(lang) {
    const story = STORIES.find((s) => s.id === state.current);
    if (!story) return;
    state.language = lang;
    save(KEYS.language, lang);

    document.querySelectorAll(".tab").forEach((tab) => {
      const active = tab.dataset.lang === lang;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });

    let html = "";
    if (lang === "ta" || lang === "both") {
      html += story.tamil
        .map((line, i) => `<p data-line="${i}">${esc(line)}</p>`)
        .join("");
    }
    if (lang === "both") {
      html += '<p class="line-divider">English translation</p>';
    }
    if (lang === "en" || lang === "both") {
      html += story.english
        .map((line, i) => `<p class="line-en" data-line="${i}">${esc(line)}</p>`)
        .join("");
    }
    storyText.innerHTML = html;
    state.activeLine = -1;
    highlightLine();
  }

  document.querySelectorAll(".tab").forEach((tab) =>
    tab.addEventListener("click", () => setLanguage(tab.dataset.lang))
  );

  $("textSizeBtn").addEventListener("click", () => {
    state.largeText = !state.largeText;
    save(KEYS.largeText, state.largeText);
    storyText.classList.toggle("is-large", state.largeText);
  });

  function highlightLine() {
    const lines = storyText.querySelectorAll("p[data-line]");
    if (!lines.length || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const ratio = audio.currentTime / audio.duration;
    const index = Math.min(lines.length - 1, Math.floor(ratio * lines.length));
    if (index === state.activeLine) return;
    if (state.activeLine >= 0 && lines[state.activeLine])
      lines[state.activeLine].classList.remove("is-active");
    lines[index].classList.add("is-active");
    state.activeLine = index;
  }

  audio.addEventListener("timeupdate", highlightLine);
  audio.addEventListener("seeked", highlightLine);
  audio.addEventListener("ended", () => {
    const lines = storyText.querySelectorAll("p[data-line]");
    lines.forEach((line) => line.classList.remove("is-active"));
    state.activeLine = -1;
  });

  /* ---------------- Quiz ---------------- */
  function renderQuiz(story) {
    $("quizQuestions").innerHTML = story.quiz
      .map(
        (question, qi) => `
        <div class="question" data-question="${qi}">
          <p class="question-prompt"><span class="question-num">${qi + 1}.</span>${esc(question.prompt)}</p>
          <div class="options">
            ${question.options
              .map(
                (option, oi) => `
                <label class="option">
                  <input type="radio" name="q${qi}" value="${oi}" data-correct="${option.correct}">
                  <span>${esc(option.text)}</span>
                </label>`
              )
              .join("")}
          </div>
        </div>`
      )
      .join("");
  }

  quizForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const story = STORIES.find((s) => s.id === state.current);
    if (!story) return;

    let correct = 0;
    const total = story.quiz.length;

    story.quiz.forEach((question, qi) => {
      const chosen = quizForm.querySelector(`input[name="q${qi}"]:checked`);
      if (chosen && chosen.dataset.correct === "true") correct += 1;
      const options = quizForm.querySelectorAll(`.question[data-question="${qi}"] .option`);
      options.forEach((label, oi) => {
        label.classList.remove("is-correct", "is-wrong");
        if (question.options[oi].correct) label.classList.add("is-correct");
        if (chosen && Number(chosen.value) === oi && !question.options[oi].correct)
          label.classList.add("is-wrong");
      });
      quizForm
        .querySelector(`.question[data-question="${qi}"] .options`)
        .classList.add("locked");
    });

    const message =
      correct === total
        ? "அருமை! நீங்கள் கதையை முழுமையாகப் புரிந்துகொண்டீர்கள்."
        : correct >= total / 2
        ? "நல்லது! இன்னும் சிறிது கவனித்தால் முழு மதிப்பெண் கிடைக்கும்."
        : "கதையை ஒருமுறை மீண்டும் கேட்டு முயற்சிக்கவும்.";

    scorePanel.innerHTML = `<strong>${correct} / ${total}</strong><p>${message}</p>`;
    scorePanel.hidden = false;
    $("checkAnswers").hidden = true;
    $("retryQuiz").hidden = false;

    const previous = state.progress[story.id] ?? -1;
    if (correct > previous) {
      state.progress[story.id] = correct;
      save(KEYS.progress, state.progress);
      updateStats();
      renderGrid();
    }
  });

  $("retryQuiz").addEventListener("click", () => {
    quizForm.reset();
    quizForm.querySelectorAll(".option").forEach((el) =>
      el.classList.remove("is-correct", "is-wrong")
    );
    quizForm.querySelectorAll(".options").forEach((el) => el.classList.remove("locked"));
    scorePanel.hidden = true;
    $("checkAnswers").hidden = false;
    $("retryQuiz").hidden = true;
  });

  /* ---------------- Keyboard & deep links ---------------- */
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !reader.hidden) {
      closeStory();
      return;
    }
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (event.key === "/" && !typing && reader.hidden) {
      event.preventDefault();
      searchInput.focus();
    }
  });

  function openFromHash() {
    const match = location.hash.match(/^#story-(\d+)$/);
    if (match) openStory(Number(match[1]));
  }
  window.addEventListener("hashchange", openFromHash);

  /* ---------------- Boot ---------------- */
  applyTheme();
  updateStats();
  renderGrid();
  openFromHash();
})();
