import { FabDisplayer } from "../components/FabZoomerProps";
import { CarpoolArrangementKLM, CarpoolArrangementKLMState } from "./CarpoolArrangementKLM";
import { DancerKLM, DancerKLMState } from "./DancerKLM";
import { DeepStateObject, DeepStatePrimitive } from "./DeepState";
import KeyListAndMap from "./KeyListAndMap";

export interface SessionProps {
    /** The name of the competition */
    name: string;
    /** The dancers who are going to the competition */
    dancers: DancerKLM;
    /** Possible ways to arrange the carpools */
    carpoolArrangements: CarpoolArrangementKLM;
}

export namespace SessionProps {
    export const DEFAULT: SessionProps = {
        name: "",
        dancers: KeyListAndMap.empty(),
        carpoolArrangements: KeyListAndMap.empty(),
    };
}

/**
 * Represents one trip for the ballroom dance team, including traveling to another city, staying at a hotel, attending
 * a ballroom dance competition, and traveling back.
 */
export default class Session extends DeepStateObject<SessionProps, {
    name: DeepStatePrimitive<string>,
    dancers: DancerKLMState,
    carpoolArrangements: CarpoolArrangementKLMState,
}> {
    /** The key for storing the session in localStorage */
    private static readonly STORAGE_KEY = "session";

    /** Whether there are data pending to be saved to localStorage */
    private _isDirty = false;
    /** The ID of the timeout for saving the session in localStorage */
    private _saveTimeout: ReturnType<typeof setTimeout> | undefined;
    /** A callback to pass parameters to display the floating action button (FAB) */
    private _fabDisplayer: FabDisplayer | null = null;
    /** A buffer that stores parameters to display the floating action button while {@link _fabDisplayer} is `null` */
    private _fabDisplayQueue: Parameters<FabDisplayer>[] = [];

    /**
     * Represents one trip for the ballroom dance team.
     * @param value The initial session information
     */
    constructor(value?: SessionProps) {
        super(undefined, (key, value) => {
            switch (key) {
                case "name":
                    return new DeepStatePrimitive(value as SessionProps["name"]);
                case "dancers":
                    return new DancerKLMState(value as SessionProps["dancers"]);
                case "carpoolArrangements":
                    return new CarpoolArrangementKLMState(this, value as SessionProps["carpoolArrangements"]);
            }
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

    protected override validateNewValue(newValue: unknown): SessionProps {
        const {
            name,
            dancers,
            carpoolArrangements,
            ...unrecognizedChildren
        } = super.validateNewValue(newValue);

        this.unrecognizedChildren = unrecognizedChildren;

        return {
            name: typeof name === "string" ? name : "",
            dancers, // DancerKLMState.validateNewValue will validate further.
            carpoolArrangements, // CarpoolArrangementKLMState.validateNewValue will validate further.
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

        this.garbageCollect();
        if (this.isDefault()) {
            localStorage.removeItem(Session.STORAGE_KEY);
        } else {
            localStorage.setItem(Session.STORAGE_KEY, this.toString());
        }
        this._isDirty = false;
    }

    /** Removes dancers who aren't referenced from anywhere else. */
    protected garbageCollect(): void {
        this.getChildState("dancers").garbageCollect();
        this.getChildState("carpoolArrangements").garbageCollect();
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

    // #region Floating Action Button
    /**
     * Registers a callback that gets called when a page passes parameters to display the floating action button.
     * @param displayer The callback (or `null` to unregister)
     */
    public registerFABDisplayer(displayer: FabDisplayer | null): void {
        this._fabDisplayer = displayer;
        if (this._fabDisplayer) {
            for (const props of this._fabDisplayQueue) {
                this._fabDisplayer(...props);
            }
            this._fabDisplayQueue = [];
        }
    }

    /**
     * Forwards parameters to display the floating action button to the callback that will display it.
     * @param props Parameters for the floating action button
     */
    public displayFAB(...props: Parameters<FabDisplayer>): void {
        if (this._fabDisplayer) {
            this._fabDisplayer(...props);
        } else {
            this._fabDisplayQueue.push(props);
        }
    }
    // #endregion
}
