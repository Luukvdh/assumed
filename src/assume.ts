// --- ADD/REVISE TYPES FOR STATEFUL INTELLISENSE NARROWING (top of file, after imports) ---
type TypeTag =
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

type GuardMethods<T, K extends TypeTag> = K extends "unknown"
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
      /** Shortcut numeric guard property (getter). */
      isNull(msg?: string): AssumptionFn<null, "null">;
      /** Narrow to undefined (terminal). */
      isUndefined(msg?: string): AssumptionFn<undefined, "undefined">;
      /** Assert not null/undefined and preserve remainder type (terminal). */
      notNil(msg?: string): AssumptionFn<T | "undefined" | "null", "present">;
      /** Assert not null (removes null from union). */
      notNull(msg?: string): AssumptionFn<T | "null", "present">;
      /** Assert neither null nor undefined. */
      notNullOrUndefined(
        msg?: string
      ): AssumptionFn<T | "undefined" | "null", "present">;
    }
  : {}; // once narrowed, no more guard methods exposed

// Keep your existing specific chain method groupings; re‑use them here
// BaseChain stays the same at runtime, but we parameterize it
interface BaseChain<T, K extends TypeTag> {
  that(predicate: (v: T) => boolean, msg?: string): AssumptionFn<T, K>;
  equals(expected: T, msg?: string): AssumptionFn<T, K>;
  toBoolean(): boolean;
  instanceof(
    expected: new (...args: any[]) => any,
    msg?: string
  ): AssumptionFn<T, K>;
  value(): T;
}

// Re-map your existing chain subtype signatures
type NumberOnlyChain = {
  greaterThan(n: number, msg?: string): AssumptionFn<number, "number">;
  greaterOrEqual(n: number, msg?: string): AssumptionFn<number, "number">;
  lessThan(n: number, msg?: string): AssumptionFn<number, "number">;
  lessOrEqual(n: number, msg?: string): AssumptionFn<number, "number">;
  between(
    min: number,
    max: number,
    msg?: string
  ): AssumptionFn<number, "number">;
};
type StringOnlyChain = {
  notEmpty(msg?: string): AssumptionFn<string, "string">;
  hasLength(len: number, msg?: string): AssumptionFn<string, "string">;
  minLength(n: number, msg?: string): AssumptionFn<string, "string">;
  maxLength(n: number, msg?: string): AssumptionFn<string, "string">;
  lengthBetween(
    min: number,
    max: number,
    msg?: string
  ): AssumptionFn<string, "string">;
  contains(
    needle: string | RegExp,
    msg?: string
  ): AssumptionFn<string, "string">;
  startsWith(prefix: string, msg?: string): AssumptionFn<string, "string">;
  endsWith(suffix: string, msg?: string): AssumptionFn<string, "string">;
  matches(re: RegExp, msg?: string): AssumptionFn<string, "string">;
  equalsIgnoreCase(
    expected: string,
    msg?: string
  ): AssumptionFn<string, "string">;
  includesAny(...needles: string[]): AssumptionFn<string, "string">;
  includesAll(...needles: string[]): AssumptionFn<string, "string">;
  isJSON(msg?: string): AssumptionFn<string, "string">;
};
type ArrayOnlyChain = {
  hasLength(len: number, msg?: string): AssumptionFn<unknown[], "array">;
  notEmpty(msg?: string): AssumptionFn<unknown[], "array">;
  includesString(
    needle: string,
    msg?: string
  ): AssumptionFn<unknown[], "array">;
  includesNumber(
    needle: number,
    msg?: string
  ): AssumptionFn<unknown[], "array">;
  includesObject(
    needle: Record<string, unknown>,
    msg?: string
  ): AssumptionFn<unknown[], "array">;
  onlyHasObjects(msg?: string): AssumptionFn<unknown[], "array">;
  onlyHasStrings(msg?: string): AssumptionFn<unknown[], "array">;
  onlyHasNumbers(msg?: string): AssumptionFn<unknown[], "array">;
  everyIsFalsy(msg?: string): AssumptionFn<unknown[], "array">;
  everyIsTruthy(msg?: string): AssumptionFn<unknown[], "array">;
  includesCondition(
    needle: (item: unknown) => boolean,
    msg?: string
  ): AssumptionFn<unknown[], "array">;
  itemIsBoolean(index: number, msg?: string): AssumptionFn<unknown[], "array">;
  itemIsString(index: number, msg?: string): AssumptionFn<unknown[], "array">;
  itemIsNumber(index: number, msg?: string): AssumptionFn<unknown[], "array">;
  itemIsObject(index: number, msg?: string): AssumptionFn<unknown[], "array">;
};
type ObjectOnlyChain = {
  hasKey<K extends string>(
    key: K,
    msg?: string
  ): AssumptionFn<Record<string, unknown>, "object">;
  hasKeys(...keys: string[]): boolean;
  keyEquals<K extends string>(
    key: K,
    expected: unknown,
    msg?: string
  ): AssumptionFn<Record<string, unknown>, "object">;
  sameKeys(
    expected: Record<string, unknown>,
    msg?: string
  ): AssumptionFn<Record<string, unknown>, "object">;
  allKeysFalsy(msg?: string): AssumptionFn<Record<string, unknown>, "object">;
  allKeysSet(msg?: string): AssumptionFn<Record<string, unknown>, "object">;
  anyKeyNull(msg?: string): AssumptionFn<Record<string, unknown>, "object">;
};
type ElementOnlyChain = {
  hasChildren(msg?: string): AssumptionFn<any, "element">;
  hasChild(msg?: string): AssumptionFn<any, "element">;
  hasChildMatching(
    selector: string,
    msg?: string
  ): AssumptionFn<any, "element">;
  hasDescendant(selector: string, msg?: string): AssumptionFn<any, "element">;
  hasAttribute(name: string, msg?: string): AssumptionFn<any, "element">;
  attributeEquals(
    name: string,
    expected: string,
    msg?: string
  ): AssumptionFn<any, "element">;
};

// Glue: Add conditional specialized chain methods depending on K
type Specialized<T, K extends TypeTag> = K extends "number"
  ? NumberOnlyChain
  : K extends "string"
  ? StringOnlyChain
  : K extends "array"
  ? ArrayOnlyChain
  : K extends "object"
  ? ObjectOnlyChain
  : K extends "element"
  ? ElementOnlyChain
  : {}; // other narrowed primitive kinds expose no extra methods

export type AssumptionFn<T, K extends TypeTag = "unknown"> = (() =>
  | boolean
  | void) &
  BaseChain<T, K> &
  GuardMethods<T, K> &
  Specialized<T, K>;

// --- Tiny event bus (browser/server safe) ---
export type Listener<T = any> = (payload?: T) => void;

export class AssumingBus {
  private map = new Map<string, Set<Listener>>();

  on<T = any>(event: string, fn: Listener<T>): () => void {
    const set = this.map.get(event) ?? new Set<Listener>();
    set.add(fn as Listener);
    this.map.set(event, set);
    return () => this.off(event, fn);
  }

  off(event: string, fn: Listener): void {
    const set = this.map.get(event);
    if (!set) return;
    set.delete(fn);
    if (set.size === 0) this.map.delete(event);
  }

  once<T = any>(event: string, fn: Listener<T>): () => void {
    const off = this.on<T>(event, (p) => {
      off();
      try {
        fn(p);
      } catch {}
    });
    return off;
  }

  emit<T = any>(event: string, payload?: T): void {
    const set = this.map.get(event);
    if (!set) return;
    for (const fn of Array.from(set)) {
      try {
        fn(payload);
      } catch {}
    }
  }
}

export const assumingBus = new AssumingBus();

// --- assuming core ---
export interface AssumingOptions {
  quiet?: boolean; // suppress throw on failure
  message?: string; // custom failure message
  emit?: string; // emit this event when PASS
}

export type Assumption = boolean | (() => boolean | void);

function mergeOptions(
  base: AssumingOptions,
  patch?: AssumingOptions | string | null | undefined
): AssumingOptions {
  if (patch == null) return base;
  if (typeof patch === "string") return { ...base, message: patch };
  return { ...base, ...patch };
}

export function assuming(
  ...args: Array<Assumption | AssumingOptions | string | null | undefined>
) {
  let optionsRef: AssumingOptions = {
    quiet: false,
    message: "Assumption failed",
  };

  // trailing message or options
  if (args.length) {
    const last = args[args.length - 1] as any;
    const isOptsObj =
      last &&
      typeof last === "object" &&
      typeof last !== "function" &&
      typeof last !== "boolean";
    if (typeof last === "string" || isOptsObj) {
      optionsRef = mergeOptions(optionsRef, last);
      args.pop();
    }
  }

  // normalize assumptions to callables; ignore null/undefined
  const assumptions: Array<() => boolean | void> = args
    .filter(
      (a) => a != null && (typeof a === "function" || typeof a === "boolean")
    )
    .map((a) =>
      typeof a === "function" ? (a as () => boolean | void) : () => a as boolean
    );

  let error: unknown;
  let failed = false;

  try {
    for (const a of assumptions) {
      const r = a(); // boolean | void; may throw
      if (r === false) {
        failed = true;
        break;
      }
    }
  } catch (e) {
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
    const msg =
      optionsRef.message ??
      (error instanceof Error ? error.message : "Assumption failed");
    throw error instanceof Error ? error : new Error(msg);
  }

  let lastResult: unknown; // capture last Run/result result

  const buildMessage = (msg?: string) =>
    msg ??
    optionsRef.message ??
    (error instanceof Error ? error.message : "Assumptions not satisfied");

  const api = {
    Run<R>(fn: () => R) {
      if (!failed) lastResult = fn();
      return api; // FLUENT
    },
    // Optional accessor for the value produced by last Run/result
    value<T = unknown>(): T | undefined {
      return lastResult as T | undefined;
    },
    // Throwing asserts
    isTrue(msg?: string): boolean | never {
      if (failed) {
        const m = buildMessage(msg);
        throw error instanceof Error ? error : new Error(m);
      }
      return true;
    },
    isFalse(msg?: string): boolean | never {
      if (!failed) throw new Error(msg ?? "Expected assumptions to be refuted");
      return true;
    },
    // Boolean probes
    isVindicated(): boolean {
      //alias
      return !failed;
    },
    isRefuted(): boolean {
      //alias
      return failed;
    },
    // Fluent failure handler
    onRefuted(fn: (err?: unknown) => unknown) {
      if (failed) lastResult = fn(error);
      return api; // FLUENT
    },
    // Promise-like alias
    catch(fn: (err?: unknown) => unknown) {
      if (failed) lastResult = fn(error);
      return api; // FLUENT
    },
    // Branch helper (kept for convenience)
    result<R>(success: () => R, failure?: (err?: unknown) => R): R | undefined {
      if (!failed) return (lastResult = success());
      if (failure) return (lastResult = failure(error));
      return undefined;
    },
    // Stateful options
    with(patch: AssumingOptions | string) {
      optionsRef = mergeOptions(optionsRef, patch);
      return api;
    },
    message(msg: string) {
      optionsRef.message = msg;
      return api;
    },
    quiet(value = true) {
      optionsRef.quiet = value;
      return api;
    },
    options(): Readonly<AssumingOptions> {
      return { ...optionsRef };
    },
  };

  return api;
}

// Boolean convenience: true if fn does not throw
export function check(Fn: AssumptionFn<unknown, TypeTag>): boolean {
  try {
    return assuming(
      () => {
        Fn();
        return true;
      },
      { quiet: true }
    ).isVindicated();
  } catch {
    return false;
  }
}

// --- Checks (assertions with proper narrowing) ---
export type CoreChecksType = {
  assumeTrue(cond: boolean, msg?: string): asserts cond;
  assumeFalse(cond: boolean, msg?: string): asserts cond is false;
  isTrue(cond: boolean, msg?: string): asserts cond;
  isFalse(cond: boolean, msg?: string): asserts cond is false;
  isFunction(v: unknown, msg?: string): asserts v is (...args: any[]) => any;
  isPromise(v: unknown, msg?: string): asserts v is Promise<unknown>;
  isInstanceOf<T>(v: unknown, ctor: new (...a: any[]) => T): asserts v is T;

  // NEW: strict/loose nullish helpers
  isNull(v: unknown, msg?: string): asserts v is null;
  notNull<T>(v: T, msg?: string): asserts v is NonNullable<T>;
  isUndefined(v: unknown, msg?: string): asserts v is undefined;
  notUndefined<T>(v: T, msg?: string): asserts v is NonNullable<T>;
  isNil(v: unknown, msg?: string): asserts v is null | undefined;
  notNil<T>(v: T, msg?: string): asserts v is NonNullable<T>;
  notNullOrUndefined<T>(v: T, msg?: string): asserts v is NonNullable<T>;
};

export const CoreChecks: CoreChecksType = {
  assumeFalse(cond: boolean, msg?: string): asserts cond is false {
    if (cond) throw new Error(msg ?? "(assumption failed: expected false)");
  },
  assumeTrue(cond: boolean, msg?: string): asserts cond {
    if (!cond) throw new Error(msg ?? "(assumption failed: expected true)");
  },
  isFunction(v: unknown, msg?: string): asserts v is (...args: any[]) => any {
    if (typeof v !== "function") throw new Error(msg ?? "Expected function");
  },
  isPromise(v: unknown, msg?: string): asserts v is Promise<unknown> {
    if (!(v instanceof Promise)) throw new Error(msg ?? "Expected Promise");
  },
  isInstanceOf<T>(v: unknown, ctor: new (...a: any[]) => T): asserts v is T {
    if (!(v instanceof ctor))
      throw new Error(
        `Expected instance of ${(ctor as any).name || "constructor"}`
      );
  },

  // NEW: strict/loose nullish helpers
  isNull(v: unknown, msg?: string): asserts v is null {
    if (v !== null) throw new Error(msg ?? "Expected value to be null");
  },
  isUndefined(v: unknown, msg?: string): asserts v is undefined {
    if (v !== undefined)
      throw new Error(msg ?? "Expected value to be undefined");
  },
  isNil(v: unknown, msg?: string): asserts v is null | undefined {
    // null OR undefined
    if (v != null)
      throw new Error(msg ?? "Expected value to be null or undefined");
  },
  notNil<T>(v: T, msg?: string): asserts v is NonNullable<T> {
    // neither null nor undefined
    if (typeof v === "undefined" || v === null)
      throw new Error(msg ?? "Expected value to be present");
  },
  notNullOrUndefined<T>(v: T, msg?: string): asserts v is NonNullable<T> {
    // neither null nor undefined
    return this.notNil(v, msg);
  },
  notUndefined<T>(v: T, msg?: string): asserts v is NonNullable<T> {
    if (v === undefined) throw new Error(msg ?? "Expected value to be present");
  },
  notNull<T>(v: T, msg?: string): asserts v is NonNullable<T> {
    if (v === null) throw new Error(msg ?? "Expected value to be present");
  },
  isTrue: function (cond: boolean, msg?: string): asserts cond {
    throw new Error("Function not implemented.");
  },
  isFalse: function (cond: boolean, msg?: string): asserts cond is false {
    throw new Error("Function not implemented.");
  },
};

export type ObjectChecksType = {
  isObject(v: unknown, msg?: string): asserts v is Record<string, unknown>;
  hasKey<T extends object, K extends string>(
    obj: T,
    key: K,
    msg?: string
  ): asserts obj is T & Record<K, unknown>;
  hasKeys(
    obj: Record<string, unknown>,
    ...keys: string[]
  ): AssumptionFn<Record<string, unknown>, "object"> | boolean;
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

export const ObjectChecks: ObjectChecksType = {
  isObject(v, msg): asserts v is Record<string, unknown> {
    if (typeof v !== "object" || v === null || Array.isArray(v))
      throw new Error(msg ?? "Expected object");
    assertNotNil(v);
    assertIsObject(v);
  },
  hasKey(obj, key, msg) {
    if (!(key in obj))
      throw new Error(msg ?? `Expected object with key "${key}"`);
  },
  hasKeys(obj, ...keys: string[]) {
    if (typeof obj !== "object" || obj === null)
      throw new Error("Expected object");
    for (const key of keys) {
      if (!(key in obj)) throw new Error(`Expected object with key "${key}"`);
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
      if (!(key in (obj as object)))
        throw new Error(`Expected object to have key "${key}"`);
  },
  allKeysFalsey(
    obj
  ): asserts obj is Record<string, null | undefined | false | 0 | ""> {
    if (typeof obj !== "object" || obj === null)
      throw new Error("Expected object");
    for (const key in obj as any)
      if ((obj as any)[key])
        throw new Error(`Expected key "${key}" to be falsy`);
  },
  allKeysFalsy(
    obj
  ): asserts obj is Record<string, null | undefined | false | 0 | ""> {
    return ObjectChecks.allKeysFalsey(obj);
  },
  allKeysSet(obj) {
    if (typeof obj !== "object" || obj === null)
      throw new Error("Expected object");
    for (const key in obj as any)
      if ((obj as any)[key] === undefined)
        throw new Error(`Expected key "${key}" to be set`);
  },
  anyKeyNull(obj): asserts obj is Record<string, null> {
    if (typeof obj !== "object" || obj === null)
      throw new Error("Expected object");
    let foundNull = false;
    for (const key in obj as any)
      if ((obj as any)[key] === null) foundNull = true;
    if (!foundNull) throw new Error("Expected at least one key to be null");
  },
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

export const ArrayChecks: ArrayChecksType = {
  isArray(v, msg): asserts v is unknown[] {
    assertNotNil(v);
    if (!Array.isArray(v)) throw new Error(msg ?? "Expected array");
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

export const ElementChecks: ElementChecksType = {
  isElement(v, msg) {
    const isElem = typeof Element !== "undefined" && v instanceof Element;
    if (!isElem) throw new Error(msg ?? "Expected DOM Element");
  },
  isHTMLElement(v, msg) {
    const isHtmlElem =
      typeof HTMLElement !== "undefined" && v instanceof HTMLElement;
    if (!isHtmlElem) throw new Error(msg ?? "Expected HTMLElement");
  },
  isHidden(el, msg) {
    if (typeof Element === "undefined" || !(el instanceof Element))
      throw new Error(msg ?? "Expected Element");
    const e = el as Element;
    const hiddenAttr = e.getAttribute?.("hidden") != null;
    const computed =
      typeof window !== "undefined" ? window.getComputedStyle(e) : null;
    const hiddenByCss = computed
      ? computed.display === "none" || computed.visibility === "hidden"
      : false;
    if (!hiddenAttr && !hiddenByCss)
      throw new Error(msg ?? "Expected element to be hidden");
  },
  isVisible(el, msg) {
    if (typeof Element === "undefined" || !(el instanceof Element))
      throw new Error(msg ?? "Expected Element");
    const e = el as Element;
    const computed =
      typeof window !== "undefined" ? window.getComputedStyle(e) : null;
    const visible = computed
      ? computed.display !== "none" && computed.visibility !== "hidden"
      : true;
    if (!visible) throw new Error(msg ?? "Expected element to be visible");
  },
  hasChild(el, msg) {
    if (typeof Element === "undefined" || !(el instanceof Element))
      throw new Error(msg ?? "Expected Element");
    if ((el as Element).childElementCount === 0)
      throw new Error(
        msg ?? "Expected element to have at least one child element"
      );
  },
  hasChildMatching(el, selector) {
    if (typeof Element === "undefined" || !(el instanceof Element))
      throw new Error("Expected Element");
    if (!(el as Element).querySelector(selector))
      throw new Error(`Expected child matching selector "${selector}"`);
  },
  hasDescendant(el, selector) {
    if (typeof Element === "undefined" || !(el instanceof Element))
      throw new Error("Expected Element");
    if (!(el as Element).querySelector(selector))
      throw new Error(`Expected descendant matching selector "${selector}"`);
  },
  hasAttribute(el, name) {
    if (typeof Element === "undefined" || !(el instanceof Element))
      throw new Error("Expected Element");
    if (!(el as Element).hasAttribute(name))
      throw new Error(`Expected element to have attribute "${name}"`);
  },
  attributeEquals(el, name, expected) {
    if (typeof Element === "undefined" || !(el instanceof Element))
      throw new Error("Expected Element");
    if ((el as Element).getAttribute(name) !== expected)
      throw new Error(`Expected attribute "${name}" to equal "${expected}"`);
  },
};

// --- Fluent Assume chain with narrowing ---
function getTypeName(val: unknown): string {
  if (val === null) return "null";
  if (Array.isArray(val)) return "Array";
  if (typeof val === "object")
    return (val as any).constructor?.name || "Object";
  return typeof val;
}

function createAssumption<T>(value: T): AssumptionFn<T, "unknown"> {
  const queue: ChainLink[] = [];

  pushAssumeEvent({
    t: Date.now(),
    kind: "start",
    info: { valuePreview: previewValue(value) },
  });

  const runAll = (): boolean => {
    for (const c of queue) c.check();
    pushAssumeEvent({ t: Date.now(), kind: "vindicated" });
    return true;
  };

  const runner = function () {
    return runAll();
  } as AssumptionFn<T, "unknown">;

  // NOTE: add now wraps thrown errors into AssumptionError and logs history
  const add = (fn: Check, type: ChainLink["type"] = "unknown", op?: string) => {
    const wrapped: Check = () => {
      try {
        fn();
        pushAssumeEvent({ t: Date.now(), kind: "check", info: { type, op } });
      } catch (e) {
        if (isAssumptionError(e)) {
          pushAssumeEvent({
            t: Date.now(),
            kind: "refuted",
            info: { message: e.message },
          });
          throw e;
        }
        const err = new AssumptionError(
          e instanceof Error ? e.message : String(e),
          {
            stack: queue.slice(),
            value,
            cause: e,
          }
        );
        pushAssumeEvent({
          t: Date.now(),
          kind: "refuted",
          info: { message: err.message },
        });
        throw err;
      }
    };
    queue.push({ check: wrapped, type } as ChainLink);
  };

  const base: BaseChain<T, any> = {
    that(predicate: (v: T) => boolean, msg?: string) {
      add(() => {
        if (!predicate(value)) throw new Error(msg ?? "Assumption failed");
      });
      return runner as any;
    },
    instanceof(expected: new (...args: any[]) => any, msg?: string) {
      add(() => {
        if (!(value instanceof expected))
          throw new Error(
            msg ?? "Assumption failed: value is not instance of expected"
          );
      });
      return runner as any;
    },
    equals(expected: T, msg?: string) {
      add(() => {
        if ((value as any) !== expected)
          throw new Error(msg ?? "Assumption failed: value !== expected");
      });
      return runner as any;
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
  const toNumberChain = (): AssumptionFn<number, "number"> =>
    Object.assign(runner as any, {
      greaterThan(n: number, msg?: string) {
        add(() => {
          if (!((value as any) > n)) throw new Error(msg ?? `Expected > ${n}`);
        }, "number");
        return runner as any;
      },
      greaterOrEqual(n: number, msg?: string) {
        add(() => {
          if (!((value as any) >= n))
            throw new Error(msg ?? `Expected >= ${n}`);
        }, "number");
        return runner as any;
      },
      lessThan(n: number, msg?: string) {
        add(() => {
          if (!((value as any) < n)) throw new Error(msg ?? `Expected < ${n}`);
        }, "number");
        return runner as any;
      },
      lessOrEqual(n: number, msg?: string) {
        add(() => {
          if (!((value as any) <= n))
            throw new Error(msg ?? `Expected <= ${n}`);
        }, "number");
        return runner as any;
      },
      between(min: number, max: number, msg?: string) {
        add(() => {
          const v = value as any;
          if (!(v >= min && v <= max))
            throw new Error(msg ?? `Expected between ${min} and ${max}`);
        }, "number");
        return runner as any;
      },
    } satisfies NumberOnlyChain);

  const toStringChain = (): AssumptionFn<string, "string"> =>
    Object.assign(runner as any, {
      notEmpty(msg?: string) {
        add(() => {
          if (String(value).length === 0)
            throw new Error(msg ?? "Expected non-empty string");
        }, "string");
        return runner as any;
      },
      hasLength(len: number, msg?: string) {
        add(() => {
          if (String(value).length !== len)
            throw new Error(msg ?? `Expected length ${len}`);
        }, "string");
        return runner as any;
      },
      minLength(n: number, msg?: string) {
        add(() => {
          if (String(value).length < n)
            throw new Error(msg ?? `Expected length >= ${n}`);
        }, "string");
        return runner as any;
      },
      maxLength(n: number, msg?: string) {
        add(() => {
          if (String(value).length > n)
            throw new Error(msg ?? `Expected length <= ${n}`);
        }, "string");
        return runner as any;
      },
      lengthBetween(min: number, max: number, msg?: string) {
        add(() => {
          const l = String(value).length;
          if (l < min || l > max)
            throw new Error(msg ?? `Expected length between ${min} and ${max}`);
        }, "string");
        return runner as any;
      },
      contains(needle: string | RegExp, msg?: string) {
        add(() => {
          const s = String(value);
          const ok =
            typeof needle === "string" ? s.includes(needle) : needle.test(s);
          if (!ok)
            throw new Error(msg ?? `Expected to contain ${String(needle)}`);
        }, "string");
        return runner as any;
      },
      startsWith(prefix: string, msg?: string) {
        add(() => {
          if (!String(value).startsWith(prefix))
            throw new Error(msg ?? `Expected to start with "${prefix}"`);
        }, "string");
        return runner as any;
      },
      endsWith(suffix: string, msg?: string) {
        add(() => {
          if (!String(value).endsWith(suffix))
            throw new Error(msg ?? `Expected to end with "${suffix}"`);
        }, "string");
        return runner as any;
      },
      matches(re: RegExp, msg?: string) {
        add(() => {
          if (!re.test(String(value)))
            throw new Error(msg ?? `Expected to match ${re}`);
        }, "string");
        return runner as any;
      },
      equalsIgnoreCase(expected: string, msg?: string) {
        add(() => {
          if (String(value).toLowerCase() !== expected.toLowerCase())
            throw new Error(msg ?? `Expected "${expected}" (case-insensitive)`);
        }, "string");
        return runner as any;
      },
      includesAny(...needles: string[]) {
        add(() => {
          const s = String(value);
          if (!needles.some((n) => s.includes(n)))
            throw new Error(`Expected any of [${needles.join(", ")}]`);
        }, "string");
        return runner as any;
      },
      includesAll(...needles: string[]) {
        add(() => {
          const s = String(value);
          if (!needles.every((n) => s.includes(n)))
            throw new Error(`Expected all of [${needles.join(", ")}]`);
        }, "string");
        return runner as any;
      },
      isJSON(msg?: string) {
        add(() => {
          try {
            JSON.parse(String(value));
          } catch {
            throw new Error(msg ?? "Expected valid JSON");
          }
        }, "string");
        return runner as any;
      },
    } satisfies StringOnlyChain);

  const toArrayChain = (): AssumptionFn<unknown[], "array"> =>
    Object.assign(runner as any, {
      hasLength(len: number, msg?: string) {
        add(() => {
          if ((value as any[]).length !== len)
            throw new Error(msg ?? `Expected array length ${len}`);
        }, "array");
        return runner as any;
      },
      notEmpty(msg?: string) {
        add(() => {
          if ((value as any[]).length === 0)
            throw new Error(msg ?? "Expected non-empty array");
        }, "array");
        return runner as any;
      },
      itemIsBoolean(i: number, msg?: string) {
        add(() => {
          if (typeof (value as any[])[i] !== "boolean")
            throw new Error(msg ?? `Expected boolean at ${i}`);
        }, "array");
        return runner as any;
      },
      itemIsString(i: number, msg?: string) {
        add(() => {
          if (typeof (value as any[])[i] !== "string")
            throw new Error(msg ?? `Expected string at ${i}`);
        }, "array");
        return runner as any;
      },
      itemIsNumber(i: number, msg?: string) {
        add(() => {
          if (typeof (value as any[])[i] !== "number")
            throw new Error(msg ?? `Expected number at ${i}`);
        }, "array");
        return runner as any;
      },
      itemIsObject(i: number, msg?: string) {
        add(() => {
          const v = (value as any[])[i];
          if (typeof v !== "object" || v === null || Array.isArray(v))
            throw new Error(msg ?? `Expected object at ${i}`);
        }, "array");
        return runner as any;
      },
      includesString(
        needle: string,
        msg?: string
      ): AssumptionFn<unknown[], "array"> {
        add(() => {
          if (!(value as any[]).some((item) => String(item).includes(needle)))
            throw new Error(msg ?? `Expected string including "${needle}"`);
        }, "array");
        return runner as any;
      },
      includesNumber(
        needle: number,
        msg?: string
      ): AssumptionFn<unknown[], "array"> {
        add(() => {
          if (!(value as any[]).some((item) => item === needle))
            throw new Error(msg ?? `Expected number including "${needle}"`);
        }, "array");
        return runner as any;
      },
      includesObject(
        needle: Record<string, unknown>,
        msg?: string
      ): AssumptionFn<unknown[], "array"> {
        add(() => {
          if (
            !(value as any[]).some(
              (item) => JSON.stringify(item) === JSON.stringify(needle)
            )
          )
            throw new Error(
              msg ?? `Expected object including "${JSON.stringify(needle)}"`
            );
        }, "array");
        return runner as any;
      },
      onlyHasObjects(msg?: string): AssumptionFn<unknown[], "array"> {
        add(() => {
          if (
            !(value as any[]).every(
              (item) =>
                typeof item === "object" &&
                item !== null &&
                !Array.isArray(item)
            )
          )
            throw new Error(msg ?? "Expected all objects");
        }, "array");
        return runner as any;
      },
      onlyHasStrings(msg?: string): AssumptionFn<unknown[], "array"> {
        add(() => {
          if (!(value as any[]).every((item) => typeof item === "string"))
            throw new Error(msg ?? "Expected all strings");
        }, "array");
        return runner as any;
      },
      onlyHasNumbers(msg?: string): AssumptionFn<unknown[], "array"> {
        add(() => {
          if (!(value as any[]).every((item) => typeof item === "number"))
            throw new Error(msg ?? "Expected all numbers");
        }, "array");
        return runner as any;
      },
      everyIsFalsy(msg?: string): AssumptionFn<unknown[], "array"> {
        add(() => {
          if (!(value as any[]).every((item) => !item))
            throw new Error(msg ?? "Expected all falsy");
        }, "array");
        return runner as any;
      },
      everyIsTruthy(msg?: string): AssumptionFn<unknown[], "array"> {
        add(() => {
          if (!(value as any[]).every((item) => !!item))
            throw new Error(msg ?? "Expected all truthy");
        }, "array");
        return runner as any;
      },
      includesCondition(
        needle: (item: unknown) => boolean,
        msg?: string
      ): AssumptionFn<unknown[], "array"> {
        add(() => {
          if (!(value as any[]).some(needle))
            throw new Error(msg ?? "Expected array to include condition");
        }, "array");
        return runner as any;
      },
    } satisfies ArrayOnlyChain);

  const toObjectChain = (): AssumptionFn<Record<string, unknown>, "object"> =>
    Object.assign(runner as any, {
      hasKey(key: string, msg?: string) {
        add(() => {
          if (!(key in (value as any)))
            throw new Error(msg ?? `Expected key "${key}"`);
        }, "object");
        return runner as any;
      },
      hasKeys(...keys: string[]) {
        add(() => {
          for (const k of keys)
            if (!(k in (value as any))) throw new Error(`Expected key "${k}"`);
        }, "object");
        return runner as any;
      },
      keyEquals(key: string, expected: unknown, msg?: string) {
        add(() => {
          if ((value as any)[key] !== expected)
            throw new Error(msg ?? `Expected ${key} === ${String(expected)}`);
        }, "object");
        return runner as any;
      },
      sameKeys(expected: Record<string, unknown>, msg?: string) {
        add(() => {
          const a = Object.keys(value as any);
          const b = Object.keys(expected);
          if (a.length !== b.length)
            throw new Error(msg ?? "Key count mismatch");
          for (const k of b)
            if (!(k in (value as any)))
              throw new Error(msg ?? `Missing key "${k}"`);
        }, "object");
        return runner as any;
      },
      allKeysFalsy(msg?: string) {
        add(() => {
          for (const k in value as any)
            if ((value as any)[k])
              throw new Error(msg ?? `Key "${k}" not falsy`);
        }, "object");
        return runner as any;
      },
      allKeysSet(msg?: string) {
        add(() => {
          for (const k in value as any)
            if ((value as any)[k] === undefined)
              throw new Error(msg ?? `Key "${k}" unset`);
        }, "object");
        return runner as any;
      },
      anyKeyNull(msg?: string) {
        add(() => {
          let f = false;
          for (const k in value as any)
            if ((value as any)[k] === null) {
              f = true;
              break;
            }
          if (!f) throw new Error(msg ?? "No null key");
        }, "object");
        return runner as any;
      },
    } satisfies ObjectOnlyChain);

  const toElementChain = (): AssumptionFn<any, "element"> =>
    Object.assign(runner as any, {
      hasChildren(msg?: string) {
        add(() => {
          const e = value as any;
          if (
            typeof Element === "undefined" ||
            !(e instanceof Element) ||
            e.childElementCount === 0
          )
            throw new Error(msg ?? "Expected child elements");
        }, "element");
        return runner as any;
      },
      hasChild(msg?: string) {
        return (runner as any).hasChildren(msg);
      },
      hasChildMatching(sel: string, msg?: string) {
        add(() => {
          const e = value as any;
          if (
            typeof Element === "undefined" ||
            !(e instanceof Element) ||
            !e.querySelector(sel)
          )
            throw new Error(msg ?? `Missing child "${sel}"`);
        }, "element");
        return runner as any;
      },
      hasDescendant(sel: string, msg?: string) {
        add(() => {
          const e = value as any;
          if (
            typeof Element === "undefined" ||
            !(e instanceof Element) ||
            !e.querySelector(sel)
          )
            throw new Error(msg ?? `Missing descendant "${sel}"`);
        }, "element");
        return runner as any;
      },
      hasAttribute(name: string, msg?: string) {
        add(() => {
          const e = value as any;
          if (
            typeof Element === "undefined" ||
            !(e instanceof Element) ||
            !e.hasAttribute(name)
          )
            throw new Error(msg ?? `Missing attribute "${name}"`);
        }, "element");
        return runner as any;
      },
      attributeEquals(name: string, expected: string, msg?: string) {
        add(() => {
          const e = value as any;
          if (
            typeof Element === "undefined" ||
            !(e instanceof Element) ||
            e.getAttribute(name) !== expected
          )
            throw new Error(msg ?? `Attr "${name}" != "${expected}"`);
        }, "element");
        return runner as any;
      },
    } satisfies ElementOnlyChain);

  // Type guards (only on unknown)
  (runner as any).isNumber = (msg?: string) => {
    add(() => {
      if (typeof value !== "number") throw new Error(msg ?? "Expected number");
    }, "number");
    return toNumberChain();
  };

  (runner as any).isString = (msg?: string) => {
    add(() => {
      if (typeof value !== "string") throw new Error(msg ?? "Expected string");
    }, "string");
    return toStringChain();
  };
  (runner as any).isArray = (msg?: string) => {
    add(() => {
      if (!Array.isArray(value)) throw new Error(msg ?? "Expected array");
    }, "array");
    return toArrayChain();
  };
  (runner as any).isObject = (msg?: string) => {
    add(() => {
      if (typeof value !== "object" || value === null || Array.isArray(value))
        throw new Error(msg ?? "Expected object");
    }, "object");
    return toObjectChain();
  };
  (runner as any).isElement = (msg?: string) => {
    add(() => {
      if (
        typeof Element === "undefined" ||
        !((value as any) instanceof Element)
      )
        throw new Error(msg ?? "Expected Element");
    }, "element");
    return toElementChain();
  };
  (runner as any).isBoolean = (msg?: string) => {
    add(() => {
      if (typeof value !== "boolean")
        throw new Error(msg ?? "Expected boolean");
    }, "boolean");
    return runner as AssumptionFn<boolean, "boolean">;
  };
  (runner as any).isNumber = (msg?: string) => {
    add(() => {
      if (typeof value !== "number") throw new Error(msg ?? "Expected number");
    }, "number");
    return toNumberChain();
  };

  (runner as any).isString = (msg?: string) => {
    add(() => {
      if (typeof value !== "string") throw new Error(msg ?? "Expected string");
    }, "string");
    return toStringChain();
  };

  (runner as any).isArray = (msg?: string) => {
    add(() => {
      if (!Array.isArray(value)) throw new Error(msg ?? "Expected array");
    }, "array");
    return toArrayChain();
  };

  (runner as any).isObject = (msg?: string) => {
    add(() => {
      if (typeof value !== "object" || value === null || Array.isArray(value))
        throw new Error(msg ?? "Expected object");
    }, "object");
    return toObjectChain();
  };

  (runner as any).isElement = (msg?: string) => {
    add(() => {
      if (
        typeof Element === "undefined" ||
        !((value as any) instanceof Element)
      )
        throw new Error(msg ?? "Expected Element");
    }, "element");
    return toElementChain();
  };

  (runner as any).isBoolean = (msg?: string) => {
    add(() => {
      if (typeof value !== "boolean")
        throw new Error(msg ?? "Expected boolean");
    }, "boolean");
    return runner as AssumptionFn<boolean, "boolean">;
  };

  // Nullish guards producing terminal states
  (runner as any).isNull = (msg?: string) => {
    add(() => {
      if (value !== null) throw new Error(msg ?? "Expected null");
    }, "null");
    return runner as AssumptionFn<NonNullable<T>, "present">;
  };

  (runner as any).isUndefined = (msg?: string) => {
    add(() => {
      if (value !== undefined) throw new Error(msg ?? "Expected undefined");
    }, "undefined");
    return runner as AssumptionFn<undefined, "undefined">;
  };

  // Non‑nullish guards that KEEP other type guards (move to 'present')
  (runner as any).notNil = (msg?: string) => {
    add(() => {
      if (value === null || value === undefined)
        throw new Error(msg ?? "Expected value (not null/undefined)");
    }, "present");
    return runner as AssumptionFn<T | null | undefined, "present">;
  };

  (runner as any).notNull = (msg?: string) => {
    add(() => {
      if (value === null) throw new Error(msg ?? "Expected not null");
    }, "unknown");
    return runner as AssumptionFn<T | null, "present">;
  };

  (runner as any).notNullOrUndefined = (msg?: string) => {
    add(() => {
      if (value === null || value === undefined)
        throw new Error(msg ?? "Expected value (not null/undefined)");
    }, "unknown");
    return runner as AssumptionFn<T | null | undefined, "present">;
  };

  return runner as AssumptionFn<T, "unknown">;
}

// Exported entry
export function that<T>(value: T): AssumptionFn<T, "unknown"> {
  return createAssumption<T>(value);
}
export function assume<T>(value: T): AssumptionFn<T, "unknown"> {
  return createAssumption<T>(value);
}
export function assertIsString(v: unknown, msg?: string): asserts v is string {
  assume(v).isString(msg)();
}
export function assertNotNil(
  v: unknown,
  msg?: string
): asserts v is NonNullable<typeof v> {
  if (v === undefined || v === null || typeof v === "undefined")
    throw new Error(msg ?? "Entry is nil. Expected not null or undefined");
}

export function assertIsObject<T extends object = Record<string, unknown>>(
  v: unknown,
  msg?: string
): asserts v is T {
  if (typeof v !== "object" || v === null || Array.isArray(v))
    throw new Error(msg ?? "Expected object");
}
export type ChecksType = CoreChecksType &
  ObjectChecksType &
  ArrayChecksType &
  ElementChecksType;
export const Checks: ChecksType = {
  ...CoreChecks,
  ...ObjectChecks,
  ...ArrayChecks,
  ...ElementChecks,
} as ChecksType;

// ---- AssumptionError + central history ----
type AssumeEvent =
  | { t: number; kind: "start"; info: { valuePreview?: string } }
  | {
      t: number;
      kind: "check";
      info: { type: TypeTag | "function" | "datetime"; op?: string };
    }
  | { t: number; kind: "refuted"; info: { message: string } }
  | { t: number; kind: "vindicated" };

const ASSUME_HISTORY: AssumeEvent[] = [];
let ASSUME_HISTORY_LIMIT = 200;

function pushAssumeEvent(ev: AssumeEvent) {
  ASSUME_HISTORY.push(ev);
  if (ASSUME_HISTORY.length > ASSUME_HISTORY_LIMIT) ASSUME_HISTORY.shift();
}

function previewValue(v: unknown): string | undefined {
  try {
    if (v === null || v === undefined) return String(v);
    if (typeof v === "string")
      return v.length > 120 ? v.slice(0, 117) + "..." : v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (Array.isArray(v)) return `Array(${v.length})`;
    if (typeof v === "object")
      return `{${Object.keys(v as object)
        .slice(0, 6)
        .join(",")}${Object.keys(v as object).length > 6 ? ",…" : ""}}`;
    return typeof v;
  } catch {
    return undefined;
  }
}

export class AssumptionError extends Error {
  readonly name = "AssumptionError";
  readonly assumeStack: ChainLink[];
  readonly valuePreview?: string;
  readonly timestamp: number;
  readonly cause: unknown;

  constructor(
    message: string,
    opts: { stack: ChainLink[]; value?: unknown; cause?: unknown }
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.assumeStack = opts.stack;
    this.valuePreview = previewValue(opts.value);
    this.timestamp = Date.now();
    this.cause = opts.cause;
  }
}

export function isAssumptionError(err: unknown): err is AssumptionError {
  return (
    !!err && typeof err === "object" && (err as any).name === "AssumptionError"
  );
}

export function getAssumeHistory(): ReadonlyArray<AssumeEvent> {
  return ASSUME_HISTORY.slice();
}
export function clearAssumeHistory(): void {
  ASSUME_HISTORY.length = 0;
}
export function setAssumeHistoryLimit(n: number): void {
  ASSUME_HISTORY_LIMIT = Math.max(0, n | 0);
}

export type AnyFn = (...args: any[]) => any;

function getFnName(fn: Function): string {
  return (fn as any).displayName || fn.name || "anonymous";
}

function enrichWithHandlerName(err: unknown, handler: Function): unknown {
  const name = getFnName(handler);
  if (err && typeof err === "object") {
    try {
      // attach meta
      (err as any).handlerName = name;
      // prefix message for visibility

      if ((err as any).message && typeof (err as any).message === "string") {
        (err as any).message = `[${name}] ${(err as any).message}`;
      }
    } catch {
      /* ignore */
    }
  }
  return err;
}

export function defRefHandler<R>(
  def: R,
  log: ((err: unknown) => void) | boolean = false
) {
  return (err: unknown) => {
    enrichWithHandlerName(err, defRefHandler);
    if (log) (typeof log === "function" ? log : console.error)(err);
    return def;
  };
}

export function defRefHandlerAsync<R>(
  def: R,
  log: ((err: unknown) => void) | boolean = false
) {
  return async (err: unknown) => {
    enrichWithHandlerName(err, defRefHandlerAsync);
    if (log) (typeof log === "function" ? log : console.error)(err);
    return def;
  };
}

export function assumedRoute<F extends AnyFn>(
  onRefuted: (err: unknown, ...args: Parameters<F>) => ReturnType<F>,
  handler: F
) {
  return (...args: Parameters<F>): ReturnType<F> => {
    try {
      const result = handler(...args);
      if (result && typeof (result as any).then === "function") {
        return (result as Promise<any>).catch((e) =>
          onRefuted(enrichWithHandlerName(e, handler), ...args)
        ) as ReturnType<F>;
      }
      return result as ReturnType<F>;
    } catch (e) {
      return onRefuted(enrichWithHandlerName(e, handler), ...args);
    }
  };
}
