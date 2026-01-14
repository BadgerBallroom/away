/* eslint-disable @stylistic/max-len */
import dayjs from "dayjs";
import saveToDownload from "../utilities/saveToDownload";
import areMultilineStringsEqual, { MultilineString } from "../utilities/testing/areMultilineStringsEqual";
import Dancer, { Accommodation, CanDriveCarpool, Gender } from "./Dancer";
import { DancerListState } from "./DancerKLM";
import DancerState from "./DancerState";
import { ValueWithID } from "./KeyListAndMap";
import Session, { SessionProps } from "./Session";

expect.addEqualityTesters([areMultilineStringsEqual]);

vi.mock("../utilities/saveToDownload", () => ({
    default: vi.fn(),
}));

describe("DancerListState", () => {
    let session: Session;
    let dancerListState: DancerListState;

    describe("exportCSV", () => {
        let dancer1: Dancer;
        let dancer2: Dancer;

        beforeEach(() => {
            dancer1 = {
                name: "Alice",
                canDriveCarpool: CanDriveCarpool.Yes,
                canDriveMaxPeople: 4,
                earliestPossibleDeparture: dayjs("2024-09-30T12:00:00.000Z"),
                accommodation: Accommodation.FreeHousingPreferred,
                prefersSameGender: false,
                gender: Gender.Female,
            };

            dancer2 = {
                name: "Bob",
                canDriveCarpool: CanDriveCarpool.TravelingOnOwn,
                canDriveMaxPeople: 0,
                earliestPossibleDeparture: null,
                accommodation: Accommodation.StayingOnOwn,
                prefersSameGender: false,
                gender: Gender.Male,
            };

            session = new Session({
                ...SessionProps.DEFAULT,
                dancers: {
                    list: ["1", "2"],
                    map: {
                        "1": dancer1,
                        "2": dancer2,
                    },
                },
            });

            dancerListState = session.getChildState("dancers").getChildState("list");
        });

        test("it generates a CSV representation of the dancers", () => {
            dancerListState.exportCSV();

            expect(saveToDownload).toHaveBeenCalledWith(
                new MultilineString([
                    "id,name,canDriveCarpool,canDriveMaxPeople,earliestPossibleDeparture,accommodation,prefersSameGender,gender",
                    "1,Alice,Y,4,2024-09-30T12:00:00.000Z,FREE,FALSE,F",
                    "2,Bob,NA,1,,NA,FALSE,M",
                ]),
                "text/csv",
            );
        });
    });

    describe("importCSV", () => {
        let defaultDancerWithID: ValueWithID<Dancer>;
        let file: File;

        beforeEach(() => {
            session = new Session();
            dancerListState = session.getChildState("dancers").getChildState("list");

            const dancerState = new DancerState();
            const dancerID = session.getChildState("dancers").add(dancerState).id;
            defaultDancerWithID = { ...Dancer.DEFAULT, id: dancerID };
        });

        describe("when the file contains dancer IDs", () => {
            beforeEach(() => {
                file = new File(
                    [new Blob([
                        "id,name,canDriveCarpool,canDriveMaxPeople,earliestPossibleDeparture,accommodation,prefersSameGender,gender\n" +
                        defaultDancerWithID.id + ",Dorothy,YIN,6,2024-09-30T15:00:00.000Z,HOTEL,FALSE,F\n" +
                        "2,Alice,Y,4,2024-09-30T17:00:00.000Z,FREE,TRUE,F\n" +
                        "3,Bob,NA,1,,NA,FALSE,M",
                    ], { type: "text/csv" })],
                    "dancers.csv",
                );
            });

            test("updates dancers with matching IDs", async () => {
                await dancerListState.importCSV(file);

                expect(dancerListState.getReferencedValues()).toContainEqual({
                    "accommodation": "HOTEL",
                    "canDriveCarpool": "YIN",
                    "canDriveMaxPeople": 6,
                    "earliestPossibleDeparture": dayjs("2024-09-30T15:00:00.000Z"),
                    "gender": "F",
                    "id": defaultDancerWithID.id,
                    "name": "Dorothy",
                    "prefersSameGender": false,
                });
            });

            test("it adds the imported dancers with unknown IDs to the end of the line", async () => {
                await dancerListState.importCSV(file);

                expect(dancerListState.getReferencedValues()).toEqual([
                    expect.anything(),
                    {
                        "accommodation": "FREE",
                        "canDriveCarpool": "Y",
                        "canDriveMaxPeople": 4,
                        "earliestPossibleDeparture": dayjs("2024-09-30T17:00:00.000Z"),
                        "gender": "F",
                        "id": "2",
                        "name": "Alice",
                        "prefersSameGender": true,
                    },
                    {
                        "accommodation": "NA",
                        "canDriveCarpool": "NA",
                        "canDriveMaxPeople": 1,
                        "earliestPossibleDeparture": null,
                        "gender": "M",
                        "id": "3",
                        "name": "Bob",
                        "prefersSameGender": false,
                    },
                ]);
            });
        });

        describe("when the file does not contain dancer IDs", () => {
            beforeEach(() => {
                file = new File(
                    [new Blob([
                        "name,canDriveCarpool,canDriveMaxPeople,earliestPossibleDeparture,accommodation,prefersSameGender,gender\n" +
                        "Alice,Y,4,2024-09-30T17:00:00.000Z,FREE,TRUE,F\n" +
                        "Bob,NA,1,,NA,FALSE,M",
                    ], { type: "text/csv" })],
                    "dancers.csv",
                );
            });

            test("it adds the imported dancers to the end of the line", async () => {
                await dancerListState.importCSV(file);

                expect(dancerListState.getReferencedValues()).toEqual([
                    defaultDancerWithID,
                    {
                        "accommodation": "FREE",
                        "canDriveCarpool": "Y",
                        "canDriveMaxPeople": 4,
                        "earliestPossibleDeparture": dayjs("2024-09-30T17:00:00.000Z"),
                        "gender": "F",
                        "id": expect.anything(),
                        "name": "Alice",
                        "prefersSameGender": true,
                    },
                    {
                        "accommodation": "NA",
                        "canDriveCarpool": "NA",
                        "canDriveMaxPeople": 1,
                        "earliestPossibleDeparture": null,
                        "gender": "M",
                        "id": expect.anything(),
                        "name": "Bob",
                        "prefersSameGender": false,
                    },
                ]);
            });
        });

        describe("when the file is a mal-formed CSV file", () => {
            beforeEach(() => {
                file = new File(
                    [new Blob([
                        "name,gender\n" +
                        "Alice,F,beep beep!!\n" +
                        "\"Bob",
                    ], { type: "text/csv" })],
                    "dancers.csv",
                );
            });

            test("it calls onError", async () => {
                const fn = vi.fn();

                await dancerListState.importCSV(file, fn);

                expect(fn).toHaveBeenCalledTimes(2);
                expect(fn).toHaveBeenCalledWith([
                    {
                        type: "FieldMismatch",
                        code: "TooManyFields",
                        message: "Too many fields: expected 2 fields but parsed 3",
                        row: 0,
                    },
                ]);
                expect(fn).toHaveBeenCalledWith([
                    {
                        "code": "MissingQuotes",
                        "index": 33,
                        "message": "Quoted field unterminated",
                        "row": 0,
                        "type": "Quotes",
                    },
                    {
                        "code": "TooFewFields",
                        "message": "Too few fields: expected 2 fields but parsed 1",
                        "row": 1,
                        "type": "FieldMismatch",
                    },
                ]);
            });
        });
    });
});
