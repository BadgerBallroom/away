import { Dayjs } from "dayjs";
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
     * Returns the number of people that this person can drive, including themselves.
     * Returns 0 if this person cannot drive a carpool.
     */
    public get canDriveMaxPeople(): number {
        if (Dancer.canDriveCarpool(this.getChildValue("canDriveCarpool"))) {
            return this.getChildValue("canDriveMaxPeople");
        }
        return 0;
    }

    /**
     * Returns the earliest date and time that the person could leave.
     * Returns `null` if the person is not traveling with the team.
     */
    public get earliestPossibleDeparture(): Dayjs | null {
        if (this.getChildValue("canDriveCarpool") !== CanDriveCarpool.TravelingOnOwn) {
            return this.getChildValue("earliestPossibleDeparture");
        }
        return null;
    }

    /**
     * Returns whether the person wants to stay with only others of the same gender.
     * Returns `null` if the person is not staying in team-organized housing.
     */
    public get prefersSameGender(): boolean | null {
        if (this.getChildValue("accommodation") !== Accommodation.StayingOnOwn) {
            return this.getChildValue("prefersSameGender");
        }
        return null;
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

    // #region CSV
    public static readonly CSV_HEADING: (keyof Dancer)[] = [
        "name",
        "canDriveCarpool",
        "canDriveMaxPeople",
        "earliestPossibleDeparture",
        "accommodation",
        "prefersSameGender",
        "gender",
    ];

    /** Returns a representation of this object as an array of strings. */
    public toCSVRow(): string[] {
        return [
            this.getChildValue("name"),
            this.getChildValue("canDriveCarpool"),
            this.getChildValue("canDriveMaxPeople").toString(10),
            this.getChildValue("earliestPossibleDeparture")?.toISOString() ?? "",
            this.getChildValue("accommodation"),
            this.getChildValue("prefersSameGender") ? "TRUE" : "FALSE",
            this.getChildValue("gender"),
        ];
    }
    // #endregion
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
