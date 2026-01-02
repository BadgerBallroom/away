import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import SelectionColors from "../utilities/SelectionColors";

export const DANCER_TILE_CONTAINER_CLASSNAME = "dancer-tile-container";

interface DancerTileContainerProps {
    /** The `DancerTile` or `DancerTilePlaceholder` */
    children?: React.ReactNode;
}

/**
 * A `Box` that wraps around a dancer tile or a dancer placeholder.
 */
const DancerTileContainer: React.FC<DancerTileContainerProps> = ({
    children,
}) => {
    return <DancerTileContainerBox
        className={DANCER_TILE_CONTAINER_CLASSNAME}
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
