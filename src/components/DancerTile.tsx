import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import FemaleIcon from '@mui/icons-material/Female';
import MaleIcon from '@mui/icons-material/Male';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography, { TypographyOwnProps } from "@mui/material/Typography";
import { styled } from '@mui/material/styles';
import React from "react";
import { FormattedMessage } from "react-intl";
import { EnumToMessageID, MessageID } from "../i18n/messages";
import Dancer, { CanDriveCarpool, Gender } from "../model/Dancer";
import DancerState from "../model/DancerState";
import { useDeepState } from "../model/DeepStateHooks";
import { AccommodationMessageIDs } from "./DancerCard";
import TooltipI18N, { FormatArguments, TooltipPropsContextProvider } from "./TooltipI18N";

export const DANCER_TILE_WIDTH = 160;
export const DANCER_TILE_HEIGHT = 75;

const StyledPaper = styled(Paper)(`
    width: ${DANCER_TILE_WIDTH}px;
    height: ${DANCER_TILE_HEIGHT}px;
    padding: 5px 8px;
    transition: left .5s, top .5s;
`);

const StyledPaperDashed = styled(StyledPaper)({ borderStyle: "dashed" });

interface DancerTileProps {
    dancerState: DancerState;
    elevation?: number;
    sx?: any;
}

/** Displays one dancer's details in a compact layout. */
const DancerTile: React.FC<DancerTileProps> = ({ dancerState, elevation, sx }) => {
    const name = useDeepState(dancerState, ["name"]);
    const canDriveCarpool = useDeepState(dancerState, ["canDriveCarpool"]);
    const earliestPossibleDeparture = useDeepState(dancerState, ["earliestPossibleDeparture"]);
    const accommodation = useDeepState(dancerState, ["accommodation"]);
    const prefersSameGender = useDeepState(dancerState, ["prefersSameGender"]);
    const gender = useDeepState(dancerState, ["gender"]);

    return <TooltipPropsContextProvider disableInteractive>
        <StyledPaper elevation={elevation} sx={sx}>
            <TooltipPropsContextProvider placement="top">
                <LineOfText
                    variant="body1"
                    icon={<CanDriveCarpoolIcon canDriveCarpool={canDriveCarpool} />}
                    titleMessageID={MessageID.dancerNameTooltip}
                    titleFormatArgs={{ name }}
                >{name}</LineOfText>
            </TooltipPropsContextProvider>
            <TooltipPropsContextProvider placement="left">
                <LineOfText
                    titleMessageID={MessageID.dancerEarliestPossibleDeparture}
                >{earliestPossibleDeparture?.format("L LT")}</LineOfText>
            </TooltipPropsContextProvider>
            <TooltipPropsContextProvider placement="bottom">
                <LineOfText
                    icon={<>
                        <PrefersSameGenderIcon prefersSameGender={prefersSameGender} />
                        <GenderIcon gender={gender} />
                    </>}
                    titleMessageID={MessageID.dancerAccommodation}
                ><TextFromEnum valueMap={AccommodationMessageIDs} value={accommodation} /></LineOfText>
            </TooltipPropsContextProvider>
        </StyledPaper>
    </TooltipPropsContextProvider>;
};

export default DancerTile;

interface LineOfTextProps {
    variant?: TypographyOwnProps["variant"];
    icon?: React.ReactNode;
    children: React.ReactNode;
    titleMessageID?: MessageID;
    titleFormatArgs?: FormatArguments;
}

const FLEX_1 = { flex: 1 } as const;
const LineOfText: React.FC<LineOfTextProps> = ({ variant, icon, children, titleMessageID, titleFormatArgs }) => {
    let result = <Typography variant={variant ?? "body2"} noWrap sx={FLEX_1}>{children}</Typography>;

    if (titleMessageID) {
        result = <TooltipI18N messageID={titleMessageID} values={titleFormatArgs}>{result}</TooltipI18N>;
    }

    if (icon) {
        result = <Stack direction="row">{result}{icon}</Stack>;
    }

    return result;
};

interface TextFromEnumProps<E extends string, ValueMap extends EnumToMessageID<E> | undefined> {
    label?: MessageID;
    valueMap?: ValueMap;
    value: ValueMap extends undefined ? React.ReactNode : (E | "");
}

function TextFromEnum<E extends string, ValueMap extends EnumToMessageID<E> | undefined>(
    { label, valueMap, value }: TextFromEnumProps<E, ValueMap>
) {
    if (!value) {
        return null;
    }

    return <>
        {label && <><FormattedMessage id={label} />{": "}</>}
        {valueMap
            ? <FormattedMessage id={valueMap[value]} />
            : value
        }
    </>;
}

interface CanDriveCarpoolIconProps {
    canDriveCarpool: CanDriveCarpool | "";
}

const CanDriveCarpoolIcon: React.FC<CanDriveCarpoolIconProps> = ({ canDriveCarpool }) => {
    if (!Dancer.canDriveCarpool(canDriveCarpool)) {
        return null;
    }

    const messageID = canDriveCarpool === CanDriveCarpool.YesIfNeeded
        ? MessageID.dancerCanDriveCarpoolIfNeeded
        : MessageID.dancerCanDriveCarpool;

    return <TooltipI18N messageID={messageID}>
        <DirectionsCarIcon fontSize="small" />
    </TooltipI18N>;
};

interface PrefersSameGenderIconProps {
    prefersSameGender: boolean;
}

const PrefersSameGenderIcon: React.FC<PrefersSameGenderIconProps> = ({ prefersSameGender }) => {
    if (!prefersSameGender) {
        return null;
    }

    return <TooltipI18N messageID={MessageID.dancerAccommodationSameGender}>
        <PriorityHighIcon fontSize="small" />
    </TooltipI18N>;
};

interface GenderIconProps {
    gender: Gender | "";
}

const GenderIcon: React.FC<GenderIconProps> = ({ gender }) => {
    if (gender === Gender.Male) {
        return <TooltipI18N messageID={MessageID.dancerGenderMale}><MaleIcon fontSize="small" /></TooltipI18N>;
    }

    if (gender === Gender.Female) {
        return <TooltipI18N messageID={MessageID.dancerGenderFemale}><FemaleIcon fontSize="small" /></TooltipI18N>;
    }

    return null;
};

/** A dotted rectangle that represents a place that a dancer could go. */
export const DancerTilePlaceholder: React.FC = () => {
    return <StyledPaperDashed variant="outlined" />;
};
