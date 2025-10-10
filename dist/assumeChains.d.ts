export type CoreChecksType = {
    that(cond: boolean, msg?: string): asserts cond;
    isTrue(cond: boolean, msg?: string): asserts cond;
    isFalse(cond: boolean, msg?: string): asserts cond is false;
    isFunction(v: unknown, msg?: string): asserts v is (...args: any[]) => any;
    isPromise(v: unknown, msg?: string): asserts v is Promise<unknown>;
    isInstanceOf<T>(v: unknown, ctor: new (...a: any[]) => T): asserts v is T;
};
export type ObjectChecksType = {
    isObject(v: unknown, msg?: string): asserts v is Record<string, unknown>;
    hasKey<T extends object, K extends string>(obj: T, key: K, msg?: string): asserts obj is T & Record<K, unknown>;
    hasKeys<T extends object, K extends string>(obj: T, ...keys: K[]): asserts obj is T & Record<K, unknown>;
    equalStringified(obj: unknown, expected: string): void;
    sameKeys(obj: unknown, expected: Record<string, unknown>): void;
    allKeysFalsey(obj: unknown): asserts obj is Record<string, null | undefined | false | 0 | "">;
    allKeysSet(obj: unknown): asserts obj is Record<string, unknown>;
    anyKeyNull(obj: unknown): asserts obj is Record<string, null>;
};
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
export declare const CoreChecks: CoreChecksType;
export declare const ObjectChecks: ObjectChecksType;
export declare const ArrayChecks: ArrayChecksType;
export declare const ElementChecks: ElementChecksType;
export declare class AssumeChain<T> {
    protected value: T;
    constructor(value: T);
    hasKey<K extends string>(key: K): AssumeChain<T & Record<K, unknown>>;
    hasKeys<K extends string>(...keys: K[]): AssumeChain<T & Record<K, unknown>>;
    equalStringified(expected: string): AssumeChain<T>;
    sameKeys(expected: Record<string, unknown>): AssumeChain<T>;
    allKeysFalsey(): AssumeChain<T>;
    allKeysSet(): AssumeChain<T>;
    anyKeyNull(): AssumeChain<T>;
    isArray(): AssumeChain<unknown[]>;
    hasLength(len: number): AssumeChain<T>;
    containsString(index: number): AssumeChain<T>;
    containsNumber(index: number): AssumeChain<T>;
    containsObject(index: number): AssumeChain<T>;
    isElement(): AssumeChain<Element>;
    isHTMLElement(): AssumeChain<HTMLElement>;
    isVisible(): AssumeChain<T>;
    isHidden(): AssumeChain<T>;
    hasChild(): AssumeChain<T>;
    hasChildMatching(selector: string): AssumeChain<T>;
    hasDescendant(selector: string): AssumeChain<T>;
    hasAttribute(name: string): AssumeChain<T>;
    attributeEquals(name: string, expected: string): AssumeChain<T>;
    isFunction(): AssumeChain<(...args: any[]) => any>;
    isPromise(): AssumeChain<Promise<unknown>>;
    that(cond: boolean, msg?: string): AssumeChain<T>;
    isTrue(msg?: string): AssumeChain<T>;
    isFalse(msg?: string): AssumeChain<T>;
    valueOf(): T;
}
export declare function Assume(v: unknown): AssumeChain<unknown>;
//# sourceMappingURL=assumeChains.d.ts.map