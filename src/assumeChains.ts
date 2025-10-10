// --- Core Checks ---
export type CoreChecksType = {
  that(cond: boolean, msg?: string): asserts cond;
  isTrue(cond: boolean, msg?: string): asserts cond;
  isFalse(cond: boolean, msg?: string): asserts cond is false;
  isFunction(v: unknown, msg?: string): asserts v is (...args: any[]) => any;
  isPromise(v: unknown, msg?: string): asserts v is Promise<unknown>;
  isInstanceOf<T>(v: unknown, ctor: new (...a: any[]) => T): asserts v is T;
};

// --- Object Checks ---
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
  allKeysSet(obj: unknown): asserts obj is Record<string, unknown>;
  anyKeyNull(obj: unknown): asserts obj is Record<string, null>;
};

// --- Array Checks ---
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

// --- Element Checks ---
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

type AssertionMap = {
  isObject: Record<string, unknown>;
  isArray: unknown[];
  isString: string;
};

type AssertionFns<T extends Record<string, any>> = {
  [K in keyof T]: (v: unknown, msg?: string) => asserts v is T[K];
};
type Assertions = AssertionFns<AssertionMap>;
// --- Use the type for your object ---
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
};

// -- Object checks with assertion signatures --
export const ObjectChecks: ObjectChecksType = {
  isObject(v: unknown, msg?: string): asserts v is Record<string, unknown> {
    if (typeof v !== "object" || v === null || Array.isArray(v))
      throw new Error(msg ?? "Expected object");
  },
  hasKey<T extends object, K extends string>(
    obj: T,
    key: K,
    msg?: string
  ): asserts obj is T & Record<K, unknown> {
    if (!(key in obj))
      throw new Error(msg ?? `Expected object with key "${key}"`);
  },
  hasKeys<T extends object, K extends string>(
    obj: T,
    ...keys: K[]
  ): asserts obj is T & Record<K, unknown> {
    for (const key of keys) {
      if (!(key in obj)) throw new Error(`Expected object with key "${key}"`);
    }
  },
  equalStringified(obj: unknown, expected: string): void {
    if (JSON.stringify(obj) !== expected)
      throw new Error(`Expected object to equal stringified version`);
  },
  sameKeys(obj: unknown, expected: Record<string, unknown>): void {
    if (typeof obj !== "object" || obj === null)
      throw new Error("Expected object");
    const objKeys = Object.keys(obj);
    const expectedKeys = Object.keys(expected);
    if (objKeys.length !== expectedKeys.length)
      throw new Error("Expected object to have same number of keys");
    for (const key of expectedKeys) {
      if (!(key in (obj as object)))
        throw new Error(`Expected object to have key "${key}"`);
    }
  },
  allKeysFalsey(
    obj: unknown
  ): asserts obj is Record<string, null | undefined | false | 0 | ""> {
    if (typeof obj !== "object" || obj === null)
      throw new Error("Expected object");
    for (const key in obj) {
      if ((obj as Record<string, unknown>)[key])
        throw new Error(`Expected key "${key}" to be falsy`);
    }
  },
  allKeysSet(obj: unknown): asserts obj is Record<string, unknown> {
    if (typeof obj !== "object" || obj === null)
      throw new Error("Expected object");
    for (const key in obj) {
      if ((obj as Record<string, unknown>)[key] === undefined)
        throw new Error(`Expected key "${key}" to be set`);
    }
  },
  anyKeyNull(obj: unknown): asserts obj is Record<string, null> {
    if (typeof obj !== "object" || obj === null)
      throw new Error("Expected object");
    let foundNull = false;
    for (const key in obj) {
      if ((obj as Record<string, unknown>)[key] === null) foundNull = true;
    }
    if (!foundNull) throw new Error("Expected at least one key to be null");
  },
};

// -- Array checks with assertion signatures --
export const ArrayChecks: ArrayChecksType = {
  isArray(v: unknown, msg?: string): asserts v is unknown[] {
    if (!Array.isArray(v)) throw new Error(msg ?? "Expected array");
  },
  hasLength<T extends unknown[]>(
    arr: T,
    len: number,
    msg?: string
  ): asserts arr is { length: typeof len } & T {
    if (arr.length !== len)
      throw new Error(msg ?? `Expected array of length ${len}`);
  },
  containsString(
    arr: unknown[],
    index: number
  ): asserts arr is { [K in typeof index]: string } & unknown[] {
    if (typeof arr[index] !== "string")
      throw new Error(`Expected string at index ${index}`);
  },
  containsNumber(
    arr: unknown[],
    index: number
  ): asserts arr is { [K in typeof index]: number } & unknown[] {
    if (typeof arr[index] !== "number")
      throw new Error(`Expected number at index ${index}`);
  },
  containsObject(
    arr: unknown[],
    index: number
  ): asserts arr is { [K in typeof index]: object } & unknown[] {
    if (typeof arr[index] !== "object" || arr[index] === null)
      throw new Error(`Expected object at index ${index}`);
  },
};

// -- Element/HTML checks with assertion signatures --
export const ElementChecks: ElementChecksType = {
  isElement(v: unknown, msg?: string): asserts v is Element {
    if (!(v instanceof Element)) throw new Error(msg ?? "Expected DOM Element");
  },
  isHTMLElement(v: unknown, msg?: string): asserts v is HTMLElement {
    if (!(v instanceof HTMLElement))
      throw new Error(msg ?? "Expected HTMLElement");
  },
  isHidden(el: unknown, msg?: string): asserts el is Element {
    if (!(el instanceof Element)) throw new Error(msg ?? "Expected Element");
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
  isVisible(el: unknown, msg?: string): asserts el is Element {
    if (!(el instanceof Element)) throw new Error(msg ?? "Expected Element");
    const e = el as Element;
    const computed =
      typeof window !== "undefined" ? window.getComputedStyle(e) : null;
    const visible = computed
      ? computed.display !== "none" && computed.visibility !== "hidden"
      : true;
    if (!visible) throw new Error(msg ?? "Expected element to be visible");
  },
  hasChild(el: unknown, msg?: string): asserts el is Element {
    if (!(el instanceof Element)) throw new Error(msg ?? "Expected Element");
    if ((el as Element).childElementCount === 0)
      throw new Error(
        msg ?? "Expected element to have at least one child element"
      );
  },
  hasChildMatching(el: unknown, selector: string): asserts el is Element {
    if (!(el instanceof Element)) throw new Error("Expected Element");
    if (!(el as Element).querySelector(selector))
      throw new Error(`Expected child matching selector "${selector}"`);
  },
  hasDescendant(el: unknown, selector: string): asserts el is Element {
    if (!(el instanceof Element)) throw new Error("Expected Element");
    if (!(el as Element).querySelector(selector))
      throw new Error(`Expected descendant matching selector "${selector}"`);
  },
  hasAttribute(el: unknown, name: string): asserts el is Element {
    if (!(el instanceof Element)) throw new Error("Expected Element");
    if (!(el as Element).hasAttribute(name))
      throw new Error(`Expected element to have attribute "${name}"`);
  },
  attributeEquals(
    el: unknown,
    name: string,
    expected: string
  ): asserts el is Element {
    if (!(el instanceof Element)) throw new Error("Expected Element");
    if ((el as Element).getAttribute(name) !== expected)
      throw new Error(`Expected attribute "${name}" to equal "${expected}"`);
  },
};

// -- Chain Classes with explicit type narrowing --

// Utility to get the type name for error messages
function getTypeName(val: unknown): string {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'Array';
  if (typeof val === 'object') return val.constructor?.name || 'Object';
  return typeof val;
}

export class AssumeChain<T> {
  constructor(protected value: T) {}

  // --- Object-related methods ---
  hasKey<K extends string>(key: K): AssumeChain<T & Record<K, unknown>> {
    if (typeof this.value !== 'object' || this.value === null) {
      throw new Error(`Assumption failed: value is not an object (actual type: ${getTypeName(this.value)})`);
    }
    if (!(key in this.value)) {
      throw new Error(`Assumption failed: object does not have key "${key}"`);
    }
    return new AssumeChain(this.value as T & Record<K, unknown>);
  }

  hasKeys<K extends string>(...keys: K[]): AssumeChain<T & Record<K, unknown>> {
    if (typeof this.value !== 'object' || this.value === null) {
      throw new Error(`Assumption failed: value is not an object (actual type: ${getTypeName(this.value)})`);
    }
    for (const key of keys) {
      if (!(key in this.value)) {
        throw new Error(`Assumption failed: object does not have key "${key}"`);
      }
    }
    return new AssumeChain(this.value as T & Record<K, unknown>);
  }

  equalStringified(expected: string): AssumeChain<T> {
    if (JSON.stringify(this.value) !== expected) {
      throw new Error(`Assumption failed: stringified value does not match expected string`);
    }
    return this;
  }

  sameKeys(expected: Record<string, unknown>): AssumeChain<T> {
    if (typeof this.value !== 'object' || this.value === null) {
      throw new Error(`Assumption failed: value is not an object (actual type: ${getTypeName(this.value)})`);
    }
    const objKeys = Object.keys(this.value);
    const expectedKeys = Object.keys(expected);
    if (objKeys.length !== expectedKeys.length) {
      throw new Error('Assumption failed: object does not have the same number of keys as expected');
    }
    for (const key of expectedKeys) {
      if (!(key in (this.value as object))) {
        throw new Error(`Assumption failed: object does not have key "${key}"`);
      }
    }
    return this;
  }

  allKeysFalsey(): AssumeChain<T> {
    if (typeof this.value !== 'object' || this.value === null) {
      throw new Error(`Assumption failed: value is not an object (actual type: ${getTypeName(this.value)})`);
    }
    for (const key in this.value) {
      if ((this.value as Record<string, unknown>)[key]) {
        throw new Error(`Assumption failed: key "${key}" is not falsy`);
      }
    }
    return this;
  }

  allKeysSet(): AssumeChain<T> {
    if (typeof this.value !== 'object' || this.value === null) {
      throw new Error(`Assumption failed: value is not an object (actual type: ${getTypeName(this.value)})`);
    }
    for (const key in this.value) {
      if ((this.value as Record<string, unknown>)[key] === undefined) {
        throw new Error(`Assumption failed: key "${key}" is not set`);
      }
    }
    return this;
  }

  anyKeyNull(): AssumeChain<T> {
    if (typeof this.value !== 'object' || this.value === null) {
      throw new Error(`Assumption failed: value is not an object (actual type: ${getTypeName(this.value)})`);
    }
    let foundNull = false;
    for (const key in this.value) {
      if ((this.value as Record<string, unknown>)[key] === null) foundNull = true;
    }
    if (!foundNull) {
      throw new Error('Assumption failed: no key is null');
    }
    return this;
  }

  // --- Array-related methods ---
  isArray(): AssumeChain<unknown[]> {
    if (!Array.isArray(this.value)) {
      throw new Error(`Assumption failed: value is not an array (actual type: ${getTypeName(this.value)})`);
    }
    return new AssumeChain(this.value as unknown[]);
  }

  hasLength(len: number): AssumeChain<T> {
    if (!Array.isArray(this.value)) {
      throw new Error(`Assumption failed: value is not an array (actual type: ${getTypeName(this.value)})`);
    }
    if ((this.value as unknown[]).length !== len) {
      throw new Error(`Assumption failed: array does not have length ${len}`);
    }
    return this;
  }

  containsString(index: number): AssumeChain<T> {
    if (!Array.isArray(this.value)) {
      throw new Error(`Assumption failed: value is not an array (actual type: ${getTypeName(this.value)})`);
    }
    if (typeof (this.value as unknown[])[index] !== 'string') {
      throw new Error(`Assumption failed: array at index ${index} is not a string`);
    }
    return this;
  }

  containsNumber(index: number): AssumeChain<T> {
    if (!Array.isArray(this.value)) {
      throw new Error(`Assumption failed: value is not an array (actual type: ${getTypeName(this.value)})`);
    }
    if (typeof (this.value as unknown[])[index] !== 'number') {
      throw new Error(`Assumption failed: array at index ${index} is not a number`);
    }
    return this;
  }

  containsObject(index: number): AssumeChain<T> {
    if (!Array.isArray(this.value)) {
      throw new Error(`Assumption failed: value is not an array (actual type: ${getTypeName(this.value)})`);
    }
    if (typeof (this.value as unknown[])[index] !== 'object' || (this.value as unknown[])[index] === null) {
      throw new Error(`Assumption failed: array at index ${index} is not an object`);
    }
    return this;
  }

  // --- Element-related methods ---
  isElement(): AssumeChain<Element> {
    if (!(this.value instanceof Element)) {
      throw new Error(`Assumption failed: value is not a DOM Element (actual type: ${getTypeName(this.value)})`);
    }
    return new AssumeChain(this.value as Element);
  }

  isHTMLElement(): AssumeChain<HTMLElement> {
    if (!(this.value instanceof HTMLElement)) {
      throw new Error(`Assumption failed: value is not an HTMLElement (actual type: ${getTypeName(this.value)})`);
    }
    return new AssumeChain(this.value as HTMLElement);
  }

  isVisible(): AssumeChain<T> {
    if (!(this.value instanceof Element)) {
      throw new Error(`Assumption failed: value is not a DOM Element (actual type: ${getTypeName(this.value)})`);
    }
    const e = this.value as Element;
    const computed = typeof window !== 'undefined' ? window.getComputedStyle(e) : null;
    const visible = computed ? computed.display !== 'none' && computed.visibility !== 'hidden' : true;
    if (!visible) {
      throw new Error('Assumption failed: element is not visible');
    }
    return this;
  }

  isHidden(): AssumeChain<T> {
    if (!(this.value instanceof Element)) {
      throw new Error(`Assumption failed: value is not a DOM Element (actual type: ${getTypeName(this.value)})`);
    }
    const e = this.value as Element;
    const hiddenAttr = e.getAttribute?.('hidden') != null;
    const computed = typeof window !== 'undefined' ? window.getComputedStyle(e) : null;
    const hiddenByCss = computed ? computed.display === 'none' || computed.visibility === 'hidden' : false;
    if (!hiddenAttr && !hiddenByCss) {
      throw new Error('Assumption failed: element is not hidden');
    }
    return this;
  }

  hasChild(): AssumeChain<T> {
    if (!(this.value instanceof Element)) {
      throw new Error(`Assumption failed: value is not a DOM Element (actual type: ${getTypeName(this.value)})`);
    }
    if ((this.value as Element).childElementCount === 0) {
      throw new Error('Assumption failed: element does not have any child elements');
    }
    return this;
  }

  hasChildMatching(selector: string): AssumeChain<T> {
    if (!(this.value instanceof Element)) {
      throw new Error(`Assumption failed: value is not a DOM Element (actual type: ${getTypeName(this.value)})`);
    }
    if (!(this.value as Element).querySelector(selector)) {
      throw new Error(`Assumption failed: element does not have a child matching selector "${selector}"`);
    }
    return this;
  }

  hasDescendant(selector: string): AssumeChain<T> {
    if (!(this.value instanceof Element)) {
      throw new Error(`Assumption failed: value is not a DOM Element (actual type: ${getTypeName(this.value)})`);
    }
    if (!(this.value as Element).querySelector(selector)) {
      throw new Error(`Assumption failed: element does not have a descendant matching selector "${selector}"`);
    }
    return this;
  }

  hasAttribute(name: string): AssumeChain<T> {
    if (!(this.value instanceof Element)) {
      throw new Error(`Assumption failed: value is not a DOM Element (actual type: ${getTypeName(this.value)})`);
    }
    if (!(this.value as Element).hasAttribute(name)) {
      throw new Error(`Assumption failed: element does not have attribute "${name}"`);
    }
    return this;
  }

  attributeEquals(name: string, expected: string): AssumeChain<T> {
    if (!(this.value instanceof Element)) {
      throw new Error(`Assumption failed: value is not a DOM Element (actual type: ${getTypeName(this.value)})`);
    }
    if ((this.value as Element).getAttribute(name) !== expected) {
      throw new Error(`Assumption failed: attribute "${name}" does not equal "${expected}"`);
    }
    return this;
  }

  // --- Function-related methods ---
  isFunction(): AssumeChain<(...args: any[]) => any> {
    if (typeof this.value !== 'function') {
      throw new Error(`Assumption failed: value is not a function (actual type: ${getTypeName(this.value)})`);
    }
    return new AssumeChain(this.value as (...args: any[]) => any);
  }

  isPromise(): AssumeChain<Promise<unknown>> {
    if (!(this.value instanceof Promise)) {
      throw new Error(`Assumption failed: value is not a Promise (actual type: ${getTypeName(this.value)})`);
    }
    return new AssumeChain(this.value as Promise<unknown>);
  }

  // --- General assertion methods ---
  that(cond: boolean, msg?: string): AssumeChain<T> {
    if (!cond) {
      throw new Error(msg ?? 'Assumption failed: condition is false');
    }
    return this;
  }

  isTrue(msg?: string): AssumeChain<T> {
    if (!this.value) {
      throw new Error(msg ?? 'Assumption failed: value is not true');
    }
    return this;
  }

  isFalse(msg?: string): AssumeChain<T> {
    if (this.value) {
      throw new Error(msg ?? 'Assumption failed: value is not false');
    }
    return this;
  }

  // --- Value access ---
  valueOf(): T {
    return this.value;
  }
}

// Entry point
export function Assume(v: unknown): AssumeChain<unknown> {
  return new AssumeChain(v);
}
