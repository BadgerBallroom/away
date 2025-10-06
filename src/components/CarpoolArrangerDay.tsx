import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/system";
import { FormattedMessage } from "react-intl";
import { MessageID } from "../i18n/messages";
import CarpoolArrangementState from "../model/CarpoolArrangementState";
import DancerTile, { DancerTilePlaceholder } from './DancerTile';

const EVEN_ROW_SX = {} as const;
const ODD_ROW_SX = { bgcolor: "rgba(128, 128, 128, 0.2)" } as const;
const CAR_HEADING_SX = { padding: "0 5px" } as const;

interface CarpoolArrangerDayProps {
    carpoolsForDay: CarpoolArrangementState.CarpoolsForDay;
}

const CarpoolArrangerDay: React.FC<CarpoolArrangerDayProps> = ({ carpoolsForDay }) => {
    return <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            {carpoolsForDay.day?.format("LL") ?? <FormattedMessage id={MessageID.noDate} />}
        </AccordionSummary>
        <AccordionDetailsNoPadding>
            <ScheduleTable>
                {carpoolsForDay.carpoolsByHour.map((carpoolsForHour, hourIndex) =>
                    <ScheduleRow key={carpoolsForHour.hour?.valueOf()} sx={hourIndex % 2 ? ODD_ROW_SX : EVEN_ROW_SX}>
                        <ScheduleCell>
                            <Typography variant="body2" align="right">
                                {carpoolsForHour.hour?.format("LT") ?? <FormattedMessage id={MessageID.noTime} />}
                            </Typography>
                        </ScheduleCell>
                        <ScheduleCell>
                            {carpoolsForHour.carpoolStates.map(carpoolState => {
                                const dancerStates = carpoolState.getChildState("occupants").getReferencedStates();

                                const carCapacity = dancerStates[0].getChildValue("canDriveMaxPeople");
                                const emptySeats: string[] = [];
                                for (let i = dancerStates.length; i < carCapacity; ++i) {
                                    emptySeats.push(`${dancerStates[0].evanescentID} empty ${i}`);
                                }

                                return <CarpoolContainerContainer key={carpoolState.evanescentID}>
                                    <CarpoolContainer variant="outlined">
                                        <Box textAlign="center" sx={CAR_HEADING_SX}>
                                            <div><DirectionsCarIcon /></div>
                                            <div><Typography variant="body2">{
                                                carpoolState.getChildValue("departure")?.format("LT")
                                                ?? <FormattedMessage id={MessageID.noTime} />
                                            }</Typography></div>
                                        </Box>
                                        {dancerStates.map(dancerState =>
                                            <DancerTileContainer key={dancerState.evanescentID}>
                                                <DancerTile dancerState={dancerState} elevation={3} />
                                            </DancerTileContainer>
                                        )}
                                        {emptySeats.map(key =>
                                            <DancerTileContainer key={key}>
                                                <DancerTilePlaceholder />
                                            </DancerTileContainer>
                                        )}
                                    </CarpoolContainer>
                                </CarpoolContainerContainer>;
                            })}
                        </ScheduleCell>
                    </ScheduleRow>
                )}
            </ScheduleTable>
        </AccordionDetailsNoPadding>
    </Accordion>;
};

export default CarpoolArrangerDay;

function getBorderColor(theme: { palette: { mode: string } }): "#fff" | "#000" {
    return theme.palette.mode === "dark" ? "#fff" : "#000";
}

const AccordionDetailsNoPadding = styled(AccordionDetails)({ overflow: "auto", padding: "0" });
const ScheduleTable = styled(Box)({ display: "table", minWidth: "100%" });
const ScheduleRow = styled(Box)({ display: "table-row", minWidth: "100%" });
const ScheduleCell = styled(Box)(`
    display: table-cell;
    height: 50px;
    vertical-align: top;
    padding-right: 5px;

    :first-of-type {
        padding-top: 10px;
        padding-left: 5px;
    }
`);
const CarpoolContainerContainer = styled(Box)({ display: "block", margin: "10px" });
const CarpoolContainer = styled(Paper)(({ theme }) => ({
    display: "inline-flex",
    flexWrap: "nowrap",
    padding: "2px",
    alignItems: "center",
    borderColor: getBorderColor(theme),
}));
const DancerTileContainer = styled(Box)({ margin: 2 });
