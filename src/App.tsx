import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { useEffect, useMemo } from 'react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import AppNavigation, { AppNavigationPage } from './components/AppNavigation';
import DarkModeButton, { useDarkModeToggle } from './components/DarkModeButton';
import FabZoomer, { FabZoomerProps } from './components/FabZoomer';
import PageContent from './components/PageContent';
import SessionContext from './components/SessionContext';
import { Locales } from './i18n/locales';
import { MessageID, MESSAGES } from './i18n/messages';
import logo from './logo.svg';
import Session from './model/Session';
import DancersPage, { DANCERS_FAB } from './pages/DancersPage';

const SampleHome: React.FC = () => {
    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                    Edit <code>src/App.tsx</code> and save to reload.
                </p>
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn React
                </a>
            </header>
        </div>
    );
};

const enum RoutePaths {
    home = "/",
    dancers = "/dancers",
}

interface Page extends AppNavigationPage, FabZoomerProps {
    element: React.ReactNode;
}

const PAGES: Page[] = [
    {
        path: RoutePaths.home,
        messageID: MessageID.navHome,
        element: <SampleHome />
    },
    {
        path: RoutePaths.dancers,
        messageID: MessageID.navDancers,
        element: <DancersPage />,
        fab: DANCERS_FAB
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

    return <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <IntlProvider
                messages={MESSAGES[locale]}
                locale={locale}
                defaultLocale={Locales.ENGLISH}
            >
                <SessionContext.Provider value={session}>
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
                        {PAGES.map(page => (
                            <FabZoomer key={page.path} {...page} />
                        ))}
                    </BrowserRouter>
                </SessionContext.Provider>
            </IntlProvider>
        </LocalizationProvider>
    </ThemeProvider>;
};

export default App;
