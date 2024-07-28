import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import { styled } from "@mui/system";
import { useCallback, useMemo } from "react";
import { useIntl } from "react-intl";
import { MessageID } from "../i18n/messages";
import CarpoolArrangement from '../model/CarpoolArrangement';
import CarpoolArrangementState from "../model/CarpoolArrangementState";
import { DancerListState } from "../model/DancerKLM";
import { useDeepState, useDeepStateChangeHandler } from "../model/DeepStateHooks";
import { ID } from "../model/KeyListAndMap";
import { useSession } from "../model/SessionHooks";
import CarpoolArrangerDay from './CarpoolArrangerDay';
import DancerTile from "./DancerTile";
import DeleteButton from "./DeleteButton";

interface CarpoolArrangerFromIDProps {
    /** The ID of the `CarpoolArrangement` that the user will edit */
    arrangementID: ID;
}

/** Lets the user edit the `CarpoolArrangement` with the given ID. */
export const CarpoolArrangerFromID: React.FC<CarpoolArrangerFromIDProps> = ({ arrangementID }) => {
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

    return <CarpoolArranger state={carpoolArrangementState} onDeleteClick={onDeleteClick} />;
};

interface SharedProps {
    /** The state of the `CarpoolArrangement` that the user will edit */
    state: CarpoolArrangementState;
}

interface CarpoolArrangerProps extends SharedProps {
    /** A function to execute when the user clicks on the Delete button */
    onDeleteClick?: () => void;
}

/** Lets the user edit the given `CarpoolArrangement`. */
const CarpoolArranger: React.FC<CarpoolArrangerProps> = ({ state, onDeleteClick }) => {
    return <>
        <Heading>
            <Toolbar>
                <ArrangementNameField state={state} />
                {onDeleteClick && <DeleteButton onClick={onDeleteClick} />}
            </Toolbar>
        </Heading>
        <Unassigned state={state} />
        <Schedule state={state} />
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

/** Shows dancers who are traveling with the team but not assigned to a carpool. */
const Unassigned: React.FC<SharedProps> = ({ state }) => {
    const session = useSession();
    useDeepState(state, []);

    const unassigned = state.findUnassignedDancers();
    if (!unassigned.size) {
        return null;
    }

    const unassignedArray: ID[] = [];
    unassigned.forEach(id => unassignedArray.push(id));
    const unassignedState = DancerListState.makeAndRegister(session, unassignedArray);
    return <UnassignedBar>
        <Grid container spacing={2} justifyContent="center">
            {unassignedState.getReferencedStates().map(dancerState =>
                <Grid item key={dancerState.evanescentID}>
                    <DancerTile dancerState={dancerState} elevation={3} />
                </Grid>
            )}
        </Grid>
    </UnassignedBar>;
};

const UnassignedBar = styled(Box)(({ theme }) => {
    return `
        padding: 12px 24px;
        background: ${theme.palette.warning.main};
    `;
});

/** A table of departure times and carpools. */
const Schedule: React.FC<SharedProps> = ({ state }) => {
    const value = useDeepState(state, []);
    const carpoolsByDay = useMemo(() => groupByDepartureTime(state, value), [state, value]);

    return <>{carpoolsByDay.map(carpoolsForDay =>
        <CarpoolArrangerDay key={carpoolsForDay.day?.valueOf()} carpoolsForDay={carpoolsForDay} />
    )}</>;
};

/**
 * Classifies carpools by day and hour of departure.
 * @param carpoolArrangementState The carpools to classify
 * @param _ Ignored (used to satisfy `react-hooks/exhaustive-deps` for the dependency on `value` in the `useMemo`)
 * @returns The classified carpools
 */
function groupByDepartureTime(
    carpoolArrangementState: CarpoolArrangementState,
    _: CarpoolArrangement
): CarpoolArrangementState.CarpoolsForDay[] {
    return carpoolArrangementState.groupByDepartureTime();
}
