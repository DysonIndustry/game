/**
 * GameHub — "Truth or Dare" Game Logic
 * ---------------------------------------------------------------
 * Safe-for-school prompt banks (30 truths + 30 dares) with a
 * "random" mode. Every prompt shown is logged to game_sessions
 * for basic analytics (no personal data attached).
 * ---------------------------------------------------------------
 */

const TruthOrDare = (() => {
  const TRUTHS = [
    "What's the most embarrassing thing that's ever happened to you at school?",
    "Who was your first crush?",
    "What's a lie you told your parents and got away with?",
    "What's your most used emoji and why?",
    "What's the weirdest thing you've ever eaten?",
    "If you could swap lives with anyone for a day, who would it be?",
    "What's a talent you have that no one knows about?",
    "What's the last thing you searched on your phone?",
    "What's your biggest fear?",
    "Who in this group would you trust with a secret?",
    "What's the most trouble you've ever been in?",
    "What's a habit you wish you could break?",
    "What's the cringiest thing you've posted online?",
    "What's your guilty pleasure song?",
    "Have you ever pretended to be sick to skip something?",
    "What's the nicest thing anyone has ever done for you?",
    "What's one thing you'd change about yourself?",
    "What's your most irrational fear?",
    "What's the longest you've gone without showering?",
    "Who is the last person you stalked on social media?",
    "What's a rumor you've heard about yourself?",
    "What's your worst habit in public?",
    "What app do you spend the most time on?",
    "What's the most childish thing you still do?",
    "If you had to describe yourself in 3 words, what would they be?",
    "What's the most awkward date or hangout you've had?",
    "What's something you've never told your best friend?",
    "What's your go-to excuse for being late?",
    "What's the weirdest dream you've ever had?",
    "Who do you text the most and why?",
  ];

  const DARES = [
    "Do your best dance move for 15 seconds.",
    "Talk in an accent for the next two rounds.",
    "Let the group choose your new WhatsApp status for a day.",
    "Send a funny selfie to the last person you texted.",
    "Do 10 push-ups (or jumping jacks) right now.",
    "Sing the chorus of your favourite song out loud.",
    "Try to lick your elbow.",
    "Speak only in questions for the next 3 minutes.",
    "Do your best impression of a teacher or boss.",
    "Let someone else post one word as your status.",
    "Attempt to say a tongue twister 5 times fast.",
    "Show the group your camera roll's most recent photo.",
    "Act like your favourite animal for 20 seconds.",
    "Give a 30-second motivational speech about socks.",
    "Try to juggle two random objects nearby.",
    "Do your best superhero pose and hold it for 10 seconds.",
    "Text a friend 'I just won a trophy!' with no explanation.",
    "Balance a spoon on your nose for 10 seconds.",
    "Do an impression of someone in the room.",
    "Say the alphabet backwards as fast as you can.",
    "Let the group pick your profile picture for the next hour.",
    "Do a silly walk across the room.",
    "Make up a 10-second commercial for a random object near you.",
    "Try to whistle a full tune.",
    "Do your best robot dance for 15 seconds.",
    "Hold a plank for 20 seconds.",
    "Speak in rhymes for the next two turns.",
    "Draw a self-portrait in 30 seconds with your eyes closed.",
    "Pretend to be a news reporter and describe the room.",
    "Do 5 star jumps while saying the days of the week.",
  ];

  let mode = null; // 'truth' | 'dare' | 'random'
  let usedTruths = [];
  let usedDares = [];

  function pickFrom(list, used) {
    if (used.length >= list.length) used.length = 0; // reshuffle pool once exhausted
    let idx;
    do {
      idx = Math.floor(Math.random() * list.length);
    } while (used.includes(idx));
    used.push(idx);
    return list[idx];
  }

  function init() {
    const root = document.getElementById("tod-root");
    if (!root) return;
    renderChooser(root);
  }

  function renderChooser(root) {
    root.innerHTML = `
      <div class="tod-choices">
        <button class="tod-choice truth" data-mode="truth" type="button">💬<br>TRUTH</button>
        <button class="tod-choice dare" data-mode="dare" type="button">🔥<br>DARE</button>
        <button class="tod-choice random" data-mode="random" type="button">🎲<br>RANDOM</button>
      </div>
      <div id="tod-card-slot">
        <div class="state-box">
          <div class="state-box__icon">🎉</div>
          <h3>Pick a mode to start</h3>
          <p>Tap Truth, Dare, or Random above.</p>
        </div>
      </div>
    `;
    root.querySelectorAll(".tod-choice").forEach((btn) =>
      btn.addEventListener("click", () => {
        mode = btn.dataset.mode;
        root.querySelectorAll(".tod-choice").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        showPrompt(root);
      })
    );
  }

  function showPrompt(root) {
    const chosenType = mode === "random" ? (Math.random() < 0.5 ? "truth" : "dare") : mode;
    const prompt =
      chosenType === "truth" ? pickFrom(TRUTHS, usedTruths) : pickFrom(DARES, usedDares);

    GameHubDB.logSession({
      gameType: "truth-or-dare",
      category: chosenType,
      questionKey: prompt.slice(0, 60),
      choice: chosenType,
    }).catch(() => {});

    const slot = document.getElementById("tod-card-slot");
    slot.innerHTML = `
      <span class="tod-tag badge ${chosenType === "truth" ? "" : "badge-gold"}">${chosenType === "truth" ? "💬 TRUTH" : "🔥 DARE"}</span>
      <div class="tod-card is-${chosenType}">${GameHubApp.escapeHtml(prompt)}</div>
      <button class="btn btn-primary btn-block" id="tod-next-btn" style="margin-top:20px;">Next →</button>
    `;
    document.getElementById("tod-next-btn").addEventListener("click", () => showPrompt(root));
  }

  return { init };
})();
