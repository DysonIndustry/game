/**
 * GameHub — Lightweight Creator Identity
 * ---------------------------------------------------------------
 * GameHub avoids requiring email/password sign-up so anyone can
 * create and share a game instantly. Instead:
 *  - Supabase anonymous auth (if enabled on the project) gives the
 *    browser a real auth.uid() used by Row Level Security.
 *  - A friendly display name is kept in localStorage so the same
 *    person doesn't have to re-type it every visit.
 * ---------------------------------------------------------------
 */

const GameHubAuth = (() => {
  const NAME_KEY = "gh_display_name";

  function getDisplayName() {
    return localStorage.getItem(NAME_KEY) || "";
  }

  function setDisplayName(name) {
    localStorage.setItem(NAME_KEY, name.trim());
  }

  function getLastPlayerName() {
    return localStorage.getItem("gh_last_player_name") || "";
  }

  function setLastPlayerName(name) {
    localStorage.setItem("gh_last_player_name", name.trim());
  }

  async function init() {
    // Warms up the anonymous session as early as possible so game
    // creation / result saving never has to wait on it later.
    try {
      await GameHubDB.ensureSession();
    } catch (e) {
      /* Non-fatal: falls back to a local creator id. */
    }
  }

  document.addEventListener("DOMContentLoaded", init);

  return { getDisplayName, setDisplayName, getLastPlayerName, setLastPlayerName };
})();
