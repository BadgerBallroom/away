import SelectionManager from "../../model/SelectionManager";

/** Makes a `ClickEvent` with the default values and the specified overrides. */
export default function makeSelectionManagerClickEvent(overrides?: Partial<SelectionManager.ClickEvent>): SelectionManager.ClickEvent {
    return {
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        ...overrides
    };
}
