import type { PoTokenArgs, PoTokenResult } from '../utils/index.js';
/**
 * Generates a Proof of Origin Token.
 * @param args - The arguments for generating the token.
 */
export declare function generate(args: PoTokenArgs): Promise<PoTokenResult>;
/**
 * Creates a cold start token. This can be used while `sps` (StreamProtectionStatus) is 2, but will not work once it changes to 3.
 * @param identifier - Visitor ID or Data Sync ID.
 * @param clientState - The client state.
 */
export declare function generateColdStartToken(identifier: string, clientState?: number): string;
/**
 * @deprecated Use `generateColdStartToken` instead.
 */
export declare function generatePlaceholder(identifier: string, clientState?: number): string;
/**
 * Decodes a cold start webpo token.
 * @throws Error if the packet length is invalid.
 */
export declare function decodeColdStartToken(token: string): {
    identifier: string;
    timestamp: number;
    unknownVal: number;
    clientState: number;
    keys: number[];
    date: Date;
};
