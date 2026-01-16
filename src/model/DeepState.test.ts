import dayjs from "dayjs";
import { Mock } from "vitest";
import { DeepStateArray, DeepStateChangeCallback, DeepStateObject, DeepStatePrimitive, makeDeepState } from "./DeepState";

describe("makeDeepState", () => {
    test("value is array", () => {
        expect(makeDeepState([1, 2, 3])).toBeInstanceOf(DeepStateArray);
    });

    test("value is object", () => {
        expect(makeDeepState({ a: 1, b: 2, c: 3 })).toBeInstanceOf(DeepStateObject);
    });

    test("value is non-null, non-undefined primitive", () => {
        expect(makeDeepState(1)).toBeInstanceOf(DeepStatePrimitive);
    });

    test("value is Dayjs", () => {
        expect(makeDeepState(dayjs(123))).toBeInstanceOf(DeepStatePrimitive);
    });
});

describe("DeepStateArray", () => {
    let state: DeepStateArray<number>;
    let changeListener: Mock<DeepStateChangeCallback>;

    function initChangeListener() {
        changeListener = vi.fn();
        state.addChangeListener(changeListener);
    }

    /**
     * Tests `DeepStateArray`.
     * @param initialValue An array with at least four elements, none of which are 12345
     */
    function testsWithInitialValue(initialValue: readonly number[]): void {
        test("length is correct", () => {
            expect(state.length).toBe(initialValue.length);
            expect(changeListener).not.toHaveBeenCalled();
        });

        test("getValue returns initial value", () => {
            expect(state.getValue()).toEqual(initialValue);
            expect(changeListener).not.toHaveBeenCalled();
        });

        test("setValue overwrites value", () => {
            const newValue = [4, 5, 6, 7];
            state.setValue(newValue);
            expect(state.getValue()).toEqual(newValue);
            expect(state.isDefault()).toBe(false);
            expect(changeListener).toHaveBeenCalledExactlyOnceWith(false);
        });

        test("setValue throws error when passed something other than an array", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(() => state.setValue(6 as any)).toThrowError(new Error("The new value is not an array."));
        });

        test("setDescendantValue sets one element", () => {
            if (initialValue.length) {
                state.setDescendantValue([0], 12345);
                expect(state.getValue()).toEqual([12345, ...initialValue.slice(1)]);
                expect(changeListener).toHaveBeenCalledExactlyOnceWith(true);
            } else {
                expect(() => state.setDescendantValue([0], 12345))
                    .toThrowError(new Error("Non-existent state path: [0]"));
            }
        });

        test("isDefault returns whether array is empty", () => {
            expect(state.isDefault()).toBe(!initialValue.length);
            expect(changeListener).not.toHaveBeenCalled();
        });

        test("getChildStates returns child states", () => {
            const childStates = state.getChildStates();
            expect(childStates.length).toBe(initialValue.length);
            childStates.forEach((childState, i) => {
                expect(childState).toBeInstanceOf(DeepStatePrimitive);
                expect(childState.getValue()).toBe(initialValue[i]);
            });
            expect(changeListener).not.toHaveBeenCalled();
        });

        test("getChildState returns child state", () => {
            for (let i = 0; i < initialValue.length; i++) {
                expect(state.getChildState(i)).toBeInstanceOf(DeepStatePrimitive);
                expect(state.getChildState(i)?.getValue()).toBe(initialValue[i]);
            }
            expect(state.getChildState(-1)).toBeUndefined();
            expect(state.getChildState(initialValue.length)).toBeUndefined();
            expect(changeListener).not.toHaveBeenCalled();
        });

        test("getDescendantState returns child state", () => {
            for (let i = 0; i < initialValue.length; i++) {
                expect(state.getDescendantState([i])).toBe(state.getChildState(i));
            }
            expect(() => state.getDescendantState([-1])).toThrowError(new Error("Non-existent state path: [-1]"));
            expect(() => state.getDescendantState([initialValue.length]))
                .toThrowError(new Error(`Non-existent state path: [${initialValue.length}]`));
            expect(changeListener).not.toHaveBeenCalled();
        });

        test("clear removes all elements", () => {
            state.clear();
            expect(state.length).toBe(0);
            expect(state.getValue()).toEqual([]);
            expect(changeListener).toHaveBeenCalledExactlyOnceWith(false);
        });

        test("push adds element", () => {
            state.push(4);
            expect(state.getValue()).toEqual([...initialValue, 4]);
            expect(changeListener).toHaveBeenCalledExactlyOnceWith(false);
        });

        test("extend adds elements", () => {
            const extension = [4, 5, 6, 7];
            state.extend(extension);
            expect(state.getValue()).toEqual([...initialValue, ...extension]);
            expect(changeListener).toHaveBeenCalledExactlyOnceWith(false);
        });

        test("indexOf finds index of item", () => {
            if (initialValue.length) {
                expect(state.indexOf(initialValue[0])).toBe(0);
                expect(state.indexOf(initialValue[initialValue.length - 1])).toBe(initialValue.length - 1);
            }
            expect(state.indexOf(12345)).toBe(-1);
            expect(changeListener).not.toHaveBeenCalled();
        });

        test("indexOf finds index of item state", () => {
            if (initialValue.length) {
                expect(state.indexOf(state.getChildState(0)!)).toBe(0);
                expect(state.indexOf(state.getChildState(initialValue.length - 1)!)).toBe(initialValue.length - 1);
            }
            expect(state.indexOf(new DeepStatePrimitive(12345))).toBe(-1);
            expect(changeListener).not.toHaveBeenCalled();
        });

        test("pushState and pop do not copy the child state", () => {
            const childState = new DeepStatePrimitive(4);
            state.pushState(childState);
            expect(state.getValue()).toEqual([...initialValue, 4]);
            expect(state.getChildState(initialValue.length)).toBe(childState);
            expect(changeListener).toHaveBeenCalledExactlyOnceWith(false);
            changeListener.mockReset();

            expect(state.pop()).toBe(childState);
            expect(state.getValue()).toEqual(initialValue);
            expect(changeListener).toHaveBeenCalledExactlyOnceWith(false);
        });

        test("pop removes child state", () => {
            expect(state.pop(-1)).toBeUndefined();
            expect(state.pop(initialValue.length)).toBeUndefined();
            expect(changeListener).not.toHaveBeenCalled();
            changeListener.mockReset();

            const value = [...initialValue];
            for (const v of initialValue) {
                const childState = state.pop(0);
                expect(childState).toBeInstanceOf(DeepStatePrimitive);
                expect(childState?.getValue()).toBe(v);
                value.shift();
                expect(state.getValue()).toEqual(value);
                expect(changeListener).toHaveBeenCalledExactlyOnceWith(false);
                changeListener.mockReset();
            }

            expect(state.length).toBe(0);
            expect(state.getValue()).toEqual([]);
            expect(state.pop(0)).toBeUndefined();
            expect(changeListener).not.toHaveBeenCalled();
        });

        test("popMulti removes elements", () => {
            state.popMulti(new Set([-1, 0, 2, initialValue.length]));
            expect(state.getValue()).toEqual([...initialValue.slice(1, 2), ...initialValue.slice(3)]);
            expect(changeListener).toHaveBeenCalledExactlyOnceWith(false);
        });

        test("remove removes element if found", () => {
            state.remove(12345);
            expect(state.getValue()).toEqual(initialValue);
            expect(changeListener).not.toHaveBeenCalled();

            if (initialValue.length) {
                const itemState = state.getChildState(0)!;
                expect(state.remove(initialValue[0])).toBe(itemState);

                const value = initialValue.slice(1);
                expect(state.getValue()).toEqual(value);
                expect(changeListener).toHaveBeenCalledExactlyOnceWith(false);
            }
        });

        test("remove removes element state if found", () => {
            state.remove(new DeepStatePrimitive(12345));
            expect(state.getValue()).toEqual(initialValue);
            expect(changeListener).not.toHaveBeenCalled();

            if (initialValue.length) {
                const itemState = state.getChildState(0)!;
                expect(state.remove(itemState)).toBe(itemState);

                expect(state.getValue()).toEqual(initialValue.slice(1));
                expect(changeListener).toHaveBeenCalledExactlyOnceWith(false);
            }
        });

        test("sort sorts elements", () => {
            state.sort((a, b) => a.getValue() - b.getValue());
            expect(state.getValue()).toEqual([...initialValue].sort((a, b) => a - b));
            if (initialValue.length < 2) {
                expect(changeListener).not.toHaveBeenCalled();
            } else {
                expect(changeListener).toHaveBeenCalledExactlyOnceWith(false);
            }
        });

        test("toString returns JSON representation", () => {
            expect(state.toString()).toEqual(JSON.stringify(initialValue));
            expect(changeListener).not.toHaveBeenCalled();
        });

        test("listens to child state changes", () => {
            let childState = state.getChildState(0);
            if (!childState) {
                childState = makeDeepState<number>(6);
                state.pushState(childState);
                changeListener.mockReset();
            }

            childState.setValue(12345);
            expect(state.getValue()).toEqual([12345, ...initialValue.slice(1)]);
            expect(changeListener).toHaveBeenCalledExactlyOnceWith(true);
        });
    }

    describe("without initial value", () => {
        beforeEach(() => {
            state = new DeepStateArray();
            initChangeListener();
        });

        testsWithInitialValue([]);
    });

    describe("with initial value", () => {
        const value = [2, 7, 0, 4];

        beforeEach(() => {
            state = new DeepStateArray(value);
            initChangeListener();
        });

        testsWithInitialValue(value);
    });

    describe("with value set after initialization", () => {
        const value = [3, 9, 7, 2, 5, 0];

        beforeEach(() => {
            state = new DeepStateArray();
            state.setValue(value);
            initChangeListener();
        });

        testsWithInitialValue(value);
    });

    describe("with initial length of 1", () => {
        const value = [6];

        beforeEach(() => {
            state = new DeepStateArray(value);
            initChangeListener();
        });

        test("sort does not call change listeners", () => {
            state.sort((a, b) => a.getValue() - b.getValue());
            expect(state.getValue()).toEqual(value);
            expect(changeListener).not.toHaveBeenCalled();
        });
    });

    describe("with initial value already sorted", () => {
        const value = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

        beforeEach(() => {
            state = new DeepStateArray(value);
            initChangeListener();
        });

        test("sort does not call change listeners", () => {
            state.sort((a, b) => a.getValue() - b.getValue());
            expect(state.getValue()).toEqual(value);
            expect(changeListener).not.toHaveBeenCalled();
        });
    });
});

describe("DeepStateObject", () => {
    let state: DeepStateObject<Record<string, number | null | undefined>>;
    let changeListener: Mock<DeepStateChangeCallback>;

    function initChangeListener() {
        changeListener = vi.fn();
        state.addChangeListener(changeListener);
    }

    function testsWithInitialValue(initialValue: Record<string, number | null | undefined>): void {
        test("getValue returns initial value", () => {
            expect(state.getValue()).toEqual(initialValue);
            expect(changeListener).not.toHaveBeenCalled();
        });

        test("setValue overwrites value", () => {
            const newValue: Record<string, number> = { a: 12345, b: 67890 };
            state.setValue(newValue);
            expect(state.getValue()).toEqual(newValue);
            expect(state.isDefault()).toBe(false);
            expect(changeListener).toHaveBeenCalledExactlyOnceWith(false);
        });

        test("setValue throws error when passed something other than an object", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(() => state.setValue(6 as any)).toThrowError(new Error("The new value is not an object."));
        });

        test("setDescendantValue sets one element", () => {
            if (Object.keys(initialValue).indexOf("a") >= 0) {
                state.setDescendantValue(["a"], 12345);
                expect(state.getValue()).toEqual({ ...initialValue, a: 12345 });
                expect(changeListener).toHaveBeenCalledExactlyOnceWith(true);
            } else {
                expect(() => state.setDescendantValue(["a"], 12345))
                    .toThrowError(new Error("Non-existent state path: [\"a\"]"));
            }
        });

        test("getChildState returns child state", () => {
            for (const [key, value] of Object.entries(initialValue)) {
                expect(state.getChildState(key)).toBeInstanceOf(DeepStatePrimitive);
                expect(state.getChildState(key)?.getValue()).toBe(value);
            }
            expect(state.getChildState("non-existent key")).toBeUndefined();
            expect(changeListener).not.toHaveBeenCalled();
        });

        test("getDescendantState returns child state", () => {
            for (const [key, _] of Object.entries(initialValue)) {
                expect(state.getDescendantState([key])).toBe(state.getChildState(key));
            }
            expect(() => state.getDescendantState(["non-existent key"]))
                .toThrowError(new Error("Non-existent state path: [\"non-existent key\"]"));
            expect(changeListener).not.toHaveBeenCalled();
        });

        test("setChildState adds existing child state", () => {
            const childState = new DeepStatePrimitive(12345);
            state.setChildState("new key", childState);
            expect(state.getValue()).toEqual({ ...initialValue, "new key": 12345 });
            expect(state.getChildState("new key")).toBe(childState);
            expect(changeListener).toHaveBeenCalledExactlyOnceWith(false);
        });

        test("removeChildState removes child state", () => {
            state.removeChildState("a");
            if (initialValue.hasOwnProperty("a")) {
                const value = { ...initialValue };
                delete value.a;
                expect(state.getValue()).toEqual(value);
                expect(changeListener).toHaveBeenCalledExactlyOnceWith(false);
            } else {
                expect(changeListener).not.toHaveBeenCalled();
            }
        });

        test("hasOwnProperty returns whether the key exists", () => {
            expect(state.hasOwnProperty("a")).toBe(initialValue.hasOwnProperty("a"));
            expect(changeListener).not.toHaveBeenCalled();
        });

        test("keys returns the keys", () => {
            expect(state.keys()).toEqual(expect.arrayContaining(Object.keys(initialValue)));
            expect(changeListener).not.toHaveBeenCalled();
        });

        test("values returns the values", () => {
            expect(state.values()).toEqual(expect.arrayContaining(Object.values(initialValue)));
            expect(changeListener).not.toHaveBeenCalled();
        });

        test("entries returns the entries", () => {
            expect(state.entries()).toEqual(expect.arrayContaining(Object.entries(initialValue)));
            expect(changeListener).not.toHaveBeenCalled();
        });

        test("toString returns JSON representation", () => {
            // We don't compare to JSON.stringify(initialValue) because the order of the keys should not matter.
            expect(JSON.parse(state.toString())).toEqual(initialValue);
            expect(changeListener).not.toHaveBeenCalled();
        });

        test("listens to child state changes", () => {
            let childState = state.getChildState("a");
            if (!childState) {
                childState = makeDeepState<number>(6);
                state.setChildState("a", childState);
                changeListener.mockReset();
            }

            childState.setValue(12345);
            expect(state.getValue()).toEqual({ ...initialValue, a: 12345 });
            expect(changeListener).toHaveBeenCalledExactlyOnceWith(true);
        });
    }

    describe("with empty initial value", () => {
        beforeEach(() => {
            state = new DeepStateObject({});
            initChangeListener();
        });

        testsWithInitialValue({});

        test("isDefault returns true", () => {
            expect(state.isDefault()).toBe(true);
            expect(changeListener).not.toHaveBeenCalled();
        });
    });

    describe("with non-empty initial value", () => {
        const initialValue: Record<string, number | null | undefined> = { a: 1, b: 2, n: null, u: undefined };

        beforeEach(() => {
            state = new DeepStateObject(initialValue);
            initChangeListener();
        });

        testsWithInitialValue(initialValue);

        test("isDefault returns false", () => {
            expect(state.isDefault()).toBe(false);
            expect(changeListener).not.toHaveBeenCalled();
        });
    });

    describe("with value set after initialization", () => {
        const initialValue: Record<string, number | null | undefined> = { a: 1, b: 2, n: null, u: undefined };

        beforeEach(() => {
            state = new DeepStateObject({});
            state.setValue(initialValue);
            initChangeListener();
        });

        testsWithInitialValue(initialValue);

        test("isDefault returns false", () => {
            expect(state.isDefault()).toBe(false);
            expect(changeListener).not.toHaveBeenCalled();
        });
    });

    describe("with values all falsy", () => {
        test("isDefault returns true", () => {
            const state = new DeepStateObject<Record<string, number | string | boolean | undefined | null>>({
                a: 0,
                b: "",
                c: false,
                d: undefined,
                e: null,
            });
            expect(state.isDefault()).toBe(true);
        });
    });

    test("unrecognizedChildren survive", () => {
        class DeepStateObjectWithKnownKeys extends DeepStateObject<{ a: number }> {
            protected override validateNewValue(newValue: unknown): { a: number } {
                const { a, ...unrecognizedChildren } = super.validateNewValue(newValue);
                this.unrecognizedChildren = unrecognizedChildren;
                return { a };
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = new DeepStateObjectWithKnownKeys({ a: 1, b: 2 } as any);

        // Even though `b` is not a known key, it should still be included in the value.
        expect(state.getValue()).toEqual({ a: 1, b: 2 });
        expect(state.entries()).toEqual([["a", 1], ["b", 2]]);
        expect(state.keys()).toEqual(["a", "b"]);
        expect(state.values()).toEqual([1, 2]);
    });
});

describe("DeepStatePrimitive", () => {
    let state: DeepStatePrimitive<number>;
    let changeListener: Mock<DeepStateChangeCallback>;

    describe("NewOrUndefined", () => {
        test("value is undefined", () => {
            expect(DeepStatePrimitive.NewOrUndefined(undefined)).toBeUndefined();
        });

        test("value is null", () => {
            expect(DeepStatePrimitive.NewOrUndefined(null)).toBeNull();
        });

        test("value is neither null nor undefined", () => {
            const state = DeepStatePrimitive.NewOrUndefined(1);
            expect(state).toBeInstanceOf(DeepStatePrimitive);
            expect(state.getValue()).toBe(1);
        });
    });

    beforeEach(() => {
        state = new DeepStatePrimitive(5);
        changeListener = vi.fn();
        state.addChangeListener(changeListener);
    });

    test("getValue returns initial value", () => {
        expect(state.getValue()).toBe(5);
        expect(changeListener).not.toHaveBeenCalled();
    });

    test("setValue overwrites value", () => {
        state.setValue(12345);
        expect(state.getValue()).toBe(12345);
        expect(changeListener).toHaveBeenCalledExactlyOnceWith(false);
    });
});
