import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { useMemo } from 'react';
import { IntlProvider } from 'react-intl';
import './App.css';
import { Locales } from './i18n/locales';
import { MESSAGES } from './i18n/messages';
import logo from './logo.svg';

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

const App: React.FC = () => {
    const locale = Locales.ENGLISH;

    const theme = useMemo(() => createTheme({
        palette: {
            mode: "light",
            primary: {
                main: "#c5050c",
            },
            secondary: {
                main: "#fc6469",
            },
        },
    }), []);

    return <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <IntlProvider
                messages={MESSAGES[locale]}
                locale={locale}
                defaultLocale={Locales.ENGLISH}
            >
                <SampleHome />
            </IntlProvider>
        </LocalizationProvider>
    </ThemeProvider>;
};

export default App;
