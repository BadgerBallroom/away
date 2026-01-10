import { act, renderHook } from "@testing-library/react";
import { default as makeClickEvent } from "../utilities/testing/makeSelectionManagerClickEvent";
import { useElementSelectionManager } from "./ElementSelectionHooks";

function renderElementSelectionManager(elements: HTMLCollectionOf<Element> | readonly Element[]) {
    return renderHook(() => useElementSelectionManager(elements));
}

describe("ElementSelectionManager", () => {
    const elements = [
        document.createElement("a"),
        document.createElement("audio"),
        document.createElement("button"),
        document.createElement("div"),
        document.createElement("img"),
        document.createElement("input"),
        document.createElement("p"),
        document.createElement("span"),
        document.createElement("textarea"),
        document.createElement("video"),
    ];

    describe("Selection", () => {
        describe("selectable", () => {
            test("is a map from elements to their indices in the array", () => {
                const { result: { current: { selection } } } = renderElementSelectionManager(elements);

                expect(selection.selectable.size).toEqual(elements.length);
                for (let i = 0; i < elements.length; ++i) {
                    expect(selection.selectable.get(elements[i])).toEqual(i);
                }
            });

            test("does not change when the selection does", () => {
                const { result } = renderElementSelectionManager(elements);
                const oldSelection = result.current.selection;

                act(() => {
                    result.current.selection.onSelectableElementClick(makeClickEvent(), 0);
                });

                const newSelection = result.current.selection;
                expect(newSelection.selectable).toEqual(oldSelection.selectable);
            });
        });

        describe("selected", () => {
            test("starts empty", () => {
                const { result: { current: { selection } } } = renderElementSelectionManager(elements);

                expect(selection.selected.size).toEqual(0);
            });

            test("tracks the selection", () => {
                // More complex selection cases are covered by SelectionManager.test.ts.
                const { result } = renderElementSelectionManager(elements);

                act(() => {
                    // Select the <div>.
                    result.current.selection.onSelectableElementClick(makeClickEvent(), 3);
                    // Select the <img>, <input>, and <p>.
                    result.current.selection.onSelectableElementClick(makeClickEvent({ shiftKey: true }), 6);
                });

                const { selection } = result.current;
                expect(selection.selected).toEqual(new Set(elements.slice(3, 7)));
            });
        });
    });
});
