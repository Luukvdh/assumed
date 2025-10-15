// ============================================================================
// CORE TYPES AND ACTIVE CODE
// ============================================================================

type TypeTag =
  | "unknown"
  | "string"
  | "number"
  | "array"
  | "object"
  | "element"
  | "datetime"
  | "boolean"
  | "null"
  | "undefined"
  | "present";
const typeTagArray = [
  "unknown",
  "string",
  "number",
  "array",
  "object",
  "element",
  "datetime",
  "boolean",
  "null",
  "undefined",
  "present",
];

/**
 * A zero-argument check function queued in a chain.
 */
export type Check = () => void;

// Helper type for instanceof narrowing:
type InferTypeTagFromConstructor<C extends new (...args: any[]) => any> =
  InstanceType<C> extends HTMLElement
    ? "element"
    : InstanceType<C> extends Element
      ? "element"
      : InstanceType<C> extends any[]
        ? "array"
        : InstanceType<C> extends string
          ? "string"
          : InstanceType<C> extends number
            ? "number"
            : InstanceType<C> extends boolean
              ? "boolean"
              : InstanceType<C> extends Record<string, any>
                ? "object"
                : "unknown";

/**
 * An entry in the chain queue, pairing the executable check with a type tag
 * (for potential introspection / debugging).
 */
export type ChainLink = {
  check: Check;
  type: TypeTag | "function" | "datetime";
  methodName?: string;
};

type GuardMethods<T, K extends TypeTag> = K extends "unknown"
  ? {
      isString(msg?: string): AssumptionFn<string, "string">;
      isNumber(msg?: string): AssumptionFn<number, "number">;
      isArray(msg?: string): AssumptionFn<unknown[], "array">;
      isObject(msg?: string): AssumptionFn<Record<string, unknown>, "object">;
      isElement(msg?: string): AssumptionFn<any, "element">;
      isDate(msg?: string): AssumptionFn<Date, "datetime">;
      isBoolean(msg?: string): AssumptionFn<boolean, "boolean">;
      isNull(msg?: string): AssumptionFn<null, "null">;
      isUndefined(msg?: string): AssumptionFn<undefined, "undefined">;

      // Fixed narrowing types:
      notNil(msg?: string): AssumptionFn<NonNullable<T>, "present">;
      notNull(msg?: string): AssumptionFn<Exclude<T, null>, "present">;
      notNullOrUndefined(msg?: string): AssumptionFn<NonNullable<T>, "present">;
    }
  : {};

// Helper type to detect TypeTag from TypeScript's inferred type
type DetectTypeTag<T> = T extends string
  ? "string"
  : T extends number
    ? "number"
    : T extends boolean
      ? "boolean"
      : T extends any[]
        ? "array"
        : T extends HTMLElement
          ? "element"
          : T extends Element
            ? "element"
            : T extends Record<string, any>
              ? "object"
              : T extends null
                ? "null"
                : T extends undefined
                  ? "undefined"
                  : "unknown";

interface BaseChain<T, K extends TypeTag> {
  that(predicate: (v: T) => boolean, msg?: string): AssumptionFn<T, K>;
  equals(expected: T, msg?: string): AssumptionFn<T, K>;

  // Enhanced instanceof with proper narrowing:
  instanceof(
    expectedOrMsg?: string | (new (...args: any[]) => any) | undefined,
    msg?: string | undefined
  ): AssumptionFn<T, DetectTypeTag<T>> | AssumptionFn<T, TypeTag> | void;

  value(): T;
  /** Run the queued checks and return the (narrowed) value if they pass. */
  commit(): T;
}

// Specialized chain types
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
  hasKeys(...keys: string[]): AssumptionFn<Record<string, unknown>, "object">;
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

// Date/Time specialized chain
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
          : K extends "datetime"
            ? DateTimeOnlyChain
            : {}; // other narrowed primitive kinds expose no extra methods

export type AssumptionFn<T, K extends TypeTag = "unknown"> = (() =>
  | boolean
  | void) &
  BaseChain<T, K> &
  GuardMethods<T, K> &
  Specialized<T, K>;

// --- Tiny event bus (browser/server safe) ---
export type Listener<T = any> = (payload?: T) => void;

export class AssumingBus extends EventTarget {
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

  public once<T = any>(event: string, fn: Listener<T>): () => void {
    const off = this.on<T>(event, (p) => {
      off();
      try {
        fn(p);
      } catch {}
    });
    return off;
  }

  public emit<T = any>(event: string, payload?: T): void {
    const set = this.map.get(event);
    if (!set) return;
    for (const fn of Array.from(set)) {
      try {
        fn(payload);
      } catch {}
    }
  }
  public addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean
  ): void {
    this.on(type, callback as Listener);
  }
  public dispatchEvent(event: Event): boolean {
    this.emit(event.type, event);
    return true;
  }
  public removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean
  ): void {
    this.off(type, callback as Listener);
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
  // Also track original values from chains for eitherOr
  const originalValues: unknown[] = [];
  const assumptions: Array<() => boolean | void> = args
    .filter(
      (a) => a != null && (typeof a === "function" || typeof a === "boolean")
    )
    .map((a) => {
      if (typeof a === "function") {
        // Try to extract value if this is an assumption chain
        try {
          const value = (a as any).value?.();
          if (value !== undefined) originalValues.push(value);
        } catch {
          // Ignore if value() doesn't exist
        }
        return a as () => boolean | void;
      }
      return () => a as boolean;
    });

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

  // Defer emitter logic until a terminal/return method is invoked
  // This places emission strictly between chain evaluation and consumer observation
  // Custom conditional emissions queued via api.emitOn(...)
  type QueuedEmit = {
    cond: () => boolean;
    event: string;
    data?: () => unknown;
  };
  const customEmits: QueuedEmit[] = [];
  let __emittedBetween = false;
  const ensureEmitted = () => {
    if (__emittedBetween) return;
    // Emit legacy names and new names for clarity
    assumingBus.emit(failed ? "assuming:fail" : "assuming:pass");
    assumingBus.emit(failed ? "assume:refuted" : "assume:vindicated");
    if (!failed && optionsRef.emit) {
      assumingBus.emit(optionsRef.emit);
    }
    // Process queued conditional emissions
    for (const qe of customEmits) {
      let shouldEmit = false;
      try {
        shouldEmit = !!qe.cond();
      } catch (e) {
        // Don't break overall flow if predicate throws
        console.error("emitOn predicate threw:", e);
      }
      if (shouldEmit) {
        let payload: unknown;
        try {
          payload = qe.data
            ? qe.data()
            : originalValues.length > 0
              ? originalValues[0]
              : undefined;
        } catch (e) {
          console.error("emitOn data producer threw:", e);
        }
        assumingBus.emit(qe.event, payload as any);
      }
    }
    __emittedBetween = true;
  };

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
    /** Emit when pass (vindicated). Sugar for emitOn(() => !failed, event, data) */
    emitOnPass(event: string, data?: unknown | (() => unknown)) {
      customEmits.push({
        cond: () => !failed,
        event,
        data:
          data === undefined
            ? () => (originalValues.length > 0 ? originalValues[0] : undefined)
            : typeof data === "function"
              ? (data as () => unknown)
              : () => data,
      });
      return api;
    },
    /** Emit when fail (refuted). Sugar for emitOn(() => failed, event, data) */
    emitOnFail(event: string, data?: unknown | (() => unknown)) {
      customEmits.push({
        cond: () => failed,
        event,
        data:
          data === undefined
            ? () => (originalValues.length > 0 ? originalValues[0] : undefined)
            : typeof data === "function"
              ? (data as () => unknown)
              : () => data,
      });
      return api;
    },
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
    emitOn(
      condition: boolean | (() => boolean),
      event: string,
      data?: unknown | (() => unknown)
    ) {
      const condFn: () => boolean =
        typeof condition === "function"
          ? (condition as () => boolean)
          : () => !!condition;
      const dataFn: (() => unknown) | undefined =
        data === undefined
          ? () => (originalValues.length > 0 ? originalValues[0] : undefined)
          : typeof data === "function"
            ? (data as () => unknown)
            : () => data;
      customEmits.push({ cond: condFn, event, data: dataFn });
      return api; // FLUENT
    },
    Run<R>(fn: () => R) {
      // Emit right before running user code, after chains completed
      ensureEmitted();
      if (!failed) lastResult = fn();
      return api; // FLUENT
    },
    // Optional accessor for the value produced by last Run/result
    value<T = unknown>(): T | undefined {
      ensureEmitted();
      return lastResult as T | undefined;
    },
    // Throwing asserts
    /** Throws if refuted; returns true if vindicated */
    isTrue(msg?: string): boolean | never {
      ensureEmitted();
      if (failed) {
        const m = buildMessage(msg);
        throw error instanceof Error ? error : new Error(m);
      }
      return true;
    },
    /** Throws if vindicated; returns true if refuted */
    isFalse(msg?: string): boolean | never {
      ensureEmitted();
      if (!failed) throw new Error(msg ?? "Expected assumptions to be refuted");
      return true;
    },
    // Boolean probes
    isVindicated(): boolean {
      //alias
      ensureEmitted();
      return !failed;
    },
    isRefuted(): boolean {
      //alias
      ensureEmitted();
      return failed;
    },
    // Fluent failure handler
    /** Run only when refuted; stores return as lastResult */
    onRefuted(fn: (err?: unknown) => unknown) {
      ensureEmitted();
      if (failed) lastResult = fn(error);
      return api; // FLUENT
    },
    /** Run only when vindicated; stores return as lastResult */
    onVindicated(fn: () => unknown) {
      ensureEmitted();
      if (!failed) lastResult = fn();
      return api; // FLUENT
    },
    // Promise-like alias
    catch(fn: (err: unknown) => unknown) {
      ensureEmitted();
      if (failed) lastResult = fn(error);
      return api; // FLUENT
    },
    /**
     * Either/Or fork with your original value as the asserter parameter.
     * Think: "String or Object? Red or Blue?" — write two small functions and we pass the same original value to either branch.
     * - either(original): assumptions passed → handle as one case (e.g., string → JSON.parse)
     * - or(original): failed without throwing → handle the alternative (e.g., already parsed → return as-is)
     * - neither(error): failed with an error → handle exception cases
     * Returns whatever your branch returns. Quiet mode is turned on automatically to avoid eager throws before branching.
     */
    eitherOr<R>(
      either: (value: unknown) => R,
      or?: (value: unknown) => R,
      neither?: (err?: unknown) => R
    ): R | undefined {
      // Ensure no eager throwing before we branch
      optionsRef.quiet = true; // Automatically disable eager throw for branching
      ensureEmitted();

      // Use the first original value we captured
      const originalValue =
        originalValues.length > 0 ? originalValues[0] : undefined;

      if (!failed) {
        // Either: assumptions passed, call with validated value
        return (lastResult = either(originalValue));
      }

      if (or && !error) {
        // Or: assumptions failed but didn't throw, call with original value
        return (lastResult = or(originalValue));
      }

      if (neither) {
        // Neither: assumptions threw error
        return (lastResult = neither(error));
      }

      return undefined;
    },

    // Branch helper (kept for convenience)
    result<R>(success: () => R, failure?: (err?: unknown) => R): R | undefined {
      ensureEmitted();
      if (!failed) return (lastResult = success());
      if (failure) return (lastResult = failure(error));
      return undefined;
    },
    /** Quick status accessor for testing and telemetry */
    status() {
      ensureEmitted();
      return { failed, error, lastResult } as const;
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
export function safeToAssume(...args: any[]): boolean {
  try {
    // If single argument that looks like an assumption chain/function
    if (args.length === 1 && typeof args[0] === "function") {
      // Single assumption chain: safeToAssume(that(x).isString())
      args[0](); // Execute the chain
      return true;
    } else {
      // Multiple assumptions: safeToAssume(cond1, cond2, that(x).isString())
      assuming(...args);
      return true;
    }
  } catch (e) {
    console.log(
      "Well... that assumption turned out to be unfounded:",
      (e as any).message
    );
    return false;
  }
}

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

export const captureLocation = (() => {
  const stack = new Error().stack;
  if (stack) {
    const lines = stack.split("\n");
    // Find first line that's not in assume.ts/assume.js
    const relevantLine = lines.find(
      (line) =>
        line.includes("at ") &&
        !line.includes("assume.js") &&
        !line.includes("assume.ts")
    );
    return relevantLine?.trim().replace("at ", "") || "unknown";
  }
  return undefined;
})();

export class AssumptionError extends Error {
  readonly name = "AssumptionError";
  readonly assumeStack: ChainLink[];
  readonly valuePreview?: string;
  readonly timestamp: number;
  readonly cause: unknown;
  readonly chainTrace: string[]; // NEW: readable chain trace
  readonly captureLocation?: string; // NEW: where the chain was created

  constructor(
    message: string,
    opts: {
      stack: ChainLink[];
      value?: unknown;
      cause?: unknown;
      chainTrace?: string[];
      captureLocation?: string;
    }
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.assumeStack = opts.stack;
    this.valuePreview = previewValue(opts.value);
    this.timestamp = Date.now();
    this.cause = opts.cause;
    this.chainTrace = opts.chainTrace || [];
    this.captureLocation = opts.captureLocation;

    // Enhanced error message with context
    this.message = this.buildRichMessage(message);
  }

  private buildRichMessage(originalMessage: string): string {
    const parts = [`AssumptionError: ${originalMessage}`];

    if (this.valuePreview) {
      parts.push(`Value: ${this.valuePreview}`);
    }

    if (this.chainTrace.length > 0) {
      parts.push(`Chain: ${this.chainTrace.join(" → ")}`);
    }

    if (this.captureLocation) {
      parts.push(`Created at: ${this.captureLocation}`);
    }

    return parts.join("\n  ");
  }
}

export function isAssumptionError(err: unknown): err is AssumptionError {
  return (
    !!err && typeof err === "object" && (err as any).name === "AssumptionError"
  );
}

function formatAssumptionError(err: AssumptionError): string {
  const parts = [
    `🔴 ${err.message}`,
    `📊 Value: ${err.valuePreview || "unknown"}`,
  ];

  if (err.chainTrace.length > 0) {
    parts.push(`🔗 Chain: ${err.chainTrace.join(" → ")}`);
  }

  if (err.captureLocation) {
    parts.push(`📍 Origin: ${err.captureLocation}`);
  }

  // Show recent history for context
  const recentHistory = getAssumeHistory().slice(-3);
  if (recentHistory.length > 0) {
    parts.push(
      `📜 Recent: ${recentHistory.map((ev) => `${ev.kind}${JSON.stringify(ev as AssumeEvent) || ""}`).join(" → ")}`
    );
  }

  return parts.join("\n   ");
}

function createAssumption<T>(value: T): AssumptionFn<T, "unknown"> {
  const queue: ChainLink[] = [];
  const chainTrace: string[] = []; // Track method calls
  // Capture where the chain was created (per-chain, not module-level)
  const creationLocation = (() => {
    try {
      const stack = new Error().stack;
      if (stack) {
        const lines = stack.split("\n");
        const relevantLine = lines.find(
          (line) =>
            line.includes("at ") &&
            !line.includes("assume.js") &&
            !line.includes("assume.ts")
        );
        return relevantLine?.trim().replace("at ", "") || "unknown";
      }
    } catch {}
    return undefined;
  })();

  // Capture where the chain was created
  pushAssumeEvent({
    t: Date.now(),
    kind: "start",
    info: { valuePreview: previewValue(value) },
  });

  const runAll = (): boolean => {
    try {
      for (const c of queue) c.check();
      pushAssumeEvent({ t: Date.now(), kind: "vindicated" });
      return true;
    } catch (e) {
      // Don't throw - just return false to indicate failure
      pushAssumeEvent({
        t: Date.now(),
        kind: "refuted",
        info: { message: String(e) },
      });
      return false;
    }
  };

  const runner = function () {
    return runAll();
  } as AssumptionFn<T, "unknown">;

  function getTypeName(val: unknown): string {
    if (val === null) return "null";
    if (Array.isArray(val)) return "Array";
    if (typeof val === "object")
      return (val as any).constructor?.name || "Object";
    return typeof val;
  }

  // Simplify the add function to use getTypeName:
  const add = (
    fn: Check,
    type: ChainLink["type"] = "unknown",
    methodName?: string
  ) => {
    // Add to readable trace using detected type
    if (methodName) {
      const detectedType = getTypeName(value);
      chainTrace.push(`${detectedType}.${methodName}`);
    }

    const wrapped: Check = () => {
      try {
        fn();
        pushAssumeEvent({
          t: Date.now(),
          kind: "check",
          info: { type, op: methodName },
        });
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
            chainTrace: chainTrace.slice(),
            captureLocation: creationLocation,
          }
        );

        // 📰 IMMEDIATE BULLETIN (no setImmediate)
        console.log("📰 ASSUMPTION ERROR:", err.message);

        pushAssumeEvent({
          t: Date.now(),
          kind: "refuted",
          info: { message: err.message },
        });
        throw err;
      }
    };

    queue.push({ check: wrapped, type, methodName } as ChainLink);
  };

  const base: BaseChain<T, any> = {
    that(predicate: (v: T) => boolean, msg?: string) {
      add(
        () => {
          if (!predicate(value)) throw new Error(msg ?? "Assumption failed");
        },
        "unknown",
        "that"
      );
      return runner as any;
    },
    instanceof(
      expectedOrMsg?: string | (new (...args: any[]) => any),
      msg?: string
    ): AssumptionFn<T, DetectTypeTag<T>> | AssumptionFn<T, TypeTag> | void {
      // Detect if first param is a constructor or message
      const isConstructorProvided = typeof expectedOrMsg === "function";
      const actualMsg = isConstructorProvided ? msg : (expectedOrMsg as string);

      if (isConstructorProvided) {
        // With constructor - check instanceof and use smart TypeTag detection
        const expected = expectedOrMsg as new (...args: any[]) => any;
        add(
          () => {
            if (!(value instanceof expected))
              throw new Error(
                actualMsg ??
                  "Assumption failed: value is not instance of expected"
              );
          },
          // Smart TypeTag detection from your typeTagArray lookup
          (typeTagArray.find((x) => x === getTypeName(value)) ||
            typeTagArray.find((x) => x === typeof value) ||
            "unknown") as TypeTag,
          `instanceof(${expected.name || "Constructor"})`
        );
        return runner as any;
      } else {
        // Empty instanceof - confidence check, detect current type
        add(
          () => {
            // Just verify it's some kind of constructor instance
            if (typeof value !== "object" || value === null) {
              throw new Error(actualMsg ?? "Expected constructor instance");
            }
          },
          // Smart TypeTag detection using your existing logic
          (typeTagArray.find((x) => x === getTypeName(value)) ||
            typeTagArray.find((x) => x === typeof value) ||
            "unknown") as TypeTag,
          `instanceof('base')`
        );
        return runner as any;
      }
    },
    equals(expected: T, msg?: string) {
      add(
        () => {
          if ((value as any) !== expected)
            throw new Error(msg ?? "Assumption failed: value !== expected");
        },
        "unknown",
        `equals(${JSON.stringify(expected)})`
      );
      return runner as any;
    },
    value() {
      return value;
    },
    commit() {
      // Execute queued checks (without throwing when we return false inside runAll)
      // We want commit to throw on failure, so call the runner and if false, simulate failure throw.
      const ok = runner();
      if (!ok) {
        throw new Error("Assumption failed on commit()");
      }
      return value;
    },
  };

  Object.assign(runner, base);

  // Chain builders for each specialized type
  const toNumberChain = (): AssumptionFn<number, "number"> =>
    Object.assign(runner as any, {
      greaterThan(n: number, msg?: string) {
        add(
          () => {
            if (!((value as any) > n))
              throw new Error(msg ?? `Expected > ${n}`);
          },
          "number",
          `greaterThan(${n})`
        );
        return runner as any;
      },
      greaterOrEqual(n: number, msg?: string) {
        add(
          () => {
            if (!((value as any) >= n))
              throw new Error(msg ?? `Expected >= ${n}`);
          },
          "number",
          `greaterOrEqual(${n})`
        );
        return runner as any;
      },
      lessThan(n: number, msg?: string) {
        add(
          () => {
            if (!((value as any) < n))
              throw new Error(msg ?? `Expected < ${n}`);
          },
          "number",
          `lessThan(${n})`
        );
        return runner as any;
      },
      lessOrEqual(n: number, msg?: string) {
        add(
          () => {
            if (!((value as any) <= n))
              throw new Error(msg ?? `Expected <= ${n}`);
          },
          "number",
          `lessOrEqual(${n})`
        );
        return runner as any;
      },
      between(min: number, max: number, msg?: string) {
        add(
          () => {
            const v = value as any;
            if (!(v >= min && v <= max))
              throw new Error(msg ?? `Expected between ${min} and ${max}`);
          },
          "number",
          `between(${min},${max})`
        );
        return runner as any;
      },
    } satisfies NumberOnlyChain);

  const toStringChain = (): AssumptionFn<string, "string"> =>
    Object.assign(runner as any, {
      notEmpty(msg?: string) {
        add(
          () => {
            if (String(value).length === 0)
              throw new Error(msg ?? "Expected non-empty string");
          },
          "string",
          "notEmpty"
        );
        return runner as any;
      },
      hasLength(len: number, msg?: string) {
        add(
          () => {
            if (String(value).length !== len)
              throw new Error(msg ?? `Expected length ${len}`);
          },
          "string",
          `hasLength(${len})`
        );
        return runner as any;
      },
      minLength(n: number, msg?: string) {
        add(
          () => {
            if (String(value).length < n)
              throw new Error(msg ?? `Expected length >= ${n}`);
          },
          "string",
          `minLength(${n})`
        );
        return runner as any;
      },
      maxLength(n: number, msg?: string) {
        add(
          () => {
            if (String(value).length > n)
              throw new Error(msg ?? `Expected length <= ${n}`);
          },
          "string",
          `maxLength(${n})`
        );
        return runner as any;
      },
      lengthBetween(min: number, max: number, msg?: string) {
        add(
          () => {
            const l = String(value).length;
            if (l < min || l > max)
              throw new Error(
                msg ?? `Expected length between ${min} and ${max}`
              );
          },
          "string",
          `lengthBetween(${min},${max})`
        );
        return runner as any;
      },
      contains(needle: string | RegExp, msg?: string) {
        add(
          () => {
            const s = String(value);
            const ok =
              typeof needle === "string" ? s.includes(needle) : needle.test(s);
            if (!ok)
              throw new Error(msg ?? `Expected to contain ${String(needle)}`);
          },
          "string",
          `contains(${typeof needle === "string" ? `"${needle}"` : needle.toString()})`
        );
        return runner as any;
      },
      startsWith(prefix: string, msg?: string) {
        add(
          () => {
            if (!String(value).startsWith(prefix))
              throw new Error(msg ?? `Expected to start with "${prefix}"`);
          },
          "string",
          `startsWith("${prefix}")`
        );
        return runner as any;
      },
      endsWith(suffix: string, msg?: string) {
        add(
          () => {
            if (!String(value).endsWith(suffix))
              throw new Error(msg ?? `Expected to end with "${suffix}"`);
          },
          "string",
          `endsWith("${suffix}")`
        );
        return runner as any;
      },
      matches(re: RegExp, msg?: string) {
        add(
          () => {
            if (!re.test(String(value)))
              throw new Error(msg ?? `Expected to match ${re}`);
          },
          "string",
          `matches(${re.toString()})`
        );
        return runner as any;
      },
      equalsIgnoreCase(expected: string, msg?: string) {
        add(
          () => {
            if (String(value).toLowerCase() !== expected.toLowerCase())
              throw new Error(
                msg ?? `Expected "${expected}" (case-insensitive)`
              );
          },
          "string",
          `equalsIgnoreCase("${expected}")`
        );
        return runner as any;
      },
      includesAny(...needles: string[]) {
        add(
          () => {
            const s = String(value);
            if (!needles.some((n) => s.includes(n)))
              throw new Error(`Expected any of [${needles.join(", ")}]`);
          },
          "string",
          `includesAny(${needles.map((n) => `"${n}"`).join(",")})`
        );
        return runner as any;
      },
      includesAll(...needles: string[]) {
        add(
          () => {
            const s = String(value);
            if (!needles.every((n) => s.includes(n)))
              throw new Error(`Expected all of [${needles.join(", ")}]`);
          },
          "string",
          `includesAll(${needles.map((n) => `"${n}"`).join(",")})`
        );
        return runner as any;
      },
      isJSON(msg?: string) {
        add(
          () => {
            try {
              JSON.parse(String(value));
            } catch {
              throw new Error(msg ?? "Expected valid JSON");
            }
          },
          "string",
          "isJSON"
        );
        return runner as any;
      },
    } satisfies StringOnlyChain);

  const toArrayChain = (): AssumptionFn<unknown[], "array"> =>
    Object.assign(runner as any, {
      hasLength(len: number, msg?: string) {
        add(
          () => {
            if ((value as any[]).length !== len)
              throw new Error(msg ?? `Expected array length ${len}`);
          },
          "array",
          `hasLength(${len})`
        );
        return runner as any;
      },
      notEmpty(msg?: string) {
        add(
          () => {
            if ((value as any[]).length === 0)
              throw new Error(msg ?? "Expected non-empty array");
          },
          "array",
          "notEmpty"
        );
        return runner as any;
      },
      itemIsBoolean(i: number, msg?: string) {
        add(
          () => {
            if (typeof (value as any[])[i] !== "boolean")
              throw new Error(msg ?? `Expected boolean at ${i}`);
          },
          "array",
          `itemIsBoolean(${i})`
        );
        return runner as any;
      },
      itemIsString(i: number, msg?: string) {
        add(
          () => {
            if (typeof (value as any[])[i] !== "string")
              throw new Error(msg ?? `Expected string at ${i}`);
          },
          "array",
          `itemIsString(${i})`
        );
        return runner as any;
      },
      itemIsNumber(i: number, msg?: string) {
        add(
          () => {
            if (typeof (value as any[])[i] !== "number")
              throw new Error(msg ?? `Expected number at ${i}`);
          },
          "array",
          `itemIsNumber(${i})`
        );
        return runner as any;
      },
      itemIsObject(i: number, msg?: string) {
        add(
          () => {
            const v = (value as any[])[i];
            if (typeof v !== "object" || v === null || Array.isArray(v))
              throw new Error(msg ?? `Expected object at ${i}`);
          },
          "array",
          `itemIsObject(${i})`
        );
        return runner as any;
      },
      includesString(needle: string, msg?: string) {
        add(
          () => {
            if (!(value as any[]).some((item) => String(item).includes(needle)))
              throw new Error(msg ?? `Expected string including "${needle}"`);
          },
          "array",
          `includesString("${needle}")`
        );
        return runner as any;
      },
      includesNumber(needle: number, msg?: string) {
        add(
          () => {
            if (!(value as any[]).some((item) => item === needle))
              throw new Error(msg ?? `Expected number including "${needle}"`);
          },
          "array",
          `includesNumber(${needle})`
        );
        return runner as any;
      },
      includesObject(needle: Record<string, unknown>, msg?: string) {
        add(
          () => {
            if (
              !(value as any[]).some(
                (item) => JSON.stringify(item) === JSON.stringify(needle)
              )
            )
              throw new Error(
                msg ?? `Expected object including "${JSON.stringify(needle)}"`
              );
          },
          "array",
          `includesObject(${JSON.stringify(needle)})`
        );
        return runner as any;
      },
      onlyHasObjects(msg?: string) {
        add(
          () => {
            if (
              !(value as any[]).every(
                (item) =>
                  typeof item === "object" &&
                  item !== null &&
                  !Array.isArray(item)
              )
            )
              throw new Error(msg ?? "Expected all objects");
          },
          "array",
          "onlyHasObjects"
        );
        return runner as any;
      },
      onlyHasStrings(msg?: string) {
        add(
          () => {
            if (!(value as any[]).every((item) => typeof item === "string"))
              throw new Error(msg ?? "Expected all strings");
          },
          "array",
          "onlyHasStrings"
        );
        return runner as any;
      },
      onlyHasNumbers(msg?: string) {
        add(
          () => {
            if (!(value as any[]).every((item) => typeof item === "number"))
              throw new Error(msg ?? "Expected all numbers");
          },
          "array",
          "onlyHasNumbers"
        );
        return runner as any;
      },
      everyIsFalsy(msg?: string) {
        add(
          () => {
            if (!(value as any[]).every((item) => !item))
              throw new Error(msg ?? "Expected all falsy");
          },
          "array",
          "everyIsFalsy"
        );
        return runner as any;
      },
      everyIsTruthy(msg?: string) {
        add(
          () => {
            if (!(value as any[]).every((item) => !!item))
              throw new Error(msg ?? "Expected all truthy");
          },
          "array",
          "everyIsTruthy"
        );
        return runner as any;
      },
      includesCondition(needle: (item: unknown) => boolean, msg?: string) {
        add(
          () => {
            if (!(value as any[]).some(needle))
              throw new Error(msg ?? "Expected array to include condition");
          },
          "array",
          "includesCondition"
        );
        return runner as any;
      },
    } satisfies ArrayOnlyChain);

  const toObjectChain = (): AssumptionFn<Record<string, unknown>, "object"> =>
    Object.assign(runner as any, {
      hasKey(key: string, msg?: string) {
        add(
          () => {
            if (!(key in (value as any)))
              throw new Error(msg ?? `Expected key "${key}"`);
          },
          "object",
          `hasKey("${key}")`
        );
        return runner as any;
      },
      hasKeys(...keys: string[]) {
        add(
          () => {
            for (const k of keys)
              if (!(k in (value as any)))
                throw new Error(`Expected key "${k}"`);
          },
          "object",
          `hasKeys(${keys.map((k) => `"${k}"`).join(",")})`
        );
        return runner as any;
      },
      keyEquals(key: string, expected: unknown, msg?: string) {
        add(
          () => {
            if ((value as any)[key] !== expected)
              throw new Error(msg ?? `Expected ${key} === ${String(expected)}`);
          },
          "object",
          `keyEquals("${key}",${JSON.stringify(expected)})`
        );
        return runner as any;
      },
      sameKeys(expected: Record<string, unknown>, msg?: string) {
        add(
          () => {
            const a = Object.keys(value as any);
            const b = Object.keys(expected);
            if (a.length !== b.length)
              throw new Error(msg ?? "Key count mismatch");
            for (const k of b)
              if (!(k in (value as any)))
                throw new Error(msg ?? `Missing key "${k}"`);
          },
          "object",
          "sameKeys"
        );
        return runner as any;
      },
      allKeysFalsy(msg?: string) {
        add(
          () => {
            for (const k in value as any)
              if ((value as any)[k])
                throw new Error(msg ?? `Key "${k}" not falsy`);
          },
          "object",
          "allKeysFalsy"
        );
        return runner as any;
      },
      allKeysSet(msg?: string) {
        add(
          () => {
            for (const k in value as any)
              if ((value as any)[k] === undefined)
                throw new Error(msg ?? `Key "${k}" unset`);
          },
          "object",
          "allKeysSet"
        );
        return runner as any;
      },
      anyKeyNull(msg?: string) {
        add(
          () => {
            let f = false;
            for (const k in value as any)
              if ((value as any)[k] === null) {
                f = true;
                break;
              }
            if (!f) throw new Error(msg ?? "No null key");
          },
          "object",
          "anyKeyNull"
        );
        return runner as any;
      },
    } satisfies ObjectOnlyChain);

  const toElementChain = (): AssumptionFn<any, "element"> =>
    Object.assign(runner as any, {
      hasChildren(msg?: string) {
        add(
          () => {
            const e = value as any;
            if (
              typeof Element === "undefined" ||
              !(e instanceof Element) ||
              e.childElementCount === 0
            )
              throw new Error(msg ?? "Expected child elements");
          },
          "element",
          "hasChildren"
        );
        return runner as any;
      },
      hasChild(msg?: string) {
        add(
          () => {
            const e = value as any;
            if (
              typeof Element === "undefined" ||
              !(e instanceof Element) ||
              e.childElementCount === 0
            )
              throw new Error(msg ?? "Expected child elements");
          },
          "element",
          "hasChild"
        );
        return runner as any;
      },
      hasChildMatching(sel: string, msg?: string) {
        add(
          () => {
            const e = value as any;
            if (
              typeof Element === "undefined" ||
              !(e instanceof Element) ||
              !e.querySelector(sel)
            )
              throw new Error(msg ?? `Missing child "${sel}"`);
          },
          "element",
          `hasChildMatching("${sel}")`
        );
        return runner as any;
      },
      hasDescendant(sel: string, msg?: string) {
        add(
          () => {
            const e = value as any;
            if (
              typeof Element === "undefined" ||
              !(e instanceof Element) ||
              !e.querySelector(sel)
            )
              throw new Error(msg ?? `Missing descendant "${sel}"`);
          },
          "element",
          `hasDescendant("${sel}")`
        );
        return runner as any;
      },
      hasAttribute(name: string, msg?: string) {
        add(
          () => {
            const e = value as any;
            if (
              typeof Element === "undefined" ||
              !(e instanceof Element) ||
              !e.hasAttribute(name)
            )
              throw new Error(msg ?? `Missing attribute "${name}"`);
          },
          "element",
          `hasAttribute("${name}")`
        );
        return runner as any;
      },
      attributeEquals(name: string, expected: string, msg?: string) {
        add(
          () => {
            const e = value as any;
            if (
              typeof Element === "undefined" ||
              !(e instanceof Element) ||
              e.getAttribute(name) !== expected
            )
              throw new Error(msg ?? `Attr "${name}" != "${expected}"`);
          },
          "element",
          `attributeEquals("${name}","${expected}")`
        );
        return runner as any;
      },
    } satisfies ElementOnlyChain);

  // Type guards (only on unknown)
  (runner as any).isNumber = (msg?: string) => {
    add(
      () => {
        if (typeof value !== "number")
          throw new Error(msg ?? "Expected number");
      },
      "number",
      "isNumber"
    );
    return toNumberChain();
  };

  (runner as any).isString = (msg?: string) => {
    add(
      () => {
        if (typeof value !== "string")
          throw new Error(msg ?? "Expected string");
      },
      "string",
      "isString"
    );
    return toStringChain();
  };

  (runner as any).isArray = (msg?: string) => {
    add(
      () => {
        if (!Array.isArray(value)) throw new Error(msg ?? "Expected array");
      },
      "array",
      "isArray"
    );
    return toArrayChain();
  };

  (runner as any).isObject = (msg?: string) => {
    add(
      () => {
        if (typeof value !== "object" || value === null || Array.isArray(value))
          throw new Error(msg ?? "Expected object");
      },
      "object",
      "isObject"
    );
    return toObjectChain();
  };

  (runner as any).isElement = (msg?: string) => {
    add(
      () => {
        if (
          typeof Element === "undefined" ||
          !((value as any) instanceof Element)
        )
          throw new Error(msg ?? "Expected Element");
      },
      "element",
      "isElement"
    );
    return toElementChain();
  };

  // Date guard and chain
  (runner as any).isDate = (msg?: string) => {
    add(
      () => {
        if (!(value instanceof Date))
          throw new Error(msg ?? "Expected Date instance");
      },
      "datetime",
      "isDate"
    );
    return toDateChain();
  };

  (runner as any).isBoolean = (msg?: string) => {
    add(
      () => {
        if (typeof value !== "boolean")
          throw new Error(msg ?? "Expected boolean");
      },
      "boolean",
      "isBoolean"
    );
    return runner as AssumptionFn<boolean, "boolean">;
  };

  // Nullish guards producing terminal states
  (runner as any).isNull = (msg?: string) => {
    add(
      () => {
        if (value !== null) throw new Error(msg ?? "Expected null");
      },
      "null",
      "isNull"
    );
    return runner as AssumptionFn<null, "null">;
  };

  (runner as any).isUndefined = (msg?: string) => {
    add(
      () => {
        if (value !== undefined) throw new Error(msg ?? "Expected undefined");
      },
      "undefined",
      "isUndefined"
    );
    return runner as AssumptionFn<undefined, "undefined">;
  };

  // Non‑nullish guards that KEEP other type guards (move to 'present')
  (runner as any).notNil = (msg?: string) => {
    add(
      () => {
        if (value === null || value === undefined)
          throw new Error(msg ?? "Expected value (not null/undefined)");
      },
      "present",
      "notNil"
    );
    return runner as AssumptionFn<NonNullable<T>, "present">;
  };

  (runner as any).notNull = (msg?: string) => {
    add(
      () => {
        if (value === null) throw new Error(msg ?? "Expected not null");
      },
      "present",
      "notNull"
    );
    return runner as AssumptionFn<Exclude<T, null>, "present">;
  };

  (runner as any).notNullOrUndefined = (msg?: string) => {
    add(
      () => {
        if (value === null || value === undefined)
          throw new Error(msg ?? "Expected value (not null/undefined)");
      },
      "present",
      "notNullOrUndefined"
    );
    return runner as AssumptionFn<Exclude<T, null | undefined>, "present">;
  };

  return runner as AssumptionFn<T, "unknown">;

  // Local builders
  function toDateChain(): AssumptionFn<Date, "datetime"> {
    return Object.assign(runner as any, {
      earlier(than: Date | number, msg?: string) {
        add(
          () => {
            const v = (value as unknown as Date).getTime();
            const t = typeof than === "number" ? than : than.getTime();
            if (!(v < t))
              throw new Error(
                msg ?? `Expected earlier than ${new Date(t).toISOString()}`
              );
          },
          "datetime",
          `earlier(${typeof than === "number" ? than : (than as Date).toISOString()})`
        );
        return runner as any;
      },
      later(than: Date | number, msg?: string) {
        add(
          () => {
            const v = (value as unknown as Date).getTime();
            const t = typeof than === "number" ? than : than.getTime();
            if (!(v > t))
              throw new Error(
                msg ?? `Expected later than ${new Date(t).toISOString()}`
              );
          },
          "datetime",
          `later(${typeof than === "number" ? than : (than as Date).toISOString()})`
        );
        return runner as any;
      },
      isYear(year: number, msg?: string) {
        add(
          () => {
            const y = (value as unknown as Date).getFullYear();
            if (y !== year) throw new Error(msg ?? `Expected year ${year}`);
          },
          "datetime",
          `isYear(${year})`
        );
        return runner as any;
      },
      wasBefore(than: Date | number, msg?: string) {
        add(
          () => {
            const v = (value as unknown as Date).getTime();
            const t = typeof than === "number" ? than : than.getTime();
            if (!(v < t))
              throw new Error(
                msg ?? `Expected before ${new Date(t).toISOString()}`
              );
          },
          "datetime",
          `wasBefore(${typeof than === "number" ? than : (than as Date).toISOString()})`
        );
        return runner as any;
      },
      daysAgoExceeds(n: number, msg?: string) {
        add(
          () => {
            const now = Date.now();
            const then = (value as unknown as Date).getTime();
            const days = (now - then) / (1000 * 60 * 60 * 24);
            if (!(days > n))
              throw new Error(msg ?? `Expected more than ${n} days ago`);
          },
          "datetime",
          `daysAgoExceeds(${n})`
        );
        return runner as any;
      },
      daysSinceAtLeast(n: number, msg?: string) {
        add(
          () => {
            const now = Date.now();
            const then = (value as unknown as Date).getTime();
            const days = (now - then) / (1000 * 60 * 60 * 24);
            if (!(days >= n))
              throw new Error(msg ?? `Expected at least ${n} days since`);
          },
          "datetime",
          `daysSinceAtLeast(${n})`
        );
        return runner as any;
      },
    }) as AssumptionFn<Date, "datetime">;
  }
}

// Main exported functions
export function that<T>(value: T): AssumptionFn<T, "unknown"> {
  return createAssumption<T>(value);
}

export function assume<T>(value: T): AssumptionFn<T, "unknown"> {
  return createAssumption<T>(value);
}

// History management
export function getAssumeHistory(): ReadonlyArray<AssumeEvent> {
  return ASSUME_HISTORY.slice();
}

export function clearAssumeHistory(): void {
  ASSUME_HISTORY.length = 0;
}

export function setAssumeHistoryLimit(n: number): void {
  ASSUME_HISTORY_LIMIT = Math.max(0, n | 0);
}

// Helper functions for error handling
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
    console.error(err);
    enrichWithHandlerName(err, defRefHandler);
    if (log) (typeof log === "function" ? log : console.error)(err);

    // Always return default - don't re-throw
    return def;
  };
}

export function defRefHandlerAsync<R>(
  def: R,
  log: ((err: unknown) => void) | boolean = false
) {
  return async (err: unknown) => {
    enrichWithHandlerName(err, defRefHandlerAsync);
    console.error(err);
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

// ============================================================================
// MINIMAL ASSERT HELPERS (alongside fluent chains)
// ----------------------------------------------------------------------------
// These helpers provide TypeScript `asserts`-style narrowing with minimal
// runtime work by reusing the fluent chain checks. They throw if the
// assumption fails; otherwise they are no-ops.
// ----------------------------------------------------------------------------

/** @internal Asserts the value is a string at runtime and for TypeScript. */
export function assertIsString(v: unknown, msg?: string): asserts v is string {
  // Will throw on failure; no-op on success
  assuming(that(v).isString(), msg);
}

/** @internal Asserts the value is a number at runtime and for TypeScript. */
export function assertIsNumber(v: unknown, msg?: string): asserts v is number {
  assuming(that(v).isNumber(), msg);
}

/** @internal Asserts the value is an array at runtime and for TypeScript. */
export function assertIsArray(
  v: unknown,
  msg?: string
): asserts v is unknown[] {
  assuming(that(v).isArray(), msg);
}

/** @internal Asserts the value is a plain object (non-null, non-array). */
export function assertIsObject(
  v: unknown,
  msg?: string
): asserts v is Record<string, unknown> {
  assuming(that(v).isObject(), msg);
}

/** @internal Asserts the value is a DOM Element. */
export function assertIsElement(
  v: unknown,
  msg?: string
): asserts v is Element {
  assuming(that(v).isElement(), msg);
}

/** @internal Asserts the value is a boolean. */
export function assertIsBoolean(
  v: unknown,
  msg?: string
): asserts v is boolean {
  assuming(that(v).isBoolean(), msg);
}

/** @internal Asserts the value is a Date instance. */
export function assertIsDate(v: unknown, msg?: string): asserts v is Date {
  assuming(that(v).isDate(), msg);
}

/** @internal Asserts the value is null. Useful for explicit null checks. */
export function assertIsNull(v: unknown, msg?: string): asserts v is null {
  assuming(that(v).isNull(), msg);
}

/** @internal Asserts the value is not null. */
export function assertNotNull<T>(
  v: T,
  msg?: string
): asserts v is Exclude<T, null> {
  assuming(that(v).notNull(), msg);
}

/** @internal Asserts the value is undefined. */
export function assertIsUndefined(
  v: unknown,
  msg?: string
): asserts v is undefined {
  assuming(that(v).isUndefined(), msg);
}

/** @internal Asserts the value is not undefined. */
export function assertNotUndefined<T>(
  v: T,
  msg?: string
): asserts v is Exclude<T, undefined> {
  // We reuse notNullOrUndefined to keep behavior consistent
  assuming(that(v).notNullOrUndefined(), msg);
}

/** @internal Asserts the value is neither null nor undefined. */
export function assertNotNullOrUndefined<T>(
  v: T,
  msg?: string
): asserts v is NonNullable<T> {
  assuming(that(v).notNullOrUndefined(), msg);
}

/** @internal Asserts the code path is unreachable (useful for exhaustive switches). */
export function assertNever(x: never, msg?: string): never {
  throw new Error(msg ?? `Unexpected value: ${String(x)}`);
}

// PascalCase aliases for ergonomic use where preferred
export const IsString = assertIsString;
export const IsNumber = assertIsNumber;
export const IsArray = assertIsArray;
export const IsObject = assertIsObject;
export const IsElement = assertIsElement;
export const IsBoolean = assertIsBoolean;
export const IsDate = assertIsDate;
export const IsNull = assertIsNull;
export const NotNull = assertNotNull;
export const IsUndefined = assertIsUndefined;
export const NotUndefined = assertNotUndefined;
export const NotNullOrUndefined = assertNotNullOrUndefined;

// Themed public-facing aliases (avoid "assert" in userland API)
export const assureString = assertIsString;
export const assureNumber = assertIsNumber;
export const assureArray = assertIsArray;
export const assureObject = assertIsObject;
export const assureElement = assertIsElement;
export const assureBoolean = assertIsBoolean;
export const assureDate = assertIsDate;
export const assureNull = assertIsNull;
export const assureNotNull = assertNotNull;
export const assureUndefined = assertIsUndefined;
export const assureNotUndefined = assertNotUndefined;
export const assurePresent = assertNotNullOrUndefined;

// ----------------------------------------------------------------------------
// Targeted string helpers
// ----------------------------------------------------------------------------

export function assertStringNotEmpty(
  v: unknown,
  msg?: string
): asserts v is string {
  assuming(that(v).isString().notEmpty(), msg);
}
export function assertStringHasLength(
  v: unknown,
  len: number,
  msg?: string
): asserts v is string {
  assuming(that(v).isString().hasLength(len), msg);
}
export function assertStringMinLength(
  v: unknown,
  n: number,
  msg?: string
): asserts v is string {
  assuming(that(v).isString().minLength(n), msg);
}
export function assertStringMaxLength(
  v: unknown,
  n: number,
  msg?: string
): asserts v is string {
  assuming(that(v).isString().maxLength(n), msg);
}
export function assertStringLengthBetween(
  v: unknown,
  min: number,
  max: number,
  msg?: string
): asserts v is string {
  assuming(that(v).isString().lengthBetween(min, max), msg);
}
export function assertStringContains(
  v: unknown,
  needle: string | RegExp,
  msg?: string
): asserts v is string {
  assuming(that(v).isString().contains(needle), msg);
}
export function assertStringStartsWith(
  v: unknown,
  prefix: string,
  msg?: string
): asserts v is string {
  assuming(that(v).isString().startsWith(prefix), msg);
}
export function assertStringEndsWith(
  v: unknown,
  suffix: string,
  msg?: string
): asserts v is string {
  assuming(that(v).isString().endsWith(suffix), msg);
}
export function assertStringMatches(
  v: unknown,
  re: RegExp,
  msg?: string
): asserts v is string {
  assuming(that(v).isString().matches(re), msg);
}
export function assertStringEqualsIgnoreCase(
  v: unknown,
  expected: string,
  msg?: string
): asserts v is string {
  assuming(that(v).isString().equalsIgnoreCase(expected), msg);
}
export function assertStringIncludesAny(
  v: unknown,
  needles: string[],
  msg?: string
): asserts v is string {
  assuming(
    that(v)
      .isString()
      .includesAny(...needles),
    msg
  );
}
export function assertStringIncludesAll(
  v: unknown,
  needles: string[],
  msg?: string
): asserts v is string {
  assuming(
    that(v)
      .isString()
      .includesAll(...needles),
    msg
  );
}
export function assertStringIsJSON(
  v: unknown,
  msg?: string
): asserts v is string {
  assuming(that(v).isString().isJSON(), msg);
}

// ----------------------------------------------------------------------------
// Targeted array helpers
// ----------------------------------------------------------------------------

export function assertArrayNotEmpty(
  v: unknown,
  msg?: string
): asserts v is unknown[] {
  assuming(that(v).isArray().notEmpty(), msg);
}
export function assertArrayHasLength(
  v: unknown,
  len: number,
  msg?: string
): asserts v is unknown[] {
  assuming(that(v).isArray().hasLength(len), msg);
}
export function assertArrayItemIsBoolean(
  v: unknown,
  index: number,
  msg?: string
): asserts v is unknown[] {
  assuming(that(v).isArray().itemIsBoolean(index), msg);
}
export function assertArrayItemIsString(
  v: unknown,
  index: number,
  msg?: string
): asserts v is unknown[] {
  assuming(that(v).isArray().itemIsString(index), msg);
}
export function assertArrayItemIsNumber(
  v: unknown,
  index: number,
  msg?: string
): asserts v is unknown[] {
  assuming(that(v).isArray().itemIsNumber(index), msg);
}
export function assertArrayItemIsObject(
  v: unknown,
  index: number,
  msg?: string
): asserts v is unknown[] {
  assuming(that(v).isArray().itemIsObject(index), msg);
}
export function assertArrayIncludesString(
  v: unknown,
  needle: string,
  msg?: string
): asserts v is unknown[] {
  assuming(that(v).isArray().includesString(needle), msg);
}
export function assertArrayIncludesNumber(
  v: unknown,
  needle: number,
  msg?: string
): asserts v is unknown[] {
  assuming(that(v).isArray().includesNumber(needle), msg);
}
export function assertArrayIncludesObject(
  v: unknown,
  needle: Record<string, unknown>,
  msg?: string
): asserts v is unknown[] {
  assuming(that(v).isArray().includesObject(needle), msg);
}
export function assertArrayOnlyStrings(
  v: unknown,
  msg?: string
): asserts v is string[] {
  assuming(that(v).isArray().onlyHasStrings(), msg);
}
export function assertArrayOnlyNumbers(
  v: unknown,
  msg?: string
): asserts v is number[] {
  assuming(that(v).isArray().onlyHasNumbers(), msg);
}
export function assertArrayOnlyObjects(
  v: unknown,
  msg?: string
): asserts v is Record<string, unknown>[] {
  assuming(that(v).isArray().onlyHasObjects(), msg);
}
export function assertArrayEveryTruthy(
  v: unknown,
  msg?: string
): asserts v is unknown[] {
  assuming(that(v).isArray().everyIsTruthy(), msg);
}
export function assertArrayEveryFalsy(
  v: unknown,
  msg?: string
): asserts v is unknown[] {
  assuming(that(v).isArray().everyIsFalsy(), msg);
}

// ----------------------------------------------------------------------------
// Targeted object helpers
// ----------------------------------------------------------------------------

export function assertObjectHasKey<T extends object, K extends string>(
  obj: T,
  key: K,
  msg?: string
): asserts obj is T & Record<K, unknown> {
  assuming(that(obj).isObject().hasKey(key), msg);
}

export function assertObjectHasKeys<
  T extends object,
  K extends readonly string[],
>(
  obj: T,
  keys: K,
  msg?: string
): asserts obj is T & Record<K[number], unknown> {
  assuming(
    that(obj)
      .isObject()
      .hasKeys(...keys),
    msg
  );
}

export function assertObjectKeyEquals<
  T extends object,
  K extends string,
  V = unknown,
>(obj: T, key: K, expected: V, msg?: string): asserts obj is T & Record<K, V> {
  assuming(that(obj).isObject().keyEquals(key, expected), msg);
}

// Make all keys required and exclude `undefined` from their types
export function assertObjectAllKeysSet<T extends object>(
  obj: T,
  msg?: string
): asserts obj is { [P in keyof T]-?: Exclude<T[P], undefined> } {
  assuming(that(obj).isObject().allKeysSet(), msg);
}

export function assertObjectAnyKeyNull(
  obj: unknown,
  msg?: string
): asserts obj is Record<string, unknown> {
  assuming(that(obj).isObject().anyKeyNull(), msg);
}

/** Object keys must match exactly the provided list (no missing, no extra). */
export function assertObjectKeysExactly<K extends readonly string[]>(
  obj: unknown,
  keys: K,
  msg?: string
): asserts obj is { [P in K[number]]: unknown } {
  const expected: Record<string, unknown> = Object.fromEntries(
    (keys as readonly string[]).map((k) => [k, true])
  );
  // Reuse sameKeys which compares key sets
  assuming(that(obj).isObject().sameKeys(expected), msg);
}

// Themed aliases for targeted helpers
export const assureStringNotEmpty = assertStringNotEmpty;
export const assureStringHasLength = assertStringHasLength;
export const assureStringMinLength = assertStringMinLength;
export const assureStringMaxLength = assertStringMaxLength;
export const assureStringLengthBetween = assertStringLengthBetween;
export const assureStringContains = assertStringContains;
export const assureStringStartsWith = assertStringStartsWith;
export const assureStringEndsWith = assertStringEndsWith;
export const assureStringMatches = assertStringMatches;
export const assureStringEqualsIgnoreCase = assertStringEqualsIgnoreCase;
export const assureStringIncludesAny = assertStringIncludesAny;
export const assureStringIncludesAll = assertStringIncludesAll;
export const assureStringIsJSON = assertStringIsJSON;
export const assureArrayNotEmpty = assertArrayNotEmpty;
export const assureArrayHasLength = assertArrayHasLength;
export const assureArrayItemIsBoolean = assertArrayItemIsBoolean;
export const assureArrayItemIsString = assertArrayItemIsString;
export const assureArrayItemIsNumber = assertArrayItemIsNumber;
export const assureArrayItemIsObject = assertArrayItemIsObject;
export const assureArrayIncludesString = assertArrayIncludesString;
export const assureArrayIncludesNumber = assertArrayIncludesNumber;
export const assureArrayIncludesObject = assertArrayIncludesObject;
export const assureArrayOnlyStrings = assertArrayOnlyStrings;
export const assureArrayOnlyNumbers = assertArrayOnlyNumbers;
export const assureArrayOnlyObjects = assertArrayOnlyObjects;
export const assureArrayEveryTruthy = assertArrayEveryTruthy;
export const assureArrayEveryFalsy = assertArrayEveryFalsy;
export const assureArrayUnique = assertArrayUnique;
export const assureObjectHasKey = assertObjectHasKey;
export const assureObjectHasKeys = assertObjectHasKeys;
export const assureObjectKeyEquals = assertObjectKeyEquals;
export const assureObjectAllKeysSet = assertObjectAllKeysSet;
export const assureObjectAnyKeyNull = assertObjectAnyKeyNull;
export const assureObjectKeysExactly = assertObjectKeysExactly;

// ----------------------------------------------------------------------------
// Extra targeted convenience helpers
// ----------------------------------------------------------------------------

/** Assert a string is non-empty after trimming whitespace. */
export function assertStringTrimmedNotEmpty(
  v: unknown,
  msg?: string
): asserts v is string {
  assuming(
    that(v)
      .isString()
      .that((s) => s.trim().length > 0, msg ?? "Expected non-empty (trimmed)"),
    msg
  );
}

/** Assert an array has all unique items (===) */
export function assertArrayUnique(
  v: unknown,
  msg?: string
): asserts v is unknown[] {
  assuming(
    that(v)
      .isArray()
      .that(
        (arr) => new Set(arr as any[]).size === (arr as any[]).length,
        msg ?? "Expected array items to be unique"
      ),
    msg
  );
}

// ----------------------------------------------------------------------------
// Value-returning "expect" helpers (assert + return the value)
// ----------------------------------------------------------------------------

export function expectString<T>(v: T, msg?: string): string {
  assertIsString(v as unknown, msg);
  return v as unknown as string;
}
export function expectNumber<T>(v: T, msg?: string): number {
  assertIsNumber(v as unknown, msg);
  return v as unknown as number;
}
export function expectArray<T>(v: T, msg?: string): unknown[] {
  assertIsArray(v as unknown, msg);
  return v as unknown as unknown[];
}
export function expectObject<T>(v: T, msg?: string): Record<string, unknown> {
  assertIsObject(v as unknown, msg);
  return v as unknown as Record<string, unknown>;
}
export function expectBoolean<T>(v: T, msg?: string): boolean {
  assertIsBoolean(v as unknown, msg);
  return v as unknown as boolean;
}
export function expectDate<T>(v: T, msg?: string): Date {
  assertIsDate(v as unknown, msg);
  return v as unknown as Date;
}
export function expectElement<T>(v: T, msg?: string): Element {
  assertIsElement(v as unknown, msg);
  return v as unknown as Element;
}
export function expectNotNullOrUndefined<T>(
  v: T,
  msg?: string
): NonNullable<T> {
  assertNotNullOrUndefined(v, msg);
  return v as NonNullable<T>;
}

// ----------------------------------------------------------------------------
// "sure" aliases and bound closures (nomenclature alternatives)
// ----------------------------------------------------------------------------
// Some users prefer the word "sure" over "assure". To support that taste
// without breaking changes, we expose two forms:
// 1) Immediate assertions (aliases) — same as assure*/assert* but named sure*
// 2) Bound closures (sureIs*) — produce a zero-arg function that defers the
//    assertion until called, ideal for assuming(sureIsString(value)).

// 1) Immediate assertion aliases
export const sureString = assertIsString;
export const sureNumber = assertIsNumber;
export const sureArray = assertIsArray;
export const sureObject = assertIsObject;
export const sureElement = assertIsElement;
export const sureBoolean = assertIsBoolean;
export const sureDate = assertIsDate;
export const sureNull = assertIsNull;
export const sureNotNull = assertNotNull;
export const sureUndefined = assertIsUndefined;
export const sureNotUndefined = assertNotUndefined;
export const surePresent = assertNotNullOrUndefined;

// Targeted string aliases
export const sureStringNotEmpty = assertStringNotEmpty;
export const sureStringHasLength = assertStringHasLength;
export const sureStringMinLength = assertStringMinLength;
export const sureStringMaxLength = assertStringMaxLength;
export const sureStringLengthBetween = assertStringLengthBetween;
export const sureStringContains = assertStringContains;
export const sureStringStartsWith = assertStringStartsWith;
export const sureStringEndsWith = assertStringEndsWith;
export const sureStringMatches = assertStringMatches;
export const sureStringEqualsIgnoreCase = assertStringEqualsIgnoreCase;
export const sureStringIncludesAny = assertStringIncludesAny;
export const sureStringIncludesAll = assertStringIncludesAll;
export const sureStringIsJSON = assertStringIsJSON;
export const sureStringTrimmedNotEmpty = assertStringTrimmedNotEmpty;

// Targeted array/object aliases
export const sureArrayNotEmpty = assertArrayNotEmpty;
export const sureArrayHasLength = assertArrayHasLength;
export const sureArrayItemIsBoolean = assertArrayItemIsBoolean;
export const sureArrayItemIsString = assertArrayItemIsString;
export const sureArrayItemIsNumber = assertArrayItemIsNumber;
export const sureArrayItemIsObject = assertArrayItemIsObject;
export const sureArrayIncludesString = assertArrayIncludesString;
export const sureArrayIncludesNumber = assertArrayIncludesNumber;
export const sureArrayIncludesObject = assertArrayIncludesObject;
export const sureArrayOnlyStrings = assertArrayOnlyStrings;
export const sureArrayOnlyNumbers = assertArrayOnlyNumbers;
export const sureArrayOnlyObjects = assertArrayOnlyObjects;
export const sureArrayEveryTruthy = assertArrayEveryTruthy;
export const sureArrayEveryFalsy = assertArrayEveryFalsy;
export const sureArrayUnique = assertArrayUnique;

export const sureObjectHasKey = assertObjectHasKey;
export const sureObjectHasKeys = assertObjectHasKeys;
export const sureObjectKeyEquals = assertObjectKeyEquals;
export const sureObjectAllKeysSet = assertObjectAllKeysSet;
export const sureObjectAnyKeyNull = assertObjectAnyKeyNull;
export const sureObjectKeysExactly = assertObjectKeysExactly;

// 2) Bound closures for assuming(...)
// Usage: assuming(sureIsString(name), sureNotNull(user))
export const sureIsString = (v: unknown, msg?: string) => () =>
  assertIsString(v, msg);
export const sureIsNumber = (v: unknown, msg?: string) => () =>
  assertIsNumber(v, msg);
export const sureIsArray = (v: unknown, msg?: string) => () =>
  assertIsArray(v, msg);
export const sureIsObject = (v: unknown, msg?: string) => () =>
  assertIsObject(v, msg);
export const sureIsElement = (v: unknown, msg?: string) => () =>
  assertIsElement(v, msg);
export const sureIsBoolean = (v: unknown, msg?: string) => () =>
  assertIsBoolean(v, msg);
export const sureIsDate = (v: unknown, msg?: string) => () =>
  assertIsDate(v, msg);
export const sureIsNull = (v: unknown, msg?: string) => () =>
  assertIsNull(v, msg);
export const sureIsUndefined = (v: unknown, msg?: string) => () =>
  assertIsUndefined(v, msg);

export const sureNotNil =
  <T>(v: T, msg?: string) =>
  () =>
    assertNotNullOrUndefined(v, msg);
export const sureNotNullBound =
  <T>(v: T, msg?: string) =>
  () =>
    assertNotNull(v, msg);
export const sureNotUndefinedBound =
  <T>(v: T, msg?: string) =>
  () =>
    assertNotUndefined(v, msg);

// ----------------------------------------------------------------------------
// "mustBe" aliases and closure object (even simpler naming)
// ----------------------------------------------------------------------------
// Immediate assertion aliases
export const mustBeString = assertIsString;
export const mustBeNumber = assertIsNumber;
export const mustBeArray = assertIsArray;
export const mustBeObject = assertIsObject;
export const mustBeElement = assertIsElement;
export const mustBeBoolean = assertIsBoolean;
export const mustBeDate = assertIsDate;
export const mustBeNull = assertIsNull;
export const mustBeUndefined = assertIsUndefined;
export const mustBePresent = assertNotNullOrUndefined;
// Friendlier naming for "present"
export const mustExists = assertNotNullOrUndefined;
export const mustExist = assertNotNullOrUndefined;

// Targeted immediate aliases
export const mustBeStringNotEmpty = assertStringNotEmpty;
export const mustBeStringHasLength = assertStringHasLength;
export const mustBeStringMinLength = assertStringMinLength;
export const mustBeStringMaxLength = assertStringMaxLength;
export const mustBeStringLengthBetween = assertStringLengthBetween;
export const mustBeStringContains = assertStringContains;
export const mustBeStringStartsWith = assertStringStartsWith;
export const mustBeStringEndsWith = assertStringEndsWith;
export const mustBeStringMatches = assertStringMatches;
export const mustBeStringEqualsIgnoreCase = assertStringEqualsIgnoreCase;
export const mustBeStringIncludesAny = assertStringIncludesAny;
export const mustBeStringIncludesAll = assertStringIncludesAll;
export const mustBeStringIsJSON = assertStringIsJSON;
export const mustBeStringTrimmedNotEmpty = assertStringTrimmedNotEmpty;

export const mustBeArrayNotEmpty = assertArrayNotEmpty;
export const mustBeArrayHasLength = assertArrayHasLength;
export const mustBeArrayItemIsBoolean = assertArrayItemIsBoolean;
export const mustBeArrayItemIsString = assertArrayItemIsString;
export const mustBeArrayItemIsNumber = assertArrayItemIsNumber;
export const mustBeArrayItemIsObject = assertArrayItemIsObject;
export const mustBeArrayIncludesString = assertArrayIncludesString;
export const mustBeArrayIncludesNumber = assertArrayIncludesNumber;
export const mustBeArrayIncludesObject = assertArrayIncludesObject;
export const mustBeArrayOnlyStrings = assertArrayOnlyStrings;
export const mustBeArrayOnlyNumbers = assertArrayOnlyNumbers;
export const mustBeArrayOnlyObjects = assertArrayOnlyObjects;
export const mustBeArrayEveryTruthy = assertArrayEveryTruthy;
export const mustBeArrayEveryFalsy = assertArrayEveryFalsy;
export const mustBeArrayUnique = assertArrayUnique;

export const mustBeObjectHasKey = assertObjectHasKey;
export const mustBeObjectHasKeys = assertObjectHasKeys;
export const mustBeObjectKeyEquals = assertObjectKeyEquals;
export const mustBeObjectAllKeysSet = assertObjectAllKeysSet;
export const mustBeObjectAnyKeyNull = assertObjectAnyKeyNull;
export const mustBeObjectKeysExactly = assertObjectKeysExactly;

// Closure factory object for use with assuming(...)
export const mustBe = {
  string: (v: unknown, msg?: string) => () => assertIsString(v, msg),
  number: (v: unknown, msg?: string) => () => assertIsNumber(v, msg),
  array: (v: unknown, msg?: string) => () => assertIsArray(v, msg),
  object: (v: unknown, msg?: string) => () => assertIsObject(v, msg),
  element: (v: unknown, msg?: string) => () => assertIsElement(v, msg),
  boolean: (v: unknown, msg?: string) => () => assertIsBoolean(v, msg),
  date: (v: unknown, msg?: string) => () => assertIsDate(v, msg),
  null: (v: unknown, msg?: string) => () => assertIsNull(v, msg),
  undefined: (v: unknown, msg?: string) => () => assertIsUndefined(v, msg),
  present:
    <T>(v: T, msg?: string) =>
    () =>
      assertNotNullOrUndefined(v, msg),
  // Friendlier synonyms
  exist:
    <T>(v: T, msg?: string) =>
    () =>
      assertNotNullOrUndefined(v, msg),
  exists:
    <T>(v: T, msg?: string) =>
    () =>
      assertNotNullOrUndefined(v, msg),

  // targeted
  stringNotEmpty: (v: unknown, msg?: string) => () =>
    assertStringNotEmpty(v, msg),
  stringHasLength: (v: unknown, len: number, msg?: string) => () =>
    assertStringHasLength(v, len, msg),
  stringMinLength: (v: unknown, n: number, msg?: string) => () =>
    assertStringMinLength(v, n, msg),
  stringMaxLength: (v: unknown, n: number, msg?: string) => () =>
    assertStringMaxLength(v, n, msg),
  stringLengthBetween:
    (v: unknown, min: number, max: number, msg?: string) => () =>
      assertStringLengthBetween(v, min, max, msg),
  stringContains: (v: unknown, needle: string | RegExp, msg?: string) => () =>
    assertStringContains(v, needle, msg),
  stringStartsWith: (v: unknown, prefix: string, msg?: string) => () =>
    assertStringStartsWith(v, prefix, msg),
  stringEndsWith: (v: unknown, suffix: string, msg?: string) => () =>
    assertStringEndsWith(v, suffix, msg),
  stringMatches: (v: unknown, re: RegExp, msg?: string) => () =>
    assertStringMatches(v, re, msg),
  stringEqualsIgnoreCase: (v: unknown, expected: string, msg?: string) => () =>
    assertStringEqualsIgnoreCase(v, expected, msg),
  stringIncludesAny: (v: unknown, needles: string[], msg?: string) => () =>
    assertStringIncludesAny(v, needles, msg),
  stringIncludesAll: (v: unknown, needles: string[], msg?: string) => () =>
    assertStringIncludesAll(v, needles, msg),
  stringIsJSON: (v: unknown, msg?: string) => () => assertStringIsJSON(v, msg),
  stringTrimmedNotEmpty: (v: unknown, msg?: string) => () =>
    assertStringTrimmedNotEmpty(v, msg),

  arrayNotEmpty: (v: unknown, msg?: string) => () =>
    assertArrayNotEmpty(v, msg),
  arrayHasLength: (v: unknown, len: number, msg?: string) => () =>
    assertArrayHasLength(v, len, msg),
  arrayItemIsBoolean: (v: unknown, index: number, msg?: string) => () =>
    assertArrayItemIsBoolean(v, index, msg),
  arrayItemIsString: (v: unknown, index: number, msg?: string) => () =>
    assertArrayItemIsString(v, index, msg),
  arrayItemIsNumber: (v: unknown, index: number, msg?: string) => () =>
    assertArrayItemIsNumber(v, index, msg),
  arrayItemIsObject: (v: unknown, index: number, msg?: string) => () =>
    assertArrayItemIsObject(v, index, msg),
  arrayIncludesString: (v: unknown, needle: string, msg?: string) => () =>
    assertArrayIncludesString(v, needle, msg),
  arrayIncludesNumber: (v: unknown, needle: number, msg?: string) => () =>
    assertArrayIncludesNumber(v, needle, msg),
  arrayIncludesObject:
    (v: unknown, needle: Record<string, unknown>, msg?: string) => () =>
      assertArrayIncludesObject(v, needle, msg),
  arrayOnlyStrings: (v: unknown, msg?: string) => () =>
    assertArrayOnlyStrings(v, msg),
  arrayOnlyNumbers: (v: unknown, msg?: string) => () =>
    assertArrayOnlyNumbers(v, msg),
  arrayOnlyObjects: (v: unknown, msg?: string) => () =>
    assertArrayOnlyObjects(v, msg),
  arrayEveryTruthy: (v: unknown, msg?: string) => () =>
    assertArrayEveryTruthy(v, msg),
  arrayEveryFalsy: (v: unknown, msg?: string) => () =>
    assertArrayEveryFalsy(v, msg),
  arrayUnique: (v: unknown, msg?: string) => () => assertArrayUnique(v, msg),

  objectHasKey:
    <T extends object, K extends string>(obj: T, key: K, msg?: string) =>
    () =>
      assertObjectHasKey(obj, key, msg),
  objectHasKeys:
    <T extends object, K extends readonly string[]>(
      obj: T,
      keys: K,
      msg?: string
    ) =>
    () =>
      assertObjectHasKeys(obj, keys, msg),
  objectKeyEquals:
    <T extends object, K extends string, V = unknown>(
      obj: T,
      key: K,
      expected: V,
      msg?: string
    ) =>
    () =>
      assertObjectKeyEquals(obj, key, expected, msg),
  objectAllKeysSet:
    <T extends object>(obj: T, msg?: string) =>
    () =>
      assertObjectAllKeysSet(obj, msg),
  objectAnyKeyNull: (obj: unknown, msg?: string) => () =>
    assertObjectAnyKeyNull(obj, msg),
  objectKeysExactly:
    <K extends readonly string[]>(obj: unknown, keys: K, msg?: string) =>
    () =>
      assertObjectKeysExactly(obj, keys, msg),
} as const;

// ============================================================================
// LEGACY CHECKS SYSTEM (COMMENTED OUT - GOOD IDEAS BUT REPLACED BY CHAINS)
// ============================================================================

/*
// LEGACY: Original imperative checks system
// Good ideas: Type assertions, explicit function signatures
// Replaced by: Fluent assume() chains which are more readable

export type CoreChecksType = {
  assumeTrue(cond: boolean, msg?: string): asserts cond;
  assumeFalse(cond: boolean, msg?: string): asserts cond is false;
  isTrue(cond: boolean, msg?: string): asserts cond;
  isFalse(cond: boolean, msg?: string): asserts cond is false;
  isFunction(v: unknown, msg?: string): asserts v is (...args: any[]) => any;
  isPromise(v: unknown, msg?: string): asserts v is Promise<unknown>;
  isInstanceOf<T>(v: unknown, ctor: new (...a: any[]) => T): asserts v is T;
  
  // Nullish helpers - these were good ideas
  isNull(v: unknown, msg?: string): asserts v is null;
  notNull<T>(v: T, msg?: string): asserts v is NonNullable<T>;
  isUndefined(v: unknown, msg?: string): asserts v is undefined;
  notUndefined<T>(v: T, msg?: string): asserts v is NonNullable<T>;
  isNil(v: unknown, msg?: string): asserts v is null | undefined;
  notNil<T>(v: T, msg?: string): asserts v is NonNullable<T>;
  notNullOrUndefined<T>(v: T, msg?: string): asserts v is NonNullable<T>;
};

export type ObjectChecksType = {
  isObject(v: unknown, msg?: string): asserts v is Record<string, unknown>;
  hasKey<T extends object, K extends string>(obj: T, key: K, msg?: string): asserts obj is T & Record<K, unknown>;
  hasKeys(...keys: string[]): AssumptionFn<Record<string, unknown>, 'object'>; // This was confused - mixing patterns
  equalStringified(obj: unknown, expected: string): void;
  sameKeys(obj: unknown, expected: Record<string, unknown>): void;
  allKeysFalsey(obj: unknown): asserts obj is Record<string, null | undefined | false | 0 | ''>;
  allKeysFalsy(obj: unknown): asserts obj is Record<string, null | undefined | false | 0 | ''>;
  allKeysSet(obj: unknown): asserts obj is Record<string, unknown>;
  anyKeyNull(obj: unknown): asserts obj is Record<string, null>;
};

export type ArrayChecksType = {
  isArray(v: unknown, msg?: string): asserts v is unknown[];
  hasLength<T extends unknown[]>(arr: T, len: number, msg?: string): asserts arr is { length: typeof len } & T;
  containsString(arr: unknown[], index: number): asserts arr is { [K in typeof index]: string } & unknown[];
  containsNumber(arr: unknown[], index: number): asserts arr is { [K in typeof index]: number } & unknown[];
  containsObject(arr: unknown[], index: number): asserts arr is { [K in typeof index]: object } & unknown[];
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

// GOOD IDEAS FROM CHECKS:
// 1. Explicit type assertions with `asserts` keyword
// 2. Nullish checking variations (isNil, notNil, notNull, etc.)
// 3. Element visibility checks (isHidden/isVisible)
// 4. Promise and function type guards
// 5. Strict type narrowing with generics

// WHY REPLACED:
// Old: Checks.isArray(value); Checks.hasLength(value, 5);
// New: assume(value).isArray().hasLength(5)();
// The new way is more readable and chainable
*/

// ============================================================================
// BROKEN/INCOMPLETE IMPLEMENTATIONS (COMMENTED OUT - LEARN FROM MISTAKES)
// ============================================================================

/*
// BROKEN: These were never properly implemented
const CoreChecks: CoreChecksType = {
  // ...
  isTrue: function (cond: boolean, msg?: string): asserts cond {
    throw new Error('Function not implemented.'); // ← Never finished!
  },
  isFalse: function (cond: boolean, msg?: string): asserts cond is false {
    throw new Error(msg ?? 'Function not implemented.'); // ← Still broken!
  },
  // ...
};

// CONFUSED PATTERN: Mixing assumption chains with object methods
const ObjectChecks: ObjectChecksType = {
  // ...
  hasKeys(...keys: string[]): AssumptionFn<Record<string, unknown>, 'object'> {
    // This doesn't make sense - returning AssumptionFn from object method
    return function (this: AssumptionFn<Record<string, unknown>, 'object'>) {
      const obj = this.value(); // Wrong pattern - mixing contexts
      for (const k of keys) {
        if (!(k in obj)) throw new Error(`Expected object to have key "${k}"`);
      }
      return true;
    } as AssumptionFn<Record<string, unknown>, 'object'>;
  },
  // ...
};

// LESSON LEARNED: Don't mix imperative and fluent APIs in same type system
*/

// ============================================================================
// INTERESTING EXPERIMENTAL IDEAS (COMMENTED OUT - POTENTIAL FUTURE FEATURES)
// ============================================================================

/*
// INTERESTING: Element visibility checking
isHidden(el, msg) {
  const e = el as Element;
  const hiddenAttr = e.getAttribute?.('hidden') != null;
  const computed = typeof window !== 'undefined' ? window.getComputedStyle(e) : null;
  const hiddenByCss = computed ? computed.display === 'none' || computed.visibility === 'hidden' : false;
  if (!hiddenAttr && !hiddenByCss) throw new Error(msg ?? 'Expected element to be hidden');
},

isVisible(el, msg) {
  const e = el as Element;
  const computed = typeof window !== 'undefined' ? window.getComputedStyle(e) : null;
  const visible = computed ? computed.display !== 'none' && computed.visibility !== 'hidden' : true;
  if (!visible) throw new Error(msg ?? 'Expected element to be visible');
},

// GOOD IDEA: Could add these to ElementOnlyChain
// assume(element).isElement().isVisible().hasAttribute('data-id')

// INTERESTING: Stringified equality checking
equalStringified(obj, expected) {
  if (JSON.stringify(obj) !== expected) throw new Error(`Expected object to equal stringified version`);
},

// GOOD IDEA: Could be useful for API response validation
// assume(apiResponse).isObject().stringifiedEquals(expectedJson)

// INTERESTING: Array type homogeneity checks
onlyHasObjects(msg?: string) {
  if (!(value as any[]).every((item) => typeof item === 'object' && item !== null && !Array.isArray(item))) 
    throw new Error(msg ?? 'Expected all objects');
},

onlyHasStrings(msg?: string) {
  if (!(value as any[]).every((item) => typeof item === 'string')) 
    throw new Error(msg ?? 'Expected all strings');
},

// ALREADY IMPLEMENTED: These made it into ArrayOnlyChain - good ideas!
*/

// ============================================================================
// REDUNDANT HELPER FUNCTIONS (COMMENTED OUT - ALREADY HAVE BETTER VERSIONS)
// ============================================================================

/*
// REDUNDANT: These duplicate functionality in assume() chains
export function assertIsString(v: unknown, msg?: string): asserts v is string {
  assume(v).isString(msg)(); // Just use assume(v).isString()() directly
}

export function assertNotNil(v: unknown, msg?: string): asserts v is NonNullable<typeof v> {
  if (v === undefined || v === null || typeof v === 'undefined') 
    throw new Error(msg ?? 'Entry is nil. Expected not null or undefined');
  // Better: assume(v).notNil()()
}

export function assertIsObject<T extends object = Record<string, unknown>>(v: unknown, msg?: string): asserts v is T {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) 
    throw new Error(msg ?? 'Expected object');
  // Better: assume(v).isObject()()
}

// LESSON: Don't create wrapper functions for things that are already clean
*/

// ============================================================================
// ACTIVE CODE CONTINUES HERE...
// ============================================================================

// Re-export validation registry for convenience
export * from "./validation-registry";

//
