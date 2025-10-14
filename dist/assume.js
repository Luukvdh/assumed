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
    const assumptions = args
        .filter((a) => a != null && (typeof a === "function" || typeof a === "boolean"))
        .map((a) => typeof a === "function" ? a : () => a);
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
    assumingBus.emit(failed ? "assuming:fail" : "assuming:pass");
    if (!failed && optionsRef.emit) {
        assumingBus.emit(optionsRef.emit);
    }
    // default behavior: throw on failure unless quiet
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
                throw new Error(msg ?? "Expected assumptions to be refuted");
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
export function check(Fn) {
    try {
        return assuming(() => {
            Fn();
            return true;
        }, { quiet: true }).isVindicated();
    }
    catch {
        return false;
    }
}
export const CoreChecks = {
    assumeFalse(cond, msg) {
        if (cond)
            throw new Error(msg ?? "(assumption failed: expected false)");
    },
    assumeTrue(cond, msg) {
        if (!cond)
            throw new Error(msg ?? "(assumption failed: expected true)");
    },
    isFunction(v, msg) {
        if (typeof v !== "function")
            throw new Error(msg ?? "Expected function");
    },
    isPromise(v, msg) {
        if (!(v instanceof Promise))
            throw new Error(msg ?? "Expected Promise");
    },
    isInstanceOf(v, ctor) {
        if (!(v instanceof ctor))
            throw new Error(`Expected instance of ${ctor.name || "constructor"}`);
    },
    // NEW: strict/loose nullish helpers
    isNull(v, msg) {
        if (v !== null)
            throw new Error(msg ?? "Expected value to be null");
    },
    isUndefined(v, msg) {
        if (v !== undefined)
            throw new Error(msg ?? "Expected value to be undefined");
    },
    isNil(v, msg) {
        // null OR undefined
        if (v != null)
            throw new Error(msg ?? "Expected value to be null or undefined");
    },
    notNil(v, msg) {
        // neither null nor undefined
        if (typeof v === "undefined" || v === null)
            throw new Error(msg ?? "Expected value to be present");
    },
    notNullOrUndefined(v, msg) {
        // neither null nor undefined
        return this.notNil(v, msg);
    },
    notUndefined(v, msg) {
        if (v === undefined)
            throw new Error(msg ?? "Expected value to be present");
    },
    notNull(v, msg) {
        if (v === null)
            throw new Error(msg ?? "Expected value to be present");
    },
    isTrue: function (cond, msg) {
        throw new Error("Function not implemented.");
    },
    isFalse: function (cond, msg) {
        throw new Error("Function not implemented.");
    },
};
export const ObjectChecks = {
    isObject(v, msg) {
        if (typeof v !== "object" || v === null || Array.isArray(v))
            throw new Error(msg ?? "Expected object");
        assertNotNil(v);
        assertIsObject(v);
    },
    hasKey(obj, key, msg) {
        if (!(key in obj))
            throw new Error(msg ?? `Expected object with key "${key}"`);
    },
    hasKeys(obj, ...keys) {
        if (typeof obj !== "object" || obj === null)
            throw new Error("Expected object");
        for (const key of keys) {
            if (!(key in obj))
                throw new Error(`Expected object with key "${key}"`);
            return true;
        }
        return true;
    },
    equalStringified(obj, expected) {
        if (JSON.stringify(obj) !== expected)
            throw new Error(`Expected object to equal stringified version`);
    },
    sameKeys(obj, expected) {
        if (typeof obj !== "object" || obj === null)
            throw new Error("Expected object");
        const objKeys = Object.keys(obj);
        const expectedKeys = Object.keys(expected);
        if (objKeys.length !== expectedKeys.length)
            throw new Error("Expected object to have same number of keys");
        for (const key of expectedKeys)
            if (!(key in obj))
                throw new Error(`Expected object to have key "${key}"`);
    },
    allKeysFalsey(obj) {
        if (typeof obj !== "object" || obj === null)
            throw new Error("Expected object");
        for (const key in obj)
            if (obj[key])
                throw new Error(`Expected key "${key}" to be falsy`);
    },
    allKeysFalsy(obj) {
        return ObjectChecks.allKeysFalsey(obj);
    },
    allKeysSet(obj) {
        if (typeof obj !== "object" || obj === null)
            throw new Error("Expected object");
        for (const key in obj)
            if (obj[key] === undefined)
                throw new Error(`Expected key "${key}" to be set`);
    },
    anyKeyNull(obj) {
        if (typeof obj !== "object" || obj === null)
            throw new Error("Expected object");
        let foundNull = false;
        for (const key in obj)
            if (obj[key] === null)
                foundNull = true;
        if (!foundNull)
            throw new Error("Expected at least one key to be null");
    },
};
export const ArrayChecks = {
    isArray(v, msg) {
        assertNotNil(v);
        if (!Array.isArray(v))
            throw new Error(msg ?? "Expected array");
    },
    hasLength(arr, len, msg) {
        if (arr.length !== len)
            throw new Error(msg ?? `Expected array of length ${len}`);
    },
    containsString(arr, index) {
        if (typeof arr[index] !== "string")
            throw new Error(`Expected string at index ${index}`);
    },
    containsNumber(arr, index) {
        if (typeof arr[index] !== "number")
            throw new Error(`Expected number at index ${index}`);
    },
    containsObject(arr, index) {
        if (typeof arr[index] !== "object" || arr[index] === null)
            throw new Error(`Expected object at index ${index}`);
    },
};
export const ElementChecks = {
    isElement(v, msg) {
        const isElem = typeof Element !== "undefined" && v instanceof Element;
        if (!isElem)
            throw new Error(msg ?? "Expected DOM Element");
    },
    isHTMLElement(v, msg) {
        const isHtmlElem = typeof HTMLElement !== "undefined" && v instanceof HTMLElement;
        if (!isHtmlElem)
            throw new Error(msg ?? "Expected HTMLElement");
    },
    isHidden(el, msg) {
        if (typeof Element === "undefined" || !(el instanceof Element))
            throw new Error(msg ?? "Expected Element");
        const e = el;
        const hiddenAttr = e.getAttribute?.("hidden") != null;
        const computed = typeof window !== "undefined" ? window.getComputedStyle(e) : null;
        const hiddenByCss = computed
            ? computed.display === "none" || computed.visibility === "hidden"
            : false;
        if (!hiddenAttr && !hiddenByCss)
            throw new Error(msg ?? "Expected element to be hidden");
    },
    isVisible(el, msg) {
        if (typeof Element === "undefined" || !(el instanceof Element))
            throw new Error(msg ?? "Expected Element");
        const e = el;
        const computed = typeof window !== "undefined" ? window.getComputedStyle(e) : null;
        const visible = computed
            ? computed.display !== "none" && computed.visibility !== "hidden"
            : true;
        if (!visible)
            throw new Error(msg ?? "Expected element to be visible");
    },
    hasChild(el, msg) {
        if (typeof Element === "undefined" || !(el instanceof Element))
            throw new Error(msg ?? "Expected Element");
        if (el.childElementCount === 0)
            throw new Error(msg ?? "Expected element to have at least one child element");
    },
    hasChildMatching(el, selector) {
        if (typeof Element === "undefined" || !(el instanceof Element))
            throw new Error("Expected Element");
        if (!el.querySelector(selector))
            throw new Error(`Expected child matching selector "${selector}"`);
    },
    hasDescendant(el, selector) {
        if (typeof Element === "undefined" || !(el instanceof Element))
            throw new Error("Expected Element");
        if (!el.querySelector(selector))
            throw new Error(`Expected descendant matching selector "${selector}"`);
    },
    hasAttribute(el, name) {
        if (typeof Element === "undefined" || !(el instanceof Element))
            throw new Error("Expected Element");
        if (!el.hasAttribute(name))
            throw new Error(`Expected element to have attribute "${name}"`);
    },
    attributeEquals(el, name, expected) {
        if (typeof Element === "undefined" || !(el instanceof Element))
            throw new Error("Expected Element");
        if (el.getAttribute(name) !== expected)
            throw new Error(`Expected attribute "${name}" to equal "${expected}"`);
    },
};
// --- Fluent Assume chain with narrowing ---
function getTypeName(val) {
    if (val === null)
        return "null";
    if (Array.isArray(val))
        return "Array";
    if (typeof val === "object")
        return val.constructor?.name || "Object";
    return typeof val;
}
function createAssumption(value) {
    const queue = [];
    pushAssumeEvent({
        t: Date.now(),
        kind: "start",
        info: { valuePreview: previewValue(value) },
    });
    const runAll = () => {
        for (const c of queue)
            c.check();
        pushAssumeEvent({ t: Date.now(), kind: "vindicated" });
        return true;
    };
    const runner = function () {
        return runAll();
    };
    // NOTE: add now wraps thrown errors into AssumptionError and logs history
    const add = (fn, type = "unknown", op) => {
        const wrapped = () => {
            try {
                fn();
                pushAssumeEvent({ t: Date.now(), kind: "check", info: { type, op } });
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
                const err = new AssumptionError(e instanceof Error ? e.message : String(e), {
                    stack: queue.slice(),
                    value,
                    cause: e,
                });
                pushAssumeEvent({
                    t: Date.now(),
                    kind: "refuted",
                    info: { message: err.message },
                });
                throw err;
            }
        };
        queue.push({ check: wrapped, type });
    };
    const base = {
        that(predicate, msg) {
            add(() => {
                if (!predicate(value))
                    throw new Error(msg ?? "Assumption failed");
            });
            return runner;
        },
        instanceof(expected, msg) {
            add(() => {
                if (!(value instanceof expected))
                    throw new Error(msg ?? "Assumption failed: value is not instance of expected");
            });
            return runner;
        },
        equals(expected, msg) {
            add(() => {
                if (value !== expected)
                    throw new Error(msg ?? "Assumption failed: value !== expected");
            });
            return runner;
        },
        toBoolean() {
            return runAll();
        },
        value() {
            return value;
        },
    };
    Object.assign(runner, base);
    // Adapt existing chain builders to return new generic form
    const toNumberChain = () => Object.assign(runner, {
        greaterThan(n, msg) {
            add(() => {
                if (!(value > n))
                    throw new Error(msg ?? `Expected > ${n}`);
            }, "number");
            return runner;
        },
        greaterOrEqual(n, msg) {
            add(() => {
                if (!(value >= n))
                    throw new Error(msg ?? `Expected >= ${n}`);
            }, "number");
            return runner;
        },
        lessThan(n, msg) {
            add(() => {
                if (!(value < n))
                    throw new Error(msg ?? `Expected < ${n}`);
            }, "number");
            return runner;
        },
        lessOrEqual(n, msg) {
            add(() => {
                if (!(value <= n))
                    throw new Error(msg ?? `Expected <= ${n}`);
            }, "number");
            return runner;
        },
        between(min, max, msg) {
            add(() => {
                const v = value;
                if (!(v >= min && v <= max))
                    throw new Error(msg ?? `Expected between ${min} and ${max}`);
            }, "number");
            return runner;
        },
    });
    const toStringChain = () => Object.assign(runner, {
        notEmpty(msg) {
            add(() => {
                if (String(value).length === 0)
                    throw new Error(msg ?? "Expected non-empty string");
            }, "string");
            return runner;
        },
        hasLength(len, msg) {
            add(() => {
                if (String(value).length !== len)
                    throw new Error(msg ?? `Expected length ${len}`);
            }, "string");
            return runner;
        },
        minLength(n, msg) {
            add(() => {
                if (String(value).length < n)
                    throw new Error(msg ?? `Expected length >= ${n}`);
            }, "string");
            return runner;
        },
        maxLength(n, msg) {
            add(() => {
                if (String(value).length > n)
                    throw new Error(msg ?? `Expected length <= ${n}`);
            }, "string");
            return runner;
        },
        lengthBetween(min, max, msg) {
            add(() => {
                const l = String(value).length;
                if (l < min || l > max)
                    throw new Error(msg ?? `Expected length between ${min} and ${max}`);
            }, "string");
            return runner;
        },
        contains(needle, msg) {
            add(() => {
                const s = String(value);
                const ok = typeof needle === "string" ? s.includes(needle) : needle.test(s);
                if (!ok)
                    throw new Error(msg ?? `Expected to contain ${String(needle)}`);
            }, "string");
            return runner;
        },
        startsWith(prefix, msg) {
            add(() => {
                if (!String(value).startsWith(prefix))
                    throw new Error(msg ?? `Expected to start with "${prefix}"`);
            }, "string");
            return runner;
        },
        endsWith(suffix, msg) {
            add(() => {
                if (!String(value).endsWith(suffix))
                    throw new Error(msg ?? `Expected to end with "${suffix}"`);
            }, "string");
            return runner;
        },
        matches(re, msg) {
            add(() => {
                if (!re.test(String(value)))
                    throw new Error(msg ?? `Expected to match ${re}`);
            }, "string");
            return runner;
        },
        equalsIgnoreCase(expected, msg) {
            add(() => {
                if (String(value).toLowerCase() !== expected.toLowerCase())
                    throw new Error(msg ?? `Expected "${expected}" (case-insensitive)`);
            }, "string");
            return runner;
        },
        includesAny(...needles) {
            add(() => {
                const s = String(value);
                if (!needles.some((n) => s.includes(n)))
                    throw new Error(`Expected any of [${needles.join(", ")}]`);
            }, "string");
            return runner;
        },
        includesAll(...needles) {
            add(() => {
                const s = String(value);
                if (!needles.every((n) => s.includes(n)))
                    throw new Error(`Expected all of [${needles.join(", ")}]`);
            }, "string");
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
            }, "string");
            return runner;
        },
    });
    const toArrayChain = () => Object.assign(runner, {
        hasLength(len, msg) {
            add(() => {
                if (value.length !== len)
                    throw new Error(msg ?? `Expected array length ${len}`);
            }, "array");
            return runner;
        },
        notEmpty(msg) {
            add(() => {
                if (value.length === 0)
                    throw new Error(msg ?? "Expected non-empty array");
            }, "array");
            return runner;
        },
        itemIsBoolean(i, msg) {
            add(() => {
                if (typeof value[i] !== "boolean")
                    throw new Error(msg ?? `Expected boolean at ${i}`);
            }, "array");
            return runner;
        },
        itemIsString(i, msg) {
            add(() => {
                if (typeof value[i] !== "string")
                    throw new Error(msg ?? `Expected string at ${i}`);
            }, "array");
            return runner;
        },
        itemIsNumber(i, msg) {
            add(() => {
                if (typeof value[i] !== "number")
                    throw new Error(msg ?? `Expected number at ${i}`);
            }, "array");
            return runner;
        },
        itemIsObject(i, msg) {
            add(() => {
                const v = value[i];
                if (typeof v !== "object" || v === null || Array.isArray(v))
                    throw new Error(msg ?? `Expected object at ${i}`);
            }, "array");
            return runner;
        },
        includesString(needle, msg) {
            add(() => {
                if (!value.some((item) => String(item).includes(needle)))
                    throw new Error(msg ?? `Expected string including "${needle}"`);
            }, "array");
            return runner;
        },
        includesNumber(needle, msg) {
            add(() => {
                if (!value.some((item) => item === needle))
                    throw new Error(msg ?? `Expected number including "${needle}"`);
            }, "array");
            return runner;
        },
        includesObject(needle, msg) {
            add(() => {
                if (!value.some((item) => JSON.stringify(item) === JSON.stringify(needle)))
                    throw new Error(msg ?? `Expected object including "${JSON.stringify(needle)}"`);
            }, "array");
            return runner;
        },
        onlyHasObjects(msg) {
            add(() => {
                if (!value.every((item) => typeof item === "object" &&
                    item !== null &&
                    !Array.isArray(item)))
                    throw new Error(msg ?? "Expected all objects");
            }, "array");
            return runner;
        },
        onlyHasStrings(msg) {
            add(() => {
                if (!value.every((item) => typeof item === "string"))
                    throw new Error(msg ?? "Expected all strings");
            }, "array");
            return runner;
        },
        onlyHasNumbers(msg) {
            add(() => {
                if (!value.every((item) => typeof item === "number"))
                    throw new Error(msg ?? "Expected all numbers");
            }, "array");
            return runner;
        },
        everyIsFalsy(msg) {
            add(() => {
                if (!value.every((item) => !item))
                    throw new Error(msg ?? "Expected all falsy");
            }, "array");
            return runner;
        },
        everyIsTruthy(msg) {
            add(() => {
                if (!value.every((item) => !!item))
                    throw new Error(msg ?? "Expected all truthy");
            }, "array");
            return runner;
        },
        includesCondition(needle, msg) {
            add(() => {
                if (!value.some(needle))
                    throw new Error(msg ?? "Expected array to include condition");
            }, "array");
            return runner;
        },
    });
    const toObjectChain = () => Object.assign(runner, {
        hasKey(key, msg) {
            add(() => {
                if (!(key in value))
                    throw new Error(msg ?? `Expected key "${key}"`);
            }, "object");
            return runner;
        },
        hasKeys(...keys) {
            add(() => {
                for (const k of keys)
                    if (!(k in value))
                        throw new Error(`Expected key "${k}"`);
            }, "object");
            return runner;
        },
        keyEquals(key, expected, msg) {
            add(() => {
                if (value[key] !== expected)
                    throw new Error(msg ?? `Expected ${key} === ${String(expected)}`);
            }, "object");
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
            }, "object");
            return runner;
        },
        allKeysFalsy(msg) {
            add(() => {
                for (const k in value)
                    if (value[k])
                        throw new Error(msg ?? `Key "${k}" not falsy`);
            }, "object");
            return runner;
        },
        allKeysSet(msg) {
            add(() => {
                for (const k in value)
                    if (value[k] === undefined)
                        throw new Error(msg ?? `Key "${k}" unset`);
            }, "object");
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
            }, "object");
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
            }, "element");
            return runner;
        },
        hasChild(msg) {
            return runner.hasChildren(msg);
        },
        hasChildMatching(sel, msg) {
            add(() => {
                const e = value;
                if (typeof Element === "undefined" ||
                    !(e instanceof Element) ||
                    !e.querySelector(sel))
                    throw new Error(msg ?? `Missing child "${sel}"`);
            }, "element");
            return runner;
        },
        hasDescendant(sel, msg) {
            add(() => {
                const e = value;
                if (typeof Element === "undefined" ||
                    !(e instanceof Element) ||
                    !e.querySelector(sel))
                    throw new Error(msg ?? `Missing descendant "${sel}"`);
            }, "element");
            return runner;
        },
        hasAttribute(name, msg) {
            add(() => {
                const e = value;
                if (typeof Element === "undefined" ||
                    !(e instanceof Element) ||
                    !e.hasAttribute(name))
                    throw new Error(msg ?? `Missing attribute "${name}"`);
            }, "element");
            return runner;
        },
        attributeEquals(name, expected, msg) {
            add(() => {
                const e = value;
                if (typeof Element === "undefined" ||
                    !(e instanceof Element) ||
                    e.getAttribute(name) !== expected)
                    throw new Error(msg ?? `Attr "${name}" != "${expected}"`);
            }, "element");
            return runner;
        },
    });
    // Type guards (only on unknown)
    runner.isNumber = (msg) => {
        add(() => {
            if (typeof value !== "number")
                throw new Error(msg ?? "Expected number");
        }, "number");
        return toNumberChain();
    };
    runner.isString = (msg) => {
        add(() => {
            if (typeof value !== "string")
                throw new Error(msg ?? "Expected string");
        }, "string");
        return toStringChain();
    };
    runner.isArray = (msg) => {
        add(() => {
            if (!Array.isArray(value))
                throw new Error(msg ?? "Expected array");
        }, "array");
        return toArrayChain();
    };
    runner.isObject = (msg) => {
        add(() => {
            if (typeof value !== "object" || value === null || Array.isArray(value))
                throw new Error(msg ?? "Expected object");
        }, "object");
        return toObjectChain();
    };
    runner.isElement = (msg) => {
        add(() => {
            if (typeof Element === "undefined" ||
                !(value instanceof Element))
                throw new Error(msg ?? "Expected Element");
        }, "element");
        return toElementChain();
    };
    runner.isBoolean = (msg) => {
        add(() => {
            if (typeof value !== "boolean")
                throw new Error(msg ?? "Expected boolean");
        }, "boolean");
        return runner;
    };
    runner.isNumber = (msg) => {
        add(() => {
            if (typeof value !== "number")
                throw new Error(msg ?? "Expected number");
        }, "number");
        return toNumberChain();
    };
    runner.isString = (msg) => {
        add(() => {
            if (typeof value !== "string")
                throw new Error(msg ?? "Expected string");
        }, "string");
        return toStringChain();
    };
    runner.isArray = (msg) => {
        add(() => {
            if (!Array.isArray(value))
                throw new Error(msg ?? "Expected array");
        }, "array");
        return toArrayChain();
    };
    runner.isObject = (msg) => {
        add(() => {
            if (typeof value !== "object" || value === null || Array.isArray(value))
                throw new Error(msg ?? "Expected object");
        }, "object");
        return toObjectChain();
    };
    runner.isElement = (msg) => {
        add(() => {
            if (typeof Element === "undefined" ||
                !(value instanceof Element))
                throw new Error(msg ?? "Expected Element");
        }, "element");
        return toElementChain();
    };
    runner.isBoolean = (msg) => {
        add(() => {
            if (typeof value !== "boolean")
                throw new Error(msg ?? "Expected boolean");
        }, "boolean");
        return runner;
    };
    // Nullish guards producing terminal states
    runner.isNull = (msg) => {
        add(() => {
            if (value !== null)
                throw new Error(msg ?? "Expected null");
        }, "null");
        return runner;
    };
    runner.isUndefined = (msg) => {
        add(() => {
            if (value !== undefined)
                throw new Error(msg ?? "Expected undefined");
        }, "undefined");
        return runner;
    };
    // Non‑nullish guards that KEEP other type guards (move to 'present')
    runner.notNil = (msg) => {
        add(() => {
            if (value === null || value === undefined)
                throw new Error(msg ?? "Expected value (not null/undefined)");
        }, "present");
        return runner;
    };
    runner.notNull = (msg) => {
        add(() => {
            if (value === null)
                throw new Error(msg ?? "Expected not null");
        }, "unknown");
        return runner;
    };
    runner.notNullOrUndefined = (msg) => {
        add(() => {
            if (value === null || value === undefined)
                throw new Error(msg ?? "Expected value (not null/undefined)");
        }, "unknown");
        return runner;
    };
    return runner;
}
// Exported entry
export function that(value) {
    return createAssumption(value);
}
export function assume(value) {
    return createAssumption(value);
}
export function assertIsString(v, msg) {
    assume(v).isString(msg)();
}
export function assertNotNil(v, msg) {
    if (v === undefined || v === null || typeof v === "undefined")
        throw new Error(msg ?? "Entry is nil. Expected not null or undefined");
}
export function assertIsObject(v, msg) {
    if (typeof v !== "object" || v === null || Array.isArray(v))
        throw new Error(msg ?? "Expected object");
}
export const Checks = {
    ...CoreChecks,
    ...ObjectChecks,
    ...ArrayChecks,
    ...ElementChecks,
};
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
export class AssumptionError extends Error {
    name = "AssumptionError";
    assumeStack;
    valuePreview;
    timestamp;
    cause;
    constructor(message, opts) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.assumeStack = opts.stack;
        this.valuePreview = previewValue(opts.value);
        this.timestamp = Date.now();
        this.cause = opts.cause;
    }
}
export function isAssumptionError(err) {
    return (!!err && typeof err === "object" && err.name === "AssumptionError");
}
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
export function defRefHandler(def, log = false) {
    return (err) => {
        enrichWithHandlerName(err, defRefHandler);
        if (log)
            (typeof log === "function" ? log : console.error)(err);
        return def;
    };
}
export function defRefHandlerAsync(def, log = false) {
    return async (err) => {
        enrichWithHandlerName(err, defRefHandlerAsync);
        if (log)
            (typeof log === "function" ? log : console.error)(err);
        return def;
    };
}
export function assumedRoute(onRefuted, handler) {
    return (...args) => {
        try {
            const result = handler(...args);
            if (result && typeof result.then === "function") {
                return result.catch((e) => onRefuted(enrichWithHandlerName(e, handler), ...args));
            }
            return result;
        }
        catch (e) {
            return onRefuted(enrichWithHandlerName(e, handler), ...args);
        }
    };
}
