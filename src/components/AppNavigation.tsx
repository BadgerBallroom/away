import MenuIcon from "@mui/icons-material/Menu";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/system";
import React, { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Link, useLocation } from "react-router-dom";
import { MessageID } from "../i18n/messages";
import routes, { getAbsolutePath } from "../routes";
import LogoIcon from "./LogoIcon";
import SessionClearDialog from "./SessionClearDialog";
import SessionNameField from "./SessionNameField";

export interface AppNavigationProps {
    /** Any React node to be inserted at the bottom of the menu that appears when the user clicks the menu button */
    drawerFooter?: React.ReactNode;
}

/** The main navigation UI for the app. */
const AppNavigation: React.FC<AppNavigationProps> = ({ drawerFooter }) => {
    const intl = useIntl();
    const location = useLocation();

    const toolbarTheme = useMemo(() => createTheme({
        palette: {
            mode: "dark",
            primary: {
                main: "#fff",
            },
            secondary: {
                main: "#fff",
            },
        },
    }), []);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const openDrawer = useCallback(() => setDrawerOpen(true), []);
    const closeDrawer = useCallback(() => setDrawerOpen(false), []);

    const tabs = routes.map(route => {
        const path = getAbsolutePath(route);
        if (path === undefined || route.handle === undefined) {
            return null;
        }
        return <Tab
            key={path}
            label={intl.formatMessage({ id: route.handle.titleMessageID })}
            onClick={closeDrawer}
            component={Link}
            value={path}
            to={path}
        />;
    });

    const [showSessionClearDialog, setShowSessionClearDialog] = useState(false);
    const confirmSessionClear = useCallback(() => setShowSessionClearDialog(true), []);
    const dismissSessionClear = useCallback(() => setShowSessionClearDialog(false), []);

    // The default z-index for an AppBar is 1100. Raise this one to 1110 so that it is above other AppBars.
    return <AppBar position="fixed" color="primary" sx={APP_BAR_SX}>
        <ThemeProvider theme={toolbarTheme}>
            <Toolbar variant="dense">
                <IconButton
                    onClick={openDrawer}
                    size="large"
                    color="inherit"
                    aria-label={intl.formatMessage({ id: MessageID.menu })}
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                >
                    <MenuIcon />
                </IconButton>
                <SessionNameField />
                <Tabs
                    value={location.pathname}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={TOOLBAR_TABS_SX}
                >{tabs}</Tabs>
            </Toolbar>
        </ThemeProvider>
        <Drawer open={drawerOpen} onClose={closeDrawer}>
            <Toolbar>
                <LogoIcon sx={LOGO_ICON_SX} />
                <Typography variant="h6" sx={APP_NAME_SX}>
                    <FormattedMessage id={MessageID.appName} />
                </Typography>
            </Toolbar>
            <Divider />
            <Tabs
                value={location.pathname}
                variant="scrollable"
                orientation="vertical"
            >{tabs}</Tabs>
            <Divider />
            <Box sx={MENU_SX}>
                <MenuCommand onClick={confirmSessionClear}><FormattedMessage id={MessageID.fileNew} /></MenuCommand>
                <SessionClearDialog open={showSessionClearDialog} onClose={dismissSessionClear} />
            </Box>
            {drawerFooter}
        </Drawer>
    </AppBar>;
};

export default AppNavigation;

const MenuCommand = styled(Button)(() => `
    display: block;
    width: 100%;
    padding: 12px 16px;
`);

const APP_BAR_SX = { zIndex: 1110 } as const;
const TOOLBAR_TABS_SX = {
    display: {
        xs: "none",
        sm: "flex",
    },
} as const;
const LOGO_ICON_SX = { mr: 1 } as const;
const APP_NAME_SX = { cursor: "default" } as const;
const MENU_SX = { flexGrow: 1 } as const;
