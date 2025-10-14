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
        },
        isFalse(msg) {
            if (!failed)
                throw new Error(msg ?? "Expected assumptions to be refuted");
        },
        // Boolean probes
        wasCorrect() {
            return !failed;
        },
        wasWrong() {
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
export function check(fn) {
    try {
        return assuming(() => {
            fn();
            return true;
        }, { quiet: true }).wasCorrect();
    }
    catch {
        return false;
    }
}
export const CoreChecks = {
    that(cond, msg) {
        if (!cond)
            throw new Error(msg ?? "(assumption failed)");
    },
    isTrue(cond, msg) {
        if (!cond)
            throw new Error(msg ?? "(assumption failed: expected true)");
    },
    isFalse(cond, msg) {
        if (cond)
            throw new Error(msg ?? "(assumption failed: expected false)");
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
    isPresent(v, msg) {
        // neither null nor undefined
        if (v == null)
            throw new Error(msg ?? "Expected value to be present");
    },
};
export const ObjectChecks = {
    isObject(v, msg) {
        if (typeof v !== "object" || v === null || Array.isArray(v))
            throw new Error(msg ?? "Expected object");
        assertIsObject(v);
    },
    hasKey(obj, key, msg) {
        if (!(key in obj))
            throw new Error(msg ?? `Expected object with key "${key}"`);
    },
    hasKeys(obj, ...keys) {
        for (const key of keys)
            if (!(key in obj))
                throw new Error(`Expected object with key "${key}"`);
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
    const runAll = () => {
        for (const c of queue)
            c();
        return true;
    };
    const runner = function () {
        return runAll();
    };
    const add = (fn) => {
        queue.push(fn);
    };
    const base = {
        that(predicate, msg) {
            add(() => {
                if (!predicate(value))
                    throw new Error(msg ?? "Assumption failed");
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
        run() {
            return runAll();
        },
        value() {
            return value;
        },
    };
    Object.assign(runner, base);
    const toNumberChain = () => {
        const addNum = (fn) => add(() => fn(value));
        const num = {
            ...base,
            greaterThan(n, msg) {
                addNum((v) => {
                    if (!(v > n))
                        throw new Error(msg ?? `Expected > ${n}`);
                });
                return runner;
            },
            greaterOrEqual(n, msg) {
                addNum((v) => {
                    if (!(v >= n))
                        throw new Error(msg ?? `Expected >= ${n}`);
                });
                return runner;
            },
            lessThan(n, msg) {
                addNum((v) => {
                    if (!(v < n))
                        throw new Error(msg ?? `Expected < ${n}`);
                });
                return runner;
            },
            lessOrEqual(n, msg) {
                addNum((v) => {
                    if (!(v <= n))
                        throw new Error(msg ?? `Expected <= ${n}`);
                });
                return runner;
            },
            between(min, max, msg) {
                addNum((v) => {
                    if (!(v >= min && v <= max))
                        throw new Error(msg ?? `Expected between ${min} and ${max}`);
                });
                return runner;
            },
        };
        return Object.assign(runner, num);
    };
    const toElementChain = () => {
        const addEl = (fn) => add(() => fn(value));
        const el = {
            ...base,
            hasChildren(msg) {
                addEl((e) => {
                    if (typeof Element === "undefined" || !(e instanceof Element))
                        throw new Error("Expected Element");
                    if (e.childElementCount === 0)
                        throw new Error(msg ?? "Expected element to have at least one child element");
                });
                return runner;
            },
            hasChild(msg) {
                return runner.hasChildren(msg);
            },
            hasChildMatching(selector, msg) {
                addEl((e) => {
                    if (typeof Element === "undefined" || !(e instanceof Element))
                        throw new Error("Expected Element");
                    if (!e.querySelector(selector))
                        throw new Error(msg ?? `Expected child matching selector "${selector}"`);
                });
                return runner;
            },
            hasDescendant(selector, msg) {
                addEl((e) => {
                    if (typeof Element === "undefined" || !(e instanceof Element))
                        throw new Error("Expected Element");
                    if (!e.querySelector(selector))
                        throw new Error(msg ?? `Expected descendant matching selector "${selector}"`);
                });
                return runner;
            },
            hasAttribute(name, msg) {
                addEl((e) => {
                    if (typeof Element === "undefined" || !(e instanceof Element))
                        throw new Error("Expected Element");
                    if (!e.hasAttribute(name))
                        throw new Error(msg ?? `Expected attribute "${name}"`);
                });
                return runner;
            },
            attributeEquals(name, expected, msg) {
                addEl((e) => {
                    if (typeof Element === "undefined" || !(e instanceof Element))
                        throw new Error("Expected Element");
                    if (e.getAttribute(name) !== expected)
                        throw new Error(msg ?? `Expected attribute "${name}" to equal "${expected}"`);
                });
                return runner;
            },
        };
        return Object.assign(runner, el);
    };
    const toArrayChain = () => {
        const addArr = (fn) => add(() => fn(value));
        const arr = {
            ...base,
            hasLength(len, msg) {
                addArr((a) => {
                    if (a.length !== len)
                        throw new Error(msg ?? `Expected array length ${len}`);
                });
                return runner;
            },
            notEmpty(msg) {
                addArr((a) => {
                    if (a.length === 0)
                        throw new Error(msg ?? "Expected non-empty array");
                });
                return runner;
            },
            itemIsBoolean(index, msg) {
                addArr((a) => {
                    if (typeof a[index] !== "boolean")
                        throw new Error(msg ?? `Expected boolean at index ${index}`);
                });
                return runner;
            },
            itemIsString(index, msg) {
                addArr((a) => {
                    if (typeof a[index] !== "string")
                        throw new Error(msg ?? `Expected string at index ${index}`);
                });
                return runner;
            },
            itemIsNumber(index, msg) {
                addArr((a) => {
                    if (typeof a[index] !== "number")
                        throw new Error(msg ?? `Expected number at index ${index}`);
                });
                return runner;
            },
            itemIsObject(index, msg) {
                addArr((a) => {
                    const v = a[index];
                    if (typeof v !== "object" || v === null || Array.isArray(v))
                        throw new Error(msg ?? `Expected object at index ${index}`);
                });
                return runner;
            },
        };
        return Object.assign(runner, arr);
    };
    // ADD: toStringChain
    const toStringChain = () => {
        const addStr = (fn) => add(() => fn(String(value)));
        const str = {
            ...base,
            notEmpty(msg) {
                addStr((s) => {
                    if (s.length === 0)
                        throw new Error(msg ?? "Expected non-empty string");
                });
                return runner;
            },
            hasLength(len, msg) {
                addStr((s) => {
                    if (s.length !== len)
                        throw new Error(msg ?? `Expected length ${len}`);
                });
                return runner;
            },
            minLength(n, msg) {
                addStr((s) => {
                    if (s.length < n)
                        throw new Error(msg ?? `Expected length >= ${n}`);
                });
                return runner;
            },
            maxLength(n, msg) {
                addStr((s) => {
                    if (s.length > n)
                        throw new Error(msg ?? `Expected length <= ${n}`);
                });
                return runner;
            },
            lengthBetween(min, max, msg) {
                addStr((s) => {
                    if (s.length < min || s.length > max)
                        throw new Error(msg ?? `Expected length between ${min} and ${max}`);
                });
                return runner;
            },
            contains(needle, msg) {
                addStr((s) => {
                    const ok = typeof needle === "string" ? s.includes(needle) : needle.test(s);
                    if (!ok)
                        throw new Error(msg ?? `Expected string to contain ${String(needle)}`);
                });
                return runner;
            },
            startsWith(prefix, msg) {
                addStr((s) => {
                    if (!s.startsWith(prefix))
                        throw new Error(msg ?? `Expected to start with "${prefix}"`);
                });
                return runner;
            },
            endsWith(suffix, msg) {
                addStr((s) => {
                    if (!s.endsWith(suffix))
                        throw new Error(msg ?? `Expected to end with "${suffix}"`);
                });
                return runner;
            },
            matches(re, msg) {
                addStr((s) => {
                    if (!re.test(s))
                        throw new Error(msg ?? `Expected to match ${re}`);
                });
                return runner;
            },
            equalsIgnoreCase(expected, msg) {
                addStr((s) => {
                    if (s.toLowerCase() !== expected.toLowerCase())
                        throw new Error(msg ?? `Expected "${expected}" (case-insensitive)`);
                });
                return runner;
            },
            includesAny(...needles) {
                addStr((s) => {
                    if (!needles.some((n) => s.includes(n)))
                        throw new Error(`Expected to include any of [${needles.join(", ")}]`);
                });
                return runner;
            },
            includesAll(...needles) {
                addStr((s) => {
                    if (!needles.every((n) => s.includes(n)))
                        throw new Error(`Expected to include all of [${needles.join(", ")}]`);
                });
                return runner;
            },
            isJSON(msg) {
                addStr((s) => {
                    try {
                        JSON.parse(s);
                    }
                    catch {
                        throw new Error(msg ?? "Expected valid JSON");
                    }
                });
                return runner;
            },
        };
        return Object.assign(runner, str);
    };
    // Type guards
    runner.isString = (msg) => {
        add(() => {
            if (typeof value !== "string")
                throw new Error(msg ?? "Expected string");
        });
        return toStringChain(); // CHANGED
    };
    return runner;
}
// Exported entry
export function assume(value) {
    return createAssumption(value);
}
export function that(value) {
    return createAssumption(value);
}
export function assertIsString(v, msg) {
    assume(v).isString(msg)();
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
