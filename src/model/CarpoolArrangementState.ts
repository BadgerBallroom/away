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
    private _mapFromDancerIDs = new Map<ID, CarpoolState>();

    /**
     * A map from each dancer ID to the state of the carpool that the dancer is in.
     * If a dancer ID is not in this map, the dancer is not assigned to any carpool.
     * The map is replaced with a new object whenever the value changes, so it can be used to trigger React rerenders.
     */
    public get mapFromDancerIDs(): ReadonlyMap<ID, CarpoolState> {
        return this._mapFromDancerIDs;
    }

    // #region DeepState overrides
    /**
     * Holds one possible arrangement of dancers in carpools.
     * @param session The `Session` object that will contain this object
     * @param value The initial arrangement
     */
    constructor(session: Session, value?: CarpoolArrangement) {
        super(undefined, (key, value) => {
            switch (key) {
                case "auto":
                    return DeepStatePrimitive.NewOrUndefined<true>(value as CarpoolArrangement["auto"]);
                case "name":
                    return new DeepStatePrimitive(value as CarpoolArrangement["name"]);
                case "carpools":
                    return new CarpoolStateArray(session, value as CarpoolArrangement["carpools"]);
            }
        }, true);

        this._session = session;

        // This change listener never has to be removed because it should last as long as this object.
        this.addChangeListener(() => {
            this._mapFromDancerIDs = new Map<ID, CarpoolState>();
            const carpoolStates = this.getChildState("carpools").getChildStates();
            for (const carpoolState of carpoolStates) {
                for (const id of carpoolState.getChildValue("occupants")) {
                    this._mapFromDancerIDs.set(id, carpoolState);
                }
            }
        });

        this.setValue(value ?? CarpoolArrangement.DEFAULT);
    }

    /**
     * Returns a string representation of this object.
     * Includes dancer IDs but not dancer information.
     */
    public override toString(): string {
        return JSON.stringify(this.getValue());
    }

    /** Creates a new `CarpoolArrangementState` from the output of `toString`. */
    public static fromString(session: Session, s: string | null | undefined): CarpoolArrangementState {
        if (s) {
            return new CarpoolArrangementState(session, JSON.parse(s));
        }
        return new CarpoolArrangementState(session);
    }

    protected override validateNewValue(newValue: unknown): CarpoolArrangement {
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
    // #endregion

    // #region Organizing carpools
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
                carpoolsByDay.push(new CarpoolArrangementState.CarpoolsForDay(
                    departure === null
                        ? null
                        : lastDayjs.add(1, "day"),
                ));
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
            departure: dayjs.Dayjs | null,
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

    /** Returns the IDs of the dancers who are traveling with the team but are not assigned to a carpool. */
    public findUnassignedDancers(): ID[] {
        const dancerKLMState = this._session.getChildState("dancers");
        const result: ID[] = [];

        for (const { id, state } of dancerKLMState.list.getIDsAndReferencedStates()) {
            if (
                state.getChildValue("canDriveCarpool") !== CanDriveCarpool.TravelingOnOwn
                && !this.mapFromDancerIDs.has(id)
            ) {
                result.push(id);
            }
        }

        return result;
    }
    // #endregion

    // #region Moving dancers around the arrangement
    /**
     * Computes whether the dancer can become (and is not already) the driver of their own car.
     * @param dancerID The ID of the dancer
     * @returns Whether the dancer can a driver
     */
    public canPromoteToDriver(dancerID: ID): boolean {
        const dancerState = this._session.getChildState("dancers").map.getChildState(dancerID);
        if (!dancerState) {
            return false;
        }

        // The dancer must be able to drive.
        const canDriveCarpool = dancerState.getChildValue("canDriveCarpool");
        if (canDriveCarpool !== CanDriveCarpool.Yes && canDriveCarpool !== CanDriveCarpool.YesIfNeeded) {
            return false;
        }

        // The dancer must not already be a driver. One way not to be a driver is not to be in a carpool.
        const carpoolState = this.mapFromDancerIDs.get(dancerID);
        if (!carpoolState) {
            return true;
        }

        // The dancer is in a carpool, but as long as they are not the first occupant, they are not a driver.
        return carpoolState.driverDancerID !== dancerID;
    }

    /**
     * Creates a new carpool within this carpool arrangement. Makes the specified dancer the driver of that carpool.
     * Does nothing if the specified dancer cannot become a driver.
     * @param dancerID The dancer to turn into a driver
     * @returns The state of the newly created carpool if driver was promoted, else `undefined`
     */
    public promoteToDriver(dancerID: ID): CarpoolState | undefined {
        if (!this.canPromoteToDriver(dancerID)) {
            return undefined;
        }

        // If the dancer is currently in a carpool, remove them from that carpool.
        this.mapFromDancerIDs.get(dancerID)?.getChildState("occupants").remove(dancerID);

        const dancerState = this._session.getChildState("dancers").map.getChildState(dancerID);
        if (!dancerState) {
            return undefined;
        }

        const carpoolState = new CarpoolState(this._session, {
            departure: dancerState.getChildValue("earliestPossibleDeparture"),
            occupants: [dancerID],
        });

        // Adding the new carpool to this carpool arrangement should trigger an update to `mapFromDancerIDs`.
        this.getChildState("carpools").pushState(carpoolState);

        return carpoolState;
    }

    /**
     * @returns `true` if the specified dancer is a passenger, `false` if they are a driver, and `undefined` if they are
     *          not assigned to any carpool
     */
    public isPassenger(dancerID: ID): boolean | undefined {
        const carpoolState = this.mapFromDancerIDs.get(dancerID);
        if (!carpoolState) {
            return undefined;
        }
        return carpoolState.getChildValue("occupants").indexOf(dancerID) > 0;
    }

    /**
     * Removes a dancer from whatever carpool that they are in.
     * Does not put the dancer in any other carpool.
     * If the dancer is the only one in their carpool, the whole carpool is deleted.
     * Note that if the driver is deleted, then the first passenger becomes the driver, even if they can't drive!
     */
    public unassignOccupant(dancerID: ID): void {
        const carpoolState = this.mapFromDancerIDs.get(dancerID);
        if (!carpoolState) {
            return;
        }

        const carpoolOccupantsState = carpoolState.getChildState("occupants");
        if (!carpoolOccupantsState) {
            return;
        }

        if (carpoolOccupantsState.length < 2) {
            this.getChildState("carpools").remove(carpoolState);
        } else {
            carpoolOccupantsState.remove(dancerID);
        }
    }

    /**
     * Deletes the carpool that contains the specified dancer. Does not put the dancers in any other carpool.
     * @param dancerID The dancer whose carpool to delete
     * @returns All the former occupants of the carpool
     */
    public deleteCarpoolWithDancer(dancerID: ID): ID[] {
        const carpoolState = this.mapFromDancerIDs.get(dancerID);
        if (!carpoolState) {
            return [];
        }
        const occupants = carpoolState.getChildValue("occupants");
        this.getChildState("carpools").remove(carpoolState);
        return occupants;
    }

    /**
     * Moves a dancer into a carpool. Removes them from the carpool that they are currently in (if any).
     * Does nothing if the specified driver is not actually the driver of a carpool.
     * Note that if the dancer was a driver, whoever is left to drive that car might not be able to drive!
     * @param dancerID The ID of the dancer to move
     * @param carpoolStateOrDriverDancerID Either the state of the carpool or the dancer ID of the driver of the carpool
     *                                     into which to move the dancer
     * @param position The index of the pre-existing dancer within carpool before which the new dancer should be
     *                 inserted (default: insert after the last pre-existing dancer)
     */
    public moveDancerToCarpool(
        dancerID: ID,
        carpoolStateOrDriverDancerID: CarpoolState | ID,
        position?: number,
    ): void {
        // Verify that the specified driver is actually the driver of an existing carpool.
        let newCarpoolState: CarpoolState | undefined;
        let driverDancerID: ID;
        if (carpoolStateOrDriverDancerID instanceof CarpoolState) {
            newCarpoolState = carpoolStateOrDriverDancerID;
            driverDancerID = newCarpoolState.driverDancerID;
        } else {
            newCarpoolState = this.mapFromDancerIDs.get(carpoolStateOrDriverDancerID);
            driverDancerID = carpoolStateOrDriverDancerID;
            if (!newCarpoolState || newCarpoolState.driverDancerID !== driverDancerID) {
                return;
            }
        }

        const newCarpoolOccupantsState = newCarpoolState.getChildState("occupants");
        if (position === undefined) {
            position = newCarpoolOccupantsState.length;
        }

        if (
            newCarpoolOccupantsState.getChildValue(position) === dancerID ||
            newCarpoolOccupantsState.getChildValue(position - 1) === dancerID
        ) {
            // The dancer is already in the requested position.
            return;
        }

        // Remove the dancer from the carpool that they are currently in. This returns the state of the ID.
        // If the dancer was not in a carpool previously, just put their ID in a new state.
        const idState = this.mapFromDancerIDs.get(dancerID)?.getChildState("occupants").remove(dancerID)
            ?? new DeepStatePrimitive(dancerID);

        // Add the dancer to the new carpool.
        newCarpoolOccupantsState.spliceStates(position, 0, idState);
    }
    // #endregion
}

export namespace CarpoolArrangementState {
    /** A collection of carpools whose departure time is within the given hour. */
    export class CarpoolsForHour {
        /** A `Dayjs` object that represents the hour of the day. The minutes and smaller units are truncated to 0. */
        public hour: dayjs.Dayjs | null;
        /** The `CarpoolStates` that depart within the hour. Should be sorted by departure time. */
        public carpoolStates: CarpoolState[];

        constructor(hour: CarpoolsForHour["hour"]) {
            this.hour = hour === null ? null : hour.startOf("hour");
            this.carpoolStates = [];
        }
    }

    /** A collection of carpools whose departure time is within the given day. */
    export class CarpoolsForDay {
        /** A `Dayjs` object that represents the date. Hours and all smaller units are truncated to 0. */
        public day: dayjs.Dayjs | null;
        /** A collection of `CarpoolsForHour` objects that contain carpools that depart within the day. */
        public carpoolsByHour: CarpoolsForHour[];

        constructor(day: CarpoolsForDay["day"]) {
            this.day = day === null ? null : day.startOf("day");
            this.carpoolsByHour = [new CarpoolsForHour(day)];
        }
    }
}

export default CarpoolArrangementState;
