import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { FormattedMessage } from "react-intl";
import { MessageID } from "../i18n/messages";
import CarpoolArrangementState from "../model/CarpoolArrangementState";
import { CarpoolContainerContainer } from "./CarpoolArrangerCar";

const EVEN_ROW_SX = {} as const;
const ODD_ROW_SX = { bgcolor: "rgba(128, 128, 128, 0.2)" } as const;

interface CarpoolArrangerDayProps {
    carpoolsForDay: CarpoolArrangementState.CarpoolsForDay;
}

const CarpoolArrangerDay: React.FC<CarpoolArrangerDayProps> = ({
    carpoolsForDay,
}) => {
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
                            {carpoolsForHour.carpoolStates.map(carpoolState =>
                                <CarpoolContainerContainer
                                    key={carpoolState.evanescentID}
                                    carpoolState={carpoolState}
                                />,
                            )}
                        </ScheduleCell>
                    </ScheduleRow>,
                )}
            </ScheduleTable>
        </AccordionDetailsNoPadding>
    </Accordion>;
};

export default CarpoolArrangerDay;

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
