export declare function base64ToU8(base64: string): Uint8Array;
export declare function u8ToBase64(u8: Uint8Array, base64url?: boolean): string;
export declare class BGError {
    code: number;
    message: string;
    constructor(code: number, message: string);
}
