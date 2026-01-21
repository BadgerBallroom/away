import { act, renderHook } from "@testing-library/react";
import { default as makeClickEvent } from "../utilities/testing/makeSelectionManagerClickEvent";
import { useElementSelectionManager } from "./ElementSelectionHooks";
import ElementSelectionManager from "./ElementSelectionManager";

function renderElementSelectionManager(getElements: ElementSelectionManager.GetElements<Element>) {
    return renderHook(() => useElementSelectionManager(getElements));
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
    const getElements = () => elements;

    let renderHookResult: ReturnType<typeof renderElementSelectionManager>;
    let result: typeof renderHookResult.result;

    describe("Selection", () => {
        beforeEach(() => {
            renderHookResult = renderElementSelectionManager(getElements);
            result = renderHookResult.result;
        });

        describe("selected", () => {
            test("starts empty", () => {
                expect(result.current.selection.selected.size).toEqual(0);
            });

            test("tracks the selection", () => {
                // More complex selection cases are covered by SelectionManager.test.ts.
                act(() => {
                    // Select the <div>.
                    result.current.selection.onSelectableElementClick(makeClickEvent(), 3);
                    // Select the <img>, <input>, and <p>.
                    result.current.selection.onSelectableElementClick(makeClickEvent({ shiftKey: true }), 6);
                });

                expect(result.current.selection.selected).toEqual(new Set(elements.slice(3, 7)));
            });
        });

        describe("indexOf", () => {
            test("returns -1 if the element is not returned by getElements", () => {
                expect(result.current.selection.indexOf(document.createElement("div"))).toEqual(-1);
            });

            test("returns the index of the element", () => {
                expect(result.current.selection.indexOf(elements[3])).toEqual(3);
            });
        });

        describe("isSelected", () => {
            beforeEach(() => {
                act(() => {
                    result.current.selection.onSelectableElementClick(makeClickEvent(), 3);
                });
            });

            test("returns false if the element is not selected", () => {
                expect(result.current.selection.isSelected(elements[0])).toBe(false);
            });

            test("returns true if the element is selected", () => {
                expect(result.current.selection.isSelected(elements[3])).toBe(true);
            });
        });
    });
});
