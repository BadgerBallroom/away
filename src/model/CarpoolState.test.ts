import dayjs from "dayjs";
import CarpoolState from "./CarpoolState";
import { Accommodation, CanDriveCarpool, Gender } from "./Dancer";
import Session from "./Session";

describe("CarpoolState", () => {
    let session: Session;
    let carpoolState: CarpoolState;

    beforeEach(() => {
        session = new Session({
            name: "Test",
            dancers: {
                list: ["1", "2"],
                map: {
                    "1": {
                        name: "Alice",
                        canDriveCarpool: CanDriveCarpool.Yes,
                        canDriveMaxPeople: 4,
                        earliestPossibleDeparture: dayjs("2026-01-15 15:00"),
                        accommodation: Accommodation.StayingOnOwn,
                        prefersSameGender: false,
                        gender: Gender.Female,
                    },
                    "2": {
                        name: "Bob",
                        canDriveCarpool: CanDriveCarpool.No,
                        canDriveMaxPeople: 0,
                        earliestPossibleDeparture: dayjs("2026-01-15 15:30"),
                        accommodation: Accommodation.StayingOnOwn,
                        prefersSameGender: false,
                        gender: Gender.Male,
                    },
                },
            },
            carpoolArrangements: {
                list: ["1"],
                map: {
                    "1": {
                        name: "Test",
                        carpools: [
                            {
                                departure: dayjs("2026-01-15 15:00"),
                                occupants: ["1", "2"],
                            },
                        ],
                    },
                },
            },
        });
        carpoolState = session
            .getChildState("carpoolArrangements")
            .map
            .getChildState("1")!
            .getChildState("carpools")
            .getChildState(0)!;
    });

    describe("driverDancerID", () => {
        test("returns the dancer ID of the first occupant", () => {
            expect(carpoolState.driverDancerID).toBe("1");
        });
    });

    describe("getSuggestedDepartureTime", () => {
        test("returns null if the carpool has no occupants", () => {
            // Other code is supposed to make sure that no carpool is ever empty, so this test is probably the only way
            // that this scenario will ever be tested.
            const carpoolState = new CarpoolState(new Session(), {
                departure: null,
                occupants: [],
            });

            expect(carpoolState.getSuggestedDepartureTime()).toBeNull();
        });

        test("returns the earliest accommodating time if the carpool does not have a departure time", () => {
            carpoolState.setChildState("departure", null);
            expect(carpoolState.getSuggestedDepartureTime()).toEqual(dayjs("2026-01-15 15:30"));
        });

        test("returns the earliest accommodating time if the carpool departs too early for any occupant", () => {
            carpoolState.getChildState("departure")!.setValue(dayjs("2026-01-15 14:00"));
            expect(carpoolState.getSuggestedDepartureTime()).toEqual(dayjs("2026-01-15 15:30"));
        });

        test("returns null if the carpool departs late enough for all occupants", () => {
            carpoolState.getChildState("departure")!.setValue(dayjs("2026-01-15 15:30"));
            expect(carpoolState.getSuggestedDepartureTime()).toBeNull();
        });
    });
});
