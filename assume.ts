export * from "./modules/assume/assumeChains"; // <-- Re-export all chain classes and checks

import {
  assume as Assume,
  CoreChecks,
  ObjectChecks,
  ArrayChecks,
  ElementChecks,
  AssumeUnknownChain,
  AssumeObjectChain,
  AssumeArrayChain,
  AssumeElementChain,
  AssumeFunctionChain,
  AssumePromiseChain,
} from "./modules/assume/assumeChains";

// --- Utility: Short stack trace for errors ---
function shortStack(e: unknown) {
  console.error(e);
}

// --- 2. check: returns boolean, never throws ---
export function check<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => boolean {
  return (...args: Parameters<T>) => {
    try {
      fn(...args);
      return true;
    } catch (e) {
      shortStack(e);
      return false;
    }
  };
}

// --- 3. assuming: run block if all pass, else fallback ---
type Assumption = () => boolean | void;

interface assumingOptions {
  onRefuted?: {
    catch?: (catchCallBack?: Function) => void;
    errorText?: (msg: string) => void;
    throw?: boolean;
    returnFn?: (bool: boolean) => void;
  };
}

export function Assuming(...args: Array<Assumption | assumingOptions>) {
  let options: assumingOptions | null = null;

  if (
    args.length &&
    typeof args[args.length - 1] === "object" &&
    !(args[args.length - 1] instanceof Function)
  ) {
    options = args.pop() as assumingOptions;
  }
  const assumptions: Assumption[] = args.filter(
    (x): x is Assumption => typeof x === "function"
  );
  let error: unknown = undefined;
  let failed = false;
  try {
    for (const a of assumptions) {
      const r = a();
      if (r === false) {
        failed = true;
        break;
      }
    }
  } catch (e) {
    error = e;
    failed = true;
  }

  return {
    Run<R>(fn: () => R): R | undefined {
      if (!failed) return fn();
    },
    onRefuted<R>(fn: (err?: unknown) => R): R | undefined {
      if (failed) {
        console.error(options?.onRefuted?.errorText || String(error));
        fn(error);
        if (options?.onRefuted?.catch) {
          console.error(String(error));
          return;
        }
        if (options?.onRefuted?.throw) {
          throw fn(error);
        }
      }
    },

    result<R>(success: () => R, failure?: (err?: unknown) => R): R | undefined {
      if (!failed) return success();
      if (failure) return failure(error);
    },
  };
}

// --- 1. Classic assert: just use the chain or assertion functions directly ---

const Assumed = {
  Assuming,
  Check: check,
  Assume,
  CoreChecks,
  ObjectChecks,
  ArrayChecks,
  ElementChecks,
  AssumeUnknownChain,
  AssumeObjectChain,
  AssumeArrayChain,
  AssumeElementChain,
  AssumeFunctionChain,
  AssumePromiseChain,
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
