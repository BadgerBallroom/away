import Dancer from "./Dancer";
import DancerState from "./DancerState";
import { DeepReadonly } from "./DeepState";
import KeyListAndMap from "./KeyListAndMap";
import KeyListAndMapState, { KeyListState, KeyMapState } from "./KeyListAndMapState";

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

    public override getReferencedStates(): DancerState[] {
        const result = super.getReferencedStates();

        if (this._temporaryDancer) {
            result.push(this._temporaryDancer);
        }

        return result;
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
