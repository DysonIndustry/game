/**
 * GameHub — Shared App Utilities
 * ---------------------------------------------------------------
 * Toasts, mobile nav, path helpers, small DOM helpers and the
 * homepage stats/game-grid wiring. Loaded on every page.
 * ---------------------------------------------------------------
 */

const GameHubApp = (() => {
  // ---------------- Toasts ----------------
  function ensureToastRegion() {
    let region = document.querySelector(".gh-toast-region");
    if (!region) {
      region = document.createElement("div");
      region.className = "gh-toast-region";
      region.setAttribute("role", "status");
      region.setAttribute("aria-live", "polite");
      document.body.appendChild(region);
    }
    return region;
  }

  function toast(message, type = "info", duration = 3200) {
    const region = ensureToastRegion();
    const el = document.createElement("div");
    el.className = `gh-toast ${type}`;
    el.textContent = message;
    region.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity .25s ease";
      setTimeout(() => el.remove(), 250);
    }, duration);
  }

  // ---------------- Mobile nav ----------------
  function initNav() {
    const btn = document.querySelector(".gh-nav__menu-btn");
    const menu = document.querySelector(".gh-mobile-menu");
    if (!btn || !menu) return;
    btn.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(isOpen));
    });
    menu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => menu.classList.remove("is-open"))
    );
  }

  // ---------------- Path helpers ----------------
  /** Root-relative base path so links work locally and on GitHub Pages subpaths. */
  function basePath() {
    // Every page lives in the same single folder, so the base is always "./".
    return "./";
  }

  function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  // ---------------- Config warning banner ----------------
  function warnIfSupabaseNotConfigured() {
    if (typeof SUPABASE_IS_CONFIGURED !== "undefined" && !SUPABASE_IS_CONFIGURED) {
      const bar = document.createElement("div");
      bar.style.cssText =
        "background:linear-gradient(90deg,#FFB020,#FF7A1A);color:#1b0d00;text-align:center;padding:10px 16px;font-size:.85rem;font-weight:700;";
      bar.textContent =
        "⚠ Supabase is not configured yet — edit config.js with your project URL and anon key.";
      document.body.prepend(bar);
    }
  }

  // ---------------- Formatting ----------------
  function formatNumber(n) {
    if (n === null || n === undefined) return "0";
    return n.toLocaleString();
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function formatTime(seconds) {
    if (seconds === null || seconds === undefined) return "--:--";
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  function medal(rank) {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  }

  // ---------------- Homepage: live stats + games grid interactions ----------------
  async function loadHomepageStats() {
    const el = document.getElementById("stats-region");
    if (!el) return;

    if (typeof SUPABASE_IS_CONFIGURED === "undefined" || !SUPABASE_IS_CONFIGURED) {
      el.innerHTML = statsMarkup(0, 0, 0, true);
      return;
    }

    el.innerHTML = `<div class="state-box" style="grid-column:1/-1;padding:20px;"><div class="spinner"></div><p>Loading live stats…</p></div>`;

    try {
      const { data, error } = await GameHubDB.getPlatformStats();
      if (error || !data) {
        el.innerHTML = statsMarkup(0, 0, 0, true);
        return;
      }
      el.innerHTML = statsMarkup(data.gamesPlayed, data.players, data.questionsAnswered, false);
    } catch (e) {
      el.innerHTML = statsMarkup(0, 0, 0, true);
    }
  }

  function statsMarkup(games, players, questions, unavailable) {
    const note = unavailable
      ? `<p class="text-center" style="grid-column:1/-1;color:var(--ink-500);font-size:.8rem;">Live stats appear here once Supabase is connected.</p>`
      : "";
    return `
      <div class="stat-card"><div class="stat-card__num">${formatNumber(games)}</div><div class="stat-card__label">Games Played</div></div>
      <div class="stat-card"><div class="stat-card__num">${formatNumber(players)}</div><div class="stat-card__label">Players</div></div>
      <div class="stat-card"><div class="stat-card__num">${formatNumber(questions)}</div><div class="stat-card__label">Questions Answered</div></div>
      ${note}
    `;
  }

  function initYear() {
    document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  function init() {
    initNav();
    initYear();
    warnIfSupabaseNotConfigured();
    loadHomepageStats();
  }

  document.addEventListener("DOMContentLoaded", init);

  return { toast, basePath, qs, formatNumber, formatDate, formatTime, escapeHtml, medal, loadHomepageStats };
})();
