/**
 * GameHub — WhatsApp Sharing Helpers
 * ---------------------------------------------------------------
 * Builds shareable game links (relative to wherever the site is
 * hosted, including a GitHub Pages sub-path), a WhatsApp "wa.me"
 * share URL, and a copy-to-clipboard helper with a graceful
 * fallback for browsers/contexts without Clipboard API access.
 * ---------------------------------------------------------------
 */

const GameHubShare = (() => {
  /** Builds an absolute shareable link to play.html?game=CODE. */
  function buildShareLink(gameType, code) {
    const origin = window.location.origin;
    const path = window.location.pathname;
    // All files live in one folder, so the deployment root is simply the
    // folder the current page is in (works locally and on GitHub Pages).
    const rootPath = path.substring(0, path.lastIndexOf("/") + 1);
    return `${origin}${rootPath}play.html?game=${encodeURIComponent(code)}&type=${encodeURIComponent(gameType)}`;
  }

  const MESSAGES = {
    "who-knows-me": (link, creator) =>
      `I created a "Who Knows Me Better?" challenge${creator ? ` — ${creator}'s edition` : ""}! 🧠 Think you know me? Prove it 👀\n${link}`,
    "would-you-rather": (link) =>
      `Let's play Would You Rather on GameHub! 🤔 Pick a side 👇\n${link}`,
    "truth-or-dare": (link) =>
      `Truth or Dare time 🔥 Think you're brave enough?\n${link}`,
    "general-knowledge": (link) =>
      `I just took the GameHub General Knowledge Challenge 🏆 Beat my score if you can!\n${link}`,
  };

  function buildWhatsappUrl(gameType, link, creatorName) {
    const builder = MESSAGES[gameType] || ((l) => `Play this on GameHub! 🎮\n${l}`);
    const text = builder(link, creatorName);
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  function shareOnWhatsapp(gameType, link, creatorName) {
    const url = buildWhatsappUrl(gameType, link, creatorName);
    window.open(url, "_blank", "noopener");
  }

  async function copyLink(link) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
        return true;
      }
      throw new Error("Clipboard API unavailable");
    } catch (e) {
      // Fallback: temporary textarea + execCommand for older/insecure contexts.
      try {
        const ta = document.createElement("textarea");
        ta.value = link;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch (e2) {
        return false;
      }
    }
  }

  /** Wires up a "Copy link" button + hidden/visible input pair. */
  function wireCopyButton(buttonEl, getLink) {
    if (!buttonEl) return;
    buttonEl.addEventListener("click", async () => {
      const ok = await copyLink(getLink());
      if (ok) {
        const original = buttonEl.textContent;
        buttonEl.textContent = "✓ Copied!";
        GameHubApp.toast("Link copied to clipboard.", "success");
        setTimeout(() => (buttonEl.textContent = original), 1800);
      } else {
        GameHubApp.toast("Couldn't copy automatically — please select and copy the link manually.", "error");
      }
    });
  }

  return { buildShareLink, buildWhatsappUrl, shareOnWhatsapp, copyLink, wireCopyButton };
})();
