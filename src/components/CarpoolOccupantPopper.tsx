import AddIcon from "@mui/icons-material/Add";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Popper, { PopperProps } from "@mui/material/Popper";
import { SnackbarProps } from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import { JSX, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { FormattedMessage, useIntl } from "react-intl";
import { MessageID } from "../i18n/messages";
import CarpoolArrangementState from "../model/CarpoolArrangementState";
import CarpoolState from "../model/CarpoolState";
import { DancerMapState } from "../model/DancerKLM";
import { ID } from "../model/KeyListAndMap";
import { useDancerMapState } from "../model/SessionHooks";
import { DANCER_TILE_CONTAINER_CLASSNAME } from "./DancerTileContainer";
import SnackbarCloseButton from "./SnackbarCloseButton";

/** Parameters that define the actions that are possible to take on the dancer that the user just clicked on */
export interface OccupantActionParameters {
    /** The HTML element of the dancer that the user just clicked on */
    anchorEl: PopperProps["anchorEl"];
    /** The state of the arrangement of carpools that is currently being edited */
    carpoolArrangementState: CarpoolArrangementState;
    /** The ID of the dancer that the user clicked on (`undefined` if the user clicked an unoccupied seat in a car) */
    activeDancerID: ID | undefined,
    /**
     * The ID of the driver of the carpool in which the user clicked on an unoccupied spot (`undefined` if the user
     * clicked on a dancer)
     */
    driverDancerID: ID | undefined;
    /** The IDs of the dancers who were already selected prior to the user clicking on the active dancer */
    priorSelectedDancers: ReadonlySet<ID>;
    /**
     * The dancer IDs of the drivers of the carpools in which unoccupied seats were already selected prior to the user
     * clicking on the active dancer
     */
    priorSelectedEmptySpotCarpools: ReadonlySet<ID>;
    /**
     * A callback that should cause the popper to close.
     * @param shouldSelect Whether the active dancer should become selected
     * @param options.isImmediatelyReopening Whether the popper is immediately showing again (default: `false`)
     * @param options.selectDancers Dancers to select (default: the ones who were selected before), ignored if
     *                              {@link shouldSelect} is `true`
     * @param options.restoreFocus Whether to restore focus to approximately the same location on the page as before
     *                             (default: `true`)
     */
    onClose: (shouldSelect: boolean, options?: {
        isImmediatelyReopening?: boolean,
        selectDancers?: Set<ID>,
        restoreFocus?: boolean,
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
        ? dancerMapState.getChildState(action.activeDancerID)
        : undefined;

    const showPromoteToDriver = canPromoteToDriver(action);
    const showUnassignOccupant = canUnassignOccupant(action);
    const showSwapDancers = canSwapDancers(action);
    const showDeleteCarpool = canDeleteCarpool(action);

    const open = showPromoteToDriver || showUnassignOccupant || showSwapDancers || showDeleteCarpool;

    const onClickAway = useCallback(() => {
        action?.onClose(true, { restoreFocus: false });
    }, [action]);
    useHotkeys("Escape", onClickAway);

    const activeDancerName = useMemo(() => activeDancerState?.getChildValue("name") ?? "", [activeDancerState]);

    const previousAction = useRef<OccupantActionParameters | null>(null);
    useEffect(() => {
        // If the action changed, call `onClose` on the previous action.
        if (previousAction.current !== action) {
            previousAction.current?.onClose(true, { isImmediatelyReopening: open, restoreFocus: false });
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
                                dancerMapState={dancerMapState}
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
                    {showSwapDancers &&
                        <Grid>
                            <SwapDancersButton
                                action={action}
                                activeDancerName={activeDancerName}
                                dancerMapState={dancerMapState}
                            />
                        </Grid>
                    }
                    {showDeleteCarpool &&
                        <Grid>
                            <DeleteCarpoolButton
                                action={action}
                                activeDancerName={activeDancerName}
                                setSnackbarProps={setSnackbarProps}
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
    activeDancerID: NonNullable<OccupantActionParameters["activeDancerID"]>;
}

/**
 * Checks that, given the parameters, it is possible to perform actions that require the active dancer to be an actual
 * dancer and not an empty seat in a car.
 * @param action The parameters that showed the popper
 * @returns Whether it is possible to perform actions that assume that the active dancer is not an empty seat
 */
function isDancerNotEmptySeat(action: OccupantActionParameters | null): action is NotEmptySeatParameters {
    return !!action?.activeDancerID;
}

/** An extension of {@link NotEmptySeatParameters} where the active dancer currently in a carpool */
type DancerInACarpoolParameters = NotEmptySeatParameters;

/**
 * Checks that, given the parameters, it is possible to perform actions that require the active dancer to be an actual
 * dancer in a car.
 * @param action The parameters that showed the popper
 * @returns Whether it is possible to perform actions that assume that the active dancer is in a car and not an empty
 *          seat
 */
function isDancerInACarpool(action: OccupantActionParameters | null): action is DancerInACarpoolParameters {
    return isDancerNotEmptySeat(action)
        && action.carpoolArrangementState.mapFromDancerIDs.has(action.activeDancerID);
}

/** An extension of {@link OccupantActionParameters} where the active "dancer" is an unoccupied seat in a carpool */
interface EmptySeatInACarpoolParameters extends OccupantActionParameters {
    driverDancerID: NonNullable<OccupantActionParameters["driverDancerID"]>;
}

/**
 * Checks that, given the parameters, it is possible to perform actions that require that the user clicked on an
 * unoccupied seat in a car.
 * @param action The parameters that showed the popper
 * @returns Whether it is possible to perform actions that assume that the active "dancer" is an occupied seat in a car
 */
function isEmptySeatInCarpool(action: OccupantActionParameters | null): action is EmptySeatInACarpoolParameters {
    return !!action?.driverDancerID;
}

/** An extension of {@link OccupantActionParameters} where the active dancer (or unoccupied seat) is in a carpool */
type InACarpoolParameters = DancerInACarpoolParameters | EmptySeatInACarpoolParameters;

/**
 * Checks that, given the parameters, it is possible to perform actions that require that the user clicked on either an
 * occupant of a car or an unoccupied seat inside a car.
 * @param action The parameters that showed the popper
 * @returns Whether it is possible to perform actions that assume that the user clicked inside a carpool
 */
function isInCarpool(action: OccupantActionParameters | null): action is InACarpoolParameters {
    return isDancerInACarpool(action) || isEmptySeatInCarpool(action);
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
        && action.carpoolArrangementState.canPromoteToDriver(action.activeDancerID);
}

interface PromoteToDriverButtonProps {
    action: PromoteToDriverParameters;
    dancerName: string;
    setSnackbarProps: SetSnackbarProps;
    dancerMapState: DancerMapState;
}

/** A button that promotes the active dancer to the driver of their own car. */
const PromoteToDriverButton: React.FC<PromoteToDriverButtonProps> = ({
    action,
    dancerName,
    setSnackbarProps,
    dancerMapState,
}) => {
    const intl = useIntl();

    const priorSelectedDancers = useMemo(() => priorSelectedDancersWithoutActive(action), [action]);
    // If the user selected at least two dancers before clicking the active one, they probably wanted to add those
    // dancers as passengers in this car. If they only selected one, they probably only did so transiently.
    const [addSelectedAsPassengers, setAddSelectedAsPassengers] = useState(priorSelectedDancers.size >= 2);
    const onAddSelectedAsPassengersChanged = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setAddSelectedAsPassengers(event.target.checked);
    }, []);

    const onSnackbarClose = useCallback(() => setSnackbarProps(null), [setSnackbarProps]);
    const onSnackbarGoToCar = useCallback(() => {
        focusOnDancerID(action.activeDancerID);
        onSnackbarClose();
    }, [action.activeDancerID, onSnackbarClose]);

    const onClick = useCallback(() => {
        const carpoolState = action.carpoolArrangementState.promoteToDriver(action.activeDancerID);

        if (addSelectedAsPassengers && carpoolState) {
            for (const id of priorSelectedDancers) {
                action.carpoolArrangementState.moveDancerToCarpool(id, carpoolState, undefined, true);
            }
        }

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
    }, [
        action,
        addSelectedAsPassengers,
        priorSelectedDancers,
        dancerName,
        intl,
        onSnackbarGoToCar,
        onSnackbarClose,
        setSnackbarProps,
    ]);

    const values = useMemo(() => ({ name: dancerName }), [dancerName]);

    return <Stack direction="column">
        <Button onClick={onClick} variant="outlined" startIcon={<DirectionsCarIcon />}>
            <FormattedMessage id={MessageID.carpoolPromoteDriver} values={values} />
        </Button>
        {priorSelectedDancers.size > 0 && <>
            <FormControlLabel
                label={intl.formatMessage({ id: MessageID.carpoolPromoteDriverAndPassengers })}
                control={
                    <Checkbox
                        checked={addSelectedAsPassengers}
                        onChange={onAddSelectedAsPassengersChanged}
                        color="primary"
                    />
                }
                sx={PROMOTE_TO_DRIVER_CHECKBOX_SX}
            />
            <ul style={PROMOTE_TO_DRIVER_UL_STYLE}>
                {Array.from(priorSelectedDancers).map(
                    id => <li key={id}>{dancerMapState.getChildState(id)?.getChildValue("name")}</li>,
                )}
            </ul>
        </>}
    </Stack>;
};

const PROMOTE_TO_DRIVER_CHECKBOX_SX = { margin: 0 } as const;
const PROMOTE_TO_DRIVER_UL_STYLE = { listStyleType: "disc", marginLeft: "65px" } as const;
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
        && action.carpoolArrangementState.isPassenger(action.activeDancerID) === true;
}

interface UnassignOccupantButtonProps {
    action: UnassignOccupantParameters;
    occupantName: string;
}

const UnassignOccupantButton: React.FC<UnassignOccupantButtonProps> = ({ action, occupantName }) => {
    const values = useMemo(() => ({ name: occupantName }), [occupantName]);

    const onClick = useCallback(() => {
        action.carpoolArrangementState.unassignOccupant(action.activeDancerID);
        action.onClose(false);
    }, [action]);

    return <Button onClick={onClick} variant="outlined" startIcon={<RemoveCircleIcon />}>
        <FormattedMessage id={MessageID.carpoolUnassignOccupant} values={values} />
    </Button>;
};
// #endregion

// #region Delete carpool
/**
 * An extension of {@link OccupantActionParameters} that meets the prerequisites to delete a whole carpool
 */
type DeleteCarpoolParameters = DancerInACarpoolParameters;

/**
 * Checks that, given the parameters, it is possible to delete the carpool that the active dancer is in.
 * @param action The parameters that showed the popper
 * @returns Whether the carpool that the active dancer is in can be deleted
 */
function canDeleteCarpool(action: OccupantActionParameters | null): action is UnassignOccupantParameters {
    // The active dancer must not be an empty seat, must be in a carpool, and must be the driver of that carpool.
    return isDancerInACarpool(action)
        && action.carpoolArrangementState.isPassenger(action.activeDancerID) === false;
}

interface DeleteCarpoolButtonProps {
    action: DeleteCarpoolParameters;
    activeDancerName: string;
    setSnackbarProps: SetSnackbarProps;
}

const DeleteCarpoolButton: React.FC<DeleteCarpoolButtonProps> = ({ action, activeDancerName, setSnackbarProps }) => {
    const intl = useIntl();

    const onSnackbarClose = useCallback(() => setSnackbarProps(null), [setSnackbarProps]);
    const onSnackbarGoToDancers = useCallback(() => {
        // Based on `canDeleteCarpool`, the active dancer was the driver of the carpool.
        focusOnDancerID(action.activeDancerID);
        onSnackbarClose();
    }, [action.activeDancerID, onSnackbarClose]);

    const onClick = useCallback(() => {
        const occupants = action.carpoolArrangementState.deleteCarpoolWithDancer(action.activeDancerID);
        action.onClose(false, {
            selectDancers: new Set(occupants),
        });

        setSnackbarProps({
            autoHideDuration: 10000,
            message: intl.formatMessage({ id: MessageID.carpoolDeleteSnack }),
            action: <>
                <Button onClick={onSnackbarGoToDancers}>
                    {intl.formatMessage({ id: MessageID.carpoolDeleteSnackGoToDancer }, { name: activeDancerName })}
                </Button>
                <SnackbarCloseButton onClick={onSnackbarClose} />
            </>,
            onClose: onSnackbarClose,
        });
    }, [action, intl, activeDancerName, onSnackbarGoToDancers, onSnackbarClose, setSnackbarProps]);

    return <Button onClick={onClick} variant="outlined" startIcon={<DeleteForeverIcon />}>
        <FormattedMessage id={MessageID.carpoolDelete} />
    </Button>;
};
// #endregion

// #region Swap dancers
type SwapDancersParameters = NotEmptySeatParameters | EmptySeatInACarpoolParameters;

/**
 * Checks that, given the parameters, it is possible either:
 * 1. to move the selected dancer or
 * 2. to swap the selected dancer with the active one
 * @param action The parameters that showed the popper
 * @returns Whether one of the two conditions above applies
 */
function canSwapDancers(action: OccupantActionParameters | null): action is SwapDancersParameters {
    // Intentions:
    // 1. If the user clicked on a real dancer in a car...
    //    a. If other dancers were already selected, offer to swap them.
    //    b. If no other dancers were already selected, do not offer to move or to swap.
    // 2. If the user clicked on a real dancer not in a car...
    //    a. If dancers in cars were already selected, offer to swap them.
    //    b. If no dancers in cars were already selected, do not offer to move or to swap.
    // 3. If the user clicked on an unoccupied seat...
    //    a. If dancers were already selected, offer to move them here.
    //    b. If no dancers were already selected, do not offer to move or to swap.
    // This is regardless of whether any unoccupied seats were already selected.
    if (!action) {
        return false;
    }

    // If no dancers were already selected, do not offer to move or to swap.
    const priorSelectedDancers = priorSelectedDancersWithoutActive(action);
    if (!priorSelectedDancers.size) {
        return false;
    }

    // If the active dancer is in a carpool or the active "dancer" is an unoccupied spot in a car, offer to move or to
    // swap.
    if (isInCarpool(action)) {
        return true;
    }

    // If any prior selected dancer is in a carpool, offer to move or to swap.
    for (const id of priorSelectedDancers) {
        if (action.carpoolArrangementState.mapFromDancerIDs.has(id)) {
            return true;
        }
    }
    return false;
}

/**
 * Returns `true` iff:
 * 1. There were prior selected dancers or unoccupied spots.
 * 2. Those prior selected dancers and/or unoccupied spots were all in carpools.
 * 3. Those prior selected dancers and/or unoccupied spots were all in the same carpool.
 * 4. The active dancer or unoccupied spot spot is also in the same carpool.
 * @param action The parameters that showed the popper
 * @returns
 */
function priorAndActiveAreInSameCarpool(action: SwapDancersParameters): boolean {
    const priorSelectedCarpoolStates = new Set<CarpoolState>();
    for (const id of action.priorSelectedDancers.union(action.priorSelectedEmptySpotCarpools)) {
        const carpoolState = action.carpoolArrangementState.mapFromDancerIDs.get(id);
        if (!carpoolState) {
            // This prior selected dancer or unoccupied spot is not in a carpool.
            return false;
        }
        priorSelectedCarpoolStates.add(carpoolState);
    }

    if (priorSelectedCarpoolStates.size !== 1) {
        // The prior selected dancers and unoccupied spots were not all in the same carpool.
        return false;
    }

    // The prior selected dancers and unoccupied spots were all in the same carpool.
    // Check whether the carpool that the user clicked in is the same carpool.
    const activeCarpoolState = action.carpoolArrangementState.mapFromDancerIDs.get(
        isDancerNotEmptySeat(action) ? action.activeDancerID : action.driverDancerID,
    );
    return priorSelectedCarpoolStates.values().next().value === activeCarpoolState;
}

interface SwapDancersButtonProps {
    action: SwapDancersParameters;
    activeDancerName: string;
    dancerMapState: DancerMapState;
}

const SwapDancersButton: React.FC<SwapDancersButtonProps> = ({ action, activeDancerName, dancerMapState }) => {
    const intl = useIntl();

    // Create a copy of the set of prior selected dancers without the active dancer.
    const priorSelectedDancers = useMemo(() => priorSelectedDancersWithoutActive(action), [action]);

    const [priorSelectedCarpoolState, positionInPriorSelectedCarpool] = useMemo(() => {
        // Find the carpool and the position within it to which to move the active dancer.
        // If any prior selected dancers (not an unoccupied spot) were in carpools, choose any one of those carpools.
        let carpoolStates = carpoolStatesOfDancers(priorSelectedDancers, action.carpoolArrangementState);
        if (carpoolStates.size) {
            return carpoolStates.entries().next().value!;
        }

        // Choose any carpool that had prior selected unoccupied spots.
        carpoolStates = carpoolStatesOfDancers(action.priorSelectedEmptySpotCarpools, action.carpoolArrangementState);
        if (carpoolStates.size) {
            return carpoolStates.entries().next().value!;
        }

        // None of the prior selected dancers or unoccupied spots were in carpools.
        return [undefined, undefined];
    }, [priorSelectedDancers, action]);
    const [activeCarpoolState, positionInActiveCarpool] = useMemo(() => {
        const activeDancerOrDriverID = action.activeDancerID ?? action.driverDancerID;
        if (!activeDancerOrDriverID) {
            return [undefined, undefined];
        }

        const carpoolState = action.carpoolArrangementState.mapFromDancerIDs.get(activeDancerOrDriverID);
        if (!carpoolState) {
            return [undefined, undefined];
        }

        if (action.activeDancerID) {
            return [carpoolState, carpoolState.getChildState("occupants").indexOf(action.activeDancerID)];
        }
        return [carpoolState, undefined];
    }, [action]);

    const { icon, text } = useMemo(() => {
        const numPriorSelectedDancers = priorSelectedDancers.size;
        const priorSelectedDancerName = numPriorSelectedDancers === 1
            ? dancerMapState.getChildState(priorSelectedDancers.values().next().value!)?.getChildValue("name")
            : undefined;

        let icon: JSX.Element;
        let text: string; // a string and not a <FormattedMessage /> to avoid react-perf/jsx-no-new-object-as-prop
        if (isDancerNotEmptySeat(action)) {
            icon = priorAndActiveAreInSameCarpool(action) ? <SwapHorizIcon /> : <SwapVertIcon />;
            if (priorSelectedDancerName) {
                text = intl.formatMessage(
                    { id: MessageID.carpoolSwapOccupants },
                    { name1: activeDancerName, name2: priorSelectedDancerName },
                );
            } else {
                text = intl.formatMessage(
                    { id: MessageID.carpoolSwapOccupantsMore },
                    { name: activeDancerName, count: numPriorSelectedDancers },
                );
            }
        } else {
            // This is a move.
            icon = <AddIcon />;
            if (priorSelectedDancerName) {
                text = intl.formatMessage(
                    { id: MessageID.carpoolAssignOccupant },
                    { name: priorSelectedDancerName },
                );
            } else {
                text = intl.formatMessage(
                    { id: MessageID.carpoolAssignOccupantMore },
                    { count: numPriorSelectedDancers },
                );
            }
        }
        return { icon, text };
    }, [priorSelectedDancers, action, dancerMapState, activeDancerName, intl]);

    const onClick = useCallback(() => {
        // Move the active dancer.
        if (action.activeDancerID) {
            if (priorSelectedCarpoolState) {
                action.carpoolArrangementState.moveDancerToCarpool(
                    action.activeDancerID,
                    priorSelectedCarpoolState,
                    positionInPriorSelectedCarpool,
                );
            } else {
                action.carpoolArrangementState.unassignOccupant(action.activeDancerID);
            }
        }

        // Move the prior selected dancers.
        if (activeCarpoolState) {
            for (const id of priorSelectedDancers) {
                action.carpoolArrangementState.moveDancerToCarpool(
                    id,
                    activeCarpoolState,
                    positionInActiveCarpool,
                );
            }
        } else {
            for (const id of priorSelectedDancers) {
                action.carpoolArrangementState.unassignOccupant(id);
            }
        }
        action.onClose(false);
    }, [
        action,
        priorSelectedCarpoolState,
        positionInPriorSelectedCarpool,
        priorSelectedDancers,
        activeCarpoolState,
        positionInActiveCarpool,
    ]);

    return <Button onClick={onClick} variant="outlined" startIcon={icon}>{text}</Button>;
};
// #endregion

/**
 * Focuses on the dancer with the given ID.
 * Don't call this from a function that moves dancers around; it won't wait for React to rerender first.
 */
function focusOnDancerID(id: ID): void {
    document.querySelector<HTMLElement>(`.${DANCER_TILE_CONTAINER_CLASSNAME}[data-dancer-id="${id}"]`)?.focus();
}

/**
 * Returns a map from each carpool that had at least one of the specified dancers to the maximum position of the
 * specified dancers in that carpool. Dancers who are not in carpools are ignored.
 * @param dancerIDs An iterable of dancer IDs
 * @returns The map
 */
function carpoolStatesOfDancers(
    dancerIDs: Iterable<ID>,
    carpoolArrangementState: CarpoolArrangementState,
): Map<CarpoolState, number> {
    const carpoolStates = new Map<CarpoolState, number>();
    for (const id of dancerIDs) {
        const carpoolState = carpoolArrangementState.mapFromDancerIDs.get(id);
        if (carpoolState) {
            const currentPosition = carpoolState.getChildState("occupants").indexOf(id);
            const existingPosition = carpoolStates.get(carpoolState);
            if (existingPosition === undefined || currentPosition > existingPosition) {
                carpoolStates.set(carpoolState, currentPosition);
            }
        }
    }
    return carpoolStates;
}

/**
 * Gets the select of dancers who were selected before the user clicked on the active one, minus the active one.
 * @param action The parameters that showed the popper
 * @returns The set of dancers who were prior selected except for the one that the user clicked on
 */
function priorSelectedDancersWithoutActive(action: OccupantActionParameters) {
    if (action.activeDancerID) {
        const priorSelectedDancers = new Set(action.priorSelectedDancers);
        priorSelectedDancers.delete(action.activeDancerID);
        return priorSelectedDancers;
    }
    return action.priorSelectedDancers;
}
