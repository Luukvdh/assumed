// ============================================================================
// CORE TYPES
// ============================================================================

type TypeTag = 'unknown' | 'string' | 'number' | 'array' | 'object' | 'element' | 'boolean' | 'null' | 'undefined' | 'present';

export type Check = () => void;

export type ChainLink = {
  check: Check;
  type: TypeTag | 'function' | 'datetime';
  methodName?: string;
};

// Helper type for instanceof narrowing
type InferTypeTagFromConstructor<C extends new (...args: any[]) => any> =
  InstanceType<C> extends HTMLElement
    ? 'element'
    : InstanceType<C> extends Element
      ? 'element'
      : InstanceType<C> extends any[]
        ? 'array'
        : InstanceType<C> extends string
          ? 'string'
          : InstanceType<C> extends number
            ? 'number'
            : InstanceType<C> extends boolean
              ? 'boolean'
              : InstanceType<C> extends Record<string, any>
                ? 'object'
                : 'unknown';

// Helper type to detect TypeTag from TypeScript's inferred type
type DetectTypeTag<T> = T extends string ? 'string' : T extends number ? 'number' : T extends boolean ? 'boolean' : T extends any[] ? 'array' : T extends HTMLElement ? 'element' : T extends Element ? 'element' : T extends Record<string, any> ? 'object' : T extends null ? 'null' : T extends undefined ? 'undefined' : 'unknown';

// ============================================================================
// CHAIN TYPES
// ============================================================================

type GuardMethods<T, K extends TypeTag> = K extends 'unknown'
  ? {
      isString(msg?: string): AssumptionFn<string, 'string'>;
      isNumber(msg?: string): AssumptionFn<number, 'number'>;
      isArray(msg?: string): AssumptionFn<unknown[], 'array'>;
      isObject(msg?: string): AssumptionFn<Record<string, unknown>, 'object'>;
      isElement(msg?: string): AssumptionFn<any, 'element'>;
      isBoolean(msg?: string): AssumptionFn<boolean, 'boolean'>;
      isNull(msg?: string): AssumptionFn<null, 'null'>;
      isUndefined(msg?: string): AssumptionFn<undefined, 'undefined'>;
      notNil(msg?: string): AssumptionFn<NonNullable<T>, 'present'>;
      notNull(msg?: string): AssumptionFn<Exclude<T, null>, 'present'>;
      notNullOrUndefined(msg?: string): AssumptionFn<NonNullable<T>, 'present'>;
    }
  : {};

interface BaseChain<T, K extends TypeTag> {
  that(predicate: (v: T) => boolean, msg?: string): AssumptionFn<T, K>;
  equals(expected: Exclude<T, null | undefined | unknown>, msg?: string): AssumptionFn<T, K>;
  instanceof<C extends new (...args: any[]) => any>(expected: C, msg?: string): AssumptionFn<InstanceType<C>, InferTypeTagFromConstructor<C>>;
  instanceof(msg?: string): AssumptionFn<T, DetectTypeTag<T>>;
  value(): T;
}

type NumberOnlyChain = {
  greaterThan(n: number, msg?: string): AssumptionFn<number, 'number'>;
  greaterOrEqual(n: number, msg?: string): AssumptionFn<number, 'number'>;
  lessThan(n: number, msg?: string): AssumptionFn<number, 'number'>;
  lessOrEqual(n: number, msg?: string): AssumptionFn<number, 'number'>;
  between(min: number, max: number, msg?: string): AssumptionFn<number, 'number'>;
};

type StringOnlyChain = {
  notEmpty(msg?: string): AssumptionFn<string, 'string'>;
  hasLength(len: number, msg?: string): AssumptionFn<string, 'string'>;
  minLength(n: number, msg?: string): AssumptionFn<string, 'string'>;
  maxLength(n: number, msg?: string): AssumptionFn<string, 'string'>;
  lengthBetween(min: number, max: number, msg?: string): AssumptionFn<string, 'string'>;
  contains(needle: string | RegExp, msg?: string): AssumptionFn<string, 'string'>;
  startsWith(prefix: string, msg?: string): AssumptionFn<string, 'string'>;
  endsWith(suffix: string, msg?: string): AssumptionFn<string, 'string'>;
  matches(re: RegExp, msg?: string): AssumptionFn<string, 'string'>;
  equalsIgnoreCase(expected: string, msg?: string): AssumptionFn<string, 'string'>;
  includesAny(...needles: string[]): AssumptionFn<string, 'string'>;
  includesAll(...needles: string[]): AssumptionFn<string, 'string'>;
  isJSON(msg?: string): AssumptionFn<string, 'string'>;
};

type ArrayOnlyChain = {
  hasLength(len: number, msg?: string): AssumptionFn<unknown[], 'array'>;
  notEmpty(msg?: string): AssumptionFn<unknown[], 'array'>;
  includesString(needle: string, msg?: string): AssumptionFn<unknown[], 'array'>;
  includesNumber(needle: number, msg?: string): AssumptionFn<unknown[], 'array'>;
  includesObject(needle: Record<string, unknown>, msg?: string): AssumptionFn<unknown[], 'array'>;
  onlyHasObjects(msg?: string): AssumptionFn<unknown[], 'array'>;
  onlyHasStrings(msg?: string): AssumptionFn<unknown[], 'array'>;
  onlyHasNumbers(msg?: string): AssumptionFn<unknown[], 'array'>;
  everyIsFalsy(msg?: string): AssumptionFn<unknown[], 'array'>;
  everyIsTruthy(msg?: string): AssumptionFn<unknown[], 'array'>;
  includesCondition(needle: (item: unknown) => boolean, msg?: string): AssumptionFn<unknown[], 'array'>;
  itemIsBoolean(index: number, msg?: string): AssumptionFn<unknown[], 'array'>;
  itemIsString(index: number, msg?: string): AssumptionFn<unknown[], 'array'>;
  itemIsNumber(index: number, msg?: string): AssumptionFn<unknown[], 'array'>;
  itemIsObject(index: number, msg?: string): AssumptionFn<unknown[], 'array'>;
};

type ObjectOnlyChain = {
  hasKey<K extends string>(key: K, msg?: string): AssumptionFn<Record<string, unknown>, 'object'>;
  hasKeys(...keys: string[]): AssumptionFn<Record<string, unknown>, 'object'>;
  keyEquals<K extends string>(key: K, expected: unknown, msg?: string): AssumptionFn<Record<string, unknown>, 'object'>;
  sameKeys(expected: Record<string, unknown>, msg?: string): AssumptionFn<Record<string, unknown>, 'object'>;
  allKeysFalsy(msg?: string): AssumptionFn<Record<string, unknown>, 'object'>;
  allKeysSet(msg?: string): AssumptionFn<Record<string, unknown>, 'object'>;
  anyKeyNull(msg?: string): AssumptionFn<Record<string, unknown>, 'object'>;
};

type ElementOnlyChain = {
  hasChildren(msg?: string): AssumptionFn<any, 'element'>;
  hasChild(msg?: string): AssumptionFn<any, 'element'>;
  hasChildMatching(selector: string, msg?: string): AssumptionFn<any, 'element'>;
  hasDescendant(selector: string, msg?: string): AssumptionFn<any, 'element'>;
  hasAttribute(name: string, msg?: string): AssumptionFn<any, 'element'>;
  attributeEquals(name: string, expected: string, msg?: string): AssumptionFn<any, 'element'>;
};

type Specialized<T, K extends TypeTag> = K extends 'number' ? NumberOnlyChain : K extends 'string' ? StringOnlyChain : K extends 'array' ? ArrayOnlyChain : K extends 'object' ? ObjectOnlyChain : K extends 'element' ? ElementOnlyChain : {};

export type AssumptionFn<T, K extends TypeTag = 'unknown'> = (() => boolean | void) & BaseChain<T, K> & GuardMethods<T, K> & Specialized<T, K>;

// ============================================================================
// EVENT BUS
// ============================================================================

export type Listener<T = any> = (payload?: T) => void;

export declare class AssumingBus {
  on<T = any>(event: string, fn: Listener<T>): () => void;
  off(event: string, fn: Listener): void;
  once<T = any>(event: string, fn: Listener<T>): () => void;
  emit<T = any>(event: string, payload?: T): void;
}

export declare const assumingBus: AssumingBus;

// ============================================================================
// ASSUMING CORE
// ============================================================================

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
  catch(fn: (err: unknown) => unknown): any;
  result<R>(success: () => R, failure?: (err?: unknown) => R): R | undefined;
  with(patch: AssumingOptions | string): any;
  message(msg: string): any;
  quiet(value?: boolean): any;
  options(): Readonly<AssumingOptions>;
};

export declare function safeToAssume(...args: any[]): boolean;

// ============================================================================
// ASSUMPTION ERROR
// ============================================================================

type AssumeEvent = { t: number; kind: 'start'; info: { valuePreview?: string } } | { t: number; kind: 'check'; info: { type: TypeTag | 'function' | 'datetime'; op?: string } } | { t: number; kind: 'refuted'; info: { message: string } } | { t: number; kind: 'vindicated' };

export declare const captureLocation: string | undefined;

export declare class AssumptionError extends Error {
  readonly name: 'AssumptionError';
  readonly assumeStack: ChainLink[];
  readonly valuePreview?: string;
  readonly timestamp: number;
  readonly cause: unknown;
  readonly chainTrace: string[];
  readonly captureLocation?: string;

  constructor(
    message: string,
    opts: {
      stack: ChainLink[];
      value?: unknown;
      cause?: unknown;
      chainTrace?: string[];
      captureLocation?: string;
    },
  );
}

export declare function isAssumptionError(err: unknown): err is AssumptionError;

// ============================================================================
// MAIN EXPORTS
// ============================================================================

export declare function that<T>(value: T): AssumptionFn<T, 'unknown'>;
export declare function assume<T>(value: T): AssumptionFn<T, 'unknown'>;

// ============================================================================
// HISTORY MANAGEMENT
// ============================================================================

export declare function getAssumeHistory(): ReadonlyArray<AssumeEvent>;
export declare function clearAssumeHistory(): void;
export declare function setAssumeHistoryLimit(n: number): void;

// ============================================================================
// ERROR HANDLING HELPERS
// ============================================================================

export type AnyFn = (...args: any[]) => any;

export declare function defRefHandler<R>(def: R, log?: ((err: unknown) => void) | boolean): (err: unknown) => R;
export declare function defRefHandlerAsync<R>(def: R, log?: ((err: unknown) => void) | boolean): (err: unknown) => Promise<R>;
export declare function assumedRoute<F extends AnyFn>(onRefuted: (err: unknown, ...args: Parameters<F>) => ReturnType<F>, handler: F): (...args: Parameters<F>) => ReturnType<F>;
