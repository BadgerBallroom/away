import { useCallback, useContext, useEffect, useState } from "react";
import ElementSelectionContext from "../components/ElementSelectionContext";
import { useSelectionManager } from "../utilities/SelectionManager";
import { ElementSelectionManager } from "./ElementSelectionManager";

/**
 * Stores which indices in `elements` are selected. Call this from an element that contains elements that can be
 * selected and pass `elementSelection` to an `ElementSelectionContext.Provider`.
 * @param getElements A function that returns an array (or `HTMLCollectionOf`) of elements that can be selected
 * @returns An `ElementSelectionManager`
 */
export function useElementSelectionManager<E extends Element = Element>(
    getElements: ElementSelectionManager.GetElements<E>,
): ElementSelectionManager<E> {
    const { selection, onSelectableElementClick, ...others } = useSelectionManager();

    const [elementSelection, setElementSelection] = useState(() => {
        return new ElementSelectionManager.Selection<E>(selection.set, getElements, onSelectableElementClick);
    });
    useEffect(() => {
        const s = new ElementSelectionManager.Selection<E>(selection.set, getElements, onSelectableElementClick);
        setElementSelection(s);
    }, [getElements, selection, onSelectableElementClick]);

    return { selection: elementSelection, ...others };
}

export interface SelectableElementAttributes {
    /** Whether the element is selected */
    isSelected: boolean;
    /** A callback for when the element is clicked */
    onClick: (event: React.MouseEvent | React.KeyboardEvent) => void;
}

/**
 * Tracks whether an element that can be selected is selected. Call this from an element that can be selected and that
 * is inside an `ElementSelectionContext.Provider`.
 * @param ref A React `ref` to the element
 * @returns A `SelectableElementAttributes`
 */
export function useSelectableElementAttributes(
    ref: React.RefObject<HTMLElement | undefined>,
): SelectableElementAttributes {
    const selectableElements = useContext(ElementSelectionContext);

    const isSelected = ref.current !== undefined && selectableElements.isSelected(ref.current);

    const onClick = useCallback((event: React.MouseEvent | React.KeyboardEvent) => {
        if (!ref.current) {
            return;
        }

        const index = selectableElements.indexOf(ref.current);
        if (index < 0) {
            return;
        }

        event.stopPropagation();
        selectableElements.onSelectableElementClick(event, index);
    }, [ref, selectableElements]);

    return { isSelected, onClick };
}
