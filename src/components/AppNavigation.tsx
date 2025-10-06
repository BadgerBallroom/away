import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import React, { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useLocation } from 'react-router-dom';
import { MessageID } from '../i18n/messages';
import LogoIcon from './LogoIcon';

export interface AppNavigationPage {
    /** The URL path to this page */
    path: string;
    /** The message ID for the page title */
    messageID: MessageID;
}

export interface AppNavigationProps {
    /** A link to each page will be shown in the navigation menus */
    pages: AppNavigationPage[];
    /** Any React node to be inserted at the bottom of the menu that appears when the user clicks the menu button */
    drawerFooter?: React.ReactNode;
}

/** The main navigation UI for the app. */
const AppNavigation: React.FC<AppNavigationProps> = ({ pages, drawerFooter }) => {
    const intl = useIntl();
    const location = useLocation();

    const toolbarTheme = useMemo(() => createTheme({
        palette: {
            mode: "dark",
            primary: {
                main: '#fff',
            },
            secondary: {
                main: '#fff',
            },
        },
    }), []);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const openDrawer = useCallback(() => setDrawerOpen(true), []);
    const closeDrawer = useCallback(() => setDrawerOpen(false), []);

    const tabs = pages.map(page => (
        <Tab
            key={page.path}
            label={intl.formatMessage({ id: page.messageID })}
            onClick={closeDrawer}
            component={Link}
            value={page.path}
            to={page.path}
        />
    ));

    // The default z-index for an AppBar is 1100. Raise this one to 1110 so that it is above other AppBars.
    return <AppBar position="fixed" color="primary" sx={{ zIndex: 1110 }}>
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
                <Tabs
                    value={location.pathname}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                >{tabs}</Tabs>
            </Toolbar>
        </ThemeProvider>
        <Drawer open={drawerOpen} onClose={closeDrawer}>
            <Toolbar>
                <LogoIcon sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ cursor: "default" }}>
                    <FormattedMessage id={MessageID.appName} />
                </Typography>
            </Toolbar>
            <Divider />
            <Tabs
                value={location.pathname}
                variant="scrollable"
                orientation="vertical"
                sx={{ flexGrow: 1 }}
            >{tabs}</Tabs>
            {drawerFooter}
        </Drawer>
    </AppBar>;
};

export default AppNavigation;
