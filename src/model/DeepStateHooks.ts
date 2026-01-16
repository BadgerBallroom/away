import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { DeepStateBase, DeepStateObject } from "./DeepState";

/**
 * Returns the value in the given `DeepStateBase`. If the value is an array or object, it is reconstructed when any
 * nested value changes, thereby triggering a re-render.
 * @param deepState A `DeepStateBase`
 * @param path An empty array
 * @param ignoreDescendants Whether to ignore changes that were not initiated directly on the value
 * @returns The value in the `DeepStateBase`
 */
export function useDeepState<T>(
    deepState: DeepStateBase<T>,
    path: readonly [],
    ignoreDescendants?: boolean,
): T;
/**
 * Returns an element of the given `DeepStateArray`. If the element itself is an array or an object, it is
 * reconstructed when any nested value changes, thereby triggering a re-render.
 * @param deepState A `DeepStateArray`
 * @param path An array with a single element: the index of the element in the `DeepStateArray`
 * @param ignoreDescendants Whether to ignore changes that were not initiated directly on the value
 * @returns The element in the `DeepStateArray`
 */
export function useDeepState<Item>(
    deepState: DeepStateBase<Item[]>,
    path: readonly [number],
    ignoreDescendants?: boolean,
): Item;
/**
 * Returns the value for the given key in the `DeepStateObject`. If the value itself is an array or an object, it is
 * reconstructed when any nested value changes, thereby triggering a re-render.
 * @param deepState A `DeepStateObject`
 * @param path An array with a single element: the key
 * @param ignoreDescendants Whether to ignore changes that were not initiated directly on the value
 * @returns The value for the given key in the `DeepStateObject`
 */
export function useDeepState<T extends object, K extends keyof T>(
    deepState: DeepStateObject<T, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
    path: readonly [K],
    ignoreDescendants?: boolean,
): T[K];
/**
 * Given a path of keys and/or indices, returns a nested value from the given `DeepStateBase`. For example, a path of
 * `[1, "foo", 2, "bar"]` would access the value at `deepState.getValue()[1]["foo"][2]["bar"]`. If the value itself is
 * an array or object, it is reconstructed when any nested value changes, therby triggering a re-render.
 * @param deepState A `DeepStateArray` or `DeepStateObject`
 * @param path A path of keys/indices to the value
 * @param ignoreDescendants Whether to ignore changes that were not initiated directly on the value
 * @returns The nested value at the given path
 */
export function useDeepState<T>(
    deepState: DeepStateBase<T>,
    path: readonly (string | number)[],
    ignoreDescendants?: boolean,
): unknown;
export function useDeepState<T>(
    deepState: DeepStateBase<T>,
    path: readonly (string | number)[],
    ignoreDescendants?: boolean,
): unknown {
    const descendantState = deepState.getDescendantState(path);
    const [value, setValue] = useState(() => descendantState.getValue());
    const [initialized, setInitialized] = useState(false);

    // Update `value` when `descendantState` itself refers to a different object than before.
    useEffect(() => {
        if (initialized) {
            setValue(descendantState.getValue());
        } else {
            setInitialized(true);
        }
    }, [descendantState, initialized]);

    // Update `value` when the value of `descendantState` changes.
    useEffect(() => {
        const changeListener = ignoreDescendants
            ? (fromDescendant: boolean) => {
                if (fromDescendant && ignoreDescendants) {
                    return;
                }

                setValue(descendantState.getValue());
            }
            : () => {
                setValue(descendantState.getValue());
            };

        descendantState.addChangeListener(changeListener);
        return () => descendantState.removeChangeListener(changeListener);
    }, [descendantState, ignoreDescendants]);

    return value;
}

/**
 * Calls `onChange` when `deepState` is modified. This will probably eventually replace `useDeepState`.
 * @param deepState The state to monitor for change
 * @param onChange A callback that will be called when `deepState` is modified
 */
export function useDeepStateChangeListener<T>(deepState: DeepStateBase<T>, onChange: () => void): void {
    const changeListener = useEffectEvent(onChange);
    useEffect(() => {
        deepState.addChangeListener(changeListener);
        return () => deepState.removeChangeListener(changeListener);
    }, [deepState]);
}

type ChangeEvent = { target: { value: string } };
type DeepStateChangeHandler<V> = [V, (event: ChangeEvent) => void];
/** Like `useDeepState`, but also returns a callback that sets the value to `event.target.value`. */
export function useDeepStateChangeHandler<T>(deepState: DeepStateBase<T>, path: readonly []): DeepStateChangeHandler<T>;
/** Like `useDeepState`, but also returns a callback that sets the value to `event.target.value`. */
export function useDeepStateChangeHandler<Item>(
    deepState: DeepStateBase<Item[]>,
    path: readonly [number],
): DeepStateChangeHandler<Item>;
/** Like `useDeepState`, but also returns a callback that sets the value to `event.target.value`. */
export function useDeepStateChangeHandler<T extends object, K extends keyof T>(
    deepState: DeepStateObject<T, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
    path: readonly [K],
): DeepStateChangeHandler<T[K]>;
/** Like `useDeepState`, but also returns a callback that sets the value to `event.target.value`. */
export function useDeepStateChangeHandler<T>(
    deepState: DeepStateBase<T>,
    path: readonly (string | number)[],
): DeepStateChangeHandler<unknown>;
export function useDeepStateChangeHandler<T>(
    deepState: DeepStateBase<T>,
    path: readonly (string | number)[],
): DeepStateChangeHandler<unknown> {
    const value = useDeepState(deepState, path);
    const onChange = useCallback((event: ChangeEvent) => {
        deepState.setDescendantValue(path, event.target.value);
    }, [deepState, path]);

    return [value, onChange];
}

type CheckChangeEvent = { target: { checked: boolean } };
type DeepStateCheckChangeHandler = [boolean, (event: CheckChangeEvent) => void];
/** Like `useDeepState`, but also returns a callback that sets the value to `event.target.value`. */
export function useDeepStateCheckChangeHandler(
    deepState: DeepStateBase<boolean>,
    path: readonly [],
): DeepStateCheckChangeHandler;
/** Like `useDeepState`, but also returns a callback that sets the value to `event.target.value`. */
export function useDeepStateCheckChangeHandler<T extends { [n in K]: boolean }, K extends keyof T>(
    deepState: DeepStateObject<T, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
    path: readonly [K],
): DeepStateCheckChangeHandler;
/** Like `useDeepState`, but also returns a callback that sets the value to `event.target.value`. */
export function useDeepStateCheckChangeHandler<T>(
    deepState: DeepStateBase<T>,
    path: readonly (string | number)[],
): DeepStateCheckChangeHandler;
export function useDeepStateCheckChangeHandler<T>(
    deepState: DeepStateBase<T>,
    path: readonly (string | number)[],
): DeepStateCheckChangeHandler {
    const value = useDeepState(deepState, path) as boolean;
    const onChange = useCallback((event: CheckChangeEvent) => {
        deepState.setDescendantValue(path, event.target.checked);
    }, [deepState, path]);

    return [value, onChange];
}
