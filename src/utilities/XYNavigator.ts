/**
 * Establishes two-dimensional relationships among certain DOM elements.
 *
 * A "location" is a DOM element with a specific class name. Locations should be descendants of "horizontal navigation
 * ancestors," which are other DOM elements with a different class name. Locations are considered to share a vertical
 * position (in other words, the same Y coordinate) if they are inside the same horizontal navigation ancestor. A
 * location does NOT need to be a direct child of its horitontal navigation ancestor, and horizontal navigation
 * ancestors do NOT need to be siblings.
 *
 * This is useful for facilitating navigation among locations via arrow keys, as the user can jump between DOM elements
 * that are scattered around the DOM.
 */
export default class XYNavigator<LocationElement extends Element = Element> {
    /** The class name that makes a DOM element a location */
    public readonly locationClassName: string;

    /** The class name that makes a DOM element a horizontal navigation ancestor */
    public readonly horizontalNavigationAncestorClassName: string;

    /**
     * If a DOM element with {@link horizontalNavigationAncestorClassName} also has this class name, then the locations
     * within it will silently be grouped by their vertical positions, and groups will be treated virtually as separate
     * horizontal navigation ancestors.
     */
    public readonly lineWrapperClassName?: string;

    /** Horizontal navigation ancestors will only be found within this element */
    public readonly topAncestor: Element | Document;

    /**
     * Sometimes, the user will move up or down from a car with more seats to one with fewer. If there is no seat in the
     * smaller car below the previously focused seat (e.g. if the user moves from the 5th seat of a car to a car that
     * only has 4 seats), the last seat in the smaller car will gain focus. However, if the user immediately moves back
     * to the larger car, the seat that was previously focused in that car, NOT the seat that is vertically aligned with
     * the seat in the smaller car, should gain focus. This variable remembers the X coordinate that was focused in the
     * larger car.
     */
    private _lastChosenX: number | undefined = undefined;

    constructor(
        locationClassName: string,
        horizontalNavigationAncestorClassName: string,
        lineWrapperClassName?: string,
        topAncestor: Element | Document = document,
    ) {
        this.locationClassName = locationClassName;
        this.horizontalNavigationAncestorClassName = horizontalNavigationAncestorClassName;
        this.lineWrapperClassName = lineWrapperClassName;
        this.topAncestor = topAncestor;
    }

    /**
     * Finds the location to the left, to the right, above, or below the given one.
     * @param currentLocation The location from which to move up, down, left, or right
     * @param horizontalOffset The number of locations to move left (negative) or right (positive)
     * @param verticalOffset The number of horizontal navigation ancestors to move up (negative) or down (positive)
     * @returns The found location (or `null` if the location is not a descendant of a horizontal navigation ancestor)
     */
    public findLocation(
        currentLocation: LocationElement,
        horizontalOffset: number,
        verticalOffset: number,
    ): LocationElement | null {
        const currentElementHNA = this._findHorizontalNavigationAncestorOfLocation(currentLocation);
        if (!currentElementHNA) {
            return null;
        }

        const indexOfCurrentLocationInElementHNA = currentElementHNA.getLocations().indexOf(currentLocation);
        const { precedingHNAs, followingHNAs } =
            this._findOtherHorizontalNavigationAncestors(currentElementHNA, verticalOffset);

        // The `VerticalTraverser` is responsible for splitting the current HNA if necessary.
        const { verticalTraverser, xTracked: indexOfCurrentLocationInVirtualHNA } = VerticalTraverser.create(
            this.lineWrapperClassName,
            precedingHNAs,
            currentElementHNA,
            indexOfCurrentLocationInElementHNA,
            followingHNAs,
        );
        const destinationHNA = verticalTraverser.moveBy(verticalOffset);
        const allLocationsInDestinationHNA = destinationHNA.getLocations();

        let x: number;
        if (horizontalOffset === 0 && this._lastChosenX !== undefined) {
            // Use the last chosen horizontal position.
            x = this._lastChosenX;
        } else {
            // `indexOfCurrentLocationInVirtualHNA` is the current horizontal position.
            x = indexOfCurrentLocationInVirtualHNA;
            if (this._lastChosenX === undefined) {
                // Only because a horizontal position has not been chosen, store the current one.
                this._lastChosenX = x;
            }
            x += horizontalOffset;
        }

        x = Math.min(Math.max(x, 0), allLocationsInDestinationHNA.length - 1);

        if (horizontalOffset !== 0) {
            // The user moved (or attempted to move) horizontally, so store the horizontal position.
            this._lastChosenX = x;
        }

        return allLocationsInDestinationHNA[x];
    }

    /**
     * Given a location, finds its horizontal navigation ancestor (HNA). Does *not* split the HNA.
     * @param element The location
     * @returns The horitonzal navigation ancestor that was found (or `null` if it was not found)
     */
    private _findHorizontalNavigationAncestorOfLocation(element: Element | null): ElementHNA<LocationElement> | null {
        const closest = element?.closest(`.${this.horizontalNavigationAncestorClassName}`);
        if (!closest) {
            return null;
        }
        return new ElementHNA(closest, this.locationClassName);
    }

    /**
     * Finds other horizontal navigation ancestors (HNAs) in {@link topAncestor} if {@link verticalOffset} is not 0. It
     * is assumed that if the number of HNAs to move up or down is 0, then the other HNAs are not needed.
     *
     * Undefined behavior results if the current HNA is not inside {@link topAncestor}.
     *
     * @param currentHNA The horizontal navigation ancestor that contains the current location
     * @param verticalOffset The number of horizontal navigation ancestors to move up or down
     * @returns The horizontal navigation ancestors that come before and after the current one if {@link verticalOffset}
     *          is not 0, else empty arrays
     */
    private _findOtherHorizontalNavigationAncestors(currentHNA: ElementHNA<LocationElement>, verticalOffset: number): {
        precedingHNAs: ElementHNA<LocationElement>[],
        followingHNAs: ElementHNA<LocationElement>[],
    } {
        if (verticalOffset === 0) {
            return { precedingHNAs: [], followingHNAs: [] };
        }

        // Ignore HNAs that don't have locations.
        const allHNAElements = Array.from(this.topAncestor.querySelectorAll(
            `.${this.horizontalNavigationAncestorClassName}:has(.${this.locationClassName})`,
        ));
        const indexOfCurrent = allHNAElements.indexOf(currentHNA.originalElement);
        const makeHNA = (element: Element) => new ElementHNA<LocationElement>(element, this.locationClassName);
        return {
            precedingHNAs: allHNAElements.slice(0, indexOfCurrent).map(makeHNA),
            followingHNAs: allHNAElements.slice(indexOfCurrent + 1).map(makeHNA),
        };
    }
}

/** A set of locations that should be considered to share a vertical position. */
abstract class HorizontalNavigationAncestor<LocationElement extends Element> {
    /** The original horizontal navigation ancestor in the DOM before any splitting */
    public readonly originalElement: Element;

    constructor(originalElement: Element) {
        this.originalElement = originalElement;
    }

    /**
     * @returns The locations that are within this horizontal navigation ancestor
     */
    public abstract getLocations(): readonly LocationElement[];
}

/**
 * A set of locations that share a vertical position solely because they are all descendants of a specific DOM element.
 */
class ElementHNA<LocationElement extends Element> extends HorizontalNavigationAncestor<LocationElement> {
    private _locationClassName: string;

    constructor(originalElement: Element, locationClassName: string) {
        super(originalElement);
        this._locationClassName = locationClassName;
    }

    public override getLocations(): LocationElement[] {
        return Array.from(this.originalElement.querySelectorAll<LocationElement>(`.${this._locationClassName}`));
    }

    /**
     * Groups this horizontal navigation ancestor's locations by their vertical positions in the viewport. Two locations
     * are considered to be in the same group if the top of one's bounding box is above the bottom of the other.
     *
     * Pass an index of the result of {@link getLocations}. The pair of indices that points to the same location in the
     * {@link VirtualHNA}s in the result of this function will be included in the result of this function. In code:
     *
     * ```ts
     * this.getLocations()[indexOfLocation] === result.verticallyGroupedLocations[yTracked].getLocations()[xTracked]
     * ```
     *
     * @param indexOfLocation The index to track
     * @returns An array of {@link VirtualHNA}s and the 2-D index of {@link indexOfLocation}
     */
    public splitByWrappedLines(indexOfLocation: number): {
        /** The locations, grouped into a 2-D array */
        verticallyGroupedLocations: VirtualHNA<LocationElement>[],
        /**
         * The index within `verticallyGroupedLocations` of the {@link VirtualHNA} that now contains the location that
         * was at {@link indexOfLocation}
         */
        yTracked: number,
        /**
         * The index within `verticallyGroupedLocations[yTracked].getLocations()` of the location that was at
         * {@link indexOfLocation}
         */
        xTracked: number,
    } {
        const locations = this.getLocations();
        let yTracked = 0;
        let xTracked = 0;
        if (locations.length === 0) {
            return { verticallyGroupedLocations: [], yTracked, xTracked };
        }

        // Start with the first location in the result.
        const verticallyGroupedLocations = [[locations[0]]];
        let lastBCR = verticallyGroupedLocations[0][0].getBoundingClientRect();

        // In the future, a possible optimization is not to split this HNA entirely but only to split the current line,
        // the one before, and the one after. The performance benefit from the added complexity has not been determined.

        // Loop through the locations except the first one.
        for (let i = 1; i < locations.length; ++i) {
            const location = locations[i];
            const currentBCR = location.getBoundingClientRect();
            if (lastBCR.bottom <= currentBCR.top) {
                // This location is lower than the previous! Start a new line.
                verticallyGroupedLocations.push([location]);
            } else {
                // This location is on the same line as the previous.
                verticallyGroupedLocations[verticallyGroupedLocations.length - 1].push(location);
            }
            lastBCR = currentBCR;

            if (i === indexOfLocation) {
                yTracked = verticallyGroupedLocations.length - 1;
                xTracked = verticallyGroupedLocations[yTracked].length - 1;
            }
        }

        return {
            verticallyGroupedLocations:
                verticallyGroupedLocations.map(locations => new VirtualHNA(this.originalElement, locations)),
            yTracked,
            xTracked,
        };
    }
}

/**
 * A set of locations that share a vertical position. They are all descendants of a specific DOM element, but that DOM
 * element wraps locations to new rows when it runs out of width. All the locations in this object are on the same row.
 */
class VirtualHNA<LocationElement extends Element> extends HorizontalNavigationAncestor<LocationElement> {
    private _locations: LocationElement[];

    constructor(originalElement: Element, locations: LocationElement[]) {
        super(originalElement);
        this._locations = locations;
    }

    public override getLocations(): readonly LocationElement[] {
        return this._locations;
    }
}

/** A helper class for navigating. */
class VerticalTraverser<LocationElement extends Element> {
    public readonly lineWrapperClassName?: string;

    /** HNAs that come before the current HNA. */
    private _before: HorizontalNavigationAncestor<LocationElement>[];
    /** The current HNA. */
    private _current: HorizontalNavigationAncestor<LocationElement>;
    /** HNAs that come after the current HNA, in reverse order. */
    private _after: HorizontalNavigationAncestor<LocationElement>[];

    /**
     * Constructs a helper class for navigating. Instances of this class should be discarded whenever the DOM mutates.
     *
     * If an {@link ElementHNA} has {@link lineWrapperClassName}, it will be split into multiple {@link VirtualHNA}s
     * based on its locations' vertical positions, and requesting to navigate up or down will move through the
     * {@link VirtualHNA}s before moving to the next {@link ElementHNA}.
     *
     * In the event that {@link current} is split, this constructor must determine which resulting {@link VirtualHNA} to
     * keep as the current HNA. The resulting {@link VirtualHNA} that contains `current.getLocations()[trackIndex]`
     * will become the current HNA.
     *
     * @param lineWrapperClassName If an HNA's DOM element has this class name, it will be split into virtual HNAs
     * @param before HNAs that above the current HNA (limit this to limit traversal)
     * @param current The current HNA
     * @param trackIndex The index of the location to follow when {@link current} is split
     * @param after HNAs that come after the current HNA (limit this to limit traversal)
     * @returns An instance of the helper class and the new index of the location that was denoted by {@link trackIndex}
     */
    public static create<LocationElement extends Element>(
        lineWrapperClassName: string | undefined,
        before: readonly HorizontalNavigationAncestor<LocationElement>[],
        current: HorizontalNavigationAncestor<LocationElement>,
        trackIndex: number,
        after: readonly HorizontalNavigationAncestor<LocationElement>[],
    ): {
        /** The instance of the helper class */
        verticalTraverser: VerticalTraverser<LocationElement>,
        /** The new index of the location that was at {@link trackIndex} before (and if) {@link current} was split */
        xTracked: number,
    } {
        const verticalTraverser = new VerticalTraverser<LocationElement>(lineWrapperClassName, before, current, after);
        const xTracked = verticalTraverser._splitCurrentIfNeeded(trackIndex);
        return { verticalTraverser, xTracked };
    }

    private constructor(
        lineWrapperClassName: string | undefined,
        before: readonly HorizontalNavigationAncestor<LocationElement>[],
        current: HorizontalNavigationAncestor<LocationElement>,
        after: readonly HorizontalNavigationAncestor<LocationElement>[],
    ) {
        this.lineWrapperClassName = lineWrapperClassName;
        this._before = Array.from(before);
        this._current = current;
        this._after = Array.from(after).reverse();
    }

    /**
     * Moves the given number of HNAs up or down, setting the new current HNA.
     * @param verticalOffset The number of HNAs to move up or down
     * @returns The new current HNA
     */
    public moveBy(verticalOffset: number): HorizontalNavigationAncestor<LocationElement> {
        if (verticalOffset < 0) {
            do {
                const current = this._current;
                if (this.moveUpOnce() === current) {
                    // We are as far up as we can go.
                    break;
                }
                ++verticalOffset;
            } while (verticalOffset < 0);
        } else {
            while (verticalOffset > 0) {
                const current = this._current;
                if (this.moveDownOnce() === current) {
                    // We are as far down as we can go.
                    break;
                }
                --verticalOffset;
            }
        }
        return this._current;
    }

    /**
     * Moves from the current HNA to the one before it. Splits that HNA if necessary.
     *
     * If there is not another HNA before the current one, nothing happens.
     *
     * @returns The new current HNA
     */
    public moveUpOnce(): HorizontalNavigationAncestor<LocationElement> {
        if (this._before.length) {
            // Because `_after` is in reverse order, the `_current` simply goes at the end.
            this._after.push(this._current);
            this._current = this._before.pop()!;
            this._splitCurrentIfNeeded(this._current.getLocations().length - 1);
        }
        return this._current;
    }

    /**
     * Moves from the current HNA to the one after it. Splits that HNA if necessary.
     *
     * If there is not another HNA after the current one, nothing happens.
     *
     * @returns The new current HNA
     */
    public moveDownOnce(): HorizontalNavigationAncestor<LocationElement> {
        if (this._after.length) {
            this._before.push(this._current);
            // Because `_after` is in reverse order, the new `_current` can be found at the end.
            this._current = this._after.pop()!;
            this._splitCurrentIfNeeded(0);
        }
        return this._current;
    }

    /**
     * Splits the current HNA if {@link _shouldSplitHNA} returns `true` for it. In the event of a split, updates
     * {@link _before}, {@link _current}, and {@link _after} with the virtual HNAs. {@link trackIndex} is necessary to
     * know *which* virtual HNA should become {@link _current} after a split.
     * @param trackIndex The index of the location to keep in {@link _current}
     * @returns The new index of the location in {@link _current}
     */
    private _splitCurrentIfNeeded(trackIndex: number): number {
        if (!this._shouldSplitHNA(this._current)) {
            return trackIndex;
        }

        const { verticallyGroupedLocations, yTracked, xTracked } = this._current.splitByWrappedLines(trackIndex);

        this._before.push(...verticallyGroupedLocations.slice(0, yTracked));
        this._current = verticallyGroupedLocations[yTracked];
        // `this._after` is in reverse order to make it easy to `pop` the next HNA.
        this._after.push(...verticallyGroupedLocations.slice(yTracked + 1).reverse());

        return xTracked;
    }

    /**
     * Decides whether to split a horizontal navigation ancestor into smaller ones.
     * @param hna The HNA to consider splitting
     * @returns `true` to split, else `false`
     */
    private _shouldSplitHNA(hna: HorizontalNavigationAncestor<LocationElement>): hna is ElementHNA<LocationElement> {
        return (
            !!this.lineWrapperClassName
            && (hna instanceof ElementHNA)
            && hna.originalElement.classList.contains(this.lineWrapperClassName)
        );
    }
}
