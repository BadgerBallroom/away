import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import { styled } from "@mui/material/styles";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { FormattedMessage, useIntl } from "react-intl";
import { MessageID } from "../i18n/messages";
import CarpoolArrangementState from "../model/CarpoolArrangementState";
import { DancerListState } from "../model/DancerKLM";
import { useDeepStateChangeHandler, useDeepStateChangeListener } from "../model/DeepStateHooks";
import { useElementSelectionManager } from "../model/ElementSelectionHooks";
import { ID } from "../model/KeyListAndMap";
import { useSession } from "../model/SessionHooks";
import CarpoolArrangerDay from "./CarpoolArrangerDay";
import { ShowCarpoolDeparturePopover } from "./CarpoolDeparturePopover";
import { ShowCarpoolOccupantPopper } from "./CarpoolOccupantPopper";
import DancerTile from "./DancerTile";
import DancerTileContainer, { DANCER_TILE_CONTAINER_CLASSNAME, DANCER_TILE_HORIZONTAL_NAVIGATION_ANCESTOR_CLASSNAME, DANCER_TILE_LINE_WRAPPER_CLASSNAME, ShouldSelectDancer } from "./DancerTileContainer";
import { isInsideDancerTileContainer } from "./DancerTileContainerUtils";
import DeleteButton from "./DeleteButton";
import ElementSelectionContext from "./ElementSelectionContext";

interface CarpoolArrangerFromIDProps {
    /** The ID of the `CarpoolArrangement` that the user will edit */
    arrangementID: ID;
    /** A function that lets this, as a child component, put more buttons on the workspace toolbar */
    setAdditionalToolbarChildren: (children: React.ReactNode) => void;
    /** A callback that opens the popover to edit a date and time */
    showCarpoolDeparturePopover: ShowCarpoolDeparturePopover;
    /** A callback that opens the popover with actions to perform on a dancer */
    showCarpoolOccupantPopover: ShowCarpoolOccupantPopper;
}

/** Lets the user edit the `CarpoolArrangement` with the given ID. */
export const CarpoolArrangerFromID: React.FC<CarpoolArrangerFromIDProps> = ({
    arrangementID,
    setAdditionalToolbarChildren,
    showCarpoolDeparturePopover,
    showCarpoolOccupantPopover,
}) => {
    const session = useSession();
    const carpoolArrangementKLMState = session.getChildState("carpoolArrangements");

    const onDeleteClick = useCallback(() => {
        const carpoolArrangementListState = carpoolArrangementKLMState.list;
        const index = carpoolArrangementListState.getValue().indexOf(arrangementID);
        if (index !== -1) {
            carpoolArrangementListState.pop(index);
        }
    }, [carpoolArrangementKLMState, arrangementID]);

    const carpoolArrangementState = carpoolArrangementKLMState.map.getChildState(arrangementID);
    if (!carpoolArrangementState) {
        return null;
    }

    return <CarpoolArranger
        state={carpoolArrangementState}
        onDeleteClick={onDeleteClick}
        setAdditionalToolbarChildren={setAdditionalToolbarChildren}
        showCarpoolDeparturePopover={showCarpoolDeparturePopover}
        showCarpoolOccupantPopover={showCarpoolOccupantPopover}
    />;
};

interface SharedProps {
    /** The state of the `CarpoolArrangement` that the user will edit */
    state: CarpoolArrangementState;
}

interface CarpoolArrangerProps extends SharedProps {
    /** A function to execute when the user clicks on the Delete button */
    onDeleteClick?: () => void;
    /** A function that lets this, as a child component, put more buttons on the workspace toolbar */
    setAdditionalToolbarChildren: (children: React.ReactNode) => void;
    /** A callback that opens the dialog to edit a date and time */
    showCarpoolDeparturePopover: ShowCarpoolDeparturePopover;
    /** A callback that opens the popover with actions to perform on a dancer */
    showCarpoolOccupantPopover: ShowCarpoolOccupantPopper;
}

/** Lets the user edit the given `CarpoolArrangement`. */
const CarpoolArranger: React.FC<CarpoolArrangerProps> = ({
    state,
    onDeleteClick,
    setAdditionalToolbarChildren,
    showCarpoolDeparturePopover,
    showCarpoolOccupantPopover,
}) => {
    const [unassignedDancers, setUnassignedDancers] = useState(() => state.findUnassignedDancers());
    const [carpoolsByDay, setCarpoolsByDay] = useState(() => state.groupByDepartureTime());
    useDeepStateChangeListener(state.getChildState("carpools"), () => {
        setUnassignedDancers(state.findUnassignedDancers());
        setCarpoolsByDay(state.groupByDepartureTime());
    });

    const selectionParentRef = useRef<HTMLElement>(undefined);

    /**
     * Gets the {@link DancerTileContainer}s in the specified parent.
     * @param parent The DOM element to search in (default: {@link selectionParentRef})
     */
    const getDancerTileContainers = useCallback((parent?: Element) => {
        if (!parent) {
            parent = selectionParentRef.current;
        }

        if (!parent) {
            return [];
        }

        return Array.from(parent.querySelectorAll<HTMLElement>(`.${DANCER_TILE_CONTAINER_CLASSNAME}`));
    }, []);

    const { selection, replaceSelection, addRangeToSelection } = useElementSelectionManager(getDancerTileContainers);

    /**
     * Converts {@link selection} from a set of HTML elements to a set of dancer IDs. For unoccupied spots in cars, the
     * dancer IDs of the drivers are put in a separate set.
     * @returns The IDs of the set of selected dancers and the IDs of the drivers of the selected unoccupied spots
     */
    const convertSelectionToIDs = useCallback(() => {
        const selectedDancers = new Set<ID>();
        const driversOfSelectedEmptySeats = new Set<ID>();
        for (const element of selection.selected) {
            const id = element.dataset.dancerId;
            if (id) {
                selectedDancers.add(id);
                continue;
            }

            const driverDancerID = element.dataset.driverDancerId;
            if (driverDancerID) {
                driversOfSelectedEmptySeats.add(driverDancerID);
            }
        }
        return { selectedDancers, driversOfSelectedEmptySeats };
    }, [selection]);

    const [dancerIDsToSelect, setDancerIDsToSelect] = useState<Set<ID> | null>(null);
    useEffect(() => {
        if (!dancerIDsToSelect) {
            return;
        }

        const newSelection = new Set<number>();

        // Because this is in a `useEffect`, React will run this after rendering. Therefore, if the dancers moved around
        // as a result of a user interaction, this will have the dancers in the new order.
        const tiles = getDancerTileContainers();
        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];
            const dancerID = tile.dataset.dancerId;
            if (dancerID && dancerIDsToSelect.has(dancerID)) {
                newSelection.add(i);
            }
        }

        replaceSelection(newSelection);
        setDancerIDsToSelect(null);
    }, [dancerIDsToSelect, getDancerTileContainers, replaceSelection]);

    const [criteriaForDancerFocus, setCriteriaForDancerFocus] = useState<{
        arrangement: {
            /** The index of the dancer among all the dancers in the carpool arrangement */
            index: number;
        };
        carpool: {
            /** The carpool that the dancer is in */
            closest: HTMLElement;
            /** The index of the dancer amog all the dancers in the carpool */
            index: number;
        } | null;
    } | null>(null);
    useEffect(() => {
        if (!criteriaForDancerFocus) {
            return;
        }

        const [tiles, index] = (
            criteriaForDancerFocus.carpool
            && document.contains(criteriaForDancerFocus.carpool.closest)
            && criteriaForDancerFocus.carpool.index >= 0
        ) ? (
            // Focus on the same position in the same carpool as before.
            [getDancerTileContainers(criteriaForDancerFocus.carpool.closest), criteriaForDancerFocus.carpool.index]
        ) : (
            // Focus on the Nth dancer (or unoccupied spot) on the page, where N is the index of the previously focused
            // dancer (or unoccupied spot).
            [getDancerTileContainers(), criteriaForDancerFocus.arrangement.index]
        );
        tiles[Math.max(0, Math.min(tiles.length - 1, index))].focus();

        setCriteriaForDancerFocus(null);
    }, [criteriaForDancerFocus, getDancerTileContainers]);

    const onSelectAllClick = useCallback(() => {
        addRangeToSelection(0, getDancerTileContainers().length);
    }, [addRangeToSelection, getDancerTileContainers]);
    useHotkeys("Ctrl+A, Cmd+A", onSelectAllClick, { preventDefault: true });

    const canUnassignSelected =
        Array.from(convertSelectionToIDs().selectedDancers).some(id => state.mapFromDancerIDs.has(id));
    const onUnassignSelectedClick = useCallback(() => {
        for (const id of convertSelectionToIDs().selectedDancers) {
            state.unassignOccupant(id);
        }
        setDancerIDsToSelect(new Set());
    }, [convertSelectionToIDs, state, setDancerIDsToSelect]);
    useHotkeys("Delete, Backspace", onUnassignSelectedClick, { preventDefault: true });

    useEffect(() => {
        setAdditionalToolbarChildren(<>
            <Button disabled={!canUnassignSelected} onClick={onUnassignSelectedClick} startIcon={<RemoveCircleIcon />}>
                <FormattedMessage id={MessageID.carpoolUnassignSelected} />
            </Button>
        </>);
        return () => setAdditionalToolbarChildren(null);
    }, [canUnassignSelected, onUnassignSelectedClick, setAdditionalToolbarChildren]);

    const shouldSelectDancer: ShouldSelectDancer = useCallback(async (event, ref) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
            return true;
        }

        if (!ref) {
            return true;
        }

        const closestCarpool = ref.closest<HTMLElement>(`.${DANCER_TILE_HORIZONTAL_NAVIGATION_ANCESTOR_CLASSNAME}`);
        const criteriaForDancerFocus = {
            arrangement: {
                index: getDancerTileContainers().indexOf(ref),
            },
            carpool: closestCarpool
                ? {
                    closest: closestCarpool,
                    index: getDancerTileContainers(closestCarpool).indexOf(ref),
                }
                : null,
        };

        // If the tile that was clicked is a dancer, it will have a dancer ID.
        // Otherwise, it is an empty spot in a car and will have the dancer ID of the driver.
        const activeDancerID = ref.dataset.dancerId;
        const driverDancerID = ref.dataset.driverDancerId;
        if (!activeDancerID && !driverDancerID) {
            return true;
        }

        const {
            selectedDancers: priorSelectedDancers,
            driversOfSelectedEmptySeats: priorSelectedEmptySpotCarpools,
        } = convertSelectionToIDs();

        // Attempt to show a menu of things that can be done to the dancer. The menu will call `onClose` with whether
        // the dancer should be selected. Resolve the `Promise` at that point with that value.
        return new Promise<boolean>(resolve => {
            showCarpoolOccupantPopover({
                anchorEl: ref,
                carpoolArrangementState: state,
                activeDancerID,
                driverDancerID,
                priorSelectedDancers,
                priorSelectedEmptySpotCarpools,
                onClose: (shouldSelect, options) => {
                    if (!options?.isImmediatelyReopening) {
                        showCarpoolOccupantPopover(null);
                    }

                    if (!shouldSelect) {
                        // If `shouldSelect` is `true`, then the normal selection action should happen instead of this.
                        setDancerIDsToSelect(options?.selectDancers ?? priorSelectedDancers);
                    }

                    if (options?.restoreFocus !== false) {
                        setCriteriaForDancerFocus(criteriaForDancerFocus);
                    }

                    // This function can be called multiple times, but it is safe to resolve a Promise more than once.
                    // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise:
                    // "You will also hear the term resolved used with promises — this means that the promise is settled
                    // or "locked-in" to match the eventual state of another promise, and further resolving or rejecting
                    // it has no effect."
                    resolve(shouldSelect);
                },
            });
        });
    }, [state, convertSelectionToIDs, showCarpoolOccupantPopover, getDancerTileContainers]);

    const onSelectionParentClick = useCallback((event: React.MouseEvent) => {
        if (!isInsideDancerTileContainer(event.target)) {
            setDancerIDsToSelect(new Set());
        }
    }, []);

    return <>
        <Heading>
            <Toolbar>
                <ArrangementNameField state={state} />
                {onDeleteClick && <DeleteButton onClick={onDeleteClick} />}
            </Toolbar>
        </Heading>
        <ElementSelectionContext.Provider value={selection}>
            <Box ref={selectionParentRef} onClick={onSelectionParentClick}>
                <Unassigned unassignedDancers={unassignedDancers} shouldSelectDancer={shouldSelectDancer} />
                <Schedule
                    carpoolsByDay={carpoolsByDay}
                    shouldSelectDancer={shouldSelectDancer}
                    showCarpoolDeparturePopover={showCarpoolDeparturePopover}
                />
            </Box>
        </ElementSelectionContext.Provider>
    </>;
};

export default CarpoolArranger;

const Heading = styled(Paper)({ padding: "20px 0" });

const MARGIN_RIGHT = { marginRight: "20px" } as const;

/** A field to edit the name of the carpool arrangement. */
const ArrangementNameField: React.FC<SharedProps> = ({ state }) => {
    const intl = useIntl();
    const [name, onNameChange] = useDeepStateChangeHandler(state, ["name"]);
    return <TextField
        label={intl.formatMessage({ id: MessageID.carpoolArrangementNameLabel })}
        value={name}
        onChange={onNameChange}
        sx={MARGIN_RIGHT}
    />;
};

interface UnassignedProps {
    unassignedDancers: ID[];
    shouldSelectDancer: ShouldSelectDancer;
}

/** Shows dancers who are traveling with the team but not assigned to a carpool. */
const Unassigned: React.FC<UnassignedProps> = ({ unassignedDancers, shouldSelectDancer }) => {
    const session = useSession();

    if (!unassignedDancers.length) {
        return null;
    }

    const unassignedBarClassName = [
        DANCER_TILE_HORIZONTAL_NAVIGATION_ANCESTOR_CLASSNAME,
        DANCER_TILE_LINE_WRAPPER_CLASSNAME,
    ].join(" ");
    const unassignedState = DancerListState.makeAndRegister(session, unassignedDancers);
    return <UnassignedBar className={unassignedBarClassName}>
        <Alert severity="warning">
            <FormattedMessage id={MessageID.carpoolUnassigned} />
        </Alert>
        <Grid container marginTop={2} spacing={2} justifyContent="center">
            {unassignedState.getIDsAndReferencedStates().map(({ id, state: dancerState }) =>
                <Grid key={dancerState.evanescentID}>
                    <DancerTileContainer
                        shouldSelect={shouldSelectDancer}
                        data-dancer-id={id}
                    >
                        <DancerTile dancerState={dancerState} elevation={3} />
                    </DancerTileContainer>
                </Grid>,
            )}
        </Grid>
    </UnassignedBar>;
};

const UnassignedBar = styled(Box)(({ theme }) => {
    return `
        margin: 12px 12px 0;
        padding: 12px;
        border: 2px solid ${theme.palette.warning.main};
    `;
});

interface ScheduleProps {
    carpoolsByDay: CarpoolArrangementState.CarpoolsForDay[];
    shouldSelectDancer: ShouldSelectDancer;
    showCarpoolDeparturePopover: ShowCarpoolDeparturePopover;
}

/** A table of departure times and carpools. */
const Schedule: React.FC<ScheduleProps> = ({ carpoolsByDay, shouldSelectDancer, showCarpoolDeparturePopover }) => {
    return <>{carpoolsByDay.map(carpoolsForDay =>
        <CarpoolArrangerDay
            key={carpoolsForDay.day?.valueOf()}
            carpoolsForDay={carpoolsForDay}
            shouldSelectDancer={shouldSelectDancer}
            showCarpoolDeparturePopover={showCarpoolDeparturePopover}
        />,
    )}</>;
};
