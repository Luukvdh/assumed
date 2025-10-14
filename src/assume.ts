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
    isTrue(msg?: string): void {
      if (failed) {
        const m = buildMessage(msg);
        throw error instanceof Error ? error : new Error(m);
      }
    },
    isFalse(msg?: string): void {
      if (!failed) throw new Error(msg ?? "Expected assumptions to be refuted");
    },
    // Boolean probes
    wasCorrect(): boolean {
      return !failed;
    },
    wasWrong(): boolean {
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
export function check(fn: () => void): boolean {
  try {
    return assuming(
      () => {
        fn();
        return true;
      },
      { quiet: true }
    ).wasCorrect();
  } catch {
    return false;
  }
}

// --- Checks (assertions with proper narrowing) ---
export type CoreChecksType = {
  that(cond: boolean, msg?: string): asserts cond;
  isTrue(cond: boolean, msg?: string): asserts cond;
  isFalse(cond: boolean, msg?: string): asserts cond is false;
  isFunction(v: unknown, msg?: string): asserts v is (...args: any[]) => any;
  isPromise(v: unknown, msg?: string): asserts v is Promise<unknown>;
  isInstanceOf<T>(v: unknown, ctor: new (...a: any[]) => T): asserts v is T;

  // NEW: strict/loose nullish helpers
  isNull(v: unknown, msg?: string): asserts v is null;
  isUndefined(v: unknown, msg?: string): asserts v is undefined;
  isNil(v: unknown, msg?: string): asserts v is null | undefined;
  isPresent<T>(v: T, msg?: string): asserts v is NonNullable<T>;
};

export const CoreChecks: CoreChecksType = {
  that(cond: boolean, msg?: string): asserts cond {
    if (!cond) throw new Error(msg ?? "(assumption failed)");
  },
  isTrue(cond: boolean, msg?: string): asserts cond {
    if (!cond) throw new Error(msg ?? "(assumption failed: expected true)");
  },
  isFalse(cond: boolean, msg?: string): asserts cond is false {
    if (cond) throw new Error(msg ?? "(assumption failed: expected false)");
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
  isPresent<T>(v: T, msg?: string): asserts v is NonNullable<T> {
    // neither null nor undefined
    if (v == null) throw new Error(msg ?? "Expected value to be present");
  },
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

export const ObjectChecks: ObjectChecksType = {
  isObject(v, msg): asserts v is Record<string, unknown> {
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
      if (!(key in obj)) throw new Error(`Expected object with key "${key}"`);
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

// Callable chain builder
type Check = () => void;

type BaseChain<T> = {
  that(
    predicate: (v: T) => boolean,
    msg?: string
  ): AssumptionFn<T> & BaseChain<T>;
  equals(expected: T, msg?: string): AssumptionFn<T> & BaseChain<T>;
  run(): boolean;
  value(): T;
};

type NumberChain = BaseChain<number> & {
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

type ElementChain = BaseChain<any> & {
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

type ObjectChain = BaseChain<Record<string, unknown>> & {
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

type ArrayChain = BaseChain<unknown[]> & {
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

// ADD: StringChain
type StringChain = BaseChain<string> & {
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

type AssumptionFn<T> = (() => boolean | void) &
  BaseChain<T> & {
    isNumber(msg?: string): AssumptionFn<number> & NumberChain;
    readonly inNumber: AssumptionFn<number> & NumberChain;

    isElement(msg?: string): AssumptionFn<any> & ElementChain;
    isString(msg?: string): AssumptionFn<string> & StringChain; // CHANGED
    isBoolean(msg?: string): AssumptionFn<boolean> & BaseChain<boolean>;
    isArray(msg?: string): AssumptionFn<unknown[]> & ArrayChain;
    isObject(msg?: string): AssumptionFn<Record<string, unknown>> & ObjectChain;
  };

function createAssumption<T>(value: T): AssumptionFn<T> {
  const queue: Check[] = [];

  const runAll = (): boolean => {
    for (const c of queue) c();
    return true;
  };

  const runner = function () {
    return runAll();
  } as AssumptionFn<T>;

  const add = (fn: Check) => {
    queue.push(fn);
  };

  const base: BaseChain<T> = {
    that(predicate: (v: T) => boolean, msg?: string) {
      add(() => {
        if (!predicate(value)) throw new Error(msg ?? "Assumption failed");
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
    run() {
      return runAll();
    },
    value() {
      return value;
    },
  };

  Object.assign(runner, base);

  const toNumberChain = (): AssumptionFn<number> & NumberChain => {
    const addNum = (fn: (v: number) => void) =>
      add(() => fn(value as unknown as number));
    const num: NumberChain = {
      ...(base as unknown as BaseChain<number>),
      greaterThan(n: number, msg?: string) {
        addNum((v) => {
          if (!(v > n)) throw new Error(msg ?? `Expected > ${n}`);
        });
        return runner as any;
      },
      greaterOrEqual(n: number, msg?: string) {
        addNum((v) => {
          if (!(v >= n)) throw new Error(msg ?? `Expected >= ${n}`);
        });
        return runner as any;
      },
      lessThan(n: number, msg?: string) {
        addNum((v) => {
          if (!(v < n)) throw new Error(msg ?? `Expected < ${n}`);
        });
        return runner as any;
      },
      lessOrEqual(n: number, msg?: string) {
        addNum((v) => {
          if (!(v <= n)) throw new Error(msg ?? `Expected <= ${n}`);
        });
        return runner as any;
      },
      between(min: number, max: number, msg?: string) {
        addNum((v) => {
          if (!(v >= min && v <= max))
            throw new Error(msg ?? `Expected between ${min} and ${max}`);
        });
        return runner as any;
      },
    };
    return Object.assign(runner as any, num);
  };

  const toElementChain = (): AssumptionFn<any> & ElementChain => {
    const addEl = (fn: (el: any) => void) => add(() => fn(value as any));
    const el: ElementChain = {
      ...(base as unknown as BaseChain<any>),
      hasChildren(msg?: string) {
        addEl((e) => {
          if (typeof Element === "undefined" || !(e instanceof Element))
            throw new Error("Expected Element");
          if ((e as Element).childElementCount === 0)
            throw new Error(
              msg ?? "Expected element to have at least one child element"
            );
        });
        return runner as any;
      },
      hasChild(msg?: string) {
        return (runner as any as ElementChain).hasChildren(msg);
      },
      hasChildMatching(selector: string, msg?: string) {
        addEl((e) => {
          if (typeof Element === "undefined" || !(e instanceof Element))
            throw new Error("Expected Element");
          if (!(e as Element).querySelector(selector))
            throw new Error(
              msg ?? `Expected child matching selector "${selector}"`
            );
        });
        return runner as any;
      },
      hasDescendant(selector: string, msg?: string) {
        addEl((e) => {
          if (typeof Element === "undefined" || !(e instanceof Element))
            throw new Error("Expected Element");
          if (!(e as Element).querySelector(selector))
            throw new Error(
              msg ?? `Expected descendant matching selector "${selector}"`
            );
        });
        return runner as any;
      },
      hasAttribute(name: string, msg?: string) {
        addEl((e) => {
          if (typeof Element === "undefined" || !(e instanceof Element))
            throw new Error("Expected Element");
          if (!(e as Element).hasAttribute(name))
            throw new Error(msg ?? `Expected attribute "${name}"`);
        });
        return runner as any;
      },
      attributeEquals(name: string, expected: string, msg?: string) {
        addEl((e) => {
          if (typeof Element === "undefined" || !(e instanceof Element))
            throw new Error("Expected Element");
          if ((e as Element).getAttribute(name) !== expected)
            throw new Error(
              msg ?? `Expected attribute "${name}" to equal "${expected}"`
            );
        });
        return runner as any;
      },
    };
    return Object.assign(runner as any, el);
  };

  const toArrayChain = (): AssumptionFn<unknown[]> & ArrayChain => {
    const addArr = (fn: (arr: unknown[]) => void) =>
      add(() => fn(value as unknown[]));
    const arr: ArrayChain = {
      ...(base as unknown as BaseChain<unknown[]>),
      hasLength(len: number, msg?: string) {
        addArr((a) => {
          if (a.length !== len)
            throw new Error(msg ?? `Expected array length ${len}`);
        });
        return runner as any;
      },
      notEmpty(msg?: string) {
        addArr((a) => {
          if (a.length === 0)
            throw new Error(msg ?? "Expected non-empty array");
        });
        return runner as any;
      },
      itemIsBoolean(index: number, msg?: string) {
        addArr((a) => {
          if (typeof a[index] !== "boolean")
            throw new Error(msg ?? `Expected boolean at index ${index}`);
        });
        return runner as any;
      },
      itemIsString(index: number, msg?: string) {
        addArr((a) => {
          if (typeof a[index] !== "string")
            throw new Error(msg ?? `Expected string at index ${index}`);
        });
        return runner as any;
      },
      itemIsNumber(index: number, msg?: string) {
        addArr((a) => {
          if (typeof a[index] !== "number")
            throw new Error(msg ?? `Expected number at index ${index}`);
        });
        return runner as any;
      },
      itemIsObject(index: number, msg?: string) {
        addArr((a) => {
          const v = a[index];
          if (typeof v !== "object" || v === null || Array.isArray(v))
            throw new Error(msg ?? `Expected object at index ${index}`);
        });
        return runner as any;
      },
    };
    return Object.assign(runner as any, arr);
  };

  // ADD: toStringChain
  const toStringChain = (): AssumptionFn<string> & StringChain => {
    const addStr = (fn: (s: string) => void) => add(() => fn(String(value)));
    const str: StringChain = {
      ...(base as unknown as BaseChain<string>),
      notEmpty(msg?: string) {
        addStr((s) => {
          if (s.length === 0)
            throw new Error(msg ?? "Expected non-empty string");
        });
        return runner as any;
      },
      hasLength(len: number, msg?: string) {
        addStr((s) => {
          if (s.length !== len)
            throw new Error(msg ?? `Expected length ${len}`);
        });
        return runner as any;
      },
      minLength(n: number, msg?: string) {
        addStr((s) => {
          if (s.length < n) throw new Error(msg ?? `Expected length >= ${n}`);
        });
        return runner as any;
      },
      maxLength(n: number, msg?: string) {
        addStr((s) => {
          if (s.length > n) throw new Error(msg ?? `Expected length <= ${n}`);
        });
        return runner as any;
      },
      lengthBetween(min: number, max: number, msg?: string) {
        addStr((s) => {
          if (s.length < min || s.length > max)
            throw new Error(msg ?? `Expected length between ${min} and ${max}`);
        });
        return runner as any;
      },
      contains(needle: string | RegExp, msg?: string) {
        addStr((s) => {
          const ok =
            typeof needle === "string" ? s.includes(needle) : needle.test(s);
          if (!ok)
            throw new Error(
              msg ?? `Expected string to contain ${String(needle)}`
            );
        });
        return runner as any;
      },
      startsWith(prefix: string, msg?: string) {
        addStr((s) => {
          if (!s.startsWith(prefix))
            throw new Error(msg ?? `Expected to start with "${prefix}"`);
        });
        return runner as any;
      },
      endsWith(suffix: string, msg?: string) {
        addStr((s) => {
          if (!s.endsWith(suffix))
            throw new Error(msg ?? `Expected to end with "${suffix}"`);
        });
        return runner as any;
      },
      matches(re: RegExp, msg?: string) {
        addStr((s) => {
          if (!re.test(s)) throw new Error(msg ?? `Expected to match ${re}`);
        });
        return runner as any;
      },
      equalsIgnoreCase(expected: string, msg?: string) {
        addStr((s) => {
          if (s.toLowerCase() !== expected.toLowerCase())
            throw new Error(msg ?? `Expected "${expected}" (case-insensitive)`);
        });
        return runner as any;
      },
      includesAny(...needles: string[]) {
        addStr((s) => {
          if (!needles.some((n) => s.includes(n)))
            throw new Error(
              `Expected to include any of [${needles.join(", ")}]`
            );
        });
        return runner as any;
      },
      includesAll(...needles: string[]) {
        addStr((s) => {
          if (!needles.every((n) => s.includes(n)))
            throw new Error(
              `Expected to include all of [${needles.join(", ")}]`
            );
        });
        return runner as any;
      },
      isJSON(msg?: string) {
        addStr((s) => {
          try {
            JSON.parse(s);
          } catch {
            throw new Error(msg ?? "Expected valid JSON");
          }
        });
        return runner as any;
      },
    };
    return Object.assign(runner as any, str);
  };

  // Type guards
  (runner as any).isString = (msg?: string) => {
    add(() => {
      if (typeof (value as any) !== "string")
        throw new Error(msg ?? "Expected string");
    });
    return toStringChain(); // CHANGED
  };
  return runner as any;
}

// Exported entry
export function assume<T>(value: T): AssumptionFn<T> {
  return createAssumption<T>(value);
}
export function that<T>(value: T): AssumptionFn<T> {
  return createAssumption<T>(value);
}
export function assertIsString(v: unknown, msg?: string): asserts v is string {
  assume(v).isString(msg)();
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
