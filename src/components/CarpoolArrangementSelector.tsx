import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { styled } from "@mui/material/styles";
import { useCallback } from "react";
import { useIntl } from "react-intl";
import { MessageID } from "../i18n/messages";
import { useDeepState } from "../model/DeepStateHooks";
import { ID } from "../model/KeyListAndMap";
import { useSession } from "../model/SessionHooks";
import { useValueInArray } from "../utilities/ArrayHooks";

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
    useDeepState(carpoolArrangementKLMState, []);

    const carpoolArrangementListState = carpoolArrangementKLMState.list;
    const carpoolArrangementList = carpoolArrangementListState.getValue();

    const onTabChange = useCallback((_: React.SyntheticEvent, newValue: ID) => {
        onChange(newValue);
    }, [onChange]);

    // If `value` is in the list, use it. Otherwise, use a value from the list.
    const valueFromList = useValueInArray(value, carpoolArrangementList, onChange);
    if (!valueFromList) {
        return null;
    }

    return <Container>
        <Tabs value={valueFromList} onChange={onTabChange} variant="scrollable" scrollButtons="auto">
            {carpoolArrangementListState.getReferencedValues().map(carpoolArrangement =>
                <TabNoCaps
                    key={carpoolArrangement.id}
                    label={carpoolArrangement.name || intl.formatMessage({ id: MessageID.untitled })}
                    value={carpoolArrangement.id}
                />,
            )}
        </Tabs>
    </Container>;
};

export default CarpoolArrangementSelector;

const Container = styled(Box)({ padding: "0 24px" });
const TabNoCaps = styled(Tab)({ textTransform: "none" });
