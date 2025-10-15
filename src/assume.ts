// ============================================================================
// CORE TYPES AND ACTIVE CODE
// ============================================================================

type TypeTag = 'unknown' | 'string' | 'number' | 'array' | 'object' | 'element' | 'boolean' | 'null' | 'undefined' | 'present';
const typeTagArray = ['unknown', 'string', 'number', 'array', 'object', 'element', 'boolean', 'null', 'undefined', 'present'];

/**
 * A zero-argument check function queued in a chain.
 */
export type Check = () => void;

// Helper type for instanceof narrowing:
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

/**
 * An entry in the chain queue, pairing the executable check with a type tag
 * (for potential introspection / debugging).
 */
export type ChainLink = {
  check: Check;
  type: TypeTag | 'function' | 'datetime';
  methodName?: string;
};

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

      // Fixed narrowing types:
      notNil(msg?: string): AssumptionFn<NonNullable<T>, 'present'>;
      notNull(msg?: string): AssumptionFn<Exclude<T, null>, 'present'>;
      notNullOrUndefined(msg?: string): AssumptionFn<NonNullable<T>, 'present'>;
    }
  : {};

// Helper type to detect TypeTag from TypeScript's inferred type
type DetectTypeTag<T> = T extends string ? 'string' : T extends number ? 'number' : T extends boolean ? 'boolean' : T extends any[] ? 'array' : T extends HTMLElement ? 'element' : T extends Element ? 'element' : T extends Record<string, any> ? 'object' : T extends null ? 'null' : T extends undefined ? 'undefined' : 'unknown';

interface BaseChain<T, K extends TypeTag> {
  that(predicate: (v: T) => boolean, msg?: string): AssumptionFn<T, K>;
  equals(expected: Exclude<T, null | undefined | unknown>, msg?: string): AssumptionFn<T, K>;

  // Enhanced instanceof with proper narrowing:
  instanceof(expectedOrMsg?: string | (new (...args: any[]) => any) | undefined, msg?: string | undefined): AssumptionFn<T, DetectTypeTag<T>> | AssumptionFn<T, TypeTag> | void;

  value(): T;
}

// Specialized chain types
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

// Glue: Add conditional specialized chain methods depending on K
type Specialized<T, K extends TypeTag> = K extends 'number' ? NumberOnlyChain : K extends 'string' ? StringOnlyChain : K extends 'array' ? ArrayOnlyChain : K extends 'object' ? ObjectOnlyChain : K extends 'element' ? ElementOnlyChain : {}; // other narrowed primitive kinds expose no extra methods

export type AssumptionFn<T, K extends TypeTag = 'unknown'> = (() => boolean | void) & BaseChain<T, K> & GuardMethods<T, K> & Specialized<T, K>;

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

function mergeOptions(base: AssumingOptions, patch?: AssumingOptions | string | null | undefined): AssumingOptions {
  if (patch == null) return base;
  if (typeof patch === 'string') return { ...base, message: patch };
  return { ...base, ...patch };
}

export function assuming(...args: Array<Assumption | AssumingOptions | string | null | undefined>) {
  let optionsRef: AssumingOptions = { quiet: false, message: 'Assumption failed' };

  // trailing message or options
  if (args.length) {
    const last = args[args.length - 1] as any;
    const isOptsObj = last && typeof last === 'object' && typeof last !== 'function' && typeof last !== 'boolean';
    if (typeof last === 'string' || isOptsObj) {
      optionsRef = mergeOptions(optionsRef, last);
      args.pop();
    }
  }

  // normalize assumptions to callables; ignore null/undefined
  const assumptions: Array<() => boolean | void> = args.filter((a) => a != null && (typeof a === 'function' || typeof a === 'boolean')).map((a) => (typeof a === 'function' ? (a as () => boolean | void) : () => a as boolean));

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
  assumingBus.emit(failed ? 'assuming:fail' : 'assuming:pass');
  if (!failed && optionsRef.emit) {
    assumingBus.emit(optionsRef.emit);
  }

  if (failed && !optionsRef.quiet) {
    const msg = optionsRef.message ?? (error instanceof Error ? error.message : 'Assumption failed');
    throw error instanceof Error ? error : new Error(msg);
  }

  let lastResult: unknown; // capture last Run/result result

  const buildMessage = (msg?: string) => msg ?? optionsRef.message ?? (error instanceof Error ? error.message : 'Assumptions not satisfied');

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
      if (!failed) throw new Error(msg ?? 'Expected assumptions to be refuted');
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
    catch(fn: (err: unknown) => unknown) {
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
export function safeToAssume(...args: any[]): boolean {
  try {
    // If single argument that looks like an assumption chain/function
    if (args.length === 1 && typeof args[0] === 'function') {
      // Single assumption chain: safeToAssume(that(x).isString())
      args[0](); // Execute the chain
      return true;
    } else {
      // Multiple assumptions: safeToAssume(cond1, cond2, that(x).isString())
      assuming(...args);
      return true;
    }
  } catch (e) {
    console.log('Well... that assumption turned out to be unfounded:', (e as any).message);
    return false;
  }
}

// ---- AssumptionError + central history ----
type AssumeEvent = { t: number; kind: 'start'; info: { valuePreview?: string } } | { t: number; kind: 'check'; info: { type: TypeTag | 'function' | 'datetime'; op?: string } } | { t: number; kind: 'refuted'; info: { message: string } } | { t: number; kind: 'vindicated' };

const ASSUME_HISTORY: AssumeEvent[] = [];
let ASSUME_HISTORY_LIMIT = 200;

function pushAssumeEvent(ev: AssumeEvent) {
  ASSUME_HISTORY.push(ev);
  if (ASSUME_HISTORY.length > ASSUME_HISTORY_LIMIT) ASSUME_HISTORY.shift();
}

function previewValue(v: unknown): string | undefined {
  try {
    if (v === null || v === undefined) return String(v);
    if (typeof v === 'string') return v.length > 120 ? v.slice(0, 117) + '...' : v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) return `Array(${v.length})`;
    if (typeof v === 'object')
      return `{${Object.keys(v as object)
        .slice(0, 6)
        .join(',')}${Object.keys(v as object).length > 6 ? ',…' : ''}}`;
    return typeof v;
  } catch {
    return undefined;
  }
}

export const captureLocation = (() => {
  const stack = new Error().stack;
  if (stack) {
    const lines = stack.split('\n');
    // Find first line that's not in assume.ts/assume.js
    const relevantLine = lines.find((line) => line.includes('at ') && !line.includes('assume.js') && !line.includes('assume.ts'));
    return relevantLine?.trim().replace('at ', '') || 'unknown';
  }
  return undefined;
})();

export class AssumptionError extends Error {
  readonly name = 'AssumptionError';
  readonly assumeStack: ChainLink[];
  readonly valuePreview?: string;
  readonly timestamp: number;
  readonly cause: unknown;
  readonly chainTrace: string[]; // NEW: readable chain trace
  readonly captureLocation?: string; // NEW: where the chain was created

  constructor(message: string, opts: { stack: ChainLink[]; value?: unknown; cause?: unknown; chainTrace?: string[]; captureLocation?: string }) {
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
      parts.push(`Chain: ${this.chainTrace.join(' → ')}`);
    }

    if (this.captureLocation) {
      parts.push(`Created at: ${this.captureLocation}`);
    }

    return parts.join('\n  ');
  }
}

export function isAssumptionError(err: unknown): err is AssumptionError {
  return !!err && typeof err === 'object' && (err as any).name === 'AssumptionError';
}

function formatAssumptionError(err: AssumptionError): string {
  const parts = [`🔴 ${err.message}`, `📊 Value: ${err.valuePreview || 'unknown'}`];

  if (err.chainTrace.length > 0) {
    parts.push(`🔗 Chain: ${err.chainTrace.join(' → ')}`);
  }

  if (err.captureLocation) {
    parts.push(`📍 Origin: ${err.captureLocation}`);
  }

  // Show recent history for context
  const recentHistory = getAssumeHistory().slice(-3);
  if (recentHistory.length > 0) {
    parts.push(`📜 Recent: ${recentHistory.map((ev) => `${ev.kind}${JSON.stringify(ev as AssumeEvent) || ''}`).join(' → ')}`);
  }

  return parts.join('\n   ');
}

function createAssumption<T>(value: T): AssumptionFn<T, 'unknown'> {
  const queue: ChainLink[] = [];
  const chainTrace: string[] = []; // Track method calls

  // Capture where the chain was created
  pushAssumeEvent({ t: Date.now(), kind: 'start', info: { valuePreview: previewValue(value) } });

  const runAll = (): boolean => {
    try {
      for (const c of queue) c.check();
      pushAssumeEvent({ t: Date.now(), kind: 'vindicated' });
      return true;
    } catch (e) {
      // Don't throw - just return false to indicate failure
      pushAssumeEvent({ t: Date.now(), kind: 'refuted', info: { message: String(e) } });
      return false;
    }
  };

  const runner = function () {
    return runAll();
  } as AssumptionFn<T, 'unknown'>;

  function getTypeName(val: unknown): string {
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'Array';
    if (typeof val === 'object') return (val as any).constructor?.name || 'Object';
    return typeof val;
  }

  // Simplify the add function to use getTypeName:
  const add = (fn: Check, type: ChainLink['type'] = 'unknown', methodName?: string) => {
    // Add to readable trace using detected type
    if (methodName) {
      const detectedType = getTypeName(value);
      chainTrace.push(`${detectedType}.${methodName}`);
    }

    const wrapped: Check = () => {
      try {
        fn();
        pushAssumeEvent({ t: Date.now(), kind: 'check', info: { type, op: methodName } });
      } catch (e) {
        if (isAssumptionError(e)) {
          pushAssumeEvent({ t: Date.now(), kind: 'refuted', info: { message: e.message } });
          throw e;
        }

        const err = new AssumptionError(e instanceof Error ? e.message : String(e), {
          stack: queue.slice(),
          value,
          cause: e,
          chainTrace: chainTrace.slice(),
          captureLocation,
        });

        // 📰 IMMEDIATE BULLETIN (no setImmediate)
        console.log('📰 ASSUMPTION ERROR:', err.message);

        pushAssumeEvent({ t: Date.now(), kind: 'refuted', info: { message: err.message } });
        throw err;
      }
    };

    queue.push({ check: wrapped, type, methodName } as ChainLink);
  };

  const base: BaseChain<T, any> = {
    that(predicate: (v: T) => boolean, msg?: string) {
      add(
        () => {
          if (!predicate(value)) throw new Error(msg ?? 'Assumption failed');
        },
        'unknown',
        'that',
      );
      return runner as any;
    },
    instanceof(expectedOrMsg?: string | (new (...args: any[]) => any), msg?: string): AssumptionFn<T, DetectTypeTag<T>> | AssumptionFn<T, TypeTag> | void {
      // Detect if first param is a constructor or message
      const isConstructorProvided = typeof expectedOrMsg === 'function';
      const actualMsg = isConstructorProvided ? msg : (expectedOrMsg as string);

      if (isConstructorProvided) {
        // With constructor - check instanceof and use smart TypeTag detection
        const expected = expectedOrMsg as new (...args: any[]) => any;
        add(
          () => {
            if (!(value instanceof expected)) throw new Error(actualMsg ?? 'Assumption failed: value is not instance of expected');
          },
          // Smart TypeTag detection from your typeTagArray lookup
          (typeTagArray.find((x) => x === getTypeName(value)) || typeTagArray.find((x) => x === typeof value) || 'unknown') as TypeTag,
          `instanceof(${expected.name || 'Constructor'})`,
        );
      } else {
        // Empty instanceof - confidence check, detect current type
        add(
          () => {
            // Just verify it's some kind of constructor instance
            if (typeof value !== 'object' || value === null) {
              throw new Error(actualMsg ?? 'Expected constructor instance');
            }
          },
          // Smart TypeTag detection using your existing logic
          (typeTagArray.find((x) => x === getTypeName(value)) || typeTagArray.find((x) => x === typeof value) || 'unknown') as TypeTag,
          `instanceof('base')`,
        );
      }
    },
    equals(expected: T, msg?: string) {
      add(
        () => {
          if ((value as any) !== expected) throw new Error(msg ?? 'Assumption failed: value !== expected');
        },
        'unknown',
        `equals(${JSON.stringify(expected)})`,
      );
      return runner as any;
    },
    value() {
      return value;
    },
  };

  Object.assign(runner, base);

  // Chain builders for each specialized type
  const toNumberChain = (): AssumptionFn<number, 'number'> =>
    Object.assign(runner as any, {
      greaterThan(n: number, msg?: string) {
        add(
          () => {
            if (!((value as any) > n)) throw new Error(msg ?? `Expected > ${n}`);
          },
          'number',
          `greaterThan(${n})`,
        );
        return runner as any;
      },
      greaterOrEqual(n: number, msg?: string) {
        add(
          () => {
            if (!((value as any) >= n)) throw new Error(msg ?? `Expected >= ${n}`);
          },
          'number',
          `greaterOrEqual(${n})`,
        );
        return runner as any;
      },
      lessThan(n: number, msg?: string) {
        add(
          () => {
            if (!((value as any) < n)) throw new Error(msg ?? `Expected < ${n}`);
          },
          'number',
          `lessThan(${n})`,
        );
        return runner as any;
      },
      lessOrEqual(n: number, msg?: string) {
        add(
          () => {
            if (!((value as any) <= n)) throw new Error(msg ?? `Expected <= ${n}`);
          },
          'number',
          `lessOrEqual(${n})`,
        );
        return runner as any;
      },
      between(min: number, max: number, msg?: string) {
        add(
          () => {
            const v = value as any;
            if (!(v >= min && v <= max)) throw new Error(msg ?? `Expected between ${min} and ${max}`);
          },
          'number',
          `between(${min},${max})`,
        );
        return runner as any;
      },
    } satisfies NumberOnlyChain);

  const toStringChain = (): AssumptionFn<string, 'string'> =>
    Object.assign(runner as any, {
      notEmpty(msg?: string) {
        add(
          () => {
            if (String(value).length === 0) throw new Error(msg ?? 'Expected non-empty string');
          },
          'string',
          'notEmpty',
        );
        return runner as any;
      },
      hasLength(len: number, msg?: string) {
        add(
          () => {
            if (String(value).length !== len) throw new Error(msg ?? `Expected length ${len}`);
          },
          'string',
          `hasLength(${len})`,
        );
        return runner as any;
      },
      minLength(n: number, msg?: string) {
        add(
          () => {
            if (String(value).length < n) throw new Error(msg ?? `Expected length >= ${n}`);
          },
          'string',
          `minLength(${n})`,
        );
        return runner as any;
      },
      maxLength(n: number, msg?: string) {
        add(
          () => {
            if (String(value).length > n) throw new Error(msg ?? `Expected length <= ${n}`);
          },
          'string',
          `maxLength(${n})`,
        );
        return runner as any;
      },
      lengthBetween(min: number, max: number, msg?: string) {
        add(
          () => {
            const l = String(value).length;
            if (l < min || l > max) throw new Error(msg ?? `Expected length between ${min} and ${max}`);
          },
          'string',
          `lengthBetween(${min},${max})`,
        );
        return runner as any;
      },
      contains(needle: string | RegExp, msg?: string) {
        add(
          () => {
            const s = String(value);
            const ok = typeof needle === 'string' ? s.includes(needle) : needle.test(s);
            if (!ok) throw new Error(msg ?? `Expected to contain ${String(needle)}`);
          },
          'string',
          `contains(${typeof needle === 'string' ? `"${needle}"` : needle.toString()})`,
        );
        return runner as any;
      },
      startsWith(prefix: string, msg?: string) {
        add(
          () => {
            if (!String(value).startsWith(prefix)) throw new Error(msg ?? `Expected to start with "${prefix}"`);
          },
          'string',
          `startsWith("${prefix}")`,
        );
        return runner as any;
      },
      endsWith(suffix: string, msg?: string) {
        add(
          () => {
            if (!String(value).endsWith(suffix)) throw new Error(msg ?? `Expected to end with "${suffix}"`);
          },
          'string',
          `endsWith("${suffix}")`,
        );
        return runner as any;
      },
      matches(re: RegExp, msg?: string) {
        add(
          () => {
            if (!re.test(String(value))) throw new Error(msg ?? `Expected to match ${re}`);
          },
          'string',
          `matches(${re.toString()})`,
        );
        return runner as any;
      },
      equalsIgnoreCase(expected: string, msg?: string) {
        add(
          () => {
            if (String(value).toLowerCase() !== expected.toLowerCase()) throw new Error(msg ?? `Expected "${expected}" (case-insensitive)`);
          },
          'string',
          `equalsIgnoreCase("${expected}")`,
        );
        return runner as any;
      },
      includesAny(...needles: string[]) {
        add(
          () => {
            const s = String(value);
            if (!needles.some((n) => s.includes(n))) throw new Error(`Expected any of [${needles.join(', ')}]`);
          },
          'string',
          `includesAny(${needles.map((n) => `"${n}"`).join(',')})`,
        );
        return runner as any;
      },
      includesAll(...needles: string[]) {
        add(
          () => {
            const s = String(value);
            if (!needles.every((n) => s.includes(n))) throw new Error(`Expected all of [${needles.join(', ')}]`);
          },
          'string',
          `includesAll(${needles.map((n) => `"${n}"`).join(',')})`,
        );
        return runner as any;
      },
      isJSON(msg?: string) {
        add(
          () => {
            try {
              JSON.parse(String(value));
            } catch {
              throw new Error(msg ?? 'Expected valid JSON');
            }
          },
          'string',
          'isJSON',
        );
        return runner as any;
      },
    } satisfies StringOnlyChain);

  const toArrayChain = (): AssumptionFn<unknown[], 'array'> =>
    Object.assign(runner as any, {
      hasLength(len: number, msg?: string) {
        add(
          () => {
            if ((value as any[]).length !== len) throw new Error(msg ?? `Expected array length ${len}`);
          },
          'array',
          `hasLength(${len})`,
        );
        return runner as any;
      },
      notEmpty(msg?: string) {
        add(
          () => {
            if ((value as any[]).length === 0) throw new Error(msg ?? 'Expected non-empty array');
          },
          'array',
          'notEmpty',
        );
        return runner as any;
      },
      itemIsBoolean(i: number, msg?: string) {
        add(
          () => {
            if (typeof (value as any[])[i] !== 'boolean') throw new Error(msg ?? `Expected boolean at ${i}`);
          },
          'array',
          `itemIsBoolean(${i})`,
        );
        return runner as any;
      },
      itemIsString(i: number, msg?: string) {
        add(
          () => {
            if (typeof (value as any[])[i] !== 'string') throw new Error(msg ?? `Expected string at ${i}`);
          },
          'array',
          `itemIsString(${i})`,
        );
        return runner as any;
      },
      itemIsNumber(i: number, msg?: string) {
        add(
          () => {
            if (typeof (value as any[])[i] !== 'number') throw new Error(msg ?? `Expected number at ${i}`);
          },
          'array',
          `itemIsNumber(${i})`,
        );
        return runner as any;
      },
      itemIsObject(i: number, msg?: string) {
        add(
          () => {
            const v = (value as any[])[i];
            if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error(msg ?? `Expected object at ${i}`);
          },
          'array',
          `itemIsObject(${i})`,
        );
        return runner as any;
      },
      includesString(needle: string, msg?: string) {
        add(
          () => {
            if (!(value as any[]).some((item) => String(item).includes(needle))) throw new Error(msg ?? `Expected string including "${needle}"`);
          },
          'array',
          `includesString("${needle}")`,
        );
        return runner as any;
      },
      includesNumber(needle: number, msg?: string) {
        add(
          () => {
            if (!(value as any[]).some((item) => item === needle)) throw new Error(msg ?? `Expected number including "${needle}"`);
          },
          'array',
          `includesNumber(${needle})`,
        );
        return runner as any;
      },
      includesObject(needle: Record<string, unknown>, msg?: string) {
        add(
          () => {
            if (!(value as any[]).some((item) => JSON.stringify(item) === JSON.stringify(needle))) throw new Error(msg ?? `Expected object including "${JSON.stringify(needle)}"`);
          },
          'array',
          `includesObject(${JSON.stringify(needle)})`,
        );
        return runner as any;
      },
      onlyHasObjects(msg?: string) {
        add(
          () => {
            if (!(value as any[]).every((item) => typeof item === 'object' && item !== null && !Array.isArray(item))) throw new Error(msg ?? 'Expected all objects');
          },
          'array',
          'onlyHasObjects',
        );
        return runner as any;
      },
      onlyHasStrings(msg?: string) {
        add(
          () => {
            if (!(value as any[]).every((item) => typeof item === 'string')) throw new Error(msg ?? 'Expected all strings');
          },
          'array',
          'onlyHasStrings',
        );
        return runner as any;
      },
      onlyHasNumbers(msg?: string) {
        add(
          () => {
            if (!(value as any[]).every((item) => typeof item === 'number')) throw new Error(msg ?? 'Expected all numbers');
          },
          'array',
          'onlyHasNumbers',
        );
        return runner as any;
      },
      everyIsFalsy(msg?: string) {
        add(
          () => {
            if (!(value as any[]).every((item) => !item)) throw new Error(msg ?? 'Expected all falsy');
          },
          'array',
          'everyIsFalsy',
        );
        return runner as any;
      },
      everyIsTruthy(msg?: string) {
        add(
          () => {
            if (!(value as any[]).every((item) => !!item)) throw new Error(msg ?? 'Expected all truthy');
          },
          'array',
          'everyIsTruthy',
        );
        return runner as any;
      },
      includesCondition(needle: (item: unknown) => boolean, msg?: string) {
        add(
          () => {
            if (!(value as any[]).some(needle)) throw new Error(msg ?? 'Expected array to include condition');
          },
          'array',
          'includesCondition',
        );
        return runner as any;
      },
    } satisfies ArrayOnlyChain);

  const toObjectChain = (): AssumptionFn<Record<string, unknown>, 'object'> =>
    Object.assign(runner as any, {
      hasKey(key: string, msg?: string) {
        add(
          () => {
            if (!(key in (value as any))) throw new Error(msg ?? `Expected key "${key}"`);
          },
          'object',
          `hasKey("${key}")`,
        );
        return runner as any;
      },
      hasKeys(...keys: string[]) {
        add(
          () => {
            for (const k of keys) if (!(k in (value as any))) throw new Error(`Expected key "${k}"`);
          },
          'object',
          `hasKeys(${keys.map((k) => `"${k}"`).join(',')})`,
        );
        return runner as any;
      },
      keyEquals(key: string, expected: unknown, msg?: string) {
        add(
          () => {
            if ((value as any)[key] !== expected) throw new Error(msg ?? `Expected ${key} === ${String(expected)}`);
          },
          'object',
          `keyEquals("${key}",${JSON.stringify(expected)})`,
        );
        return runner as any;
      },
      sameKeys(expected: Record<string, unknown>, msg?: string) {
        add(
          () => {
            const a = Object.keys(value as any);
            const b = Object.keys(expected);
            if (a.length !== b.length) throw new Error(msg ?? 'Key count mismatch');
            for (const k of b) if (!(k in (value as any))) throw new Error(msg ?? `Missing key "${k}"`);
          },
          'object',
          'sameKeys',
        );
        return runner as any;
      },
      allKeysFalsy(msg?: string) {
        add(
          () => {
            for (const k in value as any) if ((value as any)[k]) throw new Error(msg ?? `Key "${k}" not falsy`);
          },
          'object',
          'allKeysFalsy',
        );
        return runner as any;
      },
      allKeysSet(msg?: string) {
        add(
          () => {
            for (const k in value as any) if ((value as any)[k] === undefined) throw new Error(msg ?? `Key "${k}" unset`);
          },
          'object',
          'allKeysSet',
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
            if (!f) throw new Error(msg ?? 'No null key');
          },
          'object',
          'anyKeyNull',
        );
        return runner as any;
      },
    } satisfies ObjectOnlyChain);

  const toElementChain = (): AssumptionFn<any, 'element'> =>
    Object.assign(runner as any, {
      hasChildren(msg?: string) {
        add(
          () => {
            const e = value as any;
            if (typeof Element === 'undefined' || !(e instanceof Element) || e.childElementCount === 0) throw new Error(msg ?? 'Expected child elements');
          },
          'element',
          'hasChildren',
        );
        return runner as any;
      },
      hasChild(msg?: string) {
        add(
          () => {
            const e = value as any;
            if (typeof Element === 'undefined' || !(e instanceof Element) || e.childElementCount === 0) throw new Error(msg ?? 'Expected child elements');
          },
          'element',
          'hasChild',
        );
        return runner as any;
      },
      hasChildMatching(sel: string, msg?: string) {
        add(
          () => {
            const e = value as any;
            if (typeof Element === 'undefined' || !(e instanceof Element) || !e.querySelector(sel)) throw new Error(msg ?? `Missing child "${sel}"`);
          },
          'element',
          `hasChildMatching("${sel}")`,
        );
        return runner as any;
      },
      hasDescendant(sel: string, msg?: string) {
        add(
          () => {
            const e = value as any;
            if (typeof Element === 'undefined' || !(e instanceof Element) || !e.querySelector(sel)) throw new Error(msg ?? `Missing descendant "${sel}"`);
          },
          'element',
          `hasDescendant("${sel}")`,
        );
        return runner as any;
      },
      hasAttribute(name: string, msg?: string) {
        add(
          () => {
            const e = value as any;
            if (typeof Element === 'undefined' || !(e instanceof Element) || !e.hasAttribute(name)) throw new Error(msg ?? `Missing attribute "${name}"`);
          },
          'element',
          `hasAttribute("${name}")`,
        );
        return runner as any;
      },
      attributeEquals(name: string, expected: string, msg?: string) {
        add(
          () => {
            const e = value as any;
            if (typeof Element === 'undefined' || !(e instanceof Element) || e.getAttribute(name) !== expected) throw new Error(msg ?? `Attr "${name}" != "${expected}"`);
          },
          'element',
          `attributeEquals("${name}","${expected}")`,
        );
        return runner as any;
      },
    } satisfies ElementOnlyChain);

  // Type guards (only on unknown)
  (runner as any).isNumber = (msg?: string) => {
    add(
      () => {
        if (typeof value !== 'number') throw new Error(msg ?? 'Expected number');
      },
      'number',
      'isNumber',
    );
    return toNumberChain();
  };

  (runner as any).isString = (msg?: string) => {
    add(
      () => {
        if (typeof value !== 'string') throw new Error(msg ?? 'Expected string');
      },
      'string',
      'isString',
    );
    return toStringChain();
  };

  (runner as any).isArray = (msg?: string) => {
    add(
      () => {
        if (!Array.isArray(value)) throw new Error(msg ?? 'Expected array');
      },
      'array',
      'isArray',
    );
    return toArrayChain();
  };

  (runner as any).isObject = (msg?: string) => {
    add(
      () => {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(msg ?? 'Expected object');
      },
      'object',
      'isObject',
    );
    return toObjectChain();
  };

  (runner as any).isElement = (msg?: string) => {
    add(
      () => {
        if (typeof Element === 'undefined' || !((value as any) instanceof Element)) throw new Error(msg ?? 'Expected Element');
      },
      'element',
      'isElement',
    );
    return toElementChain();
  };

  (runner as any).isBoolean = (msg?: string) => {
    add(
      () => {
        if (typeof value !== 'boolean') throw new Error(msg ?? 'Expected boolean');
      },
      'boolean',
      'isBoolean',
    );
    return runner as AssumptionFn<boolean, 'boolean'>;
  };

  // Nullish guards producing terminal states
  (runner as any).isNull = (msg?: string) => {
    add(
      () => {
        if (value !== null) throw new Error(msg ?? 'Expected null');
      },
      'null',
      'isNull',
    );
    return runner as AssumptionFn<null, 'null'>;
  };

  (runner as any).isUndefined = (msg?: string) => {
    add(
      () => {
        if (value !== undefined) throw new Error(msg ?? 'Expected undefined');
      },
      'undefined',
      'isUndefined',
    );
    return runner as AssumptionFn<undefined, 'undefined'>;
  };

  // Non‑nullish guards that KEEP other type guards (move to 'present')
  (runner as any).notNil = (msg?: string) => {
    add(
      () => {
        if (value === null || value === undefined) throw new Error(msg ?? 'Expected value (not null/undefined)');
      },
      'present',
      'notNil',
    );
    return runner as AssumptionFn<NonNullable<T>, 'present'>;
  };

  (runner as any).notNull = (msg?: string) => {
    add(
      () => {
        if (value === null) throw new Error(msg ?? 'Expected not null');
      },
      'present',
      'notNull',
    );
    return runner as AssumptionFn<Exclude<T, null>, 'present'>;
  };

  (runner as any).notNullOrUndefined = (msg?: string) => {
    add(
      () => {
        if (value === null || value === undefined) throw new Error(msg ?? 'Expected value (not null/undefined)');
      },
      'present',
      'notNullOrUndefined',
    );
    return runner as AssumptionFn<Exclude<T, null | undefined>, 'present'>;
  };

  return runner as AssumptionFn<T, 'unknown'>;
}

// Main exported functions
export function that<T>(value: T): AssumptionFn<T, 'unknown'> {
  return createAssumption<T>(value);
}

export function assume<T>(value: T): AssumptionFn<T, 'unknown'> {
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
  return (fn as any).displayName || fn.name || 'anonymous';
}

function enrichWithHandlerName(err: unknown, handler: Function): unknown {
  const name = getFnName(handler);
  if (err && typeof err === 'object') {
    try {
      // attach meta
      (err as any).handlerName = name;
      // prefix message for visibility
      if ((err as any).message && typeof (err as any).message === 'string') {
        (err as any).message = `[${name}] ${(err as any).message}`;
      }
    } catch {
      /* ignore */
    }
  }
  return err;
}

export function defRefHandler<R>(def: R, log: ((err: unknown) => void) | boolean = false) {
  return (err: unknown) => {
    console.error(err);
    enrichWithHandlerName(err, defRefHandler);
    if (log) (typeof log === 'function' ? log : console.error)(err);

    // Always return default - don't re-throw
    return def;
  };
}

export function defRefHandlerAsync<R>(def: R, log: ((err: unknown) => void) | boolean = false) {
  return async (err: unknown) => {
    enrichWithHandlerName(err, defRefHandlerAsync);
    console.error(err);
    if (log) (typeof log === 'function' ? log : console.error)(err);
    return def;
  };
}

export function assumedRoute<F extends AnyFn>(onRefuted: (err: unknown, ...args: Parameters<F>) => ReturnType<F>, handler: F) {
  return (...args: Parameters<F>): ReturnType<F> => {
    try {
      const result = handler(...args);
      if (result && typeof (result as any).then === 'function') {
        return (result as Promise<any>).catch((e) => onRefuted(enrichWithHandlerName(e, handler), ...args)) as ReturnType<F>;
      }
      return result as ReturnType<F>;
    } catch (e) {
      return onRefuted(enrichWithHandlerName(e, handler), ...args);
    }
  };
}

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

//
