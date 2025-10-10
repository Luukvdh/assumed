// --- Use the type for your object ---
export const CoreChecks = {
    that(cond, msg) {
        if (!cond)
            throw new Error(msg ?? "(assumption failed)");
    },
    isTrue(cond, msg) {
        if (!cond)
            throw new Error(msg ?? "(assumption failed: expected true)");
    },
    isFalse(cond, msg) {
        if (cond)
            throw new Error(msg ?? "(assumption failed: expected false)");
    },
    isFunction(v, msg) {
        if (typeof v !== "function")
            throw new Error(msg ?? "Expected function");
    },
    isPromise(v, msg) {
        if (!(v instanceof Promise))
            throw new Error(msg ?? "Expected Promise");
    },
    isInstanceOf(v, ctor) {
        if (!(v instanceof ctor))
            throw new Error(`Expected instance of ${ctor.name || "constructor"}`);
    },
};
// -- Object checks with assertion signatures --
export const ObjectChecks = {
    isObject(v, msg) {
        if (typeof v !== "object" || v === null || Array.isArray(v))
            throw new Error(msg ?? "Expected object");
    },
    hasKey(obj, key, msg) {
        if (!(key in obj))
            throw new Error(msg ?? `Expected object with key "${key}"`);
    },
    hasKeys(obj, ...keys) {
        for (const key of keys) {
            if (!(key in obj))
                throw new Error(`Expected object with key "${key}"`);
        }
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
        for (const key of expectedKeys) {
            if (!(key in obj))
                throw new Error(`Expected object to have key "${key}"`);
        }
    },
    allKeysFalsey(obj) {
        if (typeof obj !== "object" || obj === null)
            throw new Error("Expected object");
        for (const key in obj) {
            if (obj[key])
                throw new Error(`Expected key "${key}" to be falsy`);
        }
    },
    allKeysSet(obj) {
        if (typeof obj !== "object" || obj === null)
            throw new Error("Expected object");
        for (const key in obj) {
            if (obj[key] === undefined)
                throw new Error(`Expected key "${key}" to be set`);
        }
    },
    anyKeyNull(obj) {
        if (typeof obj !== "object" || obj === null)
            throw new Error("Expected object");
        let foundNull = false;
        for (const key in obj) {
            if (obj[key] === null)
                foundNull = true;
        }
        if (!foundNull)
            throw new Error("Expected at least one key to be null");
    },
};
// -- Array checks with assertion signatures --
export const ArrayChecks = {
    isArray(v, msg) {
        if (!Array.isArray(v))
            throw new Error(msg ?? "Expected array");
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
// -- Element/HTML checks with assertion signatures --
export const ElementChecks = {
    isElement(v, msg) {
        if (!(v instanceof Element))
            throw new Error(msg ?? "Expected DOM Element");
    },
    isHTMLElement(v, msg) {
        if (!(v instanceof HTMLElement))
            throw new Error(msg ?? "Expected HTMLElement");
    },
    isHidden(el, msg) {
        if (!(el instanceof Element))
            throw new Error(msg ?? "Expected Element");
        const e = el;
        const hiddenAttr = e.getAttribute?.("hidden") != null;
        const computed = typeof window !== "undefined" ? window.getComputedStyle(e) : null;
        const hiddenByCss = computed
            ? computed.display === "none" || computed.visibility === "hidden"
            : false;
        if (!hiddenAttr && !hiddenByCss)
            throw new Error(msg ?? "Expected element to be hidden");
    },
    isVisible(el, msg) {
        if (!(el instanceof Element))
            throw new Error(msg ?? "Expected Element");
        const e = el;
        const computed = typeof window !== "undefined" ? window.getComputedStyle(e) : null;
        const visible = computed
            ? computed.display !== "none" && computed.visibility !== "hidden"
            : true;
        if (!visible)
            throw new Error(msg ?? "Expected element to be visible");
    },
    hasChild(el, msg) {
        if (!(el instanceof Element))
            throw new Error(msg ?? "Expected Element");
        if (el.childElementCount === 0)
            throw new Error(msg ?? "Expected element to have at least one child element");
    },
    hasChildMatching(el, selector) {
        if (!(el instanceof Element))
            throw new Error("Expected Element");
        if (!el.querySelector(selector))
            throw new Error(`Expected child matching selector "${selector}"`);
    },
    hasDescendant(el, selector) {
        if (!(el instanceof Element))
            throw new Error("Expected Element");
        if (!el.querySelector(selector))
            throw new Error(`Expected descendant matching selector "${selector}"`);
    },
    hasAttribute(el, name) {
        if (!(el instanceof Element))
            throw new Error("Expected Element");
        if (!el.hasAttribute(name))
            throw new Error(`Expected element to have attribute "${name}"`);
    },
    attributeEquals(el, name, expected) {
        if (!(el instanceof Element))
            throw new Error("Expected Element");
        if (el.getAttribute(name) !== expected)
            throw new Error(`Expected attribute "${name}" to equal "${expected}"`);
    },
};
// -- Chain Classes with explicit type narrowing --
// Utility to get the type name for error messages
function getTypeName(val) {
    if (val === null)
        return 'null';
    if (Array.isArray(val))
        return 'Array';
    if (typeof val === 'object')
        return val.constructor?.name || 'Object';
    return typeof val;
}
export class AssumeChain {
    value;
    constructor(value) {
        this.value = value;
    }
    // --- Object-related methods ---
    hasKey(key) {
        if (typeof this.value !== 'object' || this.value === null) {
            throw new Error(`Assumption failed: value is not an object (actual type: ${getTypeName(this.value)})`);
        }
        if (!(key in this.value)) {
            throw new Error(`Assumption failed: object does not have key "${key}"`);
        }
        return new AssumeChain(this.value);
    }
    hasKeys(...keys) {
        if (typeof this.value !== 'object' || this.value === null) {
            throw new Error(`Assumption failed: value is not an object (actual type: ${getTypeName(this.value)})`);
        }
        for (const key of keys) {
            if (!(key in this.value)) {
                throw new Error(`Assumption failed: object does not have key "${key}"`);
            }
        }
        return new AssumeChain(this.value);
    }
    equalStringified(expected) {
        if (JSON.stringify(this.value) !== expected) {
            throw new Error(`Assumption failed: stringified value does not match expected string`);
        }
        return this;
    }
    sameKeys(expected) {
        if (typeof this.value !== 'object' || this.value === null) {
            throw new Error(`Assumption failed: value is not an object (actual type: ${getTypeName(this.value)})`);
        }
        const objKeys = Object.keys(this.value);
        const expectedKeys = Object.keys(expected);
        if (objKeys.length !== expectedKeys.length) {
            throw new Error('Assumption failed: object does not have the same number of keys as expected');
        }
        for (const key of expectedKeys) {
            if (!(key in this.value)) {
                throw new Error(`Assumption failed: object does not have key "${key}"`);
            }
        }
        return this;
    }
    allKeysFalsey() {
        if (typeof this.value !== 'object' || this.value === null) {
            throw new Error(`Assumption failed: value is not an object (actual type: ${getTypeName(this.value)})`);
        }
        for (const key in this.value) {
            if (this.value[key]) {
                throw new Error(`Assumption failed: key "${key}" is not falsy`);
            }
        }
        return this;
    }
    allKeysSet() {
        if (typeof this.value !== 'object' || this.value === null) {
            throw new Error(`Assumption failed: value is not an object (actual type: ${getTypeName(this.value)})`);
        }
        for (const key in this.value) {
            if (this.value[key] === undefined) {
                throw new Error(`Assumption failed: key "${key}" is not set`);
            }
        }
        return this;
    }
    anyKeyNull() {
        if (typeof this.value !== 'object' || this.value === null) {
            throw new Error(`Assumption failed: value is not an object (actual type: ${getTypeName(this.value)})`);
        }
        let foundNull = false;
        for (const key in this.value) {
            if (this.value[key] === null)
                foundNull = true;
        }
        if (!foundNull) {
            throw new Error('Assumption failed: no key is null');
        }
        return this;
    }
    // --- Array-related methods ---
    isArray() {
        if (!Array.isArray(this.value)) {
            throw new Error(`Assumption failed: value is not an array (actual type: ${getTypeName(this.value)})`);
        }
        return new AssumeChain(this.value);
    }
    hasLength(len) {
        if (!Array.isArray(this.value)) {
            throw new Error(`Assumption failed: value is not an array (actual type: ${getTypeName(this.value)})`);
        }
        if (this.value.length !== len) {
            throw new Error(`Assumption failed: array does not have length ${len}`);
        }
        return this;
    }
    containsString(index) {
        if (!Array.isArray(this.value)) {
            throw new Error(`Assumption failed: value is not an array (actual type: ${getTypeName(this.value)})`);
        }
        if (typeof this.value[index] !== 'string') {
            throw new Error(`Assumption failed: array at index ${index} is not a string`);
        }
        return this;
    }
    containsNumber(index) {
        if (!Array.isArray(this.value)) {
            throw new Error(`Assumption failed: value is not an array (actual type: ${getTypeName(this.value)})`);
        }
        if (typeof this.value[index] !== 'number') {
            throw new Error(`Assumption failed: array at index ${index} is not a number`);
        }
        return this;
    }
    containsObject(index) {
        if (!Array.isArray(this.value)) {
            throw new Error(`Assumption failed: value is not an array (actual type: ${getTypeName(this.value)})`);
        }
        if (typeof this.value[index] !== 'object' || this.value[index] === null) {
            throw new Error(`Assumption failed: array at index ${index} is not an object`);
        }
        return this;
    }
    // --- Element-related methods ---
    isElement() {
        if (!(this.value instanceof Element)) {
            throw new Error(`Assumption failed: value is not a DOM Element (actual type: ${getTypeName(this.value)})`);
        }
        return new AssumeChain(this.value);
    }
    isHTMLElement() {
        if (!(this.value instanceof HTMLElement)) {
            throw new Error(`Assumption failed: value is not an HTMLElement (actual type: ${getTypeName(this.value)})`);
        }
        return new AssumeChain(this.value);
    }
    isVisible() {
        if (!(this.value instanceof Element)) {
            throw new Error(`Assumption failed: value is not a DOM Element (actual type: ${getTypeName(this.value)})`);
        }
        const e = this.value;
        const computed = typeof window !== 'undefined' ? window.getComputedStyle(e) : null;
        const visible = computed ? computed.display !== 'none' && computed.visibility !== 'hidden' : true;
        if (!visible) {
            throw new Error('Assumption failed: element is not visible');
        }
        return this;
    }
    isHidden() {
        if (!(this.value instanceof Element)) {
            throw new Error(`Assumption failed: value is not a DOM Element (actual type: ${getTypeName(this.value)})`);
        }
        const e = this.value;
        const hiddenAttr = e.getAttribute?.('hidden') != null;
        const computed = typeof window !== 'undefined' ? window.getComputedStyle(e) : null;
        const hiddenByCss = computed ? computed.display === 'none' || computed.visibility === 'hidden' : false;
        if (!hiddenAttr && !hiddenByCss) {
            throw new Error('Assumption failed: element is not hidden');
        }
        return this;
    }
    hasChild() {
        if (!(this.value instanceof Element)) {
            throw new Error(`Assumption failed: value is not a DOM Element (actual type: ${getTypeName(this.value)})`);
        }
        if (this.value.childElementCount === 0) {
            throw new Error('Assumption failed: element does not have any child elements');
        }
        return this;
    }
    hasChildMatching(selector) {
        if (!(this.value instanceof Element)) {
            throw new Error(`Assumption failed: value is not a DOM Element (actual type: ${getTypeName(this.value)})`);
        }
        if (!this.value.querySelector(selector)) {
            throw new Error(`Assumption failed: element does not have a child matching selector "${selector}"`);
        }
        return this;
    }
    hasDescendant(selector) {
        if (!(this.value instanceof Element)) {
            throw new Error(`Assumption failed: value is not a DOM Element (actual type: ${getTypeName(this.value)})`);
        }
        if (!this.value.querySelector(selector)) {
            throw new Error(`Assumption failed: element does not have a descendant matching selector "${selector}"`);
        }
        return this;
    }
    hasAttribute(name) {
        if (!(this.value instanceof Element)) {
            throw new Error(`Assumption failed: value is not a DOM Element (actual type: ${getTypeName(this.value)})`);
        }
        if (!this.value.hasAttribute(name)) {
            throw new Error(`Assumption failed: element does not have attribute "${name}"`);
        }
        return this;
    }
    attributeEquals(name, expected) {
        if (!(this.value instanceof Element)) {
            throw new Error(`Assumption failed: value is not a DOM Element (actual type: ${getTypeName(this.value)})`);
        }
        if (this.value.getAttribute(name) !== expected) {
            throw new Error(`Assumption failed: attribute "${name}" does not equal "${expected}"`);
        }
        return this;
    }
    // --- Function-related methods ---
    isFunction() {
        if (typeof this.value !== 'function') {
            throw new Error(`Assumption failed: value is not a function (actual type: ${getTypeName(this.value)})`);
        }
        return new AssumeChain(this.value);
    }
    isPromise() {
        if (!(this.value instanceof Promise)) {
            throw new Error(`Assumption failed: value is not a Promise (actual type: ${getTypeName(this.value)})`);
        }
        return new AssumeChain(this.value);
    }
    // --- General assertion methods ---
    that(cond, msg) {
        if (!cond) {
            throw new Error(msg ?? 'Assumption failed: condition is false');
        }
        return this;
    }
    isTrue(msg) {
        if (!this.value) {
            throw new Error(msg ?? 'Assumption failed: value is not true');
        }
        return this;
    }
    isFalse(msg) {
        if (this.value) {
            throw new Error(msg ?? 'Assumption failed: value is not false');
        }
        return this;
    }
    // --- Value access ---
    valueOf() {
        return this.value;
    }
}
// Entry point
export function Assume(v) {
    return new AssumeChain(v);
}
