import Brightness4Icon from "@mui/icons-material/Brightness4";
import IconButton from "@mui/material/IconButton";
import { useIntl } from "react-intl";
import { MessageID } from "../i18n/messages";

interface DarkModeButtonProps {
    /** A function that is called when the button is clicked and that does the toggling of dark mode. */
    onClick: () => void;
}

/** A button that toggles dark mode. The toggling should be done by `onClick`. */
const DarkModeButton: React.FC<DarkModeButtonProps> = ({ onClick: toggleDarkMode }) => {
    const intl = useIntl();

    return <IconButton
        onClick={toggleDarkMode}
        title={intl.formatMessage({ id: MessageID.toggleDarkMode })}
    >
        <Brightness4Icon />
    </IconButton>;
};

export default DarkModeButton;
