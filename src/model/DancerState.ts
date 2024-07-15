import { validateDayjsValue, validateEnumValue } from "../utilities/validation";
import Carpool from "./Carpool";
import Dancer, { Accommodation, CanDriveCarpool, Gender } from "./Dancer";
import { DeepStateObject } from "./DeepState";
import { useDeepState } from "./DeepStateHooks";

/** Holds one dancer. */
export class DancerState extends DeepStateObject<Dancer> {
    private static nextEvanescentID = 0;
    private _evanescentID: number;

    /**
     * A number that is unique for every `DancerState` that has been instantiated since the page loaded. This is
     * different than the dancer's ID in `DancerKLM`; this ID is present even if the dancer has not been added to the
     * data structure. This number also does not necessarily stay the same between page loads for the same dancer.
     */
    public get evanescentID(): number {
        return this._evanescentID;
    }

    /**
     * Holds one dancer.
     * @param value The initial `Dancer` value to hold
     */
    constructor(value?: Dancer) {
        super(value ?? Dancer.DEFAULT);
        this._evanescentID = ++DancerState.nextEvanescentID;
    }

    protected override validateNewValue(newValue: any): Dancer {
        let {
            name,
            canDriveCarpool,
            canDriveMaxPeople,
            earliestPossibleDeparture,
            accommodation,
            prefersSameGender,
            gender,
            ...unrecognizedChildren
        } = super.validateNewValue(newValue);

        this.unrecognizedChildren = unrecognizedChildren;

        if (typeof canDriveMaxPeople === "string") {
            canDriveMaxPeople = parseInt(canDriveMaxPeople, 10);
        }

        if (typeof prefersSameGender === "string") {
            switch (prefersSameGender.toLowerCase()) {
                case "":
                case "f":
                case "false":
                    prefersSameGender = false;
                    break;
                default:
                    prefersSameGender = true;
            }
        } else {
            prefersSameGender = !!prefersSameGender;
        }

        return {
            name: typeof name === "string" ? name : "",
            canDriveCarpool: validateEnumValue(CanDriveCarpool, canDriveCarpool),
            canDriveMaxPeople: (
                typeof canDriveMaxPeople === "number"
                && !isNaN(canDriveMaxPeople)
                && canDriveMaxPeople >= Carpool.MIN_DANCERS
            ) ? canDriveMaxPeople : Carpool.MIN_DANCERS,
            earliestPossibleDeparture: validateDayjsValue(earliestPossibleDeparture),
            accommodation: validateEnumValue(Accommodation, accommodation),
            prefersSameGender,
            gender: validateEnumValue(Gender, gender),
        };
    }
}

export namespace DancerState {
    export namespace CanDriveMaxPeople {
        /** Returns whether the `canDriveMaxPeople` property should be shown to the user. */
        export function useShouldShow(dancer: DancerState): boolean {
            const canDriveCarpool = useDeepState(dancer, ["canDriveCarpool"]);
            return Dancer.canDriveCarpool(canDriveCarpool);
        }
    }

    export namespace EarliestPossibleDeparture {
        /** Returns whether the `earliestPossibleDeparture` property should be shown to the user. */
        export function useShouldShow(dancer: DancerState): boolean {
            const canDriveCarpool = useDeepState(dancer, ["canDriveCarpool"]);
            return canDriveCarpool !== CanDriveCarpool.TravelingOnOwn;
        }
    }

    export namespace PrefersSameGender {
        /** Returns whether the `prefersSameGender` property should be shown to the user. */
        export function useShouldShow(dancer: DancerState): boolean {
            const accommodation = useDeepState(dancer, ["accommodation"]);
            return accommodation !== Accommodation.StayingOnOwn;
        }
    }
}

export default DancerState;
