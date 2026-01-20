import { useCallback, useRef, useState } from "react";

export interface SelectionManager {
    /**
     * An object whose `set` property is the set of array indices. When the set mutates, this object will be re-created,
     * thereby triggering a re-render on React elements that use it. However, the set itself will not be re-created, so
     * you should not use it to trigger re-renders.
    */
    selection: SelectionManager.Selection;
    /** Clears the selection. */
    clearSelection: () => void;
    /**
     * Adds a range to the selection (without clearing it first).
     * The range includes `start` but does not include `end`.
     */
    addRangeToSelection: (start: number, end: number) => void;
    /**
     * A callback for mutating the set. Set it as the `onClick` handler of the HTML element that represents each element
     * in the array. This will automatically handle when the user is pressing Shift or Ctrl to select multiple items.
     * @param event A `SelectionEvent`, which conveys whether Shift, Ctrl, or Alt was pressed
     * @param index The index of the array element whose HTML element was clicked
     */
    onSelectableElementClick: (event: SelectionManager.ClickEvent, index: number) => void;
}

export namespace SelectionManager {
    /** Conveys whether Shift, Ctrl, or Alt was pressed when the user clicked on an item */
    export interface ClickEvent {
        /** Whether the Alt/Option key was pressed when the user clicked on an item */
        altKey: boolean;
        /** Whether the Ctrl key was pressed when the user clicked on an item */
        ctrlKey: boolean;
        /** Whether the Shift key was pressed when the user clicked on an item */
        shiftKey: boolean;
    }

    /**
     * An object that holds a set of array indices. This object can be shallow-copied to trigger re-renders while the
     * underlying set is not copied.
     */
    export class Selection<S extends ReadonlySet<number> = ReadonlySet<number>> {
        public readonly set: S;

        constructor(set: S) {
            this.set = set;
        }

        public equals(other: Selection<S>): boolean {
            if (Object.is(this, other)) {
                return true;
            }

            if (this.set.size !== other.set.size) {
                return false;
            }

            const iterator = this.set.values();
            for (let next = iterator.next(); !next.done; next = iterator.next()) {
                if (!other.set.has(next.value)) {
                    return false;
                }
            }

            return true;
        }
    }
}

export default SelectionManager;

/**
 * Stores a set of array indices. Useful for tracking which elements in an array are selected.
 * @returns A `SelectionManager`
 */
export function useSelectionManager(): SelectionManager {
    const [selection, setSelection] = useState(() => new SelectionManager.Selection(new Set<number>()));
    const lastNonShiftSelectedRef = useRef(-1);

    // Extract the `set` to avoid a useCallback dependency on `selection`.
    const selectionSet = selection.set;
    const triggerStateChange = useCallback(() => {
        // Create a new object (without copying the set itself) to trigger a re-render.
        setSelection(new SelectionManager.Selection(selectionSet));
    }, [selectionSet]);

    return {
        selection,
        clearSelection: useCallback(() => {
            // To avoid re-rendering components that weren't selected, we must clear the existing set instead of
            // constructing a new one.
            selectionSet.clear();
            triggerStateChange();
            lastNonShiftSelectedRef.current = -1;
        }, [selectionSet, triggerStateChange]),
        addRangeToSelection: useCallback((start, end) => {
            for (; start < end; ++start) {
                selectionSet.add(start);
            }
            triggerStateChange();
        }, [selectionSet, triggerStateChange]),
        onSelectableElementClick: useCallback((event: SelectionManager.ClickEvent, index: number) => {
            const altOrCtrl = event.altKey || event.ctrlKey;

            if (selectionSet.has(index) && !event.shiftKey) {
                // This item is already selected, and the Shift key is not being pressed.
                // If the Ctrl or Alt key is pressed, deselect this item. Otherwise, deselect other items.
                if (altOrCtrl) {
                    selectionSet.delete(index);
                } else {
                    selectionSet.clear();
                    selectionSet.add(index);
                }
            } else {
                // This item is not selected currently.
                // If the Ctrl or Alt key is pressed, select this item, but don't select other items.
                // Inversely, if the Ctrl and Alt keys are not pressed, do deselect all other items.
                if (!altOrCtrl) {
                    selectionSet.clear();
                }

                // If the Shift key is pressed, add all items between this item and the item that was last selected
                // without the Shift key being held down.
                if (event.shiftKey && lastNonShiftSelectedRef.current !== -1) {
                    const [start, end] = index < lastNonShiftSelectedRef.current
                        ? [index, lastNonShiftSelectedRef.current]
                        : [lastNonShiftSelectedRef.current, index];
                    for (let i = start; i <= end; ++i) {
                        selectionSet.add(i);
                    }
                } else {
                    selectionSet.add(index);
                }
            }

            // Remember which item was last selected without the Shift key being held down.
            // Also remember it if only one item is currently selected.
            if (!event.shiftKey || selectionSet.size === 1) {
                lastNonShiftSelectedRef.current = index;
            }

            triggerStateChange();
        }, [selectionSet, triggerStateChange]),
    };
}
