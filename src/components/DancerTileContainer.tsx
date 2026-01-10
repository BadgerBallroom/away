import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import { useCallback, useRef } from "react";
import { useSelectableElementAttributes } from "../model/ElementSelectionHooks";
import StaticState, { useStaticState } from "../utilities/ExternalStore";
import SelectionColors from "../utilities/SelectionColors";

export const DANCER_TILE_CONTAINER_CLASSNAME = "dancer-tile-container";

/**
 * A callback that gets called when the {@link DancerTileContainer} is clicked, before it is selected.
 * @param event The event that triggered this
 * @param ref The {@link DancerTileContainer}'s HTML element
 * @returns A Promise that resolves to `false` to cancel the selection change (or `true` to allow it)
 */
export interface ShouldSelectDancer {
    (
        event: React.KeyboardEvent | React.MouseEvent,
        ref: HTMLElement | undefined,
    ): Promise<boolean>;
}

interface DancerTileContainerProps {
    /** The `DancerTile` or `DancerTilePlaceholder` */
    children?: React.ReactNode;
    /** A callback that gets called when the dancer is clicked and that returns whether the dancer should be selected */
    shouldSelect?: ShouldSelectDancer;
}

/**
 * A `Box` that wraps around a dancer tile or a dancer placeholder.
 * Shows whether the dancer is selected and handles some other selection logic.
 */
const DancerTileContainer: React.FC<DancerTileContainerProps> = ({
    children,
    shouldSelect,
}) => {
    const [onClickSerializer, setOnClickSerializer] = useStaticState(onClickSerializerStore);

    const ref = useRef<HTMLElement>(undefined);
    const { isSelected, onClick: onClickSelect } = useSelectableElementAttributes(ref);

    const onClick = useCallback(async (event: React.MouseEvent | React.KeyboardEvent) => {
        // Make sure that this `onClick` happens after the last one is done. Chain a `Promise` onto `otherOnClick`.
        setOnClickSerializer(onClickSerializer.then(async () => {
            // Only proceed with selection if `shouldSelect` is undefined or it returns (a `Promise` that resolves to)
            // `true`.
            if (!shouldSelect || await shouldSelect(event, ref.current)) {
                onClickSelect(event);
            }
            // Either way, the `async` scaffolding will now resolve the `Promise` that was chained onto `otherOnClick`.
        }));
    }, [onClickSerializer, setOnClickSerializer, shouldSelect, onClickSelect]);

    return <DancerTileContainerBox
        ref={ref}
        className={isSelected ? `${DANCER_TILE_CONTAINER_CLASSNAME} selected` : DANCER_TILE_CONTAINER_CLASSNAME}
        onClick={onClick}
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

/**
 * All {@link DancerTileContainer}s need to work together to serialize their executions of their `onClick` functions.
 * In other words, before any `onClick` runs, it needs to make sure that all other `onClick`s have finished. This tracks
 * the return value of the last `.then()` call, on which `.then()` can be called to chain another execution.
 */
const onClickSerializerStore = new StaticState(Promise.resolve());
