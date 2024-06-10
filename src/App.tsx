import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import React, { useMemo } from 'react';
import './App.css';
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
        <SampleHome />
    </ThemeProvider>;
};

export default App;
