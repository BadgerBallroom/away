import { Dayjs } from "dayjs";
import dayjsComparator from "../utilities/dayjsComparator";
import { ID } from "./KeyListAndMap";

/** Represents one instance of a group of dancers traveling in one vehicle together. */
export interface Carpool {
    /** When the car will leave the origin city and head toward the competition */
    departure: Dayjs | null;
    /** The IDs of the dancers who are in the car; the first one is the driver */
    occupants: ID[];
}

export namespace Carpool {
    export const DEFAULT: Carpool = {
        departure: null,
        occupants: [],
    };

    /** The minimum number of dancers that can be in a carpool, including the driver */
    export const MIN_DANCERS = 1;

    /** Comparator function for sorting `Carpool` objects. */
    export function comparator(a: Carpool, b: Carpool): number {
        return dayjsComparator(a.departure, b.departure);
    }
}

export default Carpool;
