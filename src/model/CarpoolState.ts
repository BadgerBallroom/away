import dayjs, { Dayjs } from "dayjs";
import { validateDayjsValue } from "../utilities/validation";
import Carpool from "./Carpool";
import { DancerListState } from "./DancerKLM";
import { DeepStateObject, DeepStatePrimitive } from "./DeepState";
import Session from "./Session";

export default class CarpoolState extends DeepStateObject<Carpool, {
    departure: DeepStatePrimitive<Dayjs> | null,
    occupants: DancerListState,
}> {
    private static nextEvanescentID = 0;
    private _session: Session;
    private _evanescentID: number;

    /**
     * A number that is unique for every `CarpoolState` that has been instantiated since the page loaded. This number
     * does not necessarily stay the same between page loads for the same carpool.
     */
    public get evanescentID(): number {
        return this._evanescentID;
    }

    /**
     * Holds a carpool.
     * @param session The `Session` object that will contain this object
     * @param value The initial `Carpool` value to hold
     */
    constructor(session: Session, value?: Carpool) {
        super(undefined, (key, value) => {
            switch (key) {
                case "departure":
                    return DeepStatePrimitive.NewOrUndefined(value as Carpool["departure"]);
                case "occupants":
                    return DancerListState.makeAndRegister(session, value as Carpool["occupants"]);
            }
        }, true);
        this.setValue(value ?? Carpool.DEFAULT);
        this._session = session;
        this._evanescentID = ++CarpoolState.nextEvanescentID;
    }

    protected override validateNewValue(newValue: unknown): Carpool {
        const {
            departure,
            occupants,
            ...unrecognizedChildren
        } = super.validateNewValue(newValue);

        this.unrecognizedChildren = unrecognizedChildren;

        return {
            departure: validateDayjsValue(departure),
            occupants,
        };
    }

    /**
     * Computes the earliest time that this carpool could depart without departing too early for any occupants. Returns
     * `null` if the carpool's current departure time already not too early for any occupant.
     * @returns The suggested departure time (or `null` if the current departure time is fine)
     */
    public getSuggestedDepartureTime(): Dayjs | null {
        const dancerIDs = this.getChildValue("occupants");
        if (!dancerIDs.length) {
            return null;
        }

        const dancerMap = this._session.getChildState("dancers").map;

        // Of all the occupants in this carpool, find the last earliest departure time. This is the earliest time that
        // would accommodate all occupants.
        let earliestAccommodatingDeparture = dayjs(0);
        for (const dancerID of dancerIDs) {
            const dancerDeparture = dancerMap.getChildState(dancerID)?.earliestPossibleDeparture;
            if (dancerDeparture?.isAfter(earliestAccommodatingDeparture)) {
                earliestAccommodatingDeparture = dancerDeparture;
            }
        }

        // If this carpool does not have a departure time or it departs too early for at least one occupant, return the
        // earliest time that would accommodate all occupants.
        const carpoolDeparture = this.getChildValue("departure");
        if (!carpoolDeparture || carpoolDeparture.isBefore(earliestAccommodatingDeparture)) {
            return earliestAccommodatingDeparture;
        }
        return null;
    }
}
