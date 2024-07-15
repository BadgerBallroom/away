import { Dayjs } from "dayjs";

export enum CanDriveCarpool {
    No = "N",
    Yes = "Y",
    YesIfNeeded = "YIN",
    TravelingOnOwn = "NA",
}

export enum Accommodation {
    NoPreference = "ANY",
    FreeHousingPreferred = "FREE",
    HotelPreferred = "HOTEL",
    StayingOnOwn = "NA",
}

export enum Gender {
    Male = "M",
    Female = "F",
    Other = "X",
}

/** A member of the dance team who may or may not be going to this competition. */
export interface Dancer {
    /** The person's name */
    name: string;

    /** Whether the person can drive others (and wants to) */
    canDriveCarpool: CanDriveCarpool | "";
    /** The maximum number of people, including themselves, that the person could take if they drove */
    canDriveMaxPeople: number;
    /** The earliest date and time that the person could leave */
    earliestPossibleDeparture: Dayjs | null;

    /** Where the person would prefer to stay */
    accommodation: Accommodation | "";
    /** Whether the person wants to stay with only others of the same gender */
    prefersSameGender: boolean;
    /** The person's gender (for housing assignment purposes) */
    gender: Gender | "";
}

export namespace Dancer {
    export const DEFAULT: Dancer = {
        name: "",
        canDriveCarpool: "",
        canDriveMaxPeople: 4,
        earliestPossibleDeparture: null,
        accommodation: "",
        prefersSameGender: false,
        gender: "",
    };

    /** Returns whether the `Dancer` object contains any data. */
    export function isEmpty({
        name,
        canDriveCarpool,
        earliestPossibleDeparture,
        accommodation,
        gender,
    }: Readonly<Dancer>): boolean {
        return name === ""
            && canDriveCarpool === ""
            && earliestPossibleDeparture === null
            && accommodation === ""
            && gender === "";
    }

    /** Returns whether specified `CanDriveCarpool` value means "yes" in some way. */
    export function canDriveCarpool(canDriveCarpool: CanDriveCarpool | ""): boolean {
        return canDriveCarpool === CanDriveCarpool.Yes || canDriveCarpool === CanDriveCarpool.YesIfNeeded;
    }
}

export default Dancer;
