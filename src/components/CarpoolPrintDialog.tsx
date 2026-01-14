import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useCallback, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { FormattedMessage, useIntl } from "react-intl";
import { MessageID } from "../i18n/messages";
import CarpoolArrangementState from "../model/CarpoolArrangementState";
import CarpoolState from "../model/CarpoolState";
import DancerState from "../model/DancerState";
import { useDeepState } from "../model/DeepStateHooks";
import { ID } from "../model/KeyListAndMap";
import { useSession } from "../model/SessionHooks";
import IFrame from "./IFrame";

interface CarpoolPrintDialogFromIDProps {
    /** The ID of the `CarpoolArrangement` to print */
    arrangementID: ID | null | undefined;
    /** A callback for when the dialog closes */
    onClose?: () => void;
}

export const CarpoolPrintDialogFromID: React.FC<CarpoolPrintDialogFromIDProps> = ({ arrangementID, onClose }) => {
    const session = useSession();
    const carpoolArrangementKLMState = session.getChildState("carpoolArrangements");

    return <CarpoolPrintDialog
        arrangementState={arrangementID && carpoolArrangementKLMState.map.getChildState(arrangementID)}
        onClose={onClose}
    />;
};

interface CarpoolPrintDialogProps {
    /** The carpools to print */
    arrangementState: CarpoolArrangementState | "" | null | undefined;
    /** A callback for when the dialog closes */
    onClose?: () => void;
}

const IFRAME_STYLE: React.CSSProperties = {
    // Always make the background white, regardless of dark mode.
    background: "#fff",
    // The `Dialog` has a `flex-direction` of `column`. Grow to fill the available height.
    flexGrow: 1,
};

const CarpoolPrintDialog: React.FC<CarpoolPrintDialogProps> = ({ arrangementState, onClose }) => {
    const intl = useIntl();
    useHotkeys("Esc, C", () => onClose && onClose());

    const [iframeContentWindow, setIFrameContentWindow] = useState<Window | null>(null);
    const onPrint = useCallback(() => iframeContentWindow?.print(), [iframeContentWindow]);

    return <Dialog open={!!arrangementState} fullScreen>
        <AppBar position="relative">
            <Toolbar>
                <Typography sx={TITLE_SX}>
                    <FormattedMessage id={MessageID.print} />
                </Typography>
                <Button autoFocus onClick={onPrint}>
                    <FormattedMessage id={MessageID.print} />
                </Button>
                <Button onClick={onClose}>
                    <FormattedMessage id={MessageID.cancel} />
                </Button>
            </Toolbar>
        </AppBar>
        {arrangementState && <IFrame
            title={intl.formatMessage({ id: MessageID.carpoolArrangementPrintedFrameTitle })}
            setContentWindow={setIFrameContentWindow}
            head={
                <style type="text/css">{`
                    body {
                        margin: 18pt;
                    }

                    table {
                        border-collapse: collapse;
                    }

                    th, td {
                        padding: 2pt 4pt;
                        text-align: left;
                        vertical-align: top;
                        border: 1pt solid #000;
                        color: #000;
                    }

                    .time {
                        text-align: right;
                    }
                `}</style>
            }
            style={IFRAME_STYLE}
        >
            <CarpoolArrangementPrinted state={arrangementState} />
        </IFrame>}
    </Dialog>;
};

export default CarpoolPrintDialog;

const TITLE_SX = { flex: 1 } as const;

interface CarpoolArrangementPrintedProps {
    /** The carpools to print */
    state: CarpoolArrangementState;
}

const CarpoolArrangementPrinted: React.FC<CarpoolArrangementPrintedProps> = ({ state: arrangementState }) => {
    const session = useSession();
    const sessionName = useDeepState(session, ["name"]);
    const arrangement = useDeepState(arrangementState, []);

    return <>
        <h1>{sessionName}</h1>
        <h2>{arrangement.name}</h2>
        <table>
            <thead>
                <tr>
                    <th className="time">
                        <FormattedMessage id={MessageID.carpoolArrangementPrintedDepartureHeading} />
                    </th>
                    <th><FormattedMessage id={MessageID.carpoolArrangementPrintedDriverHeading} /></th>
                    <th><FormattedMessage id={MessageID.carpoolArrangementPrintedPassengersHeading} /></th>
                </tr>
            </thead>
            <tbody>
                {arrangementState.getCarpoolStatesOrderedByDeparture().map(
                    carpoolState => <CarpoolPrinted key={carpoolState.evanescentID} state={carpoolState} />,
                )}
            </tbody>
        </table>
    </>;
    // TODO: unassigned dancers
};

interface CarpoolPrintedProps {
    /** The carpool to print */
    state: CarpoolState;
}

const CarpoolPrinted: React.FC<CarpoolPrintedProps> = ({ state }) => {
    const departure = useDeepState(state, ["departure"]);
    const dancerStates = state.getChildState("occupants").getReferencedStates();
    if (!dancerStates.length) {
        return null;
    }

    return <tr>
        <td className="time">{departure?.format("LLL")}</td>
        <td><DancerPrinted state={dancerStates.shift()!} /></td>
        <td>{dancerStates.map(dancerState =>
            <div key={dancerState.evanescentID}><DancerPrinted state={dancerState} /></div>,
        )}</td>
    </tr>;
};

interface DancerPrintedProps {
    /** The dancer to print */
    state: DancerState;
}

const DancerPrinted: React.FC<DancerPrintedProps> = ({ state }) => {
    const name = useDeepState(state, ["name"]);
    return <>{name}</>;
};
