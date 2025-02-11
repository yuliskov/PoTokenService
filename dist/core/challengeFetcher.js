import { base64ToU8, BGError, buildURL, getHeaders } from '../utils/index.js';
import zlib from "zlib";
/**
 * Creates a challenge.
 * @param bgConfig - The config.
 * @param interpreterHash - The ID of the challenge script. If provided, the server will assume that
 * the client already has the script and will not return it.
 * @returns The challenge data.
 */
export async function create(bgConfig, interpreterHash) {
    const requestKey = bgConfig.requestKey;
    if (!bgConfig.fetch)
        throw new BGError('[Challenge]: Fetch function not provided');
    const payload = [requestKey];
    if (interpreterHash)
        payload.push(interpreterHash);
    const response = await bgConfig.fetch(buildURL('Create', bgConfig.useYouTubeAPI), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
        //body: zlib.gzipSync(JSON.stringify(payload)) // MOD: compress body
    });
    if (!response.ok)
        throw new BGError('[Challenge]: Failed to fetch challenge', { status: response.status });
    const rawData = await response.json();
    return parseChallengeData(rawData);
}
/**
 * Parses the challenge data from the provided response data.
 */
export function parseChallengeData(rawData) {
    let challengeData = [];
    if (rawData.length > 1 && typeof rawData[1] === 'string') {
        const descrambled = descramble(rawData[1]);
        challengeData = JSON.parse(descrambled || '[]');
    }
    else if (rawData.length && typeof rawData[0] === 'object') {
        challengeData = rawData[0];
    }
    const [messageId, wrappedScript, wrappedUrl, interpreterHash, program, globalName, , clientExperimentsStateBlob] = challengeData;
    const privateDoNotAccessOrElseSafeScriptWrappedValue = Array.isArray(wrappedScript) ? wrappedScript.find((value) => value && typeof value === 'string') : null;
    const privateDoNotAccessOrElseTrustedResourceUrlWrappedValue = Array.isArray(wrappedUrl) ? wrappedUrl.find((value) => value && typeof value === 'string') : null;
    return {
        messageId,
        interpreterJavascript: {
            privateDoNotAccessOrElseSafeScriptWrappedValue,
            privateDoNotAccessOrElseTrustedResourceUrlWrappedValue
        },
        interpreterHash,
        program,
        globalName,
        clientExperimentsStateBlob
    };
}
/**
 * Descrambles the given challenge data.
 */
export function descramble(scrambledChallenge) {
    const buffer = base64ToU8(scrambledChallenge);
    if (buffer.length)
        return new TextDecoder().decode(buffer.map((b) => b + 97));
}
