import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { useIntl } from "react-intl";
import { MessageID } from "../i18n/messages";
import { useDeepStateChangeHandler } from "../model/DeepStateHooks";
import { useSession } from "../model/SessionHooks";

/** Allows the user to edit the name of the session. */
const SessionNameField: React.FC = () => {
    const intl = useIntl();
    const session = useSession();

    const [value, onChange] = useDeepStateChangeHandler(session, ["name"]);

    return <Box width={{ xs: "100%", sm: 300 }}>
        <TextField
            label={intl.formatMessage({ id: MessageID.sessionNameFieldLabel })}
            value={value}
            onChange={onChange}
            variant="filled"
            size="small"
            fullWidth
        />
    </Box>;
};

export default SessionNameField;
