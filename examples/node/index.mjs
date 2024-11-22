import { JSDOM } from 'jsdom';
//import { Innertube } from 'youtubei.js';
import { BG } from '../../dist/index.js';
import express from 'express';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

// BEGIN PoToken

const requestKey = 'O43z0dpjhgX20SCx4KAo';

const dom = new JSDOM();

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document
});

const bgConfig = {
  fetch: (url, options) => fetch(url, options),
  globalObj: globalThis,
  //identifier: visitorData, // not used
  requestKey,
};

const bgChallenge = await BG.Challenge.create(bgConfig);

if (!bgChallenge)
  throw new Error('Could not get challenge');

const interpreterJavascript = bgChallenge.interpreterJavascript.privateDoNotAccessOrElseSafeScriptWrappedValue;

if (interpreterJavascript) {
  new Function(interpreterJavascript)();
} else throw new Error('Could not load VM');

async function getPoToken(visitorData) {
  // if (visitorData === undefined) {
  //   let innertube = await Innertube.create({retrieve_player: false});
  //   visitorData = innertube.session.context.client.visitorData;
  // }

  const poTokenResult = await BG.PoToken.generate({
    program: bgChallenge.program,
    globalName: bgChallenge.globalName,
    bgConfig
  });

  //const placeholderPoToken = BG.PoToken.generatePlaceholder(visitorData);

  return {
    //visitorData, // not used
    //placeholderPoToken, // not used
    poToken: poTokenResult.poToken,
    mintRefreshDate: new Date((Date.now() + poTokenResult.integrityTokenData.estimatedTtlSecs * 1000) - (poTokenResult.integrityTokenData.mintRefreshThreshold * 1000)),
  }
}

async function getPoTokenAlt(program) {
  const poTokenResult = await BG.PoToken.generate({
    program: program,
    globalName: bgChallenge.globalName,
    bgConfig
  });

  return {
    poToken: poTokenResult.poToken,
    mintRefreshDate: new Date((Date.now() + poTokenResult.integrityTokenData.estimatedTtlSecs * 1000) - (poTokenResult.integrityTokenData.mintRefreshThreshold * 1000)),
  }
}

/// END PoToken

/// BEGIN server

const app = express();
const PORT = process.env.PORT || 3000;

// Apply a general rate limit to all requests (1 request per 5 seconds)
const generalLimiter = rateLimit({
  windowMs: 2 * 1_000, // 5 seconds
  max: 20, // 1 request per windowMs
  keyGenerator: () => 'global', // Apply limit across all IPs
  handler: (req, res) => {
    // Destroy the socket when the limit is exceeded
    res.socket.destroy();
  },
  //message: { error: 'Too many requests, please try again later.' },
  standardHeaders: false, // Include rate limit info in the headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.disable('x-powered-by');
app.disable('etag');

app.use((req, res, next) => {
  res.setHeader('Connection', 'close'); // Disable Keep-Alive
  res.removeHeader('Date'); // Remove the Date header
  //res.removeHeader('Vary'); // Remove the Vary header
  next();
});

app.use(compression({
  threshold: 0, // Compress responses of any size
}));

// Apply the rate limiter to all routes
//app.use(generalLimiter);

// Middleware to parse JSON requests
app.use(express.json());

// Sample RESTful route
app.get(['/', '/alt'], generalLimiter, async (req, res) => {
  try {
    const result = await getPoToken(req.query.visitorData);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// app.get('/alt', generalLimiter, async (req, res) => {
//   try {
//     const result = await getPoTokenAlt(req.query.program);
//     res.json(result);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// });

app.get('/health-check', (req, res) => {
  res.status(200).send('OK');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

/// END server