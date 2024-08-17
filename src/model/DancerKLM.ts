import dayjsComparator from "../utilities/dayjsComparator";
import Dancer, { AccommodationCollator, CanDriveCarpoolCollator, GenderCollator, PrefersSameGenderCollator } from "./Dancer";
import DancerState from "./DancerState";
import { DeepReadonly } from "./DeepState";
import KeyListAndMap, { ID } from "./KeyListAndMap";
import KeyListAndMapState, { KeyListState, KeyMapState } from "./KeyListAndMapState";
import Session from "./Session";

/** A map of ID-dancer pairs and an array to store the order of IDs. */
export type DancerKLM = KeyListAndMap<Dancer>;

/** Holds a map of ID-dancer pairs and an array to store the order of IDs. */
export class DancerKLMState extends KeyListAndMapState<Dancer, DancerState, DancerListState, KeyMapState<Dancer, DancerState>> {
    constructor(initialValue?: DancerKLM) {
        super(
            initialValue,
            (parent, list) => new DancerListState(parent, list),
            map => new KeyMapState(dancer => new DancerState(dancer), map),
        );
    }
}

export class DancerListState extends KeyListState<Dancer, DancerState> {
    /** An extra empty dancer that appears at the end of the array from `getDancerStates` */
    private _temporaryDancer: DancerState | null = null;

    /** An extra empty dancer that appears at the end of the array from `getDancerStates` */
    public get temporaryDancer(): DancerState | null {
        return this._temporaryDancer;
    }

    /**
     * Constructs a `DancerListState` and registers it with the `DancerKLMState` at `session.getChildState("dancers")`
     * so that the dancers whose IDs are in the new `DancerListState` aren't garbage collected.
     * @param session The `Session` object
     * @param initialValue The initial dancer IDs to hold
     * @returns The new `DancerListState`
     */
    public static makeAndRegister(session: Session, initialValue?: ID[]): DancerListState {
        const dancerKLMState = session.getChildState("dancers");
        const result = new DancerListState(dancerKLMState, initialValue ?? []);
        dancerKLMState.registerListState(result);
        return result;
    }

    public override getReferencedStates(): DancerState[] {
        const result = super.getReferencedStates();

        if (this._temporaryDancer) {
            result.push(this._temporaryDancer);
        }

        return result;
    }

    /**
     * Sorts the dancers.
     * @param by The property on which to sort the dancers
     * @param locales The value to pass to `Intl.Collator` (needed for sorting strings)
     * @param descending Whether to sort in descending order
     */
    public sortDancers(by: keyof Dancer, locales?: string | string[], descending?: boolean): void {
        if (this.length < 2) {
            return;
        }

        let compare: (a: DancerState, b: DancerState) => number;
        switch (by) {
            case "name":
                const collator = Intl.Collator(locales);
                compare = (a, b) => collator.compare(a.getChildValue("name"), b.getChildValue("name"));
                break;
            case "canDriveCarpool":
                compare = (a, b) => CanDriveCarpoolCollator.comparator(
                    a.getChildValue("canDriveCarpool"),
                    b.getChildValue("canDriveCarpool"),
                );
                break;
            case "canDriveMaxPeople":
                compare = (a, b) => a.canDriveMaxPeople - b.canDriveMaxPeople;
                break;
            case "earliestPossibleDeparture":
                compare = (a, b) => dayjsComparator(a.earliestPossibleDeparture, b.earliestPossibleDeparture);
                break;
            case "accommodation":
                compare = (a, b) => AccommodationCollator.comparator(
                    a.getChildValue("accommodation"),
                    b.getChildValue("accommodation"),
                );
                break;
            case "prefersSameGender":
                compare = (a, b) => PrefersSameGenderCollator.comparator(a.prefersSameGender, b.prefersSameGender);
                break;
            case "gender":
                compare = (a, b) => GenderCollator.comparator(a.getChildValue("gender"), b.getChildValue("gender"));
                break;
            default:
                compare = () => 0;
                break;
        }

        const mapState = this.parent.map;
        this.sort((idA, idB) => {
            const dancerStateA = mapState.getChildState(idA.getValue());
            const dancerStateB = mapState.getChildState(idB.getValue());

            if (dancerStateA) {
                if (dancerStateB) {
                    const result = compare(dancerStateA, dancerStateB);
                    return descending ? -result : result;
                }

                // A should go before B.
                return -1;
            }

            if (dancerStateB) {
                // B should go before A.
                return 1;
            }

            return 0;
        });
    }

    // #region Temporary dancer
    /**
     * Causes `mapDancerStates` to act as if there is an extra empty dancer at the end. When the dancer stops being
     * empty, it is automatically added to the dance team and to this array.
     */
    public addTemporaryDancer(): void {
        if (!this._temporaryDancer) {
            this._temporaryDancer = new DancerState();
            this._temporaryDancer.addChangeListener(this._temporaryDancerChangeListener);
            this.dispatchValueChange(this.getValue(), false);
        }
    }

    /** A change listener for `this._temporaryDancer`. Handles making the dancer not temporary anymore. */
    private _temporaryDancerChangeListener = (newValue: DeepReadonly<Dancer>) => {
        if (!Dancer.isEmpty(newValue)) {
            // The temporary dancer is no longer empty. Make a new temporary dancer.
            this._temporaryDancer!.removeChangeListener(this._temporaryDancerChangeListener);
            this.parent.add(this._temporaryDancer!);
            this._temporaryDancer = null;
            this.addTemporaryDancer();
        }
    };

    /** Returns whether the given `DancerState` is temporary. */
    public isTemporaryDancer(dancerState: DancerState): boolean {
        return dancerState === this._temporaryDancer;
    }

    /** Removes the temporary `Dancer` that was added by `addTemporaryDancer`. */
    public removeTemporaryDancer(): void {
        if (!this._temporaryDancer) {
            return;
        }

        this._temporaryDancer.removeChangeListener(this._temporaryDancerChangeListener);
        this._temporaryDancer = null;
        this.dispatchValueChange(this.getValue(), false);
    }
    // #endregion
}
