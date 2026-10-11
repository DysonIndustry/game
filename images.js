/**
 * Dyson Game Hub — Picture Library
 * ---------------------------------------------------------------
 * Maps every answer option in the "Who Knows Me Better?" question
 * bank to its picture. All pictures live in the same folder as the
 * pages (pic-*.webp) so no sub-folders are needed.
 *
 * GHImages.forLabel("Burna Boy")  ->  "pic-burna-boy.webp"
 * GHImages.src(value)             ->  a URL the browser can load
 *                                     (local file name or https:// URL)
 *
 * Custom questions get a picture automatically too, whenever one of
 * their answer choices matches a label below (e.g. "Pizza").
 * ---------------------------------------------------------------
 */
const GHImages = (() => {
  const MAP = {
    // colours
    "blue": "blue", "black": "black", "red": "red", "white": "white",
    // food & drink
    "chicken": "chicken", "pizza": "pizza", "rice": "rice", "chips": "chips", "food": "food",
    "soda": "soda", "juice": "juice", "water": "water", "energy drink": "energy-drink",
    // music
    "afrobeats": "afrobeats", "hip-hop": "hip-hop", "r&b": "rnb", "gospel": "gospel",
    "burna boy": "burna-boy", "drake": "drake", "ayra starr": "ayra-starr", "chris brown": "chris-brown",
    "music": "music", "listening to music": "listening-to-music", "listen to music": "listen-to-music",
    // movies
    "action": "action", "comedy": "comedy", "horror": "horror", "romance": "romance",
    "watching movies": "watching-movies", "watch movies": "watch-movies",
    // sport & teams
    "football": "football", "basketball": "basketball", "volleyball": "volleyball", "athletics": "athletics",
    "manchester united": "manchester-united", "arsenal": "arsenal", "chelsea": "chelsea", "liverpool": "liverpool",
    // school & tech
    "mathematics": "mathematics", "ict": "ict", "biology": "biology", "english": "english",
    "coding": "coding", "technology": "technology", "internet": "internet",
    // hobbies & games
    "gaming": "gaming", "photography": "photography", "racing": "racing", "adventure": "adventure", "strategy": "strategy",
    // social
    "whatsapp": "whatsapp", "instagram": "instagram", "tiktok": "tiktok", "facebook": "facebook",
    // time of day
    "morning": "morning", "afternoon": "afternoon", "evening": "evening", "night": "night",
    // things & feelings
    "my phone": "phone", "a phone": "a-phone", "use my phone": "use-my-phone", "friends": "friends",
    "quiet": "quiet", "funny": "funny", "adventurous": "adventurous", "talkative": "talkative",
    "being ignored": "being-ignored", "being lied to": "being-lied-to", "waiting": "waiting", "noise": "noise",
    "success": "success", "spending time with friends": "spending-time-with-friends", "getting gifts": "getting-gifts",
    "sleep": "sleep", "money": "money", "clothes": "clothes", "a memorable experience": "a-memorable-experience",
    "something handmade": "something-handmade",
    // places
    "dubai": "dubai", "usa": "usa", "uk": "uk", "south africa": "south-africa",
    "staying home": "staying-home", "going out with friends": "going-out-with-friends", "travelling": "travelling",
    // goals & people
    "become successful": "become-successful", "build a business": "build-a-business",
    "become a professional": "become-a-professional", "travel the world": "travel-the-world",
    "my best friend": "my-best-friend", "my sibling": "siblings", "my classmate": "my-classmate", "my partner": "my-partner",
  };

  const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");

  /** File name for an answer label, or null when we have no picture for it. */
  function forLabel(label) {
    const slug = MAP[norm(label)];
    return slug ? `pic-${slug}.webp` : null;
  }

  /** Turns a stored value into something an <img> can load.
   *  Local file names (pic-*.webp) resolve next to the page; full URLs pass through. */
  function src(value) {
    return value || "";
  }

  /** Four labels -> four file names (or null). */
  function forOptions(options) {
    return options.map(forLabel);
  }

  return { MAP, forLabel, forOptions, src };
})();
