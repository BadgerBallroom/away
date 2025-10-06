import dayjs from "dayjs";
import dayjsComparator from "../utilities/dayjsComparator";
import CarpoolArrangement from "./CarpoolArrangement";
import CarpoolState from "./CarpoolState";
import CarpoolStateArray from "./CarpoolStateArray";
import { CanDriveCarpool } from "./Dancer";
import { DeepStateObject, DeepStatePrimitive } from "./DeepState";
import { ID } from "./KeyListAndMap";
import Session from "./Session";

/** Holds one possible arrangement of dancers in carpools. */
export class CarpoolArrangementState extends DeepStateObject<CarpoolArrangement, {
    auto: DeepStatePrimitive<true> | undefined,
    name: DeepStatePrimitive<string>,
    carpools: CarpoolStateArray,
}> {
    private _session: Session;

    /**
     * Holds one possible arrangement of dancers in carpools.
     * @param session The `Session` object that will contain this object
     * @param value The initial arrangement
     */
    constructor(session: Session, value?: CarpoolArrangement) {
        super(undefined, (key, value): any => {
            switch (key) {
                case "carpools":
                    return new CarpoolStateArray(session, value as CarpoolArrangement["carpools"]);
            }
            return new DeepStatePrimitive(value);
        }, true);
        this._session = session;
        this.setValue(value ?? CarpoolArrangement.DEFAULT);
    }

    /**
     * Returns a string representation of this object.
     * Includes dancer IDs but not dancer information.
     */
    public override toString(): string {
        return JSON.stringify(this.getValue());
    }

    /** Creates a new `FleetState` from the output of `toString`. */
    public static fromString(session: Session, s: string | null | undefined): CarpoolArrangementState {
        if (s) {
            return new CarpoolArrangementState(session, JSON.parse(s));
        }
        return new CarpoolArrangementState(session);
    }

    protected override validateNewValue(newValue: any): CarpoolArrangement {
        const {
            auto,
            name,
            carpools,
            ...unrecognizedChildren
        } = super.validateNewValue(newValue);

        this.unrecognizedChildren = unrecognizedChildren;

        const result: CarpoolArrangement = {
            name,
            carpools,
        };

        if (auto) {
            result.auto = true;
        }

        return result;
    }

    /** Returns the carpools in this carpool arrangement sorted by departure time. */
    public getCarpoolStatesOrderedByDeparture(): CarpoolState[] {
        const carpoolStates = this.getChildState("carpools").getChildStates();
        carpoolStates.sort((a, b) => dayjsComparator(a.getChildValue("departure"), b.getChildValue("departure")));
        return carpoolStates;
    }

    /**
     * Returns the carpools in this carpool arrangement sorted by departure time and grouped by departure day and hour.
     */
    public groupByDepartureTime(): CarpoolArrangementState.CarpoolsForDay[] {
        const carpoolStates = this.getCarpoolStatesOrderedByDeparture();
        if (!carpoolStates.length) {
            return [];
        }

        let lastDayjs = carpoolStates[0].getChildValue("departure");
        const carpoolsByDay: CarpoolArrangementState.CarpoolsForDay[] =
            [new CarpoolArrangementState.CarpoolsForDay(lastDayjs)];
        for (const carpoolState of carpoolStates) {
            const departure = carpoolState.getChildValue("departure");

            // Add days until the last day in `carpoolsByDay` is the same day as this departure.
            while ((
                lastDayjs = carpoolsByDay[carpoolsByDay.length - 1].day,
                shouldAddAnother("day", lastDayjs, departure)
            )) {
                carpoolsByDay.push(new CarpoolArrangementState.CarpoolsForDay(departure === null ? null : lastDayjs.add(1, "day")));
            }

            // Add hours until the last hour in `carpoolsByHour` is the same hour as this departure.
            const carpoolsByHour = carpoolsByDay[carpoolsByDay.length - 1].carpoolsByHour;
            while ((
                lastDayjs = carpoolsByHour[carpoolsByHour.length - 1].hour,
                shouldAddAnother("hour", lastDayjs, departure)
            )) {
                if (departure === null) {
                    throw new Error("A null departure is being added to a non-null day!");
                }
                carpoolsByHour.push(new CarpoolArrangementState.CarpoolsForHour(lastDayjs.add(1, "hour")));
            }

            carpoolsByHour[carpoolsByHour.length - 1].carpoolStates.push(carpoolState);
        }
        return carpoolsByDay;

        function shouldAddAnother(
            unit: dayjs.OpUnitType,
            lastDayjs: dayjs.Dayjs | null,
            departure: dayjs.Dayjs | null
        ): lastDayjs is dayjs.Dayjs {
            if (departure === null) {
                return lastDayjs !== null;
            }
            if (lastDayjs === null) {
                // `lastDayjs` should always sort before `departure`, and `dayjsComparator` sorts `null` to the end.
                throw new Error("A non-null departure was sorted after a null departure!");
            }
            return !lastDayjs.isSame(departure, unit);
        }
    }

    /** Returns a `DancerListState` of dancers who are traveling with the team but are not assigned to a carpool. */
    public findUnassignedDancers(): Set<ID> {
        const dancerKLMState = this._session.getChildState("dancers");
        const idsOfUnassignedDancers = new Set<ID>();

        // Add the IDs of the dancers who are traveling with the team.
        for (const { id, state } of dancerKLMState.list.getIDsAndReferencedStates()) {
            if (state.getChildValue("canDriveCarpool") !== CanDriveCarpool.TravelingOnOwn) {
                idsOfUnassignedDancers.add(id);
            }
        }

        // Remove the IDs of dancers who are assigned to a carpool.
        for (const carpoolState of this.getChildState("carpools").getChildStates()) {
            for (const id of carpoolState.getChildValue("occupants")) {
                idsOfUnassignedDancers.delete(id);
            }
        }

        // The set now contains the IDs of dancers who are traveling with the team but are not assigned to a carpool.
        return idsOfUnassignedDancers;
    }
}

export namespace CarpoolArrangementState {
    /** A collection of carpools whose departure time is within the given hour. */
    export class CarpoolsForHour {
        /**
         * A `Dayjs` object that represents the hour of the day.
         * The minutes are set to 0, but all smaller units should be ignored.
         */
        public hour: dayjs.Dayjs | null;
        /** The `CarpoolStates` that depart within the hour. Should be sorted by departure time. */
        public carpoolStates: CarpoolState[];

        constructor(hour: CarpoolsForHour["hour"]) {
            this.hour = hour === null ? null : hour.minute(0);
            this.carpoolStates = [];
        }
    }

    /** A collection of carpools whose departure time is within the given day. */
    export class CarpoolsForDay {
        /** A `Dayjs` object that represents the date. Hours and all smaller units should be ignored. */
        public day: dayjs.Dayjs | null;
        /** A collection of `CarpoolsForHour` objects that contain carpools that depart within the day. */
        public carpoolsByHour: CarpoolsForHour[];

        constructor(day: CarpoolsForDay["day"]) {
            this.day = day;
            this.carpoolsByHour = [new CarpoolsForHour(day)];
        }
    }
}

export default CarpoolArrangementState;
