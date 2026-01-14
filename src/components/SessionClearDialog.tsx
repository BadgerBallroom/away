import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { MessageID } from "../i18n/messages";
import { useSession } from "../model/SessionHooks";

interface SessionClearDialogProps {
    /** Whether the dialog should be showing */
    open: boolean;
    /** A callback that sets `open` to `false` */
    onClose: () => void;
}

/** A dialog that confirms that the user wants to clear the session and then clears it. */
const SessionClearDialog: React.FC<SessionClearDialogProps> = ({ open, onClose }) => {
    const session = useSession();
    const onClearSession = useCallback(() => {
        session.clear();
        session.saveToLocalStorage();
        location.reload();
    }, [session]);

    return <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        closeAfterTransition={false}
    >
        <DialogTitle><FormattedMessage id={MessageID.fileNew} /></DialogTitle>
        <DialogContent>
            <DialogContentText>
                <FormattedMessage id={MessageID.fileNewConfirm} />
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClearSession}><FormattedMessage id={MessageID.fileNew} /></Button>
            <Button onClick={onClose}><FormattedMessage id={MessageID.cancel} /></Button>
        </DialogActions>
    </Dialog>;
};

export default SessionClearDialog;
