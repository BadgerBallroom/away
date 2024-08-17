import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Grid from "@mui/material/Grid";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import { useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { MessageID } from "../i18n/messages";
import Dancer from "../model/Dancer";
import { DancerListState } from "../model/DancerKLM";

const ID_LABEL_SORT_BY = "label-sort-property";
const SORT_BY_OPTIONS = [
    ["name", MessageID.dancerName],
    ["canDriveCarpool", MessageID.dancerCanDriveCarpool],
    ["canDriveMaxPeople", MessageID.dancerCanDriveMaxPeople],
    ["earliestPossibleDeparture", MessageID.dancerEarliestPossibleDeparture],
    ["accommodation", MessageID.dancerAccommodation],
    ["prefersSameGender", MessageID.dancerAccommodationSameGender],
    ["gender", MessageID.dancerGender],
] as const;

const ID_LABEL_SORT_ORDER = "label-sort-order";

interface DancerSortDialogProps {
    open: boolean;
    onClose: () => void;
    toSort: DancerListState;
}

/** This dialog presents options for sorting dancers and then sorts the dancers. */
const DancerSortDialog: React.FC<DancerSortDialogProps> = ({ open, onClose, toSort }) => {
    const intl = useIntl();

    const [by, setBy] = useState<keyof Dancer>("name");
    const onByChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setBy(event.target.value as keyof Dancer);
    }, []);

    const [descending, setDescending] = useState(false);
    const onOrderChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setDescending(event.target.value !== "false");
    }, []);

    const onAccept = useCallback(() => {
        toSort.sortDancers(by, intl.locale, descending);
        onClose();
    }, [by, intl, descending, toSort, onClose]);

    return <Dialog open={open} onClose={onClose}>
        <DialogTitle>
            <FormattedMessage id={MessageID.sort} />
        </DialogTitle>
        <DialogContent>
            <Grid container>
                <Grid item>
                    <FormControl>
                        <FormLabel id={ID_LABEL_SORT_BY}>
                            <FormattedMessage id={MessageID.sortBy} />
                        </FormLabel>
                        <RadioGroup
                            name="radio-property"
                            aria-labelledby={ID_LABEL_SORT_BY}
                            value={by}
                            onChange={onByChange}
                        >
                            {SORT_BY_OPTIONS.map(([value, labelMessageID]) =>
                                <FormControlLabel
                                    key={value}
                                    value={value}
                                    control={<Radio />}
                                    label={intl.formatMessage({ id: labelMessageID })}
                                />
                            )}
                        </RadioGroup>
                    </FormControl>
                </Grid>
                <Grid item>
                    <FormControl>
                        <FormLabel id={ID_LABEL_SORT_ORDER}>
                            <FormattedMessage id={MessageID.sortOrder} />
                        </FormLabel>
                        <RadioGroup
                            name="radio-order"
                            aria-labelledby={ID_LABEL_SORT_ORDER}
                            value={descending}
                            onChange={onOrderChange}
                        >
                            <FormControlLabel
                                value={"false"}
                                control={<Radio />}
                                label={intl.formatMessage({ id: MessageID.sortAsc })}
                            />
                            <FormControlLabel
                                value={"true"}
                                control={<Radio />}
                                label={intl.formatMessage({ id: MessageID.sortDesc })}
                            />
                        </RadioGroup>
                    </FormControl>
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button onClick={onAccept} autoFocus>
                <FormattedMessage id={MessageID.sort} />
            </Button>
            <Button onClick={onClose}>
                <FormattedMessage id={MessageID.cancel} />
            </Button>
        </DialogActions>
    </Dialog>;
};

export default DancerSortDialog;
