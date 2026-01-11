import Fab from "@mui/material/Fab";
import { useTheme } from "@mui/material/styles";
import Zoom from "@mui/material/Zoom";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { useLocation } from "react-router-dom";
import { FabZoomerFabProps } from "./FabZoomerProps";

export interface FabZoomerProps {
    path: string;
    fab?: FabZoomerFabProps;
}

/** This component is responsible for animating a Floating Action Button in and out. */
const FabZoomer: React.FC<FabZoomerProps> = ({ path, fab }) => {
    const theme = useTheme();
    const intl = useIntl();
    const location = useLocation();

    const animatingIn = location.pathname === path;
    const timeout = useMemo(() => ({
        enter: theme.transitions.duration.enteringScreen,
        exit: theme.transitions.duration.leavingScreen,
    }), [theme]);
    const style = useMemo(() => ({
        transitionDelay: `${animatingIn ? theme.transitions.duration.leavingScreen : 0}ms`,
    }), [animatingIn, theme]);

    if (!fab) {
        return null;
    }

    const { titleID, children, ...otherProps } = fab;
    return <Zoom
        in={animatingIn}
        timeout={timeout}
        style={style}
        unmountOnExit
    >
        <Fab
            title={intl.formatMessage({ id: titleID })}
            sx={FAB_SX}
            {...otherProps}
        >
            {children}
        </Fab>
    </Zoom>;
};

export default FabZoomer;

const FAB_SX = {
    position: "fixed",
    bottom: 16,
    right: 16,
} as const;
