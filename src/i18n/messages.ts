import { Locales } from "./locales";

export const enum MessageID {
    /** Alt text for the logo at the top */
    logoAlt = "logoAlt",
}

type ForEach<T extends string, V> = {
    [key in T]: V;
};

type Messages = ForEach<Locales, ForEach<MessageID, string>>;

export const MESSAGES: Messages = {
    [Locales.ENGLISH]: {
        logoAlt: "BBDT Logo",
    },
};
