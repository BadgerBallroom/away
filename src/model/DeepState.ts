/* eslint-disable @typescript-eslint/no-explicit-any */

import dayjs from "dayjs";

/**
 * Recursively marks all properties as read-only.
 * When a value change is dispatched, the same object is used to notify all listeners of the new value.
 * We don't want one listener to change the value and affect other listeners.
 */
export type DeepReadonly<T> =
    // If T is an array, recursively make it read-only.
    T extends any[] ? ReadonlyArray<DeepReadonly<T[number]>> :
    // If T is an object...
    T extends object ? (
        T extends dayjs.Dayjs ?
        // Don't mess with the Dayjs type.
        T :
        // Remove all methods and make everything else read-only.
        { readonly [P in keyof T]: T[P] extends () => void ? never : DeepReadonly<T[P]> }
    ) :
    // T is not an array or object, so don't mess with it.
    T;

/** A function that is called when a `DeepState` object is changed */
export interface DeepStateChangeCallback<T> {
    (newValue: DeepReadonly<T>, fromDescendant: boolean): void
}

/** A function that makes a `TState` from a `T`. */
export interface DeepStateMaker<T, TState extends DeepStateBase<T> = DeepStateBase<T>> {
    (value: T): TState;
}

/** Constructs a DeepStateArray, DeepStateObject, or DeepStateValue object from the given value. */
export function makeDeepState<T>(value: T): DeepStateBase<T> {
    if (Array.isArray(value)) {
        return new DeepStateArray(value) as any;
    }

    if (
        typeof value === "object"
        && value !== null
        && !(value instanceof dayjs)
    ) {
        return new DeepStateObject(value as object) as any;
    }

    return new DeepStatePrimitive(value);
}

export type DeepStateBaseOrUndefined<T> = (
    T extends null | undefined
    ? DeepStateBase<NonNullable<T>> | null | undefined
    : (
        T extends null
        ? DeepStateBase<NonNullable<T>> | null
        : (
            T extends undefined
            ? DeepStateBase<NonNullable<T>> | undefined
            : DeepStateBase<T>
        )
    )
);

interface DeepStateChild<T, TState = DeepStateBaseOrUndefined<T>> {
    /** A child value */
    deepState: TState;
    /** A function that calls the parent's change callbacks when the child's value changes */
    changeCallback: DeepStateChangeCallback<T>;
}

/**
 * Holds an array of values, an object, or a primitive value.
 * Calls change listeners when any item in the array is updated.
 */
export abstract class DeepStateBase<T> {
    /** Functions to call when the value changes */
    private _changeCallbacks: DeepStateChangeCallback<T>[] = [];

    // #region Mutation
    /** Returns a plain representation of the data in this object. */
    public abstract getValue(): DeepReadonly<T>;

    /** Updates the data in this object and calls all the change listeners. */
    public abstract setValue(newValue: T): void;

    /**
     * Returns whether the value is the default value. If there is no default
     * value, returns false.
     * @returns whether the value of this state is the default value
     */
    public abstract isDefault(): boolean;

    /**
     * Coerces the given value to be valid for setValue.
     * @param newValue The value to check
     * @throws An error if the given value cannot be coerced to be valid for setValue
     * @returns A value that has been coerced into being valid for setValue
     */
    protected abstract validateNewValue(newValue: unknown): T;

    /**
     * Given a path of keys, gets a child of this state and sets its value to the given value. For example,
     * `this.setDescendantValue([1, "a", 2, "b"], "x")` sets the value at `this.getValue()[1]["a"][2]["b"]` to `"x"`.
     * @param path A path of keys to traverse this state object
     * @param newValue The new value
     */
    public setDescendantValue<V>(path: readonly (string | number)[], newValue: V): void {
        const deepState = this.getDescendantState(path);
        if (!deepState) {
            throw new Error(`Cannot set non-existent path: ${JSON.stringify(path)}`);
        }

        deepState.setValue(newValue);
    }
    // #endregion

    // #region Traversal
    /** Retrieves a child `DeepStateBase` of this object. */
    protected abstract getChildState<K extends keyof T>(key: K): DeepStateBaseOrUndefined<any>;

    /** A shortcut for `getChildState(key).getValue()`. */
    public getChildValue<K extends keyof T>(key: K): T[K] {
        return this.getChildState(key)?.getValue();
    }

    /**
     * Given a path of keys, retrieves a child of this state. For example, `this.getDescendantState([1, "a", 2, "b"])`
     * gets the state object that contains `this.getValue()[1]["a"][2]["b"]`.
     * @param path A path of keys to traverse this state object
     * @returns The child state
     */
    public getDescendantState<K extends keyof T>(path: readonly [K]): ReturnType<DeepStateBase<T>["getChildState"]>;
    public getDescendantState<
        K1 extends keyof T,
        K2 extends keyof T[K1]
    >(path: readonly [K1, K2]): ReturnType<NonNullable<ReturnType<DeepStateBase<T>["getChildState"]>>["getChildState"]>;
    public getDescendantState(path: readonly (string | number)[]): DeepStateBase<any>;
    public getDescendantState(path: readonly (string | number)[]): DeepStateBase<any> {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let value: DeepStateBase<any> | null | undefined = this;
        for (const key of path) {
            value = value.getChildState(key);
            if (!value) {
                throw new Error(`Non-existent state path: ${JSON.stringify(path)}`);
            }
        }
        return value;
    }
    // #endregion

    // #region Change listeners
    /** Registers a function to call when the value changes. */
    public addChangeListener(callback: DeepStateChangeCallback<T>): void {
        this._changeCallbacks.push(callback);
    }

    /** Unregisters a function to call when the value changes. */
    public removeChangeListener(callback: DeepStateChangeCallback<T>): void {
        const index = this._changeCallbacks.indexOf(callback);
        if (index < 0) {
            return;
        }
        this._changeCallbacks.splice(index, 1);
    }

    /**
     * Calls all the change listeners.
     * @param newValue The value of this `DeepState` object after the change
     * @param fromDescendant Whether this change was initiated on a descendant of this `DeepState` object
     */
    protected dispatchValueChange(newValue: DeepReadonly<T>, fromDescendant: boolean): void {
        for (const callback of this._changeCallbacks) {
            callback.call(this, newValue, fromDescendant);
        }
    }
    // #endregion

    // #region Serialization
    /** Returns the JSON representation of this object. */
    public toString(): string {
        return JSON.stringify(this.getValue());
    }
    // #endregion
}

/**
 * Holds an array of values.
 * Calls change listeners when any item in the array is updated.
 */
export class DeepStateArray<
    Item,
    ItemState extends DeepStateBase<Item> = DeepStateBase<Item>
> extends DeepStateBase<Item[]> {
    private _items: DeepStateChild<Item, ItemState>[];
    /** Makes an `ItemState` from an `Item` */
    private _makeChildState: DeepStateMaker<Item, ItemState>;

    /** Gets the length of the array. */
    public get length(): number {
        return this._items.length;
    }

    /**
     * Holds an array of values.
     * @param initialValue The initial values to hold
     * @param makeChildState A function that makes an `ItemState` from an `Item`
     */
    constructor(initialValue?: Item[], makeChildState?: DeepStateMaker<Item, ItemState>) {
        super();
        this._items = [];
        this._makeChildState = makeChildState ?? (makeDeepState as DeepStateMaker<Item, ItemState>);
        this.setValue(initialValue ?? []);
    }

    // #region Mutation
    public override getValue(): DeepReadonly<Item[]> {
        return this._items.map(({ deepState }) => deepState.getValue()) as DeepReadonly<Item[]>;
    }

    public override setValue(newValue: Item[]): void {
        newValue = this.validateNewValue(newValue);
        this._clear();
        this.extend(newValue);
    }

    public override isDefault(): boolean {
        return this.length === 0;
    }

    /**
     * Prepares `deepState` to be a child of this object.
     * Adds a listener that dispatches changes from this object when a change is dispatched from `deepState`.
     * The caller is responsible for removing the listener when `deepState` is no longer a child of this object.
     * @param index The index at which `deepState` will be a child of this object
     * @param deepState The `DeepStateBase` that will become a child of this object
     * @returns `deepState` and the listener, which must be removed from `deepState` when it is no longer a child
     */
    protected makeChild(index: number, deepState: ItemState): DeepStateChild<Item, ItemState> {
        const changeCallback = (childValue: DeepReadonly<Item>) => {
            // Create a new value with the updated child value; dispatchValueChange should get the new value, while
            // getValue() should still return the old value.
            const value = this.getValue();
            (value as DeepReadonly<Item>[])[index] = childValue;
            this.dispatchValueChange(value, true);
        };
        deepState.addChangeListener(changeCallback);
        return { deepState, changeCallback };
    }

    protected override validateNewValue(newValue: any): any[] {
        if (!Array.isArray(newValue)) {
            throw new Error("The new value is not an array.");
        }

        // Derived classes can override this to do something, but without knowing at runtime what type the array
        // elements are supposed to be, it is difficult to do much additional validation.

        return newValue;
    }
    // #endregion

    // #region Traversal
    /** Returns the holders of the elements in this array. */
    public getChildStates(): ItemState[] {
        return this._items.map(({ deepState }) => deepState);
    }

    public override getChildState(index: keyof Item[]): ItemState | undefined {
        if (typeof index !== "number" || index < 0 || this._items.length <= index) {
            return undefined;
        }
        return this._items[index].deepState;
    }
    // #endregion

    // #region Common array methods
    /** Removes all elements from the array. */
    public clear(): void {
        this.dispatchValueChange([], false);
        this._clear();
    }

    /** Removes all elements from the array without dispatching a value change. */
    private _clear() {
        for (const { deepState, changeCallback } of this._items) {
            deepState.removeChangeListener(changeCallback);
        }
        this._items = [];
    }

    /** Appends new elements to the end of the array and returns the new length of the array. */
    public push(...items: Item[]): number {
        return this.extend(items);
    }

    /** Copies elements from an array to the end of this array and returns the new length of the array. */
    public extend(items: Item[]): number {
        if (!items.length) {
            return this._items.length;
        }

        const value = this.getValue() as Item[];
        value.push(...items);
        this.dispatchValueChange(value as DeepReadonly<Item[]>, false);

        for (const item of items) {
            this._items.push(this.makeChild(this._items.length, this._makeChildState(item)));
        }
        return this._items.length;
    }

    /** Appends an existing `ItemState` to the array. */
    public pushState(deepState: ItemState): void {
        const value = this.getValue() as Item[];
        value.push(deepState.getValue() as Item);
        this.dispatchValueChange(value as DeepReadonly<Item[]>, false);
        this._items.push(this.makeChild(this._items.length, deepState));
    }

    /**
     * Removes the element at the given index from the array and returns it.
     * @param index The index at which to remove an element (default: last index)
     * @returns The removed element
     */
    public pop(index?: number): ItemState | undefined {
        if (index === undefined) {
            index = this._items.length - 1;
        }

        if (index < 0 || this._items.length <= index) {
            return undefined;
        }

        const value = this.getValue() as Item[];
        value.splice(index, 1);
        this.dispatchValueChange(value as DeepReadonly<Item[]>, false);

        const [{ deepState, changeCallback }] = this._items.splice(index, 1)!;
        deepState.removeChangeListener(changeCallback);
        return deepState;
    }

    /**
     * Given a set of indices, removes array elements at those indices.
     * Invalid indices will be ignored.
     * @param indices The set of indices of elements to remove
     */
    public removeMulti(indices: ReadonlySet<number>): void {
        if (!indices.size) {
            return;
        }

        // Build a new array of items whose indices in the current array are NOT in the set.
        const newItems: DeepStateChild<Item, ItemState>[] = [];
        const newValue: DeepReadonly<Item>[] = [];
        this._items.forEach((item, index) => {
            if (!indices.has(index)) {
                newItems.push(item);
                newValue.push(item.deepState.getValue());
            }
        });
        this.dispatchValueChange(newValue, false);
        this._items = newItems;
    }

    /**
     * Sorts the elements of the array in-place. Guarantees a stable sort.
     * @param compareFn A function that determines the order of the elements, just like with `Array.prototype.sort`
     */
    public sort(compareFn: (a: ItemState, b: ItemState) => number): void {
        if (this.length < 2) {
            return;
        }

        // Associate each item with its index in the array of items.
        // JavaScript sort is unstable; this will make it stable.
        const indexedItems = this._items.map<[number, DeepStateChild<Item, ItemState>]>((item, i) => [i, item]);

        indexedItems.sort(([indexA, itemA], [indexB, itemB]) => {
            const result = compareFn(itemA.deepState, itemB.deepState);
            if (result !== 0) {
                return result;
            }

            // The compare function considered itemA and itemB to be equal.
            // Use their positions in the original array as the tiebreaker.
            return indexA - indexB;
        });

        const newItems: DeepStateChild<Item, ItemState>[] = [];
        const newValue: DeepReadonly<Item>[] = [];
        for (const [, item] of indexedItems) {
            newItems.push(item);
            newValue.push(item.deepState.getValue());
        }
        this.dispatchValueChange(newValue, false);
        this._items = newItems;
    }
    // #endregion
}

export type StringKeys<T> = Extract<keyof T, string>;

/**
 * Holds an object of values.
 * Calls change listeners when any value in the object is updated.
 */
export class DeepStateObject<
    T extends object,
    TChildrenStates extends { [K in StringKeys<T>]: DeepStateBaseOrUndefined<T[K]> }
    = { [K in StringKeys<T>]: DeepStateBaseOrUndefined<T[K]> }
> extends DeepStateBase<T> {
    private _entries: DeepStateObject.Entries<T, TChildrenStates>;
    /**
     * The `validateNewValue` method in a derived class might only accept some keys and ignore the rest. There is a
     * legitimate reason that `setValue` might be called with an object that contains extra keys: a newer version of
     * this software might have added additional properties. To prevent data loss from simply using this version, this
     * property will keep store the extra keys and their values, and `getValue` will include them even though this
     * version won't use them.
     */
    protected unrecognizedChildren: object | undefined;
    /** Makes a `TChildrenStates[K]` from a `T[K]`. */
    private _makeChildState: DeepStateObject.ChildStateMaker<T, TChildrenStates>;

    /**
     * Holds an object of values.
     * @param initialValue The initial object to hold
     * @param makeChildState A function that, given `T[K]`, returns a `TChildrenStates[K]`
     * @param delayedSet For use by derived classes only. Skips the `setValue` call in case the derived constructor
     *                   needs to do something before `setValue` is called.
     */
    constructor(initialValue: T, makeChildState?: DeepStateObject.ChildStateMaker<T, TChildrenStates>);
    constructor(
        initialValue: undefined,
        makeChildState: DeepStateObject.ChildStateMaker<T, TChildrenStates> | undefined,
        delayedSet: true
    );
    constructor(
        initialValue: T,
        makeChildState: DeepStateObject.ChildStateMaker<T, TChildrenStates> | undefined,
        delayedSet = false
    ) {
        super();
        this._entries = {} as DeepStateObject.Entries<T, TChildrenStates>;
        this._makeChildState = makeChildState ??
            ((_, value) => makeDeepState(value)) as DeepStateObject.ChildStateMaker<T, TChildrenStates>;
        if (!delayedSet) {
            this.setValue(initialValue);
        }
    }

    // #region Mutation
    /** A type guard to make TypeScript think that `key` is a `StringKeys<T>`. */
    private _castAsKey(key: unknown): key is StringKeys<T> {
        return typeof key === "string";
    }

    public override getValue(): DeepReadonly<T> {
        const result: Partial<T> = { ...this.unrecognizedChildren };
        for (const key in this._entries) {
            if (!this._castAsKey(key)) {
                continue;
            }
            result[key] = this._entries[key].deepState?.getValue() as T[StringKeys<T>];
        }
        return result as DeepReadonly<T>;
    }

    public override setValue(newValue: T): void {
        newValue = this.validateNewValue(newValue);
        this.dispatchValueChange(newValue as DeepReadonly<T>, false);

        for (const key in this._entries) {
            if (!this._castAsKey(key)) {
                continue;
            }
            const { deepState, changeCallback } = this._entries[key];
            deepState?.removeChangeListener(changeCallback as any);
        }

        this._entries = {} as DeepStateObject.Entries<T, TChildrenStates>;
        for (const key in newValue) {
            this._entries[key] = this.makeChild(key, this._makeChildState(key, newValue[key]));
        }
    }

    public override isDefault(): boolean {
        // If any child's `isDefault` method returns false, return false.
        for (const key in this._entries) {
            if (!this._castAsKey(key)) {
                continue;
            }
            if (!this._entries[key].deepState?.isDefault()) {
                return false;
            }
        }
        return true;
    }

    public override getChildState<K extends StringKeys<T>>(key: K): TChildrenStates[K];
    public override getChildState<K extends keyof T>(key: K): undefined;
    public override getChildState<K extends keyof T>(key: K): DeepStateBaseOrUndefined<any> {
        if (this._castAsKey(key)) {
            return this._entries[key]?.deepState as K extends StringKeys<T> ? TChildrenStates[K] : any;
        }
        return undefined;
    }

    /** Adds an existing `DeepStateBase` to the object. */
    public setChildState<K extends StringKeys<T>>(key: K, deepState: TChildrenStates[K]): void {
        this.dispatchValueChange({ ...this.getValue(), [key]: deepState?.getValue() }, false);

        if (this._entries[key]) {
            const { deepState, changeCallback } = this._entries[key];
            deepState?.removeChangeListener(changeCallback as any);
        }

        this._entries[key] = this.makeChild(key, deepState);
    }

    /**
     * Deletes a child `DeepStateBase` of this object.
     * @param key A key whose value can be undefined
     */
    public removeChildState(
        key: { [K in StringKeys<T>]: undefined extends T[K] ? K : never }[StringKeys<T>] & string,
    ): void {
        if (!this._entries[key]) {
            return;
        }

        const value = this.getValue() as T;
        delete value[key];
        this.dispatchValueChange(value as DeepReadonly<T>, false);

        const { deepState, changeCallback } = this._entries[key];
        deepState?.removeChangeListener(changeCallback as any);
        delete this._entries[key];
    }

    /**
     * Prepares `deepState` to be a child of this object.
     * Adds a listener that dispatches changes from this object when a change is dispatched from `deepState`.
     * @param key The key at which `deepState` will be a child of this object
     * @param deepState The `DeepStateBase` that will become a child of this object
     * @returns `deepState` and the listener, which must be removed from `deepState` when it is no longer a child
     */
    protected makeChild<K extends StringKeys<T>>(
        key: K,
        deepState: TChildrenStates[K]
    ): DeepStateChild<T[K], TChildrenStates[K]> {
        const changeCallback = (childValue: DeepReadonly<T[K]>) => {
            // Create a new value with the updated child value; dispatchValueChange should get the new value, while
            // getValue() should still return the old value.
            this.dispatchValueChange({ ...this.getValue(), [key]: childValue }, true);
        };
        deepState?.addChangeListener(changeCallback as any);
        return { deepState, changeCallback };
    }

    protected override validateNewValue(newValue: any): any {
        if (typeof newValue !== "object") {
            throw new Error("The new value is not an object.");
        }

        // Derived classes can override this method, but without knowing at runtime what the object values are supposed
        // to be, it is difficult to do further validation.
        return newValue;
    }
    // #endregion

    // #region Common object functions
    /** Returns whether the object has the specified key. */
    public hasOwnProperty(key: PropertyKey): key is keyof T {
        return this._entries.hasOwnProperty(key);
    }

    /** Returns an array of the keys in the object. */
    public keys(): string[] {
        const result = Object.keys(this._entries);

        if (this.unrecognizedChildren) {
            result.push(...Object.keys(this.unrecognizedChildren));
        }

        return result;
    }

    /** Returns an array of the values in the object. */
    public values(): any[] {
        const result: any[] = [];

        for (const key in this._entries) {
            if (!this._castAsKey(key)) {
                continue;
            }
            result.push(this._entries[key].deepState?.getValue());
        }

        if (this.unrecognizedChildren) {
            result.push(...Object.values(this.unrecognizedChildren));
        }

        return result;
    }

    /** Returns an array of key/value pairs in the object. */
    public entries(): [string, any][] {
        const result: [string, any][] = Object.entries<DeepStateChild<any>>(this._entries)
            .map(([key, { deepState }]): [string, any] => [key, deepState?.getValue()]);

        if (this.unrecognizedChildren) {
            result.push(...Object.entries(this.unrecognizedChildren));
        }

        return result;
    }
    // #endregion
}

export namespace DeepStateObject {
    export type Entries<
        T extends object,
        TChildrenStates extends { [K in StringKeys<T>]: DeepStateBaseOrUndefined<T[K]> }
    > = { [K in StringKeys<T>]: DeepStateChild<T[K], TChildrenStates[K]> };

    export interface ChildStateMaker<
        T extends object,
        TChildrenStates extends { [K in StringKeys<T>]: DeepStateBaseOrUndefined<T[K]> }
    > {
        <K extends StringKeys<T>>(key: K, value: T[K]): TChildrenStates[StringKeys<T>];
    }
}

/**
 * Holds a value that does not have children (i.e. not an object or array).
 * Like other DeepState classes, calls change listeners when the value is updated.
*/
export class DeepStatePrimitive<T> extends DeepStateBase<T> {
    /** The value of the property */
    private _value!: T;

    /**
     * A helper to satisfy something that must be a `DeepStateBaseOrUndefined<T>`.
     * @param value `null`, `undefined`, or a non-nullable value to construct a `DeepStatePrimitive` with
     * @returns `null` or `undefined` if `value` is `null` or `undefined`, else a new `DeepStatePrimitive` with `value`
     */
    static NewOrUndefined<T>(value: T | null): DeepStatePrimitive<T> | null;
    static NewOrUndefined<T>(value: T | undefined): DeepStatePrimitive<T> | undefined;
    static NewOrUndefined<T>(value: T | null | undefined): DeepStatePrimitive<T> | null | undefined;
    static NewOrUndefined<T>(value: T | null | undefined): DeepStatePrimitive<T> | null | undefined {
        if (value === null) {
            return null;
        }

        if (value === undefined) {
            return undefined;
        }

        return new DeepStatePrimitive(value as T);
    }

    /**
     * Holds a value that does not have children (i.e. not an object or array).
     * @param initialValue The initial value to hold
     */
    constructor(initialValue: T) {
        super();
        this.setValue(initialValue);
    }

    // #region Mutation
    public override getValue(): DeepReadonly<T> {
        return this._value as DeepReadonly<T>;
    }

    public override setValue(newValue: T): void {
        newValue = this.validateNewValue(newValue);
        this.dispatchValueChange(newValue as DeepReadonly<T>, false);
        this._value = newValue;
    }

    public override isDefault(): boolean {
        return !this._value;
    }

    protected override getChildState(_: any): undefined {
        return undefined;
    }

    protected override validateNewValue(newValue: any): any {
        // Derived classes can override this method, but without knowing at runtime what type it is supposed to to be,
        // it is difficult to do further validation.
        return newValue;
    }
    // #endregion
}
