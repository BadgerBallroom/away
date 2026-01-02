import { DeepReadonly, DeepStateArray, DeepStateBaseOrUndefined, DeepStateObject, makeDeepState } from "./DeepState";
import KeyListAndMap, { ID, KeyMap, ValueWithID, ValueWithIDIfObject } from "./KeyListAndMap";

/** Holds a map of key-value pairs and an array to store the order of keys. */
export default class KeyListAndMapState<
    V,
    VState extends DeepStateBaseOrUndefined<V>,
    ListState extends KeyListState<V, VState> = KeyListState<V, VState>,
    MapState extends KeyMapState<V, VState> = KeyMapState<V, VState>,
> extends DeepStateObject<KeyListAndMap<V>, { list: ListState, map: MapState }> {
    private _otherListStates: WeakRef<ListState>[] = [];

    /** Returns the state of the array of IDs. */
    public get list(): ListState {
        return this.getChildState("list");
    }

    /** Returns the state of the map of ID-value pairs. */
    public get map(): MapState {
        return this.getChildState("map");
    }

    /**
     * Holds a map of key-value pairs and an array to store the order of keys.
     * @param makeValueState A function that, given `V`, returns a `VState`
     * @param initialValue The initial map and array to hold
     */
    constructor(
        initialValue?: KeyListAndMap<V>,
        makeList?: (parent: KeyListAndMapState<V, VState, ListState, MapState>, initialValue: ID[]) => ListState,
        makeMap?: (initialValue: KeyMap<V>) => MapState,
    ) {
        makeList ??= (_, initialValue) => new KeyListState<V, VState>(this, initialValue as ID[]) as ListState;
        makeMap ??= (initialValue) => {
            return new KeyMapState<V, VState>(v => makeDeepState(v) as VState, initialValue as KeyMap<V>) as MapState;
        };

        // `super` is called with `delayedSet === true` to ensure that `this` is usable before `setValue` is called.
        super(undefined, (key, value) => {
            switch (key) {
                case "list":
                    return makeList!(this, value as KeyListAndMap<V>["list"]);
                case "map":
                    return makeMap!(value as KeyListAndMap<V>["map"]);
            }
        }, true);
        this.setValue(initialValue ?? KeyListAndMap.empty());
    }

    protected override validateNewValue(newValue: unknown): KeyListAndMap<V> {
        const { list, map, ...unrecognizedChildren } = super.validateNewValue(newValue);
        this.unrecognizedChildren = unrecognizedChildren;
        return {
            list, // `KeyListState.validateNewValue` will validate further.
            map, // `KeyMapState.validateNewValue` will validate further.
        };
    }

    /**
     * Adds an existing `VState` to the map and pushes its ID onto the end of the list.
     * @param valueState The `VState` to add
     * @returns The new ID and its index in the list
     */
    public add(valueState: VState): { id: ID, index: number } {
        const id = this.map.add(valueState);
        const index = this.list.push(id);
        return { id, index };
    }

    /**
     * Updates the properties of the value with the given ID. Returns their index in the list.
     * If no existing value has the given ID, the value is added to the map and the ID is pushed to the end of the list.
     * If the given ID is empty, an ID is generated.
     * @param valueWithID The value to add, where `valueWithID.id` is the ID
     * @returns The index of the ID in the list
     */
    public addOrUpdate(id: ID, value: NonNullable<V>): { id: ID, index: number };
    public addOrUpdate(valueWithID: V extends object ? ValueWithID<V> : never): { id: ID, index: number };
    public addOrUpdate(): { id: ID, index: number } {
        let id: ID;
        let value: NonNullable<V>;
        if (arguments.length === 2) {
            id = arguments[0];
            value = arguments[1];
        } else {
            id = arguments[0].id;
            value = arguments[0];
        }

        id = this.map.addOrUpdate(id, value);

        // Ensure that the ID is in the list.
        const listState = this.list;
        let index = listState.getValue().indexOf(id);
        if (index === -1) {
            index = listState.length;
            listState.push(id);
        }

        return { id, index };
    }

    /**
     * Registers another instance of `ListState`.
     * When `garbageCollect` runs, it will not delete keys that are in this list.
     * A weak reference is retained, so the list can be garbage collected elsewhere.
     */
    public registerListState(listState: ListState): void {
        this._otherListStates.push(new WeakRef(listState));
    }

    /** Deletes from the map key-value pairs where the key is not in any list of IDs. */
    public garbageCollect(): void {
        const mapState = this.map;
        const keysToRemove = new Set(mapState.keys());

        // Keep all IDs in the main list.
        for (const id of this.list.getValue()) {
            keysToRemove.delete(id);
        }

        // Get the `ListState`s that have not been garbage collected.
        // Remove `WeakRef`s whose `ListState`s have been garbage collected.
        const stateRefsToKeep = [];
        const otherListStates = [];
        for (const listStateRef of this._otherListStates) {
            const listState = listStateRef.deref();
            if (!listState) {
                continue;
            }
            stateRefsToKeep.push(listStateRef);
            otherListStates.push(listState);
        }
        this._otherListStates = stateRefsToKeep;

        // Keep IDs from the other `ListState`s.
        for (const listState of otherListStates) {
            for (const id of listState.getValue()) {
                keysToRemove.delete(id);
            }
        }

        keysToRemove.forEach(id => mapState.removeChildState(id));
    }
}

/** Holds the array of a `KeyAndListMap`. */
export class KeyListState<V, VState extends DeepStateBaseOrUndefined<V>> extends DeepStateArray<ID> {
    /** A reference back to the `KeyListAndMapState` that contains this `ListState` */
    private _parent: KeyListAndMapState<V, VState>;

    /** A reference back to the `KeyListAndMapState` that contains this `ListState` */
    protected get parent(): KeyListAndMapState<V, VState> {
        return this._parent;
    }

    /**
     * Holds the array of a `KeyAndListMap`.
     * @param parent A reference back to the `KeyListAndMapState` that contains this `ListState`
     * @param initialValue The initial array to hold
     */
    constructor(parent: KeyListAndMapState<V, VState>, initialValue: ID[]) {
        super(initialValue);
        this._parent = parent;
    }

    protected override validateNewValue(newValue: unknown): ID[] {
        if (!Array.isArray(newValue)) {
            return [];
        }

        // It is not guaranteed that the map will initialize before this list.
        // All that can be done now is to make sure that every ID is valid.
        // `getReferencedValues` and `getReferencedStates` do handle the case where the ID is not found in the map.
        return newValue.filter(KeyMapState.isValidID);
    }

    /** Returns an array of the values from the map of a `KeyListAndMap`, ordered by their IDs in this array. */
    public getReferencedValues(): DeepReadonly<ValueWithIDIfObject<V>[]> {
        const mapState = this._parent.getChildState("map");
        const result: DeepReadonly<ValueWithIDIfObject<V>>[] = [];

        for (const id of this.getValue()) {
            const valueState = mapState.getChildState(id);
            if (!valueState) {
                continue;
            }

            const value = valueState.getValue();
            if (typeof value === "object" && value !== null) {
                result.push({ id, ...value } as DeepReadonly<ValueWithIDIfObject<V>>);
            } else {
                result.push(value as DeepReadonly<ValueWithIDIfObject<V>>);
            }
        }

        return result;
    }

    /** Returns each ID in this array and the corresponding `VState` object. */
    public getIDsAndReferencedStates(): { id: ID, state: VState }[] {
        const mapState = this._parent.map;
        const result: { id: ID, state: VState }[] = [];

        for (const id of this.getValue()) {
            const valueState = mapState.getChildState(id);
            if (!valueState) {
                continue;
            }

            result.push({ id, state: valueState as unknown as VState });
        }

        return result;
    }

    /** Returns an array of the `VState` object of each value whose ID is in this array. */
    public getReferencedStates(): VState[] {
        return this.getIDsAndReferencedStates().map(({ state }) => state);
    }
}

/** Holds the map of a `KeyAndListMap`. */
export class KeyMapState<V, VState extends DeepStateBaseOrUndefined<V>>
    extends DeepStateObject<KeyMap<V>, { [id: ID]: VState | undefined }> {
    private static readonly ID_RADIX = 32;
    private _nextIDNumber = 0;
    private _makeValueState: (value: V) => VState;

    public get makeValueState(): (value: V) => VState {
        return this._makeValueState;
    }

    /**
     * Holds the map of a `KeyAndListMap`.
     * @param makeValueState A function that, given `V`, returns a `VState`
     * @param initialValue The initial map to hold
     */
    constructor(makeValueState: (value: V) => VState, initialValue: KeyMap<V>) {
        // `super` is called with `delayedSet === true` so that `this` is initialized before `setValue` runs.
        // `setValue` needs `this` to be initialized because it sets `this._nextIDNumber`.
        super(undefined, (_, value) => value === undefined ? undefined : makeValueState(value), true);
        this._makeValueState = makeValueState;
        this.setValue(initialValue);
    }

    public override setValue(newValue: KeyMap<V>): void {
        super.setValue(newValue);

        this._nextIDNumber = 0;
        for (const id of this.keys()) {
            this._updateNextIDNumber(id);
        }
    }

    /** Call this when adding an ID to the map. Updates `_nextIDNumber` if necessary. */
    private _updateNextIDNumber(id: ID): void {
        const idNumber = parseInt(id, KeyMapState.ID_RADIX);
        if (!isNaN(idNumber) && idNumber >= this._nextIDNumber) {
            this._nextIDNumber = idNumber + 1;
        }
    }

    protected override validateNewValue(newValue: unknown): KeyMap<V> {
        const result: KeyMap<V> = {};

        if (typeof newValue !== "object" || Array.isArray(newValue) || newValue === null) {
            return result;
        }

        // Just make sure that the IDs are valid.
        // `VState.validateNewValue` will validate further.
        for (const id in newValue) {
            if (KeyMapState.isValidID(id)) {
                result[id] = (newValue as KeyMap<V>)[id];
            }
            // We could send invalid IDs to `unrecognizedChildren`, but for this class, other code may be depending on
            // `getValue()` returning only valid IDs.
        }

        return result;
    }

    /**
     * Adds an existing `VState` to the map.
     * @param valueState The `VState` to add
     * @returns The new ID of the `VState`
     */
    public add(valueState: VState): ID {
        const id = (this._nextIDNumber++).toString(KeyMapState.ID_RADIX);
        this.setChildState(id, valueState);
        return id;
    }

    /**
     * Updates the properties of the value with the given ID.
     * If no existing value has the given ID, the value is added to the map.
     * If the given ID is empty, an ID is generated.
     * @param id The ID whose associated value should be updated
     * @param value The new value to be set at the ID
     * @param valueWithID The value to add, where `valueWithID.id` is the ID
     * @returns The given ID if it was not empty, else the generated ID
     */
    public addOrUpdate(id: ID, value: NonNullable<V>): ID;
    /**
     * Updates the properties of the value with the given ID.
     * If no existing value has the given ID, the value is added to the map.
     * If the given ID is empty, an ID is generated.
     * @param valueWithID The value to add, where `valueWithID.id` is the ID
     * @returns The given ID if it was not empty, else the generated ID
     */
    public addOrUpdate(valueWithID: V extends object ? ValueWithID<V> : never): ID;
    public addOrUpdate(): ID {
        let id: ID;
        let value: NonNullable<V>;
        if (arguments.length === 2) {
            id = arguments[0];
            value = arguments[1];
        } else {
            id = arguments[0].id;
            value = arguments[0];
        }

        if (!KeyMapState.isValidID(id)) {
            return this.add(this.makeValueState(value));
        }

        // Ensure that the ID is in the map.
        const state = this.getChildState(id);
        if (state) {
            // An existing value with the given ID was found in the key-value map. Update it.
            state.setValue(value);
        } else {
            // An ID was given, but it was not in the key-value map. Create a new value with the given ID.
            this.setChildState(id, this.makeValueState(value));
            this._updateNextIDNumber(id);
        }

        return id;
    }

    /** Returns whether the specified ID is valid. */
    public static isValidID(id: unknown): id is ID {
        return typeof id === "string"
            && id.length > 0
            && !isNaN(parseInt(id, KeyMapState.ID_RADIX));
    }
}
