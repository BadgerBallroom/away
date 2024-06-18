import Brightness4Icon from '@mui/icons-material/Brightness4';
import IconButton from "@mui/material/IconButton";
import { useCallback, useState } from "react";
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

export type DarkMode = "light" | "dark";

function isValidMode(value: any): value is DarkMode {
    return value === "light" || value === "dark";
}

function getModeFromMediaQuery(mediaQuery: MediaQueryList | MediaQueryListEvent): DarkMode {
    return mediaQuery.matches ? "dark" : "light";
}

/**
 * Returns a stateful value that represents whether dark mode should be used, and a function to update it. The value is
 * stored in localStorage across sessions. The default value is the system-wide dark mode setting. Pass null to the
 * update function to revert to the system-wide setting. The value will be updated (and re-rendering will be triggered)
 * automatically when the user changes the system-wide setting.
 */
export function useDarkModeState(): [DarkMode, (mode: DarkMode | null) => void] {
    let initialState: DarkMode;
    let systemWideMode: DarkMode;
    let mediaQuery: MediaQueryList | undefined;

    const storageKey = "darkMode";
    const storedMode = localStorage.getItem(storageKey);

    // Query the system for its dark mode setting.
    if (typeof matchMedia === "function") {
        mediaQuery = matchMedia("(prefers-color-scheme: dark)");
        systemWideMode = getModeFromMediaQuery(mediaQuery);
    } else {
        systemWideMode = "light";
    }

    // If there is a stored setting, it overrides the system-wide one.
    if (isValidMode(storedMode)) {
        initialState = storedMode;
    } else {
        initialState = systemWideMode;
    }

    const [mode, setMode] = useState(initialState);

    // When the user changes the system-wide setting, use it and clear any stored setting.
    if (mediaQuery) {
        mediaQuery.addEventListener("change", event => {
            localStorage.removeItem(storageKey);
            systemWideMode = getModeFromMediaQuery(event);
            setMode(systemWideMode);
        });
    }

    return [mode, mode => {
        if (isValidMode(mode)) {
            localStorage.setItem(storageKey, mode);
            setMode(mode);
        } else {
            // Clear any stored setting and revert to the system-wide one.
            localStorage.removeItem(storageKey);
            setMode(systemWideMode);
        }
    }];
}

/** Like useDarkModeState, except that the update function toggles dark mode instead of setting it. */
export function useDarkModeToggle(): [DarkMode, () => void] {
    const [mode, setMode] = useDarkModeState();
    const toggleDarkMode = useCallback(() => setMode(mode === "dark" ? "light" : "dark"), [mode, setMode]);
    return [mode, toggleDarkMode];
}
