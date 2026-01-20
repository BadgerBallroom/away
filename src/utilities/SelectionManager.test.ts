import { act, renderHook } from "@testing-library/react";
import SelectionManager, { useSelectionManager } from "./SelectionManager";

/** Makes a `ClickEvent` with the default values and the specified overrides. */
function makeClickEvent(overrides?: Partial<SelectionManager.ClickEvent>): SelectionManager.ClickEvent {
    return {
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        ...overrides,
    };
}

function renderSelectionManager(): SelectionManager {
    return renderHook(() => useSelectionManager()).result.current;
}

function expectSelectionToEqual(selection: SelectionManager.Selection, toEqual: number[]): void {
    expect(selection.equals(new SelectionManager.Selection(new Set(toEqual)))).toBeTruthy();
}

describe("SelectionManager", () => {
    test("makes initial selection empty", () => {
        const { selection } = renderSelectionManager();

        expect(selection.set.size).toEqual(0);
    });

    test("selects single item when it is clicked", () => {
        const { selection, onSelectableElementClick: onClick } = renderSelectionManager();

        act(() => {
            onClick(makeClickEvent(), 1); // should select 1
            onClick(makeClickEvent(), 3); // should deselect 1 and select 3
            onClick(makeClickEvent(), 3); // should do nothing
        });

        expectSelectionToEqual(selection, [3]);
    });

    test("deselects single item: click, Ctrl+click on same item", () => {
        const { selection, onSelectableElementClick: onClick } = renderSelectionManager();

        act(() => {
            onClick(makeClickEvent(), 3); // should select 3
            onClick(makeClickEvent({ ctrlKey: true }), 3); // should deselect 3
        });

        expect(selection.set.size).toEqual(0);
    });

    test("selects range of items: click, Shift+click", () => {
        const { selection, onSelectableElementClick: onClick } = renderSelectionManager();

        act(() => {
            onClick(makeClickEvent(), 8); // should select 8
            onClick(makeClickEvent({ shiftKey: true }), 10); // should select 9 and 10
        });

        expectSelectionToEqual(selection, [8, 9, 10]);
    });

    test("selects range of items: click, Shift+Click on earlier item", () => {
        const { selection, onSelectableElementClick: onClick } = renderSelectionManager();

        act(() => {
            onClick(makeClickEvent(), 10); // should select 10
            onClick(makeClickEvent({ shiftKey: true }), 8); // should select 9 and 8
        });

        expectSelectionToEqual(selection, [8, 9, 10]);
    });

    test("selects only last item: click, Shift+Click, click", () => {
        const { selection, onSelectableElementClick: onClick } = renderSelectionManager();

        act(() => {
            onClick(makeClickEvent(), 3); // should select 3
            onClick(makeClickEvent({ shiftKey: true }), 5); // should select 4 and 5
            onClick(makeClickEvent(), 4); // should deselect 3 and 5
        });

        expectSelectionToEqual(selection, [4]);
    });

    test("deselects last item: click, Shift+Click, Ctrl+click", () => {
        const { selection, onSelectableElementClick: onClick } = renderSelectionManager();

        act(() => {
            onClick(makeClickEvent(), 3); // should select 3
            onClick(makeClickEvent({ shiftKey: true }), 5); // should select 4 and 5
            onClick(makeClickEvent({ ctrlKey: true }), 4); // should deselect 4
        });

        expectSelectionToEqual(selection, [3, 5]);
    });

    test("selects range of items: Shift+click, Shift+Click", () => {
        const { selection, onSelectableElementClick: onClick } = renderSelectionManager();

        act(() => {
            onClick(makeClickEvent({ shiftKey: true }), 3); // should select 3
            onClick(makeClickEvent({ shiftKey: true }), 5); // should select 4 and 5
        });

        expectSelectionToEqual(selection, [3, 4, 5]);
    });

    test("selects only second range of items: click, Shift+Click, Shift+Click", () => {
        const { selection, onSelectableElementClick: onClick } = renderSelectionManager();

        act(() => {
            onClick(makeClickEvent(), 3); // should select 3
            onClick(makeClickEvent({ shiftKey: true }), 7); // should select 4, 5, 6, and 7
            onClick(makeClickEvent({ shiftKey: true }), 5); // should deselect 6 and 7
        });

        expectSelectionToEqual(selection, [3, 4, 5]);
    });

    test("selects two items: click, Ctrl+click", () => {
        const { selection, onSelectableElementClick: onClick } = renderSelectionManager();

        act(() => {
            onClick(makeClickEvent(), 3); // should select 3
            onClick(makeClickEvent({ ctrlKey: true }), 5); // should select 5
        });

        expectSelectionToEqual(selection, [3, 5]);
    });

    test("selects only range of items: click, Ctrl+click, Shift+click", () => {
        const { selection, onSelectableElementClick: onClick } = renderSelectionManager();

        act(() => {
            onClick(makeClickEvent(), 1); // should select 1
            onClick(makeClickEvent({ ctrlKey: true }), 3); // should select 3
            onClick(makeClickEvent({ shiftKey: true }), 5); // should deselect 1 and select 4 and 5
        });

        expectSelectionToEqual(selection, [3, 4, 5]);
    });

    test("selects range of items and last item: click, Shift+Click, Ctrl+click", () => {
        const { selection, onSelectableElementClick: onClick } = renderSelectionManager();

        act(() => {
            onClick(makeClickEvent(), 1); // should select 1
            onClick(makeClickEvent({ shiftKey: true }), 3); // should select 2 and 3
            onClick(makeClickEvent({ ctrlKey: true }), 5); // should select 5
        });

        expectSelectionToEqual(selection, [1, 2, 3, 5]);
    });

    test("selects two ranges of items: click, Shift+Click, Ctrl+click, Ctrl+Shift+click", () => {
        const { selection, onSelectableElementClick: onClick } = renderSelectionManager();

        act(() => {
            onClick(makeClickEvent(), 1); // should select 1
            onClick(makeClickEvent({ shiftKey: true }), 3); // should select 2 and 3
            onClick(makeClickEvent({ ctrlKey: true }), 5); // should select 5
            onClick(makeClickEvent({ ctrlKey: true, shiftKey: true }), 7); // select 6 and 7
        });

        expectSelectionToEqual(selection, [1, 2, 3, 5, 6, 7]);
    });

    describe("replaceSelection", () => {
        test("replaces selection", () => {
            const expectedSelection = [1, 2, 3];
            const { selection, onSelectableElementClick: onClick, replaceSelection } = renderSelectionManager();

            act(() => {
                onClick(makeClickEvent(), 3);
                replaceSelection(new Set(expectedSelection));
            });

            expectSelectionToEqual(selection, expectedSelection);
        });
    });

    describe("clearSelection", () => {
        test("clears selection", () => {
            const { selection, onSelectableElementClick: onClick, clearSelection } = renderSelectionManager();

            act(() => {
                onClick(makeClickEvent(), 3);
                clearSelection();
            });

            expectSelectionToEqual(selection, []);
        });
    });
});
