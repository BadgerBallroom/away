import { useRef } from "react";

/** Checks whether the elements of `a` are equal to (and in the same order as) the elements of `b`. */
export function arraysEqual<T>(a: readonly T[], b: readonly T[]): boolean {
    if (a.length !== b.length) {
        return false;
    }

    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}

/**
 * Memoizes an array so that if an equal array is passed in, the old one is returned instead.
 * Normally, if you make two arrays, they will be different arrays:
 *
 *     ["foo", "bar", "baz"] !== ["foo", "bar", "baz"]
 *
 * With `useArray`, they will be the same array:
 *
 *     useArray(["foo", "bar", "baz"]) === useArray(["foo", "bar", "baz"])
 */
export function useArray<T>(a: readonly T[]): readonly T[] {
    const ref = useRef(a);
    if (arraysEqual(a, ref.current)) {
        return ref.current;
    }
    ref.current = a;
    return a;
}
