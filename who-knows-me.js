/**
 * Dyson Game Hub — "Who Knows Me Better?" Game Logic
 * ---------------------------------------------------------------
 * Powers two flows:
 *  1. create-game.html       — "Choose Your Questions" builder that
 *     lets the host pick from a 25-question ready-made bank (and/or
 *     add their own), choose the correct answer for each, and
 *     optionally change the picture shown on any answer option.
 *     Every bank option already comes with its own picture (see
 *     images.js), so quizzes are visual by default.
 *  2. play.html              — the player experience + scoring,
 *     including image-aware answer rendering and sound feedback.
 * Both talk to Supabase through GameHubDB.
 * ---------------------------------------------------------------
 */

const WhoKnowsMe = (() => {
  // ---------------- Ready-made question bank ----------------
  // The host picks the CORRECT answer for each of these when creating
  // a game — nothing here is pre-marked correct, so the same 25
  // questions work for literally anyone.
  const QUESTION_BANK = [
    { id: "b1", text: "What is my favorite color?", options: ["Blue", "Black", "Red", "White"] },
    { id: "b2", text: "What is my favorite food?", options: ["Chicken", "Pizza", "Rice", "Chips"] },
    { id: "b3", text: "What is my favorite drink?", options: ["Soda", "Juice", "Water", "Energy drink"] },
    { id: "b4", text: "What is my favorite music genre?", options: ["Afrobeats", "Hip-hop", "R&B", "Gospel"] },
    { id: "b5", text: "Who is my favorite music artist?", options: ["Burna Boy", "Drake", "Ayra Starr", "Chris Brown"] },
    { id: "b6", text: "What is my favorite movie genre?", options: ["Action", "Comedy", "Horror", "Romance"] },
    { id: "b7", text: "What is my favorite sport?", options: ["Football", "Basketball", "Volleyball", "Athletics"] },
    { id: "b8", text: "Which football team do I support?", options: ["Manchester United", "Arsenal", "Chelsea", "Liverpool"] },
    { id: "b9", text: "What is my favorite school subject?", options: ["Mathematics", "ICT", "Biology", "English"] },
    { id: "b10", text: "What do I enjoy doing most in my free time?", options: ["Gaming", "Watching movies", "Listening to music", "Coding"] },
    { id: "b11", text: "What is my biggest hobby?", options: ["Coding", "Football", "Photography", "Gaming"] },
    { id: "b12", text: "What type of games do I enjoy most?", options: ["Racing", "Football", "Adventure", "Strategy"] },
    { id: "b13", text: "What is my favorite social media platform?", options: ["WhatsApp", "Instagram", "TikTok", "Facebook"] },
    { id: "b14", text: "What time of day do I prefer?", options: ["Morning", "Afternoon", "Evening", "Night"] },
    { id: "b15", text: "What is something I cannot easily live without?", options: ["My phone", "Music", "Internet", "Friends"] },
    { id: "b16", text: "What kind of person am I?", options: ["Quiet", "Funny", "Adventurous", "Talkative"] },
    { id: "b17", text: "What annoys me the most?", options: ["Being ignored", "Being lied to", "Waiting", "Noise"] },
    { id: "b18", text: "What makes me happiest?", options: ["Music", "Success", "Spending time with friends", "Getting gifts"] },
    { id: "b19", text: "If I could travel anywhere, where would I choose?", options: ["Dubai", "USA", "UK", "South Africa"] },
    { id: "b20", text: "What would I rather receive?", options: ["Money", "A phone", "Clothes", "A memorable experience"] },
    { id: "b21", text: "Which would I choose for a free weekend?", options: ["Staying home", "Going out with friends", "Travelling", "Gaming"] },
    { id: "b22", text: "What is one thing I am most likely to do when I'm bored?", options: ["Use my phone", "Sleep", "Watch movies", "Listen to music"] },
    { id: "b23", text: "What kind of gift would I appreciate most?", options: ["Technology", "Clothes", "Food", "Something handmade"] },
    { id: "b24", text: "What is one goal I would really like to achieve?", options: ["Become successful", "Build a business", "Become a professional", "Travel the world"] },
    { id: "b25", text: "Who knows me better?", options: ["My best friend", "My sibling", "My classmate", "My partner"] },
  ];

  // selections: bankId -> { correctIndex: number|null, images: [file|url,…x4] }
  let selections = {};

  /** A fresh selection for a bank question, pre-filled with its pictures. */
  function newSelection(id) {
    const q = QUESTION_BANK.find((b) => b.id === id);
    return { correctIndex: null, images: GHImages.forOptions(q.options) };
  }

  /** Small rounded picture used inside rows and previews. */
  function thumb(src, alt) {
    if (!src) return "";
    return `<img class="opt-thumb" src="${GameHubApp.escapeHtml(GHImages.src(src))}" alt="${GameHubApp.escapeHtml(alt)}" loading="lazy" onerror="this.remove();">`;
  }
  // custom questions the host types in themselves (same shape as a saved question)
  let customQuestions = [];

  function initCreateForm() {
    const bankListEl = document.getElementById("wkm-bank-list");
    if (!bankListEl) return; // Not on this page.

    const searchInput = document.getElementById("wkm-bank-search");
    const selectedCountEl = document.getElementById("wkm-selected-count");
    const createBtn = document.getElementById("wkm-create-btn");
    const previewSection = document.getElementById("wkm-preview");
    const customForm = document.getElementById("wkm-custom-form");
    const customListEl = document.getElementById("wkm-custom-list");

    // ---------- Bank rendering ----------
    function renderBank(filterText = "") {
      const term = filterText.trim().toLowerCase();
      const visible = term ? QUESTION_BANK.filter((q) => q.text.toLowerCase().includes(term)) : QUESTION_BANK;

      bankListEl.innerHTML = visible
        .map((q) => {
          const sel = selections[q.id];
          const isChecked = !!sel;
          const peek = GHImages.forOptions(q.options)
            .map((f, i) => (f ? `<img src="${f}" alt="${GameHubApp.escapeHtml(q.options[i])}" loading="lazy">` : ""))
            .join("");
          return `
        <div class="card bank-card ${isChecked ? "is-selected" : ""}">
          <label class="flex items-center gap-12" style="cursor:pointer;">
            <input type="checkbox" data-select="${q.id}" ${isChecked ? "checked" : ""} style="width:20px;height:20px;flex-shrink:0;">
            <strong>${GameHubApp.escapeHtml(q.text)}</strong>
          </label>
          ${isChecked ? "" : `<div class="bank-card__peek" aria-hidden="true">${peek}</div>`}
          <div class="bank-options ${isChecked ? "" : "hidden"}">
            <p class="hint" style="margin-bottom:8px;">Tap the correct answer:</p>
            <div class="answer-list">
              ${q.options
                .map((opt, i) => {
                  const checked = sel && sel.correctIndex === i;
                  return `
                <label class="answer-btn ${checked ? "is-picked" : ""}" style="cursor:pointer;">
                  <input type="radio" name="correct-${q.id}" value="${i}" data-correct="${q.id}" ${checked ? "checked" : ""} style="width:18px;height:18px;">
                  ${thumb(sel && sel.images[i], opt)}
                  <span class="letter">${"ABCD"[i]}</span>${GameHubApp.escapeHtml(opt)}
                </label>`;
                })
                .join("")}
            </div>
            <button type="button" class="btn btn-ghost btn-sm" data-toggle-images="${q.id}" style="margin-top:10px;">🖼 Change pictures (optional)</button>
            <div class="wkm-image-fields hidden" data-images-for="${q.id}" style="margin-top:10px;">
              ${q.options
                .map(
                  (opt, i) => `
                <div class="field" style="margin-bottom:8px;">
                  <label style="font-weight:600;font-size:.82rem;">Picture for "${GameHubApp.escapeHtml(opt)}"</label>
                  <input type="text" data-image-input="${q.id}:${i}" placeholder="file name or https://… (leave empty for no picture)" value="${sel && sel.images[i] ? GameHubApp.escapeHtml(sel.images[i]) : ""}">
                </div>`
                )
                .join("")}
            </div>
          </div>
        </div>`;
        })
        .join("");

      wireBankEvents();
    }

    function wireBankEvents() {
      bankListEl.querySelectorAll("[data-select]").forEach((cb) =>
        cb.addEventListener("change", () => {
          const id = cb.dataset.select;
          if (cb.checked) {
            if (!selections[id]) selections[id] = newSelection(id);
          } else {
            delete selections[id];
          }
          renderBank(searchInput.value);
          updateCount();
        })
      );

      bankListEl.querySelectorAll("[data-correct]").forEach((radio) =>
        radio.addEventListener("change", () => {
          const id = radio.dataset.correct;
          if (selections[id]) selections[id].correctIndex = Number(radio.value);
          renderBank(searchInput.value);
        })
      );

      bankListEl.querySelectorAll("[data-toggle-images]").forEach((btn) =>
        btn.addEventListener("click", () => {
          const panel = bankListEl.querySelector(`[data-images-for="${btn.dataset.toggleImages}"]`);
          panel.classList.toggle("hidden");
        })
      );

      bankListEl.querySelectorAll("[data-image-input]").forEach((input) =>
        input.addEventListener("change", () => {
          const [id, idx] = input.dataset.imageInput.split(":");
          if (selections[id]) selections[id].images[Number(idx)] = input.value.trim() || null;
        })
      );
    }

    function updateCount() {
      const total = Object.keys(selections).length + customQuestions.length;
      selectedCountEl.textContent = `${total} / ${WKM_MAX_QUESTIONS} questions selected`;
      const ready = total >= WKM_MIN_QUESTIONS && total <= WKM_MAX_QUESTIONS;
      createBtn.disabled = !ready;
      createBtn.title = ready
        ? ""
        : total < WKM_MIN_QUESTIONS
        ? `Select at least ${WKM_MIN_QUESTIONS} questions to create your game`
        : `You can select up to ${WKM_MAX_QUESTIONS} questions`;
    }

    searchInput.addEventListener("input", () => renderBank(searchInput.value));

    document.getElementById("wkm-select-all-btn").addEventListener("click", () => {
      QUESTION_BANK.forEach((q) => {
        if (!selections[q.id]) selections[q.id] = newSelection(q.id);
      });
      renderBank(searchInput.value);
      updateCount();
    });

    document.getElementById("wkm-clear-all-btn").addEventListener("click", () => {
      selections = {};
      renderBank(searchInput.value);
      updateCount();
    });

    // ---------- Custom questions ----------
    function renderCustomList() {
      if (customQuestions.length === 0) {
        customListEl.innerHTML = "";
        return;
      }
      customListEl.innerHTML = customQuestions
        .map(
          (q, i) => `
        <div class="card" style="padding:14px 18px;margin-bottom:10px;">
          <div class="flex items-center" style="justify-content:space-between;">
            <strong>${GameHubApp.escapeHtml(q.text)}</strong>
            <button type="button" class="btn btn-ghost btn-sm" data-remove-custom="${i}" aria-label="Remove question">✕</button>
          </div>
          <p class="hint" style="margin:6px 0 0;">Correct answer: <strong style="color:var(--amber);">${GameHubApp.escapeHtml(q.options[q.correctIndex])}</strong></p>
        </div>`
        )
        .join("");
      customListEl.querySelectorAll("[data-remove-custom]").forEach((btn) =>
        btn.addEventListener("click", () => {
          customQuestions.splice(Number(btn.dataset.removeCustom), 1);
          renderCustomList();
          updateCount();
        })
      );
    }

    customForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const total = Object.keys(selections).length + customQuestions.length;
      if (total >= WKM_MAX_QUESTIONS) {
        GameHubApp.toast(`You can select up to ${WKM_MAX_QUESTIONS} questions in total.`, "error");
        return;
      }
      const text = customForm.qtext.value.trim();
      const options = [customForm.opt_a.value.trim(), customForm.opt_b.value.trim(), customForm.opt_c.value.trim(), customForm.opt_d.value.trim()];
      // Use the picture the host typed in; otherwise fall back to our library
      // (so an answer called "Pizza" automatically gets the pizza photo).
      const typed = [customForm.img_a, customForm.img_b, customForm.img_c, customForm.img_d].map((el) => el.value.trim() || null);
      const images = typed.map((v, i) => v || GHImages.forLabel(options[i]));
      const correctIndex = Number(customForm.correct.value);

      if (!text || options.some((o) => !o)) {
        GameHubApp.toast("Please fill in the question and all four answer choices.", "error");
        return;
      }

      customQuestions.push({ text, options, correctIndex, images });
      customForm.reset();
      renderCustomList();
      updateCount();
    });

    // ---------- Preview ----------
    document.getElementById("wkm-preview-btn").addEventListener("click", () => {
      const compiled = compileQuestions();
      if (!compiled) return;
      previewSection.classList.remove("hidden");
      previewSection.innerHTML = `
        <h3>Preview</h3>
        ${compiled
          .map(
            (q, i) => `<div class="card preview-card">
              <strong>Q${i + 1}. ${GameHubApp.escapeHtml(q.text)}</strong>
              <div class="answer-list" style="margin-top:10px;">
                ${q.options
                  .map(
                    (opt, oi) => `<div class="answer-btn is-static ${oi === q.correctIndex ? "is-picked" : ""}">
                        ${thumb(q.images[oi], opt)}<span class="letter">${"ABCD"[oi]}</span>${GameHubApp.escapeHtml(opt)}${oi === q.correctIndex ? " ✓" : ""}
                      </div>`
                  )
                  .join("")}
              </div>
            </div>`
          )
          .join("")}
      `;
      previewSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    function compileQuestions() {
      const fromBank = Object.entries(selections).map(([id, sel]) => {
        const bankQ = QUESTION_BANK.find((q) => q.id === id);
        return { text: bankQ.text, options: bankQ.options, correctIndex: sel.correctIndex, images: sel.images };
      });
      const all = [...fromBank, ...customQuestions];

      const missingAnswer = all.find((q) => q.correctIndex === null || q.correctIndex === undefined);
      if (missingAnswer) {
        GameHubApp.toast(`Please choose the correct answer for "${missingAnswer.text}".`, "error");
        return null;
      }
      if (all.length < WKM_MIN_QUESTIONS) {
        GameHubApp.toast(`Select at least ${WKM_MIN_QUESTIONS} questions first.`, "error");
        return null;
      }
      return all;
    }

    // ---------- Create game ----------
    createBtn.addEventListener("click", async () => {
      const creatorNameInput = document.getElementById("wkm-creator-name");
      const titleInput = document.getElementById("wkm-game-title");
      const creatorName = creatorNameInput.value.trim();
      const title = titleInput.value.trim();

      if (!creatorName || !title) {
        GameHubApp.toast("Please enter your name and a title for the game.", "error");
        return;
      }

      const compiled = compileQuestions();
      if (!compiled) return;

      createBtn.disabled = true;
      createBtn.textContent = "Creating game…";

      const { data: game, error } = await GameHubDB.createGame({ title, gameType: "who-knows-me", creatorName });

      if (error || !game) {
        GameHubApp.toast(error?.message || "Something went wrong creating your game.", "error");
        createBtn.disabled = false;
        createBtn.textContent = "🚀 Create Game";
        return;
      }

      const { error: qError } = await GameHubDB.saveQuestions(game.id, compiled);
      if (qError) {
        GameHubApp.toast("Game created, but questions failed to save: " + qError.message, "error");
        createBtn.disabled = false;
        createBtn.textContent = "🚀 Create Game";
        return;
      }

      GameHubAuth.setDisplayName(creatorName);
      DysonSound.playSuccessChime();
      GameHubApp.toast("Game created successfully!", "success");
      showResultPanel(game);
    });

    function showResultPanel(game) {
      const link = GameHubShare.buildShareLink("who-knows-me", game.share_code);
      document.getElementById("wkm-form-panel").classList.add("hidden");
      const resultPanel = document.getElementById("wkm-result-panel");
      resultPanel.classList.remove("hidden");
      resultPanel.innerHTML = `
        <div class="gamecode-display">
          <div class="label">Your game code</div>
          <div class="code">${game.share_code}</div>
        </div>
        <div class="share-link-box">
          <input type="text" readonly value="${link}" id="wkm-share-link" aria-label="Shareable link">
          <button class="btn btn-secondary btn-sm" id="wkm-copy-btn" type="button">Copy</button>
        </div>
        <div class="flex gap-12" style="flex-wrap:wrap;">
          <button class="btn btn-whatsapp btn-block" id="wkm-whatsapp-btn" type="button">💬 Share on WhatsApp</button>
        </div>
        <a href="${link}" class="btn btn-primary btn-block" style="margin-top:12px;">▶ Play It Yourself (as Host)</a>
        <a href="profile.html" class="btn btn-ghost btn-block" style="margin-top:6px;">Go to my dashboard</a>
      `;
      GameHubShare.wireCopyButton(document.getElementById("wkm-copy-btn"), () => link);
      document.getElementById("wkm-whatsapp-btn").addEventListener("click", () =>
        GameHubShare.shareOnWhatsapp("who-knows-me", link, game.creator_name)
      );
      resultPanel.scrollIntoView({ behavior: "smooth" });
    }

    renderBank();
    renderCustomList();
    updateCount();
  }

  // ---------------- Play flow ----------------
  let session = { game: null, questions: [], index: 0, score: 0, playerName: "", startedAt: 0, player: null };

  /** Tiny inline picture for rows that mix pictured and un-pictured answers. */
  function optionImageMarkup(url, altText) {
    return thumb(url, altText);
  }

  /** Big picture tile — used when every answer in the question has a picture. */
  function tileMarkup(opt, url, i) {
    return `<button class="answer-btn answer-tile" data-index="${i}" type="button">
      <img src="${GameHubApp.escapeHtml(GHImages.src(url))}" alt="" loading="lazy" onerror="this.remove();">
      <span class="answer-tile__label"><span class="letter">${"ABCD"[i]}</span>${GameHubApp.escapeHtml(opt)}</span>
    </button>`;
  }

  async function initPlay(game) {
    session.game = game;
    const introEl = document.getElementById("game-intro");
    const nameFormEl = document.getElementById("player-name-form");
    const quizEl = document.getElementById("quiz-area");

    introEl.innerHTML = `
      <div class="game-banner">
        <img src="pic-going-out-with-friends.webp" alt="">
        <div class="game-banner__text">
          <h1>🧠 Who Knows Me Better?</h1>
          <p>“${GameHubApp.escapeHtml(game.title)}” — created by <strong>${GameHubApp.escapeHtml(game.creator_name)}</strong></p>
        </div>
      </div>
    `;

    nameFormEl.classList.remove("hidden");
    const savedName = GameHubAuth.getLastPlayerName();
    if (savedName) nameFormEl.querySelector("#play-name-input").value = savedName;

    nameFormEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = nameFormEl.querySelector("#play-name-input").value.trim();
      if (!name) {
        GameHubApp.toast("Please enter your name to start.", "error");
        return;
      }
      GameHubAuth.setLastPlayerName(name);
      session.playerName = name;

      nameFormEl.classList.add("hidden");
      quizEl.classList.remove("hidden");
      quizEl.innerHTML = `<div class="state-box"><div class="spinner"></div><p>Loading questions…</p></div>`;

      const { data: questions, error } = await GameHubDB.getQuestions(game.id);
      if (error || !questions || questions.length === 0) {
        quizEl.innerHTML = `<div class="state-box"><div class="state-box__icon">⚠️</div><h3>Couldn't load this quiz</h3><p>${GameHubApp.escapeHtml(error?.message || "This game has no questions yet.")}</p></div>`;
        return;
      }

      const { data: player } = await GameHubDB.addPlayer(game.id, name);
      session.player = player;
      session.questions = questions;
      session.index = 0;
      session.score = 0;
      session.startedAt = Date.now();
      renderQuestion();
    });

    function renderQuestion() {
      const q = session.questions[session.index];
      const total = session.questions.length;
      const options = [q.option_a, q.option_b, q.option_c, q.option_d];
      const images = [q.option_a_image, q.option_b_image, q.option_c_image, q.option_d_image];
      const allPictured = images.every(Boolean);

      quizEl.innerHTML = `
        <div class="quiz-topbar">
          <span class="quiz-progress-label">Question ${session.index + 1} / ${total}</span>
          <span class="badge">Score: ${session.score}</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${(session.index / total) * 100}%"></div></div>
        <div class="question-card">
          <h2>${GameHubApp.escapeHtml(q.question_text)}</h2>
          <div class="${allPictured ? "answer-grid" : "answer-list"}" id="answer-list">
            ${options
              .map((opt, i) =>
                allPictured
                  ? tileMarkup(opt, images[i], i)
                  : `<button class="answer-btn" data-index="${i}" type="button">${optionImageMarkup(images[i], opt)}<span class="letter">${"ABCD"[i]}</span>${GameHubApp.escapeHtml(opt)}</button>`
              )
              .join("")}
          </div>
          <div id="feedback-slot"></div>
        </div>
      `;

      quizEl.querySelectorAll(".answer-btn").forEach((btn) =>
        btn.addEventListener("click", () => handleAnswer(Number(btn.dataset.index), q))
      );
    }

    function handleAnswer(chosenIndex, q) {
      const buttons = quizEl.querySelectorAll(".answer-btn");
      buttons.forEach((b) => (b.disabled = true));
      const correct = Number(q.correct_answer);
      const isCorrect = chosenIndex === correct;
      if (isCorrect) session.score++;

      buttons[correct].classList.add("is-correct");
      if (!isCorrect) buttons[chosenIndex].classList.add("is-wrong");

      if (isCorrect) DysonSound.playCorrect();
      else DysonSound.playWrong();

      const feedback = document.getElementById("feedback-slot");
      feedback.innerHTML = `<div class="feedback-banner ${isCorrect ? "correct" : "wrong"}">${
        isCorrect ? "✅ Correct!" : `❌ Not quite! Correct answer: ${GameHubApp.escapeHtml([q.option_a, q.option_b, q.option_c, q.option_d][correct])}`
      }</div>`;

      setTimeout(() => {
        session.index++;
        if (session.index < session.questions.length) {
          renderQuestion();
        } else {
          finishQuiz();
        }
      }, 1300);
    }

    async function finishQuiz() {
      const total = session.questions.length;
      const percentage = Math.round((session.score / total) * 100);
      const timeTaken = Math.round((Date.now() - session.startedAt) / 1000);

      quizEl.innerHTML = `<div class="state-box"><div class="spinner"></div><p>Saving your result…</p></div>`;

      const { error } = await GameHubDB.saveResult({
        gameId: session.game.id,
        playerId: session.player?.id,
        playerName: session.playerName,
        score: session.score,
        totalQuestions: total,
        timeTaken,
      });

      if (error) {
        GameHubApp.toast("Your score was calculated, but couldn't be saved: " + error.message, "error");
      }

      const link = GameHubShare.buildShareLink("who-knows-me", session.game.share_code);
      const isHostPlaying = session.playerName.trim().toLowerCase() === (session.game.creator_name || "").trim().toLowerCase();

      quizEl.innerHTML = `
        <div class="result-hero">
          <span class="emoji">🎉</span>
          <h2>Quiz Complete!</h2>
          <p>Your Score</p>
        </div>
        ${scoreRingMarkup(session.score, total, percentage)}
        <div class="result-stat-grid">
          <div class="stat-card"><div class="stat-card__num">${session.score}</div><div class="stat-card__label">Correct</div></div>
          <div class="stat-card"><div class="stat-card__num">${total - session.score}</div><div class="stat-card__label">Incorrect</div></div>
        </div>
        <div id="host-compare-slot"></div>
        <h3>Leaderboard</h3>
        <div id="wkm-leaderboard"></div>
        <div class="flex gap-12" style="flex-wrap:wrap;margin-top:20px;">
          <button class="btn btn-whatsapp btn-block" id="wkm-play-whatsapp">💬 Challenge friends on WhatsApp</button>
        </div>
      `;

      GameHubLeaderboard.loadForGame(session.game.id, document.getElementById("wkm-leaderboard"));
      renderHostComparison(isHostPlaying, percentage);

      document
        .getElementById("wkm-play-whatsapp")
        .addEventListener("click", () => GameHubShare.shareOnWhatsapp("who-knows-me", link, session.game.creator_name));
    }

    async function renderHostComparison(isHostPlaying, myPercentage) {
      const slot = document.getElementById("host-compare-slot");
      if (isHostPlaying) {
        slot.innerHTML = `<div class="card text-center" style="margin:18px 0;background:linear-gradient(135deg,rgba(143,91,242,.18),rgba(47,123,239,.14));"><strong>👑 You played as the host!</strong><p class="mb-0">Share your link so friends can try to beat your score.</p></div>`;
        return;
      }
      const { data: results } = await GameHubDB.getLeaderboard(session.game.id, 200);
      const hostRow = (results || []).find(
        (r) => (r.player_name || "").trim().toLowerCase() === (session.game.creator_name || "").trim().toLowerCase()
      );
      if (!hostRow) return;
      const diff = myPercentage - hostRow.percentage;
      const verdict =
        diff > 0 ? `🎉 You beat ${session.game.creator_name}!` : diff < 0 ? `${session.game.creator_name} scored higher.` : "It's a tie!";
      slot.innerHTML = `
        <div class="card text-center" style="margin:18px 0;">
          <strong>Host comparison</strong>
          <p class="mb-0">You: ${myPercentage}% · ${GameHubApp.escapeHtml(session.game.creator_name)}: ${hostRow.percentage}%<br>${verdict}</p>
        </div>`;
    }
  }

  function scoreRingMarkup(score, total, pct) {
    const circumference = 2 * Math.PI * 80;
    const offset = circumference - (pct / 100) * circumference;
    return `
      <div class="score-ring-wrap">
        <div class="score-ring">
          <svg viewBox="0 0 190 190">
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#FFB020"/><stop offset="55%" stop-color="#FF7A1A"/><stop offset="100%" stop-color="#D84BB8"/>
              </linearGradient>
            </defs>
            <circle class="track" cx="95" cy="95" r="80"></circle>
            <circle class="fill" cx="95" cy="95" r="80" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
          </svg>
          <div class="score-ring__label">
            <div class="score-ring__pct">${pct}%</div>
            <div class="score-ring__frac">${score} / ${total}</div>
          </div>
        </div>
      </div>`;
  }

  return { initCreateForm, initPlay, QUESTION_BANK };
})();
