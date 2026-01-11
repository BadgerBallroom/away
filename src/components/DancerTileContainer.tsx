import Box from "@mui/material/Box";
import { styled } from '@mui/material/styles';

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

const DancerTileContainerBox = styled(Box)(() => `
    margin: 2px;
`);
