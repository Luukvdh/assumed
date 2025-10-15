// ============================================================================
// CORE TYPES AND ACTIVE CODE
// ============================================================================
const typeTagArray = ['unknown', 'string', 'number', 'array', 'object', 'element', 'boolean', 'null', 'undefined', 'present'];
export class AssumingBus {
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
}
export const assumingBus = new AssumingBus();
function mergeOptions(base, patch) {
    if (patch == null)
        return base;
    if (typeof patch === 'string')
        return { ...base, message: patch };
    return { ...base, ...patch };
}
export function assuming(...args) {
    let optionsRef = { quiet: false, message: 'Assumption failed' };
    // trailing message or options
    if (args.length) {
        const last = args[args.length - 1];
        const isOptsObj = last && typeof last === 'object' && typeof last !== 'function' && typeof last !== 'boolean';
        if (typeof last === 'string' || isOptsObj) {
            optionsRef = mergeOptions(optionsRef, last);
            args.pop();
        }
    }
    // normalize assumptions to callables; ignore null/undefined
    const assumptions = args.filter((a) => a != null && (typeof a === 'function' || typeof a === 'boolean')).map((a) => (typeof a === 'function' ? a : () => a));
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
    // side-effects: surveillance events
    assumingBus.emit(failed ? 'assuming:fail' : 'assuming:pass');
    if (!failed && optionsRef.emit) {
        assumingBus.emit(optionsRef.emit);
    }
    if (failed && !optionsRef.quiet) {
        const msg = optionsRef.message ?? (error instanceof Error ? error.message : 'Assumption failed');
        throw error instanceof Error ? error : new Error(msg);
    }
    let lastResult; // capture last Run/result result
    const buildMessage = (msg) => msg ?? optionsRef.message ?? (error instanceof Error ? error.message : 'Assumptions not satisfied');
    const api = {
        Run(fn) {
            if (!failed)
                lastResult = fn();
            return api; // FLUENT
        },
        // Optional accessor for the value produced by last Run/result
        value() {
            return lastResult;
        },
        // Throwing asserts
        isTrue(msg) {
            if (failed) {
                const m = buildMessage(msg);
                throw error instanceof Error ? error : new Error(m);
            }
            return true;
        },
        isFalse(msg) {
            if (!failed)
                throw new Error(msg ?? 'Expected assumptions to be refuted');
            return true;
        },
        // Boolean probes
        isVindicated() {
            //alias
            return !failed;
        },
        isRefuted() {
            //alias
            return failed;
        },
        // Fluent failure handler
        onRefuted(fn) {
            if (failed)
                lastResult = fn(error);
            return api; // FLUENT
        },
        // Promise-like alias
        catch(fn) {
            if (failed)
                lastResult = fn(error);
            return api; // FLUENT
        },
        // Branch helper (kept for convenience)
        result(success, failure) {
            if (!failed)
                return (lastResult = success());
            if (failure)
                return (lastResult = failure(error));
            return undefined;
        },
        // Stateful options
        with(patch) {
            optionsRef = mergeOptions(optionsRef, patch);
            return api;
        },
        message(msg) {
            optionsRef.message = msg;
            return api;
        },
        quiet(value = true) {
            optionsRef.quiet = value;
            return api;
        },
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
        if (args.length === 1 && typeof args[0] === 'function') {
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
        console.log('Well... that assumption turned out to be unfounded:', e.message);
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
        if (typeof v === 'string')
            return v.length > 120 ? v.slice(0, 117) + '...' : v;
        if (typeof v === 'number' || typeof v === 'boolean')
            return String(v);
        if (Array.isArray(v))
            return `Array(${v.length})`;
        if (typeof v === 'object')
            return `{${Object.keys(v)
                .slice(0, 6)
                .join(',')}${Object.keys(v).length > 6 ? ',…' : ''}}`;
        return typeof v;
    }
    catch {
        return undefined;
    }
}
export const captureLocation = (() => {
    const stack = new Error().stack;
    if (stack) {
        const lines = stack.split('\n');
        // Find first line that's not in assume.ts/assume.js
        const relevantLine = lines.find((line) => line.includes('at ') && !line.includes('assume.js') && !line.includes('assume.ts'));
        return relevantLine?.trim().replace('at ', '') || 'unknown';
    }
    return undefined;
})();
export class AssumptionError extends Error {
    name = 'AssumptionError';
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
        this.message = this.buildRichMessage(message);
    }
    buildRichMessage(originalMessage) {
        const parts = [`AssumptionError: ${originalMessage}`];
        if (this.valuePreview) {
            parts.push(`Value: ${this.valuePreview}`);
        }
        if (this.chainTrace.length > 0) {
            parts.push(`Chain: ${this.chainTrace.join(' → ')}`);
        }
        if (this.captureLocation) {
            parts.push(`Created at: ${this.captureLocation}`);
        }
        return parts.join('\n  ');
    }
}
export function isAssumptionError(err) {
    return !!err && typeof err === 'object' && err.name === 'AssumptionError';
}
function formatAssumptionError(err) {
    const parts = [`🔴 ${err.message}`, `📊 Value: ${err.valuePreview || 'unknown'}`];
    if (err.chainTrace.length > 0) {
        parts.push(`🔗 Chain: ${err.chainTrace.join(' → ')}`);
    }
    if (err.captureLocation) {
        parts.push(`📍 Origin: ${err.captureLocation}`);
    }
    // Show recent history for context
    const recentHistory = getAssumeHistory().slice(-3);
    if (recentHistory.length > 0) {
        parts.push(`📜 Recent: ${recentHistory.map((ev) => `${ev.kind}${JSON.stringify(ev) || ''}`).join(' → ')}`);
    }
    return parts.join('\n   ');
}
function createAssumption(value) {
    const queue = [];
    const chainTrace = []; // Track method calls
    // Capture where the chain was created
    pushAssumeEvent({ t: Date.now(), kind: 'start', info: { valuePreview: previewValue(value) } });
    const runAll = () => {
        try {
            for (const c of queue)
                c.check();
            pushAssumeEvent({ t: Date.now(), kind: 'vindicated' });
            return true;
        }
        catch (e) {
            // Don't throw - just return false to indicate failure
            pushAssumeEvent({ t: Date.now(), kind: 'refuted', info: { message: String(e) } });
            return false;
        }
    };
    const runner = function () {
        return runAll();
    };
    function getTypeName(val) {
        if (val === null)
            return 'null';
        if (Array.isArray(val))
            return 'Array';
        if (typeof val === 'object')
            return val.constructor?.name || 'Object';
        return typeof val;
    }
    // Simplify the add function to use getTypeName:
    const add = (fn, type = 'unknown', methodName) => {
        // Add to readable trace using detected type
        if (methodName) {
            const detectedType = getTypeName(value);
            chainTrace.push(`${detectedType}.${methodName}`);
        }
        const wrapped = () => {
            try {
                fn();
                pushAssumeEvent({ t: Date.now(), kind: 'check', info: { type, op: methodName } });
            }
            catch (e) {
                if (isAssumptionError(e)) {
                    pushAssumeEvent({ t: Date.now(), kind: 'refuted', info: { message: e.message } });
                    throw e;
                }
                const err = new AssumptionError(e instanceof Error ? e.message : String(e), {
                    stack: queue.slice(),
                    value,
                    cause: e,
                    chainTrace: chainTrace.slice(),
                    captureLocation,
                });
                // 📰 IMMEDIATE BULLETIN (no setImmediate)
                console.log('📰 ASSUMPTION ERROR:', err.message);
                pushAssumeEvent({ t: Date.now(), kind: 'refuted', info: { message: err.message } });
                throw err;
            }
        };
        queue.push({ check: wrapped, type, methodName });
    };
    const base = {
        that(predicate, msg) {
            add(() => {
                if (!predicate(value))
                    throw new Error(msg ?? 'Assumption failed');
            }, 'unknown', 'that');
            return runner;
        },
        instanceof(expectedOrMsg, msg) {
            // Detect if first param is a constructor or message
            const isConstructorProvided = typeof expectedOrMsg === 'function';
            const actualMsg = isConstructorProvided ? msg : expectedOrMsg;
            if (isConstructorProvided) {
                // With constructor - check instanceof and use smart TypeTag detection
                const expected = expectedOrMsg;
                add(() => {
                    if (!(value instanceof expected))
                        throw new Error(actualMsg ?? 'Assumption failed: value is not instance of expected');
                }, 
                // Smart TypeTag detection from your typeTagArray lookup
                (typeTagArray.find((x) => x === getTypeName(value)) || typeTagArray.find((x) => x === typeof value) || 'unknown'), `instanceof(${expected.name || 'Constructor'})`);
            }
            else {
                // Empty instanceof - confidence check, detect current type
                add(() => {
                    // Just verify it's some kind of constructor instance
                    if (typeof value !== 'object' || value === null) {
                        throw new Error(actualMsg ?? 'Expected constructor instance');
                    }
                }, 
                // Smart TypeTag detection using your existing logic
                (typeTagArray.find((x) => x === getTypeName(value)) || typeTagArray.find((x) => x === typeof value) || 'unknown'), `instanceof('base')`);
            }
        },
        equals(expected, msg) {
            add(() => {
                if (value !== expected)
                    throw new Error(msg ?? 'Assumption failed: value !== expected');
            }, 'unknown', `equals(${JSON.stringify(expected)})`);
            return runner;
        },
        value() {
            return value;
        },
    };
    Object.assign(runner, base);
    // Chain builders for each specialized type
    const toNumberChain = () => Object.assign(runner, {
        greaterThan(n, msg) {
            add(() => {
                if (!(value > n))
                    throw new Error(msg ?? `Expected > ${n}`);
            }, 'number', `greaterThan(${n})`);
            return runner;
        },
        greaterOrEqual(n, msg) {
            add(() => {
                if (!(value >= n))
                    throw new Error(msg ?? `Expected >= ${n}`);
            }, 'number', `greaterOrEqual(${n})`);
            return runner;
        },
        lessThan(n, msg) {
            add(() => {
                if (!(value < n))
                    throw new Error(msg ?? `Expected < ${n}`);
            }, 'number', `lessThan(${n})`);
            return runner;
        },
        lessOrEqual(n, msg) {
            add(() => {
                if (!(value <= n))
                    throw new Error(msg ?? `Expected <= ${n}`);
            }, 'number', `lessOrEqual(${n})`);
            return runner;
        },
        between(min, max, msg) {
            add(() => {
                const v = value;
                if (!(v >= min && v <= max))
                    throw new Error(msg ?? `Expected between ${min} and ${max}`);
            }, 'number', `between(${min},${max})`);
            return runner;
        },
    });
    const toStringChain = () => Object.assign(runner, {
        notEmpty(msg) {
            add(() => {
                if (String(value).length === 0)
                    throw new Error(msg ?? 'Expected non-empty string');
            }, 'string', 'notEmpty');
            return runner;
        },
        hasLength(len, msg) {
            add(() => {
                if (String(value).length !== len)
                    throw new Error(msg ?? `Expected length ${len}`);
            }, 'string', `hasLength(${len})`);
            return runner;
        },
        minLength(n, msg) {
            add(() => {
                if (String(value).length < n)
                    throw new Error(msg ?? `Expected length >= ${n}`);
            }, 'string', `minLength(${n})`);
            return runner;
        },
        maxLength(n, msg) {
            add(() => {
                if (String(value).length > n)
                    throw new Error(msg ?? `Expected length <= ${n}`);
            }, 'string', `maxLength(${n})`);
            return runner;
        },
        lengthBetween(min, max, msg) {
            add(() => {
                const l = String(value).length;
                if (l < min || l > max)
                    throw new Error(msg ?? `Expected length between ${min} and ${max}`);
            }, 'string', `lengthBetween(${min},${max})`);
            return runner;
        },
        contains(needle, msg) {
            add(() => {
                const s = String(value);
                const ok = typeof needle === 'string' ? s.includes(needle) : needle.test(s);
                if (!ok)
                    throw new Error(msg ?? `Expected to contain ${String(needle)}`);
            }, 'string', `contains(${typeof needle === 'string' ? `"${needle}"` : needle.toString()})`);
            return runner;
        },
        startsWith(prefix, msg) {
            add(() => {
                if (!String(value).startsWith(prefix))
                    throw new Error(msg ?? `Expected to start with "${prefix}"`);
            }, 'string', `startsWith("${prefix}")`);
            return runner;
        },
        endsWith(suffix, msg) {
            add(() => {
                if (!String(value).endsWith(suffix))
                    throw new Error(msg ?? `Expected to end with "${suffix}"`);
            }, 'string', `endsWith("${suffix}")`);
            return runner;
        },
        matches(re, msg) {
            add(() => {
                if (!re.test(String(value)))
                    throw new Error(msg ?? `Expected to match ${re}`);
            }, 'string', `matches(${re.toString()})`);
            return runner;
        },
        equalsIgnoreCase(expected, msg) {
            add(() => {
                if (String(value).toLowerCase() !== expected.toLowerCase())
                    throw new Error(msg ?? `Expected "${expected}" (case-insensitive)`);
            }, 'string', `equalsIgnoreCase("${expected}")`);
            return runner;
        },
        includesAny(...needles) {
            add(() => {
                const s = String(value);
                if (!needles.some((n) => s.includes(n)))
                    throw new Error(`Expected any of [${needles.join(', ')}]`);
            }, 'string', `includesAny(${needles.map((n) => `"${n}"`).join(',')})`);
            return runner;
        },
        includesAll(...needles) {
            add(() => {
                const s = String(value);
                if (!needles.every((n) => s.includes(n)))
                    throw new Error(`Expected all of [${needles.join(', ')}]`);
            }, 'string', `includesAll(${needles.map((n) => `"${n}"`).join(',')})`);
            return runner;
        },
        isJSON(msg) {
            add(() => {
                try {
                    JSON.parse(String(value));
                }
                catch {
                    throw new Error(msg ?? 'Expected valid JSON');
                }
            }, 'string', 'isJSON');
            return runner;
        },
    });
    const toArrayChain = () => Object.assign(runner, {
        hasLength(len, msg) {
            add(() => {
                if (value.length !== len)
                    throw new Error(msg ?? `Expected array length ${len}`);
            }, 'array', `hasLength(${len})`);
            return runner;
        },
        notEmpty(msg) {
            add(() => {
                if (value.length === 0)
                    throw new Error(msg ?? 'Expected non-empty array');
            }, 'array', 'notEmpty');
            return runner;
        },
        itemIsBoolean(i, msg) {
            add(() => {
                if (typeof value[i] !== 'boolean')
                    throw new Error(msg ?? `Expected boolean at ${i}`);
            }, 'array', `itemIsBoolean(${i})`);
            return runner;
        },
        itemIsString(i, msg) {
            add(() => {
                if (typeof value[i] !== 'string')
                    throw new Error(msg ?? `Expected string at ${i}`);
            }, 'array', `itemIsString(${i})`);
            return runner;
        },
        itemIsNumber(i, msg) {
            add(() => {
                if (typeof value[i] !== 'number')
                    throw new Error(msg ?? `Expected number at ${i}`);
            }, 'array', `itemIsNumber(${i})`);
            return runner;
        },
        itemIsObject(i, msg) {
            add(() => {
                const v = value[i];
                if (typeof v !== 'object' || v === null || Array.isArray(v))
                    throw new Error(msg ?? `Expected object at ${i}`);
            }, 'array', `itemIsObject(${i})`);
            return runner;
        },
        includesString(needle, msg) {
            add(() => {
                if (!value.some((item) => String(item).includes(needle)))
                    throw new Error(msg ?? `Expected string including "${needle}"`);
            }, 'array', `includesString("${needle}")`);
            return runner;
        },
        includesNumber(needle, msg) {
            add(() => {
                if (!value.some((item) => item === needle))
                    throw new Error(msg ?? `Expected number including "${needle}"`);
            }, 'array', `includesNumber(${needle})`);
            return runner;
        },
        includesObject(needle, msg) {
            add(() => {
                if (!value.some((item) => JSON.stringify(item) === JSON.stringify(needle)))
                    throw new Error(msg ?? `Expected object including "${JSON.stringify(needle)}"`);
            }, 'array', `includesObject(${JSON.stringify(needle)})`);
            return runner;
        },
        onlyHasObjects(msg) {
            add(() => {
                if (!value.every((item) => typeof item === 'object' && item !== null && !Array.isArray(item)))
                    throw new Error(msg ?? 'Expected all objects');
            }, 'array', 'onlyHasObjects');
            return runner;
        },
        onlyHasStrings(msg) {
            add(() => {
                if (!value.every((item) => typeof item === 'string'))
                    throw new Error(msg ?? 'Expected all strings');
            }, 'array', 'onlyHasStrings');
            return runner;
        },
        onlyHasNumbers(msg) {
            add(() => {
                if (!value.every((item) => typeof item === 'number'))
                    throw new Error(msg ?? 'Expected all numbers');
            }, 'array', 'onlyHasNumbers');
            return runner;
        },
        everyIsFalsy(msg) {
            add(() => {
                if (!value.every((item) => !item))
                    throw new Error(msg ?? 'Expected all falsy');
            }, 'array', 'everyIsFalsy');
            return runner;
        },
        everyIsTruthy(msg) {
            add(() => {
                if (!value.every((item) => !!item))
                    throw new Error(msg ?? 'Expected all truthy');
            }, 'array', 'everyIsTruthy');
            return runner;
        },
        includesCondition(needle, msg) {
            add(() => {
                if (!value.some(needle))
                    throw new Error(msg ?? 'Expected array to include condition');
            }, 'array', 'includesCondition');
            return runner;
        },
    });
    const toObjectChain = () => Object.assign(runner, {
        hasKey(key, msg) {
            add(() => {
                if (!(key in value))
                    throw new Error(msg ?? `Expected key "${key}"`);
            }, 'object', `hasKey("${key}")`);
            return runner;
        },
        hasKeys(...keys) {
            add(() => {
                for (const k of keys)
                    if (!(k in value))
                        throw new Error(`Expected key "${k}"`);
            }, 'object', `hasKeys(${keys.map((k) => `"${k}"`).join(',')})`);
            return runner;
        },
        keyEquals(key, expected, msg) {
            add(() => {
                if (value[key] !== expected)
                    throw new Error(msg ?? `Expected ${key} === ${String(expected)}`);
            }, 'object', `keyEquals("${key}",${JSON.stringify(expected)})`);
            return runner;
        },
        sameKeys(expected, msg) {
            add(() => {
                const a = Object.keys(value);
                const b = Object.keys(expected);
                if (a.length !== b.length)
                    throw new Error(msg ?? 'Key count mismatch');
                for (const k of b)
                    if (!(k in value))
                        throw new Error(msg ?? `Missing key "${k}"`);
            }, 'object', 'sameKeys');
            return runner;
        },
        allKeysFalsy(msg) {
            add(() => {
                for (const k in value)
                    if (value[k])
                        throw new Error(msg ?? `Key "${k}" not falsy`);
            }, 'object', 'allKeysFalsy');
            return runner;
        },
        allKeysSet(msg) {
            add(() => {
                for (const k in value)
                    if (value[k] === undefined)
                        throw new Error(msg ?? `Key "${k}" unset`);
            }, 'object', 'allKeysSet');
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
                    throw new Error(msg ?? 'No null key');
            }, 'object', 'anyKeyNull');
            return runner;
        },
    });
    const toElementChain = () => Object.assign(runner, {
        hasChildren(msg) {
            add(() => {
                const e = value;
                if (typeof Element === 'undefined' || !(e instanceof Element) || e.childElementCount === 0)
                    throw new Error(msg ?? 'Expected child elements');
            }, 'element', 'hasChildren');
            return runner;
        },
        hasChild(msg) {
            add(() => {
                const e = value;
                if (typeof Element === 'undefined' || !(e instanceof Element) || e.childElementCount === 0)
                    throw new Error(msg ?? 'Expected child elements');
            }, 'element', 'hasChild');
            return runner;
        },
        hasChildMatching(sel, msg) {
            add(() => {
                const e = value;
                if (typeof Element === 'undefined' || !(e instanceof Element) || !e.querySelector(sel))
                    throw new Error(msg ?? `Missing child "${sel}"`);
            }, 'element', `hasChildMatching("${sel}")`);
            return runner;
        },
        hasDescendant(sel, msg) {
            add(() => {
                const e = value;
                if (typeof Element === 'undefined' || !(e instanceof Element) || !e.querySelector(sel))
                    throw new Error(msg ?? `Missing descendant "${sel}"`);
            }, 'element', `hasDescendant("${sel}")`);
            return runner;
        },
        hasAttribute(name, msg) {
            add(() => {
                const e = value;
                if (typeof Element === 'undefined' || !(e instanceof Element) || !e.hasAttribute(name))
                    throw new Error(msg ?? `Missing attribute "${name}"`);
            }, 'element', `hasAttribute("${name}")`);
            return runner;
        },
        attributeEquals(name, expected, msg) {
            add(() => {
                const e = value;
                if (typeof Element === 'undefined' || !(e instanceof Element) || e.getAttribute(name) !== expected)
                    throw new Error(msg ?? `Attr "${name}" != "${expected}"`);
            }, 'element', `attributeEquals("${name}","${expected}")`);
            return runner;
        },
    });
    // Type guards (only on unknown)
    runner.isNumber = (msg) => {
        add(() => {
            if (typeof value !== 'number')
                throw new Error(msg ?? 'Expected number');
        }, 'number', 'isNumber');
        return toNumberChain();
    };
    runner.isString = (msg) => {
        add(() => {
            if (typeof value !== 'string')
                throw new Error(msg ?? 'Expected string');
        }, 'string', 'isString');
        return toStringChain();
    };
    runner.isArray = (msg) => {
        add(() => {
            if (!Array.isArray(value))
                throw new Error(msg ?? 'Expected array');
        }, 'array', 'isArray');
        return toArrayChain();
    };
    runner.isObject = (msg) => {
        add(() => {
            if (typeof value !== 'object' || value === null || Array.isArray(value))
                throw new Error(msg ?? 'Expected object');
        }, 'object', 'isObject');
        return toObjectChain();
    };
    runner.isElement = (msg) => {
        add(() => {
            if (typeof Element === 'undefined' || !(value instanceof Element))
                throw new Error(msg ?? 'Expected Element');
        }, 'element', 'isElement');
        return toElementChain();
    };
    runner.isBoolean = (msg) => {
        add(() => {
            if (typeof value !== 'boolean')
                throw new Error(msg ?? 'Expected boolean');
        }, 'boolean', 'isBoolean');
        return runner;
    };
    // Nullish guards producing terminal states
    runner.isNull = (msg) => {
        add(() => {
            if (value !== null)
                throw new Error(msg ?? 'Expected null');
        }, 'null', 'isNull');
        return runner;
    };
    runner.isUndefined = (msg) => {
        add(() => {
            if (value !== undefined)
                throw new Error(msg ?? 'Expected undefined');
        }, 'undefined', 'isUndefined');
        return runner;
    };
    // Non‑nullish guards that KEEP other type guards (move to 'present')
    runner.notNil = (msg) => {
        add(() => {
            if (value === null || value === undefined)
                throw new Error(msg ?? 'Expected value (not null/undefined)');
        }, 'present', 'notNil');
        return runner;
    };
    runner.notNull = (msg) => {
        add(() => {
            if (value === null)
                throw new Error(msg ?? 'Expected not null');
        }, 'present', 'notNull');
        return runner;
    };
    runner.notNullOrUndefined = (msg) => {
        add(() => {
            if (value === null || value === undefined)
                throw new Error(msg ?? 'Expected value (not null/undefined)');
        }, 'present', 'notNullOrUndefined');
        return runner;
    };
    return runner;
}
// Main exported functions
export function that(value) {
    return createAssumption(value);
}
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
    return fn.displayName || fn.name || 'anonymous';
}
function enrichWithHandlerName(err, handler) {
    const name = getFnName(handler);
    if (err && typeof err === 'object') {
        try {
            // attach meta
            err.handlerName = name;
            // prefix message for visibility
            if (err.message && typeof err.message === 'string') {
                err.message = `[${name}] ${err.message}`;
            }
        }
        catch {
            /* ignore */
        }
    }
    return err;
}
export function defRefHandler(def, log = false) {
    return (err) => {
        console.error(err);
        enrichWithHandlerName(err, defRefHandler);
        if (log)
            (typeof log === 'function' ? log : console.error)(err);
        // Always return default - don't re-throw
        return def;
    };
}
export function defRefHandlerAsync(def, log = false) {
    return async (err) => {
        enrichWithHandlerName(err, defRefHandlerAsync);
        console.error(err);
        if (log)
            (typeof log === 'function' ? log : console.error)(err);
        return def;
    };
}
export function assumedRoute(onRefuted, handler) {
    return (...args) => {
        try {
            const result = handler(...args);
            if (result && typeof result.then === 'function') {
                return result.catch((e) => onRefuted(enrichWithHandlerName(e, handler), ...args));
            }
            return result;
        }
        catch (e) {
            return onRefuted(enrichWithHandlerName(e, handler), ...args);
        }
    };
}
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
//
