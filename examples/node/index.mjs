import { JSDOM } from 'jsdom';
import { Innertube, UniversalCache } from 'youtubei.js';
// Bun:
// import { Innertube, UniversalCache } from 'youtubei.js/web';
import { BG } from '../../dist/index.js';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Sample RESTful route
app.get('/api/hello', async (req, res) => {
  const result = await getPoToken()
  res.json(result);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

async function getPoToken() {
  let innertube = await Innertube.create({retrieve_player: false});

  const requestKey = 'O43z0dpjhgX20SCx4KAo';
  const visitorData = innertube.session.context.client.visitorData;

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