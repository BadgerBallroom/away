import Box from "@mui/material/Box";
import { styled } from '@mui/material/styles';
import { useCallback, useRef } from "react";
import { useSelectableElementAttributes } from "../model/ElementSelectionHooks";
import SelectionColors from "../utilities/SelectionColors";

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
