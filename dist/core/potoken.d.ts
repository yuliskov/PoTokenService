import type { PoTokenArgs, PoTokenResult } from '../utils/index.js';
/**
 * Generates a Proof of Origin Token.
 * @param args - The arguments for generating the token.
 */
export declare function generate(args: PoTokenArgs): Promise<PoTokenResult>;
/**
 * Creates a placeholder PoToken. This can be used while `sps` (StreamProtectionStatus) is 2, but will not work once it changes to 3.
 * @param identifier - Visitor ID or Data Sync ID.
 */
export declare function generatePlaceholder(identifier: string, clientState?: number): string;
/**
 * Decodes a placeholder potoken string into its components.
 * @param placeholder - The placeholder potoken to decode.
 * @throws Error if the packet length is invalid.
 */
export declare function decodePlaceholder(placeholder: string): {
    identifier: string;
    timestamp: number;
    unknownVal: number;
    clientState: number;
    keys: number[];
    date: Date;
};
