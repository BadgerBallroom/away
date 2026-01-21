import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import EditIcon from "@mui/icons-material/Edit";
import WarningIcon from "@mui/icons-material/Warning";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";
import { Dayjs } from "dayjs";
import { useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { MessageID } from "../i18n/messages";
import CarpoolState from "../model/CarpoolState";
import { CanDriveCarpool } from "../model/Dancer";
import { DancerState } from "../model/DancerState";
import { useDeepState, useDeepStateChangeListener } from "../model/DeepStateHooks";
import { ID } from "../model/KeyListAndMap";
import { ShowCarpoolDeparturePopover } from "./CarpoolDeparturePopover";
import DancerTile, { DancerTilePlaceholder } from "./DancerTile";
import DancerTileContainer, { DANCER_TILE_HORIZONTAL_NAVIGATION_ANCESTOR_CLASSNAME, ShouldSelectDancer } from "./DancerTileContainer";

/**
 * A callback that gets called when a dancer is clicked, before it is selected.
 * @param event The event that triggered this
 * @param ref The `DancerTileContainer`'s HTML element
 * @param carpoolState The carpool state
 * @returns A Promise that resolves to `false` to cancel the selection change (or `true` to allow it)
 */
export interface ShouldSelectDancerInCarpool {
    (
        event: React.KeyboardEvent | React.MouseEvent,
        ref: HTMLElement | undefined,
        carpoolState: CarpoolState,
    ): Promise<boolean>;
}

interface CarpoolContainerContainerProps {
    carpoolState: CarpoolState;
    shouldSelectDancer: ShouldSelectDancer;
    showCarpoolDeparturePopover: ShowCarpoolDeparturePopover;
}

const CAR_HEADING_SX = { padding: "0 5px" } as const;
const CARPOOL_DEPARTURE_TIME_SX = { whiteSpace: "nowrap" } as const;

export const CarpoolContainerContainer: React.FC<CarpoolContainerContainerProps> = ({
    carpoolState,
    shouldSelectDancer,
    showCarpoolDeparturePopover,
}) => {
    const intl = useIntl();

    const carpoolDepartureTime = useDeepState(carpoolState, ["departure"]);
    const dancerIDsAndStates = carpoolState.getChildState("occupants").getIDsAndReferencedStates();

    // If the car departs too early for at least one occupant, this is the earliest time that would accommodate all
    // occupants. Otherwise, it is null.
    const [suggestedDepartureTime, setSuggestedDepartureTime] =
        useState<Dayjs | null>(carpoolState.getSuggestedDepartureTime());
    useDeepStateChangeListener(carpoolState, () => {
        setSuggestedDepartureTime(carpoolState.getSuggestedDepartureTime());
    });

    const onEditDepartureTimeClick = useCallback(() => {
        showCarpoolDeparturePopover({ carpoolState, suggestedDepartureTime });
    }, [carpoolState, suggestedDepartureTime, showCarpoolDeparturePopover]);

    if (dancerIDsAndStates.length === 0) {
        return null;
    }

    const { id: driverDancerID, state: driverDancerState } = dancerIDsAndStates[0];
    const canDriveCarpool = driverDancerState.getChildValue("canDriveCarpool");
    const carHasDriver = canDriveCarpool === CanDriveCarpool.Yes || canDriveCarpool === CanDriveCarpool.YesIfNeeded;
    const carCapacity = carHasDriver ? driverDancerState.getChildValue("canDriveMaxPeople") : 0;
    const driverName = driverDancerState.getChildValue("name");
    const overCapacity = dancerIDsAndStates.length > carCapacity;

    const renderDancer = ({ id, state: dancerState }: { id: ID; state: DancerState; }) => (
        <DancerTileContainer
            key={dancerState.evanescentID}
            shouldSelect={shouldSelectDancer}
            data-dancer-id={id}
        >
            <DancerTile dancerState={dancerState} carpoolDepartureTime={carpoolDepartureTime} elevation={3} />
        </DancerTileContainer>
    );

    const emptySeats: number[] = [];
    for (let i = dancerIDsAndStates.length; i < carCapacity; ++i) {
        emptySeats.push(i);
    }

    return <CarpoolContainerContainerBox>
        <CarpoolContainer variant="outlined" className={DANCER_TILE_HORIZONTAL_NAVIGATION_ANCESTOR_CLASSNAME}>
            <Box textAlign="center" sx={CAR_HEADING_SX}>
                <div><DirectionsCarIcon /></div>
                <Button
                    id={`carpool-${carpoolState.evanescentID}-departure-time`}
                    color={suggestedDepartureTime ? "warning" : "inherit"}
                    variant="outlined"
                    endIcon={suggestedDepartureTime ? <WarningIcon /> : <EditIcon />}
                    title={intl.formatMessage({
                        id: suggestedDepartureTime
                            ? MessageID.carpoolLeavesBeforeOneOfOccupantsCan
                            : MessageID.carpoolEditDepartureTime,
                    })}
                    onClick={onEditDepartureTimeClick}
                    sx={CARPOOL_DEPARTURE_TIME_SX}
                >
                    {
                        carpoolDepartureTime?.format("LT")
                        ?? <FormattedMessage id={MessageID.noTime} />
                    }
                </Button>
            </Box>
            {renderDancer(dancerIDsAndStates[0])}
            {carHasDriver ?
                <Chip
                    label={carCapacity.toString(10)}
                    color={overCapacity ? "warning" : "success"}
                    title={intl.formatMessage({ id: MessageID.carpoolCapacity }, { driverName, carCapacity })}
                    sx={CHIP_SX}
                /> :
                <Box title={intl.formatMessage({ id: MessageID.carpoolDriverCannotDrive }, { driverName })}>
                    <WarningIcon fontSize="large" color="warning" />
                </Box>
            }
            {dancerIDsAndStates.slice(1, carHasDriver ? carCapacity : undefined).map(renderDancer)}
            {carHasDriver && overCapacity && <>
                <Box title={intl.formatMessage({ id: MessageID.carpoolCapacityExceeded }, { carCapacity })}>
                    <WarningIcon fontSize="large" color="warning" />
                </Box>
                {dancerIDsAndStates.slice(carCapacity).map(renderDancer)}
            </>}
            {emptySeats.map((key, index) =>
                <DancerTileContainer
                    key={key}
                    title={intl.formatMessage({ id: MessageID.carpoolEmptySeatTitle }, {
                        index: index + 1,
                        count: emptySeats.length,
                        name: dancerIDsAndStates[0].state.getChildValue("name"),
                    })}
                    shouldSelect={shouldSelectDancer}
                    data-driver-dancer-id={driverDancerID}
                >
                    <DancerTilePlaceholder />
                </DancerTileContainer>,
            )}
        </CarpoolContainer>
    </CarpoolContainerContainerBox>;
};

const CarpoolContainerContainerBox = styled(Box)({ display: "block", margin: "10px" });

function getBorderColor(theme: { palette: { mode: string } }): "#fff" | "#000" {
    return theme.palette.mode === "dark" ? "#fff" : "#000";
}

const CarpoolContainer = styled(Paper)(({ theme }) => ({
    display: "inline-flex",
    flexWrap: "nowrap",
    padding: "2px",
    alignItems: "center",
    borderColor: getBorderColor(theme),
}));

const CHIP_SX = { cursor: "default" } as const;
