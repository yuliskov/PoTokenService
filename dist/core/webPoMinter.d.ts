import type { IntegrityTokenData, MintCallback, WebPoSignalOutput } from '../utils/types.js';
export default class WebPoMinter {
    private readonly mintCallback;
    constructor(mintCallback: MintCallback);
    static create(integrityTokenResponse: IntegrityTokenData, webPoSignalOutput: WebPoSignalOutput): Promise<WebPoMinter>;
    mintAsWebsafeString(identifier: string): Promise<string>;
    mint(identifier: string): Promise<Uint8Array>;
}
