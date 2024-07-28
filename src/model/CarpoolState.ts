import { Dayjs } from "dayjs";
import { validateDayjsValue } from "../utilities/validation";
import Carpool from "./Carpool";
import { DancerListState } from "./DancerKLM";
import { DeepStateObject, DeepStatePrimitive } from "./DeepState";
import Session from "./Session";

export default class CarpoolState extends DeepStateObject<Carpool, {
    departure: DeepStatePrimitive<Dayjs> | DeepStatePrimitive<null>,
    occupants: DancerListState,
}> {
    private static nextEvanescentID = 0;
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
        super(undefined, (key, value): any => {
            switch (key) {
                case "occupants":
                    return DancerListState.makeAndRegister(session, value as Carpool["occupants"]);
            }
            return new DeepStatePrimitive(value);
        }, true);
        this.setValue(value ?? Carpool.DEFAULT);
        this._evanescentID = ++CarpoolState.nextEvanescentID;
    }

    protected override validateNewValue(newValue: any): Carpool {
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
}
