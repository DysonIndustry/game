/**
 * Dyson Game Hub — Sound Effects
 * ---------------------------------------------------------------
 * Short, pleasant correct/wrong feedback tones generated with the
 * Web Audio API — no audio files needed, so the project stays a
 * single self-contained folder. Respects a mute preference stored
 * in localStorage and wires up any [data-sound-toggle] button.
 * ---------------------------------------------------------------
 */

const DysonSound = (() => {
  const KEY = "dgh_sound_muted";
  let ctx = null;

  function isMuted() {
    return localStorage.getItem(KEY) === "1";
  }

  function setMuted(muted) {
    localStorage.setItem(KEY, muted ? "1" : "0");
    syncToggleButtons();
  }

  function toggleMuted() {
    setMuted(!isMuted());
    return isMuted();
  }

  function getContext() {
    if (isMuted()) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, startTime, duration, gainPeak = 0.14, type = "sine") {
    const c = getContext();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainPeak, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  /** Cheerful two-note ascending "ding" for a correct answer. */
  function playCorrect() {
    const c = getContext();
    if (!c) return;
    const t = c.currentTime;
    tone(523.25, t, 0.16, 0.13, "sine");       // C5
    tone(783.99, t + 0.1, 0.22, 0.13, "sine"); // G5
  }

  /** Short, low double-buzz for a wrong answer — not harsh. */
  function playWrong() {
    const c = getContext();
    if (!c) return;
    const t = c.currentTime;
    tone(196.0, t, 0.16, 0.11, "triangle");        // G3
    tone(174.61, t + 0.13, 0.2, 0.11, "triangle"); // F3
  }

  /** Small upward blip used for game-created / success confirmations. */
  function playSuccessChime() {
    const c = getContext();
    if (!c) return;
    const t = c.currentTime;
    tone(659.25, t, 0.12, 0.1, "sine");
    tone(880.0, t + 0.09, 0.18, 0.1, "sine");
  }

  function syncToggleButtons() {
    document.querySelectorAll("[data-sound-toggle]").forEach((btn) => {
      const muted = isMuted();
      btn.textContent = muted ? "🔇" : "🔊";
      btn.setAttribute("aria-label", muted ? "Unmute sound effects" : "Mute sound effects");
      btn.setAttribute("aria-pressed", String(muted));
    });
  }

  function wireToggleButtons() {
    document.querySelectorAll("[data-sound-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => toggleMuted());
    });
    syncToggleButtons();
  }

  document.addEventListener("DOMContentLoaded", wireToggleButtons);

  return { isMuted, setMuted, toggleMuted, playCorrect, playWrong, playSuccessChime };
})();
