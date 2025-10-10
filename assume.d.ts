/**
 * Main assertion/assumption utility with strong typeguards and type narrowing.
 */

// --- Types for assertion function signatures ---
export type AssertFn = (v: unknown, msg?: string) => void;
export type AssertTypeFn<T> = (
  v: unknown,
  predicate: (v: unknown) => v is T,
  msg?: string
) => void;
export type HasKeyFn = <K extends string>(obj: unknown, key: K) => void;
export type HasKeysFn = <K extends string>(obj: unknown, ...keys: K[]) => void;

export type AssumeType = {
  that(cond: boolean, msg?: string): void;
  isTrue(cond: boolean, msg?: string): boolean;
  isFalse(cond: boolean, msg?: string): boolean;
  isEqual<T>(actual: T, expected: T, msg?: string): boolean;
  isType<T>(
    value: unknown,
    predicate: (v: unknown) => v is T,
    msg?: string
  ): asserts value is T;
  htmlElement(v: unknown, msg?: string): void;
  div(v: unknown, msg?: string): void;
  isElement(v: unknown, msg?: string): void;
  isHTMLElement(v: unknown, msg?: string): void;
  isHTMLDivElement(v: unknown, msg?: string): void;
  isHTMLSpanElement(v: unknown, msg?: string): void;
  isHTMLButtonElement(v: unknown, msg?: string): void;
  isHTMLInputElement(v: unknown, msg?: string): void;
  isString(v: unknown, msg?: string): void;
  isNumber(v: unknown, msg?: string): void;
  isBoolean(v: unknown, msg?: string): void;
  isNull(v: unknown, msg?: string): void;
  isNotNull<T>(v: T): asserts v is NonNullable<T>;
  isUndefined(v: unknown, msg?: string): void;
  isInteger(v: unknown, msg?: string): void;
  isZero(v: unknown, msg?: string): void;
  isTruthy(v: unknown, msg?: string): void;
  isFalsey(v: unknown, msg?: string): void;
  isArray(v: unknown, msg?: string): void;
  isObject(v: unknown, msg?: string): void;
  hasKey<K extends string>(obj: unknown, key: K): void;
  hasKeys<K extends string>(obj: unknown, ...keys: K[]): void;
  equalStringified(obj: unknown, expected: string): void;
  sameKeys(obj: unknown, expected: Record<string, unknown>): void;
  allKeysFalsey(obj: unknown): void;
  allKeysSet(obj: unknown): void;
  anyKeyNull(obj: unknown): void;
  hasLengthOf<T extends unknown[]>(arr: T, len?: number): void;
  isFunction(v: unknown, msg?: string): void;
  isPromise(v: unknown, msg?: string): void;
  isInstanceOf<T>(v: unknown, ctor: new (...a: any[]) => T): asserts v is T;
  isHidden(el: unknown, msg?: string): void;
  isVisible(el: unknown, msg?: string): void;
  hasChild(el: unknown, msg?: string): void;
  hasChildMatching(el: unknown, selector: string): void;
  hasDescendant(el: unknown, selector: string): void;
  hasAttribute(el: unknown, name: string): void;
  attributeEquals(el: unknown, name: string, expected: string): void;
  check<T extends (...args: any[]) => any>(
    fn: T
  ): (...args: Parameters<T>) => boolean;
};

export declare const Assume: AssumeType;

export declare class AssumeChain<T> {
  constructor(value: T);
  valueOf(): T;
  that(cond: boolean, msg?: string): this;
  isTrue(msg?: string): this;
  isFalse(msg?: string): this;
  isEqual(expected: T, msg?: string): this;
  isType<Type>(
    predicate: (v: unknown) => v is Type,
    msg?: string
  ): AssumeChain<Type>;
  htmlElement(): AssumeChain<Extract<T, HTMLElement>>;
  div(): AssumeChain<Extract<T, HTMLDivElement>>;
  isElement(): AssumeChain<Extract<T, Element>>;
  isHTMLElement(): AssumeChain<Extract<T, HTMLElement>>;
  isHTMLDivElement(): AssumeChain<Extract<T, HTMLDivElement>>;
  isHTMLSpanElement(): AssumeChain<Extract<T, HTMLSpanElement>>;
  isHTMLButtonElement(): AssumeChain<Extract<T, HTMLButtonElement>>;
  isHTMLInputElement(): AssumeChain<Extract<T, HTMLInputElement>>;
  isString(): AssumeChain<Extract<T, string>>;
  isNumber(): AssumeChain<Extract<T, number>>;
  isBoolean(): AssumeChain<Extract<T, boolean>>;
  isNull(): AssumeChain<null>;
  notNull(): AssumeChain<NonNullable<T>>;
  isUndefined(): AssumeChain<undefined>;
  isInteger(): AssumeChain<number>;
  isZero(): AssumeChain<0>;
  isTruthy(): AssumeChain<NonNullable<T>>;
  isFalsey(): AssumeChain<false | 0 | "" | null | undefined>;
  isArray(): AssumeChain<Array<unknown>>;
  isObject(): AssumeChain<Record<string, unknown>>;
  hasKey<K extends string>(key: K): AssumeChain<Record<K, unknown>>;
  hasKeys<K extends string>(
    ...keys: K[]
  ): AssumeChain<Extract<T, Record<K, unknown>>>;
  equalStringified(expected: string): AssumeChain<T>;
  isFunction(): AssumeChain<(...args: any[]) => any>;
  isPromise(): AssumeChain<Promise<unknown>>;
  isInstanceOf<Ctor, Type>(ctor: new (...a: any[]) => Type): AssumeChain<Type>;
  isHidden(): AssumeChain<Extract<T, Element>>;
  isVisible(): AssumeChain<Extract<T, Element>>;
  hasChild(): AssumeChain<Extract<T, Element>>;
  hasChildMatching(selector: string): AssumeChain<Extract<T, Element>>;
  hasDescendant(selector: string): AssumeChain<Extract<T, Element>>;
  hasAttribute(name: string): AssumeChain<Extract<T, Element>>;
  attributeEquals(
    name: string,
    expected: string
  ): AssumeChain<Extract<T, Element>>;
}

export declare function assume<T>(v: T): AssumeChain<T>;
export declare function Assuming(
  ...args: Array<Assumption | AssumingOptions>
): AssumingResult;

/**
 * Chainable assertion API with type narrowing for unknown values.
 */
export declare class AssumeUnknownChain<T = unknown> {
  constructor(value: T);
  valueOf(): T;
  that(cond: boolean, msg?: string): this;
  isTrue(msg?: string): this;
  isFalse(msg?: string): this;
  isEqual(expected: T, msg?: string): this;
  isType<Type>(
    predicate: (v: unknown) => v is Type,
    msg?: string
  ): AssumeUnknownChain<Type>;
  htmlElement(): AssumeUnknownChain<Extract<T, HTMLElement>>;
  div(): AssumeUnknownChain<Extract<T, HTMLDivElement>>;
  isElement(): AssumeUnknownChain<Extract<T, Element>>;
  isHTMLElement(): AssumeUnknownChain<Extract<T, HTMLElement>>;
  isHTMLDivElement(): AssumeUnknownChain<Extract<T, HTMLDivElement>>;
  isHTMLSpanElement(): AssumeUnknownChain<Extract<T, HTMLSpanElement>>;
  isHTMLButtonElement(): AssumeUnknownChain<Extract<T, HTMLButtonElement>>;
  isHTMLInputElement(): AssumeUnknownChain<Extract<T, HTMLInputElement>>;
  isString(): AssumeUnknownChain<Extract<T, string>>;
  isNumber(): AssumeUnknownChain<Extract<T, number>>;
  isBoolean(): AssumeUnknownChain<Extract<T, boolean>>;
  isNull(): AssumeUnknownChain<null>;
  notNull(): AssumeUnknownChain<NonNullable<T>>;
  isUndefined(): AssumeUnknownChain<undefined>;
  isInteger(): AssumeUnknownChain<number>;
  isZero(): AssumeUnknownChain<0>;
  isTruthy(): AssumeUnknownChain<NonNullable<T>>;
  isFalsey(): AssumeUnknownChain<false | 0 | "" | null | undefined>;
  isArray(): AssumeUnknownChain<Array<unknown>>;
  isObject(): AssumeUnknownChain<Record<string, unknown>>;
  hasKey<K extends string>(key: K): AssumeUnknownChain<Record<K, unknown>>;
  hasKeys<K extends string>(
    ...keys: K[]
  ): AssumeUnknownChain<Extract<T, Record<K, unknown>>>;
  equalStringified(expected: string): AssumeUnknownChain<T>;
  isFunction(): AssumeUnknownChain<(...args: any[]) => any>;
  isPromise(): AssumeUnknownChain<Promise<unknown>>;
  isInstanceOf<Ctor, Type>(
    ctor: new (...a: any[]) => Type
  ): AssumeUnknownChain<Type>;
  isHidden(): AssumeUnknownChain<Extract<T, Element>>;
  isVisible(): AssumeUnknownChain<Extract<T, Element>>;
  hasChild(): AssumeUnknownChain<Extract<T, Element>>;
  hasChildMatching(selector: string): AssumeUnknownChain<Extract<T, Element>>;
  hasDescendant(selector: string): AssumeUnknownChain<Extract<T, Element>>;
  hasAttribute(name: string): AssumeUnknownChain<Extract<T, Element>>;
  attributeEquals(
    name: string,
    expected: string
  ): AssumeUnknownChain<Extract<T, Element>>;
}

/**
 * Chainable assertion API with type narrowing for object values.
 */
export declare class AssumeObjectChain<
  T extends Record<string, unknown>
> extends AssumeUnknownChain<T> {
  constructor(value: T);
  valueOf(): T;
  that(cond: boolean, msg?: string): this;
  isTrue(msg?: string): this;
  isFalse(msg?: string): this;
  isEqual(expected: T, msg?: string): this;
  isType<Type>(
    predicate: (v: unknown) => v is Type,
    msg?: string
  ): AssumeObjectChain<Type>;
  htmlElement(): AssumeObjectChain<Extract<T, HTMLElement>>;
  div(): AssumeObjectChain<Extract<T, HTMLDivElement>>;
  isElement(): AssumeObjectChain<Extract<T, Element>>;
  isHTMLElement(): AssumeObjectChain<Extract<T, HTMLElement>>;
  isHTMLDivElement(): AssumeObjectChain<Extract<T, HTMLDivElement>>;
  isHTMLSpanElement(): AssumeObjectChain<Extract<T, HTMLSpanElement>>;
  isHTMLButtonElement(): AssumeObjectChain<Extract<T, HTMLButtonElement>>;
  isHTMLInputElement(): AssumeObjectChain<Extract<T, HTMLInputElement>>;
  isString(): AssumeObjectChain<Extract<T, string>>;
  isNumber(): AssumeObjectChain<Extract<T, number>>;
  isBoolean(): AssumeObjectChain<Extract<T, boolean>>;
  isNull(): AssumeUnknownChain<null>;
  notNull(): AssumeObjectChain<NonNullable<T>>;
  isUndefined(): AssumeUnknownChain<undefined>;
  isInteger(): AssumeUnknownChain<number>;
  isZero(): AssumeObjectChain<0>;
  isTruthy(): AssumeObjectChain<NonNullable<T>>;
  isFalsey(): AssumeUnknownChain<false | 0 | "" | null | undefined>;
  isArray(): AssumeArrayChain<Array<unknown>>;
  isObject(): AssumeObjectChain<Record<string, unknown>>;
  hasKey<K extends string>(key: K): AssumeObjectChain<Record<K, unknown>>;
  hasKeys<K extends string>(
    ...keys: K[]
  ): AssumeObjectChain<Extract<T, Record<K, unknown>>>;
  equalStringified(expected: string): AssumeObjectChain<T>;
  isFunction(): AssumeUnknownChain<(...args: any[]) => any>;
  isPromise(): AssumeUnknownChain<Promise<unknown>>;
  isInstanceOf<Ctor, Type>(
    ctor: new (...a: any[]) => Type
  ): AssumeUnknownChain<Type>;
  isHidden(): AssumeObjectChain<Extract<T, Element>>;
  isVisible(): AssumeObjectChain<Extract<T, Element>>;
  hasChild(): AssumeObjectChain<Extract<T, Element>>;
  hasChildMatching(selector: string): AssumeObjectChain<Extract<T, Element>>;
  hasDescendant(selector: string): AssumeObjectChain<Extract<T, Element>>;
  hasAttribute(name: string): AssumeObjectChain<Extract<T, Element>>;
  attributeEquals(
    name: string,
    expected: string
  ): AssumeObjectChain<Extract<T, Element>>;
}

/**
 * Chainable assertion API with type narrowing for array values.
 */
export declare class AssumeArrayChain<
  T extends unknown[]
> extends AssumeUnknownChain<T> {
  constructor(value: T);
  valueOf(): T;
  that(cond: boolean, msg?: string): this;
  isTrue(msg?: string): this;
  isFalse(msg?: string): this;
  isEqual(expected: T, msg?: string): this;
  isType<Type>(
    predicate: (v: unknown) => v is Type,
    msg?: string
  ): AssumeArrayChain<Extract<Type>>;
  htmlElement(): AssumeArrayChain<Extract<T, HTMLElement>>;
  div(): AssumeArrayChain<Extract<T, HTMLDivElement>>;
  isElement(): AssumeArrayChain<Extract<T, Element>>;
  isHTMLElement(): AssumeArrayChain<Extract<T, HTMLElement>>;
  isHTMLDivElement(): AssumeArrayChain<Extract<T, HTMLDivElement>>;
  isHTMLSpanElement(): AssumeArrayChain<Extract<T, HTMLSpanElement>>;
  isHTMLButtonElement(): AssumeArrayChain<Extract<T, HTMLButtonElement>>;
  isHTMLInputElement(): AssumeArrayChain<Extract<T, HTMLInputElement>>;
  isString(): AssumeArrayChain<Extract<T, string>>;
  isNumber(): AssumeArrayChain<Extract<T, number>>;
  isBoolean(): AssumeArrayChain<Extract<T, boolean>>;
  isNull(): AssumeArrayChain<null, boolean>;
  notNull(): AssumeArrayChain<NonNullable<T>>;
  isUndefined(): AssumeArrayChain<[]>;
  isInteger(): AssumeArrayChain<Extract<T, [number]>>;
  isZero(): AssumeArrayChain<Extract<T, boolean>>;
  isTruthy(): AssumeArrayChain<NonNullable<T>>;
  isFalsey(): AssumeArrayChain<Extract<T, false | 0 | "" | null | undefined>>;
  isArray(): AssumeArrayChain<Array<unknown>>;
  isObject(): AssumeArrayChain<Record<[]>>;
  hasKey<K extends string>(key: K): AssumeArrayChain<[]>;
  hasKeys<K extends string>(
    ...keys: K[]
  ): AssumeArrayChain<Extract<T, Record<K, unknown>>>;
  equalStringified(expected: string): AssumeArrayChain<T>;
  isFunction(): AssumeArrayChain<(...args: any[]) => any>;
  isPromise(): AssumeArrayChain<Promise<unknown>>;
  isInstanceOf<Ctor, Type>(
    ctor: new (...a: any[]) => Type
  ): AssumeArrayChain<Type>;
  isHidden(): AssumeArrayChain<Extract<T, Element>>;
  isVisible(): AssumeArrayChain<Extract<T, Element>>;
  hasChild(): AssumeArrayChain<Extract<T, Element>>;
  hasChildMatching(selector: string): AssumeArrayChain<Extract<T, Element>>;
  hasDescendant(selector: string): AssumeArrayChain<Extract<T, Element>>;
  hasAttribute(name: string): AssumeArrayChain<Extract<T, Element>>;
  attributeEquals(
    name: string,
    expected: string
  ): AssumeArrayChain<Extract<T, Element>>;
}

/**
 * Chainable assertion API with type narrowing for element values.
 */
export declare class AssumeElementChain<
  T extends Element = Element
> extends AssumeUnknownChain<T> {
  constructor(value: T);
  valueOf(): T;
  that(cond: boolean, msg?: string): this;
  isTrue(msg?: string): this;
  isFalse(msg?: string): this;
  isEqual(expected: T, msg?: string): this;
  isType<Type>(
    predicate: (v: unknown) => v is Type,
    msg?: string
  ): AssumeElementChain<Type>;
  htmlElement(): AssumeElementChain<Extract<T, HTMLElement>>;
  div(): AssumeElementChain<Extract<T, HTMLDivElement>>;
  isElement(): AssumeElementChain<Extract<T, Element>>;
  isHTMLElement(): AssumeElementChain<Extract<T, HTMLElement>>;
  isHTMLDivElement(): AssumeElementChain<Extract<T, HTMLDivElement>>;
  isHTMLSpanElement(): AssumeElementChain<Extract<T, HTMLSpanElement>>;
  isHTMLButtonElement(): AssumeElementChain<Extract<T, HTMLButtonElement>>;
  isHTMLInputElement(): AssumeElementChain<Extract<T, HTMLInputElement>>;
  isString(): AssumeElementChain<Extract<T, string>>;
  isNumber(): AssumeElementChain<Extract<T, number>>;
  isBoolean(): AssumeElementChain<Extract<T, boolean>>;
  isNull(): AssumeElementChain<null>;
  notNull(): AssumeElementChain<NonNullable<T>>;
  isUndefined(): AssumeElementChain<undefined>;
  isInteger(): AssumeElementChain<number>;
  isZero(): AssumeElementChain<0>;
  isTruthy(): AssumeElementChain<NonNullable<T>>;
  isFalsey(): AssumeElementChain<false | 0 | "" | null | undefined>;
  isArray(): AssumeElementChain<Array<unknown>>;
  isObject(): AssumeElementChain<Record<string, unknown>>;
  hasKey<K extends string>(key: K): AssumeElementChain<Record<K, unknown>>;
  hasKeys<K extends string>(
    ...keys: K[]
  ): AssumeElementChain<Extract<T, Record<K, unknown>>>;
  equalStringified(expected: string): AssumeElementChain<T>;
  isFunction(): AssumeElementChain<(...args: any[]) => any>;
  isPromise(): AssumeElementChain<Promise<unknown>>;
  isInstanceOf<Ctor, Type>(
    ctor: new (...a: any[]) => Type
  ): AssumeElementChain<Type>;
  isHidden(): AssumeElementChain<Extract<T, Element>>;
  isVisible(): AssumeElementChain<Extract<T, Element>>;
  hasChild(): AssumeElementChain<Extract<T, Element>>;
  hasChildMatching(selector: string): AssumeElementChain<Extract<T, Element>>;
  hasDescendant(selector: string): AssumeElementChain<Extract<T, Element>>;
  hasAttribute(name: string): AssumeElementChain<Extract<T, Element>>;
  attributeEquals(
    name: string,
    expected: string
  ): AssumeElementChain<Extract<T, Element>>;
}
