import { base64ToU8, BGError, u8ToBase64 } from '../utils/helpers.js';
export default class WebPoMinter {
    constructor(mintCallback) {
        this.mintCallback = mintCallback;
    }
    static async create(integrityTokenResponse, webPoSignalOutput) {
        const getMinter = webPoSignalOutput[0];
        if (!getMinter)
            throw new BGError('PMD:Undefined');
        if (!integrityTokenResponse.integrityToken)
            throw new BGError('Failed to create WebPoMinter: No integrity token provided', integrityTokenResponse);
        const mintCallback = await getMinter(base64ToU8(integrityTokenResponse.integrityToken));
        if (!(mintCallback instanceof Function))
            throw new BGError('APF:Failed');
        return new WebPoMinter(mintCallback);
    }
    async mintAsWebsafeString(identifier) {
        const result = await this.mint(identifier);
        return u8ToBase64(result, true);
    }
    async mint(identifier) {
        const result = await this.mintCallback(new TextEncoder().encode(identifier));
        if (!result)
            throw new BGError('YNJ:Undefined');
        if (!(result instanceof Uint8Array))
            throw new BGError('ODM:Invalid');
        return result;
    }
}
