import Fab, { FabProps } from "@mui/material/Fab";
import { useTheme } from "@mui/material/styles";
import Zoom from "@mui/material/Zoom";
import { useCallback } from "react";
import { useIntl } from "react-intl";
import { useLocation } from "react-router-dom";
import { MessageID } from "../i18n/messages";
import { useSession } from "../model/SessionHooks";

export interface FabZoomerFabProps extends FabProps {
    titleID: MessageID;
}

export interface FabZoomerProps {
    path: string;
    fab?: FabZoomerFabProps;
}

/** This component is responsible for animating a Floating Action Button in and out. */
const FabZoomer: React.FC<FabZoomerProps> = ({ path, fab }) => {
    const theme = useTheme();
    const intl = useIntl();
    const location = useLocation();
    const session = useSession();

    const animatingIn = location.pathname === path;

    const onClick = useCallback(() => session.triggerFABHandlers(), [session]);

    if (!fab) {
        return null;
    }

    const { titleID, children, ...otherProps } = fab;
    return <Zoom
        in={animatingIn}
        timeout={{
            enter: theme.transitions.duration.enteringScreen,
            exit: theme.transitions.duration.leavingScreen
        }}
        style={{
            transitionDelay: `${animatingIn ? theme.transitions.duration.leavingScreen : 0}ms`
        }}
        unmountOnExit
    >
        <Fab
            title={intl.formatMessage({ id: titleID })}
            onClick={onClick}
            sx={{
                position: "fixed",
                bottom: 16,
                right: 16
            }}
            {...otherProps}
        >
            {children}
        </Fab>
    </Zoom>;
};

export default FabZoomer;
