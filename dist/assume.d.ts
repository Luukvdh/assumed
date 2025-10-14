type TypeTag = "unknown" | "string" | "number" | "array" | "object" | "element" | "boolean" | "null" | "undefined" | "present";
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
};
type GuardMethods<T, K extends TypeTag> = K extends "unknown" ? {
    /** Narrow to string and enable string-specific fluent methods. */
    isString(msg?: string): AssumptionFn<string, "string">;
    /** Narrow to number and enable number-specific fluent methods. */
    isNumber(msg?: string): AssumptionFn<number, "number">;
    /** Narrow to array and enable array-specific fluent methods. */
    isArray(msg?: string): AssumptionFn<unknown[], "array">;
    /** Narrow to plain object and enable object-specific fluent methods. */
    isObject(msg?: string): AssumptionFn<Record<string, unknown>, "object">;
    /** Narrow to DOM Element and enable element-specific fluent methods. */
    isElement(msg?: string): AssumptionFn<any, "element">;
    /** Narrow to boolean (no additional specialized chain methods). */
    isBoolean(msg?: string): AssumptionFn<boolean, "boolean">;
    /** Shortcut numeric guard property (getter). */
    isNull(msg?: string): AssumptionFn<null, "null">;
    /** Narrow to undefined (terminal). */
    isUndefined(msg?: string): AssumptionFn<undefined, "undefined">;
    /** Assert not null/undefined and preserve remainder type (terminal). */
    notNil(msg?: string): AssumptionFn<T | "undefined" | "null", "present">;
    /** Assert not null (removes null from union). */
    notNull(msg?: string): AssumptionFn<T | "null", "present">;
    /** Assert neither null nor undefined. */
    notNullOrUndefined(msg?: string): AssumptionFn<T | "undefined" | "null", "present">;
} : {};
interface BaseChain<T, K extends TypeTag> {
    that(predicate: (v: T) => boolean, msg?: string): AssumptionFn<T, K>;
    equals(expected: T, msg?: string): AssumptionFn<T, K>;
    toBoolean(): boolean;
    instanceof(expected: new (...args: any[]) => any, msg?: string): AssumptionFn<T, K>;
    value(): T;
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
};
type ArrayOnlyChain = {
    hasLength(len: number, msg?: string): AssumptionFn<unknown[], "array">;
    notEmpty(msg?: string): AssumptionFn<unknown[], "array">;
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
    hasKeys(...keys: string[]): boolean;
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
type Specialized<T, K extends TypeTag> = K extends "number" ? NumberOnlyChain : K extends "string" ? StringOnlyChain : K extends "array" ? ArrayOnlyChain : K extends "object" ? ObjectOnlyChain : K extends "element" ? ElementOnlyChain : {};
export type AssumptionFn<T, K extends TypeTag = "unknown"> = (() => boolean | void) & BaseChain<T, K> & GuardMethods<T, K> & Specialized<T, K>;
export type Listener<T = any> = (payload?: T) => void;
export declare class AssumingBus {
    private map;
    on<T = any>(event: string, fn: Listener<T>): () => void;
    off(event: string, fn: Listener): void;
    once<T = any>(event: string, fn: Listener<T>): () => void;
    emit<T = any>(event: string, payload?: T): void;
}
export declare const assumingBus: AssumingBus;
export interface AssumingOptions {
    quiet?: boolean;
    message?: string;
    emit?: string;
}
export type Assumption = boolean | (() => boolean | void);
export declare function assuming(...args: Array<Assumption | AssumingOptions | string | null | undefined>): {
    Run<R>(fn: () => R): any;
    value<T = unknown>(): T | undefined;
    isTrue(msg?: string): boolean | never;
    isFalse(msg?: string): boolean | never;
    isVindicated(): boolean;
    isRefuted(): boolean;
    onRefuted(fn: (err?: unknown) => unknown): any;
    catch(fn: (err?: unknown) => unknown): any;
    result<R_1>(success: () => R_1, failure?: ((err?: unknown) => R_1) | undefined): R_1 | undefined;
    with(patch: AssumingOptions | string): any;
    message(msg: string): any;
    quiet(value?: boolean): any;
    options(): Readonly<AssumingOptions>;
};
export declare function check(Fn: AssumptionFn<unknown, TypeTag>): boolean;
export type CoreChecksType = {
    assumeTrue(cond: boolean, msg?: string): asserts cond;
    assumeFalse(cond: boolean, msg?: string): asserts cond is false;
    isTrue(cond: boolean, msg?: string): asserts cond;
    isFalse(cond: boolean, msg?: string): asserts cond is false;
    isFunction(v: unknown, msg?: string): asserts v is (...args: any[]) => any;
    isPromise(v: unknown, msg?: string): asserts v is Promise<unknown>;
    isInstanceOf<T>(v: unknown, ctor: new (...a: any[]) => T): asserts v is T;
    isNull(v: unknown, msg?: string): asserts v is null;
    notNull<T>(v: T, msg?: string): asserts v is NonNullable<T>;
    isUndefined(v: unknown, msg?: string): asserts v is undefined;
    notUndefined<T>(v: T, msg?: string): asserts v is NonNullable<T>;
    isNil(v: unknown, msg?: string): asserts v is null | undefined;
    notNil<T>(v: T, msg?: string): asserts v is NonNullable<T>;
    notNullOrUndefined<T>(v: T, msg?: string): asserts v is NonNullable<T>;
};
export declare const CoreChecks: CoreChecksType;
export type ObjectChecksType = {
    isObject(v: unknown, msg?: string): asserts v is Record<string, unknown>;
    hasKey<T extends object, K extends string>(obj: T, key: K, msg?: string): asserts obj is T & Record<K, unknown>;
    hasKeys(obj: Record<string, unknown>, ...keys: string[]): AssumptionFn<Record<string, unknown>, "object"> | boolean;
    equalStringified(obj: unknown, expected: string): void;
    sameKeys(obj: unknown, expected: Record<string, unknown>): void;
    allKeysFalsey(obj: unknown): asserts obj is Record<string, null | undefined | false | 0 | "">;
    allKeysFalsy(obj: unknown): asserts obj is Record<string, null | undefined | false | 0 | "">;
    allKeysSet(obj: unknown): asserts obj is Record<string, unknown>;
    anyKeyNull(obj: unknown): asserts obj is Record<string, null>;
};
export declare const ObjectChecks: ObjectChecksType;
export type ArrayChecksType = {
    isArray(v: unknown, msg?: string): asserts v is unknown[];
    hasLength<T extends unknown[]>(arr: T, len: number, msg?: string): asserts arr is {
        length: typeof len;
    } & T;
    containsString(arr: unknown[], index: number): asserts arr is {
        [K in typeof index]: string;
    } & unknown[];
    containsNumber(arr: unknown[], index: number): asserts arr is {
        [K in typeof index]: number;
    } & unknown[];
    containsObject(arr: unknown[], index: number): asserts arr is {
        [K in typeof index]: object;
    } & unknown[];
};
export declare const ArrayChecks: ArrayChecksType;
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
export declare const ElementChecks: ElementChecksType;
export declare function that<T>(value: T): AssumptionFn<T, "unknown">;
export declare function assume<T>(value: T): AssumptionFn<T, "unknown">;
export declare function assertIsString(v: unknown, msg?: string): asserts v is string;
export declare function assertNotNil(v: unknown, msg?: string): asserts v is NonNullable<typeof v>;
export declare function assertIsObject<T extends object = Record<string, unknown>>(v: unknown, msg?: string): asserts v is T;
export type ChecksType = CoreChecksType & ObjectChecksType & ArrayChecksType & ElementChecksType;
export declare const Checks: ChecksType;
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
export declare class AssumptionError extends Error {
    readonly name = "AssumptionError";
    readonly assumeStack: ChainLink[];
    readonly valuePreview?: string;
    readonly timestamp: number;
    readonly cause: unknown;
    constructor(message: string, opts: {
        stack: ChainLink[];
        value?: unknown;
        cause?: unknown;
    });
}
export declare function isAssumptionError(err: unknown): err is AssumptionError;
export declare function getAssumeHistory(): ReadonlyArray<AssumeEvent>;
export declare function clearAssumeHistory(): void;
export declare function setAssumeHistoryLimit(n: number): void;
export type AnyFn = (...args: any[]) => any;
export declare function defRefHandler<R>(def: R, log?: ((err: unknown) => void) | boolean): (err: unknown) => R;
export declare function defRefHandlerAsync<R>(def: R, log?: ((err: unknown) => void) | boolean): (err: unknown) => Promise<R>;
export declare function assumedRoute<F extends AnyFn>(onRefuted: (err: unknown, ...args: Parameters<F>) => ReturnType<F>, handler: F): (...args: Parameters<F>) => ReturnType<F>;
export {};
//# sourceMappingURL=assume.d.ts.map