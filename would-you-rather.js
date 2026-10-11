/**
 * GameHub — "Would You Rather?" Game Logic
 * ---------------------------------------------------------------
 * A self-contained question bank (36 questions) plus the play
 * loop. Each answer is logged to Supabase's game_sessions table
 * so the community split (Option A % vs Option B %) can be shown.
 * ---------------------------------------------------------------
 */

const WouldYouRather = (() => {
  const QUESTIONS = [
    { a: "have unlimited free internet for life", b: "receive UGX 1,000,000 right now" },
    { a: "always have to sing instead of speaking", b: "always have to dance instead of walking" },
    { a: "be able to fly", b: "be able to turn invisible" },
    { a: "never use social media again", b: "never watch another movie or series again" },
    { a: "have super strength", b: "have super speed" },
    { a: "live without music", b: "live without your phone" },
    { a: "always be 10 minutes late", b: "always be 20 minutes early" },
    { a: "have to whisper for the rest of your life", b: "have to shout for the rest of your life" },
    { a: "read minds", b: "predict the future" },
    { a: "give up your favourite food forever", b: "give up your favourite show forever" },
    { a: "be famous for something embarrassing", b: "be unknown forever" },
    { a: "have free data forever", b: "have free transport forever" },
    { a: "know every language in the world", b: "be a master of every musical instrument" },
    { a: "live in a treehouse", b: "live on a houseboat" },
    { a: "never be able to text again", b: "never be able to call again" },
    { a: "always win at games but have no friends to play with", b: "always lose but always have friends to play with" },
    { a: "have a rewind button for life", b: "have a pause button for life" },
    { a: "be the funniest person in the room", b: "be the smartest person in the room" },
    { a: "have to eat the same meal every day", b: "never eat your favourite meal again" },
    { a: "explore outer space", b: "explore the deep ocean" },
    { a: "wake up every day at 4am", b: "sleep only 4 hours a night forever" },
    { a: "be able to talk to animals", b: "be able to speak every human language fluently" },
    { a: "lose your sense of smell", b: "lose your sense of taste" },
    { a: "have a personal chef", b: "have a personal driver" },
    { a: "live without hot showers", b: "live without air conditioning/fans" },
    { a: "never charge your phone below 50%", b: "never have your phone above 50%" },
    { a: "always have perfect hair", b: "always have perfectly ironed clothes" },
    { a: "get free WiFi everywhere", b: "get a free meal everywhere" },
    { a: "be able to skip Mondays forever", b: "have every week be a 4-day week" },
    { a: "have unlimited books", b: "have unlimited movies" },
    { a: "be the best dancer at every party", b: "be the funniest person at every party" },
    { a: "never have network issues on a call", b: "never have your data run out mid-download" },
    { a: "travel back in time 10 years", b: "travel forward in time 10 years" },
    { a: "have the power to freeze time", b: "have the power to teleport anywhere" },
    { a: "win a lifetime supply of your favourite drink", b: "win a lifetime supply of your favourite snack" },
    { a: "always know when someone is lying to you", b: "always be able to get away with a lie" },
  ];

  let currentIndex = 0;
  let order = [];

  function shuffledOrder(n) {
    const arr = Array.from({ length: n }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function init() {
    const root = document.getElementById("wyr-root");
    if (!root) return;
    order = shuffledOrder(QUESTIONS.length);
    currentIndex = 0;
    render(root);
  }

  function render(root) {
    const q = QUESTIONS[order[currentIndex]];
    root.innerHTML = `
      <div class="badge">Question ${currentIndex + 1} / ${QUESTIONS.length}</div>
      <h2 style="margin-top:14px;">Would you rather…</h2>
      <div class="wyr-options">
        <button class="wyr-option a" data-choice="a" type="button">
          <span class="pct-fill" style="width:0%"></span>
          <span class="opt-text">${GameHubApp.escapeHtml(q.a)}</span>
        </button>
        <div class="wyr-vs">OR</div>
        <button class="wyr-option b" data-choice="b" type="button">
          <span class="pct-fill" style="width:0%"></span>
          <span class="opt-text">${GameHubApp.escapeHtml(q.b)}</span>
        </button>
      </div>
      <div id="wyr-stats-note" class="hint" style="margin-top:16px;"></div>
      <button class="btn btn-secondary btn-block" id="wyr-next-btn" style="margin-top:22px;" disabled>Next question →</button>
    `;

    root.querySelectorAll(".wyr-option").forEach((btn) =>
      btn.addEventListener("click", () => handleChoice(btn.dataset.choice, q, root), { once: true })
    );

    document.getElementById("wyr-next-btn").addEventListener("click", () => {
      currentIndex++;
      if (currentIndex >= QUESTIONS.length) {
        root.innerHTML = `
          <div class="state-box">
            <div class="state-box__icon">🎉</div>
            <h3>That's every question!</h3>
            <p>Play again for a fresh shuffle, or share this game with friends.</p>
            <button class="btn btn-primary" id="wyr-restart">🔁 Play Again</button>
          </div>`;
        document.getElementById("wyr-restart").addEventListener("click", init);
      } else {
        render(root);
      }
    });
  }

  async function handleChoice(choice, q, root) {
    const key = `wyr-${q.a}-${q.b}`.slice(0, 120);
    root.querySelectorAll(".wyr-option").forEach((b) => (b.style.pointerEvents = "none"));

    GameHubDB.logSession({ gameType: "would-you-rather", questionKey: key, choice }).catch(() => {});

    const { data: stats } = await GameHubDB.getChoiceStats(key);
    const total = stats.a + stats.b || 1;
    const pctA = Math.round((stats.a / total) * 100);
    const pctB = 100 - pctA;

    root.querySelector('.wyr-option.a .pct-fill').style.width = pctA + "%";
    root.querySelector('.wyr-option.b .pct-fill').style.width = pctB + "%";
    root.querySelector('.wyr-option.a .opt-text').insertAdjacentHTML(
      "afterend",
      `<span class="pct-text">${pctA}%</span>`
    );
    root.querySelector('.wyr-option.b .opt-text').insertAdjacentHTML(
      "afterend",
      `<span class="pct-text">${pctB}%</span>`
    );

    root.querySelector(`.wyr-option.${choice}`).classList.add("is-picked");

    document.getElementById("wyr-stats-note").textContent =
      `${total} ${total === 1 ? "person has" : "people have"} answered this one.`;
    document.getElementById("wyr-next-btn").disabled = false;
  }

  return { init };
})();
