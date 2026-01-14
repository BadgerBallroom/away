import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import React, { useEffect, useMemo } from "react";
import { IntlProvider } from "react-intl";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PageContent from "./components/PageContent";
import PageContext, { PageContextValue } from "./components/PageContext";
import SessionContext from "./components/SessionContext";
import { Locales } from "./i18n/locales";
import { MESSAGES } from "./i18n/messages";
import Session from "./model/Session";
import routes from "./routes";
import { useDarkModeToggle } from "./utilities/DarkModeHooks";

const router = createBrowserRouter([{
    element: <PageContent />,
    children: routes,
}]);

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

    const pageContextValue = new PageContextValue(toggleThemeMode);

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
                        <RouterProvider router={router} />
                    </PageContext.Provider>
                </SessionContext.Provider>
            </IntlProvider>
        </LocalizationProvider>
    </ThemeProvider>;
};

export default App;
