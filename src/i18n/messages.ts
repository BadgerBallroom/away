import { Locales } from "./locales";

export const enum MessageID {
    /** The name of the app */
    appName = "appName",
    /** The string that formats the document title */
    appNameForTitle = "appNameForTitle",
    /** Alt text for the logo at the top */
    logoAlt = "logoAlt",
    /** ARIA label for a menu */
    menu = "menu",
    /** The name of the home page */
    navHome = "navHome",
    /** Label for the text field that lets the user set the session name */
    sessionNameFieldLabel = "sessionNameFieldLabel",
    /** "Toggle Dark Mode" */
    toggleDarkMode = "toggleDarkMode",
}

type ForEach<T extends string, V> = {
    [key in T]: V;
};

type Messages = ForEach<Locales, ForEach<MessageID, string>>;

export const MESSAGES: Messages = {
    [Locales.ENGLISH]: {
        appName: "Away",
        appNameForTitle: "{pageTitle} - BBDT Away",
        logoAlt: "BBDT Logo",
        menu: "Menu",
        navHome: "Home",
        sessionNameFieldLabel: "Competition Name",
        toggleDarkMode: "Toggle Dark Mode",
    },
};
