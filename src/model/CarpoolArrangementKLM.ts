import CarpoolArrangement from "./CarpoolArrangement";
import CarpoolArrangementState from "./CarpoolArrangementState";
import KeyListAndMap from "./KeyListAndMap";
import KeyListAndMapState, { KeyMapState } from "./KeyListAndMapState";
import Session from "./Session";

/** A map of ID-arrangement pairs and an array to store the order of IDs. */
export type CarpoolArrangementKLM = KeyListAndMap<CarpoolArrangement>;

/** Holds a map of ID-arrangement pairs and an array to store the order of IDs. */
export class CarpoolArrangementKLMState extends KeyListAndMapState<CarpoolArrangement, CarpoolArrangementState> {
    constructor(session: Session, initialValue: CarpoolArrangementKLM) {
        super(
            initialValue,
            undefined,
            map => new KeyMapState(carpoolArrangement => new CarpoolArrangementState(session, carpoolArrangement), map),
        );
    }
}
