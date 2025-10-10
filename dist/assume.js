export * from "./assumeChains";
import { AssumeChain, Assume } from "./assumeChains";
// --- Utility: Short stack trace for errors ---
function shortStack(e) {
    if (e instanceof Error && e.stack) {
        console.error(e.stack.split('\n').slice(0, 3).join('\n'));
    }
    else {
        console.error(e);
    }
}
// --- 2. check: returns boolean, never throws ---
export function check(fn) {
    try {
        fn();
        return true;
    }
    catch {
        return false;
    }
}
export function assuming(...args) {
    let options = null;
    if (args.length &&
        typeof args[args.length - 1] === "object" &&
        !(args[args.length - 1] instanceof Function)) {
        options = args.pop();
    }
    const assumptions = args.filter((x) => typeof x === "function");
    let error = undefined;
    let failed = false;
    try {
        for (const a of assumptions) {
            const r = a();
            if (r === false) {
                failed = true;
                break;
            }
        }
    }
    catch (e) {
        error = e;
        failed = true;
    }
    return tail({ failed, error, options, assumptions });
}
function tail({ failed, error, options, assumptions }) {
    return {
        Run(fn) {
            if (!failed)
                return fn();
        },
        onRefuted(fn) {
            if (failed) {
                if (options?.onRefuted?.errorText) {
                    console.error(options.onRefuted.errorText);
                }
                else {
                    console.error(String(error));
                }
                fn(error);
                if (options?.onRefuted?.catch) {
                    options.onRefuted.catch();
                    return;
                }
                if (options?.onRefuted?.throw) {
                    throw fn(error);
                }
            }
        },
        result(success, failure) {
            if (!failed)
                return success();
            if (failure)
                return failure(error);
        },
    };
}
// --- 1. Classic assert: just use the chain or assertion functions directly ---
const Assumed = {
    assuming,
    check,
    Assume,
    AssumeChain,
};
export default Assumed;
// --- USAGE EXAMPLES ---
/*

THREE USES

1. Asserter (Fail Fast / Contract)
==================================
    Throws if the assumption fails (classic assert/assume/contract).
    TS Example:
    assume.isString(x); // Throws if not string, x is narrowed if it passes

2. Logic Fork / Guard
=====================
    Used as a conditional to branch logic, return, skip, or run alternate code.
    TS Example:
    if (check(Corechecks.isTrue)(x > 0)) {
      // x > 0 here!
      doSomething();
    } else {
      handleNotTrue();
    }

3. Conditional Block Execution
===============================
assuming(
  () => Corechecks.isTrue(x > 0),
  () => Objectchecks.hasKey(obj, 'foo')
).Run(() => {
  // Both checks passed
}).ifRefuted((err) => {
  // At least one failed
});
*/
