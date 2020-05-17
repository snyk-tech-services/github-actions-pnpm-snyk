export default class PnpmError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
