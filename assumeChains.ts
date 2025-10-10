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
export class AssumeUnknownChain<T = unknown> {
  constructor(protected value: T) {}

  isObject(): AssumeObjectChain<Record<string, unknown>> {
    ObjectChecks.isObject(this.value);
    return new AssumeObjectChain(this.value as Record<string, unknown>);
  }
  isArray(): AssumeArrayChain<unknown[]> {
    ArrayChecks.isArray(this.value);
    return new AssumeArrayChain(this.value as unknown[]);
  }
  isElement(): AssumeElementChain<Element> {
    ElementChecks.isElement(this.value);
    return new AssumeElementChain(this.value as Element);
  }
  isFunction(): AssumeFunctionChain<(...args: any[]) => any> {
    CoreChecks.isFunction(this.value);
    return new AssumeFunctionChain(this.value as (...args: any[]) => any);
  }
  isPromise(): AssumePromiseChain<Promise<unknown>> {
    CoreChecks.isPromise(this.value);
    return new AssumePromiseChain(this.value as Promise<unknown>);
  }
}

export class AssumeObjectChain<
  T extends Record<string, unknown>
> extends AssumeUnknownChain<T> {
  hasKey<K extends string>(key: K): AssumeObjectChain<T & Record<K, unknown>> {
    ObjectChecks.hasKey(this.value, key);
    return new AssumeObjectChain(this.value as T & Record<K, unknown>);
  }
  hasKeys<K extends string>(
    ...keys: K[]
  ): AssumeObjectChain<T & Record<K, unknown>> {
    ObjectChecks.hasKeys(this.value, ...keys);
    return new AssumeObjectChain(this.value as T & Record<K, unknown>);
  }
  equalStringified(expected: string): AssumeObjectChain<T> {
    ObjectChecks.equalStringified(this.value, expected);
    return this;
  }
  sameKeys(expected: Record<string, unknown>): AssumeObjectChain<T> {
    ObjectChecks.sameKeys(this.value, expected);
    return this;
  }
  allKeysFalsey(): AssumeObjectChain<T> {
    ObjectChecks.allKeysFalsey(this.value);
    return this;
  }
  allKeysSet(): AssumeObjectChain<T> {
    ObjectChecks.allKeysSet(this.value);
    return this;
  }
  anyKeyNull(): AssumeObjectChain<T> {
    ObjectChecks.anyKeyNull(this.value);
    return this;
  }
}

export class AssumeArrayChain<
  T extends unknown[]
> extends AssumeUnknownChain<T> {
  hasLength(len: number): AssumeArrayChain<T> {
    ArrayChecks.hasLength(this.value, len);
    return this;
  }
  containsString(index: number): AssumeArrayChain<T> {
    ArrayChecks.containsString(this.value, index);
    return this;
  }
  containsNumber(index: number): AssumeArrayChain<T> {
    ArrayChecks.containsNumber(this.value, index);
    return this;
  }
  containsObject(index: number): AssumeArrayChain<T> {
    ArrayChecks.containsObject(this.value, index);
    return this;
  }
}

export class AssumeElementChain<
  T extends Element
> extends AssumeUnknownChain<T> {
  isVisible(): AssumeElementChain<T> {
    ElementChecks.isVisible(this.value);
    return this;
  }
  isHidden(): AssumeElementChain<T> {
    ElementChecks.isHidden(this.value);
    return this;
  }
  hasChild(): AssumeElementChain<T> {
    ElementChecks.hasChild(this.value);
    return this;
  }
  hasChildMatching(selector: string): AssumeElementChain<T> {
    ElementChecks.hasChildMatching(this.value, selector);
    return this;
  }
  hasDescendant(selector: string): AssumeElementChain<T> {
    ElementChecks.hasDescendant(this.value, selector);
    return this;
  }
  hasAttribute(name: string): AssumeElementChain<T> {
    ElementChecks.hasAttribute(this.value, name);
    return this;
  }
  attributeEquals(name: string, expected: string): AssumeElementChain<T> {
    ElementChecks.attributeEquals(this.value, name, expected);
    return this;
  }
  isHTMLElement(): AssumeElementChain<HTMLElement> {
    ElementChecks.isHTMLElement(this.value);
    return new AssumeElementChain(this.value as HTMLElement);
  }
}

export class AssumeFunctionChain<
  T extends (...args: any[]) => any
> extends AssumeUnknownChain<T> {
  // Add function-specific checks here if needed
}

export class AssumePromiseChain<
  T extends Promise<unknown>
> extends AssumeUnknownChain<T> {
  // Add promise-specific checks here if needed
}

// Entry point
export function Assume(v: unknown): AssumeUnknownChain<unknown> {
  return new AssumeUnknownChain(v);
}
