export * from "./assumeChains";
import { AssumeChain, Assume } from "./assumeChains";
export declare function check(fn: () => void): boolean;
export type Assumption = () => boolean | void;
export interface AssumingOptions {
    onRefuted?: {
        catch?: (catchCallBack?: Function) => void;
        errorText?: string;
        throw?: boolean;
        returnBool?: (bool: boolean) => void;
    };
}
export declare function assuming(...args: Array<Assumption | AssumingOptions>): {
    Run<R>(fn: () => R): R | undefined;
    onRefuted<R_1>(fn: (err?: unknown) => R_1): R_1 | undefined;
    result<R_2>(success: () => R_2, failure?: ((err?: unknown) => R_2) | undefined): R_2 | undefined;
};
declare const Assumed: {
    assuming: typeof assuming;
    check: typeof check;
    Assume: typeof Assume;
    AssumeChain: typeof AssumeChain;
};
export default Assumed;
//# sourceMappingURL=assume.d.ts.map