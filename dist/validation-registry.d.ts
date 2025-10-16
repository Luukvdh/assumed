/**
 * Type tags for validation checks - mirrors the TypeTag from assume.ts
 */
export type ValidationTypeTag = "string" | "number" | "boolean" | "array" | "object" | "null" | "undefined" | "unknown" | "element" | "function" | "datetime" | "promise";
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
export declare const TYPE_CHECKS: Set<ValidationCheck>;
/**
 * String-specific validation checks
 */
export declare const STRING_CHECKS: Set<ValidationCheck>;
/**
 * Number-specific validation checks
 */
export declare const NUMBER_CHECKS: Set<ValidationCheck>;
/**
 * Array-specific validation checks
 */
export declare const ARRAY_CHECKS: Set<ValidationCheck>;
/**
 * Object-specific validation checks
 */
export declare const OBJECT_CHECKS: Set<ValidationCheck>;
/**
 * Advanced/experimental validation checks
 */
export declare const ADVANCED_CHECKS: Set<ValidationCheck>;
/**
 * All validation checks organized by category
 */
export declare const ALL_CHECKS: {
    TYPE_CHECKS: Set<ValidationCheck>;
    STRING_CHECKS: Set<ValidationCheck>;
    NUMBER_CHECKS: Set<ValidationCheck>;
    ARRAY_CHECKS: Set<ValidationCheck>;
    OBJECT_CHECKS: Set<ValidationCheck>;
    ADVANCED_CHECKS: Set<ValidationCheck>;
};
/**
 * Flattened array of all checks for easy iteration
 */
export declare const ALL_CHECKS_FLAT: ValidationCheck[];
/**
 * Get all applicable checks for a given value
 */
export declare function getApplicableChecks(value: unknown): ValidationCheck[];
/**
 * Find check by name
 */
export declare function findCheck(name: string): ValidationCheck | undefined;
/**
 * Get checks by type tag
 */
export declare function getChecksByType(typeTag: string): ValidationCheck[];
//# sourceMappingURL=validation-registry.d.ts.map