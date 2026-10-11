/**
 * GameHub — Supabase Configuration
 * ---------------------------------------------------------------
 * Replace the two values below with the ones from your own
 * Supabase project (Project Settings → API).
 *
 * SUPABASE_URL        → "Project URL"
 * SUPABASE_ANON_KEY    → "anon / public" key
 *
 * Never paste your "service_role" key here — that key must stay
 * on a server and should never appear in front-end JavaScript.
 * ---------------------------------------------------------------
 */

const SUPABASE_URL = "https://trmsgmsxudlfageybgqp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_61NAl3J-Y5Zy_zzywAhtBA_j2DhJrUz";

// Base path used to build shareable game links. Leave as "auto" and
// GameHub will detect it automatically from the current URL — this
// works both locally and once deployed to GitHub Pages.
const GAMEHUB_BASE_PATH = "auto";

// How many questions a "Who Knows Me Better?" creator can add.
const WKM_MIN_QUESTIONS = 10;
const WKM_MAX_QUESTIONS = 30;

// Flag GameHub checks to decide whether Supabase has been configured yet.
const SUPABASE_IS_CONFIGURED =
  typeof SUPABASE_URL === "string" &&
  SUPABASE_URL.startsWith("http") &&
  typeof SUPABASE_ANON_KEY === "string" &&
  SUPABASE_ANON_KEY.length > 20;
