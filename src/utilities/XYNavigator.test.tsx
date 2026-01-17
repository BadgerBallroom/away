import { render } from "@testing-library/react";
import XYNavigator from "./XYNavigator";

describe("XYNavigator", () => {
    const locationClassName = "location";
    const horizontalNavigationAncestorClassName = "horizontal-navigation-ancestor";
    let topAncestor: HTMLElement;
    let xyNavigator: XYNavigator;
    let currentXY: [number, number];

    beforeEach(() => {
        topAncestor = render(
            <div>
                <p>Unrelated element</p>
                <div>
                    <div id="hna-0" className={horizontalNavigationAncestorClassName}>
                        <div id="location-0-0" className={locationClassName} />
                        <div id="location-1-0" className={locationClassName} />
                    </div>
                </div>
                <div>
                    <div>
                        <div id="hna-1" className={horizontalNavigationAncestorClassName}>
                            <div id="location-0-1" className={locationClassName} />
                            <div id="location-1-1" className={locationClassName} />
                            <div id="location-2-1" className={locationClassName} />
                            <div id="location-3-1" className={locationClassName} />
                        </div>
                    </div>
                    <div id="hna-empty" className={horizontalNavigationAncestorClassName}>
                        This element should be ignored because, even though it has the class name to be a horizontal
                        navigation ancestor, it has no locations.
                    </div>
                    <div id="hna-2" className={horizontalNavigationAncestorClassName}>
                        <div>
                            <div id="location-0-2" className={locationClassName} />
                        </div>
                        <div>
                            <div id="location-1-2" className={locationClassName} />
                        </div>
                        <div>
                            <div id="location-2-2" className={locationClassName} />
                        </div>
                    </div>
                </div>
            </div>,
        ).container;
    });

    function getLocation(xy: [number, number]): Element {
        const result = topAncestor.querySelector(`#location-${xy[0]}-${xy[1]}`);
        assert(result !== null);
        return result;
    }

    function testFindLocation(offset: [number, number], expectedXY: [number, number]): () => void {
        return () => {
            const currentLocation = getLocation(currentXY);
            const expectedLocation = getLocation(expectedXY);
            expect(xyNavigator.findLocation(currentLocation, ...offset)).toBe(expectedLocation);
        };
    }

    describe("without line wrapping detection", () => {
        beforeEach(() => {
            xyNavigator = new XYNavigator(
                locationClassName,
                horizontalNavigationAncestorClassName,
                topAncestor,
            );
        });

        describe("moving up", () => {
            describe("already at top", () => {
                beforeEach(() => {
                    currentXY = [1, 0];
                });
                test("not moving horizontally", testFindLocation([0, -1], [1, 0]));
                test("moving horizontally", testFindLocation([-1, -1], [0, 0]));
            });

            describe("not already at top", () => {
                beforeEach(() => {
                    currentXY = [1, 1];
                });
                test("not moving horizontally", testFindLocation([0, -1], [1, 0]));
                test("moving horizontally", testFindLocation([-1, -1], [0, 0]));
            });
        });

        describe("moving down", () => {
            describe("already at bottom", () => {
                beforeEach(() => {
                    currentXY = [1, 2];
                });
                test("not moving horizontally", testFindLocation([0, 1], [1, 2]));
                test("moving horizontally", testFindLocation([1, 1], [2, 2]));
            });

            describe("not already at bottom", () => {
                beforeEach(() => {
                    currentXY = [1, 1];
                });
                test("not moving horizontally", testFindLocation([0, 1], [1, 2]));
                test("moving horizontally", testFindLocation([1, 1], [2, 2]));
            });
        });

        describe("moving left", () => {
            describe("cannot go farther left", () => {
                beforeEach(() => {
                    currentXY = [0, 1];
                });
                test("not moving vertically", testFindLocation([-1, 0], [0, 1]));
                test("moving vertically", testFindLocation([-1, -1], [0, 0]));
            });

            describe("can go farther left", () => {
                beforeEach(() => {
                    currentXY = [1, 1];
                });
                test("not moving vertically", testFindLocation([-1, 0], [0, 1]));
                test("moving vertically", testFindLocation([-1, -1], [0, 0]));
            });
        });

        describe("moving right", () => {
            describe("cannot go farther right", () => {
                beforeEach(() => {
                    currentXY = [3, 1];
                });
                test("not moving vertically", testFindLocation([1, 0], [3, 1]));
                test("moving vertically", testFindLocation([1, 1], [2, 2])); // There is no [3, 2].
            });

            describe("can go farther right", () => {
                beforeEach(() => {
                    currentXY = [2, 1];
                });
                test("not moving vertically", testFindLocation([1, 0], [3, 1]));
                test("moving vertically", testFindLocation([1, 1], [2, 2])); // There is no [3, 2].
            });
        });

        describe("moving up and down", () => {
            test("without moving horizontally in between", () => {
                // Start where x=3 and y=1.
                const location0 = getLocation([3, 1]);

                // Move up to y=0. Because `hna-0` only has two locations, we should land where x=1.
                const location1 = xyNavigator.findLocation(location0, 0, -1);
                assert(location1 !== null);
                expect(location1).toBe(getLocation([1, 0]));

                // Move back down to y=1. Because we were previously at x=3, we should land back there.
                const location2 = xyNavigator.findLocation(location1, 0, 1);
                assert(location2 !== null);
                expect(location2).toBe(location0);

                // Move down to y=2. Because `hna-2` only has three locations, we should land where x=2.
                const location3 = xyNavigator.findLocation(location2, 0, 1);
                assert(location3 !== null);
                expect(location3).toBe(getLocation([2, 2]));

                // Move back up to y=1. Because we were previously at x=3, we should land back there.
                const location4 = xyNavigator.findLocation(location3, 0, -1);
                expect(location4).toBe(location2);
            });

            test("with moving horizontally in between", () => {
                // Start where x=3 and y=1.
                const location0 = getLocation([3, 1]);

                // Move down to y=2. Because `hna-2` only has three locations, we should land where x=2.
                const location1 = xyNavigator.findLocation(location0, 0, 1);
                assert(location1 !== null);
                expect(location1).toBe(getLocation([2, 2]));

                // Attempt to move to the right. Because `hna-2` only has three locations, x should not change.
                expect(xyNavigator.findLocation(location1, 1, 0)).toBe(location1);

                // However, because of the attempted horizontal movement, when moving back up to y=1, x should remain 2.
                expect(xyNavigator.findLocation(location1, 0, -1)).toBe(getLocation([2, 1]));
            });
        });
    });
});
