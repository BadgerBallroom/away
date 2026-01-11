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
        topAncestor: Element | Document = document,
    ) {
        this.locationClassName = locationClassName;
        this.horizontalNavigationAncestorClassName = horizontalNavigationAncestorClassName;
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
        const currentHNA = this._findHorizontalNavigationAncestorOfLocation(currentLocation);
        if (!currentHNA) {
            return null;
        }

        const destinationHNA = this._findAnotherHorizontalNavigationAncestor(verticalOffset, currentHNA);
        const allLocationsInDestinationHNA =
            destinationHNA.querySelectorAll<LocationElement>(`.${this.locationClassName}`);

        let x: number;
        if (horizontalOffset === 0 && this._lastChosenX !== undefined) {
            // Use the last chosen horizontal position.
            x = this._lastChosenX;
        } else {
            // Get the current horizontal position.
            const allLocationsInCurrentHNA = Array.from(
                currentHNA === destinationHNA
                    ? allLocationsInDestinationHNA
                    : currentHNA.getElementsByClassName(this.locationClassName),
            );

            x = allLocationsInCurrentHNA.indexOf(currentLocation);
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
     * Given a location, finds its horizontal navigation ancestor.
     * @param element The location
     * @returns The horitonzal navigation ancestor that was found (or `null` if it was not found)
     */
    private _findHorizontalNavigationAncestorOfLocation(element: Element | null): Element | null {
        return element ? element.closest(`.${this.horizontalNavigationAncestorClassName}`) : null;
    }

    /**
     * Given a horizontal navigation ancestor, finds the one that is `verticalOffset` ones from it in the DOM. For
     * example, if `verticalOffset` is 1, then the horizontal navigation ancestor after the current one is found.
     *
     * If the `verticalOffset` would take you before the first horizontal navigation ancestor in the DOM, then the first
     * horizontal navigation ancestor in the DOM is returned. Likewise, if it would take you past the last horizontal
     * navigation ancestor in the DOM, the last one is returned.
     * @param verticalOffset The number of horizontal navigation ancestors to move back (negative) or forward (positive)
     * @param currentHNA The current horizontal navigation ancestor
     * @returns The horizontal navigation ancestor that is `verticalOffset` positions away from the current one
     */
    private _findAnotherHorizontalNavigationAncestor(verticalOffset: number, currentHNA: Element): Element {
        if (verticalOffset === 0) {
            return currentHNA;
        }

        // Move up or down by moving from the current HNA to the previous or next HNA within `topAnescestor`.
        // Ignore HNAs that don't have locations.
        const allHNAs = Array.from(this.topAncestor.querySelectorAll(
            `.${this.horizontalNavigationAncestorClassName}:has(.${this.locationClassName})`,
        ));

        let y = allHNAs.indexOf(currentHNA) + verticalOffset;
        y = Math.min(Math.max(y, 0), allHNAs.length - 1);
        return allHNAs[y];
    }
}
