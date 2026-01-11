import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EditIcon from '@mui/icons-material/Edit';
import WarningIcon from '@mui/icons-material/Warning';
import Box from "@mui/material/Box";
import Button from '@mui/material/Button';
import Paper from "@mui/material/Paper";
import { styled } from '@mui/material/styles';
import dayjs from 'dayjs';
import { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from "react-intl";
import { MessageID } from "../i18n/messages";
import CarpoolState from '../model/CarpoolState';
import { useDeepState } from '../model/DeepStateHooks';
import { ShowCarpoolDeparturePopover } from './CarpoolDeparturePopover';
import DancerTile, { DancerTilePlaceholder } from './DancerTile';
import DancerTileContainer, { DANCER_TILE_HORIZONTAL_NAVIGATION_ANCESTOR_CLASSNAME } from './DancerTileContainer';

interface CarpoolContainerContainerProps {
    carpoolState: CarpoolState;
    showCarpoolDepartureDialog: ShowCarpoolDeparturePopover;
}

const CAR_HEADING_SX = { padding: "0 5px" } as const;
const CARPOOL_DEPARTURE_TIME_SX = { whiteSpace: "nowrap" } as const;

export const CarpoolContainerContainer: React.FC<CarpoolContainerContainerProps> = ({
    carpoolState,
    showCarpoolDepartureDialog,
}) => {
    const intl = useIntl();

    const carpoolDepartureTime = useDeepState(carpoolState, ["departure"]);
    const dancerStates = carpoolState.getChildState("occupants").getReferencedStates();

    const carCapacity = dancerStates[0].getChildValue("canDriveMaxPeople");
    const emptySeats: string[] = [];
    for (let i = dancerStates.length; i < carCapacity; ++i) {
        emptySeats.push(`${dancerStates[0].evanescentID} empty ${i}`);
    }

    // If the car departs too early for at least one occupant, this is the earliest time that would accommodate all
    // occupants. Otherwise, it is null.
    const suggestedDepartureTime = useMemo(() => {
        if (!carpoolDepartureTime) {
            return null;
        }

        let earliestAccommodatingDeparture = dayjs(0);
        for (const dancerState of dancerStates) {
            const dancerDeparture = dancerState.getChildValue("earliestPossibleDeparture");
            if (dancerDeparture?.isAfter(earliestAccommodatingDeparture)) {
                earliestAccommodatingDeparture = dancerDeparture;
            }
        }

        return carpoolDepartureTime.isBefore(earliestAccommodatingDeparture) ? earliestAccommodatingDeparture : null;
    }, [carpoolDepartureTime, dancerStates]);

    const onEditDepartureTimeClick = useCallback(() => {
        showCarpoolDepartureDialog({ carpoolState, suggestedDepartureTime });
    }, [carpoolState, suggestedDepartureTime, showCarpoolDepartureDialog]);

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
                            : MessageID.carpoolEditDepartureTime
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
            {dancerStates.map(dancerState =>
                <DancerTileContainer key={dancerState.evanescentID}>
                    <DancerTile dancerState={dancerState} carpoolDepartureTime={carpoolDepartureTime} elevation={3} />
                </DancerTileContainer>
            )}
            {emptySeats.map(key =>
                <DancerTileContainer key={key}>
                    <DancerTilePlaceholder />
                </DancerTileContainer>
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
