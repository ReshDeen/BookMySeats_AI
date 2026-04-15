const OpenAIImport = require("openai");

const OpenAIClient = OpenAIImport.OpenAI || OpenAIImport.default || OpenAIImport;
const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.OPENAI_TOKEN;
const openai = OPENAI_KEY ? new OpenAIClient({ apiKey: OPENAI_KEY }) : null;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const AGE_PREFERENCES = [
  { max: 19, genres: ["animation", "family", "adventure", "comedy", "trending"] },
  { max: 40, genres: ["action", "thriller", "crime", "sci-fi", "adventure"] },
  { max: 60, genres: ["drama", "family", "social", "emotion", "romance"] },
  { max: Infinity, genres: ["classic", "emotional", "drama", "family", "romance"] },
];

const MOOD_PREFERENCES = {
  happy: ["comedy", "family", "animation", "romance", "feel-good"],
  sad: ["drama", "family", "romance", "emotional", "inspiring"],
  bored: ["action", "thriller", "adventure", "mystery", "sci-fi"],
  stressed: ["comedy", "family", "light", "romance", "feel-good"],
};

const normalizeString = (value) => String(value || "").toLowerCase().trim();

const splitGenres = (genreText) => normalizeString(genreText).split(/[\/,&|]/).map((item) => item.trim()).filter(Boolean);

const normalizeMovie = (movie) => {
  if (!movie) return null;
  if (typeof movie === "string") return { title: movie, genre: "" };
  return {
    title: movie.title || movie.name || movie.movieName || "Untitled",
    genre: movie.genre || movie.category || "",
  };
};

const inferAge = (userProfile = {}) => {
  if (Number.isFinite(Number(userProfile.age))) return Number(userProfile.age);
  if (userProfile.dob) {
    const birthDate = new Date(userProfile.dob);
    if (!Number.isNaN(birthDate.getTime())) {
      const diffMs = Date.now() - birthDate.getTime();
      return Math.max(0, Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000)));
    }
  }
  return null;
};

const inferMood = (message = "") => {
  const text = normalizeString(message);
  if (/(happy|excited|great|awesome|fun|party|celebrate)/.test(text)) return "happy";
  if (/(sad|down|lonely|cry|heartbreak|depressed)/.test(text)) return "sad";
  if (/(bored|idle|nothing to do|kill time|free time)/.test(text)) return "bored";
  if (/(stressed|tired|anxious|work pressure|overwhelmed|tense)/.test(text)) return "stressed";
  return null;
};

const buildRecommendationTags = (age, mood, historyGenres) => {
  const tags = new Set();
  const ageBucket = AGE_PREFERENCES.find((item) => age !== null && age <= item.max);
  (ageBucket?.genres || []).forEach((tag) => tags.add(tag));
  (MOOD_PREFERENCES[mood] || []).forEach((tag) => tags.add(tag));
  historyGenres.forEach((tag) => tags.add(tag));
  return Array.from(tags);
};

const scoreMovies = (availableMovies, tags, historyTitles) => {
  return availableMovies
    .map((movie) => {
      const movieGenres = splitGenres(movie.genre);
      const titleText = normalizeString(movie.title || movie.name || "Untitled");
      let score = 0;
      const reasons = new Set();

      movieGenres.forEach((genre) => {
        if (tags.some((tag) => genre.includes(tag) || tag.includes(genre))) {
          score += 3;
          reasons.add(`genre match: ${genre}`);
        }
      });

      if (tags.some((tag) => titleText.includes(tag))) {
        score += 1;
        reasons.add("title affinity");
      }
      if (historyTitles.some((historyTitle) => titleText.includes(normalizeString(historyTitle)))) {
        score += 2;
        reasons.add("similar to booking history");
      }

      return { ...movie, score, reasons: Array.from(reasons) };
    })
    .sort((a, b) => b.score - a.score);
};

const pickTopRecommendations = ({ availableMovies = [], movieHistory = [], age, mood }) => {
  const normalizedAvailableMovies = availableMovies.map(normalizeMovie).filter(Boolean);
  const historyMovies = movieHistory.map(normalizeMovie).filter(Boolean);
  const historyTitles = historyMovies.map((movie) => movie.title);
  const historyGenres = historyMovies.flatMap((movie) => splitGenres(movie.genre));
  const tags = buildRecommendationTags(age, mood, historyGenres);

  const ranked = scoreMovies(normalizedAvailableMovies, tags, historyTitles);
  const topMovies = ranked.filter((movie) => movie.score > 0).slice(0, 5);

  if (topMovies.length > 0) return topMovies.map((movie) => movie.title);
  return normalizedAvailableMovies.slice(0, 3).map((movie) => movie.title).filter(Boolean);
};

const pickRecommendationInsights = ({ availableMovies = [], movieHistory = [], age, mood }) => {
  const normalizedAvailableMovies = availableMovies.map(normalizeMovie).filter(Boolean);
  const historyMovies = movieHistory.map(normalizeMovie).filter(Boolean);
  const historyTitles = historyMovies.map((movie) => movie.title);
  const historyGenres = historyMovies.flatMap((movie) => splitGenres(movie.genre));
  const tags = buildRecommendationTags(age, mood, historyGenres);

  const ranked = scoreMovies(normalizedAvailableMovies, tags, historyTitles)
    .filter((movie) => movie.score > 0)
    .slice(0, 3)
    .map((movie) => ({
      title: movie.title,
      score: movie.score,
      reasons: movie.reasons,
    }));

  return ranked;
};

const buildSystemPrompt = ({ age, mood, recommendationText, availableMovies, movieHistory }) => {
  const availableTitles = availableMovies.map((movie) => movie.title).filter(Boolean).slice(0, 20).join(", ") || "No catalog data";
  const historyTitles = movieHistory.map((movie) => movie.title).filter(Boolean).slice(0, 20).join(", ") || "No booking history";

  return [
    "You are BookMySeat AI, a helpful cinema assistant.",
    "Answer DIRECTLY and CONCISELY. Avoid long explanations.",
    "When recommending movies, list the actual movie TITLES first, then explain why if helpful.",
    "Help with booking, navigation, movie discovery, and general questions.",
    "If the user asks for a specific genre or movie type, respond with actual movie suggestions from the catalog.",
    `User age: ${age ?? "unknown"}`,
    `Detected mood: ${mood ?? "unknown"}`,
    `Top recommendations: ${recommendationText || "None"}`,
    `Available movies: ${availableTitles}`,
    `Recent booking history: ${historyTitles}`,
    "For navigation queries, mention: Home, Profile, Payment History, Notifications, About.",
  ].join("\n");
};

const detectGenre = (message, availableMovies = []) => {
  const text = normalizeString(message);
  const genreKeywords = {
    action: ["action", "fight", "combat", "battle", "war", "aggressive"],
    comedy: ["comedy", "funny", "laugh", "humorous", "hilarious"],
    drama: ["drama", "emotional", "serious", "intense", "touching"],
    thriller: ["thriller", "suspense", "mysterious", "mystery", "twist"],
    romance: ["romance", "love", "romantic", "relationship"],
    family: ["family", "kids", "children", "family-friendly"],
    animation: ["animation", "anime", "cartoon", "animated"],
    adventure: ["adventure", "explore", "journey", "exploration"],
    scifi: ["sci-fi", "scifi", "science fiction", "futuristic", "space"],
    horror: ["horror", "scary", "fear", "creepy", "frightening"],
  };

  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      const matchingMovies = availableMovies.filter((movie) => {
        const movieGenre = normalizeString(movie.genre || "");
        return keywords.some((keyword) => movieGenre.includes(keyword));
      });
      if (matchingMovies.length > 0) {
        return { genre, movies: matchingMovies.map((m) => m.title || m.name).filter(Boolean) };
      }
    }
  }
  return null;
};

const detectIntent = (message) => {
  const text = normalizeString(message);
  if (/(recommend|suggest|what should i watch|movie to watch|pick a movie)/.test(text)) return "recommendation";
  if (/(book|booking|seat|showtime|ticket|pay|payment)/.test(text)) return "booking";
  if (/(home|navigate|menu|profile|history|notifications|about|where to find)/.test(text)) return "navigation";
  return "general";
};

const buildFallbackResponse = ({
  message,
  recommendations,
  recommendationInsights,
  genreMatch,
  mood,
  age,
}) => {
  const intent = detectIntent(message);
  let mainLine = "";
  if (genreMatch) {
    mainLine = `Here are some ${genreMatch.genre} movies for you: ${genreMatch.movies.slice(0, 5).join(", ")}.`;
  } else {
    mainLine = recommendations.length
      ? `Top picks for you: ${recommendations.slice(0, 5).join(", ")}.`
      : "I can help you discover movies. What genre interests you?";
  }

  const reasonLine = Array.isArray(recommendationInsights) && recommendationInsights.length && !genreMatch
    ? `Based on your profile: ${recommendationInsights
        .map((item) => `${item.title}`)
        .slice(0, 3)
        .join(", ")}.`
    : "";

  const intentLine = {
    recommendation: genreMatch ? "" : "I combined your mood, age, and history to rank options.",
    booking: "To book: select a movie, choose your seats, and proceed to payment.",
    navigation: "Use the menu for: Home, Profile, Payment History, Notifications, About.",
    general: "",
  }[intent];

  return [mainLine, reasonLine, intentLine]
    .filter(Boolean)
    .join(" ");
};

const getAIResponse = async (req, res) => {
  let recommendations = [];
  let recommendationInsights = [];
  let genreMatch = null;
  let mood = null;
  let age = null;

  try {
    const {
      userMessage = "",
      userProfile = {},
      movieHistory = [],
      availableMovies = [],
      conversationHistory = [],
    } = req.body || {};

    age = inferAge(userProfile);
    mood = inferMood(userMessage);
    genreMatch = detectGenre(userMessage, availableMovies);
    recommendations = pickTopRecommendations({ availableMovies, movieHistory, age, mood });
    recommendationInsights = pickRecommendationInsights({ availableMovies, movieHistory, age, mood });
    const recommendationText = recommendations.length ? recommendations.join(", ") : "";

    if (!openai || !OPENAI_KEY) {
      return res.json({
        response: buildFallbackResponse({
          message: userMessage,
          recommendations,
          recommendationInsights,
          genreMatch,
          mood,
          age,
        }),
        recommendations,
        recommendationInsights,
        genreMatch,
        mood,
        age,
        source: "fallback",
      });
    }

    const safeHistory = Array.isArray(conversationHistory)
      ? conversationHistory
          .filter((item) => item && (item.role === "user" || item.role === "assistant") && item.content)
          .slice(-12)
          .map((item) => ({ role: item.role, content: String(item.content) }))
      : [];

    const chatMessages = [
      {
        role: "system",
        content: buildSystemPrompt({
          age,
          mood,
          recommendationText,
          availableMovies: availableMovies.map(normalizeMovie).filter(Boolean),
          movieHistory: movieHistory.map(normalizeMovie).filter(Boolean),
        }),
      },
      {
        role: "system",
        content: `Recommendation evidence: ${JSON.stringify(recommendationInsights)}. Use this evidence naturally in responses when relevant.`,
      },
      ...safeHistory,
      { role: "user", content: userMessage || "Give me a helpful recommendation and support response." },
    ];

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 350,
    });

    const responseText = completion?.choices?.[0]?.message?.content?.trim();

    return res.json({
      response:
        responseText ||
        buildFallbackResponse({
          message: userMessage,
          recommendations,
          recommendationInsights,
          genreMatch,
          mood,
          age,
        }),
      recommendations,
      recommendationInsights,
      genreMatch,
      mood,
      age,
      source: "openai",
    });
  } catch (error) {
    return res.json({
      response: buildFallbackResponse({
        message: req?.body?.userMessage || "",
        recommendations,
        recommendationInsights,
        genreMatch,
        mood,
        age,
      }),
      recommendations,
      recommendationInsights,
      genreMatch,
      mood,
      age,
      source: "fallback",
      warning: error.message || "AI model call failed, fallback response used",
    });
  }
};

module.exports = { getAIResponse };