import type { BotGuardClientOptions, SnapshotArgs, VMFunctions } from '../utils/types.js';
export default class BotGuardClient {
    vm: Record<string, any>;
    program: string;
    userInteractionElement?: any;
    vmFunctions: VMFunctions;
    syncSnapshotFunction?: (args: any[]) => Promise<string>;
    constructor(options: BotGuardClientOptions);
    /**
     * Factory method to create and load a BotGuardClient instance.
     * @param options - Configuration options for the BotGuardClient.
     * @returns A promise that resolves to a loaded BotGuardClient instance.
     */
    static create(options: BotGuardClientOptions): Promise<BotGuardClient>;
    private load;
    /**
     * Takes a snapshot asynchronously.
     * @returns The snapshot result.
     * @example
     * ```ts
     * const result = await botguard.snapshot({
     *   contentBinding: {
     *     c: "a=6&a2=10&b=SZWDwKVIuixOp7Y4euGTgwckbJA&c=1729143849&d=1&t=7200&c1a=1&c6a=1&c6b=1&hh=HrMb5mRWTyxGJphDr0nW2Oxonh0_wl2BDqWuLHyeKLo",
     *     e: "ENGAGEMENT_TYPE_VIDEO_LIKE",
     *     encryptedVideoId: "P-vC09ZJcnM"
     *    }
     * });
     *
     * console.log(result);
     * ```
     */
    snapshot(args: SnapshotArgs): Promise<string>;
    /**
     * Takes a snapshot synchronously.
     * @returns The snapshot result.
     * @throws Error Throws an error if the synchronous snapshot function is not found.
     */
    snapshotSynchronous(args: SnapshotArgs): Promise<string>;
    /**
     * Passes an event to the VM.
     * @throws Error Throws an error if the pass event function is not found.
     */
    passEvent(args: unknown): void;
    /**
     * Checks the "camera".
     * @throws Error Throws an error if the check camera function is not found.
     */
    checkCamera(args: unknown): void;
    /**
     * Shuts down the VM. Taking a snapshot after this will throw an error.
     * @throws Error Throws an error if the shutdown function is not found.
     */
    shutdown(): void;
}
