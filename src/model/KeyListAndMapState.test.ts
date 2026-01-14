import { DeepStateObject, DeepStatePrimitive } from "./DeepState";
import KeyListAndMapState, { KeyListState } from "./KeyListAndMapState";

interface ValueWrapper {
    value: number;
}

describe("KeyListAndMapState", () => {
    describe("constructor", () => {
        test("it removes keys that are invalid IDs", () => {
            const klm = new KeyListAndMapState({ list: ["0", "*"], map: { "0": 0, "*": 1 } });

            expect(klm.getValue()).toEqual({ list: ["0"], map: { "0": 0 } });
        });
    });

    describe("addOrUpdate", () => {
        describe("(two-argument overload)", () => {
            let klm: KeyListAndMapState<number, DeepStatePrimitive<number>>;

            beforeEach(() => {
                klm = new KeyListAndMapState({ list: ["0", "1"], map: { "0": 0, "1": 1 } });
            });

            test("it updates an existing value", () => {
                const result = klm.addOrUpdate("1", 2);

                expect(result).toEqual({ "id": "1", "index": 1 });
                expect(klm.getValue()).toEqual({ list: ["0", "1"], map: { "0": 0, "1": 2 } });
            });

            test("it adds a new value with a given ID", () => {
                const result = klm.addOrUpdate("9", 9);

                expect(result).toEqual({ "id": "9", "index": 2 });
                expect(klm.getValue()).toEqual({ list: ["0", "1", "9"], map: { "0": 0, "1": 1, "9": 9 } });
            });

            test("it generates an ID if an empty one is given", () => {
                const result = klm.addOrUpdate("", 9);

                expect(result).toEqual({ "id": "2", "index": 2 });
                expect(klm.getValue()).toEqual({
                    list: ["0", "1", expect.anything()],
                    map: { "0": 0, "1": 1, [result.id]: 9 },
                });
            });

            test("it generates an ID if an invalid one is given", () => {
                const result = klm.addOrUpdate("*", 9);

                expect(result).toEqual({ "id": "2", "index": 2 });
                expect(klm.getValue()).toEqual({
                    list: ["0", "1", expect.anything()],
                    map: { "0": 0, "1": 1, [result.id]: 9 },
                });
            });
        });

        describe("(one-argument overload)", () => {
            let klm: KeyListAndMapState<ValueWrapper, DeepStateObject<ValueWrapper>>;

            beforeEach(() => {
                klm = new KeyListAndMapState({ list: ["0", "1"], map: { "0": { value: 0 }, "1": { value: 1 } } });
            });

            test("it updates an existing value", () => {
                const result = klm.addOrUpdate({ id: "1", value: 2 });

                expect(result).toEqual({ "id": "1", "index": 1 });
                expect(klm.getValue()).toEqual({
                    list: ["0", "1"],
                    map: { "0": { value: 0 }, "1": expect.objectContaining({ value: 2 }) },
                });
            });

            test("it adds a new value with a given ID", () => {
                const result = klm.addOrUpdate({ id: "9", value: 9 });

                expect(result).toEqual({ "id": "9", "index": 2 });
                expect(klm.getValue()).toEqual({
                    list: ["0", "1", "9"],
                    map: { "0": { value: 0 }, "1": { value: 1 }, "9": expect.objectContaining({ value: 9 }) },
                });
            });

            test("it generates an ID if an empty one is given", () => {
                const result = klm.addOrUpdate({ id: "", value: 9 });

                expect(result).toEqual({ "id": "2", "index": 2 });
                expect(klm.getValue()).toEqual({
                    list: ["0", "1", expect.anything()],
                    map: { "0": { value: 0 }, "1": { value: 1 }, [result.id]: expect.objectContaining({ value: 9 }) },
                });
            });

            test("it generates an ID if an invalid one is given", () => {
                const result = klm.addOrUpdate({ id: "*", value: 9 });

                expect(result).toEqual({ "id": "2", "index": 2 });
                expect(klm.getValue()).toEqual({
                    list: ["0", "1", expect.anything()],
                    map: { "0": { value: 0 }, "1": { value: 1 }, [result.id]: expect.objectContaining({ value: 9 }) },
                });
            });
        });
    });

    describe("get list", () => {
        describe("getReferencedValues", () => {
            test("it returns an array of the referenced values when `V` does not extend `object`", () => {
                const referencedValues = new KeyListAndMapState(
                    { list: ["0", "1"], map: { "0": 0, "1": 1 } },
                ).list.getReferencedValues();

                expect(referencedValues).toEqual([0, 1]);
            });

            test("it returns an array of the referenced values with `id` added when `V extends object`", () => {
                const referencedValues = new KeyListAndMapState(
                    { list: ["0", "1"], map: { "0": { value: 0 }, "1": { value: 1 } } },
                ).list.getReferencedValues();

                expect(referencedValues).toEqual([{ id: "0", value: 0 }, { id: "1", value: 1 }]);
            });

            test("it ignores IDs that are not in the map", () => {
                const referencedValues = new KeyListAndMapState(
                    { list: ["0", "1"], map: { "0": 0 } },
                ).list.getReferencedValues();

                expect(referencedValues).toEqual([0]);
            });
        });

        describe("getReferencedStates", () => {
            test("it returns an array of the states of the referenced values", () => {
                const referencedStates = new KeyListAndMapState(
                    { list: ["0", "1"], map: { "0": 0, "1": 1 } },
                ).list.getReferencedStates();

                expect(referencedStates.map(state => state.getValue())).toEqual([0, 1]);
            });

            test("it ignores IDs that are not in the map", () => {
                const referencedStates = new KeyListAndMapState(
                    { list: ["0", "1"], map: { "0": 0 } },
                ).list.getReferencedStates();

                expect(referencedStates.map(state => state.getValue())).toEqual([0]);
            });
        });
    });

    describe("garbageCollect", () => {
        let klm: KeyListAndMapState<number, DeepStatePrimitive<number>>;

        beforeEach(() => {
            klm = new KeyListAndMapState({ list: ["0"], map: { "0": 0, "1": 1, "2": 2 } });
        });

        test("it deletes IDs that are not in the list from the map", () => {
            klm.garbageCollect();

            expect(klm.map.getValue()).toEqual({ "0": 0 });
        });

        test("it deletes IDs that are not in other lists from the map", () => {
            // `otherList` must be held in scope until the end of the test because `KeyListAndMapState` will only retain
            // a weak reference to it.
            const otherList = new KeyListState<number, DeepStatePrimitive<number>>(klm, ["1"]);
            klm.registerListState(otherList);

            klm.garbageCollect();

            expect(klm.map.getValue()).toEqual({ "0": 0, "1": 1 });
        });
    });
});
