import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { useEffect, useMemo } from 'react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppNavigation, { AppNavigationPage } from './components/AppNavigation';
import DarkModeButton from './components/DarkModeButton';
import FabRenderer from './components/FabRenderer';
import PageContent from './components/PageContent';
import PageContext, { PageContextValue } from './components/PageContext';
import SessionContext from './components/SessionContext';
import { Locales } from './i18n/locales';
import { MessageID, MESSAGES } from './i18n/messages';
import Session from './model/Session';
import CarpoolsPage from './pages/CarpoolsPage';
import DancersPage from './pages/DancersPage';
import HomePage from './pages/HomePage';
import { useDarkModeToggle } from './utilities/DarkModeHooks';

const enum RoutePaths {
    home = "/",
    dancers = "/dancers",
    carpools = "/carpools",
}

interface Page extends AppNavigationPage {
    element: React.ReactNode;
}

const PAGES: Page[] = [
    {
        path: RoutePaths.home,
        messageID: MessageID.navHome,
        element: <HomePage getPages={() => PAGES} />
    },
    {
        path: RoutePaths.dancers,
        messageID: MessageID.navDancers,
        element: <DancersPage />,
    },
    {
        path: RoutePaths.carpools,
        messageID: MessageID.navCarpools,
        element: <CarpoolsPage />
    },
];

const App: React.FC = () => {
    const locale = Locales.ENGLISH;

    const [themeMode, toggleThemeMode] = useDarkModeToggle();
    const theme = useMemo(() => createTheme({
        palette: {
            mode: themeMode,
            primary: {
                main: themeMode !== "dark" ? "#c5050c" : "#fc6469",
            },
            secondary: {
                main: themeMode === "dark" ? "#c5050c" : "#fc6469",
            },
        },
    }), [themeMode]);

    const session = useMemo(() => Session.loadFromLocalStorage(), []);
    useEffect(() => {
        const confirmSaveChanges = (event: BeforeUnloadEvent) => {
            if (session.isDirty()) {
                event.preventDefault();
            }
        };
        window.addEventListener("beforeunload", confirmSaveChanges);
        return () => window.removeEventListener("beforeunload", confirmSaveChanges);
    }, [session]);

    const pageContextValue = new PageContextValue();

    return <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <IntlProvider
                messages={MESSAGES[locale]}
                locale={locale}
                defaultLocale={Locales.ENGLISH}
            >
                <SessionContext.Provider value={session}>
                    <PageContext.Provider value={pageContextValue}>
                        <BrowserRouter>
                            <AppNavigation
                                pages={PAGES}
                                drawerFooter={
                                    <Box>
                                        <DarkModeButton onClick={toggleThemeMode} />
                                    </Box>
                                }
                            />
                            <Routes>
                                {PAGES.map(({ path, messageID, element }) => (
                                    <Route
                                        key={path}
                                        path={path}
                                        element={
                                            <PageContent titleMessageID={messageID}>
                                                {element}
                                            </PageContent>
                                        }
                                    />
                                ))}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                            <FabRenderer />
                        </BrowserRouter>
                    </PageContext.Provider>
                </SessionContext.Provider>
            </IntlProvider>
        </LocalizationProvider>
    </ThemeProvider>;
};

export default App;
