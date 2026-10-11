/**
 * GameHub — Supabase Client & Data Layer
 * ---------------------------------------------------------------
 * Wraps the Supabase JS client (loaded from CDN in each HTML page)
 * and exposes small, promise-based helper functions used by every
 * game module. Every function returns { data, error } so callers
 * can show clean loading / success / error states.
 * ---------------------------------------------------------------
 */

const GameHubDB = (() => {
  let client = null;
  let anonReady = null;

  function getClient() {
    if (!SUPABASE_IS_CONFIGURED) return null;
    if (!client && window.supabase) {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return client;
  }

  /**
   * Makes sure the current browser has a Supabase session (anonymous
   * sign-in). This gives every visitor a stable auth.uid() that Row
   * Level Security policies use to know "which games are mine".
   */
  async function ensureSession() {
    const sb = getClient();
    if (!sb) return null;
    if (anonReady) return anonReady;

    anonReady = (async () => {
      const { data: sessionData } = await sb.auth.getSession();
      if (sessionData && sessionData.session) return sessionData.session;
      const { data, error } = await sb.auth.signInAnonymously();
      if (error) {
        console.warn("Anonymous sign-in unavailable:", error.message);
        return null;
      }
      return data.session;
    })();

    return anonReady;
  }

  function generateGameCode(length = 6) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
    let out = "";
    for (let i = 0; i < length; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }

  async function getOrCreateLocalCreatorId() {
    let id = localStorage.getItem("gh_creator_id");
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
      localStorage.setItem("gh_creator_id", id);
    }
    return id;
  }

  /** Resolves the id used as "creator_id" on rows this browser creates. */
  async function currentCreatorId() {
    const session = await ensureSession();
    if (session && session.user) return session.user.id;
    return getOrCreateLocalCreatorId();
  }

  // ---------------- Games ----------------

  async function createGame({ title, gameType, creatorName }) {
    const sb = getClient();
    if (!sb) return { data: null, error: { message: "Supabase is not configured yet." } };
    const creatorId = await currentCreatorId();
    let code = generateGameCode();

    const { data, error } = await sb
      .from("games")
      .insert([{ title, game_type: gameType, creator_id: creatorId, creator_name: creatorName, share_code: code }])
      .select()
      .single();

    return { data, error };
  }

  async function getGameByCode(code) {
    const sb = getClient();
    if (!sb) return { data: null, error: { message: "Supabase is not configured yet." } };
    const { data, error } = await sb
      .from("games")
      .select("*")
      .eq("share_code", code.trim().toUpperCase())
      .maybeSingle();
    return { data, error };
  }

  async function getGameById(id) {
    const sb = getClient();
    if (!sb) return { data: null, error: { message: "Supabase is not configured yet." } };
    const { data, error } = await sb.from("games").select("*").eq("id", id).maybeSingle();
    return { data, error };
  }

  async function getMyGames() {
    const sb = getClient();
    if (!sb) return { data: [], error: { message: "Supabase is not configured yet." } };
    const creatorId = await currentCreatorId();
    const { data, error } = await sb
      .from("games")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });
    return { data: data || [], error };
  }

  async function deleteGame(gameId) {
    const sb = getClient();
    if (!sb) return { error: { message: "Supabase is not configured yet." } };
    const { error } = await sb.from("games").delete().eq("id", gameId);
    return { error };
  }

  // ---------------- Questions (Who Knows Me Better?) ----------------

  async function saveQuestions(gameId, questions) {
    const sb = getClient();
    if (!sb) return { error: { message: "Supabase is not configured yet." } };
    const rows = questions.map((q, idx) => ({
      game_id: gameId,
      question_text: q.text,
      option_a: q.options[0],
      option_b: q.options[1],
      option_c: q.options[2],
      option_d: q.options[3],
      option_a_image: (q.images && q.images[0]) || null,
      option_b_image: (q.images && q.images[1]) || null,
      option_c_image: (q.images && q.images[2]) || null,
      option_d_image: (q.images && q.images[3]) || null,
      correct_answer: q.correctIndex, // 0-3
      question_order: idx + 1,
    }));
    const { error } = await sb.from("questions").insert(rows);
    return { error };
  }

  async function getQuestions(gameId) {
    const sb = getClient();
    if (!sb) return { data: [], error: { message: "Supabase is not configured yet." } };
    const { data, error } = await sb
      .from("questions")
      .select("*")
      .eq("game_id", gameId)
      .order("question_order", { ascending: true });
    return { data: data || [], error };
  }

  // ---------------- Players & Results ----------------

  async function addPlayer(gameId, playerName) {
    const sb = getClient();
    if (!sb) return { data: null, error: { message: "Supabase is not configured yet." } };
    const { data, error } = await sb
      .from("players")
      .insert([{ game_id: gameId, player_name: playerName }])
      .select()
      .single();
    return { data, error };
  }

  async function saveResult({ gameId, playerId, playerName, score, totalQuestions, timeTaken }) {
    const sb = getClient();
    if (!sb) return { data: null, error: { message: "Supabase is not configured yet." } };
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const { data, error } = await sb
      .from("results")
      .insert([{
        game_id: gameId,
        player_id: playerId,
        player_name: playerName,
        score,
        total_questions: totalQuestions,
        percentage,
        time_taken: timeTaken || null,
      }])
      .select()
      .single();
    return { data, error };
  }

  async function getLeaderboard(gameId, limit = 20) {
    const sb = getClient();
    if (!sb) return { data: [], error: { message: "Supabase is not configured yet." } };
    const { data, error } = await sb
      .from("results")
      .select("*")
      .eq("game_id", gameId)
      .order("score", { ascending: false })
      .order("time_taken", { ascending: true, nullsFirst: false })
      .limit(limit);
    return { data: data || [], error };
  }

  async function getGlobalLeaderboard(limit = 20) {
    const sb = getClient();
    if (!sb) return { data: [], error: { message: "Supabase is not configured yet." } };
    const { data, error } = await sb
      .from("results")
      .select("*")
      .order("percentage", { ascending: false })
      .order("score", { ascending: false })
      .limit(limit);
    return { data: data || [], error };
  }

  // ---------------- Game sessions (Would You Rather, Truth or Dare, GK) ----------------

  async function logSession({ gameType, category, questionKey, choice }) {
    const sb = getClient();
    if (!sb) return { error: { message: "Supabase is not configured yet." } };
    const { error } = await sb.from("game_sessions").insert([{
      game_type: gameType,
      category: category || null,
      question_key: questionKey,
      choice: choice,
    }]);
    return { error };
  }

  async function getChoiceStats(questionKey) {
    const sb = getClient();
    if (!sb) return { data: { a: 0, b: 0 }, error: { message: "Supabase is not configured yet." } };
    const { data, error } = await sb
      .from("game_sessions")
      .select("choice")
      .eq("question_key", questionKey);
    if (error) return { data: { a: 0, b: 0 }, error };
    const a = (data || []).filter((r) => r.choice === "a").length;
    const b = (data || []).filter((r) => r.choice === "b").length;
    return { data: { a, b }, error: null };
  }

  // ---------------- Homepage stats ----------------

  async function getPlatformStats() {
    const sb = getClient();
    if (!sb) return { data: null, error: { message: "Supabase is not configured yet." } };

    const [gamesRes, resultsRes, sessionsRes] = await Promise.all([
      sb.from("games").select("id", { count: "exact", head: true }),
      sb.from("results").select("id, total_questions", { count: "exact" }),
      sb.from("game_sessions").select("id", { count: "exact", head: true }),
    ]);

    const gamesPlayed = (resultsRes.data ? resultsRes.data.length : resultsRes.count) || 0;
    const questionsAnswered =
      (resultsRes.data || []).reduce((sum, r) => sum + (r.total_questions || 0), 0) +
      (sessionsRes.count || 0);

    // Distinct players estimated from players + result rows (best-effort, no PII exposed).
    const playersRes = await sb.from("players").select("id", { count: "exact", head: true });

    return {
      data: {
        gamesPlayed: (gamesRes.count || 0) + gamesPlayed,
        players: playersRes.count || 0,
        questionsAnswered,
      },
      error: null,
    };
  }

  return {
    getClient,
    ensureSession,
    currentCreatorId,
    generateGameCode,
    createGame,
    getGameByCode,
    getGameById,
    getMyGames,
    deleteGame,
    saveQuestions,
    getQuestions,
    addPlayer,
    saveResult,
    getLeaderboard,
    getGlobalLeaderboard,
    logSession,
    getChoiceStats,
    getPlatformStats,
  };
})();
