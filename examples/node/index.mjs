import { BG, buildURL, GOOG_API_KEY, USER_AGENT } from '../../dist/index.js';
import { Innertube, YT, YTNodes } from 'youtubei.js';
import { JSDOM } from 'jsdom';
import express from 'express';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
// import pLimit from "p-limit";

// BEGIN PoToken

const userAgent = USER_AGENT;
// @NOTE: Session cache is disabled so we can get a fresh visitor data string.
const innertube = await Innertube.create({ user_agent: userAgent, enable_session_cache: false });
//const visitorData = innertube.session.context.client.visitorData || '';

// #region BotGuard Initialization
const dom = new JSDOM('<!DOCTYPE html><html lang="en"><head><title></title></head><body></body></html>', {
  url: 'https://www.youtube.com/',
  referrer: 'https://www.youtube.com/',
  userAgent
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  location: dom.window.location,
  origin: dom.window.origin
});

if (!Reflect.has(globalThis, 'navigator')) {
  Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator });
}

const challengeResponse = await innertube.getAttestationChallenge('ENGAGEMENT_TYPE_UNBOUND');

if (!challengeResponse.bg_challenge)
  throw new Error('Could not get challenge');

const interpreterUrl = challengeResponse.bg_challenge.interpreter_url.private_do_not_access_or_else_trusted_resource_url_wrapped_value;
const bgScriptResponse = await fetch(`https:${interpreterUrl}`);
const interpreterJavascript = await bgScriptResponse.text();

if (interpreterJavascript) {
  new Function(interpreterJavascript)();
} else throw new Error('Could not load VM');

const botguard = await BG.BotGuardClient.create({
  program: challengeResponse.bg_challenge.program,
  globalName: challengeResponse.bg_challenge.global_name,
  globalObj: globalThis
});
// #endregion

// #region WebPO Token Generation
const webPoSignalOutput = [];
const botguardResponse = await botguard.snapshot({ webPoSignalOutput });
const requestKey = 'O43z0dpjhgX20SCx4KAo';

const integrityTokenResponse = await fetch(buildURL('GenerateIT', true), {
  method: 'POST',
  headers: {
    'content-type': 'application/json+protobuf',
    'x-goog-api-key': GOOG_API_KEY,
    'x-user-agent': 'grpc-web-javascript/0.1',
    'user-agent': userAgent
  },
  body: JSON.stringify([ requestKey, botguardResponse ])
});

const response = await integrityTokenResponse.json();

if (typeof response[0] !== 'string')
  throw new Error('Could not get integrity token');

const integrityTokenBasedMinter = await BG.WebPoMinter.create({ integrityToken: response[0] }, webPoSignalOutput);
// #endregion

async function getPoToken(visitorData) {
  if (visitorData === undefined) {
      visitorData = innertube.session.context.client.visitorData || '';
  }

  const sessionPoToken = await integrityTokenBasedMinter.mintAsWebsafeString(visitorData);

  return {
    //visitorData, // not used
    //placeholderPoToken, // not used
    poToken: sessionPoToken,
    //mintRefreshDate: new Date((Date.now() + poTokenResult.integrityTokenData.estimatedTtlSecs * 1000) - (poTokenResult.integrityTokenData.mintRefreshThreshold * 1000)),
  }
}

/// END PoToken

/// BEGIN server

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.disable('etag');

// Middleware to set headers for every response
app.use((req, res, next) => {
  res.setHeader('Connection', 'close'); // Disable Keep-Alive
  res.removeHeader('Date'); // Remove the Date header
  //res.removeHeader('Vary'); // Remove the Vary header
  next();
});

// // Middleware for concurrent request limiting
// const limit = pLimit(1); // num concurrent requests
// app.use((req, res, next) => {
//   limit(() =>
//     new Promise((resolve, reject) => {
//       res.on('finish', resolve); // Free slot when response finishes
//       res.on('close', resolve);  // Free slot when client disconnects

//       try {
//         next();  // Transfer control to the next middleware
//       } catch (error) {
//         console.error('Error in middleware:', error);
//         req.socket.destroy();  // Разрываем соединение при ошибке
//         reject(error);  // Free slot on error
//       }
//     })
//   ).catch(() => {
//     // Destroy socket on exceeding the limit
//     req.socket.destroy();
//   });
// });

// Apply a general rate limit to all requests (1 request per 5 seconds)
const generalLimiter = rateLimit({
  windowMs: 500, // 500 ms
  max: 1, // 1 request per windowMs
  keyGenerator: () => 'global', // Apply limit across all IPs
  handler: (req, res) => {
    // Destroy the socket when the limit is exceeded
    res.socket.destroy();
  },
  //message: { error: 'Too many requests, please try again later.' },
  standardHeaders: false, // Include rate limit info in the headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
// Apply the rate limiter to all routes
app.use(generalLimiter);

// Compress responses of any size
app.use(compression({
  threshold: 0,
}));

// Middleware to parse JSON requests
app.use(express.json());

// Sample RESTful route
app.get(['/', '/alt'], async (req, res) => {
  try {
    const result = await getPoToken(req.query.visitorData);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.socket.destroy(); // Destroy socket to save bandwidth
    //res.status(500).json({ error: error.message });
  }
});

app.get('/health-check', (req, res) => {
  res.status(200).send('OK');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

/// END server