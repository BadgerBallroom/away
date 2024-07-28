import Carpool from "./Carpool";
import CarpoolState from "./CarpoolState";
import { DeepStateArray } from "./DeepState";
import Session from "./Session";

/** Holds the carpools (where each carpool has one driver and any number of passengers) in one carpool arrangement. */
export default class CarpoolStateArray extends DeepStateArray<Carpool, CarpoolState> {
    constructor(session: Session, initialValue?: Carpool[]) {
        super(initialValue, carpool => new CarpoolState(session, carpool));
    }
}
