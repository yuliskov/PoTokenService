import { GOOG_API_KEY, GOOG_BASE_URL, USER_AGENT, YT_BASE_URL } from './constants.js';
const base64urlCharRegex = /[-_.]/g;
const base64urlToBase64Map = {
    '-': '+',
    _: '/',
    '.': '='
};
export class BGError extends TypeError {
    constructor(message, info) {
        super(message);
        this.name = 'BGError';
        if (info)
            this.info = info;
    }
}
export function base64ToU8(base64) {
    let base64Mod;
    if (base64urlCharRegex.test(base64)) {
        base64Mod = base64.replace(base64urlCharRegex, function (match) {
            return base64urlToBase64Map[match];
        });
    }
    else {
        base64Mod = base64;
    }
    base64Mod = atob(base64Mod);
    return new Uint8Array([...base64Mod].map((char) => char.charCodeAt(0)));
}
export function u8ToBase64(u8, base64url = false) {
    const result = btoa(String.fromCharCode(...u8));
    if (base64url) {
        return result
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }
    return result;
}
export function isBrowser() {
    const isBrowser = typeof window !== 'undefined'
        && typeof window.document !== 'undefined'
        && typeof window.document.createElement !== 'undefined'
        && typeof window.HTMLElement !== 'undefined'
        && typeof window.navigator !== 'undefined'
        && typeof window.getComputedStyle === 'function'
        && typeof window.requestAnimationFrame === 'function'
        && typeof window.matchMedia === 'function';
    const hasValidWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')?.get?.toString().includes('[native code]') ?? false;
    return isBrowser && hasValidWindow;
}
export function getHeaders() {
    const headers = {
        'Accept-Encoding': 'gzip, deflate, br', // MOD: incoming compression
        'Content-Encoding': 'gzip', // MOD: outgoing compression
        'content-type': 'application/json+protobuf',
        'x-goog-api-key': GOOG_API_KEY,
        'x-user-agent': 'grpc-web-javascript/0.1'
    };
    if (!isBrowser()) {
        headers['user-agent'] = USER_AGENT;
    }
    return headers;
}
export function buildURL(endpointName, useYouTubeAPI) {
    return `${useYouTubeAPI ? YT_BASE_URL : GOOG_BASE_URL}/${useYouTubeAPI ? 'api/jnn/v1' : '$rpc/google.internal.waa.v1.Waa'}/${endpointName}`;
}
