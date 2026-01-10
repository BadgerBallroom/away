import dayjs from "dayjs";
import dayjsComparator from "./dayjsComparator";

describe("dayjsComparator", () => {
    describe("a is null", () => {
        test("b is null", () => {
            expect(dayjsComparator(null, null)).toBe(0);
        });

        test("b is not null", () => {
            expect(dayjsComparator(null, dayjs(12345))).toBe(1);
        });
    });

    describe("a is not null", () => {
        test("b is null", () => {
            expect(dayjsComparator(dayjs(12345), null)).toBe(-1);
        });

        describe("b is not null", () => {
            test("a < b", () => {
                expect(dayjsComparator(dayjs(12345), dayjs(54321))).toBeLessThan(0);
            });

            test("a == b", () => {
                expect(dayjsComparator(dayjs(12345), dayjs(12345))).toBe(0);
            });

            test("a > b", () => {
                expect(dayjsComparator(dayjs(54321), dayjs(12345))).toBeGreaterThan(0);
            });
        });
    });
});
