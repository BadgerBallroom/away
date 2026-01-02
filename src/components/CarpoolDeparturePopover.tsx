import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { Dayjs } from "dayjs";
import { useCallback, useLayoutEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { MessageID } from "../i18n/messages";
import CarpoolState from "../model/CarpoolState";
import { useDeepState } from "../model/DeepStateHooks";

export interface ShowCarpoolDeparturePopover {
    (props: Omit<CarpoolDeparturePopoverProps, "onClose">): void;
}

export interface CarpoolDeparturePopoverProps {
    /** The state object that holds the date and time to edit (or `null` to hide the popover) */
    carpoolState: CarpoolState | null;
    /** A callback that sets `valueState` to `null` */
    onClose: () => void;
}

/** A popup that lets the user edit the departure time of a car. */
const CarpoolDeparturePopover: React.FC<CarpoolDeparturePopoverProps> = ({ carpoolState, ...props }) => {
    if (carpoolState === null) {
        return null;
    }

    return <CarpoolDeparturePopoverInner carpoolState={carpoolState} {...props} />;
};

export default CarpoolDeparturePopover;

interface CarpoolDeparturePopoverInnerProps extends Omit<CarpoolDeparturePopoverProps, "carpoolStage"> {
    carpoolState: CarpoolState;
}

/** The actual contents of the popup. This is a separate component because we cannot conditionally call hooks. */
const CarpoolDeparturePopoverInner: React.FC<CarpoolDeparturePopoverInnerProps> = ({
    carpoolState,
    onClose,
}) => {
    const value = useDeepState(carpoolState, ["departure"]);

    // When the departure time is changed, the rerendering can cause the old `anchorEl` to be replaced by another
    // element with the same ID. Save the last known position and use it when `anchorEl` cannot be used for positioning.
    const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | null>(null);
    useLayoutEffect(() => {
        const anchorEl = document.getElementById(`carpool-${carpoolState.evanescentID}-departure-time`);
        if (anchorEl) {
            const anchorRect = anchorEl.getBoundingClientRect();

            const top = anchorRect.bottom;
            const left = anchorRect.left + anchorRect.width / 2;

            if (!anchorPosition
                || Math.abs(top - anchorPosition.top) >= 1
                || Math.abs(left - anchorPosition.left) >= 1) {
                setAnchorPosition({ top, left });
            }
        }
    }, [value, anchorPosition, carpoolState.evanescentID]);

    const onChange = useCallback((newValue: Dayjs | null) => {
        carpoolState.setDescendantValue(["departure"], newValue);
    }, [carpoolState]);

    return <Popover
        open={!!anchorPosition}
        anchorPosition={anchorPosition ?? undefined}
        anchorReference="anchorPosition"
        onClose={onClose}
        transformOrigin={TRANSFORM_ORIGIN}
    >
        <DialogTitle>
            <FormattedMessage id={MessageID.carpoolEditDepartureTime} />
        </DialogTitle>
        <DialogContent>
            <Stack spacing={1}>
                {/* Note: `autoFocus` seems not to work with Strict Mode enabled. It works in the production build. */}
                <DateTimePicker
                    value={value}
                    onChange={onChange}
                    autoFocus
                />
            </Stack>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}><FormattedMessage id={MessageID.close} /></Button>
        </DialogActions>
    </Popover>;
};

const TRANSFORM_ORIGIN = {
    vertical: "top",
    horizontal: "center",
} as const;
