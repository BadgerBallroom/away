import Carpool from "./Carpool";

/** Represents one possible arrangement of dancers in carpools. */
export interface CarpoolArrangement {
    /** Whether this arrangement was generated automatically */
    auto?: true;
    /** A user-defined name of this arrangement */
    name: string;
    /** The cars, their drivers, their passengers, and when they're leaving */
    carpools: Carpool[];
}

export namespace CarpoolArrangement {
    export const DEFAULT: CarpoolArrangement = {
        name: "",
        carpools: [],
    };
}

export default CarpoolArrangement;
