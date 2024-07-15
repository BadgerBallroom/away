/** The ID type. IDs are strings because JSON requires keys to be strings. */
export type ID = string;

export type ValueWithID<V extends object> = V & { id: ID };
export type ValueWithIDIfObject<V> = V extends object ? ValueWithID<V> : V;

export type KeyList = ID[];

export type KeyMap<V> = Record<ID, V | undefined>;

/** A map of ID-value pairs and an array to store the order of IDs. */
export interface KeyListAndMap<V> {
    /**
     * The ordered list of IDs.
     * Not all keys that are in `map` are required to be in here, but all values in here must be valid keys in `map`.
     */
    list: KeyList;
    /**
     * The map of ID-value pairs.
     * Not all IDs are required to be in `list`.
     * That said, `KeyListAndMapState.setValue` does remove keys that are not in `list`.
     */
    map: KeyMap<V>;
}

export namespace KeyListAndMap {
    export function empty<V>(): KeyListAndMap<V> {
        return { list: [], map: {} };
    }
}

export default KeyListAndMap;
