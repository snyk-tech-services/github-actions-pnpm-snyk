import { CustomError } from './custom-error';
export declare class UnsupportedFeatureFlagError extends CustomError {
    readonly featureFlag: string;
    private static ERROR_CODE;
    constructor(featureFlag: string, userMessage?: string);
}
