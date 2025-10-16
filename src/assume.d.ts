type TypeTag = "unknown" | "string" | "number" | "array" | "object" | "element" | "datetime" | "boolean" | "null" | "undefined" | "present";
/**
 * A zero-argument check function queued in a chain.
 */
export type Check = () => void;
/**
 * An entry in the chain queue, pairing the executable check with a type tag
 * (for potential introspection / debugging).
 */
export type ChainLink = {
    check: Check;
    type: TypeTag | "function" | "datetime";
    methodName?: string;
};
type GuardMethods<T, K extends TypeTag> = K extends "unknown" ? {
    isString(msg?: string): AssumptionFn<string, "string">;
    isNumber(msg?: string): AssumptionFn<number, "number">;
    isArray(msg?: string): AssumptionFn<unknown[], "array">;
    isObject(msg?: string): AssumptionFn<Record<string, unknown>, "object">;
    isElement(msg?: string): AssumptionFn<any, "element">;
    isDate(msg?: string): AssumptionFn<Date, "datetime">;
    isBoolean(msg?: string): AssumptionFn<boolean, "boolean">;
    isNull(msg?: string): AssumptionFn<null, "null">;
    isUndefined(msg?: string): AssumptionFn<undefined, "undefined">;
    notNil(msg?: string): AssumptionFn<NonNullable<T>, "present">;
    notNull(msg?: string): AssumptionFn<Exclude<T, null>, "present">;
    notNullOrUndefined(msg?: string): AssumptionFn<NonNullable<T>, "present">;
} : {};
type DetectTypeTag<T> = T extends string ? "string" : T extends number ? "number" : T extends boolean ? "boolean" : T extends any[] ? "array" : T extends HTMLElement ? "element" : T extends Element ? "element" : T extends Record<string, any> ? "object" : T extends null ? "null" : T extends undefined ? "undefined" : "unknown";
interface BaseChain<T, K extends TypeTag> {
    /** Additionally require a boolean or zero-arg function (or chain) to pass. */
    and(condition: boolean | (() => boolean | void), msg?: string): AssumptionFn<T, K>;
    /** Group previous checks as LHS; pass if LHS passes or RHS condition passes. */
    or(condition: boolean | (() => boolean | void), msg?: string): AssumptionFn<T, K>;
    /** Apply an additional type-guard to narrow the chain value. */
    andGuard<S extends T>(guard: (v: T) => v is S, msg?: string): AssumptionFn<S, DetectTypeTag<S>>;
    that(predicate: (v: T) => boolean, msg?: string): AssumptionFn<T, K>;
    equals(expected: T, msg?: string): AssumptionFn<T, K>;
    instanceof(expectedOrMsg?: string | (new (...args: any[]) => any) | undefined, msg?: string | undefined): AssumptionFn<T, DetectTypeTag<T>> | AssumptionFn<T, TypeTag> | void;
    value(): T;
    /** Run the queued checks and return the (narrowed) value if they pass. */
    commit(): T;
}
type NumberOnlyChain = {
    greaterThan(n: number, msg?: string): AssumptionFn<number, "number">;
    greaterOrEqual(n: number, msg?: string): AssumptionFn<number, "number">;
    lessThan(n: number, msg?: string): AssumptionFn<number, "number">;
    lessOrEqual(n: number, msg?: string): AssumptionFn<number, "number">;
    between(min: number, max: number, msg?: string): AssumptionFn<number, "number">;
};
type StringOnlyChain = {
    notEmpty(msg?: string): AssumptionFn<string, "string">;
    lengthMustBe(len: number, msg?: string): AssumptionFn<string, "string">;
    lengthAtLeast(n: number, msg?: string): AssumptionFn<string, "string">;
    lengthAtMost(n: number, msg?: string): AssumptionFn<string, "string">;
    hasLength(len: number, msg?: string): AssumptionFn<string, "string">;
    minLength(n: number, msg?: string): AssumptionFn<string, "string">;
    maxLength(n: number, msg?: string): AssumptionFn<string, "string">;
    lengthBetween(min: number, max: number, msg?: string): AssumptionFn<string, "string">;
    contains(needle: string | RegExp, msg?: string): AssumptionFn<string, "string">;
    startsWith(prefix: string, msg?: string): AssumptionFn<string, "string">;
    endsWith(suffix: string, msg?: string): AssumptionFn<string, "string">;
    matches(re: RegExp, msg?: string): AssumptionFn<string, "string">;
    equalsIgnoreCase(expected: string, msg?: string): AssumptionFn<string, "string">;
    includesAny(...needles: string[]): AssumptionFn<string, "string">;
    includesAll(...needles: string[]): AssumptionFn<string, "string">;
    isJSON(msg?: string): AssumptionFn<string, "string">;
    trimmedNotEmpty(msg?: string): AssumptionFn<string, "string">;
};
type ArrayOnlyChain = {
    lengthMustBe(len: number, msg?: string): AssumptionFn<unknown[], "array">;
    hasLength(len: number, msg?: string): AssumptionFn<unknown[], "array">;
    notEmpty(msg?: string): AssumptionFn<unknown[], "array">;
    /** True if the array contains at least one of the given strings (by equality). */
    hasAnyOf(items: string[], msg?: string): AssumptionFn<unknown[], "array">;
    /** True if the array contains all of the given strings (by equality). */
    hasEveryOf(items: string[], msg?: string): AssumptionFn<unknown[], "array">;
    /** @deprecated Alias of hasEveryOf */
    hasAllOf(items: string[], msg?: string): AssumptionFn<unknown[], "array">;
    includesString(needle: string, msg?: string): AssumptionFn<unknown[], "array">;
    includesNumber(needle: number, msg?: string): AssumptionFn<unknown[], "array">;
    includesObject(needle: Record<string, unknown>, msg?: string): AssumptionFn<unknown[], "array">;
    onlyHasObjects(msg?: string): AssumptionFn<unknown[], "array">;
    onlyHasStrings(msg?: string): AssumptionFn<unknown[], "array">;
    onlyHasNumbers(msg?: string): AssumptionFn<unknown[], "array">;
    everyIsFalsy(msg?: string): AssumptionFn<unknown[], "array">;
    everyIsTruthy(msg?: string): AssumptionFn<unknown[], "array">;
    includesCondition(needle: (item: unknown) => boolean, msg?: string): AssumptionFn<unknown[], "array">;
    itemIsBoolean(index: number, msg?: string): AssumptionFn<unknown[], "array">;
    itemIsString(index: number, msg?: string): AssumptionFn<unknown[], "array">;
    itemIsNumber(index: number, msg?: string): AssumptionFn<unknown[], "array">;
    itemIsObject(index: number, msg?: string): AssumptionFn<unknown[], "array">;
};
type ObjectOnlyChain = {
    hasKey<K extends string>(key: K, msg?: string): AssumptionFn<Record<string, unknown>, "object">;
    hasKeys(...keys: string[]): AssumptionFn<Record<string, unknown>, "object">;
    keyEquals<K extends string>(key: K, expected: unknown, msg?: string): AssumptionFn<Record<string, unknown>, "object">;
    sameKeys(expected: Record<string, unknown>, msg?: string): AssumptionFn<Record<string, unknown>, "object">;
    allKeysFalsy(msg?: string): AssumptionFn<Record<string, unknown>, "object">;
    allKeysSet(msg?: string): AssumptionFn<Record<string, unknown>, "object">;
    anyKeyNull(msg?: string): AssumptionFn<Record<string, unknown>, "object">;
};
type ElementOnlyChain = {
    hasChildren(msg?: string): AssumptionFn<any, "element">;
    hasChild(msg?: string): AssumptionFn<any, "element">;
    hasChildMatching(selector: string, msg?: string): AssumptionFn<any, "element">;
    hasDescendant(selector: string, msg?: string): AssumptionFn<any, "element">;
    hasAttribute(name: string, msg?: string): AssumptionFn<any, "element">;
    attributeEquals(name: string, expected: string, msg?: string): AssumptionFn<any, "element">;
};
type DateTimeOnlyChain = {
    /** Value is earlier than the given date/time */
    earlier(than: Date | number, msg?: string): AssumptionFn<Date, "datetime">;
    /** Value is later than the given date/time */
    later(than: Date | number, msg?: string): AssumptionFn<Date, "datetime">;
    /** Year matches the given year */
    isYear(year: number, msg?: string): AssumptionFn<Date, "datetime">;
    /** Value was before the given date/time (alias of earlier) */
    wasBefore(than: Date | number, msg?: string): AssumptionFn<Date, "datetime">;
    /** Days since the value exceeds N */
    daysAgoExceeds(n: number, msg?: string): AssumptionFn<Date, "datetime">;
    /** Days since the value is at least N */
    daysSinceAtLeast(n: number, msg?: string): AssumptionFn<Date, "datetime">;
};
type Specialized<T, K extends TypeTag> = K extends "number" ? NumberOnlyChain : K extends "string" ? StringOnlyChain : K extends "array" ? ArrayOnlyChain : K extends "object" ? ObjectOnlyChain : K extends "element" ? ElementOnlyChain : K extends "datetime" ? DateTimeOnlyChain : {};
export type AssumptionFn<T, K extends TypeTag = "unknown"> = (() => boolean | void) & BaseChain<T, K> & GuardMethods<T, K> & Specialized<T, K>;
export type Listener<T = any> = (payload?: T) => void;
export declare class AssumingBus extends EventTarget {
    private map;
    on<T = any>(event: string, fn: Listener<T>): () => void;
    off(event: string, fn: Listener): void;
    once<T = any>(event: string, fn: Listener<T>): () => void;
    emit<T = any>(event: string, payload?: T): void;
    addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void;
    dispatchEvent(event: Event): boolean;
    removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void;
}
export declare const assumingBus: AssumingBus;
export interface AssumingOptions {
    quiet?: boolean;
    message?: string;
    emit?: string;
}
export type Assumption = boolean | (() => boolean | void);
export declare function assuming(...args: Array<Assumption | AssumingOptions | string | null | undefined>): {
    /**
     * Emit an event only when the assumptions pass (vindicated).
     * @param event Event name to emit.
     * @param data Optional payload or producer function. If omitted, the original value from the first chain is used when available.
     */
    /** Emit when pass (vindicated). Sugar for emitOn(() => !failed, event, data) */
    emitOnPass(event: string, data?: unknown | (() => unknown)): /*elided*/ any;
    /**
     * Emit an event only when the assumptions fail (refuted).
     * @param event Event name to emit.
     * @param data Optional payload or producer function. If omitted, the original value from the first chain is used when available.
     */
    /** Emit when fail (refuted). Sugar for emitOn(() => failed, event, data) */
    emitOnFail(event: string, data?: unknown | (() => unknown)): /*elided*/ any;
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
    emitOn(condition: boolean | (() => boolean), event: string, data?: unknown | (() => unknown)): /*elided*/ any;
    /**
     * Run a handler only when assumptions pass. Errors thrown by the handler will propagate.
     * @param fn Zero-argument function to run on success. Its return is captured by value().
     */
    Run<R>(fn: () => R): /*elided*/ any;
    /**
     * Retrieve the last result produced by Run()/result()/onRefuted()/onVindicated()/catch().
     */
    value<T = unknown>(): T | undefined;
    /** Boolean terminal: true when vindicated, false when refuted. */
    returnBoolean(): boolean;
    /**
     * Run only when refuted; stores return as lastResult.
     * @param fn Handler receiving the error; return value is stored in value().
     */
    onRefuted(fn: (err?: unknown) => unknown): /*elided*/ any;
    /**
     * Run only when vindicated; stores return as lastResult.
     * @param fn Handler to run on success; return value is stored in value().
     */
    onVindicated(fn: () => unknown): /*elided*/ any;
    /**
     * Run handler unless the condition is true. Accepts a boolean or a () => boolean.
     * Useful for early exits: .unless(isFeatureEnabled, () => doFallback())
     */
    unless(condition: boolean | (() => boolean), fn: () => unknown): /*elided*/ any;
    /**
     * Catch refutations; behaves like onRefuted but matches Promise.catch shape.
     * @param fn Handler receiving the error; return value is stored in value().
     */
    catch(fn: (err: unknown) => unknown): /*elided*/ any;
    /**
     * Either/Or fork with your original value as the asserter parameter.
     * Think: "String or Object? Red or Blue?" — write two small functions and we pass the same original value to either branch.
     * - either(original): assumptions passed → handle as one case (e.g., string → JSON.parse)
     * - or(original): failed without throwing → handle the alternative (e.g., already parsed → return as-is)
     * - neither(error): failed with an error → handle exception cases
     * Returns whatever your branch returns. Quiet mode is turned on automatically to avoid eager throws before branching.
     */
    eitherOr<R>(either: (value: unknown) => R, or?: (value: unknown) => R, neither?: (err?: unknown) => R): R | undefined;
    /**
     * Branch result depending on current state; stores return as lastResult.
     * @param success Called when vindicated.
     * @param failure Called when refuted (optional).
     */
    result<R>(success: () => R, failure?: (err?: unknown) => R): R | undefined;
    /** Quick status accessor for testing and telemetry */
    status(): {
        readonly failed: boolean;
        readonly error: unknown;
        readonly lastResult: unknown;
    };
    /** Set the failure message used when throwing. */
    message(msg: string): /*elided*/ any;
    /** Toggle quiet mode (do not throw on refutation). */
    quiet(value?: boolean): /*elided*/ any;
    /** Get a copy of the current options. */
    options(): Readonly<AssumingOptions>;
};
export declare function safeToAssume(...args: any[]): boolean;
type AssumeEvent = {
    t: number;
    kind: "start";
    info: {
        valuePreview?: string;
    };
} | {
    t: number;
    kind: "check";
    info: {
        type: TypeTag | "function" | "datetime";
        op?: string;
    };
} | {
    t: number;
    kind: "refuted";
    info: {
        message: string;
    };
} | {
    t: number;
    kind: "vindicated";
};
export declare const captureLocation: string | undefined;
export declare class AssumptionError extends Error {
    readonly name = "AssumptionError";
    readonly assumeStack: ChainLink[];
    readonly valuePreview?: string;
    readonly timestamp: number;
    readonly cause: unknown;
    readonly chainTrace: string[];
    readonly captureLocation?: string;
    constructor(message: string, opts: {
        stack: ChainLink[];
        value?: unknown;
        cause?: unknown;
        chainTrace?: string[];
        captureLocation?: string;
        inferenceText?: string;
    });
    private buildRichMessage;
}
export declare function isAssumptionError(err: unknown): err is AssumptionError;
export declare function that<T>(value: T): AssumptionFn<T, "unknown">;
export declare function assume<T>(value: T): AssumptionFn<T, "unknown">;
export declare function getAssumeHistory(): ReadonlyArray<AssumeEvent>;
export declare function clearAssumeHistory(): void;
export declare function setAssumeHistoryLimit(n: number): void;
export type AnyFn = (...args: any[]) => any;
/**
 * Create a default refute handler for synchronous code.
 * @param def Default value to return when an error occurs.
 * @param log When true, logs to console; or provide a custom logger function.
 */
export declare function defRefHandler<R>(def: R, log?: ((err: unknown) => void) | boolean): (err: unknown) => R;
/**
 * Create a default refute handler for asynchronous code.
 * @param def Default resolved value to return when an error occurs.
 * @param log When true, logs to console; or provide a custom logger function.
 */
export declare function defRefHandlerAsync<R>(def: R, log?: ((err: unknown) => void) | boolean): (err: unknown) => Promise<R>;
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
export declare function assumedRoute<F extends AnyFn>(def: Awaited<ReturnType<F>>, handler: F, log?: ((err: unknown) => void) | boolean): (...args: Parameters<F>) => ReturnType<F>;
/** @internal Asserts the value is a string at runtime and for TypeScript. */
export declare function assertIsString(v: unknown, msg?: string): asserts v is string;
/** @internal Asserts the value is a number at runtime and for TypeScript. */
export declare function assertIsNumber(v: unknown, msg?: string): asserts v is number;
/** @internal Asserts the value is an array at runtime and for TypeScript. */
export declare function assertIsArray(v: unknown, msg?: string): asserts v is unknown[];
/** @internal Asserts the value is a plain object (non-null, non-array). */
export declare function assertIsObject(v: unknown, msg?: string): asserts v is Record<string, unknown>;
/** @internal Asserts the value is a DOM Element. */
export declare function assertIsElement(v: unknown, msg?: string): asserts v is Element;
/** @internal Asserts the value is a boolean. */
export declare function assertIsBoolean(v: unknown, msg?: string): asserts v is boolean;
/** @internal Asserts the value is a Date instance. */
export declare function assertIsDate(v: unknown, msg?: string): asserts v is Date;
/** @internal Asserts the value is null. Useful for explicit null checks. */
export declare function assertIsNull(v: unknown, msg?: string): asserts v is null;
/** @internal Asserts the value is not null. */
export declare function assertNotNull<T>(v: T, msg?: string): asserts v is Exclude<T, null>;
/** @internal Asserts the value is undefined. */
export declare function assertIsUndefined(v: unknown, msg?: string): asserts v is undefined;
/** @internal Asserts the value is not undefined. */
export declare function assertNotUndefined<T>(v: T, msg?: string): asserts v is Exclude<T, undefined>;
/** @internal Asserts the value is neither null nor undefined. */
export declare function assertNotNullOrUndefined<T>(v: T, msg?: string): asserts v is NonNullable<T>;
/** @internal Asserts the code path is unreachable (useful for exhaustive switches). */
export declare function assertNever(x: never, msg?: string): never;
export declare const IsString: typeof assertIsString;
export declare const IsNumber: typeof assertIsNumber;
export declare const IsArray: typeof assertIsArray;
export declare const IsObject: typeof assertIsObject;
export declare const IsElement: typeof assertIsElement;
export declare const IsBoolean: typeof assertIsBoolean;
export declare const IsDate: typeof assertIsDate;
export declare const IsNull: typeof assertIsNull;
export declare const NotNull: typeof assertNotNull;
export declare const IsUndefined: typeof assertIsUndefined;
export declare const NotUndefined: typeof assertNotUndefined;
export declare const NotNullOrUndefined: typeof assertNotNullOrUndefined;
export declare const assureString: typeof assertIsString;
export declare const assureNumber: typeof assertIsNumber;
export declare const assureArray: typeof assertIsArray;
export declare const assureObject: typeof assertIsObject;
export declare const assureElement: typeof assertIsElement;
export declare const assureBoolean: typeof assertIsBoolean;
export declare const assureDate: typeof assertIsDate;
export declare const assureNull: typeof assertIsNull;
export declare const assureNotNull: typeof assertNotNull;
export declare const assureUndefined: typeof assertIsUndefined;
export declare const assureNotUndefined: typeof assertNotUndefined;
export declare const assurePresent: typeof assertNotNullOrUndefined;
export declare function assertStringNotEmpty(v: unknown, msg?: string): asserts v is string;
export declare function assertStringHasLength(v: unknown, len: number, msg?: string): asserts v is string;
export declare function assertStringMinLength(v: unknown, n: number, msg?: string): asserts v is string;
export declare function assertStringMaxLength(v: unknown, n: number, msg?: string): asserts v is string;
export declare function assertStringLengthBetween(v: unknown, min: number, max: number, msg?: string): asserts v is string;
export declare function assertStringContains(v: unknown, needle: string | RegExp, msg?: string): asserts v is string;
export declare function assertStringStartsWith(v: unknown, prefix: string, msg?: string): asserts v is string;
export declare function assertStringEndsWith(v: unknown, suffix: string, msg?: string): asserts v is string;
export declare function assertStringMatches(v: unknown, re: RegExp, msg?: string): asserts v is string;
export declare function assertStringEqualsIgnoreCase(v: unknown, expected: string, msg?: string): asserts v is string;
export declare function assertStringIncludesAny(v: unknown, needles: string[], msg?: string): asserts v is string;
export declare function assertStringIncludesAll(v: unknown, needles: string[], msg?: string): asserts v is string;
export declare function assertStringIsJSON(v: unknown, msg?: string): asserts v is string;
/** Assert a string is one of the provided options. */
export declare function assertStringOneOf(v: unknown, options: string[], msg?: string): asserts v is string;
/**
 * Assert a string equals the expected value, optionally ignoring whitespace.
 * When ignoreAllWhitespace is true, all whitespace is removed before comparing; otherwise strings are trimmed.
 */
export declare function assertStringEqualsIgnoreWhitespace(v: unknown, expected: string, ignoreAllWhitespace?: boolean, msg?: string): asserts v is string;
/** Assert the value is a Base64 string (basic RFC4648, non-URL-safe). */
export declare function isBase64(v: unknown, msg?: string): asserts v is string;
export declare const assertIsBase64: typeof isBase64;
export declare function assertArrayNotEmpty(v: unknown, msg?: string): asserts v is unknown[];
export declare function assertArrayHasLength(v: unknown, len: number, msg?: string): asserts v is unknown[];
export declare function assertArrayHasAnyOf(v: unknown, items: string[], msg?: string): asserts v is unknown[];
export declare function assertArrayHasEveryOf(v: unknown, items: string[], msg?: string): asserts v is unknown[];
export declare function assertArrayItemIsBoolean(v: unknown, index: number, msg?: string): asserts v is unknown[];
export declare function assertArrayItemIsString(v: unknown, index: number, msg?: string): asserts v is unknown[];
export declare function assertArrayItemIsNumber(v: unknown, index: number, msg?: string): asserts v is unknown[];
export declare function assertArrayItemIsObject(v: unknown, index: number, msg?: string): asserts v is unknown[];
export declare function assertArrayIncludesString(v: unknown, needle: string, msg?: string): asserts v is unknown[];
export declare function assertArrayIncludesNumber(v: unknown, needle: number, msg?: string): asserts v is unknown[];
export declare function assertArrayIncludesObject(v: unknown, needle: Record<string, unknown>, msg?: string): asserts v is unknown[];
export declare function assertArrayOnlyStrings(v: unknown, msg?: string): asserts v is string[];
export declare function assertArrayOnlyNumbers(v: unknown, msg?: string): asserts v is number[];
export declare function assertArrayOnlyObjects(v: unknown, msg?: string): asserts v is Record<string, unknown>[];
export declare function assertArrayEveryTruthy(v: unknown, msg?: string): asserts v is unknown[];
export declare function assertArrayEveryFalsy(v: unknown, msg?: string): asserts v is unknown[];
export declare function assertObjectHasKey<T extends object, K extends string>(obj: T, key: K, msg?: string): asserts obj is T & Record<K, unknown>;
export declare function assertObjectHasKeys<T extends object, K extends readonly string[]>(obj: T, keys: K, msg?: string): asserts obj is T & Record<K[number], unknown>;
export declare function assertObjectKeyEquals<T extends object, K extends string, V = unknown>(obj: T, key: K, expected: V, msg?: string): asserts obj is T & Record<K, V>;
export declare function assertObjectAllKeysSet<T extends object>(obj: T, msg?: string): asserts obj is {
    [P in keyof T]-?: Exclude<T[P], undefined>;
};
export declare function assertObjectAnyKeyNull(obj: unknown, msg?: string): asserts obj is Record<string, unknown>;
/** Object keys must match exactly the provided list (no missing, no extra). */
export declare function assertObjectKeysExactly<K extends readonly string[]>(obj: unknown, keys: K, msg?: string): asserts obj is {
    [P in K[number]]: unknown;
};
/** Assert an element is a child/descendant of a given parent (Element or selector). */
export declare function assertElementIsChildOf(el: unknown, parent: Element | string, msg?: string): asserts el is Element;
export declare const assureStringNotEmpty: typeof assertStringNotEmpty;
export declare const assureStringHasLength: typeof assertStringHasLength;
export declare const assureStringMinLength: typeof assertStringMinLength;
export declare const assureStringMaxLength: typeof assertStringMaxLength;
export declare const assureStringLengthBetween: typeof assertStringLengthBetween;
export declare const assureStringContains: typeof assertStringContains;
export declare const assureStringStartsWith: typeof assertStringStartsWith;
export declare const assureStringEndsWith: typeof assertStringEndsWith;
export declare const assureStringMatches: typeof assertStringMatches;
export declare const assureStringEqualsIgnoreCase: typeof assertStringEqualsIgnoreCase;
export declare const assureStringIncludesAny: typeof assertStringIncludesAny;
export declare const assureStringIncludesAll: typeof assertStringIncludesAll;
export declare const assureStringIsJSON: typeof assertStringIsJSON;
export declare const assureStringTrimmedNotEmpty: typeof assertStringTrimmedNotEmpty;
export declare const assureStringOneOf: typeof assertStringOneOf;
export declare const assureStringEqualsIgnoreWhitespace: typeof assertStringEqualsIgnoreWhitespace;
export declare const assureArrayNotEmpty: typeof assertArrayNotEmpty;
export declare const assureArrayHasLength: typeof assertArrayHasLength;
export declare const assureArrayHasAnyOf: typeof assertArrayHasAnyOf;
export declare const assureArrayHasEveryOf: typeof assertArrayHasEveryOf;
export declare const assureArrayItemIsBoolean: typeof assertArrayItemIsBoolean;
export declare const assureArrayItemIsString: typeof assertArrayItemIsString;
export declare const assureArrayItemIsNumber: typeof assertArrayItemIsNumber;
export declare const assureArrayItemIsObject: typeof assertArrayItemIsObject;
export declare const assureArrayIncludesString: typeof assertArrayIncludesString;
export declare const assureArrayIncludesNumber: typeof assertArrayIncludesNumber;
export declare const assureArrayIncludesObject: typeof assertArrayIncludesObject;
export declare const assureArrayOnlyStrings: typeof assertArrayOnlyStrings;
export declare const assureArrayOnlyNumbers: typeof assertArrayOnlyNumbers;
export declare const assureArrayOnlyObjects: typeof assertArrayOnlyObjects;
export declare const assureArrayEveryTruthy: typeof assertArrayEveryTruthy;
export declare const assureArrayEveryFalsy: typeof assertArrayEveryFalsy;
export declare const assureArrayUnique: typeof assertArrayUnique;
export declare const assureObjectHasKey: typeof assertObjectHasKey;
export declare const assureObjectHasKeys: typeof assertObjectHasKeys;
export declare const assureObjectKeyEquals: typeof assertObjectKeyEquals;
export declare const assureObjectAllKeysSet: typeof assertObjectAllKeysSet;
export declare const assureObjectAnyKeyNull: typeof assertObjectAnyKeyNull;
export declare const assureObjectKeysExactly: typeof assertObjectKeysExactly;
/** Assert a string is non-empty after trimming whitespace. */
export declare function assertStringTrimmedNotEmpty(v: unknown, msg?: string): asserts v is string;
/** Assert an array has all unique items (===) */
export declare function assertArrayUnique(v: unknown, msg?: string): asserts v is unknown[];
export declare function expectString<T>(v: T, msg?: string): string;
export declare function expectNumber<T>(v: T, msg?: string): number;
export declare function expectArray<T>(v: T, msg?: string): unknown[];
export declare function expectObject<T>(v: T, msg?: string): Record<string, unknown>;
export declare function expectBoolean<T>(v: T, msg?: string): boolean;
export declare function expectDate<T>(v: T, msg?: string): Date;
export declare function expectElement<T>(v: T, msg?: string): Element;
export declare function expectNotNullOrUndefined<T>(v: T, msg?: string): NonNullable<T>;
export declare const sureString: typeof assertIsString;
export declare const sureNumber: typeof assertIsNumber;
export declare const sureArray: typeof assertIsArray;
export declare const sureObject: typeof assertIsObject;
export declare const sureElement: typeof assertIsElement;
export declare const sureBoolean: typeof assertIsBoolean;
export declare const sureDate: typeof assertIsDate;
export declare const sureNull: typeof assertIsNull;
export declare const sureNotNull: typeof assertNotNull;
export declare const sureUndefined: typeof assertIsUndefined;
export declare const sureNotUndefined: typeof assertNotUndefined;
export declare const surePresent: typeof assertNotNullOrUndefined;
export declare const sureStringNotEmpty: typeof assertStringNotEmpty;
export declare const sureStringHasLength: typeof assertStringHasLength;
export declare const sureStringMinLength: typeof assertStringMinLength;
export declare const sureStringMaxLength: typeof assertStringMaxLength;
export declare const sureStringLengthBetween: typeof assertStringLengthBetween;
export declare const sureStringContains: typeof assertStringContains;
export declare const sureStringStartsWith: typeof assertStringStartsWith;
export declare const sureStringEndsWith: typeof assertStringEndsWith;
export declare const sureStringMatches: typeof assertStringMatches;
export declare const sureStringEqualsIgnoreCase: typeof assertStringEqualsIgnoreCase;
export declare const sureStringIncludesAny: typeof assertStringIncludesAny;
export declare const sureStringIncludesAll: typeof assertStringIncludesAll;
export declare const sureStringIsJSON: typeof assertStringIsJSON;
export declare const sureStringTrimmedNotEmpty: typeof assertStringTrimmedNotEmpty;
export declare const sureStringOneOf: typeof assertStringOneOf;
export declare const sureStringEqualsIgnoreWhitespace: typeof assertStringEqualsIgnoreWhitespace;
export declare const sureArrayNotEmpty: typeof assertArrayNotEmpty;
export declare const sureArrayHasLength: typeof assertArrayHasLength;
export declare const sureArrayHasAnyOf: typeof assertArrayHasAnyOf;
export declare const sureArrayHasEveryOf: typeof assertArrayHasEveryOf;
export declare const sureArrayItemIsBoolean: typeof assertArrayItemIsBoolean;
export declare const sureArrayItemIsString: typeof assertArrayItemIsString;
export declare const sureArrayItemIsNumber: typeof assertArrayItemIsNumber;
export declare const sureArrayItemIsObject: typeof assertArrayItemIsObject;
export declare const sureArrayIncludesString: typeof assertArrayIncludesString;
export declare const sureArrayIncludesNumber: typeof assertArrayIncludesNumber;
export declare const sureArrayIncludesObject: typeof assertArrayIncludesObject;
export declare const sureArrayOnlyStrings: typeof assertArrayOnlyStrings;
export declare const sureArrayOnlyNumbers: typeof assertArrayOnlyNumbers;
export declare const sureArrayOnlyObjects: typeof assertArrayOnlyObjects;
export declare const sureArrayEveryTruthy: typeof assertArrayEveryTruthy;
export declare const sureArrayEveryFalsy: typeof assertArrayEveryFalsy;
export declare const sureArrayUnique: typeof assertArrayUnique;
export declare const sureObjectHasKey: typeof assertObjectHasKey;
export declare const sureObjectHasKeys: typeof assertObjectHasKeys;
export declare const sureObjectKeyEquals: typeof assertObjectKeyEquals;
export declare const sureObjectAllKeysSet: typeof assertObjectAllKeysSet;
export declare const sureObjectAnyKeyNull: typeof assertObjectAnyKeyNull;
export declare const sureObjectKeysExactly: typeof assertObjectKeysExactly;
export declare const sureElementIsChildOf: typeof assertElementIsChildOf;
export declare const sureIsString: (v: unknown, msg?: string) => () => void;
export declare const sureIsNumber: (v: unknown, msg?: string) => () => void;
export declare const sureIsArray: (v: unknown, msg?: string) => () => void;
export declare const sureIsObject: (v: unknown, msg?: string) => () => void;
export declare const sureIsElement: (v: unknown, msg?: string) => () => void;
export declare const sureIsBoolean: (v: unknown, msg?: string) => () => void;
export declare const sureIsDate: (v: unknown, msg?: string) => () => void;
export declare const sureIsNull: (v: unknown, msg?: string) => () => void;
export declare const sureIsUndefined: (v: unknown, msg?: string) => () => void;
export declare const sureNotNil: <T>(v: T, msg?: string) => () => void;
export declare const sureNotNullBound: <T>(v: T, msg?: string) => () => void;
export declare const sureNotUndefinedBound: <T>(v: T, msg?: string) => () => void;
export declare const mustBeString: typeof assertIsString;
export declare const mustBeNumber: typeof assertIsNumber;
export declare const mustBeArray: typeof assertIsArray;
export declare const mustBeObject: typeof assertIsObject;
export declare const mustBeElement: typeof assertIsElement;
export declare const mustBeBoolean: typeof assertIsBoolean;
export declare const mustBeDate: typeof assertIsDate;
export declare const mustBeNull: typeof assertIsNull;
export declare const mustBeUndefined: typeof assertIsUndefined;
export declare const mustBePresent: typeof assertNotNullOrUndefined;
export declare const mustExists: typeof assertNotNullOrUndefined;
export declare const mustExist: typeof assertNotNullOrUndefined;
export declare const mustBeStringNotEmpty: typeof assertStringNotEmpty;
export declare const mustBeStringHasLength: typeof assertStringHasLength;
export declare const mustBeStringMinLength: typeof assertStringMinLength;
export declare const mustBeStringMaxLength: typeof assertStringMaxLength;
export declare const mustBeStringLengthBetween: typeof assertStringLengthBetween;
export declare const mustBeStringContains: typeof assertStringContains;
export declare const mustBeStringStartsWith: typeof assertStringStartsWith;
export declare const mustBeStringEndsWith: typeof assertStringEndsWith;
export declare const mustBeStringMatches: typeof assertStringMatches;
export declare const mustBeStringEqualsIgnoreCase: typeof assertStringEqualsIgnoreCase;
export declare const mustBeStringIncludesAny: typeof assertStringIncludesAny;
export declare const mustBeStringIncludesAll: typeof assertStringIncludesAll;
export declare const mustBeStringIsJSON: typeof assertStringIsJSON;
export declare const mustBeStringTrimmedNotEmpty: typeof assertStringTrimmedNotEmpty;
export declare const mustBeStringOneOf: typeof assertStringOneOf;
export declare const mustBeStringEqualsIgnoreWhitespace: typeof assertStringEqualsIgnoreWhitespace;
export declare const mustBeArrayNotEmpty: typeof assertArrayNotEmpty;
export declare const mustBeArrayHasLength: typeof assertArrayHasLength;
export declare const mustBeArrayHasAnyOf: typeof assertArrayHasAnyOf;
export declare const mustBeArrayHasEveryOf: typeof assertArrayHasEveryOf;
export declare const mustBeArrayItemIsBoolean: typeof assertArrayItemIsBoolean;
export declare const mustBeArrayItemIsString: typeof assertArrayItemIsString;
export declare const mustBeArrayItemIsNumber: typeof assertArrayItemIsNumber;
export declare const mustBeArrayItemIsObject: typeof assertArrayItemIsObject;
export declare const mustBeArrayIncludesString: typeof assertArrayIncludesString;
export declare const mustBeArrayIncludesNumber: typeof assertArrayIncludesNumber;
export declare const mustBeArrayIncludesObject: typeof assertArrayIncludesObject;
export declare const mustBeArrayOnlyStrings: typeof assertArrayOnlyStrings;
export declare const mustBeArrayOnlyNumbers: typeof assertArrayOnlyNumbers;
export declare const mustBeArrayOnlyObjects: typeof assertArrayOnlyObjects;
export declare const mustBeArrayEveryTruthy: typeof assertArrayEveryTruthy;
export declare const mustBeArrayEveryFalsy: typeof assertArrayEveryFalsy;
export declare const mustBeArrayUnique: typeof assertArrayUnique;
export declare const mustBeObjectHasKey: typeof assertObjectHasKey;
export declare const mustBeObjectHasKeys: typeof assertObjectHasKeys;
export declare const mustBeObjectKeyEquals: typeof assertObjectKeyEquals;
export declare const mustBeObjectAllKeysSet: typeof assertObjectAllKeysSet;
export declare const mustBeObjectAnyKeyNull: typeof assertObjectAnyKeyNull;
export declare const mustBeObjectKeysExactly: typeof assertObjectKeysExactly;
export declare const mustBeElementIsChildOf: typeof assertElementIsChildOf;
export declare const mustBe: {
    readonly string: (v: unknown, msg?: string) => () => void;
    readonly number: (v: unknown, msg?: string) => () => void;
    readonly array: (v: unknown, msg?: string) => () => void;
    readonly object: (v: unknown, msg?: string) => () => void;
    readonly element: (v: unknown, msg?: string) => () => void;
    readonly boolean: (v: unknown, msg?: string) => () => void;
    readonly date: (v: unknown, msg?: string) => () => void;
    readonly null: (v: unknown, msg?: string) => () => void;
    readonly undefined: (v: unknown, msg?: string) => () => void;
    readonly present: <T>(v: T, msg?: string) => () => void;
    readonly exist: <T>(v: T, msg?: string) => () => void;
    readonly exists: <T>(v: T, msg?: string) => () => void;
    readonly stringNotEmpty: (v: unknown, msg?: string) => () => void;
    readonly stringHasLength: (v: unknown, len: number, msg?: string) => () => void;
    readonly stringMinLength: (v: unknown, n: number, msg?: string) => () => void;
    readonly stringMaxLength: (v: unknown, n: number, msg?: string) => () => void;
    readonly stringLengthBetween: (v: unknown, min: number, max: number, msg?: string) => () => void;
    readonly stringContains: (v: unknown, needle: string | RegExp, msg?: string) => () => void;
    readonly stringStartsWith: (v: unknown, prefix: string, msg?: string) => () => void;
    readonly stringEndsWith: (v: unknown, suffix: string, msg?: string) => () => void;
    readonly stringMatches: (v: unknown, re: RegExp, msg?: string) => () => void;
    readonly stringEqualsIgnoreCase: (v: unknown, expected: string, msg?: string) => () => void;
    readonly stringIncludesAny: (v: unknown, needles: string[], msg?: string) => () => void;
    readonly stringIncludesAll: (v: unknown, needles: string[], msg?: string) => () => void;
    readonly stringIsJSON: (v: unknown, msg?: string) => () => void;
    readonly stringTrimmedNotEmpty: (v: unknown, msg?: string) => () => void;
    readonly stringOneOf: (v: unknown, options: string[], msg?: string) => () => void;
    readonly stringEqualsIgnoreWhitespace: (v: unknown, expected: string, ignoreAllWhitespace?: boolean, msg?: string) => () => void;
    readonly arrayNotEmpty: (v: unknown, msg?: string) => () => void;
    readonly arrayHasLength: (v: unknown, len: number, msg?: string) => () => void;
    readonly arrayHasAnyOf: (v: unknown, items: string[], msg?: string) => () => void;
    readonly arrayHasEveryOf: (v: unknown, items: string[], msg?: string) => () => void;
    readonly arrayItemIsBoolean: (v: unknown, index: number, msg?: string) => () => void;
    readonly arrayItemIsString: (v: unknown, index: number, msg?: string) => () => void;
    readonly arrayItemIsNumber: (v: unknown, index: number, msg?: string) => () => void;
    readonly arrayItemIsObject: (v: unknown, index: number, msg?: string) => () => void;
    readonly arrayIncludesString: (v: unknown, needle: string, msg?: string) => () => void;
    readonly arrayIncludesNumber: (v: unknown, needle: number, msg?: string) => () => void;
    readonly arrayIncludesObject: (v: unknown, needle: Record<string, unknown>, msg?: string) => () => void;
    readonly arrayOnlyStrings: (v: unknown, msg?: string) => () => void;
    readonly arrayOnlyNumbers: (v: unknown, msg?: string) => () => void;
    readonly arrayOnlyObjects: (v: unknown, msg?: string) => () => void;
    readonly arrayEveryTruthy: (v: unknown, msg?: string) => () => void;
    readonly arrayEveryFalsy: (v: unknown, msg?: string) => () => void;
    readonly arrayUnique: (v: unknown, msg?: string) => () => void;
    readonly objectHasKey: <T extends object, K extends string>(obj: T, key: K, msg?: string) => () => void;
    readonly objectHasKeys: <T extends object, K extends readonly string[]>(obj: T, keys: K, msg?: string) => () => void;
    readonly objectKeyEquals: <T extends object, K extends string, V = unknown>(obj: T, key: K, expected: V, msg?: string) => () => void;
    readonly objectAllKeysSet: <T extends object>(obj: T, msg?: string) => () => void;
    readonly objectAnyKeyNull: (obj: unknown, msg?: string) => () => void;
    readonly objectKeysExactly: <K extends readonly string[]>(obj: unknown, keys: K, msg?: string) => () => void;
    readonly elementIsChildOf: (el: unknown, parent: Element | string, msg?: string) => () => void;
};
export type AssertionResult = {
    name: string;
    passed: boolean;
    error?: string;
};
export type AssertionEntry = {
    name: string;
    check: (v: unknown) => void;
    category?: "string" | "number" | "array" | "object" | "element" | "boolean" | "date" | "misc";
};
export declare const assertionsCatalog: ReadonlyArray<AssertionEntry>;
/** Run catalog assertions on a value, optionally filtered by names or RegExp. */
export declare function reportAssertions(v: unknown, filter?: Array<string | RegExp>): AssertionResult[];
/** Shorthand for reportAssertions */
export declare function report(v: unknown, filter?: Array<string | RegExp>): AssertionResult[];
export type LikeOptions = {
    keys?: "subset" | "exact";
    checkValues?: boolean;
    numericTolerance?: number;
    stringSimilarityThreshold?: number;
    trimStrings?: boolean;
    caseInsensitiveStrings?: boolean;
    arrayOrderMatters?: boolean;
    allowExtraArrayItems?: boolean;
};
export declare function isLike(a: unknown, b: unknown, opts?: LikeOptions): boolean;
export declare function isAlotLike(a: unknown, b: unknown, opts?: LikeOptions): boolean;
/**
 * All assert* helpers collected in one place for programmatic use.
 * Keys are friendly names (e.g., isString, stringNotEmpty, arrayHasEveryOf).
 */
export declare const assertions: {
    readonly isString: typeof assertIsString;
    readonly isNumber: typeof assertIsNumber;
    readonly isArray: typeof assertIsArray;
    readonly isObject: typeof assertIsObject;
    readonly isElement: typeof assertIsElement;
    readonly isBoolean: typeof assertIsBoolean;
    readonly isDate: typeof assertIsDate;
    readonly isNull: typeof assertIsNull;
    readonly notNull: typeof assertNotNull;
    readonly isUndefined: typeof assertIsUndefined;
    readonly notUndefined: typeof assertNotUndefined;
    readonly notNullOrUndefined: typeof assertNotNullOrUndefined;
    readonly stringNotEmpty: typeof assertStringNotEmpty;
    readonly stringHasLength: typeof assertStringHasLength;
    readonly stringMinLength: typeof assertStringMinLength;
    readonly stringMaxLength: typeof assertStringMaxLength;
    readonly stringLengthBetween: typeof assertStringLengthBetween;
    readonly stringContains: typeof assertStringContains;
    readonly stringStartsWith: typeof assertStringStartsWith;
    readonly stringEndsWith: typeof assertStringEndsWith;
    readonly stringMatches: typeof assertStringMatches;
    readonly stringEqualsIgnoreCase: typeof assertStringEqualsIgnoreCase;
    readonly stringIncludesAny: typeof assertStringIncludesAny;
    readonly stringIncludesAll: typeof assertStringIncludesAll;
    readonly stringIsJSON: typeof assertStringIsJSON;
    readonly stringTrimmedNotEmpty: typeof assertStringTrimmedNotEmpty;
    readonly stringOneOf: typeof assertStringOneOf;
    readonly stringEqualsIgnoreWhitespace: typeof assertStringEqualsIgnoreWhitespace;
    readonly isBase64: typeof isBase64;
    readonly arrayNotEmpty: typeof assertArrayNotEmpty;
    readonly arrayHasLength: typeof assertArrayHasLength;
    readonly arrayHasAnyOf: typeof assertArrayHasAnyOf;
    readonly arrayHasEveryOf: typeof assertArrayHasEveryOf;
    readonly arrayItemIsBoolean: typeof assertArrayItemIsBoolean;
    readonly arrayItemIsString: typeof assertArrayItemIsString;
    readonly arrayItemIsNumber: typeof assertArrayItemIsNumber;
    readonly arrayItemIsObject: typeof assertArrayItemIsObject;
    readonly arrayIncludesString: typeof assertArrayIncludesString;
    readonly arrayIncludesNumber: typeof assertArrayIncludesNumber;
    readonly arrayIncludesObject: typeof assertArrayIncludesObject;
    readonly arrayOnlyStrings: typeof assertArrayOnlyStrings;
    readonly arrayOnlyNumbers: typeof assertArrayOnlyNumbers;
    readonly arrayOnlyObjects: typeof assertArrayOnlyObjects;
    readonly arrayEveryTruthy: typeof assertArrayEveryTruthy;
    readonly arrayEveryFalsy: typeof assertArrayEveryFalsy;
    readonly arrayUnique: typeof assertArrayUnique;
    readonly objectHasKey: typeof assertObjectHasKey;
    readonly objectHasKeys: typeof assertObjectHasKeys;
    readonly objectKeyEquals: typeof assertObjectKeyEquals;
    readonly objectAllKeysSet: typeof assertObjectAllKeysSet;
    readonly objectAnyKeyNull: typeof assertObjectAnyKeyNull;
    readonly objectKeysExactly: typeof assertObjectKeysExactly;
    readonly elementIsChildOf: typeof assertElementIsChildOf;
};
/**
 * All assure* helpers collected in one place. Mirrors assertions but with assure* aliases.
 */
export declare const assureAll: {
    readonly string: typeof assertIsString;
    readonly number: typeof assertIsNumber;
    readonly array: typeof assertIsArray;
    readonly object: typeof assertIsObject;
    readonly element: typeof assertIsElement;
    readonly boolean: typeof assertIsBoolean;
    readonly date: typeof assertIsDate;
    readonly null: typeof assertIsNull;
    readonly notNull: typeof assertNotNull;
    readonly undefined: typeof assertIsUndefined;
    readonly notUndefined: typeof assertNotUndefined;
    readonly present: typeof assertNotNullOrUndefined;
    readonly stringNotEmpty: typeof assertStringNotEmpty;
    readonly stringHasLength: typeof assertStringHasLength;
    readonly stringMinLength: typeof assertStringMinLength;
    readonly stringMaxLength: typeof assertStringMaxLength;
    readonly stringLengthBetween: typeof assertStringLengthBetween;
    readonly stringContains: typeof assertStringContains;
    readonly stringStartsWith: typeof assertStringStartsWith;
    readonly stringEndsWith: typeof assertStringEndsWith;
    readonly stringMatches: typeof assertStringMatches;
    readonly stringEqualsIgnoreCase: typeof assertStringEqualsIgnoreCase;
    readonly stringIncludesAny: typeof assertStringIncludesAny;
    readonly stringIncludesAll: typeof assertStringIncludesAll;
    readonly stringIsJSON: typeof assertStringIsJSON;
    readonly stringTrimmedNotEmpty: typeof assertStringTrimmedNotEmpty;
    readonly stringOneOf: typeof assertStringOneOf;
    readonly stringEqualsIgnoreWhitespace: typeof assertStringEqualsIgnoreWhitespace;
    readonly arrayNotEmpty: typeof assertArrayNotEmpty;
    readonly arrayHasLength: typeof assertArrayHasLength;
    readonly arrayHasAnyOf: typeof assertArrayHasAnyOf;
    readonly arrayHasEveryOf: typeof assertArrayHasEveryOf;
    readonly arrayItemIsBoolean: typeof assertArrayItemIsBoolean;
    readonly arrayItemIsString: typeof assertArrayItemIsString;
    readonly arrayItemIsNumber: typeof assertArrayItemIsNumber;
    readonly arrayItemIsObject: typeof assertArrayItemIsObject;
    readonly arrayIncludesString: typeof assertArrayIncludesString;
    readonly arrayIncludesNumber: typeof assertArrayIncludesNumber;
    readonly arrayIncludesObject: typeof assertArrayIncludesObject;
    readonly arrayOnlyStrings: typeof assertArrayOnlyStrings;
    readonly arrayOnlyNumbers: typeof assertArrayOnlyNumbers;
    readonly arrayOnlyObjects: typeof assertArrayOnlyObjects;
    readonly arrayEveryTruthy: typeof assertArrayEveryTruthy;
    readonly arrayEveryFalsy: typeof assertArrayEveryFalsy;
    readonly arrayUnique: typeof assertArrayUnique;
    readonly objectHasKey: typeof assertObjectHasKey;
    readonly objectHasKeys: typeof assertObjectHasKeys;
    readonly objectKeyEquals: typeof assertObjectKeyEquals;
    readonly objectAllKeysSet: typeof assertObjectAllKeysSet;
    readonly objectAnyKeyNull: typeof assertObjectAnyKeyNull;
    readonly objectKeysExactly: typeof assertObjectKeysExactly;
    readonly elementIsChildOf: typeof assertElementIsChildOf;
};
export {};
