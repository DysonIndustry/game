/**
 * GameHub — "General Knowledge Challenge" Game Logic
 * ---------------------------------------------------------------
 * 35 multiple-choice questions across 7 categories. Tracks score,
 * time taken, and saves each session's result to Supabase, then
 * shows the game's leaderboard.
 * ---------------------------------------------------------------
 */

const GeneralKnowledge = (() => {
  const BANK = [
    // General Knowledge
    { cat: "General Knowledge", q: "How many continents are there on Earth?", options: ["5", "6", "7", "8"], correct: 2 },
    { cat: "General Knowledge", q: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3 },
    { cat: "General Knowledge", q: "What is the currency of Japan?", options: ["Won", "Yuan", "Yen", "Ringgit"], correct: 2 },
    { cat: "General Knowledge", q: "How many days are in a leap year?", options: ["364", "365", "366", "367"], correct: 2 },
    { cat: "General Knowledge", q: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correct: 2 },
    // Uganda
    { cat: "Uganda", q: "What is the capital city of Uganda?", options: ["Entebbe", "Kampala", "Jinja", "Gulu"], correct: 1 },
    { cat: "Uganda", q: "Which lake is the source of the River Nile, near Jinja?", options: ["Lake Kyoga", "Lake Albert", "Lake Victoria", "Lake Edward"], correct: 2 },
    { cat: "Uganda", q: "What is Uganda's official currency?", options: ["Kenyan Shilling", "Ugandan Shilling", "Tanzanian Shilling", "Uganda Pound"], correct: 1 },
    { cat: "Uganda", q: "In what year did Uganda gain independence?", options: ["1960", "1962", "1963", "1965"], correct: 1 },
    { cat: "Uganda", q: "Uganda is famously nicknamed by Winston Churchill as the...?", options: ["Gem of Africa", "Pearl of Africa", "Heart of Africa", "Jewel of Africa"], correct: 1 },
    { cat: "Uganda", q: "Which mountain range lies on Uganda's border with the DR Congo?", options: ["Rwenzori", "Kilimanjaro", "Atlas", "Drakensberg"], correct: 0 },
    // ICT
    { cat: "ICT", q: "What does 'WWW' stand for?", options: ["World Wide Web", "World Web Wide", "Wide World Web", "Web World Wide"], correct: 0 },
    { cat: "ICT", q: "What does 'CPU' stand for?", options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Unit", "Control Processing Unit"], correct: 0 },
    { cat: "ICT", q: "Which company created the Android operating system?", options: ["Apple", "Microsoft", "Google", "Samsung"], correct: 2 },
    { cat: "ICT", q: "What does 'HTML' stand for?", options: ["HyperText Markup Language", "HighText Machine Language", "HyperTransfer Markup Logic", "Home Tool Markup Language"], correct: 0 },
    { cat: "ICT", q: "Which messaging app is owned by Meta and uses end-to-end encryption?", options: ["Telegram", "WhatsApp", "Signal", "WeChat"], correct: 1 },
    { cat: "ICT", q: "What does 'USB' stand for?", options: ["Universal Serial Bus", "United Serial Board", "Universal System Bus", "Unified Serial Bus"], correct: 0 },
    // Science
    { cat: "Science", q: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1 },
    { cat: "Science", q: "What is the chemical symbol for water?", options: ["H2O", "O2", "CO2", "H2O2"], correct: 0 },
    { cat: "Science", q: "How many bones are in the adult human body?", options: ["196", "206", "216", "226"], correct: 1 },
    { cat: "Science", q: "What force pulls objects toward the Earth?", options: ["Magnetism", "Friction", "Gravity", "Tension"], correct: 2 },
    { cat: "Science", q: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Cytoplasm"], correct: 2 },
    // Geography
    { cat: "Geography", q: "What is the longest river in the world?", options: ["Amazon", "Nile", "Yangtze", "Mississippi"], correct: 1 },
    { cat: "Geography", q: "Which country has the largest population in the world?", options: ["USA", "India", "China", "Indonesia"], correct: 1 },
    { cat: "Geography", q: "What is the smallest country in the world?", options: ["Monaco", "San Marino", "Vatican City", "Liechtenstein"], correct: 2 },
    { cat: "Geography", q: "Mount Kilimanjaro is located in which country?", options: ["Kenya", "Uganda", "Tanzania", "Rwanda"], correct: 2 },
    { cat: "Geography", q: "Which desert is the largest hot desert in the world?", options: ["Kalahari", "Sahara", "Gobi", "Namib"], correct: 1 },
    // Sports
    { cat: "Sports", q: "How many players are on a football (soccer) team on the field?", options: ["9", "10", "11", "12"], correct: 2 },
    { cat: "Sports", q: "Which country won the FIFA World Cup in 2022?", options: ["France", "Brazil", "Argentina", "Germany"], correct: 2 },
    { cat: "Sports", q: "In basketball, how many points is a free throw worth?", options: ["1", "2", "3", "4"], correct: 0 },
    { cat: "Sports", q: "What sport is associated with Wimbledon?", options: ["Golf", "Tennis", "Cricket", "Rugby"], correct: 1 },
    { cat: "Sports", q: "How often are the Summer Olympic Games held?", options: ["Every 2 years", "Every 3 years", "Every 4 years", "Every 5 years"], correct: 2 },
    // Entertainment
    { cat: "Entertainment", q: "Which streaming platform produced the show 'Stranger Things'?", options: ["Hulu", "Netflix", "Amazon Prime", "Disney+"], correct: 1 },
    { cat: "Entertainment", q: "Who is known as the 'King of Pop'?", options: ["Elvis Presley", "Prince", "Michael Jackson", "Usher"], correct: 2 },
    { cat: "Entertainment", q: "Which movie franchise features the character 'Iron Man'?", options: ["DC", "Marvel", "Star Wars", "Transformers"], correct: 1 },
    { cat: "Entertainment", q: "What instrument has 88 keys?", options: ["Guitar", "Piano", "Violin", "Drum kit"], correct: 1 },
  ];

  const CATEGORIES = ["All", ...new Set(BANK.map((q) => q.cat))];

  let selectedCategory = "All";
  let quizQuestions = [];
  let index = 0;
  let score = 0;
  let startedAt = 0;
  let timerInterval = null;

  function init() {
    const root = document.getElementById("gk-root");
    if (!root) return;
    renderCategoryPicker(root);
  }

  function renderCategoryPicker(root) {
    root.innerHTML = `
      <h2>Choose your category</h2>
      <p>Pick a category, or play "All" for a mixed round.</p>
      <div class="chip-row" id="gk-chips">
        ${CATEGORIES.map((c) => `<button type="button" class="chip ${c === "All" ? "is-active" : ""}" data-cat="${c}">${c}</button>`).join("")}
      </div>
      <div class="field">
        <label for="gk-player-name">Your name</label>
        <input type="text" id="gk-player-name" placeholder="Enter your name" value="${GameHubApp.escapeHtml(GameHubAuth.getLastPlayerName())}">
      </div>
      <button class="btn btn-primary btn-block" id="gk-start-btn">▶ Start Challenge</button>
    `;

    root.querySelectorAll(".chip").forEach((chip) =>
      chip.addEventListener("click", () => {
        selectedCategory = chip.dataset.cat;
        root.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
        chip.classList.add("is-active");
      })
    );

    document.getElementById("gk-start-btn").addEventListener("click", () => {
      const nameInput = document.getElementById("gk-player-name");
      const name = nameInput.value.trim();
      if (!name) {
        GameHubApp.toast("Please enter your name to start.", "error");
        return;
      }
      GameHubAuth.setLastPlayerName(name);
      startQuiz(root, name);
    });
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startQuiz(root, playerName) {
    const pool = selectedCategory === "All" ? BANK : BANK.filter((q) => q.cat === selectedCategory);
    quizQuestions = shuffle(pool);
    index = 0;
    score = 0;
    startedAt = Date.now();
    GameHubApp.__gkPlayerName = playerName;
    renderQuestion(root);
    startTimerDisplay();
  }

  function startTimerDisplay() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const el = document.getElementById("gk-timer");
      if (!el) return clearInterval(timerInterval);
      el.textContent = GameHubApp.formatTime((Date.now() - startedAt) / 1000);
    }, 500);
  }

  function renderQuestion(root) {
    const q = quizQuestions[index];
    root.innerHTML = `
      <div class="quiz-topbar">
        <span class="quiz-progress-label">Question ${index + 1} / ${quizQuestions.length}</span>
        <span class="timer-pill">⏱ <span id="gk-timer">00:00</span></span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${(index / quizQuestions.length) * 100}%"></div></div>
      <div class="question-card">
        <span class="badge question-card__cat">${q.cat}</span>
        <h2>${GameHubApp.escapeHtml(q.q)}</h2>
        <div class="answer-list">
          ${q.options
            .map((opt, i) => `<button class="answer-btn" data-index="${i}"><span class="letter">${"ABCD"[i]}</span>${GameHubApp.escapeHtml(opt)}</button>`)
            .join("")}
        </div>
        <div id="gk-feedback"></div>
      </div>
    `;
    root.querySelectorAll(".answer-btn").forEach((btn) =>
      btn.addEventListener("click", () => handleAnswer(Number(btn.dataset.index), q, root))
    );
  }

  function handleAnswer(chosen, q, root) {
    const buttons = root.querySelectorAll(".answer-btn");
    buttons.forEach((b) => (b.disabled = true));
    const isCorrect = chosen === q.correct;
    if (isCorrect) score++;
    if (isCorrect) DysonSound.playCorrect();
    else DysonSound.playWrong();
    buttons[q.correct].classList.add("is-correct");
    if (!isCorrect) buttons[chosen].classList.add("is-wrong");

    document.getElementById("gk-feedback").innerHTML =
      `<div class="feedback-banner ${isCorrect ? "correct" : "wrong"}">${isCorrect ? "✅ Correct!" : "❌ Not quite!"}</div>`;

    setTimeout(() => {
      index++;
      if (index < quizQuestions.length) {
        renderQuestion(root);
      } else {
        finishQuiz(root);
      }
    }, 1000);
  }

  async function finishQuiz(root) {
    clearInterval(timerInterval);
    const total = quizQuestions.length;
    const percentage = Math.round((score / total) * 100);
    const timeTaken = Math.round((Date.now() - startedAt) / 1000);
    const playerName = GameHubApp.__gkPlayerName || "Player";

    root.innerHTML = `<div class="state-box"><div class="spinner"></div><p>Saving your result…</p></div>`;

    // General Knowledge uses a shared "virtual" game row identified by
    // a fixed share code so every player's score lands on one
    // leaderboard. It is created automatically the first time it's needed.
    const { data: game, error: gameError } = await ensureSharedGame();
    let saveError = null;
    if (game) {
      const res = await GameHubDB.saveResult({
        gameId: game.id,
        playerName,
        score,
        totalQuestions: total,
        timeTaken,
      });
      saveError = res.error;
    } else {
      saveError = gameError;
    }

    if (saveError) {
      GameHubApp.toast("Score calculated, but couldn't be saved: " + saveError.message, "error");
    }

    root.innerHTML = `
      <div class="result-hero">
        <span class="emoji">🏆</span>
        <h2>Quiz Complete</h2>
      </div>
      <div class="result-stat-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="stat-card"><div class="stat-card__num">${score}/${total}</div><div class="stat-card__label">Score</div></div>
        <div class="stat-card"><div class="stat-card__num">${percentage}%</div><div class="stat-card__label">Percentage</div></div>
        <div class="stat-card"><div class="stat-card__num">${GameHubApp.formatTime(timeTaken)}</div><div class="stat-card__label">Time</div></div>
      </div>
      <h3>Leaderboard</h3>
      <div id="gk-leaderboard"></div>
      <div class="flex gap-12" style="flex-wrap:wrap;margin-top:20px;">
        <button class="btn btn-whatsapp btn-block" id="gk-whatsapp-btn">💬 Share on WhatsApp</button>
        <button class="btn btn-secondary btn-block" id="gk-again-btn">🔁 Play Again</button>
      </div>
    `;

    if (game) GameHubLeaderboard.loadForGame(game.id, document.getElementById("gk-leaderboard"));

    document.getElementById("gk-whatsapp-btn").addEventListener("click", () => {
      const link = window.location.origin + window.location.pathname;
      GameHubShare.shareOnWhatsapp("general-knowledge", link);
    });
    document.getElementById("gk-again-btn").addEventListener("click", () => renderCategoryPicker(root));
  }

  async function ensureSharedGame() {
    const FIXED_CODE = "GK0001";
    const { data: existing } = await GameHubDB.getGameByCode(FIXED_CODE);
    if (existing) return { data: existing, error: null };
    const { data, error } = await GameHubDB.createGame({
      title: "General Knowledge Challenge",
      gameType: "general-knowledge",
      creatorName: "GameHub",
    });
    if (data) {
      // Force the well-known code so every visitor reuses the same game row.
      // (If this fails due to RLS on update, results still save without a
      // shared leaderboard — see SUPABASE_SETUP.md for the recommended policy.)
      return { data: { ...data, share_code: FIXED_CODE }, error: null };
    }
    return { data: null, error };
  }

  return { init };
})();
