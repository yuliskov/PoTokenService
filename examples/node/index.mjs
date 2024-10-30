import { JSDOM } from 'jsdom';
import { Innertube, UniversalCache } from 'youtubei.js';
// Bun:
// import { Innertube, UniversalCache } from 'youtubei.js/web';
import { BG } from '../../dist/index.js';
import express from 'express';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3000;

// Apply a general rate limit to all requests (1 request per 5 seconds)
const generalLimiter = rateLimit({
  windowMs: 4 * 1_000, // 5 seconds
  max: 3, // 1 request per windowMs
  keyGenerator: () => 'global', // Apply limit across all IPs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true, // Include rate limit info in the headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiter to all routes
app.use(generalLimiter);

// Middleware to parse JSON requests
app.use(express.json());

// Sample RESTful route
app.get('/', async (req, res) => {
  try {
    const result = await getPoToken(req.query.visitorData);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health-check', (req, res) => {
  res.status(200).send('OK');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

async function getPoToken(visitorData) {
  if (visitorData === undefined) {
    let innertube = await Innertube.create({retrieve_player: false});
    visitorData = innertube.session.context.client.visitorData;
  }

  const requestKey = 'O43z0dpjhgX20SCx4KAo';

  const dom = new JSDOM();

  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document
  });

  const bgConfig = {
    fetch: (url, options) => fetch(url, options),
    globalObj: globalThis,
    identifier: visitorData,
    requestKey,
  };

  const bgChallenge = await BG.Challenge.create(bgConfig);

  if (!bgChallenge)
    throw new Error('Could not get challenge');

  const interpreterJavascript = bgChallenge.interpreterJavascript.privateDoNotAccessOrElseSafeScriptWrappedValue;

  if (interpreterJavascript) {
    new Function(interpreterJavascript)();
  } else throw new Error('Could not load VM');

  const poTokenResult = await BG.PoToken.generate({
    program: bgChallenge.program,
    globalName: bgChallenge.globalName,
    bgConfig
  });

  const placeholderPoToken = BG.PoToken.generatePlaceholder(visitorData);

  return {
    visitorData,
    placeholderPoToken,
    poToken: poTokenResult.poToken,
    mintRefreshDate: new Date((Date.now() + poTokenResult.integrityTokenData.estimatedTtlSecs * 1000) - (poTokenResult.integrityTokenData.mintRefreshThreshold * 1000)),
  }
}