import dayjs from "dayjs";
import saveToDownload from "../utilities/saveToDownload";
import areMultilineStringsEqual, { MultilineString } from "../utilities/testing/areMultilineStringsEqual";
import Dancer, { Accommodation, CanDriveCarpool, Gender } from "./Dancer";
import { DancerListState } from "./DancerKLM";
import Session, { SessionProps } from "./Session";

expect.addEqualityTesters([areMultilineStringsEqual]);

jest.mock("../utilities/saveToDownload", () => jest.fn());

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
});
