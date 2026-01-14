import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { FormattedMessage } from "react-intl";
import { MessageID } from "../i18n/messages";
import CarpoolState from "../model/CarpoolState";
import DancerTile, { DancerTilePlaceholder } from "./DancerTile";
import DancerTileContainer from "./DancerTileContainer";

interface CarpoolContainerContainerProps {
    carpoolState: CarpoolState;
}

const CAR_HEADING_SX = { padding: "0 5px" } as const;

export const CarpoolContainerContainer: React.FC<CarpoolContainerContainerProps> = ({
    carpoolState,
}) => {
    const dancerStates = carpoolState.getChildState("occupants").getReferencedStates();

    const carCapacity = dancerStates[0].getChildValue("canDriveMaxPeople");
    const emptySeats: string[] = [];
    for (let i = dancerStates.length; i < carCapacity; ++i) {
        emptySeats.push(`${dancerStates[0].evanescentID} empty ${i}`);
    }

    return <CarpoolContainerContainerBox>
        <CarpoolContainer variant="outlined">
            <Box textAlign="center" sx={CAR_HEADING_SX}>
                <div><DirectionsCarIcon /></div>
                <div><Typography variant="body2">{
                    carpoolState.getChildValue("departure")?.format("LT")
                    ?? <FormattedMessage id={MessageID.noTime} />
                }</Typography></div>
            </Box>
            {dancerStates.map(dancerState => {
                return <DancerTileContainer key={dancerState.evanescentID}>
                    <DancerTile dancerState={dancerState} elevation={3} />
                </DancerTileContainer>;
            })}
            {emptySeats.map(key => {
                return <DancerTileContainer key={key}>
                    <DancerTilePlaceholder />
                </DancerTileContainer>;
            })}
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
