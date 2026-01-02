import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { Dayjs } from "dayjs";
import { useCallback } from "react";
import { FormattedMessage } from 'react-intl';
import { MessageID } from '../i18n/messages';
import CarpoolState from '../model/CarpoolState';
import { useDeepState } from '../model/DeepStateHooks';

export type SetCarpoolWhoseDepartureToEdit = React.Dispatch<React.SetStateAction<CarpoolState | null>>;

interface CarpoolDepartureDialogProps {
    /** The state object that holds the date and time to edit (or `null` to hide the dialog) */
    carpoolState: CarpoolState | null;
    /** A callback that sets `valueState` to `null` */
    onClose: () => void;
}

/** A popup that lets the user edit the departure time of a car. */
const CarpoolDepartureDialog: React.FC<CarpoolDepartureDialogProps> = ({ carpoolState, ...props }) => {
    if (carpoolState === null) {
        return null;
    }

    return <CarpoolDepartureDialogInner carpoolState={carpoolState} {...props} />;
};

export default CarpoolDepartureDialog;

interface CarpoolDepartureDialogInnerProps extends Omit<CarpoolDepartureDialogProps, "carpoolStage"> {
    carpoolState: CarpoolState;
}

/** The actual contents of the popup. This is a separate component because we cannot conditionally call hooks. */
const CarpoolDepartureDialogInner: React.FC<CarpoolDepartureDialogInnerProps> = ({ carpoolState, onClose }) => {
    const value = useDeepState(carpoolState, ["departure"]);
    const onChange = useCallback((newValue: Dayjs | null) => {
        carpoolState.setDescendantValue(["departure"], newValue);
    }, [carpoolState]);

    return <Dialog
        open={true}
        onClose={onClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        closeAfterTransition={false}
    >
        <DialogTitle>
            <FormattedMessage id={MessageID.carpoolEditDepartureTime} />
        </DialogTitle>
        <DialogContent>
            <DateTimePicker
                value={value}
                onChange={onChange}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}><FormattedMessage id={MessageID.close} /></Button>
        </DialogActions>
    </Dialog>;
};
