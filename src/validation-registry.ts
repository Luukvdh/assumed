// ============================================================================
// VALIDATION REGISTRY - Centralized collection of all validation checks
// ============================================================================

/**
 * Type tags for validation checks - mirrors the TypeTag from assume.ts
 */
export type ValidationTypeTag =
  | "string"
  | "number"
  | "boolean"
  | "array"
  | "object"
  | "null"
  | "undefined"
  | "unknown"
  | "element"
  | "function"
  | "datetime"
  | "promise";

/**
 * A validation check that can be applied to a value
 */
export type ValidationCheck = {
  name: string;
  typeTag: ValidationTypeTag;
  description: string;
  check: (value: unknown, ...args: any[]) => boolean;
  errorMessage?: string;
  examples?: unknown[];
};

/**
 * Core type validation checks
 */
export const TYPE_CHECKS: Set<ValidationCheck> = new Set([
  {
    name: "isString",
    typeTag: "string",
    description: "Validates value is a string",
    check: (value) => typeof value === "string",
    examples: ["hello", "world", ""],
  },
  {
    name: "isNumber",
    typeTag: "number",
    description: "Validates value is a number",
    check: (value) => typeof value === "number" && !isNaN(value),
    examples: [1, 2.5, 0, -10],
  },
  {
    name: "isBoolean",
    typeTag: "boolean",
    description: "Validates value is a boolean",
    check: (value) => typeof value === "boolean",
    examples: [true, false],
  },
  {
    name: "isArray",
    typeTag: "array",
    description: "Validates value is an array",
    check: (value) => Array.isArray(value),
    examples: [[], [1, 2, 3], ["a", "b"]],
  },
  {
    name: "isObject",
    typeTag: "object",
    description: "Validates value is a plain object",
    check: (value) =>
      typeof value === "object" && value !== null && !Array.isArray(value),
    examples: [{}, { key: "value" }, { a: 1, b: 2 }],
  },
  {
    name: "isNull",
    typeTag: "null",
    description: "Validates value is null",
    check: (value) => value === null,
    examples: [null],
  },
  {
    name: "isUndefined",
    typeTag: "undefined",
    description: "Validates value is undefined",
    check: (value) => value === undefined,
    examples: [undefined],
  },
]);

/**
 * String-specific validation checks
 */
export const STRING_CHECKS: Set<ValidationCheck> = new Set([
  {
    name: "notEmpty",
    typeTag: "string",
    description: "String is not empty",
    check: (value) => typeof value === "string" && value.length > 0,
    examples: ["hello", "a"],
  },
  {
    name: "hasLength",
    typeTag: "string",
    description: "String has specific length",
    check: (value, len) => typeof value === "string" && value.length === len,
    examples: ["hello"], // length 5
  },
  {
    name: "contains",
    typeTag: "string",
    description: "String contains substring or matches regex",
    check: (value, needle) => {
      if (typeof value !== "string") return false;
      return typeof needle === "string"
        ? value.includes(needle)
        : needle.test(value);
    },
    examples: ["hello world"], // contains 'world'
  },
  {
    name: "startsWith",
    typeTag: "string",
    description: "String starts with prefix",
    check: (value, prefix) =>
      typeof value === "string" && value.startsWith(prefix),
    examples: ["hello world"], // starts with 'hello'
  },
  {
    name: "endsWith",
    typeTag: "string",
    description: "String ends with suffix",
    check: (value, suffix) =>
      typeof value === "string" && value.endsWith(suffix),
    examples: ["hello world"], // ends with 'world'
  },
  {
    name: "isJSON",
    typeTag: "string",
    description: "String is valid JSON",
    check: (value) => {
      if (typeof value !== "string") return false;
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    },
    examples: ['{"key":"value"}', "[1,2,3]"],
  },
]);

/**
 * Number-specific validation checks
 */
export const NUMBER_CHECKS: Set<ValidationCheck> = new Set([
  {
    name: "greaterThan",
    typeTag: "number",
    description: "Number is greater than threshold",
    check: (value, threshold) => typeof value === "number" && value > threshold,
    examples: [10], // > 5
  },
  {
    name: "lessThan",
    typeTag: "number",
    description: "Number is less than threshold",
    check: (value, threshold) => typeof value === "number" && value < threshold,
    examples: [5], // < 10
  },
  {
    name: "between",
    typeTag: "number",
    description: "Number is between min and max (inclusive)",
    check: (value, min, max) =>
      typeof value === "number" && value >= min && value <= max,
    examples: [5], // between 1 and 10
  },
  {
    name: "isPositive",
    typeTag: "number",
    description: "Number is positive",
    check: (value) => typeof value === "number" && value > 0,
    examples: [1, 2.5, 100],
  },
  {
    name: "isNegative",
    typeTag: "number",
    description: "Number is negative",
    check: (value) => typeof value === "number" && value < 0,
    examples: [-1, -2.5, -100],
  },
]);

/**
 * Array-specific validation checks
 */
export const ARRAY_CHECKS: Set<ValidationCheck> = new Set([
  {
    name: "notEmpty",
    typeTag: "array",
    description: "Array is not empty",
    check: (value) => Array.isArray(value) && value.length > 0,
    examples: [[1], [1, 2, 3]],
  },
  {
    name: "hasLength",
    typeTag: "array",
    description: "Array has specific length",
    check: (value, len) => Array.isArray(value) && value.length === len,
    examples: [[1, 2]], // length 2
  },
  {
    name: "allNumbers",
    typeTag: "array",
    description: "All array elements are numbers",
    check: (value) =>
      Array.isArray(value) && value.every((item) => typeof item === "number"),
    examples: [
      [1, 2, 3],
      [1.5, 2.5],
    ],
  },
  {
    name: "allStrings",
    typeTag: "array",
    description: "All array elements are strings",
    check: (value) =>
      Array.isArray(value) && value.every((item) => typeof item === "string"),
    examples: [
      ["a", "b", "c"],
      ["hello", "world"],
    ],
  },
  {
    name: "allTruthy",
    typeTag: "array",
    description: "All array elements are truthy",
    check: (value) => Array.isArray(value) && value.every((item) => !!item),
    examples: [
      [1, 2, 3],
      ["a", "b"],
      [true, {}, []],
    ],
  },
  {
    name: "allFalsy",
    typeTag: "array",
    description: "All array elements are falsy",
    check: (value) => Array.isArray(value) && value.every((item) => !item),
    examples: [[false, 0, "", null, undefined]],
  },
]);

/**
 * Object-specific validation checks
 */
export const OBJECT_CHECKS: Set<ValidationCheck> = new Set([
  {
    name: "hasKey",
    typeTag: "object",
    description: "Object has specific key",
    check: (value, key) =>
      typeof value === "object" && value !== null && key in value,
    examples: [{ name: "John" }], // has key 'name'
  },
  {
    name: "hasKeys",
    typeTag: "object",
    description: "Object has all specified keys",
    check: (value, ...keys) => {
      if (typeof value !== "object" || value === null) return false;
      return keys.every((key) => key in value);
    },
    examples: [{ name: "John", age: 30 }], // has keys 'name' and 'age'
  },
  {
    name: "keyEquals",
    typeTag: "object",
    description: "Object key equals specific value",
    check: (value, key, expected) => {
      if (typeof value !== "object" || value === null) return false;
      return (value as any)[key] === expected;
    },
    examples: [{ name: "John" }], // name equals 'John'
  },
]);

/**
 * Advanced/experimental validation checks
 */
export const ADVANCED_CHECKS: Set<ValidationCheck> = new Set([
  {
    name: "isFunction",
    typeTag: "function",
    description: "Value is a function",
    check: (value) => typeof value === "function",
    examples: [() => {}, function () {}, console.log],
  },
  {
    name: "isPromise",
    typeTag: "promise",
    description: "Value is a Promise-like object",
    check: (value) =>
      value != null && typeof (value as any).then === "function",
    examples: [Promise.resolve(), new Promise(() => {})],
  },
  {
    name: "isElement",
    typeTag: "element",
    description: "Value is a DOM Element",
    check: (value) => {
      if (typeof Element === "undefined") return false;
      return value instanceof Element;
    },
    examples: [], // DOM elements, context-dependent
  },
  {
    name: "isHidden",
    typeTag: "element",
    description: "Element is hidden (display:none or visibility:hidden)",
    check: (value) => {
      if (typeof Element === "undefined" || !(value instanceof Element))
        return false;
      const computed =
        typeof window !== "undefined"
          ? window.getComputedStyle(value as Element)
          : null;
      return computed
        ? computed.display === "none" || computed.visibility === "hidden"
        : false;
    },
    examples: [], // Hidden DOM elements
  },
  {
    name: "isVisible",
    typeTag: "element",
    description: "Element is visible (not hidden)",
    check: (value) => {
      if (typeof Element === "undefined" || !(value instanceof Element))
        return false;
      const computed =
        typeof window !== "undefined"
          ? window.getComputedStyle(value as Element)
          : null;
      return computed
        ? computed.display !== "none" && computed.visibility !== "hidden"
        : true;
    },
    examples: [], // Visible DOM elements
  },
]);

/**
 * All validation checks organized by category
 */
export const ALL_CHECKS = {
  TYPE_CHECKS,
  STRING_CHECKS,
  NUMBER_CHECKS,
  ARRAY_CHECKS,
  OBJECT_CHECKS,
  ADVANCED_CHECKS,
};

/**
 * Flattened array of all checks for easy iteration
 */
export const ALL_CHECKS_FLAT: ValidationCheck[] = [
  ...TYPE_CHECKS,
  ...STRING_CHECKS,
  ...NUMBER_CHECKS,
  ...ARRAY_CHECKS,
  ...OBJECT_CHECKS,
  ...ADVANCED_CHECKS,
];

/**
 * Get all applicable checks for a given value
 */
export function getApplicableChecks(value: unknown): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  // Always add type checks
  checks.push(...TYPE_CHECKS);

  // Add specific checks based on detected type
  if (typeof value === "string") {
    checks.push(...STRING_CHECKS);
  }

  if (typeof value === "number") {
    checks.push(...NUMBER_CHECKS);
  }

  if (Array.isArray(value)) {
    checks.push(...ARRAY_CHECKS);
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    checks.push(...OBJECT_CHECKS);
  }

  // Add advanced checks
  checks.push(...ADVANCED_CHECKS);

  return checks;
}

/**
 * Find check by name
 */
export function findCheck(name: string): ValidationCheck | undefined {
  return ALL_CHECKS_FLAT.find((check) => check.name === name);
}

/**
 * Get checks by type tag
 */
export function getChecksByType(typeTag: string): ValidationCheck[] {
  return ALL_CHECKS_FLAT.filter((check) => check.typeTag === typeTag);
}
