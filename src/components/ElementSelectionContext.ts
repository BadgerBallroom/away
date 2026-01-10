import { createContext } from "react";
import ElementSelectionManager from "../model/ElementSelectionManager";

/**
 * Teleports an `ElementSelectionManager.Selection` from a parent element, which contains elements that can be selected,
 * to those elements that can be selected.
 */
export const ElementSelectionContext = createContext(
    new ElementSelectionManager.Selection<Element>([], new Set(), () => { }),
);

export default ElementSelectionContext;
