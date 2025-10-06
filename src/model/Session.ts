import { DeepStateObject, DeepStatePrimitive } from "./DeepState";

export interface SessionProps {
    /** The name of the competition */
    name: string;
}

export namespace SessionProps {
    export const DEFAULT: SessionProps = {
        name: "",
    };
}

/**
 * Represents one trip for the ballroom dance team, including traveling to another city, staying at a hotel, attending
 * a ballroom dance competition, and traveling back.
 */
export default class Session extends DeepStateObject<SessionProps, {
    name: DeepStatePrimitive<string>,
}> {
    /** The key for storing the session in localStorage */
    private static readonly STORAGE_KEY = "session";

    /** Whether there are data pending to be saved to localStorage */
    private _isDirty = false;
    /** The ID of the timeout for saving the session in localStorage */
    private _saveTimeout: ReturnType<typeof setTimeout> | undefined;

    /**
     * Represents one trip for the ballroom dance team.
     * @param value The initial session information
     */
    constructor(value?: SessionProps) {
        super(undefined, (key, value): any => {
            return new DeepStatePrimitive(value);
        }, true);
        this.setValue(value ?? SessionProps.DEFAULT);
        this.addChangeListener(() => this._saveToLocalStorageAfterDelay());
    }

    /** Creates a new `Session` from the output of `toString`. */
    public static fromString(s: string): Session {
        return new Session(JSON.parse(s));
    }

    /** Resets the session to an empty state. */
    public clear(): void {
        this.setValue(SessionProps.DEFAULT);
    }

    protected override validateNewValue(newValue: any): SessionProps {
        const {
            name,
            ...unrecognizedChildren
        } = super.validateNewValue(newValue);

        this.unrecognizedChildren = unrecognizedChildren;

        return {
            name: typeof name === "string" ? name : "",
        };
    }

    // #region Local storage
    /** Call this when any data in this Session are modified. Saves the data to localStorage after a delay. */
    private _saveToLocalStorageAfterDelay(): void {
        if (this._saveTimeout) {
            clearTimeout(this._saveTimeout);
        }

        this._isDirty = true;
        this._saveTimeout = setTimeout(() => this.saveToLocalStorage(), 1000);
    }

    /** Saves the data from this Session to localStorage. */
    public saveToLocalStorage(): void {
        if (this._saveTimeout) {
            clearTimeout(this._saveTimeout);
        }

        localStorage.setItem(Session.STORAGE_KEY, this.toString());
        this._isDirty = false;
    }

    /** Returns whether there are data pending to be saved to localStorage. */
    public isDirty(): boolean {
        return this._isDirty;
    }

    /**
     * Constructs a Session from localStorage. If there are no stored data or the stored data are invalid, an empty
     * Session is created.
     */
    public static loadFromLocalStorage(): Session {
        let result: Session | undefined;

        try {
            const stored = localStorage.getItem(Session.STORAGE_KEY);
            if (stored) {
                result = Session.fromString(stored);
            }
        } catch (e) { }

        if (!result) {
            result = new Session();
        }

        return result;
    }
    // #endregion
}
