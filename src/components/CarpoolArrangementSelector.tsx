import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { styled } from "@mui/material/styles";
import { useCallback, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { MessageID } from "../i18n/messages";
import { useDeepStateChangeListener } from "../model/DeepStateHooks";
import { ID } from "../model/KeyListAndMap";
import { useSession } from "../model/SessionHooks";

interface CarpoolArrangementSelectorProps {
    /** The ID of the carpool arrangement that is currently selected */
    value: ID;
    /** A callback for when the user selects a different carpool arrangement */
    onChange: (id: ID) => void;
}

/** A tab strip with a tab for each `CarpoolArrangement` in the session. Lets the user choose one. */
const CarpoolArrangementSelector: React.FC<CarpoolArrangementSelectorProps> = ({
    value,
    onChange,
}) => {
    const intl = useIntl();

    const session = useSession();
    const carpoolArrangementKLMState = session.getChildState("carpoolArrangements");

    const indexOfValue = useRef(carpoolArrangementKLMState.list.indexOf(value));
    const [carpoolArrangementIDsAndNames, setCarpoolArrangementIDsAndNames] =
        useState<{ id: ID, name: string }[]>([]);
    useDeepStateChangeListener(carpoolArrangementKLMState, () => {
        // Refresh the array of the IDs and names of the carpool arrangements.
        setCarpoolArrangementIDsAndNames(
            carpoolArrangementKLMState.list.getIDsAndReferencedStates()
                .map(({ id, state }) => ({ id, name: state.getChildValue("name") })),
        );

        // If the value is no longer valid, choose the one that is at the same position in the array.
        if (carpoolArrangementKLMState.list.indexOf(value) === -1) {
            const allCarpoolArrangementIDs = carpoolArrangementKLMState.list.getValue();
            indexOfValue.current = Math.max(0, Math.min(allCarpoolArrangementIDs.length - 1, indexOfValue.current));
            onChange(allCarpoolArrangementIDs[indexOfValue.current]);
        }
    });

    const onTabChange = useCallback((_: React.SyntheticEvent, newValue: ID) => {
        onChange(newValue);
    }, [onChange]);

    return <Container>
        <Tabs value={value} onChange={onTabChange} variant="scrollable" scrollButtons="auto">
            {carpoolArrangementIDsAndNames.map(({ id, name }) => (
                <TabNoCaps key={id} value={id} label={name || intl.formatMessage({ id: MessageID.untitled })} />
            ))}
        </Tabs>
    </Container>;
};

export default CarpoolArrangementSelector;

const Container = styled(Box)({ padding: "0 24px" });
const TabNoCaps = styled(Tab)({ textTransform: "none" });
