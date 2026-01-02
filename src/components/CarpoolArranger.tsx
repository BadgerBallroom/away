import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import { styled } from "@mui/material/styles";
import { useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { MessageID } from "../i18n/messages";
import CarpoolArrangementState from "../model/CarpoolArrangementState";
import { DancerListState } from "../model/DancerKLM";
import { useDeepStateChangeHandler, useDeepStateChangeListener } from "../model/DeepStateHooks";
import { ID } from "../model/KeyListAndMap";
import { useSession } from "../model/SessionHooks";
import CarpoolArrangerDay from "./CarpoolArrangerDay";
import { ShowCarpoolDepartureDialog } from "./CarpoolDepartureDialog";
import DancerTile from "./DancerTile";
import DeleteButton from "./DeleteButton";

interface CarpoolArrangerFromIDProps {
    /** The ID of the `CarpoolArrangement` that the user will edit */
    arrangementID: ID;
    /** A callback that opens the dialog to edit a date and time */
    showCarpoolDepartureDialog: ShowCarpoolDepartureDialog;
}

/** Lets the user edit the `CarpoolArrangement` with the given ID. */
export const CarpoolArrangerFromID: React.FC<CarpoolArrangerFromIDProps> = ({
    arrangementID,
    showCarpoolDepartureDialog,
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
        showCarpoolDepartureDialog={showCarpoolDepartureDialog}
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
    showCarpoolDepartureDialog: ShowCarpoolDepartureDialog;
}

/** Lets the user edit the given `CarpoolArrangement`. */
const CarpoolArranger: React.FC<CarpoolArrangerProps> = ({ state, onDeleteClick, showCarpoolDepartureDialog }) => {
    return <>
        <Heading>
            <Toolbar>
                <ArrangementNameField state={state} />
                {onDeleteClick && <DeleteButton onClick={onDeleteClick} />}
            </Toolbar>
        </Heading>
        <Alert severity="info"><FormattedMessage id={MessageID.zCarpoolsFuture} /></Alert>
        <Unassigned state={state} />
        <Schedule state={state} showCarpoolDepartureDialog={showCarpoolDepartureDialog} />
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
    const [unassigned, setUnassigned] = useState(() => state.findUnassignedDancers());
    useDeepStateChangeListener(state, () => {
        setUnassigned(state.findUnassignedDancers());
    });

    if (!unassigned.size) {
        return null;
    }

    const unassignedArray: ID[] = [];
    unassigned.forEach(id => unassignedArray.push(id));
    const unassignedState = DancerListState.makeAndRegister(session, unassignedArray);
    return <UnassignedBar>
        <Grid container spacing={2} justifyContent="center">
            {unassignedState.getReferencedStates().map(dancerState =>
                <Grid key={dancerState.evanescentID}>
                    <DancerTile dancerState={dancerState} elevation={3} />
                </Grid>,
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

interface ScheduleProps extends SharedProps {
    showCarpoolDepartureDialog: ShowCarpoolDepartureDialog;
}

/** A table of departure times and carpools. */
const Schedule: React.FC<ScheduleProps> = ({ state, showCarpoolDepartureDialog }) => {
    const [carpoolsByDay, setCarpoolsByDay] = useState(() => state.groupByDepartureTime());
    useDeepStateChangeListener(state, () => {
        setCarpoolsByDay(state.groupByDepartureTime());
    });

    return <>{carpoolsByDay.map(carpoolsForDay =>
        <CarpoolArrangerDay
            key={carpoolsForDay.day?.valueOf()}
            carpoolsForDay={carpoolsForDay}
            showCarpoolDepartureDialog={showCarpoolDepartureDialog}
        />,
    )}</>;
};
