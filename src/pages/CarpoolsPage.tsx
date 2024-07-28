import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import CarpoolArrangementSelector from "../components/CarpoolArrangementSelector";
import { CarpoolArrangerFromID } from "../components/CarpoolArranger";
import CarpoolMakerProgressDialog from "../components/CarpoolMakerProgressDialog";
import WorkspaceWithToolbar from "../components/WorkspaceWithToolbar";
import ZeroState from "../components/ZeroState";
import { MessageID } from "../i18n/messages";
import CarpoolArrangementState from "../model/CarpoolArrangementState";
import { CarpoolMakerMessage, CarpoolMakerProgress } from "../model/CarpoolMakerMessage";
import { useDeepState } from "../model/DeepStateHooks";
import { ID } from "../model/KeyListAndMap";
import { useDancerListState, useSession } from "../model/SessionHooks";

interface CarpoolsPageProps {
    hideAutoGen?: boolean;
}

const CarpoolsPage: React.FC<CarpoolsPageProps> = ({ hideAutoGen }) => {
    const session = useSession();

    const carpoolArrangementKLMState = session.getChildState("carpoolArrangements");
    const carpoolArrangementList: ID[] = useDeepState(carpoolArrangementKLMState, ["list"]);
    const [selectedCarpoolArrangement, setSelectedCarpoolArrangement] = useState(() => {
        if (carpoolArrangementList.length) {
            const id = carpoolArrangementList[0];
            if (carpoolArrangementKLMState.map.getChildState(id)) {
                return id;
            }
        }
        return "";
    });

    const [carpoolMakerProgress, setCarpoolMakerProgress] = useState<CarpoolMakerProgress | null>(null);

    const handleFinishedCarpools = useCallback((carpoolStrings: string[]) => {
        let shouldSetSelection = true;
        for (const s of carpoolStrings) {
            const id = carpoolArrangementKLMState.add(CarpoolArrangementState.fromString(session, s)).id;
            if (shouldSetSelection) {
                shouldSetSelection = false;
                setSelectedCarpoolArrangement(id);
            }
        }
        window.scrollTo(0, 0);
    }, [session, carpoolArrangementKLMState]);

    const carpoolMaker = useRef<Worker>();
    useEffect(() => {
        carpoolMaker.current = makeCarpoolMaker(setCarpoolMakerProgress, handleFinishedCarpools);
        return () => carpoolMaker.current?.terminate();
    }, [handleFinishedCarpools]);

    const onCancelMakingCarpools = useCallback(() => {
        carpoolMaker.current?.terminate();
        carpoolMaker.current = makeCarpoolMaker(setCarpoolMakerProgress, handleFinishedCarpools);

        setCarpoolMakerProgress(null);
    }, [carpoolMaker, handleFinishedCarpools]);

    const onConfirmMakingCarpools = useCallback(() => {
        if (!carpoolMaker.current) {
            return;
        }

        // Immediately display the progress dialog so that the user can't switch away before the first progres update.
        setCarpoolMakerProgress(CarpoolMakerProgress.DEFAULT);

        carpoolMaker.current.postMessage(CarpoolMakerMessage.create("makeCarpools", session.toString()));
    }, [carpoolMaker, session]);

    return <WorkspaceWithToolbar
        toolbarChildren={<>
            {!hideAutoGen &&
                <GenerateCarpoolsButton onConfirm={onConfirmMakingCarpools} />
            }
        </>}
    >
        <CarpoolMakerProgressDialog carpoolMakerProgress={carpoolMakerProgress} onCancel={onCancelMakingCarpools} />
        {carpoolArrangementList.length ? <>
            <CarpoolArrangementSelector value={selectedCarpoolArrangement} onChange={setSelectedCarpoolArrangement} />
            <CarpoolArrangerFromID arrangementID={selectedCarpoolArrangement} />
        </> : <ZeroState><FormattedMessage id={MessageID.carpoolsZero} /></ZeroState>}
    </WorkspaceWithToolbar>;
};

export default CarpoolsPage;

/** Starts the carpool maker in a new thread. */
function makeCarpoolMaker(
    setCarpoolMakerProgress: (value: React.SetStateAction<CarpoolMakerProgress | null>) => void,
    handleFinishedCarpools: (carpoolStrings: string[]) => void,
): Worker {
    const carpoolMaker = new Worker(new URL("../workers/carpoolMaker.ts", import.meta.url));
    carpoolMaker.onmessage = (e: MessageEvent<CarpoolMakerMessage>) => {
        switch (e.data.command) {
            case "handleProgressUpdate":
                setCarpoolMakerProgress((e.data as CarpoolMakerMessage<"handleProgressUpdate">).payload);
                break;
            case "handleMadeCarpools":
                setCarpoolMakerProgress(null);
                handleFinishedCarpools((e.data as CarpoolMakerMessage<"handleMadeCarpools">).payload);
                break;
        }
    };
    return carpoolMaker;
}

interface GenerateCarpoolsButtonProps {
    onConfirm: () => void;
}

/** A button for starting the carpool maker. Displays a confirmation dialog. */
const GenerateCarpoolsButton: React.FC<GenerateCarpoolsButtonProps> = ({ onConfirm }) => {
    const dancerListState = useDancerListState();
    const [showConfirmation, setShowConfirmation] = useState(false);

    const onButtonClick = useCallback(() => {
        setShowConfirmation(true);
    }, []);

    const onCancel = useCallback(() => {
        setShowConfirmation(false);
    }, []);

    const onConfirmClick = useCallback(() => {
        setShowConfirmation(false);
        onConfirm();
    }, [onConfirm]);

    return <>
        <Button
            onClick={onButtonClick}
            disabled={!dancerListState.length}
            startIcon={<AutoFixHighIcon />}
        >
            <FormattedMessage id={MessageID.carpoolsGenerate} />
        </Button>
        <Dialog
            open={showConfirmation}
            onClose={onCancel}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle><FormattedMessage id={MessageID.carpoolsGenerate} /></DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    <FormattedMessage id={MessageID.carpoolsGenerateConfirm} />
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onConfirmClick} autoFocus><FormattedMessage id={MessageID.carpoolsGenerate} /></Button>
                <Button onClick={onCancel}><FormattedMessage id={MessageID.cancel} /></Button>
            </DialogActions>
        </Dialog>
    </>;
};
