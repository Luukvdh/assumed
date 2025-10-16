// ============================================================================
// CORE TYPES AND ACTIVE CODE
// ============================================================================
const typeTagArray = [
    "unknown",
    "string",
    "number",
    "array",
    "object",
    "element",
    "datetime",
    "boolean",
    "null",
    "undefined",
    "present",
];
export class AssumingBus extends EventTarget {
    map = new Map();
    on(event, fn) {
        const set = this.map.get(event) ?? new Set();
        set.add(fn);
        this.map.set(event, set);
        return () => this.off(event, fn);
    }
    off(event, fn) {
        const set = this.map.get(event);
        if (!set)
            return;
        set.delete(fn);
        if (set.size === 0)
            this.map.delete(event);
    }
    once(event, fn) {
        const off = this.on(event, (p) => {
            off();
            try {
                fn(p);
            }
            catch { }
        });
        return off;
    }
    emit(event, payload) {
        const set = this.map.get(event);
        if (!set)
            return;
        for (const fn of Array.from(set)) {
            try {
                fn(payload);
            }
            catch { }
        }
    }
    addEventListener(type, callback, options) {
        this.on(type, callback);
    }
    dispatchEvent(event) {
        this.emit(event.type, event);
        return true;
    }
    removeEventListener(type, callback, options) {
        this.off(type, callback);
    }
}
export const assumingBus = new AssumingBus();
function mergeOptions(base, patch) {
    if (patch == null)
        return base;
    if (typeof patch === "string")
        return { ...base, message: patch };
    return { ...base, ...patch };
}
export function assuming(...args) {
    let optionsRef = {
        quiet: false,
        message: "Assumption failed",
    };
    // trailing message or options
    if (args.length) {
        const last = args[args.length - 1];
        const isOptsObj = last &&
            typeof last === "object" &&
            typeof last !== "function" &&
            typeof last !== "boolean";
        if (typeof last === "string" || isOptsObj) {
            optionsRef = mergeOptions(optionsRef, last);
            args.pop();
        }
    }
    // normalize assumptions to callables; ignore null/undefined
    // Also track original values from chains for eitherOr
    const originalValues = [];
    const assumptions = args
        .filter((a) => a != null && (typeof a === "function" || typeof a === "boolean"))
        .map((a) => {
        if (typeof a === "function") {
            // Try to extract original value if this is an assumption chain (without running checks)
            try {
                const value = a.raw?.() ?? a.value?.();
                if (value !== undefined)
                    originalValues.push(value);
            }
            catch {
                // Ignore if value() doesn't exist
            }
            return a;
        }
        return () => a;
    });
    let error;
    let failed = false;
    try {
        for (const a of assumptions) {
            const r = a(); // boolean | void; may throw
            if (r === false) {
                failed = true;
                break;
            }
        }
    }
    catch (e) {
        failed = true;
        error = e;
    }
    const customEmits = [];
    let __emittedBetween = false;
    const ensureEmitted = () => {
        if (__emittedBetween)
            return;
        // Emit legacy names and new names for clarity
        assumingBus.emit(failed ? "assuming:fail" : "assuming:pass");
        assumingBus.emit(failed ? "assume:refuted" : "assume:vindicated");
        if (!failed && optionsRef.emit) {
            assumingBus.emit(optionsRef.emit);
        }
        // Process queued conditional emissions
        for (const qe of customEmits) {
            let shouldEmit = false;
            try {
                shouldEmit = !!qe.cond();
            }
            catch (e) {
                // Don't break overall flow if predicate throws
                console.error("emitOn predicate threw:", e);
            }
            if (shouldEmit) {
                let payload;
                try {
                    payload = qe.data
                        ? qe.data()
                        : originalValues.length > 0
                            ? originalValues[0]
                            : undefined;
                }
                catch (e) {
                    console.error("emitOn data producer threw:", e);
                }
                assumingBus.emit(qe.event, payload);
            }
        }
        __emittedBetween = true;
    };
    if (failed && !optionsRef.quiet) {
        const msg = optionsRef.message ??
            (error instanceof Error ? error.message : "Assumption failed");
        throw error instanceof Error ? error : new Error(msg);
    }
    let lastResult; // capture last Run/result result
    const buildMessage = (msg) => msg ??
        optionsRef.message ??
        (error instanceof Error ? error.message : "Assumptions not satisfied");
    const api = {
        /**
         * Emit an event only when the assumptions pass (vindicated).
         * @param event Event name to emit.
         * @param data Optional payload or producer function. If omitted, the original value from the first chain is used when available.
         */
        /** Emit when pass (vindicated). Sugar for emitOn(() => !failed, event, data) */
        emitOnPass(event, data) {
            customEmits.push({
                cond: () => !failed,
                event,
                data: data === undefined
                    ? () => (originalValues.length > 0 ? originalValues[0] : undefined)
                    : typeof data === "function"
                        ? data
                        : () => data,
            });
            return api;
        },
        /**
         * Emit an event only when the assumptions fail (refuted).
         * @param event Event name to emit.
         * @param data Optional payload or producer function. If omitted, the original value from the first chain is used when available.
         */
        /** Emit when fail (refuted). Sugar for emitOn(() => failed, event, data) */
        emitOnFail(event, data) {
            customEmits.push({
                cond: () => failed,
                event,
                data: data === undefined
                    ? () => (originalValues.length > 0 ? originalValues[0] : undefined)
                    : typeof data === "function"
                        ? data
                        : () => data,
            });
            return api;
        },
        /**
         * Queue a conditional emission to run between the chain and terminal actions.
         * Usage:
         *   assuming(...)
         *     .emitOn(() => someCondition, "my:event", () => payload)
         *     .Run(() => { /* ... *\/ })
         * condition: boolean or () => boolean
         * event: string
         * data: unknown or () => unknown (defaults to original value from the chain)
         */
        /**
         * Queue a conditional event emission.
         * @param condition boolean or () => boolean determining whether to emit.
         * @param event Event name to emit.
         * @param data Optional payload or () => payload. If omitted, the original chain value is used when available.
         */
        emitOn(condition, event, data) {
            const condFn = typeof condition === "function"
                ? condition
                : () => !!condition;
            const dataFn = data === undefined
                ? () => (originalValues.length > 0 ? originalValues[0] : undefined)
                : typeof data === "function"
                    ? data
                    : () => data;
            customEmits.push({ cond: condFn, event, data: dataFn });
            return api; // FLUENT
        },
        /**
         * Run a handler only when assumptions pass. Errors thrown by the handler will propagate.
         * @param fn Zero-argument function to run on success. Its return is captured by value().
         */
        Run(fn) {
            // Emit right before running user code, after chains completed
            ensureEmitted();
            if (!failed)
                lastResult = fn();
            return api; // FLUENT
        },

        RunResult(fn) {
            // Emit right before running user code, after chains completed
            ensureEmitted();
            if (!failed)
                lastResult = fn(lastResult);
            return api; // FLUENT
        },
        // Optional accessor for the value produced by last Run/result
        /**
         * Retrieve the last result produced by Run()/result()/onRefuted()/onVindicated()/catch().
         */
        value() {
            ensureEmitted();
            return lastResult;
        },
        /** Boolean terminal: true when vindicated, false when refuted. */
        returnBoolean() {
            ensureEmitted();
            return !failed;
        },
        // Fluent failure handler
        /**
         * Run only when refuted; stores return as lastResult.
         * @param fn Handler receiving the error; return value is stored in value().
         */
        onRefuted(fn) {
            ensureEmitted();
            if (failed)
                lastResult = fn(error);
            return api; // FLUENT
        },
        /**
         * Run only when vindicated; stores return as lastResult.
         * @param fn Handler to run on success; return value is stored in value().
         */
        onVindicated(fn) {
            ensureEmitted();
            if (!failed)
                lastResult = fn();
            return api; // FLUENT
        },
        /**
         * Run handler unless the condition is true. Accepts a boolean or a () => boolean.
         * Useful for early exits: .unless(isFeatureEnabled, () => doFallback())
         */
        unless(condition, fn) {
            ensureEmitted();
            const cond = typeof condition === "function" ? !!condition() : !!condition;
            if (!cond)
                lastResult = fn();
            return api; // FLUENT
        },
        // Promise-like alias
        /**
         * Catch refutations; behaves like onRefuted but matches Promise.catch shape.
         * @param fn Handler receiving the error; return value is stored in value().
         */
        catch(fn) {
            ensureEmitted();
            if (failed)
                lastResult = fn(error);
            return api; // FLUENT
        },
        /**
         * Either/Or fork with your original value as the asserter parameter.
         * Think: "String or Object? Red or Blue?" — write two small functions and we pass the same original value to either branch.
         * - either(original): assumptions passed → handle as one case (e.g., string → JSON.parse)
         * - or(original): failed without throwing → handle the alternative (e.g., already parsed → return as-is)
         * - neither(error): failed with an error → handle exception cases
         * Returns whatever your branch returns. Quiet mode is turned on automatically to avoid eager throws before branching.
         */
        eitherOr(either, or, neither) {
            // Ensure no eager throwing before we branch
            optionsRef.quiet = true; // Automatically disable eager throw for branching
            ensureEmitted();
            // Use the first original value we captured
            const originalValue = originalValues.length > 0 ? originalValues[0] : undefined;
            if (!failed) {
                // Either: assumptions passed, call with validated value
                return (lastResult = either(originalValue));
            }
            if (or && !error) {
                // Or: assumptions failed but didn't throw, call with original value
                return (lastResult = or(originalValue));
            }
            if (neither) {
                // Neither: assumptions threw error
                return (lastResult = neither(error));
            }
            return undefined;
        },
        // Branch helper (kept for convenience)
        /**
         * Branch result depending on current state; stores return as lastResult.
         * @param success Called when vindicated.
         * @param failure Called when refuted (optional).
         */
        result(success, failure) {
            ensureEmitted();
            if (!failed)
                return (lastResult = success());
            if (failure)
                return (lastResult = failure(error));
            return undefined;
        },
        /** Quick status accessor for testing and telemetry */
        status() {
            ensureEmitted();
            return { failed, error, lastResult };
        },
        // Stateful options
        /** Set the failure message used when throwing. */
        message(msg) {
            optionsRef.message = msg;
            return api;
        },
        /** Toggle quiet mode (do not throw on refutation). */
        quiet(value = true) {
            optionsRef.quiet = value;
            return api;
        },
        /** Get a copy of the current options. */
        options() {
            return { ...optionsRef };
        },
    };
    return api;
}
// Boolean convenience: true if fn does not throw
export function safeToAssume(...args) {
    try {
        // If single argument that looks like an assumption chain/function
        if (args.length === 1 && typeof args[0] === "function") {
            // Single assumption chain: safeToAssume(that(x).isString())
            args[0](); // Execute the chain
            return true;
        }
        else {
            // Multiple assumptions: safeToAssume(cond1, cond2, that(x).isString())
            assuming(...args);
            return true;
        }
    }
    catch (e) {
        console.log("Well... that assumption turned out to be unfounded:", e.message);
        return false;
    }
}
const ASSUME_HISTORY = [];
let ASSUME_HISTORY_LIMIT = 200;
function pushAssumeEvent(ev) {
    ASSUME_HISTORY.push(ev);
    if (ASSUME_HISTORY.length > ASSUME_HISTORY_LIMIT)
        ASSUME_HISTORY.shift();
}
function previewValue(v) {
    try {
        if (v === null || v === undefined)
            return String(v);
        if (typeof v === "string")
            return v.length > 120 ? v.slice(0, 117) + "..." : v;
        if (typeof v === "number" || typeof v === "boolean")
            return String(v);
        if (Array.isArray(v))
            return `Array(${v.length})`;
        if (typeof v === "object")
            return `{${Object.keys(v)
                .slice(0, 6)
                .join(",")}${Object.keys(v).length > 6 ? ",…" : ""}}`;
        return typeof v;
    }
    catch {
        return undefined;
    }
}
export const captureLocation = (() => {
    const stack = new Error().stack;
    if (stack) {
        const lines = stack.split("\n");
        // Find first line that's not in assume.ts/assume.js
        const relevantLine = lines.find((line) => line.includes("at ") &&
            !line.includes("assume.js") &&
            !line.includes("assume.ts"));
        return relevantLine?.trim().replace("at ", "") || "unknown";
    }
    return undefined;
})();
export class AssumptionError extends Error {
    name = "AssumptionError";
    assumeStack;
    valuePreview;
    timestamp;
    cause;
    chainTrace; // NEW: readable chain trace
    captureLocation; // NEW: where the chain was created
    constructor(message, opts) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.assumeStack = opts.stack;
        this.valuePreview = previewValue(opts.value);
        this.timestamp = Date.now();
        this.cause = opts.cause;
        this.chainTrace = opts.chainTrace || [];
        this.captureLocation = opts.captureLocation;
        // Enhanced error message with context
        this.message = this.buildRichMessage(message, opts.inferenceText);
    }
    buildRichMessage(originalMessage, inferenceText) {
        const parts = [`AssumptionError: ${originalMessage}`];
        if (this.valuePreview) {
            parts.push(`Value: ${this.valuePreview}`);
        }
        if (this.chainTrace.length > 0) {
            parts.push(`Chain: ${this.chainTrace.join(" → ")}`);
        }
        if (this.captureLocation) {
            parts.push(`Created at: ${this.captureLocation}`);
        }
        if (inferenceText) {
            parts.push(inferenceText);
        }
        return parts.join("\n  ");
    }
}
export function isAssumptionError(err) {
    return (!!err && typeof err === "object" && err.name === "AssumptionError");
}
function formatAssumptionError(err) {
    const parts = [
        `🔴 ${err.message}`,
        `📊 Value: ${err.valuePreview || "unknown"}`,
    ];
    if (err.chainTrace.length > 0) {
        parts.push(`🔗 Chain: ${err.chainTrace.join(" → ")}`);
    }
    if (err.captureLocation) {
        parts.push(`📍 Origin: ${err.captureLocation}`);
    }
    // Show recent history for context
    const recentHistory = getAssumeHistory().slice(-3);
    if (recentHistory.length > 0) {
        parts.push(`📜 Recent: ${recentHistory.map((ev) => `${ev.kind}${JSON.stringify(ev) || ""}`).join(" → ")}`);
    }
    return parts.join("\n   ");
}
function createAssumption(value) {
    const queue = [];
    const chainTrace = []; // Track method calls
    // Capture where the chain was created (per-chain, not module-level)
    const creationLocation = (() => {
        try {
            const stack = new Error().stack;
            if (stack) {
                const lines = stack.split("\n");
                const relevantLine = lines.find((line) => line.includes("at ") &&
                    !line.includes("assume.js") &&
                    !line.includes("assume.ts"));
                return relevantLine?.trim().replace("at ", "") || "unknown";
            }
        }
        catch { }
        return undefined;
    })();
    // Capture where the chain was created
    pushAssumeEvent({
        t: Date.now(),
        kind: "start",
        info: { valuePreview: previewValue(value) },
    });
    const runAll = () => {
        try {
            for (const c of queue)
                c.check();
            pushAssumeEvent({ t: Date.now(), kind: "vindicated" });
            return true;
        }
        catch (e) {
            // Don't throw - just return false to indicate failure
            pushAssumeEvent({
                t: Date.now(),
                kind: "refuted",
                info: { message: String(e) },
            });
            return false;
        }
    };
    const runner = function () {
        return runAll();
    };
    function getTypeName(val) {
        if (val === null)
            return "null";
        if (Array.isArray(val))
            return "Array";
        if (typeof val === "object")
            return val.constructor?.name || "Object";
        return typeof val;
    }
    // Simplify the add function to use getTypeName:
    const add = (fn, type = "unknown", methodName) => {
        // Add to readable trace using detected type
        if (methodName) {
            const detectedType = getTypeName(value);
            chainTrace.push(`${detectedType}.${methodName}`);
        }
        const wrapped = () => {
            try {
                fn();
                pushAssumeEvent({
                    t: Date.now(),
                    kind: "check",
                    info: { type, op: methodName },
                });
            }
            catch (e) {
                if (isAssumptionError(e)) {
                    pushAssumeEvent({
                        t: Date.now(),
                        kind: "refuted",
                        info: { message: e.message },
                    });
                    throw e;
                }
                // Build a brief inference report about the offending value
                let inferenceText = undefined;
                try {
                    const results = report(value);
                    const pass = results.filter((r) => r.passed).map((r) => r.name);
                    const fail = results.filter((r) => !r.passed).map((r) => r.name);
                    const passShow = pass.slice(0, 4).join(", ");
                    const failShow = fail.slice(0, 3).join(", ");
                    const morePass = pass.length > 4 ? `, +${pass.length - 4} more` : "";
                    const moreFail = fail.length > 3 ? `, +${fail.length - 3} more` : "";
                    const passLine = passShow ? `Pass: [${passShow}${morePass}]` : "";
                    const failLine = failShow ? `Fail: [${failShow}${moreFail}]` : "";
                    const combined = [passLine, failLine].filter(Boolean).join("; ");
                    if (combined)
                        inferenceText = `Inferred: ${combined}`;
                }
                catch { }
                const err = new AssumptionError(e instanceof Error ? e.message : String(e), {
                    stack: queue.slice(),
                    value,
                    cause: e,
                    chainTrace: chainTrace.slice(),
                    captureLocation: creationLocation,
                    inferenceText,
                });
                // 📰 IMMEDIATE BULLETIN (no setImmediate)
                console.log("📰 ASSUMPTION ERROR:", err.message);
                pushAssumeEvent({
                    t: Date.now(),
                    kind: "refuted",
                    info: { message: err.message },
                });
                throw err;
            }
        };
        queue.push({ check: wrapped, type, methodName });
    };
    const base = {
        or(condition, msg) {
            // Capture current checks as the left-hand side (LHS)
            const left = queue.splice(0);
            add(() => {
                // Try LHS first
                let leftPassed = true;
                try {
                    for (const c of left)
                        c.check();
                }
                catch (e) {
                    leftPassed = false;
                }
                if (leftPassed)
                    return;
                // Evaluate RHS condition
                let rightOk = true;
                try {
                    if (typeof condition === "function") {
                        const r = condition();
                        if (r === false)
                            rightOk = false;
                    }
                    else {
                        rightOk = !!condition;
                    }
                }
                catch (e) {
                    // If RHS throws, propagate that error
                    throw e;
                }
                if (!rightOk)
                    throw new Error(msg ?? "Assumption failed (or)");
            }, "unknown", "or");
            return runner;
        },
        andGuard(guard, msg) {
            add(() => {
                if (!guard(value))
                    throw new Error(msg ?? "Assumption failed (andGuard)");
            }, "unknown", "andGuard");
            // Recast runner to the narrowed type for downstream specialized methods
            return runner;
        },
        and(condition, msg) {
            add(() => {
                let ok = true;
                if (typeof condition === "function") {
                    // Support passing another assumption chain or a plain predicate
                    const fn = condition;
                    try {
                        // If it's a chain, invoking it returns boolean (true/false)
                        const r = fn();
                        if (r === false)
                            ok = false;
                    }
                    catch (e) {
                        // Propagate errors to be wrapped by add()
                        throw e;
                    }
                }
                else {
                    ok = !!condition;
                }
                if (!ok)
                    throw new Error(msg ?? "Assumption failed (and)");
            }, "unknown", "and");
            return runner;
        },
        that(predicate, msg) {
            add(() => {
                if (!predicate(value))
                    throw new Error(msg ?? "Assumption failed");
            }, "unknown", "that");
            return runner;
        },
        instanceof(expectedOrMsg, msg) {
            // Detect if first param is a constructor or message
            const isConstructorProvided = typeof expectedOrMsg === "function";
            const actualMsg = isConstructorProvided ? msg : expectedOrMsg;
            if (isConstructorProvided) {
                // With constructor - check instanceof and use smart TypeTag detection
                const expected = expectedOrMsg;
                add(() => {
                    if (!(value instanceof expected))
                        throw new Error(actualMsg ??
                            "Assumption failed: value is not instance of expected");
                }, 
                // Smart TypeTag detection from your typeTagArray lookup
                (typeTagArray.find((x) => x === getTypeName(value)) ||
                    typeTagArray.find((x) => x === typeof value) ||
                    "unknown"), `instanceof(${expected.name || "Constructor"})`);
                return runner;
            }
            else {
                // Empty instanceof - confidence check, detect current type
                add(() => {
                    // Just verify it's some kind of constructor instance
                    if (typeof value !== "object" || value === null) {
                        throw new Error(actualMsg ?? "Expected constructor instance");
                    }
                }, 
                // Smart TypeTag detection using your existing logic
                (typeTagArray.find((x) => x === getTypeName(value)) ||
                    typeTagArray.find((x) => x === typeof value) ||
                    "unknown"), `instanceof('base')`);
                return runner;
            }
        },
        equals(expected, msg) {
            add(() => {
                if (value !== expected)
                    throw new Error(msg ?? "Assumption failed: value !== expected");
            }, "unknown", `equals(${JSON.stringify(expected)})`);
            return runner;
        },
        /** Run queued checks and return the value if they pass; throw on failure. */
        value() {
            const ok = runner();
            if (!ok)
                throw new Error("Assumption failed");
            return value;
        },
        /** Alias for value() for backward compatibility. */

    };
    Object.assign(runner, base);
    // Natural terminal: property getter that runs the checks and returns the value
    // Usage: const v = that(x).isString().trimmedNotEmpty.it
    Object.defineProperty(runner, "it", {
        get() {
            return runner.value();
        },
        enumerable: false,
        configurable: false,
    });
    // Ultra-short terminal: same as .it but terser to type.
    // Usage: const v = that(x).isString().trimmedNotEmpty.$
    Object.defineProperty(runner, "$", {
        get() {
            return runner.value();
        },
        enumerable: false,
        configurable: false,
    });
    // Provide a raw() accessor to retrieve the original value without running checks
    // Used internally by assuming() to capture the original value safely
    runner.raw = () => value;
    // Chain builders for each specialized type
    const toNumberChain = () => Object.assign(runner, {
        greaterThan(n, msg) {
            add(() => {
                if (!(value > n))
                    throw new Error(msg ?? `Expected > ${n}`);
            }, "number", `greaterThan(${n})`);
            return runner;
        },
        greaterOrEqual(n, msg) {
            add(() => {
                if (!(value >= n))
                    throw new Error(msg ?? `Expected >= ${n}`);
            }, "number", `greaterOrEqual(${n})`);
            return runner;
        },
        lessThan(n, msg) {
            add(() => {
                if (!(value < n))
                    throw new Error(msg ?? `Expected < ${n}`);
            }, "number", `lessThan(${n})`);
            return runner;
        },
        lessOrEqual(n, msg) {
            add(() => {
                if (!(value <= n))
                    throw new Error(msg ?? `Expected <= ${n}`);
            }, "number", `lessOrEqual(${n})`);
            return runner;
        },
        between(min, max, msg) {
            add(() => {
                const v = value;
                if (!(v >= min && v <= max))
                    throw new Error(msg ?? `Expected between ${min} and ${max}`);
            }, "number", `between(${min},${max})`);
            return runner;
        },
    });
    const toStringChain = () => Object.assign(runner, {
        notEmpty(msg) {
            add(() => {
                if (String(value).length === 0)
                    throw new Error(msg ?? "Expected non-empty string");
            }, "string", "notEmpty");
            return runner;
        },
        // New canonical names
        lengthMustBe(len, msg) {
            add(() => {
                if (String(value).length !== len)
                    throw new Error(msg ?? `Expected length ${len}`);
            }, "string", `lengthMustBe(${len})`);
            return runner;
        },
        lengthAtLeast(n, msg) {
            add(() => {
                if (String(value).length < n)
                    throw new Error(msg ?? `Expected length >= ${n}`);
            }, "string", `lengthAtLeast(${n})`);
            return runner;
        },
        lengthAtMost(n, msg) {
            add(() => {
                if (String(value).length > n)
                    throw new Error(msg ?? `Expected length <= ${n}`);
            }, "string", `lengthAtMost(${n})`);
            return runner;
        },
        // Deprecated aliases
        hasLength(len, msg) {
            return this.lengthMustBe(len, msg);
        },
        minLength(n, msg) {
            return this.lengthAtLeast(n, msg);
        },
        maxLength(n, msg) {
            return this.lengthAtMost(n, msg);
        },
        lengthBetween(min, max, msg) {
            add(() => {
                const l = String(value).length;
                if (l < min || l > max)
                    throw new Error(msg ?? `Expected length between ${min} and ${max}`);
            }, "string", `lengthBetween(${min},${max})`);
            return runner;
        },
        contains(needle, msg) {
            add(() => {
                const s = String(value);
                const ok = typeof needle === "string" ? s.includes(needle) : needle.test(s);
                if (!ok)
                    throw new Error(msg ?? `Expected to contain ${String(needle)}`);
            }, "string", `contains(${typeof needle === "string" ? `"${needle}"` : needle.toString()})`);
            return runner;
        },
        startsWith(prefix, msg) {
            add(() => {
                if (!String(value).startsWith(prefix))
                    throw new Error(msg ?? `Expected to start with "${prefix}"`);
            }, "string", `startsWith("${prefix}")`);
            return runner;
        },
        endsWith(suffix, msg) {
            add(() => {
                if (!String(value).endsWith(suffix))
                    throw new Error(msg ?? `Expected to end with "${suffix}"`);
            }, "string", `endsWith("${suffix}")`);
            return runner;
        },
        matches(re, msg) {
            add(() => {
                if (!re.test(String(value)))
                    throw new Error(msg ?? `Expected to match ${re}`);
            }, "string", `matches(${re.toString()})`);
            return runner;
        },
        equalsIgnoreCase(expected, msg) {
            add(() => {
                if (String(value).toLowerCase() !== expected.toLowerCase())
                    throw new Error(msg ?? `Expected "${expected}" (case-insensitive)`);
            }, "string", `equalsIgnoreCase("${expected}")`);
            return runner;
        },
        includesAny(...needles) {
            add(() => {
                const s = String(value);
                if (!needles.some((n) => s.includes(n)))
                    throw new Error(`Expected any of [${needles.join(", ")}]`);
            }, "string", `includesAny(${needles.map((n) => `"${n}"`).join(",")})`);
            return runner;
        },
        includesAll(...needles) {
            add(() => {
                const s = String(value);
                if (!needles.every((n) => s.includes(n)))
                    throw new Error(`Expected all of [${needles.join(", ")}]`);
            }, "string", `includesAll(${needles.map((n) => `"${n}"`).join(",")})`);
            return runner;
        },
        isJSON(msg) {
            add(() => {
                try {
                    JSON.parse(String(value));
                }
                catch {
                    throw new Error(msg ?? "Expected valid JSON");
                }
            }, "string", "isJSON");
            return runner;
        },
        /**
         * Assert that the string has non-empty content after trimming whitespace.
         */
        trimmedNotEmpty(msg) {
            add(() => {
                if (String(value).trim().length === 0)
                    throw new Error(msg ?? "Expected non-empty (trimmed)");
            }, "string", "trimmedNotEmpty");
            return runner;
        },
    });
    const toArrayChain = () => Object.assign(runner, {
        lengthMustBe(len, msg) {
            add(() => {
                if (value.length !== len)
                    throw new Error(msg ?? `Expected array length ${len}`);
            }, "array", `lengthMustBe(${len})`);
            return runner;
        },
        // Deprecated alias
        hasLength(len, msg) {
            return this.lengthMustBe(len, msg);
        },
        notEmpty(msg) {
            add(() => {
                if (value.length === 0)
                    throw new Error(msg ?? "Expected non-empty array");
            }, "array", "notEmpty");
            return runner;
        },
        hasAnyOf(items, msg) {
            add(() => {
                const arr = value;
                // Compare by string equality to be lenient across primitives
                const set = new Set(items);
                const ok = arr.some((el) => set.has(String(el)) || set.has(el));
                if (!ok)
                    throw new Error(msg ?? `Expected array to contain any of [${items.join(", ")}]`);
            }, "array", `hasAnyOf([${items.length}])`);
            return runner;
        },
        hasEveryOf(items, msg) {
            add(() => {
                const arr = value;
                const set = new Set(arr.map((x) => (typeof x === "string" ? x : String(x))));
                const missing = items.filter((k) => !set.has(k));
                if (missing.length > 0)
                    throw new Error(msg ?? `Missing required items: [${missing.join(", ")}]`);
            }, "array", `hasEveryOf([${items.length}])`);
            return runner;
        },
        hasAllOf(items, msg) {
            // Deprecated alias
            return this.hasEveryOf(items, msg);
        },
        itemIsBoolean(i, msg) {
            add(() => {
                if (typeof value[i] !== "boolean")
                    throw new Error(msg ?? `Expected boolean at ${i}`);
            }, "array", `itemIsBoolean(${i})`);
            return runner;
        },
        itemIsString(i, msg) {
            add(() => {
                if (typeof value[i] !== "string")
                    throw new Error(msg ?? `Expected string at ${i}`);
            }, "array", `itemIsString(${i})`);
            return runner;
        },
        itemIsNumber(i, msg) {
            add(() => {
                if (typeof value[i] !== "number")
                    throw new Error(msg ?? `Expected number at ${i}`);
            }, "array", `itemIsNumber(${i})`);
            return runner;
        },
        itemIsObject(i, msg) {
            add(() => {
                const v = value[i];
                if (typeof v !== "object" || v === null || Array.isArray(v))
                    throw new Error(msg ?? `Expected object at ${i}`);
            }, "array", `itemIsObject(${i})`);
            return runner;
        },
        includesString(needle, msg) {
            add(() => {
                if (!value.some((item) => String(item).includes(needle)))
                    throw new Error(msg ?? `Expected string including "${needle}"`);
            }, "array", `includesString("${needle}")`);
            return runner;
        },
        includesNumber(needle, msg) {
            add(() => {
                if (!value.some((item) => item === needle))
                    throw new Error(msg ?? `Expected number including "${needle}"`);
            }, "array", `includesNumber(${needle})`);
            return runner;
        },
        includesObject(needle, msg) {
            add(() => {
                if (!value.some((item) => JSON.stringify(item) === JSON.stringify(needle)))
                    throw new Error(msg ?? `Expected object including "${JSON.stringify(needle)}"`);
            }, "array", `includesObject(${JSON.stringify(needle)})`);
            return runner;
        },
        onlyHasObjects(msg) {
            add(() => {
                if (!value.every((item) => typeof item === "object" &&
                    item !== null &&
                    !Array.isArray(item)))
                    throw new Error(msg ?? "Expected all objects");
            }, "array", "onlyHasObjects");
            return runner;
        },
        onlyHasStrings(msg) {
            add(() => {
                if (!value.every((item) => typeof item === "string"))
                    throw new Error(msg ?? "Expected all strings");
            }, "array", "onlyHasStrings");
            return runner;
        },
        onlyHasNumbers(msg) {
            add(() => {
                if (!value.every((item) => typeof item === "number"))
                    throw new Error(msg ?? "Expected all numbers");
            }, "array", "onlyHasNumbers");
            return runner;
        },
        everyIsFalsy(msg) {
            add(() => {
                if (!value.every((item) => !item))
                    throw new Error(msg ?? "Expected all falsy");
            }, "array", "everyIsFalsy");
            return runner;
        },
        everyIsTruthy(msg) {
            add(() => {
                if (!value.every((item) => !!item))
                    throw new Error(msg ?? "Expected all truthy");
            }, "array", "everyIsTruthy");
            return runner;
        },
        includesCondition(needle, msg) {
            add(() => {
                if (!value.some(needle))
                    throw new Error(msg ?? "Expected array to include condition");
            }, "array", "includesCondition");
            return runner;
        },
    });
    const toObjectChain = () => Object.assign(runner, {
        hasKey(key, msg) {
            add(() => {
                if (!(key in value))
                    throw new Error(msg ?? `Expected key "${key}"`);
            }, "object", `hasKey("${key}")`);
            return runner;
        },
        hasKeys(...keys) {
            add(() => {
                for (const k of keys)
                    if (!(k in value))
                        throw new Error(`Expected key "${k}"`);
            }, "object", `hasKeys(${keys.map((k) => `"${k}"`).join(",")})`);
            return runner;
        },
        keyEquals(key, expected, msg) {
            add(() => {
                if (value[key] !== expected)
                    throw new Error(msg ?? `Expected ${key} === ${String(expected)}`);
            }, "object", `keyEquals("${key}",${JSON.stringify(expected)})`);
            return runner;
        },
        sameKeys(expected, msg) {
            add(() => {
                const a = Object.keys(value);
                const b = Object.keys(expected);
                if (a.length !== b.length)
                    throw new Error(msg ?? "Key count mismatch");
                for (const k of b)
                    if (!(k in value))
                        throw new Error(msg ?? `Missing key "${k}"`);
            }, "object", "sameKeys");
            return runner;
        },
        allKeysFalsy(msg) {
            add(() => {
                for (const k in value)
                    if (value[k])
                        throw new Error(msg ?? `Key "${k}" not falsy`);
            }, "object", "allKeysFalsy");
            return runner;
        },
        allKeysSet(msg) {
            add(() => {
                for (const k in value)
                    if (value[k] === undefined)
                        throw new Error(msg ?? `Key "${k}" unset`);
            }, "object", "allKeysSet");
            return runner;
        },
        anyKeyNull(msg) {
            add(() => {
                let f = false;
                for (const k in value)
                    if (value[k] === null) {
                        f = true;
                        break;
                    }
                if (!f)
                    throw new Error(msg ?? "No null key");
            }, "object", "anyKeyNull");
            return runner;
        },
    });
    const toElementChain = () => Object.assign(runner, {
        hasChildren(msg) {
            add(() => {
                const e = value;
                if (typeof Element === "undefined" ||
                    !(e instanceof Element) ||
                    e.childElementCount === 0)
                    throw new Error(msg ?? "Expected child elements");
            }, "element", "hasChildren");
            return runner;
        },
        hasChild(msg) {
            add(() => {
                const e = value;
                if (typeof Element === "undefined" ||
                    !(e instanceof Element) ||
                    e.childElementCount === 0)
                    throw new Error(msg ?? "Expected child elements");
            }, "element", "hasChild");
            return runner;
        },
        hasChildMatching(sel, msg) {
            add(() => {
                const e = value;
                if (typeof Element === "undefined" ||
                    !(e instanceof Element) ||
                    !e.querySelector(sel))
                    throw new Error(msg ?? `Missing child "${sel}"`);
            }, "element", `hasChildMatching("${sel}")`);
            return runner;
        },
        hasDescendant(sel, msg) {
            add(() => {
                const e = value;
                if (typeof Element === "undefined" ||
                    !(e instanceof Element) ||
                    !e.querySelector(sel))
                    throw new Error(msg ?? `Missing descendant "${sel}"`);
            }, "element", `hasDescendant("${sel}")`);
            return runner;
        },
        hasAttribute(name, msg) {
            add(() => {
                const e = value;
                if (typeof Element === "undefined" ||
                    !(e instanceof Element) ||
                    !e.hasAttribute(name))
                    throw new Error(msg ?? `Missing attribute "${name}"`);
            }, "element", `hasAttribute("${name}")`);
            return runner;
        },
        attributeEquals(name, expected, msg) {
            add(() => {
                const e = value;
                if (typeof Element === "undefined" ||
                    !(e instanceof Element) ||
                    e.getAttribute(name) !== expected)
                    throw new Error(msg ?? `Attr "${name}" != "${expected}"`);
            }, "element", `attributeEquals("${name}","${expected}")`);
            return runner;
        },
    });
    // Type guards (only on unknown)
    /**
     * Narrow to a number primitive and unlock number-specific chain methods
     * like greaterThan, between, etc. Pick a primitive guard first, then add
     * further checks.
     * Example: that(x).isNumber().between(0, 100).commit()
     * @param msg Optional error message if value is not a number.
     */
    runner.isNumber = (msg) => {
        add(() => {
            if (typeof value !== "number")
                throw new Error(msg ?? "Expected number");
        }, "number", "isNumber");
        return toNumberChain();
    };
    /**
     * Narrow to a string primitive and unlock string-specific chain methods
     * like notEmpty, contains, startsWith, matches, etc.
     * Example: that(name).isString().minLength(2).commit()
     * @param msg Optional error message if value is not a string.
     */
    runner.isString = (msg) => {
        add(() => {
            if (typeof value !== "string")
                throw new Error(msg ?? "Expected string");
        }, "string", "isString");
        return toStringChain();
    };
    /**
     * Narrow to an array and unlock array-specific chain methods like
     * notEmpty, hasLength, itemIsString, onlyHasNumbers, etc.
     * @param msg Optional error message if value is not an array.
     */
    runner.isArray = (msg) => {
        add(() => {
            if (!Array.isArray(value))
                throw new Error(msg ?? "Expected array");
        }, "array", "isArray");
        return toArrayChain();
    };
    /**
     * Narrow to a plain object (non-null, non-array) and unlock object
     * chain methods like hasKey, hasKeys, keyEquals, sameKeys, etc.
     * @param msg Optional error message if value is not an object.
     */
    runner.isObject = (msg) => {
        add(() => {
            if (typeof value !== "object" || value === null || Array.isArray(value))
                throw new Error(msg ?? "Expected object");
        }, "object", "isObject");
        return toObjectChain();
    };
    /**
     * Narrow to a DOM Element and unlock element chain methods like
     * hasChild, hasAttribute, attributeEquals, etc.
     * @param msg Optional error message if value is not a DOM Element.
     */
    runner.isElement = (msg) => {
        add(() => {
            if (typeof Element === "undefined" ||
                !(value instanceof Element))
                throw new Error(msg ?? "Expected Element");
        }, "element", "isElement");
        return toElementChain();
    };
    // Date guard and chain
    /**
     * Narrow to a Date instance and unlock datetime chain methods like
     * earlier, later, isYear, daysSinceAtLeast, etc.
     * @param msg Optional error message if value is not a Date.
     */
    runner.isDate = (msg) => {
        add(() => {
            if (!(value instanceof Date))
                throw new Error(msg ?? "Expected Date instance");
        }, "datetime", "isDate");
        return toDateChain();
    };
    /**
     * Narrow to a boolean.
     * @param msg Optional error message if value is not a boolean.
     */
    runner.isBoolean = (msg) => {
        add(() => {
            if (typeof value !== "boolean")
                throw new Error(msg ?? "Expected boolean");
        }, "boolean", "isBoolean");
        return runner;
    };
    // Nullish guards producing terminal states
    /**
     * Assert the value is exactly null.
     * @param msg Optional error message.
     */
    runner.isNull = (msg) => {
        add(() => {
            if (value !== null)
                throw new Error(msg ?? "Expected null");
        }, "null", "isNull");
        return runner;
    };
    /**
     * Assert the value is exactly undefined.
     * @param msg Optional error message.
     */
    runner.isUndefined = (msg) => {
        add(() => {
            if (value !== undefined)
                throw new Error(msg ?? "Expected undefined");
        }, "undefined", "isUndefined");
        return runner;
    };
    // Non‑nullish guards that KEEP other type guards (move to 'present')
    /**
     * Assert the value is present (not null and not undefined) while
     * preserving other possible type guards on the chain.
     * @param msg Optional error message.
     */
    runner.notNil = (msg) => {
        add(() => {
            if (value === null || value === undefined)
                throw new Error(msg ?? "Expected value (not null/undefined)");
        }, "present", "notNil");
        return runner;
    };
    /**
     * Assert the value is not null while preserving other possible type guards.
     * @param msg Optional error message.
     */
    runner.notNull = (msg) => {
        add(() => {
            if (value === null)
                throw new Error(msg ?? "Expected not null");
        }, "present", "notNull");
        return runner;
    };
    /**
     * Assert the value is present (not null or undefined) while preserving
     * other possible type guards.
     * @param msg Optional error message.
     */
    runner.notNullOrUndefined = (msg) => {
        add(() => {
            if (value === null || value === undefined)
                throw new Error(msg ?? "Expected value (not null/undefined)");
        }, "present", "notNullOrUndefined");
        return runner;
    };
    return runner;
    // Local builders
    function toDateChain() {
        return Object.assign(runner, {
            earlier(than, msg) {
                add(() => {
                    const v = value.getTime();
                    const t = typeof than === "number" ? than : than.getTime();
                    if (!(v < t))
                        throw new Error(msg ?? `Expected earlier than ${new Date(t).toISOString()}`);
                }, "datetime", `earlier(${typeof than === "number" ? than : than.toISOString()})`);
                return runner;
            },
            later(than, msg) {
                add(() => {
                    const v = value.getTime();
                    const t = typeof than === "number" ? than : than.getTime();
                    if (!(v > t))
                        throw new Error(msg ?? `Expected later than ${new Date(t).toISOString()}`);
                }, "datetime", `later(${typeof than === "number" ? than : than.toISOString()})`);
                return runner;
            },
            isYear(year, msg) {
                add(() => {
                    const y = value.getFullYear();
                    if (y !== year)
                        throw new Error(msg ?? `Expected year ${year}`);
                }, "datetime", `isYear(${year})`);
                return runner;
            },
            wasBefore(than, msg) {
                add(() => {
                    const v = value.getTime();
                    const t = typeof than === "number" ? than : than.getTime();
                    if (!(v < t))
                        throw new Error(msg ?? `Expected before ${new Date(t).toISOString()}`);
                }, "datetime", `wasBefore(${typeof than === "number" ? than : than.toISOString()})`);
                return runner;
            },
            daysAgoExceeds(n, msg) {
                add(() => {
                    const now = Date.now();
                    const then = value.getTime();
                    const days = (now - then) / (1000 * 60 * 60 * 24);
                    if (!(days > n))
                        throw new Error(msg ?? `Expected more than ${n} days ago`);
                }, "datetime", `daysAgoExceeds(${n})`);
                return runner;
            },
            daysSinceAtLeast(n, msg) {
                add(() => {
                    const now = Date.now();
                    const then = value.getTime();
                    const days = (now - then) / (1000 * 60 * 60 * 24);
                    if (!(days >= n))
                        throw new Error(msg ?? `Expected at least ${n} days since`);
                }, "datetime", `daysSinceAtLeast(${n})`);
                return runner;
            },
        });
    }
}
// Main exported functions
export function that(value) {
    return createAssumption(value);
}
// Single-use assertion: accepts a condition or a zero-arg function (including a chain)
// - If passed a function with .value(), we'll call .value() to trigger rich AssumptionError on failure
// - Else we invoke the function and throw when it returns false
// - If passed a non-function, we assert its truthiness
export function assume(value) {
    return createAssumption(value);
}
// History management
export function getAssumeHistory() {
    return ASSUME_HISTORY.slice();
}
export function clearAssumeHistory() {
    ASSUME_HISTORY.length = 0;
}
export function setAssumeHistoryLimit(n) {
    ASSUME_HISTORY_LIMIT = Math.max(0, n | 0);
}
function getFnName(fn) {
    return fn.displayName || fn.name || "anonymous";
}
function enrichWithHandlerName(err, handler) {
    const name = getFnName(handler);
    if (err && typeof err === "object") {
        try {
            // attach meta
            err.handlerName = name;
            // prefix message for visibility
            if (err.message && typeof err.message === "string") {
                err.message = `[${name}] ${err.message}`;
            }
        }
        catch {
            /* ignore */
        }
    }
    return err;
}
/**
 * Create a default refute handler for synchronous code.
 * @param def Default value to return when an error occurs.
 * @param log When true, logs to console; or provide a custom logger function.
 */
export function defRefHandler(def, log = false) {
    return (err) => {
        console.error(err);
        enrichWithHandlerName(err, defRefHandler);
        if (log)
            (typeof log === "function" ? log : console.error)(err);
        // Always return default - don't re-throw
        return def;
    };
}
/**
 * Create a default refute handler for asynchronous code.
 * @param def Default resolved value to return when an error occurs.
 * @param log When true, logs to console; or provide a custom logger function.
 */
export function defRefHandlerAsync(def, log = false) {
    return async (err) => {
        enrichWithHandlerName(err, defRefHandlerAsync);
        console.error(err);
        if (log)
            (typeof log === "function" ? log : console.error)(err);
        return def;
    };
}
/**
 * assumedRoute wraps a handler and ensures any assumption errors (or other errors)
 * are caught and converted into a safe default return value. It always uses the
 * built-in default refute handlers (defRefHandler/defRefHandlerAsync) so callers
 * don't need to wire custom callbacks.
 *
 * Usage:
 *   const safe = assumedRoute(0, (a: number, b: number) => that(a).isNumber().commit() + b);
 *   const result = safe(1, 2); // 3 or 0 when assumptions fail
 *
 * For async handlers, pass the resolved default value:
 *   const safeAsync = assumedRoute({ ok: false }, async (id: string) => {
 *     await that(id).isString().minLength(3).commit();
 *     return fetchThing(id);
 *   });
 *
 *   const r = await safeAsync("x"); // => { ok: false } if assumptions fail
 */
export function assumedRoute(def, handler, log = false) {
    return (...args) => {
        try {
            const out = handler(...args);
            // Async path: attach a default-returning catch
            if (out && typeof out.then === "function") {
                const onErr = defRefHandlerAsync(def, log);
                return out.catch((e) => onErr(enrichWithHandlerName(e, handler)));
            }
            // Sync path: just return
            return out;
        }
        catch (e) {
            // If the handler is an async function and threw before returning a Promise,
            // return a Promise of the default value using the async refute handler.
            const isAsyncFn = handler?.constructor?.name === "AsyncFunction";
            if (isAsyncFn) {
                const onErrAsync = defRefHandlerAsync(def, log);
                return onErrAsync(enrichWithHandlerName(e, handler));
            }
            const onErr = defRefHandler(def, log);
            return onErr(enrichWithHandlerName(e, handler));
        }
    };
}
// ============================================================================
// MINIMAL ASSERT HELPERS (alongside fluent chains)
// ----------------------------------------------------------------------------
// These helpers provide TypeScript `asserts`-style narrowing with minimal
// runtime work by reusing the fluent chain checks. They throw if the
// assumption fails; otherwise they are no-ops.
// ----------------------------------------------------------------------------
/** @internal Asserts the value is a string at runtime and for TypeScript. */
export function assertIsString(v, msg) {
    // Will throw on failure; no-op on success
    assuming(that(v).isString(), msg);
}
/** @internal Asserts the value is a number at runtime and for TypeScript. */
export function assertIsNumber(v, msg) {
    assuming(that(v).isNumber(), msg);
}
/** @internal Asserts the value is an array at runtime and for TypeScript. */
export function assertIsArray(v, msg) {
    assuming(that(v).isArray(), msg);
}
/** @internal Asserts the value is a plain object (non-null, non-array). */
export function assertIsObject(v, msg) {
    assuming(that(v).isObject(), msg);
}
/** @internal Asserts the value is a DOM Element. */
export function assertIsElement(v, msg) {
    assuming(that(v).isElement(), msg);
}
/** @internal Asserts the value is a boolean. */
export function assertIsBoolean(v, msg) {
    assuming(that(v).isBoolean(), msg);
}
/** @internal Asserts the value is a Date instance. */
export function assertIsDate(v, msg) {
    assuming(that(v).isDate(), msg);
}
/** @internal Asserts the value is null. Useful for explicit null checks. */
export function assertIsNull(v, msg) {
    assuming(that(v).isNull(), msg);
}
/** @internal Asserts the value is not null. */
export function assertNotNull(v, msg) {
    assuming(that(v).notNull(), msg);
}
/** @internal Asserts the value is undefined. */
export function assertIsUndefined(v, msg) {
    assuming(that(v).isUndefined(), msg);
}
/** @internal Asserts the value is not undefined. */
export function assertNotUndefined(v, msg) {
    // We reuse notNullOrUndefined to keep behavior consistent
    assuming(that(v).notNullOrUndefined(), msg);
}
/** @internal Asserts the value is neither null nor undefined. */
export function assertNotNullOrUndefined(v, msg) {
    assuming(that(v).notNullOrUndefined(), msg);
}
/** @internal Asserts the code path is unreachable (useful for exhaustive switches). */
export function assertNever(x, msg) {
    throw new Error(msg ?? `Unexpected value: ${String(x)}`);
}
// PascalCase aliases for ergonomic use where preferred
export const IsString = assertIsString;
export const IsNumber = assertIsNumber;
export const IsArray = assertIsArray;
export const IsObject = assertIsObject;
export const IsElement = assertIsElement;
export const IsBoolean = assertIsBoolean;
export const IsDate = assertIsDate;
export const IsNull = assertIsNull;
export const NotNull = assertNotNull;
export const IsUndefined = assertIsUndefined;
export const NotUndefined = assertNotUndefined;
export const NotNullOrUndefined = assertNotNullOrUndefined;
// Themed public-facing aliases (avoid "assert" in userland API)
export const assureString = assertIsString;
export const assureNumber = assertIsNumber;
export const assureArray = assertIsArray;
export const assureObject = assertIsObject;
export const assureElement = assertIsElement;
export const assureBoolean = assertIsBoolean;
export const assureDate = assertIsDate;
export const assureNull = assertIsNull;
export const assureNotNull = assertNotNull;
export const assureUndefined = assertIsUndefined;
export const assureNotUndefined = assertNotUndefined;
export const assurePresent = assertNotNullOrUndefined;
// ----------------------------------------------------------------------------
// Targeted string helpers
// ----------------------------------------------------------------------------
export function assertStringNotEmpty(v, msg) {
    assuming(that(v).isString().notEmpty(), msg);
}
export function assertStringHasLength(v, len, msg) {
    assuming(that(v).isString().hasLength(len), msg);
}
export function assertStringMinLength(v, n, msg) {
    assuming(that(v).isString().minLength(n), msg);
}
export function assertStringMaxLength(v, n, msg) {
    assuming(that(v).isString().maxLength(n), msg);
}
export function assertStringLengthBetween(v, min, max, msg) {
    assuming(that(v).isString().lengthBetween(min, max), msg);
}
export function assertStringContains(v, needle, msg) {
    assuming(that(v).isString().contains(needle), msg);
}
export function assertStringStartsWith(v, prefix, msg) {
    assuming(that(v).isString().startsWith(prefix), msg);
}
export function assertStringEndsWith(v, suffix, msg) {
    assuming(that(v).isString().endsWith(suffix), msg);
}
export function assertStringMatches(v, re, msg) {
    assuming(that(v).isString().matches(re), msg);
}
export function assertStringEqualsIgnoreCase(v, expected, msg) {
    assuming(that(v).isString().equalsIgnoreCase(expected), msg);
}
export function assertStringIncludesAny(v, needles, msg) {
    assuming(that(v)
        .isString()
        .includesAny(...needles), msg);
}
export function assertStringIncludesAll(v, needles, msg) {
    assuming(that(v)
        .isString()
        .includesAll(...needles), msg);
}
export function assertStringIsJSON(v, msg) {
    assuming(that(v).isString().isJSON(), msg);
}
/** Assert a string is one of the provided options. */
export function assertStringOneOf(v, options, msg) {
    assuming(that(v)
        .isString()
        .that((s) => options.includes(s), msg ?? `Expected one of [${options.join(", ")}]`), msg);
}
/**
 * Assert a string equals the expected value, optionally ignoring whitespace.
 * When ignoreAllWhitespace is true, all whitespace is removed before comparing; otherwise strings are trimmed.
 */
export function assertStringEqualsIgnoreWhitespace(v, expected, ignoreAllWhitespace = false, msg) {
    assuming(that(v)
        .isString()
        .that((s) => {
        const norm = (x) => ignoreAllWhitespace ? x.replace(/\s+/g, "") : x.trim();
        return norm(s) === norm(expected);
    }, msg ??
        `Expected string to equal (ignoring ${ignoreAllWhitespace ? "all whitespace" : "edges"})`), msg);
}
/** Assert the value is a Base64 string (basic RFC4648, non-URL-safe). */
export function isBase64(v, msg) {
    const re = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    assuming(that(v)
        .isString()
        .that((s) => re.test(s), msg ?? "Expected Base64 string"), msg);
}
// Alias for naming consistency with other assert* helpers
export const assertIsBase64 = isBase64;
// ----------------------------------------------------------------------------
// Targeted array helpers
// ----------------------------------------------------------------------------
export function assertArrayNotEmpty(v, msg) {
    assuming(that(v).isArray().notEmpty(), msg);
}
export function assertArrayHasLength(v, len, msg) {
    assuming(that(v).isArray().hasLength(len), msg);
}
export function assertArrayHasAnyOf(v, items, msg) {
    assuming(that(v).isArray().hasAnyOf(items), msg);
}
export function assertArrayHasEveryOf(v, items, msg) {
    assuming(that(v).isArray().hasEveryOf(items), msg);
}
export function assertArrayItemIsBoolean(v, index, msg) {
    assuming(that(v).isArray().itemIsBoolean(index), msg);
}
export function assertArrayItemIsString(v, index, msg) {
    assuming(that(v).isArray().itemIsString(index), msg);
}
export function assertArrayItemIsNumber(v, index, msg) {
    assuming(that(v).isArray().itemIsNumber(index), msg);
}
export function assertArrayItemIsObject(v, index, msg) {
    assuming(that(v).isArray().itemIsObject(index), msg);
}
export function assertArrayIncludesString(v, needle, msg) {
    assuming(that(v).isArray().includesString(needle), msg);
}
export function assertArrayIncludesNumber(v, needle, msg) {
    assuming(that(v).isArray().includesNumber(needle), msg);
}
export function assertArrayIncludesObject(v, needle, msg) {
    assuming(that(v).isArray().includesObject(needle), msg);
}
export function assertArrayOnlyStrings(v, msg) {
    assuming(that(v).isArray().onlyHasStrings(), msg);
}
export function assertArrayOnlyNumbers(v, msg) {
    assuming(that(v).isArray().onlyHasNumbers(), msg);
}
export function assertArrayOnlyObjects(v, msg) {
    assuming(that(v).isArray().onlyHasObjects(), msg);
}
export function assertArrayEveryTruthy(v, msg) {
    assuming(that(v).isArray().everyIsTruthy(), msg);
}
export function assertArrayEveryFalsy(v, msg) {
    assuming(that(v).isArray().everyIsFalsy(), msg);
}
// ----------------------------------------------------------------------------
// Targeted object helpers
// ----------------------------------------------------------------------------
export function assertObjectHasKey(obj, key, msg) {
    assuming(that(obj).isObject().hasKey(key), msg);
}
export function assertObjectHasKeys(obj, keys, msg) {
    assuming(that(obj)
        .isObject()
        .hasKeys(...keys), msg);
}
export function assertObjectKeyEquals(obj, key, expected, msg) {
    assuming(that(obj).isObject().keyEquals(key, expected), msg);
}
// Make all keys required and exclude `undefined` from their types
export function assertObjectAllKeysSet(obj, msg) {
    assuming(that(obj).isObject().allKeysSet(), msg);
}
export function assertObjectAnyKeyNull(obj, msg) {
    assuming(that(obj).isObject().anyKeyNull(), msg);
}
/** Object keys must match exactly the provided list (no missing, no extra). */
export function assertObjectKeysExactly(obj, keys, msg) {
    const expected = Object.fromEntries(keys.map((k) => [k, true]));
    // Reuse sameKeys which compares key sets
    assuming(that(obj).isObject().sameKeys(expected), msg);
}
/** Assert an element is a child/descendant of a given parent (Element or selector). */
export function assertElementIsChildOf(el, parent, msg) {
    assuming(that(el)
        .isElement()
        .that((e) => {
        const elem = e;
        if (typeof parent === "string") {
            return !!elem.closest(parent);
        }
        let cur = elem;
        while (cur) {
            if (cur === parent)
                return true;
            cur = cur.parentElement;
        }
        return false;
    }, msg ?? "Expected element to be a descendant of parent"), msg);
}
// Themed aliases for targeted helpers
export const assureStringNotEmpty = assertStringNotEmpty;
export const assureStringHasLength = assertStringHasLength;
export const assureStringMinLength = assertStringMinLength;
export const assureStringMaxLength = assertStringMaxLength;
export const assureStringLengthBetween = assertStringLengthBetween;
export const assureStringContains = assertStringContains;
export const assureStringStartsWith = assertStringStartsWith;
export const assureStringEndsWith = assertStringEndsWith;
export const assureStringMatches = assertStringMatches;
export const assureStringEqualsIgnoreCase = assertStringEqualsIgnoreCase;
export const assureStringIncludesAny = assertStringIncludesAny;
export const assureStringIncludesAll = assertStringIncludesAll;
export const assureStringIsJSON = assertStringIsJSON;
export const assureStringTrimmedNotEmpty = assertStringTrimmedNotEmpty;
export const assureStringOneOf = assertStringOneOf;
export const assureStringEqualsIgnoreWhitespace = assertStringEqualsIgnoreWhitespace;
export const assureArrayNotEmpty = assertArrayNotEmpty;
export const assureArrayHasLength = assertArrayHasLength;
export const assureArrayHasAnyOf = assertArrayHasAnyOf;
export const assureArrayHasEveryOf = assertArrayHasEveryOf;
export const assureArrayItemIsBoolean = assertArrayItemIsBoolean;
export const assureArrayItemIsString = assertArrayItemIsString;
export const assureArrayItemIsNumber = assertArrayItemIsNumber;
export const assureArrayItemIsObject = assertArrayItemIsObject;
export const assureArrayIncludesString = assertArrayIncludesString;
export const assureArrayIncludesNumber = assertArrayIncludesNumber;
export const assureArrayIncludesObject = assertArrayIncludesObject;
export const assureArrayOnlyStrings = assertArrayOnlyStrings;
export const assureArrayOnlyNumbers = assertArrayOnlyNumbers;
export const assureArrayOnlyObjects = assertArrayOnlyObjects;
export const assureArrayEveryTruthy = assertArrayEveryTruthy;
export const assureArrayEveryFalsy = assertArrayEveryFalsy;
export const assureArrayUnique = assertArrayUnique;
export const assureObjectHasKey = assertObjectHasKey;
export const assureObjectHasKeys = assertObjectHasKeys;
export const assureObjectKeyEquals = assertObjectKeyEquals;
export const assureObjectAllKeysSet = assertObjectAllKeysSet;
export const assureObjectAnyKeyNull = assertObjectAnyKeyNull;
export const assureObjectKeysExactly = assertObjectKeysExactly;
// ----------------------------------------------------------------------------
// Extra targeted convenience helpers
// ----------------------------------------------------------------------------
/** Assert a string is non-empty after trimming whitespace. */
export function assertStringTrimmedNotEmpty(v, msg) {
    assuming(that(v)
        .isString()
        .that((s) => s.trim().length > 0, msg ?? "Expected non-empty (trimmed)"), msg);
}
/** Assert an array has all unique items (===) */
export function assertArrayUnique(v, msg) {
    assuming(that(v)
        .isArray()
        .that((arr) => new Set(arr).size === arr.length, msg ?? "Expected array items to be unique"), msg);
}
// ----------------------------------------------------------------------------
// Value-returning "expect" helpers (assert + return the value)
// ----------------------------------------------------------------------------
export function expectString(v, msg) {
    assertIsString(v, msg);
    return v;
}
export function expectNumber(v, msg) {
    assertIsNumber(v, msg);
    return v;
}
export function expectArray(v, msg) {
    assertIsArray(v, msg);
    return v;
}
export function expectObject(v, msg) {
    assertIsObject(v, msg);
    return v;
}
export function expectBoolean(v, msg) {
    assertIsBoolean(v, msg);
    return v;
}
export function expectDate(v, msg) {
    assertIsDate(v, msg);
    return v;
}
export function expectElement(v, msg) {
    assertIsElement(v, msg);
    return v;
}
export function expectNotNullOrUndefined(v, msg) {
    assertNotNullOrUndefined(v, msg);
    return v;
}
// ----------------------------------------------------------------------------
// "sure" aliases and bound closures (nomenclature alternatives)
// ----------------------------------------------------------------------------
// Some users prefer the word "sure" over "assure". To support that taste
// without breaking changes, we expose two forms:
// 1) Immediate assertions (aliases) — same as assure*/assert* but named sure*
// 2) Bound closures (sureIs*) — produce a zero-arg function that defers the
//    assertion until called, ideal for assuming(sureIsString(value)).
// 1) Immediate assertion aliases
export const sureString = assertIsString;
export const sureNumber = assertIsNumber;
export const sureArray = assertIsArray;
export const sureObject = assertIsObject;
export const sureElement = assertIsElement;
export const sureBoolean = assertIsBoolean;
export const sureDate = assertIsDate;
export const sureNull = assertIsNull;
export const sureNotNull = assertNotNull;
export const sureUndefined = assertIsUndefined;
export const sureNotUndefined = assertNotUndefined;
export const surePresent = assertNotNullOrUndefined;
// Targeted string aliases
export const sureStringNotEmpty = assertStringNotEmpty;
export const sureStringHasLength = assertStringHasLength;
export const sureStringMinLength = assertStringMinLength;
export const sureStringMaxLength = assertStringMaxLength;
export const sureStringLengthBetween = assertStringLengthBetween;
export const sureStringContains = assertStringContains;
export const sureStringStartsWith = assertStringStartsWith;
export const sureStringEndsWith = assertStringEndsWith;
export const sureStringMatches = assertStringMatches;
export const sureStringEqualsIgnoreCase = assertStringEqualsIgnoreCase;
export const sureStringIncludesAny = assertStringIncludesAny;
export const sureStringIncludesAll = assertStringIncludesAll;
export const sureStringIsJSON = assertStringIsJSON;
export const sureStringTrimmedNotEmpty = assertStringTrimmedNotEmpty;
export const sureStringOneOf = assertStringOneOf;
export const sureStringEqualsIgnoreWhitespace = assertStringEqualsIgnoreWhitespace;
// Targeted array/object aliases
export const sureArrayNotEmpty = assertArrayNotEmpty;
export const sureArrayHasLength = assertArrayHasLength;
export const sureArrayHasAnyOf = assertArrayHasAnyOf;
export const sureArrayHasEveryOf = assertArrayHasEveryOf;
export const sureArrayItemIsBoolean = assertArrayItemIsBoolean;
export const sureArrayItemIsString = assertArrayItemIsString;
export const sureArrayItemIsNumber = assertArrayItemIsNumber;
export const sureArrayItemIsObject = assertArrayItemIsObject;
export const sureArrayIncludesString = assertArrayIncludesString;
export const sureArrayIncludesNumber = assertArrayIncludesNumber;
export const sureArrayIncludesObject = assertArrayIncludesObject;
export const sureArrayOnlyStrings = assertArrayOnlyStrings;
export const sureArrayOnlyNumbers = assertArrayOnlyNumbers;
export const sureArrayOnlyObjects = assertArrayOnlyObjects;
export const sureArrayEveryTruthy = assertArrayEveryTruthy;
export const sureArrayEveryFalsy = assertArrayEveryFalsy;
export const sureArrayUnique = assertArrayUnique;
export const sureObjectHasKey = assertObjectHasKey;
export const sureObjectHasKeys = assertObjectHasKeys;
export const sureObjectKeyEquals = assertObjectKeyEquals;
export const sureObjectAllKeysSet = assertObjectAllKeysSet;
export const sureObjectAnyKeyNull = assertObjectAnyKeyNull;
export const sureObjectKeysExactly = assertObjectKeysExactly;
export const sureElementIsChildOf = assertElementIsChildOf;
// 2) Bound closures for assuming(...)
// Usage: assuming(sureIsString(name), sureNotNull(user))
export const sureIsString = (v, msg) => () => assertIsString(v, msg);
export const sureIsNumber = (v, msg) => () => assertIsNumber(v, msg);
export const sureIsArray = (v, msg) => () => assertIsArray(v, msg);
export const sureIsObject = (v, msg) => () => assertIsObject(v, msg);
export const sureIsElement = (v, msg) => () => assertIsElement(v, msg);
export const sureIsBoolean = (v, msg) => () => assertIsBoolean(v, msg);
export const sureIsDate = (v, msg) => () => assertIsDate(v, msg);
export const sureIsNull = (v, msg) => () => assertIsNull(v, msg);
export const sureIsUndefined = (v, msg) => () => assertIsUndefined(v, msg);
export const sureNotNil = (v, msg) => () => assertNotNullOrUndefined(v, msg);
export const sureNotNullBound = (v, msg) => () => assertNotNull(v, msg);
export const sureNotUndefinedBound = (v, msg) => () => assertNotUndefined(v, msg);
// ----------------------------------------------------------------------------
// "mustBe" aliases and closure object (even simpler naming)
// ----------------------------------------------------------------------------
// Immediate assertion aliases
export const mustBeString = assertIsString;
export const mustBeNumber = assertIsNumber;
export const mustBeArray = assertIsArray;
export const mustBeObject = assertIsObject;
export const mustBeElement = assertIsElement;
export const mustBeBoolean = assertIsBoolean;
export const mustBeDate = assertIsDate;
export const mustBeNull = assertIsNull;
export const mustBeUndefined = assertIsUndefined;
export const mustBePresent = assertNotNullOrUndefined;
// Friendlier naming for "present"
export const mustExists = assertNotNullOrUndefined;
export const mustExist = assertNotNullOrUndefined;
// Targeted immediate aliases
export const mustBeStringNotEmpty = assertStringNotEmpty;
export const mustBeStringHasLength = assertStringHasLength;
export const mustBeStringMinLength = assertStringMinLength;
export const mustBeStringMaxLength = assertStringMaxLength;
export const mustBeStringLengthBetween = assertStringLengthBetween;
export const mustBeStringContains = assertStringContains;
export const mustBeStringStartsWith = assertStringStartsWith;
export const mustBeStringEndsWith = assertStringEndsWith;
export const mustBeStringMatches = assertStringMatches;
export const mustBeStringEqualsIgnoreCase = assertStringEqualsIgnoreCase;
export const mustBeStringIncludesAny = assertStringIncludesAny;
export const mustBeStringIncludesAll = assertStringIncludesAll;
export const mustBeStringIsJSON = assertStringIsJSON;
export const mustBeStringTrimmedNotEmpty = assertStringTrimmedNotEmpty;
export const mustBeStringOneOf = assertStringOneOf;
export const mustBeStringEqualsIgnoreWhitespace = assertStringEqualsIgnoreWhitespace;
export const mustBeArrayNotEmpty = assertArrayNotEmpty;
export const mustBeArrayHasLength = assertArrayHasLength;
export const mustBeArrayHasAnyOf = assertArrayHasAnyOf;
export const mustBeArrayHasEveryOf = assertArrayHasEveryOf;
export const mustBeArrayItemIsBoolean = assertArrayItemIsBoolean;
export const mustBeArrayItemIsString = assertArrayItemIsString;
export const mustBeArrayItemIsNumber = assertArrayItemIsNumber;
export const mustBeArrayItemIsObject = assertArrayItemIsObject;
export const mustBeArrayIncludesString = assertArrayIncludesString;
export const mustBeArrayIncludesNumber = assertArrayIncludesNumber;
export const mustBeArrayIncludesObject = assertArrayIncludesObject;
export const mustBeArrayOnlyStrings = assertArrayOnlyStrings;
export const mustBeArrayOnlyNumbers = assertArrayOnlyNumbers;
export const mustBeArrayOnlyObjects = assertArrayOnlyObjects;
export const mustBeArrayEveryTruthy = assertArrayEveryTruthy;
export const mustBeArrayEveryFalsy = assertArrayEveryFalsy;
export const mustBeArrayUnique = assertArrayUnique;
export const mustBeObjectHasKey = assertObjectHasKey;
export const mustBeObjectHasKeys = assertObjectHasKeys;
export const mustBeObjectKeyEquals = assertObjectKeyEquals;
export const mustBeObjectAllKeysSet = assertObjectAllKeysSet;
export const mustBeObjectAnyKeyNull = assertObjectAnyKeyNull;
export const mustBeObjectKeysExactly = assertObjectKeysExactly;
export const mustBeElementIsChildOf = assertElementIsChildOf;
// Closure factory object for use with assuming(...)
export const mustBe = {
    string: (v, msg) => () => assertIsString(v, msg),
    number: (v, msg) => () => assertIsNumber(v, msg),
    array: (v, msg) => () => assertIsArray(v, msg),
    object: (v, msg) => () => assertIsObject(v, msg),
    element: (v, msg) => () => assertIsElement(v, msg),
    boolean: (v, msg) => () => assertIsBoolean(v, msg),
    date: (v, msg) => () => assertIsDate(v, msg),
    null: (v, msg) => () => assertIsNull(v, msg),
    undefined: (v, msg) => () => assertIsUndefined(v, msg),
    present: (v, msg) => () => assertNotNullOrUndefined(v, msg),
    // Friendlier synonyms
    exist: (v, msg) => () => assertNotNullOrUndefined(v, msg),
    exists: (v, msg) => () => assertNotNullOrUndefined(v, msg),
    // targeted
    stringNotEmpty: (v, msg) => () => assertStringNotEmpty(v, msg),
    stringHasLength: (v, len, msg) => () => assertStringHasLength(v, len, msg),
    stringMinLength: (v, n, msg) => () => assertStringMinLength(v, n, msg),
    stringMaxLength: (v, n, msg) => () => assertStringMaxLength(v, n, msg),
    stringLengthBetween: (v, min, max, msg) => () => assertStringLengthBetween(v, min, max, msg),
    stringContains: (v, needle, msg) => () => assertStringContains(v, needle, msg),
    stringStartsWith: (v, prefix, msg) => () => assertStringStartsWith(v, prefix, msg),
    stringEndsWith: (v, suffix, msg) => () => assertStringEndsWith(v, suffix, msg),
    stringMatches: (v, re, msg) => () => assertStringMatches(v, re, msg),
    stringEqualsIgnoreCase: (v, expected, msg) => () => assertStringEqualsIgnoreCase(v, expected, msg),
    stringIncludesAny: (v, needles, msg) => () => assertStringIncludesAny(v, needles, msg),
    stringIncludesAll: (v, needles, msg) => () => assertStringIncludesAll(v, needles, msg),
    stringIsJSON: (v, msg) => () => assertStringIsJSON(v, msg),
    stringTrimmedNotEmpty: (v, msg) => () => assertStringTrimmedNotEmpty(v, msg),
    stringOneOf: (v, options, msg) => () => assertStringOneOf(v, options, msg),
    stringEqualsIgnoreWhitespace: (v, expected, ignoreAllWhitespace, msg) => () => assertStringEqualsIgnoreWhitespace(v, expected, ignoreAllWhitespace, msg),
    arrayNotEmpty: (v, msg) => () => assertArrayNotEmpty(v, msg),
    arrayHasLength: (v, len, msg) => () => assertArrayHasLength(v, len, msg),
    arrayHasAnyOf: (v, items, msg) => () => assertArrayHasAnyOf(v, items, msg),
    arrayHasEveryOf: (v, items, msg) => () => assertArrayHasEveryOf(v, items, msg),
    arrayItemIsBoolean: (v, index, msg) => () => assertArrayItemIsBoolean(v, index, msg),
    arrayItemIsString: (v, index, msg) => () => assertArrayItemIsString(v, index, msg),
    arrayItemIsNumber: (v, index, msg) => () => assertArrayItemIsNumber(v, index, msg),
    arrayItemIsObject: (v, index, msg) => () => assertArrayItemIsObject(v, index, msg),
    arrayIncludesString: (v, needle, msg) => () => assertArrayIncludesString(v, needle, msg),
    arrayIncludesNumber: (v, needle, msg) => () => assertArrayIncludesNumber(v, needle, msg),
    arrayIncludesObject: (v, needle, msg) => () => assertArrayIncludesObject(v, needle, msg),
    arrayOnlyStrings: (v, msg) => () => assertArrayOnlyStrings(v, msg),
    arrayOnlyNumbers: (v, msg) => () => assertArrayOnlyNumbers(v, msg),
    arrayOnlyObjects: (v, msg) => () => assertArrayOnlyObjects(v, msg),
    arrayEveryTruthy: (v, msg) => () => assertArrayEveryTruthy(v, msg),
    arrayEveryFalsy: (v, msg) => () => assertArrayEveryFalsy(v, msg),
    arrayUnique: (v, msg) => () => assertArrayUnique(v, msg),
    objectHasKey: (obj, key, msg) => () => assertObjectHasKey(obj, key, msg),
    objectHasKeys: (obj, keys, msg) => () => assertObjectHasKeys(obj, keys, msg),
    objectKeyEquals: (obj, key, expected, msg) => () => assertObjectKeyEquals(obj, key, expected, msg),
    objectAllKeysSet: (obj, msg) => () => assertObjectAllKeysSet(obj, msg),
    objectAnyKeyNull: (obj, msg) => () => assertObjectAnyKeyNull(obj, msg),
    objectKeysExactly: (obj, keys, msg) => () => assertObjectKeysExactly(obj, keys, msg),
    elementIsChildOf: (el, parent, msg) => () => assertElementIsChildOf(el, parent, msg),
};
// A lightweight, non-exhaustive catalog of unary assertions.
export const assertionsCatalog = [
    { name: "isString", check: (v) => assertIsString(v), category: "string" },
    {
        name: "stringNotEmpty",
        check: (v) => assertStringNotEmpty(v),
        category: "string",
    },
    {
        name: "stringIsJSON",
        check: (v) => assertStringIsJSON(v),
        category: "string",
    },
    {
        name: "stringTrimmedNotEmpty",
        check: (v) => assertStringTrimmedNotEmpty(v),
        category: "string",
    },
    { name: "isNumber", check: (v) => assertIsNumber(v), category: "number" },
    { name: "isArray", check: (v) => assertIsArray(v), category: "array" },
    {
        name: "arrayNotEmpty",
        check: (v) => assertArrayNotEmpty(v),
        category: "array",
    },
    {
        name: "arrayEveryTruthy",
        check: (v) => assertArrayEveryTruthy(v),
        category: "array",
    },
    {
        name: "arrayEveryFalsy",
        check: (v) => assertArrayEveryFalsy(v),
        category: "array",
    },
    {
        name: "arrayOnlyStrings",
        check: (v) => assertArrayOnlyStrings(v),
        category: "array",
    },
    {
        name: "arrayOnlyNumbers",
        check: (v) => assertArrayOnlyNumbers(v),
        category: "array",
    },
    {
        name: "arrayOnlyObjects",
        check: (v) => assertArrayOnlyObjects(v),
        category: "array",
    },
    {
        name: "arrayUnique",
        check: (v) => assertArrayUnique(v),
        category: "array",
    },
    { name: "isObject", check: (v) => assertIsObject(v), category: "object" },
    {
        name: "objectAllKeysSet",
        check: (v) => assertObjectAllKeysSet(v),
        category: "object",
    },
    {
        name: "objectAnyKeyNull",
        check: (v) => assertObjectAnyKeyNull(v),
        category: "object",
    },
    { name: "isBoolean", check: (v) => assertIsBoolean(v), category: "boolean" },
    { name: "isDate", check: (v) => assertIsDate(v), category: "date" },
    { name: "isElement", check: (v) => assertIsElement(v), category: "element" },
];
/** Run catalog assertions on a value, optionally filtered by names or RegExp. */
export function reportAssertions(v, filter) {
    const entries = !filter || filter.length === 0
        ? assertionsCatalog
        : assertionsCatalog.filter((e) => filter.some((f) => typeof f === "string" ? e.name === f : f.test(e.name)));
    return entries.map((e) => {
        try {
            e.check(v);
            return { name: e.name, passed: true };
        }
        catch (err) {
            return {
                name: e.name,
                passed: false,
                error: err instanceof Error ? err.message : String(err),
            };
        }
    });
}
/** Shorthand for reportAssertions */
export function report(v, filter) {
    return reportAssertions(v, filter);
}
function defaultLikeOptions(opts) {
    const keys = opts?.keys ?? "subset";
    return {
        keys,
        checkValues: opts?.checkValues ?? true,
        numericTolerance: opts?.numericTolerance ?? 0,
        stringSimilarityThreshold: opts?.stringSimilarityThreshold ?? -1, // -1 means equality only
        trimStrings: opts?.trimStrings ?? true,
        caseInsensitiveStrings: opts?.caseInsensitiveStrings ?? false,
        arrayOrderMatters: opts?.arrayOrderMatters ?? keys === "exact",
        allowExtraArrayItems: opts?.allowExtraArrayItems ?? true,
    };
}
function normalizeString(s, o) {
    let out = o.trimStrings ? s.trim() : s;
    if (o.caseInsensitiveStrings)
        out = out.toLowerCase();
    return out;
}
// Simple Levenshtein distance for small strings; returns 0..1 similarity
function stringSimilarity(a, b) {
    const m = a.length;
    const n = b.length;
    if (m === 0 && n === 0)
        return 1;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1));
    for (let i = 0; i <= m; i++)
        dp[i][0] = i;
    for (let j = 0; j <= n; j++)
        dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(dp[i - 1][j] + 1, // deletion
            dp[i][j - 1] + 1, // insertion
            dp[i - 1][j - 1] + cost // substitution
            );
        }
    }
    const dist = dp[m][n];
    const maxLen = Math.max(m, n);
    return 1 - dist / maxLen;
}
function numbersClose(a, b, tol) {
    if (!isFinite(a) || !isFinite(b))
        return a === b; // NaN/Infinity strict
    return Math.abs(a - b) <= tol;
}
function isPlainObject(x) {
    return typeof x === "object" && x !== null && !Array.isArray(x);
}
function likeArray(a, b, o) {
    // Quick length checks depending on policy
    if (o.arrayOrderMatters) {
        if (!o.allowExtraArrayItems && a.length !== b.length)
            return false;
        if (a.length < b.length)
            return false; // subset requires at least as many
        for (let i = 0; i < b.length; i++) {
            if (!isLike(a[i], b[i], o))
                return false;
        }
        return true;
    }
    else {
        // Order does not matter: every item in b must be matched by some item in a
        if (a.length < b.length)
            return false;
        const used = new Array(a.length).fill(false);
        outer: for (const bi of b) {
            for (let i = 0; i < a.length; i++) {
                if (used[i])
                    continue;
                if (isLike(a[i], bi, o)) {
                    used[i] = true;
                    continue outer;
                }
            }
            return false;
        }
        if (!o.allowExtraArrayItems && used.filter(Boolean).length !== a.length) {
            return false;
        }
        return true;
    }
}
function likeObject(a, b, o) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (o.keys === "exact") {
        if (aKeys.length !== bKeys.length)
            return false;
        for (const k of bKeys)
            if (!(k in a))
                return false;
    }
    else {
        // subset: all keys in b must exist in a
        for (const k of bKeys)
            if (!(k in a))
                return false;
    }
    if (!o.checkValues)
        return true;
    for (const k of bKeys) {
        if (!isLike(a[k], b[k], o))
            return false;
    }
    return true;
}
export function isLike(a, b, opts) {
    const o = defaultLikeOptions(opts);
    // Identity and trivial cases
    if (a === b)
        return true;
    if (b === null || b === undefined)
        return a === b;
    // Dates treated via timestamps
    const aIsDate = a instanceof Date;
    const bIsDate = b instanceof Date;
    if (aIsDate || bIsDate) {
        const at = aIsDate ? a.getTime() : a;
        const bt = bIsDate ? b.getTime() : b;
        if (typeof at !== "number" || typeof bt !== "number")
            return false;
        return numbersClose(at, bt, o.numericTolerance);
    }
    // Numbers with tolerance
    if (typeof a === "number" && typeof b === "number") {
        return numbersClose(a, b, o.numericTolerance);
    }
    // Strings with optional similarity
    if (typeof a === "string" && typeof b === "string") {
        const aa = normalizeString(a, o);
        const bb = normalizeString(b, o);
        if (o.stringSimilarityThreshold >= 0) {
            return stringSimilarity(aa, bb) >= o.stringSimilarityThreshold;
        }
        return aa === bb;
    }
    // Booleans strict
    if (typeof a === "boolean" && typeof b === "boolean")
        return a === b;
    // Arrays
    if (Array.isArray(a) && Array.isArray(b))
        return likeArray(a, b, o);
    // Objects
    if (isPlainObject(a) && isPlainObject(b))
        return likeObject(a, b, o);
    // Fallback: different kinds are not alike
    return false;
}
export function isAlotLike(a, b, opts) {
    const strict = {
        keys: "exact",
        checkValues: true,
        numericTolerance: 1e-9,
        stringSimilarityThreshold: 0.9,
        trimStrings: true,
        caseInsensitiveStrings: false,
        arrayOrderMatters: true,
        allowExtraArrayItems: false,
        ...(opts || {}),
    };
    return isLike(a, b, strict);
}
// ----------------------------------------------------------------------------
// Aggregate registries for asserts and assures
// ----------------------------------------------------------------------------
/**
 * All assert* helpers collected in one place for programmatic use.
 * Keys are friendly names (e.g., isString, stringNotEmpty, arrayHasEveryOf).
 */
export const assertions = {
    // Primitive asserts
    isString: assertIsString,
    isNumber: assertIsNumber,
    isArray: assertIsArray,
    isObject: assertIsObject,
    isElement: assertIsElement,
    isBoolean: assertIsBoolean,
    isDate: assertIsDate,
    isNull: assertIsNull,
    notNull: assertNotNull,
    isUndefined: assertIsUndefined,
    notUndefined: assertNotUndefined,
    notNullOrUndefined: assertNotNullOrUndefined,
    // String-targeted
    stringNotEmpty: assertStringNotEmpty,
    stringHasLength: assertStringHasLength,
    stringMinLength: assertStringMinLength,
    stringMaxLength: assertStringMaxLength,
    stringLengthBetween: assertStringLengthBetween,
    stringContains: assertStringContains,
    stringStartsWith: assertStringStartsWith,
    stringEndsWith: assertStringEndsWith,
    stringMatches: assertStringMatches,
    stringEqualsIgnoreCase: assertStringEqualsIgnoreCase,
    stringIncludesAny: assertStringIncludesAny,
    stringIncludesAll: assertStringIncludesAll,
    stringIsJSON: assertStringIsJSON,
    stringTrimmedNotEmpty: assertStringTrimmedNotEmpty,
    stringOneOf: assertStringOneOf,
    stringEqualsIgnoreWhitespace: assertStringEqualsIgnoreWhitespace,
    isBase64: isBase64,
    // Array-targeted
    arrayNotEmpty: assertArrayNotEmpty,
    arrayHasLength: assertArrayHasLength,
    arrayHasAnyOf: assertArrayHasAnyOf,
    arrayHasEveryOf: assertArrayHasEveryOf,
    arrayItemIsBoolean: assertArrayItemIsBoolean,
    arrayItemIsString: assertArrayItemIsString,
    arrayItemIsNumber: assertArrayItemIsNumber,
    arrayItemIsObject: assertArrayItemIsObject,
    arrayIncludesString: assertArrayIncludesString,
    arrayIncludesNumber: assertArrayIncludesNumber,
    arrayIncludesObject: assertArrayIncludesObject,
    arrayOnlyStrings: assertArrayOnlyStrings,
    arrayOnlyNumbers: assertArrayOnlyNumbers,
    arrayOnlyObjects: assertArrayOnlyObjects,
    arrayEveryTruthy: assertArrayEveryTruthy,
    arrayEveryFalsy: assertArrayEveryFalsy,
    arrayUnique: assertArrayUnique,
    // Object-targeted
    objectHasKey: assertObjectHasKey,
    objectHasKeys: assertObjectHasKeys,
    objectKeyEquals: assertObjectKeyEquals,
    objectAllKeysSet: assertObjectAllKeysSet,
    objectAnyKeyNull: assertObjectAnyKeyNull,
    objectKeysExactly: assertObjectKeysExactly,
    // Element-targeted
    elementIsChildOf: assertElementIsChildOf,
};
/**
 * All assure* helpers collected in one place. Mirrors assertions but with assure* aliases.
 */
export const assureAll = {
    // Primitive
    string: assureString,
    number: assureNumber,
    array: assureArray,
    object: assureObject,
    element: assureElement,
    boolean: assureBoolean,
    date: assureDate,
    null: assureNull,
    notNull: assureNotNull,
    undefined: assureUndefined,
    notUndefined: assureNotUndefined,
    present: assurePresent,
    // String-targeted
    stringNotEmpty: assureStringNotEmpty,
    stringHasLength: assureStringHasLength,
    stringMinLength: assureStringMinLength,
    stringMaxLength: assureStringMaxLength,
    stringLengthBetween: assureStringLengthBetween,
    stringContains: assureStringContains,
    stringStartsWith: assureStringStartsWith,
    stringEndsWith: assureStringEndsWith,
    stringMatches: assureStringMatches,
    stringEqualsIgnoreCase: assureStringEqualsIgnoreCase,
    stringIncludesAny: assureStringIncludesAny,
    stringIncludesAll: assureStringIncludesAll,
    stringIsJSON: assureStringIsJSON,
    stringTrimmedNotEmpty: assureStringTrimmedNotEmpty,
    stringOneOf: assureStringOneOf,
    stringEqualsIgnoreWhitespace: assureStringEqualsIgnoreWhitespace,
    // Array-targeted
    arrayNotEmpty: assureArrayNotEmpty,
    arrayHasLength: assureArrayHasLength,
    arrayHasAnyOf: assureArrayHasAnyOf,
    arrayHasEveryOf: assureArrayHasEveryOf,
    arrayItemIsBoolean: assureArrayItemIsBoolean,
    arrayItemIsString: assureArrayItemIsString,
    arrayItemIsNumber: assureArrayItemIsNumber,
    arrayItemIsObject: assureArrayItemIsObject,
    arrayIncludesString: assureArrayIncludesString,
    arrayIncludesNumber: assureArrayIncludesNumber,
    arrayIncludesObject: assureArrayIncludesObject,
    arrayOnlyStrings: assureArrayOnlyStrings,
    arrayOnlyNumbers: assureArrayOnlyNumbers,
    arrayOnlyObjects: assureArrayOnlyObjects,
    arrayEveryTruthy: assureArrayEveryTruthy,
    arrayEveryFalsy: assureArrayEveryFalsy,
    arrayUnique: assureArrayUnique,
    // Object-targeted
    objectHasKey: assureObjectHasKey,
    objectHasKeys: assureObjectHasKeys,
    objectKeyEquals: assureObjectKeyEquals,
    objectAllKeysSet: assureObjectAllKeysSet,
    objectAnyKeyNull: assureObjectAnyKeyNull,
    objectKeysExactly: assureObjectKeysExactly,
    // Element-targeted
    elementIsChildOf: sureElementIsChildOf,
};
// ============================================================================
// LEGACY CHECKS SYSTEM (COMMENTED OUT - GOOD IDEAS BUT REPLACED BY CHAINS)
// ============================================================================
/*
// LEGACY: Original imperative checks system
// Good ideas: Type assertions, explicit function signatures
// Replaced by: Fluent assume() chains which are more readable

export type CoreChecksType = {
  assumeTrue(cond: boolean, msg?: string): asserts cond;
  assumeFalse(cond: boolean, msg?: string): asserts cond is false;
  isTrue(cond: boolean, msg?: string): asserts cond;
  isFalse(cond: boolean, msg?: string): asserts cond is false;
  isFunction(v: unknown, msg?: string): asserts v is (...args: any[]) => any;
  isPromise(v: unknown, msg?: string): asserts v is Promise<unknown>;
  isInstanceOf<T>(v: unknown, ctor: new (...a: any[]) => T): asserts v is T;
  
  // Nullish helpers - these were good ideas
  isNull(v: unknown, msg?: string): asserts v is null;
  notNull<T>(v: T, msg?: string): asserts v is NonNullable<T>;
  isUndefined(v: unknown, msg?: string): asserts v is undefined;
  notUndefined<T>(v: T, msg?: string): asserts v is NonNullable<T>;
  isNil(v: unknown, msg?: string): asserts v is null | undefined;
  notNil<T>(v: T, msg?: string): asserts v is NonNullable<T>;
  notNullOrUndefined<T>(v: T, msg?: string): asserts v is NonNullable<T>;
};

export type ObjectChecksType = {
  isObject(v: unknown, msg?: string): asserts v is Record<string, unknown>;
  hasKey<T extends object, K extends string>(obj: T, key: K, msg?: string): asserts obj is T & Record<K, unknown>;
  hasKeys(...keys: string[]): AssumptionFn<Record<string, unknown>, 'object'>; // This was confused - mixing patterns
  equalStringified(obj: unknown, expected: string): void;
  sameKeys(obj: unknown, expected: Record<string, unknown>): void;
  allKeysFalsey(obj: unknown): asserts obj is Record<string, null | undefined | false | 0 | ''>;
  allKeysFalsy(obj: unknown): asserts obj is Record<string, null | undefined | false | 0 | ''>;
  allKeysSet(obj: unknown): asserts obj is Record<string, unknown>;
  anyKeyNull(obj: unknown): asserts obj is Record<string, null>;
};

export type ArrayChecksType = {
  isArray(v: unknown, msg?: string): asserts v is unknown[];
  hasLength<T extends unknown[]>(arr: T, len: number, msg?: string): asserts arr is { length: typeof len } & T;
  containsString(arr: unknown[], index: number): asserts arr is { [K in typeof index]: string } & unknown[];
  containsNumber(arr: unknown[], index: number): asserts arr is { [K in typeof index]: number } & unknown[];
  containsObject(arr: unknown[], index: number): asserts arr is { [K in typeof index]: object } & unknown[];
};

export type ElementChecksType = {
  isElement(v: unknown, msg?: string): asserts v is Element;
  isHTMLElement(v: unknown, msg?: string): asserts v is HTMLElement;
  isHidden(el: unknown, msg?: string): asserts el is Element;
  isVisible(el: unknown, msg?: string): asserts el is Element;
  hasChild(el: unknown, msg?: string): asserts el is Element;
  hasChildMatching(el: unknown, selector: string): asserts el is Element;
  hasDescendant(el: unknown, selector: string): asserts el is Element;
  hasAttribute(el: unknown, name: string): asserts el is Element;
  attributeEquals(el: unknown, name: string, expected: string): asserts el is Element;
};

// GOOD IDEAS FROM CHECKS:
// 1. Explicit type assertions with `asserts` keyword
// 2. Nullish checking variations (isNil, notNil, notNull, etc.)
// 3. Element visibility checks (isHidden/isVisible)
// 4. Promise and function type guards
// 5. Strict type narrowing with generics

// WHY REPLACED:
// Old: Checks.isArray(value); Checks.hasLength(value, 5);
// New: assume(value).isArray().hasLength(5)();
// The new way is more readable and chainable
*/
// ============================================================================
// BROKEN/INCOMPLETE IMPLEMENTATIONS (COMMENTED OUT - LEARN FROM MISTAKES)
// ============================================================================
/*
// BROKEN: These were never properly implemented
const CoreChecks: CoreChecksType = {
  // ...
  isTrue: function (cond: boolean, msg?: string): asserts cond {
    throw new Error('Function not implemented.'); // ← Never finished!
  },
  isFalse: function (cond: boolean, msg?: string): asserts cond is false {
    throw new Error(msg ?? 'Function not implemented.'); // ← Still broken!
  },
  // ...
};

// CONFUSED PATTERN: Mixing assumption chains with object methods
const ObjectChecks: ObjectChecksType = {
  // ...
  hasKeys(...keys: string[]): AssumptionFn<Record<string, unknown>, 'object'> {
    // This doesn't make sense - returning AssumptionFn from object method
    return function (this: AssumptionFn<Record<string, unknown>, 'object'>) {
      const obj = this.value(); // Wrong pattern - mixing contexts
      for (const k of keys) {
        if (!(k in obj)) throw new Error(`Expected object to have key "${k}"`);
      }
      return true;
    } as AssumptionFn<Record<string, unknown>, 'object'>;
  },
  // ...
};

// LESSON LEARNED: Don't mix imperative and fluent APIs in same type system
*/
// ============================================================================
// INTERESTING EXPERIMENTAL IDEAS (COMMENTED OUT - POTENTIAL FUTURE FEATURES)
// ============================================================================
/*
// INTERESTING: Element visibility checking
isHidden(el, msg) {
  const e = el as Element;
  const hiddenAttr = e.getAttribute?.('hidden') != null;
  const computed = typeof window !== 'undefined' ? window.getComputedStyle(e) : null;
  const hiddenByCss = computed ? computed.display === 'none' || computed.visibility === 'hidden' : false;
  if (!hiddenAttr && !hiddenByCss) throw new Error(msg ?? 'Expected element to be hidden');
},

isVisible(el, msg) {
  const e = el as Element;
  const computed = typeof window !== 'undefined' ? window.getComputedStyle(e) : null;
  const visible = computed ? computed.display !== 'none' && computed.visibility !== 'hidden' : true;
  if (!visible) throw new Error(msg ?? 'Expected element to be visible');
},

// GOOD IDEA: Could add these to ElementOnlyChain
// assume(element).isElement().isVisible().hasAttribute('data-id')

// INTERESTING: Stringified equality checking
equalStringified(obj, expected) {
  if (JSON.stringify(obj) !== expected) throw new Error(`Expected object to equal stringified version`);
},

// GOOD IDEA: Could be useful for API response validation
// assume(apiResponse).isObject().stringifiedEquals(expectedJson)

// INTERESTING: Array type homogeneity checks
onlyHasObjects(msg?: string) {
  if (!(value as any[]).every((item) => typeof item === 'object' && item !== null && !Array.isArray(item)))
    throw new Error(msg ?? 'Expected all objects');
},

onlyHasStrings(msg?: string) {
  if (!(value as any[]).every((item) => typeof item === 'string'))
    throw new Error(msg ?? 'Expected all strings');
},

// ALREADY IMPLEMENTED: These made it into ArrayOnlyChain - good ideas!
*/
// ============================================================================
// REDUNDANT HELPER FUNCTIONS (COMMENTED OUT - ALREADY HAVE BETTER VERSIONS)
// ============================================================================
/*
// REDUNDANT: These duplicate functionality in assume() chains
export function assertIsString(v: unknown, msg?: string): asserts v is string {
  assume(v).isString(msg)(); // Just use assume(v).isString()() directly
}

export function assertNotNil(v: unknown, msg?: string): asserts v is NonNullable<typeof v> {
  if (v === undefined || v === null || typeof v === 'undefined')
    throw new Error(msg ?? 'Entry is nil. Expected not null or undefined');
  // Better: assume(v).notNil()()
}

export function assertIsObject<T extends object = Record<string, unknown>>(v: unknown, msg?: string): asserts v is T {
  if (typeof v !== 'object' || v === null || Array.isArray(v))
    throw new Error(msg ?? 'Expected object');
  // Better: assume(v).isObject()()
}

// LESSON: Don't create wrapper functions for things that are already clean
*/
// ============================================================================
// ACTIVE CODE CONTINUES HERE...
// ============================================================================
// Re-export validation registry for convenience
//
