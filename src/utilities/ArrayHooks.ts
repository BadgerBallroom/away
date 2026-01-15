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
 * Tracks the index of `value` in `array`. If `value` is removed from the array, `setValue` is called with a valid value
 * from the array. This will usually be the value that was before `value` in the array. `setValue` is called from a
 * timer so that it is not called during a React component's render.
 * @param value The value to check is in `array`
 * @param array The array of valid values
 * @param setValue A function that sets `value`
 * @returns `value` if it is in `array`, else the value with which `setValue` will be called
 */
export function useValueInArray<T>(value: T, array: readonly T[], setValue: (value: T) => void): T | undefined {
    const lastValidIndex = useRef(0);

    const currentIndex = array.indexOf(value);
    if (currentIndex === -1) {
        if (lastValidIndex.current !== -1 && array.length) {
            let newIndex = lastValidIndex.current - 1;
            if (newIndex < 0) {
                newIndex = 0;
            } else if (newIndex >= array.length) {
                newIndex = array.length - 1;
            }

            const newValue = array[newIndex];
            setTimeout(() => setValue(newValue), 0);
            return newValue;
        }
        return undefined;
    }

    lastValidIndex.current = currentIndex;
    return value;
}
