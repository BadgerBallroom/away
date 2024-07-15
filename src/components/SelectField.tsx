import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import React from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { MessageID } from "../i18n/messages";

interface SelectFieldProps<T> {
    id: string;
    value: T | "";
    onChange: (event: SelectChangeEvent) => void;
    labelMessageID: MessageID;
    options: {
        value: T;
        messageID: MessageID;
    }[];
}

/** Displays a drop-down menu and lets the user choose one option. */
const SelectField = React.forwardRef(function SelectField<T extends string>(
    { id, value, onChange, labelMessageID, options }: SelectFieldProps<T>,
    ref: React.ForwardedRef<HTMLDivElement>
) {
    const intl = useIntl();

    const idInputLabel = `${id}-label`;
    const label = intl.formatMessage({ id: labelMessageID });

    return <FormControl ref={ref}>
        <InputLabel id={idInputLabel} htmlFor={id}>{label}</InputLabel>
        <Select
            id={id}
            value={value}
            label={label}
            labelId={idInputLabel}
            onChange={onChange}
        >
            {options.map(option => (
                <MenuItem key={option.value} value={option.value}>
                    <FormattedMessage id={option.messageID} />
                </MenuItem>
            ))}
        </Select>
    </FormControl>;
});

export default SelectField;
