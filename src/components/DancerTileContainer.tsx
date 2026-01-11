import Box from "@mui/material/Box";
import { styled } from '@mui/material/styles';
import { useCallback, useRef } from "react";
import { useSelectableElementAttributes } from "../model/ElementSelectionHooks";
import SelectionColors from "../utilities/SelectionColors";
import XYNavigator from "../utilities/XYNavigator";

/**
 * All `DancerTileContainer`s within an ancestor with this class name will be considered to have the same vertical
 * position, so moving from one to another is moving left or right. Moving up or down would involve moving to another
 * element with this class name.
 */
export const DANCER_TILE_HORIZONTAL_NAVIGATION_ANCESTOR_CLASSNAME = "dancer-tile-horizontal-navigation-ancestor";

/** All `DancerTileContainer`s will have this class name in the DOM. */
export const DANCER_TILE_CONTAINER_CLASSNAME = "dancer-tile-container";

interface DancerTileContainerProps {
    /** The `DancerTile` or `DancerTilePlaceholder` */
    children?: React.ReactNode;
    /**
     * A callback that gets called when the `DancerTileContainer` is clicked, before it is selected.
     * @param event The event that triggered this
     * @param ref The `DancerTileContainer`'s HTML element
     * @returns A Promise that resolves to `false` to cancel the selection change (or `true` to allow it)
     */
    shouldSelect?: (event: React.KeyboardEvent | React.MouseEvent, ref: HTMLElement) => Promise<boolean>;
}

/**
 * A `Box` that wraps around a dancer tile or a dancer placeholder.
 * Shows whether the dancer is selected and handles some other selection logic.
 */
const DancerTileContainer: React.FC<DancerTileContainerProps> = ({
    children,
    shouldSelect,
}) => {
    const ref = useRef<HTMLElement>();
    const { isSelected, onClick: onClickSelect } = useSelectableElementAttributes(ref);

    const onClick = useCallback(async (event: React.MouseEvent | React.KeyboardEvent) => {
        if (!ref.current) {
            return;
        }

        if (shouldSelect && !(await shouldSelect(event, ref.current))) {
            return;
        }

        onClickSelect(event);
    }, [onClickSelect, shouldSelect]);

    const onKeyDown = useCallback((event: React.KeyboardEvent) => {
        switch (event.key) {
            case "ArrowUp":
                focusOnAdjacentTile(ref.current, 0, -1);
                break;
            case "ArrowDown":
                focusOnAdjacentTile(ref.current, 0, 1);
                break;
            case "ArrowLeft":
                focusOnAdjacentTile(ref.current, -1, 0);
                break;
            case "ArrowRight":
                focusOnAdjacentTile(ref.current, 1, 0);
                break;
            case " ":
            case "Enter":
                onClick(event);
                break;
            default:
                // Don't prevent default and stop propagation.
                return;
        }

        event.preventDefault();
        event.stopPropagation();
    }, [onClick]);

    return <DancerTileContainerBox
        ref={ref}
        className={isSelected ? `${DANCER_TILE_CONTAINER_CLASSNAME} selected` : DANCER_TILE_CONTAINER_CLASSNAME}
        onClick={onClick}
        onKeyDown={onKeyDown}
        role="button"
        tabIndex={0}
    >{children}</DancerTileContainerBox>;
};

export default DancerTileContainer;

const DancerTileContainerBox = styled(Box)(({ theme }) => `
    margin: 2px;
    user-select: none;

    &:hover, &:focus-within {
        box-shadow: 0 0 0 1px ${SelectionColors.hover(theme)};
    }

    &.selected {
        box-shadow: 0 0 0 3px ${SelectionColors.selected(theme)};
    }
`);

const xyNavigator = new XYNavigator(
    DANCER_TILE_CONTAINER_CLASSNAME,
    DANCER_TILE_HORIZONTAL_NAVIGATION_ANCESTOR_CLASSNAME,
);

/**
 * Moves focus to another `DancerTileContainer`.
 * @param current The `ref` of the currently focused `DancerTileContainer`
 * @param horizontalOffset The number of `DancerTileContainers` to move left (negative) or right (positive)
 * @param verticalOffset The number of `DancerTileContainers` to move up (negative) or down (positive)
 */
function focusOnAdjacentTile(current: Element | undefined, horizontalOffset: number, verticalOffset: number): void {
    if (!current) {
        return;
    }

    const adjacent = xyNavigator.findLocation(current, horizontalOffset, verticalOffset);
    if (!(adjacent instanceof HTMLElement)) {
        return;
    }

    adjacent.focus();

    // Get the top of the tile below the headers at the top of the viewport. `scroll-margin-top` only works when the
    // page is being scrolled, which is not necessarily the case when moving focus.
    const boundingClientRect = adjacent.getBoundingClientRect();
    if (boundingClientRect.top < 112) {
        window.scrollBy({ top: boundingClientRect.top - 120, behavior: "instant" });
    }
}
