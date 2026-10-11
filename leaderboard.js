/**
 * GameHub — Leaderboard Rendering
 * ---------------------------------------------------------------
 * Renders per-game and global leaderboards from Supabase result
 * rows into the shared .leaderboard-list markup used across
 * results.html, leaderboard.html, and the "Who Knows Me?" flow.
 * ---------------------------------------------------------------
 */

const GameHubLeaderboard = (() => {
  function renderInto(containerEl, rows, { emptyMessage = "No results available yet." } = {}) {
    if (!containerEl) return;

    if (!rows || rows.length === 0) {
      containerEl.innerHTML = `
        <div class="state-box">
          <div class="state-box__icon">🏁</div>
          <h3>No scores yet</h3>
          <p>${GameHubApp.escapeHtml(emptyMessage)}</p>
        </div>`;
      return;
    }

    const sorted = [...rows].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.time_taken && b.time_taken) return a.time_taken - b.time_taken;
      return 0;
    });

    containerEl.innerHTML = `<div class="leaderboard-list">${sorted
      .map((row, i) => {
        const rank = i + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : "";
        return `
        <div class="lb-row ${rankClass}">
          <div class="lb-rank">${rank <= 3 ? GameHubApp.medal(rank) : rank}</div>
          <div class="lb-name">${GameHubApp.escapeHtml(row.player_name || "Player")}</div>
          <div class="lb-score">${row.score}/${row.total_questions} · ${row.percentage}%</div>
          <div class="lb-date">${GameHubApp.formatDate(row.created_at)}</div>
        </div>`;
      })
      .join("")}</div>`;
  }

  async function loadForGame(gameId, containerEl) {
    containerEl.innerHTML = `<div class="state-box"><div class="spinner"></div><p>Loading leaderboard…</p></div>`;
    const { data, error } = await GameHubDB.getLeaderboard(gameId);
    if (error) {
      containerEl.innerHTML = `<div class="state-box"><div class="state-box__icon">⚠️</div><h3>Couldn't load leaderboard</h3><p>${GameHubApp.escapeHtml(error.message)}</p></div>`;
      return;
    }
    renderInto(containerEl, data);
  }

  async function loadGlobal(containerEl) {
    containerEl.innerHTML = `<div class="state-box"><div class="spinner"></div><p>Loading global leaderboard…</p></div>`;
    const { data, error } = await GameHubDB.getGlobalLeaderboard();
    if (error) {
      containerEl.innerHTML = `<div class="state-box"><div class="state-box__icon">⚠️</div><h3>Couldn't load leaderboard</h3><p>${GameHubApp.escapeHtml(error.message)}</p></div>`;
      return;
    }
    renderInto(containerEl, data, { emptyMessage: "Be the first to set a score on GameHub!" });
  }

  return { renderInto, loadForGame, loadGlobal };
})();
