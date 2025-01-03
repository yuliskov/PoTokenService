const base64urlCharRegex = /[-_.]/g;
const base64urlToBase64Map = {
    '-': '+',
    _: '/',
    '.': '='
};
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
    const result = new Uint8Array([...base64Mod].map((char) => char.charCodeAt(0)));
    return result;
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
export class BGError {
    constructor(code, message) {
        this.code = code;
        this.message = message;
    }
}
