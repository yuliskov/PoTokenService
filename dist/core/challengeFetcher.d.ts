import type { DescrambledChallenge, BgConfig } from '../utils/index.js';
/**
 * Creates a challenge.
 * @param bgConfig - The config.
 * @param interpreterHash - The ID of the challenge script. If provided, the server will assume that
 * the client already has the script and will not return it.
 * @returns The challenge data.
 */
export declare function create(bgConfig: BgConfig, interpreterHash?: string): Promise<DescrambledChallenge | undefined>;
/**
 * Parses the challenge data from the provided response data.
 */
export declare function parseChallengeData(rawData: Record<string, any>): DescrambledChallenge | undefined;
/**
 * Descrambles the given challenge data.
 */
export declare function descramble(scrambledChallenge: string): string | undefined;
