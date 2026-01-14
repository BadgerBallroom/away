import { NumberFieldRootChangeEventDetails } from "@base-ui/react/number-field";
import Box from "@mui/material/Box";
import CardActions from "@mui/material/CardActions";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { styled } from "@mui/material/styles";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { Dayjs } from "dayjs";
import React, { useCallback, useMemo } from "react";
import { useIntl } from "react-intl";
import { EnumToMessageID, MessageID } from "../i18n/messages";
import Carpool from "../model/Carpool";
import { Accommodation, CanDriveCarpool, Gender } from "../model/Dancer";
import DancerState from "../model/DancerState";
import { useDeepState, useDeepStateChangeHandler, useDeepStateCheckChangeHandler } from "../model/DeepStateHooks";
import SelectionColors from "../utilities/SelectionColors";
import DeleteButton from "./DeleteButton";
import NumericField from "./NumericField";
import SelectField from "./SelectField";
import { useSkeletonOutOfView } from "./SkeletonOutOfView";

interface DancerFieldProps {
    /** An HTML/CSS ID for this card */
    id: string;
    /** The state object that holds the dancer's details, which the user will edit */
    dancerState: DancerState;
}

interface DancerCardProps extends DancerFieldProps {
    onDelete?: () => void;
    onSelect?: React.MouseEventHandler;
    selected?: boolean;
}

/** Allows the user to edit the details of one dancer. */
const DancerCard = React.forwardRef(function DancerCard(
    { id, dancerState, onDelete, onSelect, selected }: DancerCardProps,
    ref: React.ForwardedRef<HTMLDivElement>
) {
    const onClick = useCallback((event: React.MouseEvent) => {
        if (
            event.target instanceof HTMLElement
            && event.target.tagName === "DIV"
            && !event.target.classList.contains("MuiBackdrop-root")
        ) {
            onSelect!(event);
        }
    }, [onSelect]);

    return <DancerCardPaper
        id={id}
        ref={ref}
        onClick={onSelect ? onClick : undefined}
        className={selected ? "selected" : ""}
    >
        <Stack spacing={1}>
            <NameControl id={`${id}-name`} dancerState={dancerState} />
            <Group>
                <CanDriveCarpoolControl id={`${id}-can-drive-carpool`} dancerState={dancerState} />
                <CanDriveMaxPeopleControl id={`${id}-can-drive-max-people`} dancerState={dancerState} />
                <EarliestPossibleDepartureControl id={`${id}-earliest-possible-departure`} dancerState={dancerState} />
            </Group>
            <Group>
                <AccomdationControl id={`${id}-accomodation`} dancerState={dancerState} />
                <PrefersSameGenderControl id={`${id}-prefers-same-gender`} dancerState={dancerState} />
                <GenderControl id={`${id}-gender`} dancerState={dancerState} />
            </Group>
        </Stack>
        <CardActions>
            {onDelete &&
                <DeleteButton iconOnly onClick={onDelete} />
            }
        </CardActions>
    </DancerCardPaper>;
});

export default DancerCard;

const DancerCardPaper = styled(Paper)(({ theme }) => {
    const boxShadow = [
        "0 2px 1px -1px rgba(0, 0, 0, 0.2)",
        "0 1px 1px 0px rgba(0, 0, 0, 0.14)",
        "0 1px 3px 0px rgba(0, 0, 0, 0.12)"
    ].join(",");

    return `
        width: 292px;
        box-shadow: ${boxShadow};
        user-select: none;

        &:hover, &:focus-within {
            box-shadow: inset 0 0 0 1px ${SelectionColors.hover(theme)}, ${boxShadow};
        }

        &.selected {
            box-shadow: inset 0 0 0 3px ${SelectionColors.selected(theme)}, ${boxShadow};
        }
    `;
});

const NameControl: React.FC<DancerFieldProps> = ({ id, dancerState }) => {
    const intl = useIntl();
    const { ref, skeleton } = useSkeletonOutOfView("DancerCard_NameControl", { id: `${id}-skeleton` });

    const [value, onChange] = useDeepStateChangeHandler(dancerState, ["name"]);

    const sx = useMemo(() => ({
        ".MuiFormLabel-root": {
            "fontSize": "20px",
        },
        ".MuiInputBase-root": {
            "fontSize": "20px",
        },
    }), []);

    return skeleton ?? <TextField
        ref={ref}
        id={id}
        value={value}
        onChange={onChange}
        variant="filled"
        label={intl.formatMessage({ id: MessageID.dancerName })}
        sx={sx}
    />;
};

interface GroupProps {
    children?: React.ReactNode;
}

const Group: React.FC<GroupProps> = ({ children }) => {
    const sx = useMemo(() => ({ mx: 1, p: 1 }), []);
    return <Box>
        <Paper variant="outlined" sx={sx}>
            <Stack spacing={1}>{children}</Stack>
        </Paper>
    </Box>;
};

export const CanDriveCarpoolMessageIDs: EnumToMessageID<CanDriveCarpool> = {
    [CanDriveCarpool.No]: MessageID.no,
    [CanDriveCarpool.Yes]: MessageID.yes,
    [CanDriveCarpool.YesIfNeeded]: MessageID.yesIfNeeded,
    [CanDriveCarpool.TravelingOnOwn]: MessageID.dancerTravelingOnOwn,
} as const;

const CanDriveCarpoolControl: React.FC<DancerFieldProps> = ({ id, dancerState }) => {
    const { ref, skeleton } = useSkeletonOutOfView("DancerCard_CanDriveCarpoolControl");

    const [value, onChange] = useDeepStateChangeHandler(dancerState, ["canDriveCarpool"]);

    const options = useMemo(() => [
        CanDriveCarpool.No,
        CanDriveCarpool.Yes,
        CanDriveCarpool.YesIfNeeded,
        CanDriveCarpool.TravelingOnOwn,
    ].map(value => ({ value, messageID: CanDriveCarpoolMessageIDs[value] })), []);

    return skeleton ?? <SelectField
        ref={ref}
        id={id}
        value={value}
        onChange={onChange}
        labelMessageID={MessageID.dancerCanDriveCarpool}
        options={options}
    />;
};

const PATH_TO_CAN_DRIVE_MAX_PEOPLE = ["canDriveMaxPeople"] as const;
const CanDriveMaxPeopleControl: React.FC<DancerFieldProps> = ({ id, dancerState }) => {
    const { ref, skeleton } = useSkeletonOutOfView("DancerCard_CanDriveMaxPeopleControl");

    const value = useDeepState(dancerState, PATH_TO_CAN_DRIVE_MAX_PEOPLE);
    const onValueChange = useCallback(
        (
            value: number | null,
            _event: NumberFieldRootChangeEventDetails
        ) => dancerState.setDescendantValue(PATH_TO_CAN_DRIVE_MAX_PEOPLE, value ?? 0),
        [dancerState]
    );

    const shouldShow = DancerState.CanDriveMaxPeople.useShouldShow(dancerState);
    if (shouldShow) {
        return skeleton ?? <NumericField
            ref={ref}
            id={id}
            labelMessageID={MessageID.dancerCanDriveMaxPeople}
            value={value}
            onValueChange={onValueChange}
            min={Carpool.MIN_DANCERS}
        />;
    }

    return null;
};

const PATH_TO_EARLIEST_POSSIBLE_DEPARTURE = ["earliestPossibleDeparture"] as const;
const EarliestPossibleDepartureControl: React.FC<DancerFieldProps> = ({ dancerState }) => {
    const intl = useIntl();
    const { ref, skeleton } = useSkeletonOutOfView("DancerCard_EarliestPossibleDepartureControl");

    const value = useDeepState(dancerState, PATH_TO_EARLIEST_POSSIBLE_DEPARTURE);
    const onChange = useCallback((newValue: Dayjs | null) => {
        dancerState.setDescendantValue(PATH_TO_EARLIEST_POSSIBLE_DEPARTURE, newValue);
    }, [dancerState]);

    const slotProps = useMemo(() => ({
        textField: {
            label: intl.formatMessage({ id: MessageID.dancerEarliestPossibleDeparture })
        }
    }), [intl]);

    const shouldShow = DancerState.EarliestPossibleDeparture.useShouldShow(dancerState);
    if (shouldShow) {
        return skeleton ?? <DateTimePicker
            ref={ref}
            value={value}
            onChange={onChange}
            slotProps={slotProps}
        />;
    }

    return null;
};

export const AccommodationMessageIDs: EnumToMessageID<Accommodation> = {
    [Accommodation.NoPreference]: MessageID.dancerAccommodationNoPreference,
    [Accommodation.FreeHousingPreferred]: MessageID.dancerAccommodationFreeHousingPreferred,
    [Accommodation.HotelPreferred]: MessageID.dancerAccommodationHotelPreferred,
    [Accommodation.StayingOnOwn]: MessageID.dancerAccommodationStayingOnOwn,
} as const;

const AccomdationControl: React.FC<DancerFieldProps> = ({ id, dancerState }) => {
    const { ref, skeleton } = useSkeletonOutOfView("DancerCard_AccomdationControl");

    const [value, onChange] = useDeepStateChangeHandler(dancerState, ["accommodation"]);

    const options = useMemo(() => [
        Accommodation.NoPreference,
        Accommodation.FreeHousingPreferred,
        Accommodation.HotelPreferred,
        Accommodation.StayingOnOwn,
    ].map(value => ({ value, messageID: AccommodationMessageIDs[value] })), []);

    return skeleton ?? <SelectField
        ref={ref}
        id={id}
        value={value}
        onChange={onChange}
        labelMessageID={MessageID.dancerAccommodation}
        options={options}
    />;
};

const PrefersSameGenderControl: React.FC<DancerFieldProps> = ({ id, dancerState }) => {
    const intl = useIntl();
    const { ref, skeleton } = useSkeletonOutOfView("DancerCard_PrefersSameGenderControl");

    const [checked, onChange] = useDeepStateCheckChangeHandler(dancerState, ["prefersSameGender"]);

    const shouldShow = DancerState.PrefersSameGender.useShouldShow(dancerState);
    if (shouldShow) {
        return skeleton ?? <FormControlLabel
            ref={ref}
            control={<Checkbox id={id} checked={checked} onChange={onChange} />}
            label={intl.formatMessage({ id: MessageID.dancerAccommodationSameGender })}
        />;
    }

    return null;
};

export const GenderMessageIDs: EnumToMessageID<Gender> = {
    [Gender.Male]: MessageID.dancerGenderMale,
    [Gender.Female]: MessageID.dancerGenderFemale,
    [Gender.Other]: MessageID.dancerGenderOther,
} as const;

const GenderControl: React.FC<DancerFieldProps> = ({ id, dancerState }) => {
    const { ref, skeleton } = useSkeletonOutOfView("DancerCard_GenderControl");

    const [value, onChange] = useDeepStateChangeHandler(dancerState, ["gender"]);

    const options = useMemo(() => [
        Gender.Male,
        Gender.Female,
        Gender.Other,
    ].map(value => ({ value, messageID: GenderMessageIDs[value] })), []);

    return skeleton ?? <SelectField
        ref={ref}
        id={id}
        value={value}
        onChange={onChange}
        labelMessageID={MessageID.dancerGender}
        options={options}
    />;
};
