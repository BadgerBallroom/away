import { useSyncExternalStore } from "react";

/**
 * Stores a generic value. All instances of all components that have access to an instance of this object can read and
 * write to it. For example, you can use a module-level variable to hold a value for all instances of a React component.
 */
export default class StaticState<T> {
    private _value: T;
    private _listeners = new Set<() => void>();

    constructor(value: T) {
        this._value = value;
    }

    public getSnapshot = (): T => {
        return this._value;
    };

    public subscribe = (onStoreChange: () => void): () => void => {
        this._listeners.add(onStoreChange);
        return () => this._listeners.delete(onStoreChange);
    };

    public set = (value: T): void => {
        if (value === this._value) {
            return;
        }

        this._value = value;
        this._listeners.forEach(callback => callback());
    };
}

/**
 * Returns the current value of the given store and a function that sets the current value.
 * @param store The store that holds the value that you want to access
 * @returns The current value and the setter
 */
export function useStaticState<T>(store: StaticState<T>): [T, (value: T) => void] {
    return [useSyncExternalStore(store.subscribe, store.getSnapshot), store.set];
}
