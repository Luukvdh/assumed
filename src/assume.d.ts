/**
 * A simple listener (callback) function signature for the AssumingBus.
 * Receives an optional payload whose type is parameterized.
 */
export type Listener<T = any> = (payload?: T) => void;

/**
 * Lightweight event bus used by assuming()/assume() to emit pass/fail
 * and optional custom events. Supports standard on/off/once semantics.
 */
export class AssumingBus {
  /**
   * Subscribe to an event.
   * @param event Event name.
   * @param fn Listener function.
   * @returns A disposer function that removes the listener.
   */
  on<T = any>(event: string, fn: Listener<T>): () => void;
  /**
   * Remove a previously registered listener.
   * @param event Event name.
   * @param fn Listener function reference.
   */
  off(event: string, fn: Listener): void;
  /**
   * Subscribe to an event for a single emission.
   * Listener auto‑removes after the first emit.
   * @param event Event name.
   * @param fn Listener function.
   * @returns A disposer (which can be used to cancel before first emit).
   */
  once<T = any>(event: string, fn: Listener<T>): () => void;
  /**
   * Emit an event to all current listeners.
   * @param event Event name.
   * @param payload Optional payload passed to each listener.
   */
  emit<T = any>(event: string, payload?: T): void;
}
/**
 * Shared singleton instance for assumption events.
 * Emits:
 *  - "assuming:pass" when all supplied assumptions succeed
 *  - "assuming:fail" when any supplied assumption fails
 *  - Custom event (options.emit) when provided and success
 */
export const assumingBus: AssumingBus;

/**
 * Optional configuration for assuming().
 */
export interface AssumingOptions {
  /** Suppress thrown errors / logging if true (you control reactions via onRefuted). */
  quiet?: boolean;
  /** Default message used when an assumption fails without a custom message. */
  message?: string;
  /** Custom event name to emit via assumingBus when assumptions succeed. */
  emit?: string;
}

/**
 * A single assumption unit: either a boolean or a callable that performs checks
 * (throwing on failure) and returns boolean | void.
 */
export type Assumption = boolean | (() => boolean | void);

/**
 * Result / handle returned by assuming(). It is fluent: most mutating or branching
 * methods return the same instance for chaining. It is NOT a Promise; .catch() is a
 * synchronous convenience to mirror Promise-style error handling.
 */
export interface AssumingResult {
  /**
   * Execute a side-effect only when all assumptions have passed.
   * If already refuted, the callback is skipped.
   * Returns the same AssumingResult for fluent chaining.
   */
  Run<R>(fn: () => R): AssumingResult;
  /**
   * Retrieve the last value produced by Run()/result() handlers (if any).
   * Returns undefined if nothing has run yet or the last handler returned undefined.
   */
  value<T = unknown>(): T | undefined;
  /**
   * Assert the entire assumption set succeeded. Throws if refuted.
   * Returns true if vindicated (never actually used in typical chaining).
   */
  isTrue(msg?: string): boolean | never;
  /**
   * Assert the entire assumption set failed. Throws if not refuted.
   * Returns true if refuted (never actually used in typical chaining).
   */
  isFalse(msg?: string): boolean | never;
  /**
   * Indicates all assumptions passed.
   */
  isVindicated(): boolean;
  /**
   * Indicates at least one assumption failed.
   */
  isRefuted(): boolean;
  /**
   * Register a callback executed only if refuted (failure path).
   * Returns the same result for chaining additional handlers.
   */
  onRefuted(fn: (err?: unknown) => unknown): AssumingResult;
  /**
   * Alias of onRefuted for ergonomics with Promise-like flows.
   */
  catch(fn: (err?: unknown) => unknown): AssumingResult;
  /**
   * Branch execution:
   *  - success() runs if vindicated (its return value is propagated)
   *  - failure() runs if refuted (its return value is propagated)
   * Returns the executed branch's return value or undefined.
   */
  result<R>(success: () => R, failure?: (err?: unknown) => R): R | undefined;
  /**
   * Patch current options (or set a default message if a string is passed).
   * Returns this result for fluent chaining.
   */
  with(patch: AssumingOptions | string): AssumingResult;
  /**
   * Replace the default failure message.
   */
  message(msg: string): AssumingResult;
  /**
   * Enable/disable quiet mode (suppress thrown error propagation).
   */
  quiet(value?: boolean): AssumingResult;
  /**
   * Snapshot of the current options object (cloned).
   */
  options(): Readonly<AssumingOptions>;
}

/**
 * Aggregate a set of assumptions (booleans or callable assumption functions).
 * Executes them immediately (capturing pass/fail state) and returns a handle
 * for reaction (Run, onRefuted, etc.).
 */
export function assuming(
  ...args: Array<Assumption | AssumingOptions | string | null | undefined>
): AssumingResult;

/**
 * Run a function and return true if it does not throw, false if it does.
 * Handy for ad-hoc guard evaluations outside the full assume chain.
 */
export function check(Fn: AssumptionFn<unknown, TypeTag>): boolean;

/**
 * Internal type tags representing the currently narrowed value type within a chain.
 * Used purely for type-level IntelliSense gating.
 */
export type TypeTag =
  | "unknown"
  | "string"
  | "number"
  | "array"
  | "object"
  | "element"
  | "boolean"
  | "null"
  | "undefined"
  | "present";

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

// Minimal DOM stubs (merged with lib.dom.d.ts in browser)
declare global {
  interface Element {}
  interface HTMLElement extends Element {}
}

/**
 * Core group of throwing validation functions (non-fluent).
 * Each will throw on failure, narrowing types where appropriate.
 */
export type CoreChecksType = {
  /** Throw if cond is true (alias). */
  assumeFalse(cond: boolean, msg?: string): asserts cond is false;
  /** Throw if cond is false (alias). */
  assumeTrue(cond: boolean, msg?: string): asserts cond;
  /** Assert condition is true. */
  isTrue(cond: boolean, msg?: string): asserts cond;
  /** Assert condition is false. */
  isFalse(cond: boolean, msg?: string): asserts cond is false;
  /** Assert value is a function. */
  isFunction(v: unknown, msg?: string): asserts v is (...args: any[]) => any;
  /** Assert value is a Promise. */
  isPromise(v: unknown, msg?: string): asserts v is Promise<unknown>;
  /** Assert value is an instance of ctor. */
  isInstanceOf<T>(v: unknown, ctor: new (...a: any[]) => T): asserts v is T;

  /** Assert value is exactly null. */
  isNull(v: unknown, msg?: string): asserts v is null;
  /** Assert value is exactly undefined. */
  isUndefined(v: unknown, msg?: string): asserts v is undefined;
  /** Assert value is null or undefined. */
  isNil(v: unknown, msg?: string): asserts v is null | undefined;
  /** Assert value is not null. */
  notNull<T>(v: T, msg?: string): asserts v is NonNullable<T>;
  /** Assert value is not undefined. */
  notUndefined<T>(v: T, msg?: string): asserts v is NonNullable<T>;
  /** Assert value is not null and not undefined. */
  notNil<T>(v: T, msg?: string): asserts v is NonNullable<T>;
  /** Assert value is neither null nor undefined (alias). */
  notNullOrUndefined<T>(v: T, msg?: string): asserts v is NonNullable<T>;
};

/**
 * Object-oriented validation helpers.
 */
export type ObjectChecksType = {
  /** Assert value is a plain object (non-null, non-array). */
  isObject(v: unknown, msg?: string): asserts v is Record<string, unknown>;
  /** Assert object has a specific key. */
  hasKey<T extends object, K extends string>(
    obj: T,
    key: K,
    msg?: string
  ): asserts obj is T & Record<K, unknown>;
  /** Assert object has all listed keys. Returns true/chain in your impl. */
  hasKeys(
    obj: Record<string, unknown>,
    ...keys: string[]
  ): AssumptionFn<Record<string, unknown>, "object"> | boolean;
  /** Compare JSON.stringify(value) to an expected string. */
  equalStringified(obj: unknown, expected: string): void;
  /** Assert object exact key equality (order ignored). */
  sameKeys(obj: unknown, expected: Record<string, unknown>): void;
  /** Assert every key value is falsey (deprecated alias: allKeysFalsey). */
  allKeysFalsey(
    obj: unknown
  ): asserts obj is Record<string, null | undefined | false | 0 | "">;
  /** Assert every key value is falsy. */
  allKeysFalsy(
    obj: unknown
  ): asserts obj is Record<string, null | undefined | false | 0 | "">;
  /** Assert no key value is undefined. */
  allKeysSet(obj: unknown): asserts obj is Record<string, unknown>;
  /** Assert at least one key value is null. */
  anyKeyNull(obj: unknown): asserts obj is Record<string, null>;
};

/**
 * Array-oriented validation helpers.
 */
export type ArrayChecksType = {
  /** Assert value is an array. */
  isArray(v: unknown, msg?: string): asserts v is unknown[];
  /** Assert array length matches len. */
  hasLength<T extends unknown[]>(
    arr: T,
    len: number,
    msg?: string
  ): asserts arr is { length: typeof len } & T;
  /** Assert element at index is a string. */
  containsString(
    arr: unknown[],
    index: number
  ): asserts arr is { [K in typeof index]: string } & unknown[];
  /** Assert element at index is a number. */
  containsNumber(
    arr: unknown[],
    index: number
  ): asserts arr is { [K in typeof index]: number } & unknown[];
  /** Assert element at index is an object. */
  containsObject(
    arr: unknown[],
    index: number
  ): asserts arr is { [K in typeof index]: object } & unknown[];
};

/**
 * Element / DOM-oriented checks (no-ops server-side if Element is undefined).
 */
export type ElementChecksType = {
  /** Assert value is a DOM Element. */
  isElement(v: unknown, msg?: string): asserts v is Element;
  /** Assert value is an HTMLElement. */
  isHTMLElement(v: unknown, msg?: string): asserts v is HTMLElement;
  /** Assert element is hidden (attribute or computed style). */
  isHidden(el: unknown, msg?: string): asserts el is Element;
  /** Assert element is visible. */
  isVisible(el: unknown, msg?: string): asserts el is Element;
  /** Assert element has at least one child element. */
  hasChild(el: unknown, msg?: string): asserts el is Element;
  /** Assert element has a child matching selector. */
  hasChildMatching(el: unknown, selector: string): asserts el is Element;
  /** Assert element has a descendant matching selector. */
  hasDescendant(el: unknown, selector: string): asserts el is Element;
  /** Assert element has a given attribute. */
  hasAttribute(el: unknown, name: string): asserts el is Element;
  /** Assert element attribute equals expected string. */
  attributeEquals(
    el: unknown,
    name: string,
    expected: string
  ): asserts el is Element;
};

/**
 * Unified export combining all check categories.
 */
export type ChecksType = CoreChecksType &
  ObjectChecksType &
  ArrayChecksType &
  ElementChecksType;

/** Individual category exports. */
export const CoreChecks: CoreChecksType;
export const ObjectChecks: ObjectChecksType;
export const ArrayChecks: ArrayChecksType;
export const ElementChecks: ElementChecksType;
/** Combined checks export (Core + Object + Array + Element). */
export const Checks: ChecksType;

/**
 * Base (always-available) fluent chain methods.
 * Parameterized by current generic type T and narrowing state tag K.
 */
export interface BaseChain<T, K extends TypeTag> {
  /**
   * Add a custom predicate check. Throws with msg (or default) if predicate returns false.
   */
  that(predicate: (v: T) => boolean, msg?: string): AssumptionFn<T, K>;
  /**
   * Shallow equality check using === against expected.
   */
  equals(expected: T, msg?: string): AssumptionFn<T, K>;
  /**
   * Execute all queued chain checks now (throws on first failure) and return true if all succeed.
   * Prefer calling the function itself: chain().
   */
  toBoolean(): boolean;
  /**
   * Assert value is instance of expected constructor.
   */
  instanceof(
    expected: new (...args: any[]) => any,
    msg?: string
  ): AssumptionFn<T, K>;
  /**
   * Get the original (untransformed) value supplied to assume().
   */
  value(): T;
}

/**
 * Fluent number-only methods (available after isNumber()).
 */
export type NumberOnlyChain = {
  /** Assert value > n. */
  greaterThan(n: number, msg?: string): AssumptionFn<number, "number">;
  /** Assert value >= n. */
  greaterOrEqual(n: number, msg?: string): AssumptionFn<number, "number">;
  /** Assert value < n. */
  lessThan(n: number, msg?: string): AssumptionFn<number, "number">;
  /** Assert value <= n. */
  lessOrEqual(n: number, msg?: string): AssumptionFn<number, "number">;
  /** Assert value is within inclusive range [min, max]. */
  between(
    min: number,
    max: number,
    msg?: string
  ): AssumptionFn<number, "number">;
};

/**
 * Fluent string-only methods (available after isString()).
 */
export type StringOnlyChain = {
  /** Assert non-empty string length. */
  notEmpty(msg?: string): AssumptionFn<string, "string">;
  /** Assert exact string length. */
  hasLength(len: number, msg?: string): AssumptionFn<string, "string">;
  /** Assert length >= n. */
  minLength(n: number, msg?: string): AssumptionFn<string, "string">;
  /** Assert length <= n. */
  maxLength(n: number, msg?: string): AssumptionFn<string, "string">;
  /** Assert length in inclusive range. */
  lengthBetween(
    min: number,
    max: number,
    msg?: string
  ): AssumptionFn<string, "string">;
  /** Assert substring / regex presence. */
  contains(
    needle: string | RegExp,
    msg?: string
  ): AssumptionFn<string, "string">;
  /** Assert starts with prefix. */
  startsWith(prefix: string, msg?: string): AssumptionFn<string, "string">;
  /** Assert ends with suffix. */
  endsWith(suffix: string, msg?: string): AssumptionFn<string, "string">;
  /** Assert regex matches. */
  matches(re: RegExp, msg?: string): AssumptionFn<string, "string">;
  /** Case-insensitive equality check. */
  equalsIgnoreCase(
    expected: string,
    msg?: string
  ): AssumptionFn<string, "string">;
  /** Assert string includes ANY of the needles. */
  includesAny(...needles: string[]): AssumptionFn<string, "string">;
  /** Assert string includes ALL of the needles. */
  includesAll(...needles: string[]): AssumptionFn<string, "string">;
  /** Assert string parses as valid JSON (JSON.parse succeeds). */
  isJSON(msg?: string): AssumptionFn<string, "string">;
};

/**
 * Fluent array-only methods (available after isArray()).
 */
export type ArrayOnlyChain = {
  /** Assert array length equals len. */
  hasLength(len: number, msg?: string): AssumptionFn<unknown[], "array">;
  /** Assert array length > 0. */
  notEmpty(msg?: string): AssumptionFn<unknown[], "array">;
  /** Assert array includes a string containing needle. */
  includesString(
    needle: string,
    msg?: string
  ): AssumptionFn<unknown[], "array">;
  /** Assert array includes the exact number needle. */
  includesNumber(
    needle: number,
    msg?: string
  ): AssumptionFn<unknown[], "array">;
  /** Assert array includes an object deeply equal to needle (via JSON.stringify). */
  includesObject(
    needle: Record<string, unknown>,
    msg?: string
  ): AssumptionFn<unknown[], "array">;
  /** Assert every element is a plain object. */
  onlyHasObjects(msg?: string): AssumptionFn<unknown[], "array">;
  /** Assert every element is string. */
  onlyHasStrings(msg?: string): AssumptionFn<unknown[], "array">;
  /** Assert every element is number. */
  onlyHasNumbers(msg?: string): AssumptionFn<unknown[], "array">;
  /** Assert every element is falsy. */
  everyIsFalsy(msg?: string): AssumptionFn<unknown[], "array">;
  /** Assert every element is truthy. */
  everyIsTruthy(msg?: string): AssumptionFn<unknown[], "array">;
  /** Assert some element satisfies predicate. */
  includesCondition(
    needle: (item: unknown) => boolean,
    msg?: string
  ): AssumptionFn<unknown[], "array">;
  /** Assert element at index is boolean. */
  itemIsBoolean(index: number, msg?: string): AssumptionFn<unknown[], "array">;
  /** Assert element at index is string. */
  itemIsString(index: number, msg?: string): AssumptionFn<unknown[], "array">;
  /** Assert element at index is number. */
  itemIsNumber(index: number, msg?: string): AssumptionFn<unknown[], "array">;
  /** Assert element at index is plain object. */
  itemIsObject(index: number, msg?: string): AssumptionFn<unknown[], "array">;
};

/**
 * Fluent object-only methods (available after isObject()).
 */
export type ObjectOnlyChain = {
  /** Assert object has given key. */
  hasKey<K extends string>(
    key: K,
    msg?: string
  ): AssumptionFn<Record<string, unknown>, "object">;
  /** Assert object has all given keys. */
  hasKeys(...keys: string[]): AssumptionFn<Record<string, unknown>, "object">;
  /** Assert object[key] strictly equals expected. */
  keyEquals<K extends string>(
    key: K,
    expected: unknown,
    msg?: string
  ): AssumptionFn<Record<string, unknown>, "object">;
  /** Assert object and expected have identical key sets. */
  sameKeys(
    expected: Record<string, unknown>,
    msg?: string
  ): AssumptionFn<Record<string, unknown>, "object">;
  /** Assert every key value is falsy. */
  allKeysFalsy(msg?: string): AssumptionFn<Record<string, unknown>, "object">;
  /** Assert no key value is undefined. */
  allKeysSet(msg?: string): AssumptionFn<Record<string, unknown>, "object">;
  /** Assert at least one key is null. */
  anyKeyNull(msg?: string): AssumptionFn<Record<string, unknown>, "object">;
};

/**
 * Fluent element-only methods (available after isElement()).
 */
export type ElementOnlyChain = {
  /** Assert element has >= 1 child element. */
  hasChildren(msg?: string): AssumptionFn<any, "element">;
  /** Alias of hasChildren. */
  hasChild(msg?: string): AssumptionFn<any, "element">;
  /** Assert element has a child matching selector. */
  hasChildMatching(
    selector: string,
    msg?: string
  ): AssumptionFn<any, "element">;
  /** Assert element has a descendant matching selector. */
  hasDescendant(selector: string, msg?: string): AssumptionFn<any, "element">;
  /** Assert element has an attribute. */
  hasAttribute(name: string, msg?: string): AssumptionFn<any, "element">;
  /** Assert element's attribute equals expected. */
  attributeEquals(
    name: string,
    expected: string,
    msg?: string
  ): AssumptionFn<any, "element">;
};

/**
 * Guard methods exposed ONLY when the chain is still 'unknown'.
 * After the first narrowing guard, these disappear and only specialized methods remain.
 */
export type GuardMethods<T, K extends TypeTag> = K extends "unknown"
  ? {
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
      /** Narrow to null (terminal). */
      isNull(msg?: string): AssumptionFn<null, "null">;
      /** Narrow to undefined (terminal). */
      isUndefined(msg?: string): AssumptionFn<undefined, "undefined">;
      /** Assert not null/undefined; your impl moves to 'present'. */
      notNil(msg?: string): AssumptionFn<T | "undefined" | "null", "present">;
      /** Assert not null; your impl moves to 'present'. */
      notNull(msg?: string): AssumptionFn<T | "null", "present">;
      /** Assert neither null nor undefined; moves to 'present'. */
      notNullOrUndefined(
        msg?: string
      ): AssumptionFn<T | "undefined" | "null", "present">;
    }
  : {};

/**
 * Conditional mapping to specialized fluent method groups after a guard has narrowed the type.
 */
export type Specialized<T, K extends TypeTag> = K extends "number"
  ? NumberOnlyChain
  : K extends "string"
  ? StringOnlyChain
  : K extends "array"
  ? ArrayOnlyChain
  : K extends "object"
  ? ObjectOnlyChain
  : K extends "element"
  ? ElementOnlyChain
  : {};

/**
 * Primary callable assumption chain type.
 * It is both a function (execute queued checks) and an object exposing:
 *  - BaseChain methods (always)
 *  - Guard methods (only while type is 'unknown')
 *  - Specialized fluent methods (after narrowing)
 */
export type AssumptionFn<T, K extends TypeTag = "unknown"> = (() =>
  | boolean
  | void) &
  BaseChain<T, K> &
  GuardMethods<T, K> &
  Specialized<T, K>;

/**
 * Create a new assumption chain around value (initial type tag = 'unknown').
 */
export function assume<T>(value: T): AssumptionFn<T, "unknown">;
/**
 * Alias of assume().
 */
export function that<T>(value: T): AssumptionFn<T, "unknown">;

// ---- AssumptionError + history API (from implementation) ----
export type AssumeEvent =
  | { t: number; kind: "start"; info: { valuePreview?: string } }
  | {
      t: number;
      kind: "check";
      info: { type: TypeTag | "function" | "datetime"; op?: string };
    }
  | { t: number; kind: "refuted"; info: { message: string } }
  | { t: number; kind: "vindicated" };

export class AssumptionError extends Error {
  readonly name: "AssumptionError";
  readonly assumeStack: ChainLink[];
  readonly valuePreview?: string;
  readonly timestamp: number;
  readonly cause: unknown;
  constructor(
    message: string,
    opts: { stack: ChainLink[]; value?: unknown; cause?: unknown }
  );
}
export function isAssumptionError(err: unknown): err is AssumptionError;
export function getAssumeHistory(): ReadonlyArray<AssumeEvent>;
export function clearAssumeHistory(): void;
export function setAssumeHistoryLimit(n: number): void;

// ---- assumedRoute and helpers ----
export type AnyFn = (...args: any[]) => any;

/**
 * Wrap a handler with centralized assumption-error handling.
 * The error passed to onRefuted is enriched with:
 *  - handlerName?: string  // the wrapped function’s name (or "anonymous")
 * and its message is prefixed with "[handlerName] ".
 */
export function assumedRoute<F extends AnyFn>(
  onRefuted: (err: unknown, ...args: Parameters<F>) => ReturnType<F>,
  handler: F
): (...args: Parameters<F>) => ReturnType<F>;

/** Default refuted handler for sync handlers. Optionally log (true uses console.error). */
export function defRefHandler<R>(
  def: R,
  log?: ((err: unknown) => void) | boolean
): (err: unknown, ...args: any[]) => R;
/** Default refuted handler for async handlers (returns a Promise of default). Optionally log (true uses console.error). */
export function defRefHandlerAsync<R>(
  def: R,
  log?: ((err: unknown) => void) | boolean
): (err: unknown, ...args: any[]) => Promise<R>;
