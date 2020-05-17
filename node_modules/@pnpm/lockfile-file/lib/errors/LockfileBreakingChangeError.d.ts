import PnpmError from '@pnpm/error';
export default class LockfileBreakingChangeError extends PnpmError {
    filename: string;
    constructor(filename: string);
}
