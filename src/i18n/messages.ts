/* eslint-disable @stylistic/max-len */
import { Locales } from "./locales";

export const enum MessageID {
    /** The name of the app */
    appName = "appName",
    /** The string that formats the document title */
    appNameForTitle = "appNameForTitle",
    /** "Cancel" */
    cancel = "cancel",
    /** "Close" */
    close = "close",
    /** Label for a carpool arrangement's name's field */
    carpoolArrangementNameLabel = "carpoolArrangementNameLabel",
    /** Heading for the "Suggested Departure" heading in a printout of a carpool arrangement */
    carpoolArrangementPrintedDepartureHeading = "carpoolArrangementPrintedDepartureHeading",
    /** Heading for the "Driver" heading in a printout of a carpool arrangement */
    carpoolArrangementPrintedDriverHeading = "carpoolArrangementPrintedDriverHeading",
    /** `title` attribute for the `<iframe>` that displays a preview of a printout of a carpool arrangement */
    carpoolArrangementPrintedFrameTitle = "carpoolArrangementPrintedFrameTitle",
    /** Heading for the "Passengers" heading in a printout of a carpool arrangement */
    carpoolArrangementPrintedPassengersHeading = "carpoolArrangementPrintedPassengersHeading",
    /** Tooltip for a button to edit a car's departure time */
    carpoolEditDepartureTime = "carpoolEditDepartureTime",
    /** Tooltip when the user hovers over a dancer's departure time that is after the carpool's departure time */
    carpoolLeavesBeforeOccupantCan = "carpoolLeavesBeforeOccupantCan",
    /** Tooltip when the user hovers over a carpool's departure time that is before a dancer's departure time */
    carpoolLeavesBeforeOneOfOccupantsCan = "carpoolLeavesBeforeOneOfOccupantsCan",
    /** Text or title for any button that makes carpools automatically */
    carpoolsGenerate = "carpoolsGenerate",
    /** Text for the body of a confirmation dialog for making carpools automatically */
    carpoolsGenerateConfirm = "carpoolsGenerateConfirm",
    /** Text that indicates that carpools are being made automatically */
    carpoolsGenerateProgress = "carpoolsGenerateProgress",
    /** Text that appears when no carpool arrangements have been created */
    carpoolsZero = "carpoolsZero",
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
    /** Label for a dancer's carpool participation field and for an icon that indicates that the dancer can drive */
    dancerCanDriveCarpool = "dancerCanDriveCarpool",
    /** Label for an icon that indicates that the dancer can drive if needed */
    dancerCanDriveCarpoolIfNeeded = "dancerCanDriveCarpoolIfNeeded",
    /** Label for the number of people that the driver can transport, including themselves */
    dancerCanDriveMaxPeople = "dancerCanDriveMaxPeople",
    /** Label for the earliest time that a dancer can depart for the competition */
    dancerEarliestPossibleDeparture = "dancerEarliestPossibleDeparture",
    /** Label for a dancer's name field */
    dancerName = "dancerName",
    /** Tooltip for a dancer's name */
    dancerNameTooltip = "dancerNameTooltip",
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
    /** A \n-delimited string of future development for this application */
    developmentRoadmap = "developmentRoadmap",
    /** Label for a button that lets the user export a CSV file */
    exportCSV = "exportCSV",
    /** Label for a button that unloads all data and starts fresh */
    fileNew = "fileNew",
    /** A prompt for confirmation before clearing all data */
    fileNewConfirm = "fileNewConfirm",
    /** Label for a button that lets the user import a CSV file */
    importCSV = "importCSV",
    /**
     * General instructions to the user on using this application, with paragraphs are separated by \n and placeholders
     * for links to other pages denoted with their message ID like `{navCarpools}` or `{navDancers}`
     */
    instructions = "instructions",
    /** Alt text for the logo at the top */
    logoAlt = "logoAlt",
    /** ARIA label for a menu */
    menu = "menu",
    /** The name of the home page */
    navHome = "navHome",
    /** The name of the Dancers page */
    navDancers = "navDancers",
    /** The name of the Carpools page */
    navCarpools = "navCarpools",
    /** "No" */
    no = "no",
    /** Placeholder for when a date is missing */
    noDate = "noDate",
    /** Placeholder for when a time is missing */
    noTime = "noTime",
    /** Label for a button that prints something */
    print = "print",
    /** Label for the text field that lets the user set the session name */
    sessionNameFieldLabel = "sessionNameFieldLabel",
    /** Label for a button that sorts something */
    sort = "sort",
    /** Label for an option to sort something in ascending order */
    sortAsc = "sortAsc",
    /** Label for a field that selects by what property some items are sorted */
    sortBy = "sortBy",
    /** Label for an option to sort something in descending order */
    sortDesc = "sortDesc",
    /** Label for a field that selects whether something is sorted in ascending or descending order */
    sortOrder = "sortOrder",
    /** "Toggle Dark Mode" */
    toggleDarkMode = "toggleDarkMode",
    /** A placeholder name for anything that doesn't have a name */
    untitled = "untitled",
    /** "Yes" */
    yes = "yes",
    /** "Yes, if needed" */
    yesIfNeeded = "yesIfNeeded",
    /** A banner that explains future changes to the Carpools page */
    zCarpoolsFuture = "zCarpoolsFuture",
    /** A banner that explains future changes to the Dancers page */
    zDancersFuture = "zDancersFuture",
}

type ForEach<T extends string, V> = {
    [key in T]: V;
};

type Messages = ForEach<Locales, ForEach<MessageID, string>>;

export const MESSAGES: Messages = {
    [Locales.ENGLISH]: {
        appName: "Away",
        appNameForTitle: "{pageTitle} - BBDT Away",
        cancel: "Cancel",
        close: "Close",
        carpoolArrangementNameLabel: "Description",
        carpoolArrangementPrintedDepartureHeading: "Suggested Departure",
        carpoolArrangementPrintedDriverHeading: "Driver",
        carpoolArrangementPrintedFrameTitle: "Carpools Printed",
        carpoolArrangementPrintedPassengersHeading: "Passengers",
        carpoolEditDepartureTime: "Edit Departure Time",
        carpoolLeavesBeforeOccupantCan: "The car leaves before this dancer can.",
        carpoolLeavesBeforeOneOfOccupantsCan: "This car leaves before one of the dancers can.",
        carpoolsGenerate: "Generate Carpools",
        carpoolsGenerateConfirm: "Carpools will now be generated automatically. This may take a few minutes.",
        carpoolsGenerateProgress: "Generating carpools\u2026",
        carpoolsZero: "No carpools have been arranged yet.",
        dancerAccommodation: "Housing preference",
        dancerAccommodationFreeHousingPreferred: "Free housing preferred",
        dancerAccommodationHotelPreferred: "Hotel preferred",
        dancerAccommodationNoPreference: "Any housing",
        dancerAccommodationSameGender: "Prefers same-gender housing",
        dancerAccommodationStayingOnOwn: "Not staying with team",
        dancerCanDriveCarpool: "Can drive",
        dancerCanDriveCarpoolIfNeeded: "Can drive if needed",
        dancerCanDriveMaxPeople: "Max people (including driver)",
        dancerEarliestPossibleDeparture: "Earliest possible departure",
        dancerGender: "Gender",
        dancerGenderFemale: "Female",
        dancerGenderMale: "Male",
        dancerGenderOther: "Other",
        dancerName: "Name",
        dancerNameTooltip: "Name: {name}",
        dancersAdd: "Add Dancer",
        dancerTravelingOnOwn: "Not traveling with team",
        delete: "Delete",
        developmentRoadmap: "Some features are planned for the future:\nPartner matching\nHousing arranging\nLetting you manually edit carpools\nLetting you save all data for one competition to a single file\nWarning you, after carpools are generated automatically, if some passengers could not be paired with drivers",
        exportCSV: "Export CSV",
        fileNew: "New Session",
        fileNewConfirm: "Are you sure that you want to start a new session? This will discard all data!",
        importCSV: "Import CSV",
        instructions: "The purpose of this tool is to help a collegiate ballroom dance team organize travel to other teams\u2019 competitions. Head to the {navDancers} page to input dancers. Then, go to the {navCarpools} page and click \u201cGenerate Carpools\u201d to put them into carpools automatically.",
        logoAlt: "BBDT Logo",
        menu: "Menu",
        navHome: "Home",
        navDancers: "Dancers",
        navCarpools: "Carpools",
        no: "No",
        noDate: "No Date",
        noTime: "No Time",
        print: "Print",
        sessionNameFieldLabel: "Competition Name",
        sort: "Sort",
        sortAsc: "Ascending",
        sortBy: "Sort by",
        sortDesc: "Descending",
        sortOrder: "Order",
        toggleDarkMode: "Toggle Dark Mode",
        untitled: "Untitled",
        yes: "Yes",
        yesIfNeeded: "Yes, if needed",
        zCarpoolsFuture: "In the future, you will be able to edit carpools manually.",
        zDancersFuture: "In the future, you will be able to edit multiple dancers at once, to change more fields via keyboard, and to undo deleting a dancer.",
    },
};

export type EnumToMessageID<T extends string> = ForEach<T, MessageID>;
