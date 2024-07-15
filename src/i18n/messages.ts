import { Locales } from "./locales";

export const enum MessageID {
    /** The name of the app */
    appName = "appName",
    /** The string that formats the document title */
    appNameForTitle = "appNameForTitle",
    /** Label for a dancer's housing preference field */
    dancerAccommodation = "dancerAccommodation",
    /** Option that means that the dancer prefers free housing */
    dancerAccommodationFreeHousingPreferred = "dancerAccommodationFreeHousingPreferred",
    /** Option that means that the dancer prefers staying in a hotel */
    dancerAccommodationHotelPreferred = "dancerAccommodationHotelPreferred",
    /** Option that means that the dancer equally prefers free housing and hotels */
    dancerAccommodationNoPreference = "dancerAccommodationNoPreference",
    /** Label for a dancer's same-gender housing preference field */
    dancerAccommodationSameGender = "dancerAccommodationSameGender",
    /** Option that means that the dancer is not staying in team housing */
    dancerAccommodationStayingOnOwn = "dancerAccommodationStayingOnOwn",
    /** Label for a dancer's carpool participation field */
    dancerCanDriveCarpool = "dancerCanDriveCarpool",
    /** Label for the number of people that the driver can transport, including themselves */
    dancerCanDriveMaxPeople = "dancerCanDriveMaxPeople",
    /** Label for the earliest time that a dancer can depart for the competition */
    dancerEarliestPossibleDeparture = "dancerEarliestPossibleDeparture",
    /** Label for a dancer's name field */
    dancerName = "dancerName",
    /** Label for a dancer's gender field */
    dancerGender = "dancerGender",
    /** Option that means that a dancer is female */
    dancerGenderFemale = "dancerGenderFemale",
    /** Option that means that a dancer is male */
    dancerGenderMale = "dancerGenderMale",
    /** Option that means that a dancer is neither male nor female */
    dancerGenderOther = "dancerGenderOther",
    /** Option that means that a dancer is not traveling with the team */
    dancerTravelingOnOwn = "dancerTravelingOnOwn",
    /** Tooltip text for the + button on the Dancers page */
    dancersAdd = "dancersAdd",
    /** Title for a button that deletes something */
    delete = "delete",
    /** Alt text for the logo at the top */
    logoAlt = "logoAlt",
    /** ARIA label for a menu */
    menu = "menu",
    /** The name of the home page */
    navHome = "navHome",
    /** The name of the Dancers page */
    navDancers = "navDancers",
    /** "No" */
    no = "no",
    /** Label for the text field that lets the user set the session name */
    sessionNameFieldLabel = "sessionNameFieldLabel",
    /** "Toggle Dark Mode" */
    toggleDarkMode = "toggleDarkMode",
    /** "Yes" */
    yes = "yes",
    /** "Yes, if needed" */
    yesIfNeeded = "yesIfNeeded",
}

type ForEach<T extends string, V> = {
    [key in T]: V;
};

type Messages = ForEach<Locales, ForEach<MessageID, string>>;

export const MESSAGES: Messages = {
    [Locales.ENGLISH]: {
        appName: "Away",
        appNameForTitle: "{pageTitle} - BBDT Away",
        dancerAccommodation: "Housing preference",
        dancerAccommodationFreeHousingPreferred: "Free housing preferred",
        dancerAccommodationHotelPreferred: "Hotel preferred",
        dancerAccommodationNoPreference: "Any housing",
        dancerAccommodationSameGender: "Prefers same-gender housing",
        dancerAccommodationStayingOnOwn: "Not staying with team",
        dancerCanDriveCarpool: "Can drive",
        dancerCanDriveMaxPeople: "Max people (including driver)",
        dancerEarliestPossibleDeparture: "Earliest possible departure",
        dancerGender: "Gender",
        dancerGenderFemale: "Female",
        dancerGenderMale: "Male",
        dancerGenderOther: "Other",
        dancerName: "Name",
        dancersAdd: "Add Dancer",
        dancerTravelingOnOwn: "Not traveling with team",
        delete: "Delete",
        logoAlt: "BBDT Logo",
        menu: "Menu",
        navHome: "Home",
        navDancers: "Dancers",
        no: "No",
        sessionNameFieldLabel: "Competition Name",
        toggleDarkMode: "Toggle Dark Mode",
        yes: "Yes",
        yesIfNeeded: "Yes, if needed",
    },
};

export type EnumToMessageID<T extends string> = ForEach<T, MessageID>;
