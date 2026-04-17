const OpenAIImport = require('openai');
const Movie = require('../models/Movie');

const OpenAIClient = OpenAIImport.OpenAI || OpenAIImport.default || OpenAIImport;
const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.OPENAI_TOKEN;
const openai = OPENAI_KEY ? new OpenAIClient({ apiKey: OPENAI_KEY }) : null;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const DEFAULT_MOVIE_CATALOG = [
  { title: 'Amaran', genre: 'Action/Drama', poster: '/images/Amaran.jpeg', rating: 9.1, votes: '18K', trending: true },
  { title: 'Dhurandhar', genre: 'Action/Thriller', poster: '/images/durandhar.jpeg', rating: 9.7, votes: '3.1K', trending: true },
  { title: 'Jana Nayagan', genre: 'Action/Thriller', poster: '/images/Jana.jpeg', rating: 9.0, votes: '12K', trending: true },
  { title: 'Thunivu', genre: 'Action/Thriller', poster: '/images/Thunivu.jpeg', rating: 8.8, votes: '22K', trending: true },
  { title: 'Sirai', genre: 'Action/Drama/Crime', poster: '/images/sirai.jpeg', rating: 9.7, votes: '3.1K', trending: false },
  { title: 'Pathu Thala', genre: 'Action/Crime/Drama', poster: '/images/Pathu.jpeg', rating: 8.9, votes: '23.5K', trending: false },
  { title: 'King of Kotha', genre: 'Action/Crime/Drama', poster: '/images/Kotha.jpeg', rating: 8.9, votes: '23.5K', trending: false },
  { title: 'The Paradise', genre: 'Action/Thriller', poster: '/images/Paradise.jpeg', rating: 9.2, votes: '10K', trending: false },
  { title: 'Raayan', genre: 'Action/Thriller', poster: '/images/Raayan.jpeg', rating: 8.7, votes: '14K', trending: false },
  { title: 'Bison', genre: 'Drama/Sports', poster: '/images/bison.jpeg', rating: 8.2, votes: '55', trending: false },
  { title: 'Jai Bhim', genre: 'Legal/Drama', poster: '/images/jaibeem.jpeg', rating: 9.4, votes: '70K', trending: false },
  { title: 'Parasakthi', genre: 'Drama/Social', poster: '/images/parasakthi.jpeg', rating: 9.6, votes: '30K', trending: false },
  { title: 'Retro', genre: 'Action/Drama', poster: '/images/retro.jpeg', rating: 8.5, votes: '12K', trending: false },
  { title: 'Mahaan', genre: 'Action/Drama', poster: '/images/mahaan.jpeg', rating: 8.4, votes: '9K', trending: false },
  { title: 'Sarpatta Parambarai', genre: 'Action/Sports', poster: '/images/sarpata.jpeg', rating: 8.6, votes: '11K', trending: false },
  { title: 'Meiyazlagan', genre: 'Drama/Family', poster: '/images/Mei.jpeg', rating: 8.0, votes: '4K', trending: false },
];

const GENRE_KEYWORDS = {
  action: ['action', 'fight', 'combat', 'battle', 'war', 'aggressive'],
  comedy: ['comedy', 'funny', 'laugh', 'humor', 'humorous', 'hilarious'],
  drama: ['drama', 'emotional', 'serious', 'intense', 'touching'],
  thriller: ['thriller', 'suspense', 'mystery', 'mysterious', 'twist'],
  romance: ['romance', 'love', 'romantic', 'relationship'],
  family: ['family', 'kids', 'children', 'family-friendly'],
  animation: ['animation', 'anime', 'cartoon', 'animated'],
  adventure: ['adventure', 'explore', 'journey', 'exploration'],
  scifi: ['sci-fi', 'scifi', 'science fiction', 'futuristic', 'space'],
  horror: ['horror', 'scary', 'fear', 'creepy', 'frightening'],
  crime: ['crime', 'gang', 'heist', 'mafia'],
  social: ['social', 'issue', 'society', 'political'],
};

const AGE_PREFERENCES = [
  { max: 19, genres: ['animation', 'family', 'adventure', 'comedy'] },
  { max: 40, genres: ['action', 'thriller', 'crime', 'sci-fi', 'adventure'] },
  { max: 60, genres: ['drama', 'family', 'social', 'emotion', 'romance'] },
  { max: Infinity, genres: ['classic', 'emotional', 'drama', 'family', 'romance'] },
];

const MOOD_PREFERENCES = {
  happy: ['comedy', 'family', 'animation', 'romance', 'feel-good'],
  sad: ['drama', 'family', 'romance', 'emotional', 'inspiring'],
  bored: ['action', 'thriller', 'adventure', 'mystery', 'sci-fi'],
  stressed: ['comedy', 'family', 'light', 'romance', 'feel-good'],
};

const normalizeString = (value) => String(value || '').toLowerCase().trim();
const splitGenres = (genreText) => normalizeString(genreText).split(/[\/,&|]/).map((item) => item.trim()).filter(Boolean);

const normalizeMovie = (movie) => {
  if (!movie) return null;
  if (typeof movie === 'string') {
    return { title: movie, genre: '', poster: '', rating: null, votes: '', _id: null };
  }

  return {
    _id: movie._id || movie.id || null,
    title: movie.title || movie.name || movie.movieName || 'Untitled',
    genre: movie.genre || movie.category || '',
    poster: movie.poster || movie.img || '',
    rating: movie.rating || null,
    votes: movie.votes || '',
    language: movie.language || '',
    duration: movie.duration || '',
    ageGroup: movie.ageGroup || '',
    trending: Boolean(movie.trending),
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

const inferMood = (message = '') => {
  const text = normalizeString(message);
  if (/(happy|excited|great|awesome|fun|party|celebrate)/.test(text)) return 'happy';
  if (/(sad|down|lonely|cry|heartbreak|depressed)/.test(text)) return 'sad';
  if (/(bored|idle|nothing to do|kill time|free time)/.test(text)) return 'bored';
  if (/(stressed|tired|anxious|work pressure|overwhelmed|tense)/.test(text)) return 'stressed';
  return null;
};

const getQueryKeywords = (message = '') => {
  const text = normalizeString(message);
  const keywords = new Set();

  Object.entries(GENRE_KEYWORDS).forEach(([genre, terms]) => {
    if (terms.some((term) => text.includes(term))) {
      keywords.add(genre);
      terms.forEach((term) => keywords.add(term));
    }
  });

  return Array.from(keywords);
};

const buildRecommendationTags = (age, mood, historyGenres, queryKeywords) => {
  const tags = new Set();
  const ageBucket = AGE_PREFERENCES.find((item) => age !== null && age <= item.max);

  (ageBucket?.genres || []).forEach((tag) => tags.add(tag));
  (MOOD_PREFERENCES[mood] || []).forEach((tag) => tags.add(tag));
  historyGenres.forEach((tag) => tags.add(tag));
  queryKeywords.forEach((tag) => tags.add(tag));

  return Array.from(tags);
};

const scoreMovies = (availableMovies, tags, historyTitles, queryText) => {
  return availableMovies
    .map((movie) => {
      const movieGenres = splitGenres(movie.genre);
      const titleText = normalizeString(movie.title || movie.name || 'Untitled');
      const normalizedQuery = normalizeString(queryText);
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
        reasons.add('title affinity');
      }

      if (normalizedQuery && (titleText.includes(normalizedQuery) || normalizedQuery.includes(titleText))) {
        score += 2;
        reasons.add('query affinity');
      }

      if (historyTitles.some((historyTitle) => titleText.includes(normalizeString(historyTitle)))) {
        score += 2;
        reasons.add('similar to booking history');
      }

      if (movie.trending) {
        score += 1;
      }

      return { ...movie, score, reasons: Array.from(reasons) };
    })
    .sort((a, b) => b.score - a.score);
};

const fetchMovieCatalog = async (availableMovies = []) => {
  const fallbackMovies = Array.isArray(availableMovies) ? availableMovies.map(normalizeMovie).filter(Boolean) : [];

  try {
    const movies = await Movie.find({})
      .select('title genre poster rating votes description language duration ageGroup trending tags')
      .lean();

    const normalizedMovies = (movies || []).map(normalizeMovie).filter(Boolean);
    if (normalizedMovies.length > 0) {
      const merged = [...normalizedMovies];
      const seenTitles = new Set(normalizedMovies.map((movie) => normalizeString(movie.title)));

      DEFAULT_MOVIE_CATALOG.map(normalizeMovie).filter(Boolean).forEach((movie) => {
        const key = normalizeString(movie.title);
        if (!seenTitles.has(key)) {
          merged.push(movie);
          seenTitles.add(key);
        }
      });

      console.log(`[AI] Loaded ${normalizedMovies.length} movies from MongoDB and merged fallback catalog. Total: ${merged.length}.`);
      return merged;
    }
  } catch (error) {
    console.log(`[AI] Movie catalog fetch failed, using fallback list. Reason: ${error.message}`);
  }

  const fallbackCatalog = fallbackMovies.length > 0 ? fallbackMovies : DEFAULT_MOVIE_CATALOG.map(normalizeMovie).filter(Boolean);
  console.log(`[AI] Using fallback movie catalog. Count: ${fallbackCatalog.length}`);
  return fallbackCatalog;
};

const buildCandidateMovies = ({ query, movies, movieHistory = [], age, mood }) => {
  const normalizedQuery = normalizeString(query);
  const queryKeywords = getQueryKeywords(query);
  const historyMovies = movieHistory.map(normalizeMovie).filter(Boolean);
  const historyTitles = historyMovies.map((movie) => movie.title);
  const historyGenres = historyMovies.flatMap((movie) => splitGenres(movie.genre));
  const tags = buildRecommendationTags(age, mood, historyGenres, queryKeywords);

  const ranked = scoreMovies(movies, tags, historyTitles, normalizedQuery);
  const genreFocused = queryKeywords.length
    ? ranked.filter((movie) => movie.score > 0 || queryKeywords.some((term) => splitGenres(movie.genre).some((genre) => genre.includes(term) || term.includes(genre))))
    : ranked;

  const topMovies = (genreFocused.length > 0 ? genreFocused : ranked).slice(0, 12);
  return { topMovies, ranked, queryKeywords };
};

const buildFallbackReply = ({ query, recommendations }) => {
  if (!recommendations.length) {
    return `I could not find exact matches for "${query}" in the current catalog, so here are some titles you can try:`;
  }

  return `Here are the best matches for "${query}":\n${recommendations.map((movie) => `- ${movie.title} (${movie.genre || 'Genre not listed'})`).join('\n')}`;
};

const buildGuaranteedRecommendations = (query, allMovies, rankedMovies) => {
  const normalizedQuery = normalizeString(query);
  const queryKeywords = getQueryKeywords(query);

  const directMatches = allMovies.filter((movie) => {
    const titleText = normalizeString(movie.title || movie.name || '');
    const genreText = normalizeString(movie.genre || '');
    return queryKeywords.some((keyword) => titleText.includes(keyword) || genreText.includes(keyword))
      || (normalizedQuery && (titleText.includes(normalizedQuery) || normalizedQuery.includes(titleText)));
  });

  const source = directMatches.length > 0 ? directMatches : (rankedMovies.length > 0 ? rankedMovies : allMovies);
  return source.slice(0, 5).map((movie) => ({
    title: movie.title,
    genre: movie.genre,
    reason: movie.reasons?.join(', ') || 'Matched from your movie catalog.',
    poster: movie.poster,
    rating: movie.rating,
    votes: movie.votes,
  }));
};

const buildSystemPrompt = ({ age, mood, query, candidateMovies, movieHistory }) => {
  return [
    'You are a movie recommendation assistant for BookMySeat AI.',
    'Only recommend movies from the provided movie list.',
    'Do not invent, guess, or suggest movies that are not in the list.',
    'If the user asks for a genre like action or thriller, pick only matching movies from the provided list.',
    'If there are no matches, say that no matching titles were found in the catalog.',
    'Return valid JSON only with this exact shape:',
    '{"reply":"short conversational reply","recommendations":[{"title":"","genre":"","reason":""}]}',
    'Keep the reply concise, friendly, and formatted for a chat UI.',
    `User age: ${age ?? 'unknown'}`,
    `Detected mood: ${mood ?? 'unknown'}`,
    `User query: ${query || 'unknown'}`,
    `Recent booking history: ${movieHistory.map((movie) => movie.title).filter(Boolean).slice(0, 10).join(', ') || 'No booking history'}`,
    `Movie catalog JSON: ${JSON.stringify(candidateMovies.slice(0, 20))}`,
  ].join('\n');
};

const sanitizeRecommendations = (rawRecommendations, candidateMovies) => {
  const allowedTitles = new Map(candidateMovies.map((movie) => [normalizeString(movie.title), movie]));
  const seen = new Set();
  const sanitized = [];

  (Array.isArray(rawRecommendations) ? rawRecommendations : []).forEach((item) => {
    const title = normalizeString(item?.title);
    const matched = allowedTitles.get(title);
    if (!matched || seen.has(title)) {
      return;
    }

    seen.add(title);
    sanitized.push({
      title: matched.title,
      genre: matched.genre || item.genre || '',
      reason: item.reason || 'Matched from your movie catalog.',
      poster: matched.poster || '',
      rating: matched.rating,
      votes: matched.votes,
    });
  });

  return sanitized;
};

const formatReply = (reply, recommendations) => {
  const listText = recommendations.length
    ? recommendations.map((movie) => `- ${movie.title}${movie.genre ? ` (${movie.genre})` : ''}`).join('\n')
    : '';

  if (!reply) {
    return recommendations.length ? `Here are the recommended movies:\n${listText}` : 'Here are some movies you can try from the catalog.';
  }

  if (!recommendations.length) {
    return `${reply}\nHere are some movies you can try from the catalog.`;
  }

  return `${reply}\n${listText}`;
};

const generateRecommendations = async ({
  userMessage = '',
  userProfile = {},
  movieHistory = [],
  availableMovies = [],
  conversationHistory = [],
}) => {
  const age = inferAge(userProfile);
  const mood = inferMood(userMessage);
  const allMovies = await fetchMovieCatalog(availableMovies);
  const { topMovies, ranked, queryKeywords } = buildCandidateMovies({
    query: userMessage,
    movies: allMovies,
    movieHistory,
    age,
    mood,
  });

  const candidates = topMovies.length > 0 ? topMovies : ranked.slice(0, 10);
  console.log(`[AI] Query: "${userMessage}" | Candidates: ${candidates.length} | Keywords: ${queryKeywords.join(', ') || 'none'}`);

  const fallbackRecommendations = buildGuaranteedRecommendations(userMessage, allMovies, candidates);

  if (!openai || !OPENAI_KEY) {
    return {
      response: buildFallbackReply({ query: userMessage, recommendations: fallbackRecommendations }),
      recommendations: fallbackRecommendations,
      source: 'fallback',
      age,
      mood,
    };
  }

  const safeHistory = Array.isArray(conversationHistory)
    ? conversationHistory
        .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && item.content)
        .slice(-12)
        .map((item) => ({ role: item.role, content: String(item.content) }))
    : [];

  try {
    const chatMessages = [
      {
        role: 'system',
        content: buildSystemPrompt({
          age,
          mood,
          query: userMessage,
          candidateMovies: candidates,
          movieHistory,
        }),
      },
      ...safeHistory,
      { role: 'user', content: userMessage || 'Recommend movies from my catalog.' },
    ];

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: chatMessages,
      temperature: 0.2,
      max_tokens: 450,
      response_format: { type: 'json_object' },
    });

    const responseText = completion?.choices?.[0]?.message?.content?.trim() || '{}';
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError) {
      console.log(`[AI] JSON parse failed, falling back. Reason: ${parseError.message}`);
      parsed = {};
    }

    const recommendations = sanitizeRecommendations(parsed.recommendations || [], candidates);
    const reply = formatReply(parsed.reply || '', recommendations.length ? recommendations : fallbackRecommendations);
    const finalRecommendations = recommendations.length ? recommendations : fallbackRecommendations;

    return {
      response: reply,
      recommendations: finalRecommendations,
      source: 'openai',
      age,
      mood,
    };
  } catch (error) {
    console.log(`[AI] OpenAI request failed, using fallback. Reason: ${error.message}`);
    return {
      response: buildFallbackReply({ query: userMessage, recommendations: fallbackRecommendations }),
      recommendations: fallbackRecommendations,
      source: 'fallback',
      warning: error.message || 'AI model call failed, fallback response used',
      age,
      mood,
    };
  }
};

const recommendMovies = async (req, res) => {
  try {
    const {
      userMessage = '',
      userProfile = {},
      movieHistory = [],
      availableMovies = [],
      conversationHistory = [],
    } = req.body || {};

    const result = await generateRecommendations({
      userMessage,
      userProfile,
      movieHistory,
      availableMovies,
      conversationHistory,
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      response: 'I could not generate recommendations right now. Please try again.',
      recommendations: [],
      source: 'error',
      error: error.message,
    });
  }
};

const getAIResponse = async (req, res) => {
  return recommendMovies(req, res);
};

module.exports = { getAIResponse, recommendMovies };
