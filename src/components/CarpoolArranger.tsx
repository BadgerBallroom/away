import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import { styled } from "@mui/material/styles";
import { useCallback, useRef, useState } from "react";
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
    /** A callback that opens the popover to edit a date and time */
    showCarpoolDeparturePopover: ShowCarpoolDeparturePopover;
    /** A callback that opens the popover with actions to perform on a dancer */
    showCarpoolOccupantPopover: ShowCarpoolOccupantPopper;
}

/** Lets the user edit the `CarpoolArrangement` with the given ID. */
export const CarpoolArrangerFromID: React.FC<CarpoolArrangerFromIDProps> = ({
    arrangementID,
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
    /** A callback that opens the dialog to edit a date and time */
    showCarpoolDeparturePopover: ShowCarpoolDeparturePopover;
    /** A callback that opens the popover with actions to perform on a dancer */
    showCarpoolOccupantPopover: ShowCarpoolOccupantPopper;
}

/** Lets the user edit the given `CarpoolArrangement`. */
const CarpoolArranger: React.FC<CarpoolArrangerProps> = ({
    state,
    onDeleteClick,
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
    const { selection, clearSelection } = useElementSelectionManager<HTMLElement>(() => Array.from(
        selectionParentRef.current?.querySelectorAll<HTMLElement>(`.${DANCER_TILE_CONTAINER_CLASSNAME}`) ?? [],
    ));

    const shouldSelectDancer: ShouldSelectDancer = useCallback(async (event, ref) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
            return true;
        }

        if (!ref) {
            return true;
        }

        // If the tile that was clicked is a dancer, it will have a dancer ID.
        // Otherwise, it is an empty spot in a car and will have the dancer ID of the driver.
        const activeDancerID = ref.dataset.dancerId;
        const driverDancerID = ref.dataset.driverDancerId;
        if (!activeDancerID && !driverDancerID) {
            return true;
        }

        const priorSelectedDancers = new Set<ID>();
        const priorSelectedEmptySpotCarpools = new Set<ID>();
        for (const element of selection.selected) {
            const id = element.dataset.dancerId;
            if (id) {
                priorSelectedDancers.add(id);
                continue;
            }

            const driverDancerID = element.dataset.driverDancerId;
            if (driverDancerID) {
                priorSelectedEmptySpotCarpools.add(driverDancerID);
            }
        }

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

                    // This function can be called multiple times, but it is safe to resolve a Promise more than once.
                    // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise:
                    // "You will also hear the term resolved used with promises — this means that the promise is settled
                    // or "locked-in" to match the eventual state of another promise, and further resolving or rejecting
                    // it has no effect."
                    resolve(shouldSelect);
                },
            });
        });
    }, [state, selection, showCarpoolOccupantPopover]);

    const onSelectionParentClick = useCallback((event: React.MouseEvent) => {
        if (!isInsideDancerTileContainer(event.target)) {
            clearSelection();
        }
    }, [clearSelection]);

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
