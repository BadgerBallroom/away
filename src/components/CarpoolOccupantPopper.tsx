import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import Button from "@mui/material/Button";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Popper, { PopperProps } from "@mui/material/Popper";
import { SnackbarProps } from "@mui/material/Snackbar";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { FormattedMessage, useIntl } from "react-intl";
import { MessageID } from "../i18n/messages";
import CarpoolArrangementState from "../model/CarpoolArrangementState";
import CarpoolState from "../model/CarpoolState";
import { ID } from "../model/KeyListAndMap";
import { useDancerMapState } from "../model/SessionHooks";
import { DANCER_TILE_CONTAINER_CLASSNAME } from "./DancerTileContainer";
import SnackbarCloseButton from "./SnackbarCloseButton";

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

interface SetSnackbarProps {
    (snackbarProps: Omit<SnackbarProps, "open"> | null): void;
}

interface CarpoolOccupantPopperProps {
    action: OccupantActionParameters | null;
    setSnackbarProps: SetSnackbarProps;
}

export interface ShowCarpoolOccupantPopper {
    (action: CarpoolOccupantPopperProps["action"]): void;
}

/** Displays a menu of actions to take on a dancer, even if the dancer is not in a car */
const CarpoolOccupantPopper: React.FC<CarpoolOccupantPopperProps> = ({ action, setSnackbarProps }) => {
    const dancerMapState = useDancerMapState();
    const activeDancerState = isDancerNotEmptySeat(action)
        ? dancerMapState.getChildState(action.activeDancer.id)
        : undefined;

    const showPromoteToDriver = canPromoteToDriver(action);
    const showUnassignOccupant = canUnassignOccupant(action);

    const open = showPromoteToDriver || showUnassignOccupant;

    const onClickAway = useCallback(() => {
        action?.onClose(true);
    }, [action]);
    useHotkeys("Escape", onClickAway);

    const activeDancerName = useMemo(() => activeDancerState?.getChildValue("name") ?? "", [activeDancerState]);

    const previousAction = useRef<OccupantActionParameters | null>(null);
    useEffect(() => {
        // If the action changed, call `onClose` on the previous action.
        if (previousAction.current !== action) {
            previousAction.current?.onClose(true, { isImmediatelyReopening: open });
            previousAction.current = action;
        }

        // If we're not going to open but `action` is not null for some reason, call `action.onClose` immediately.
        if (!open && action) {
            action.onClose(true);
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
                    {showPromoteToDriver &&
                        <Grid>
                            <PromoteToDriverButton
                                action={action}
                                dancerName={activeDancerName}
                                setSnackbarProps={setSnackbarProps}
                            />
                        </Grid>
                    }
                    {showUnassignOccupant &&
                        <Grid>
                            <UnassignOccupantButton
                                action={action}
                                occupantName={activeDancerName}
                            />
                        </Grid>
                    }
                </Grid>
            </Paper>
        </ClickAwayListener>
    </Popper>;
};

export default CarpoolOccupantPopper;

const POPPER_PAPER_SX = { padding: 2 } as const;

// #region Special cases of `OccupantActionParameters`
/** An extension of {@link OccupantActionParameters} where the active dancer is a real dancer an not an empty seat */
interface NotEmptySeatParameters extends OccupantActionParameters {
    activeDancer: OccupantActionParameters["activeDancer"] & {
        id: ID;
    };
}

/**
 * Checks that, given the parameters, it is possible to perform actions that require the active dancer to be an actual
 * dancer and not an empty seat in a car.
 * @param action The parameters that showed the popper
 * @returns Whether it is possible to perform actions that assume that the active dancer is not an empty seat
 */
function isDancerNotEmptySeat(action: OccupantActionParameters | null): action is NotEmptySeatParameters {
    return !!action?.activeDancer.id;
}

/** An extension of {@link NotEmptySeatParameters} where the active dancer currently in a carpool */
interface DancerInACarpoolParameters extends NotEmptySeatParameters {
    activeDancer: NotEmptySeatParameters["activeDancer"] & {
        carpoolState: CarpoolState;
    };
}

/**
 * Checks that, given the parameters, it is possible to perform actions that require the active dancer to be an actual
 * dancer in a car.
 * @param action The parameters that showed the popper
 * @returns Whether it is possible to perform actions that assume that the active dancer is in a car and not an empty
 *          seat
 */
function isDancerInACarpool(action: OccupantActionParameters | null): action is DancerInACarpoolParameters {
    const activeDancer = action?.activeDancer;
    if (!activeDancer) {
        return false;
    }

    return !!(activeDancer.id && activeDancer.carpoolState);
}
// #endregion

// #region Promote to driver
/** An extension of {@link OccupantActionParameters} that meets the prerequisites to promote someone to a driver */
type PromoteToDriverParameters = NotEmptySeatParameters;

/**
 * Checks that, given the parameters, it is possible to promote the active dancer to be the driver of their own car.
 * @param action The parameters that showed the popper
 * @returns Whether the active dancer can become a driver
 */
function canPromoteToDriver(action: OccupantActionParameters | null): action is PromoteToDriverParameters {
    return isDancerNotEmptySeat(action)
        && action.carpoolArrangementState.canPromoteToDriver(action.activeDancer.id);
}

interface PromoteToDriverButtonProps {
    action: PromoteToDriverParameters;
    dancerName: string;
    setSnackbarProps: SetSnackbarProps;
}

/** A button that promotes the active dancer to the driver of their own car. */
const PromoteToDriverButton: React.FC<PromoteToDriverButtonProps> = ({ action, dancerName, setSnackbarProps }) => {
    const intl = useIntl();

    const onSnackbarClose = useCallback(() => setSnackbarProps(null), [setSnackbarProps]);
    const onSnackbarGoToCar = useCallback(() => {
        focusOnDancerID(action.activeDancer.id);
        onSnackbarClose();
    }, [action.activeDancer.id, onSnackbarClose]);

    const onClick = useCallback(() => {
        action.carpoolArrangementState.promoteToDriver(action.activeDancer.id);

        // Don't select the driver. Instead, show a snackbar that gives the user the option to focus on it.
        action.onClose(false);

        setSnackbarProps({
            autoHideDuration: 6000,
            message: intl.formatMessage({ id: MessageID.carpoolPromoteDriverSnack }, { name: dancerName }),
            action: <>
                <Button onClick={onSnackbarGoToCar}>
                    <FormattedMessage id={MessageID.carpoolPromoteDriverSnackGoToCar} />
                </Button>
                <SnackbarCloseButton onClick={onSnackbarClose} />
            </>,
            onClose: onSnackbarClose,
        });
    }, [action, dancerName, intl, onSnackbarGoToCar, onSnackbarClose, setSnackbarProps]);

    const values = useMemo(() => ({ name: dancerName }), [dancerName]);

    return <Button onClick={onClick} variant="outlined" startIcon={<DirectionsCarIcon />}>
        <FormattedMessage id={MessageID.carpoolPromoteDriver} values={values} />
    </Button>;
};
// #endregion

// #region Unassign occupant
/**
 * An extension of {@link OccupantActionParameters} that meets the prerequisites to unassign an occupant from the
 * carpool that they are currently in
 */
type UnassignOccupantParameters = DancerInACarpoolParameters;

/**
 * Checks that, given the parameters, it is possible to unassign the active dancer from the carpool that they are in.
 * @param action The parameters that showed the popper
 * @returns Whether the active dancer can be unassigned from the carpool that they are in
 */
function canUnassignOccupant(action: OccupantActionParameters | null): action is UnassignOccupantParameters {
    // The active dancer must not be an empty seat, must be in a carpool, and must not be the driver of that carpool.
    return isDancerInACarpool(action)
        && action.carpoolArrangementState.isPassenger(action.activeDancer.id) === true;
}

interface UnassignOccupantButtonProps {
    action: UnassignOccupantParameters;
    occupantName: string;
}

const UnassignOccupantButton: React.FC<UnassignOccupantButtonProps> = ({ action, occupantName }) => {
    const values = useMemo(() => ({ name: occupantName }), [occupantName]);

    const onClick = useCallback(() => {
        action.carpoolArrangementState.unassignOccupant(action.activeDancer.id);
        action.onClose(false);
    }, [action]);

    return <Button onClick={onClick} variant="outlined" startIcon={<RemoveCircleIcon />}>
        <FormattedMessage id={MessageID.carpoolUnassignOccupant} values={values} />
    </Button>;
};
// #endregion

/**
 * Focuses on the dancer with the given ID.
 * Don't call this from a function that moves dancers around; it won't wait for React to rerender first.
 */
function focusOnDancerID(id: ID): void {
    document.querySelector<HTMLElement>(`.${DANCER_TILE_CONTAINER_CLASSNAME}[data-dancer-id="${id}"]`)?.focus();
}
