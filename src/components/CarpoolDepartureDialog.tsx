import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Popover from '@mui/material/Popover';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { Dayjs } from "dayjs";
import { useCallback, useLayoutEffect, useState } from "react";
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

    // When the departure time is changed, the rerendering can cause the old `anchorEl` to be replaced by another
    // element with the same ID. Save the last known position and use it when `anchorEl` cannot be used for positioning.
    const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | null>(null);
    useLayoutEffect(() => {
        const anchorEl = document.getElementById(`carpool-${carpoolState.evanescentID}-departure-time`);
        if (anchorEl) {
            const anchorRect = anchorEl.getBoundingClientRect();

            let offsetTop = 0;
            if (anchorPosition) {
                // If `anchorEl` has moved on the screen, attempt to scroll the window so that `anchorEl` is back where
                // it was. `anchorPosition.top` is the previous `anchorRect.bottom`, so the amount to scroll is the
                // difference between `anchorPosition.top` and the new `anchorRect.bottom`.
                let newScrollY = window.scrollY - anchorPosition.top + anchorRect.bottom;
                const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
                if (newScrollY < 0) {
                    newScrollY = 0;
                } else if (newScrollY > maxScrollY) {
                    newScrollY = maxScrollY;
                }
                offsetTop = window.scrollY - newScrollY;

                window.scrollTo({ top: newScrollY, behavior: "instant" });
            }

            setAnchorPosition({
                top: anchorRect.bottom + offsetTop,
                left: anchorRect.left + anchorRect.width / 2,
            });
        }
    }, [value, carpoolState.evanescentID]);

    const onChange = useCallback((newValue: Dayjs | null) => {
        carpoolState.setDescendantValue(["departure"], newValue);
    }, [carpoolState]);

    return <Popover
        open={!!anchorPosition}
        anchorPosition={anchorPosition ?? undefined}
        anchorReference="anchorPosition"
        onClose={onClose}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
        }}
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
    </Popover>;
};
