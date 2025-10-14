export type Listener<T = any> = (payload?: T) => void;

export class AssumingBus {
  on<T = any>(event: string, fn: Listener<T>): () => void;
  off(event: string, fn: Listener): void;
  once<T = any>(event: string, fn: Listener<T>): () => void;
  emit<T = any>(event: string, payload?: T): void;
}
export const assumingBus: AssumingBus;

export interface AssumingOptions {
  quiet?: boolean;
  message?: string;
  emit?: string;
}

export type Assumption = boolean | (() => boolean | void);

export interface AssumingResult {
  Run<R>(fn: () => R): AssumingResult; // FLUENT
  value<T = unknown>(): T | undefined; // last Run/result value
  isTrue(msg?: string): void;
  isFalse(msg?: string): void;
  wasCorrect(): boolean;
  wasWrong(): boolean;
  onRefuted(fn: (err?: unknown) => unknown): AssumingResult; // FLUENT
  catch(fn: (err?: unknown) => unknown): AssumingResult; // alias, FLUENT
  result<R>(success: () => R, failure?: (err?: unknown) => R): R | undefined;
  with(patch: AssumingOptions | string): AssumingResult;
  message(msg: string): AssumingResult;
  quiet(value?: boolean): AssumingResult;
  options(): Readonly<AssumingOptions>;
}

export function assuming(
  ...args: Array<Assumption | AssumingOptions | string | null | undefined>
): AssumingResult;

export function check(fn: () => void): boolean;

// Minimal DOM types to keep server build happy (merges with real DOM in browser)
declare global {
  interface Element {}
  interface HTMLElement extends Element {}
}

// Checks API
export type CoreChecksType = {
  that(cond: boolean, msg?: string): asserts cond;
  isTrue(cond: boolean, msg?: string): asserts cond;
  isFalse(cond: boolean, msg?: string): asserts cond is false;
  isFunction(v: unknown, msg?: string): asserts v is (...args: any[]) => any;
  isPromise(v: unknown, msg?: string): asserts v is Promise<unknown>;
  isInstanceOf<T>(v: unknown, ctor: new (...a: any[]) => T): asserts v is T;

  isNull(v: unknown, msg?: string): asserts v is null;
  isUndefined(v: unknown, msg?: string): asserts v is undefined;
  isNil(v: unknown, msg?: string): asserts v is null | undefined;
  isPresent<T>(v: T, msg?: string): asserts v is NonNullable<T>;
};

export type ObjectChecksType = {
  isObject(v: unknown, msg?: string): asserts v is Record<string, unknown>;
  hasKey<T extends object, K extends string>(
    obj: T,
    key: K,
    msg?: string
  ): asserts obj is T & Record<K, unknown>;
  hasKeys<T extends object, K extends string>(
    obj: T,
    ...keys: K[]
  ): asserts obj is T & Record<K, unknown>;
  equalStringified(obj: unknown, expected: string): void;
  sameKeys(obj: unknown, expected: Record<string, unknown>): void;
  allKeysFalsey(
    obj: unknown
  ): asserts obj is Record<string, null | undefined | false | 0 | "">;
  allKeysFalsy(
    obj: unknown
  ): asserts obj is Record<string, null | undefined | false | 0 | "">;
  allKeysSet(obj: unknown): asserts obj is Record<string, unknown>;
  anyKeyNull(obj: unknown): asserts obj is Record<string, null>;
};

export type ArrayChecksType = {
  isArray(v: unknown, msg?: string): asserts v is unknown[];
  hasLength<T extends unknown[]>(
    arr: T,
    len: number,
    msg?: string
  ): asserts arr is { length: typeof len } & T;
  containsString(
    arr: unknown[],
    index: number
  ): asserts arr is { [K in typeof index]: string } & unknown[];
  containsNumber(
    arr: unknown[],
    index: number
  ): asserts arr is { [K in typeof index]: number } & unknown[];
  containsObject(
    arr: unknown[],
    index: number
  ): asserts arr is { [K in typeof index]: object } & unknown[];
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
  attributeEquals(
    el: unknown,
    name: string,
    expected: string
  ): asserts el is Element;
};

export type ChecksType = CoreChecksType &
  ObjectChecksType &
  ArrayChecksType &
  ElementChecksType;

export const CoreChecks: CoreChecksType;
export const ObjectChecks: ObjectChecksType;
export const ArrayChecks: ArrayChecksType;
export const ElementChecks: ElementChecksType;
export const Checks: ChecksType;

// ---- Fluent assume chain ----
export type BaseChain<T> = {
  that(
    predicate: (v: T) => boolean,
    msg?: string
  ): AssumptionFn<T> & BaseChain<T>;
  equals(expected: T, msg?: string): AssumptionFn<T> & BaseChain<T>;
  run(): boolean;
  value(): T;
};

export type NumberChain = BaseChain<number> & {
  greaterThan(n: number, msg?: string): AssumptionFn<number> & NumberChain;
  greaterOrEqual(n: number, msg?: string): AssumptionFn<number> & NumberChain;
  lessThan(n: number, msg?: string): AssumptionFn<number> & NumberChain;
  lessOrEqual(n: number, msg?: string): AssumptionFn<number> & NumberChain;
  between(
    min: number,
    max: number,
    msg?: string
  ): AssumptionFn<number> & NumberChain;
};

export type ElementChain = BaseChain<any> & {
  hasChildren(msg?: string): AssumptionFn<any> & ElementChain;
  hasChild(msg?: string): AssumptionFn<any> & ElementChain;
  hasChildMatching(
    selector: string,
    msg?: string
  ): AssumptionFn<any> & ElementChain;
  hasDescendant(
    selector: string,
    msg?: string
  ): AssumptionFn<any> & ElementChain;
  hasAttribute(name: string, msg?: string): AssumptionFn<any> & ElementChain;
  attributeEquals(
    name: string,
    expected: string,
    msg?: string
  ): AssumptionFn<any> & ElementChain;
};

export type ObjectChain = BaseChain<Record<string, unknown>> & {
  hasKey<K extends string>(
    key: K,
    msg?: string
  ): AssumptionFn<Record<string, unknown>> & ObjectChain;
  hasKeys<K extends string>(
    ...keys: K[]
  ): AssumptionFn<Record<string, unknown>> & ObjectChain;
  keyEquals<K extends string>(
    key: K,
    expected: unknown,
    msg?: string
  ): AssumptionFn<Record<string, unknown>> & ObjectChain;
};

export type ArrayChain = BaseChain<unknown[]> & {
  hasLength(len: number, msg?: string): AssumptionFn<unknown[]> & ArrayChain;
  notEmpty(msg?: string): AssumptionFn<unknown[]> & ArrayChain;
  itemIsBoolean(
    index: number,
    msg?: string
  ): AssumptionFn<unknown[]> & ArrayChain;
  itemIsString(
    index: number,
    msg?: string
  ): AssumptionFn<unknown[]> & ArrayChain;
  itemIsNumber(
    index: number,
    msg?: string
  ): AssumptionFn<unknown[]> & ArrayChain;
  itemIsObject(
    index: number,
    msg?: string
  ): AssumptionFn<unknown[]> & ArrayChain;
};

export type StringChain = BaseChain<string> & {
  notEmpty(msg?: string): AssumptionFn<string> & StringChain;
  hasLength(len: number, msg?: string): AssumptionFn<string> & StringChain;
  minLength(n: number, msg?: string): AssumptionFn<string> & StringChain;
  maxLength(n: number, msg?: string): AssumptionFn<string> & StringChain;
  lengthBetween(
    min: number,
    max: number,
    msg?: string
  ): AssumptionFn<string> & StringChain;
  contains(
    needle: string | RegExp,
    msg?: string
  ): AssumptionFn<string> & StringChain;
  startsWith(prefix: string, msg?: string): AssumptionFn<string> & StringChain;
  endsWith(suffix: string, msg?: string): AssumptionFn<string> & StringChain;
  matches(re: RegExp, msg?: string): AssumptionFn<string> & StringChain;
  equalsIgnoreCase(
    expected: string,
    msg?: string
  ): AssumptionFn<string> & StringChain;
  includesAny(...needles: string[]): AssumptionFn<string> & StringChain;
  includesAll(...needles: string[]): AssumptionFn<string> & StringChain;
  isJSON(msg?: string): AssumptionFn<string> & StringChain; // ADD
};

export type AssumptionFn<T> = (() => boolean | void) &
  BaseChain<T> & {
    isNumber(msg?: string): AssumptionFn<number> & NumberChain;
    readonly inNumber: AssumptionFn<number> & NumberChain;

    isElement(msg?: string): AssumptionFn<any> & ElementChain;
    isString(msg?: string): AssumptionFn<string> & StringChain;
    isBoolean(msg?: string): AssumptionFn<boolean> & BaseChain<boolean>;
    isArray(msg?: string): AssumptionFn<unknown[]> & ArrayChain;
    isObject(msg?: string): AssumptionFn<Record<string, unknown>> & ObjectChain;
  };

export function assume<T>(value: T): AssumptionFn<T>;
export function that<T>(value: T): AssumptionFn<T>;
