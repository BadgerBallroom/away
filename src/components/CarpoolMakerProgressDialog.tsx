import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import LinearProgress from '@mui/material/LinearProgress';
import Paper from "@mui/material/Paper";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { createRef, useEffect, useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { MessageID } from "../i18n/messages";
import CarpoolArrangementState from "../model/CarpoolArrangementState";
import { CarpoolMakerProgress } from "../model/CarpoolMakerMessage";
import { useDeepState } from "../model/DeepStateHooks";
import { ID } from '../model/KeyListAndMap';
import { useDancerListState, useSession } from "../model/SessionHooks";
import DancerTile, { DANCER_TILE_HEIGHT, DANCER_TILE_WIDTH } from './DancerTile';

const DANCER_MARGIN = 10;
const DANCER_TILE_WIDTH_WITH_MARGIN = DANCER_TILE_WIDTH + DANCER_MARGIN;
const DANCER_TILE_HEIGHT_WITH_MARGIN = DANCER_TILE_HEIGHT + DANCER_MARGIN;

interface CarpoolMakerProgressDialogProps {
    /** An object with progress information */
    carpoolMakerProgress: CarpoolMakerProgress | null;
    /** A handler for the Cancel button */
    onCancel: React.MouseEventHandler<HTMLButtonElement>;
}

/** A full-screen progress dialog to be shown while the carpool maker is working. */
const CarpoolMakerProgressDialog: React.FC<CarpoolMakerProgressDialogProps> = ({
    carpoolMakerProgress,
    onCancel,
}) => {
    const session = useSession();

    return <Dialog open={!!carpoolMakerProgress} fullScreen>
        <AppBar position="relative">
            <Toolbar>
                <Typography sx={{ flex: 1 }}>
                    <FormattedMessage id={MessageID.carpoolsGenerateProgress} />
                </Typography>
                <Button autoFocus color="inherit" onClick={onCancel}>
                    <FormattedMessage id={MessageID.cancel} />
                </Button>
            </Toolbar>
            <LinearProgress />
        </AppBar>
        <Paper sx={{ m: 2 }}>
            <CarpoolArrangementDisplay
                carpoolArrangementState={
                    CarpoolArrangementState.fromString(session, carpoolMakerProgress?.latestArrangementExplored)
                }
                dancerTileElevation={2}
            />
        </Paper>
    </Dialog>;
};

export default CarpoolMakerProgressDialog;

interface PaperSx {
    position: "absolute";
    left: string;
    top: string;
    display: "block" | "none";
}

namespace PaperSx {
    export const DEFAULT: PaperSx = {
        position: "absolute",
        left: `-${DANCER_TILE_WIDTH}px`,
        top: `-${DANCER_TILE_HEIGHT}px`,
        display: "none",
    };
}

interface CarpoolArrangementDisplayProps {
    /** The arrangement of carpools to display */
    carpoolArrangementState: CarpoolArrangementState;
    /** The `PaperOwnProps["elevation"]` for the dancer tiles */
    dancerTileElevation?: number;
}

const CarpoolArrangementDisplay: React.FC<CarpoolArrangementDisplayProps> = ({
    carpoolArrangementState,
    dancerTileElevation,
}) => {
    const dancerListState = useDancerListState();
    const carpoolArrangement = useDeepState(carpoolArrangementState, []);

    const middleBoxRef = createRef<HTMLDivElement>();
    const [middleBoxHeight, setMiddleBoxHeight] = useState(0);
    useEffect(() => {
        const onResize = () => {
            if (middleBoxRef.current) {
                setMiddleBoxHeight(window.innerHeight - middleBoxRef.current.getBoundingClientRect().top - 20);
            }
        };
        onResize();

        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [middleBoxRef]);


    // Compute the position of each dancer.
    const { paperSxs, innerBoxSx } = useMemo(() => {
        const paperSxs: { [id: ID]: PaperSx | undefined } = {};
        let innerBoxSxHeightPx = 0;

        let top = DANCER_MARGIN;
        let left = DANCER_MARGIN;
        carpoolArrangementState.findUnassignedDancers().forEach(dancerID => {
            paperSxs[dancerID] = {
                position: "absolute",
                left: `${left}px`,
                top: `${top}px`,
                display: "block",
            };
            top += DANCER_TILE_HEIGHT_WITH_MARGIN;

            if (innerBoxSxHeightPx < top) {
                innerBoxSxHeightPx = top;
            }
        });

        left += DANCER_TILE_WIDTH_WITH_MARGIN;
        for (const carpool of carpoolArrangement.carpools) {
            let top = DANCER_MARGIN;
            for (const dancerID of carpool.occupants) {
                paperSxs[dancerID] = {
                    position: "absolute",
                    left: `${left}px`,
                    top: `${top}px`,
                    display: "block",
                }
                top += DANCER_TILE_HEIGHT_WITH_MARGIN;
            }

            left += DANCER_TILE_WIDTH_WITH_MARGIN;
        }

        const innerBoxSx = {
            position: "relative",
            width: `${left}px`,
            height: `${innerBoxSxHeightPx}px`,
        };
        return { paperSxs, innerBoxSx };
    }, [carpoolArrangementState, carpoolArrangement]);

    // Put each dancer in the DOM and use the position that we computed above.
    return <Box sx={{ overflow: "hidden", position: "relative" }}>
        <Box ref={middleBoxRef} sx={{ overflow: "scroll", height: `${middleBoxHeight}px` }}>
            <Box sx={innerBoxSx}>
                {dancerListState.getIDsAndReferencedStates().map(({ id, state }) => <DancerTile
                    key={id}
                    dancerState={state}
                    elevation={dancerTileElevation}
                    sx={paperSxs[id] ?? PaperSx.DEFAULT}
                />)}
            </Box>
        </Box>
    </Box>;
}
