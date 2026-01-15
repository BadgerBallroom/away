import dayjs from "dayjs";
import CarpoolArrangement from "./CarpoolArrangement";
import CarpoolArrangementState from "./CarpoolArrangementState";
import CarpoolStateArray from "./CarpoolStateArray";
import { Accommodation, CanDriveCarpool, Gender } from "./Dancer";
import { DeepStateChangeCallback } from "./DeepState";
import Session from "./Session";

expect.addEqualityTesters([
    function (a: unknown, b: unknown): boolean | undefined {
        if (
            a instanceof CarpoolArrangementState.CarpoolsForHour
            && b instanceof CarpoolArrangementState.CarpoolsForHour
        ) {
            return a.hour?.isSame(b.hour, "hour") && this.equals(a.carpoolStates, b.carpoolStates);
        }
        return undefined;
    },
    function (a: unknown, b: unknown): boolean | undefined {
        if (
            a instanceof CarpoolArrangementState.CarpoolsForDay
            && b instanceof CarpoolArrangementState.CarpoolsForDay
        ) {
            return a.day?.isSame(b.day, "day") && this.equals(a.carpoolsByHour, b.carpoolsByHour);
        }
        return undefined;
    },
]);

describe("CarpoolArrangementState", () => {
    let session: Session;
    let carpoolArrangementState: CarpoolArrangementState;
    let carpoolStates: CarpoolStateArray;
    let changeListener: DeepStateChangeCallback<CarpoolArrangement>;

    beforeEach(() => {
        vi.stubEnv("TZ", "UTC");

        session = new Session({
            name: "Test",
            dancers: {
                list: ["1", "2", "3", "4", "5", "6", "7"],
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
                    "3": {
                        name: "Carol",
                        canDriveCarpool: CanDriveCarpool.YesIfNeeded,
                        canDriveMaxPeople: 5,
                        earliestPossibleDeparture: dayjs("2026-01-15 16:00"),
                        accommodation: Accommodation.StayingOnOwn,
                        prefersSameGender: false,
                        gender: Gender.Female,
                    },
                    "4": {
                        name: "Dean",
                        canDriveCarpool: CanDriveCarpool.Yes,
                        canDriveMaxPeople: 4,
                        earliestPossibleDeparture: dayjs("2026-01-15 16:30"),
                        accommodation: Accommodation.StayingOnOwn,
                        prefersSameGender: false,
                        gender: Gender.Male,
                    },
                    "5": {
                        name: "Elsa",
                        canDriveCarpool: CanDriveCarpool.Yes,
                        canDriveMaxPeople: 4,
                        earliestPossibleDeparture: dayjs("2026-01-15 17:00"),
                        accommodation: Accommodation.StayingOnOwn,
                        prefersSameGender: false,
                        gender: Gender.Female,
                    },
                    "6": {
                        name: "Frank",
                        canDriveCarpool: CanDriveCarpool.YesIfNeeded,
                        canDriveMaxPeople: 4,
                        earliestPossibleDeparture: dayjs("2026-01-15 17:30"),
                        accommodation: Accommodation.StayingOnOwn,
                        prefersSameGender: false,
                        gender: Gender.Male,
                    },
                    "7": {
                        name: "Gabby",
                        canDriveCarpool: CanDriveCarpool.Yes,
                        canDriveMaxPeople: 4,
                        earliestPossibleDeparture: dayjs("2026-01-15 18:00"),
                        accommodation: Accommodation.StayingOnOwn,
                        prefersSameGender: false,
                        gender: Gender.Female,
                    },
                },
            },
            carpoolArrangements: {
                list: ["1"],
                map: {
                    "1": {
                        name: "Test",
                        carpools: [
                            // Alice, Bob, and Carol are in this car.
                            {
                                departure: dayjs("2026-01-15 15:00"),
                                occupants: ["1", "2", "3"],
                            },
                            // Dean is not in a car.
                            // Elsa is in a car by herself.
                            {
                                departure: dayjs("2026-01-15 19:00"),
                                occupants: ["5"],
                            },
                            // Frank is in a car by himself, but the car has been set to leave before he can.
                            {
                                departure: dayjs("2026-01-14 20:00"),
                                occupants: ["6"],
                            },
                            // Gabby is in a car by herself.
                            {
                                departure: dayjs("2026-01-15 15:30"),
                                occupants: ["7"],
                            },
                        ],
                    },
                },
            },
        });
        carpoolArrangementState = session.getChildState("carpoolArrangements").map.getChildState("1")!;
        carpoolStates = carpoolArrangementState.getChildState("carpools");

        changeListener = vi.fn();
        carpoolArrangementState.addChangeListener(changeListener);
    });

    describe("getCarpoolStatesOrderedByDeparture", () => {
        test("puts carpools in order of departure", () => {
            expect(carpoolArrangementState.getCarpoolStatesOrderedByDeparture()).toEqual([
                carpoolStates.getChildState(2),
                carpoolStates.getChildState(0),
                carpoolStates.getChildState(3),
                carpoolStates.getChildState(1),
            ]);
            expect(changeListener).not.toHaveBeenCalled();
        });
    });

    describe("groupByDepartureTime", () => {
        test("groups carpools by departure day and then hour", () => {
            const expectedDay = {
                14: new CarpoolArrangementState.CarpoolsForDay(dayjs("2026-01-14")),
                15: new CarpoolArrangementState.CarpoolsForDay(dayjs("2026-01-15")),
            };
            const expectedHour = {
                14: {} as Record<number, CarpoolArrangementState.CarpoolsForHour>,
                15: {} as Record<number, CarpoolArrangementState.CarpoolsForHour>,
            };

            // The `CarpoolsForDay` constructor initializes the array with one item. Remove it.
            expectedDay[14].carpoolsByHour.pop();
            expectedDay[15].carpoolsByHour.pop();

            // The earliest departure falls on 2026-01-14 20:00, so we start there.
            // The hours stop before 21:00 because there are no more departures starting then on that day.
            for (let h = 20; h < 21; ++h) {
                expectedHour[14][h] = new CarpoolArrangementState.CarpoolsForHour(dayjs(new Date(2026, 0, 14, h, 0)));
                expectedDay[14].carpoolsByHour.push(expectedHour[14][h]);
            }

            // 2026-01-15 is not the first day, so the hours start at 00:00.
            // The hours stop before 20:00 because there are no more departures starting then on that day.
            for (let h = 0; h < 20; ++h) {
                expectedHour[15][h] = new CarpoolArrangementState.CarpoolsForHour(dayjs(new Date(2026, 0, 15, h, 0)));
                expectedDay[15].carpoolsByHour.push(expectedHour[15][h]);
            }

            expectedHour[15][15].carpoolStates.push(carpoolStates.getChildState(0)!);
            expectedHour[15][19].carpoolStates.push(carpoolStates.getChildState(1)!);
            expectedHour[14][20].carpoolStates.push(carpoolStates.getChildState(2)!);
            expectedHour[15][15].carpoolStates.push(carpoolStates.getChildState(3)!);

            expect(carpoolArrangementState.groupByDepartureTime()).toEqual([expectedDay[14], expectedDay[15]]);
            expect(changeListener).not.toHaveBeenCalled();
        });
    });

    describe("findUnassignedDancers", () => {
        test("returns dancers who are not in a carpool", () => {
            expect(carpoolArrangementState.findUnassignedDancers()).toEqual(new Set(["4"]));
            expect(changeListener).not.toHaveBeenCalled();
        });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });
});
