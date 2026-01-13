import ClickAwayListener from "@mui/material/ClickAwayListener";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Popper, { PopperProps } from "@mui/material/Popper";
import { useCallback, useEffect, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import CarpoolArrangementState from "../model/CarpoolArrangementState";
import CarpoolState from "../model/CarpoolState";
import { ID } from "../model/KeyListAndMap";

/** Parameters that define the actions that are possible to take on the dancer that the user just clicked on */
export interface OccupantActionParameters {
    /** The HTML element of the dancer that the user just clicked on */
    anchorEl: PopperProps["anchorEl"];
    /**
     * The state of the arrangement of carpools that is currently being edited (must contain all carpools that are
     * inside all other properties of this `OccupantActionParameters`)
     */
    carpoolArrangementState: CarpoolArrangementState;
    /** The dancer that the user just clicked on */
    activeDancer: {
        /** The ID in `SessionProps.dancers` (`undefined` if this is actually an unoccupied seat in a car) */
        id: ID | undefined,
        /** The state of the carpool that the dancer is in (`undefined` if the dancer is not in a carpool) */
        carpoolState: CarpoolState | undefined;
    };
    /**
     * A map where:
     * - The keys are the IDs, in `SessionProps.dancers`, of dancers who were selected already prior to the user
     *   clicking on the active dancer
     * - Each value is the state of the carpool that the dancer is currently in (`undefined` if the dancer is not in any
     *   carpool)
     */
    priorSelectedDancers: Map<ID, CarpoolState | undefined>;
    /**
     * The states of the set of carpools that had empty spots that were already selected prior to the user clicking on
     * the active dancer
     */
    priorSelectedEmptySpotCarpools: Set<CarpoolState>;
    /**
     * A callback that should cause the popper to close.
     * @param shouldSelect Whether the active dancer should become selected
     * @param options.isImmediatelyReopening Whether the popper is immediately showing again (default: `false`)
     */
    onClose: (shouldSelect: boolean, options?: {
        isImmediatelyReopening?: boolean,
    }) => void;
}

interface CarpoolOccupantPopperProps {
    action: OccupantActionParameters | null;
}

export interface ShowCarpoolOccupantPopper {
    (action: CarpoolOccupantPopperProps["action"]): void;
}

/** Displays a menu of actions to take on a dancer, even if the dancer is not in a car */
const CarpoolOccupantPopper: React.FC<CarpoolOccupantPopperProps> = ({ action }) => {
    const open = !!action;

    const onClickAway = useCallback(() => {
        action?.onClose(true);
    }, [action]);
    useHotkeys("Escape", onClickAway);

    const previousAction = useRef<OccupantActionParameters | null>(null);
    useEffect(() => {
        // If the action changed, call `onClose` on the previous action.
        if (previousAction.current !== action) {
            previousAction.current?.onClose(true, { isImmediatelyReopening: open });
            previousAction.current = action;
        }
    }, [open, action]);

    return <Popper
        open={open}
        anchorEl={action?.anchorEl}
        placement="right"
    >
        <ClickAwayListener onClickAway={onClickAway}>
            <Paper elevation={4} sx={POPPER_PAPER_SX}>
                <Grid container spacing={2} direction="column">
                </Grid>
            </Paper>
        </ClickAwayListener>
    </Popper>;
};

export default CarpoolOccupantPopper;

const POPPER_PAPER_SX = { padding: 2 } as const;
