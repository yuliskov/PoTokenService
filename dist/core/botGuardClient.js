import { BGError } from '../utils/index.js';
export default class BotGuardClient {
    constructor(options) {
        this.vmFunctions = {};
        this.userInteractionElement = options.userInteractionElement;
        this.vm = options.globalObj[options.globalName];
        this.program = options.program;
    }
    /**
     * Factory method to create and load a BotGuardClient instance.
     * @param options - Configuration options for the BotGuardClient.
     * @returns A promise that resolves to a loaded BotGuardClient instance.
     */
    static async create(options) {
        return await new BotGuardClient(options).load();
    }
    async load() {
        if (!this.vm)
            throw new BGError('[BotGuardClient]: VM not found in the global object');
        if (!this.vm.a)
            throw new BGError('[BotGuardClient]: Could not load program');
        const vmFunctionsCallback = (asyncSnapshotFunction, shutdownFunction, passEventFunction, checkCameraFunction) => {
            Object.assign(this.vmFunctions, { asyncSnapshotFunction, shutdownFunction, passEventFunction, checkCameraFunction });
        };
        try {
            this.syncSnapshotFunction = await this.vm.a(this.program, vmFunctionsCallback, true, this.userInteractionElement, () => { }, [[], []])[0];
        }
        catch (error) {
            throw new BGError(`[BotGuardClient]: Failed to load program (${error.message})`);
        }
        return this;
    }
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
    async snapshot(args) {
        return new Promise((resolve, reject) => {
            if (!this.vmFunctions.asyncSnapshotFunction)
                return reject(new BGError('[BotGuardClient]: Async snapshot function not found'));
            this.vmFunctions.asyncSnapshotFunction((response) => resolve(response), [
                args.contentBinding,
                args.signedTimestamp,
                args.webPoSignalOutput,
                args.skipPrivacyBuffer
            ]);
        });
    }
    /**
     * Takes a snapshot synchronously.
     * @returns The snapshot result.
     * @throws Error Throws an error if the synchronous snapshot function is not found.
     */
    async snapshotSynchronous(args) {
        if (!this.syncSnapshotFunction)
            throw new BGError('[BotGuardClient]: Sync snapshot function not found');
        return this.syncSnapshotFunction([
            args.contentBinding,
            args.signedTimestamp,
            args.webPoSignalOutput,
            args.skipPrivacyBuffer
        ]);
    }
    /**
     * Passes an event to the VM.
     * @throws Error Throws an error if the pass event function is not found.
     */
    passEvent(args) {
        if (!this.vmFunctions.passEventFunction)
            throw new BGError('[BotGuardClient]: Pass event function not found');
        this.vmFunctions.passEventFunction(args);
    }
    /**
     * Checks the "camera".
     * @throws Error Throws an error if the check camera function is not found.
     */
    checkCamera(args) {
        if (!this.vmFunctions.checkCameraFunction)
            throw new BGError('[BotGuardClient]: Check camera function not found');
        this.vmFunctions.checkCameraFunction(args);
    }
    /**
     * Shuts down the VM. Taking a snapshot after this will throw an error.
     * @throws Error Throws an error if the shutdown function is not found.
     */
    shutdown() {
        if (!this.vmFunctions.shutdownFunction)
            throw new BGError('[BotGuardClient]: Shutdown function not found');
        this.vmFunctions.shutdownFunction();
    }
}
