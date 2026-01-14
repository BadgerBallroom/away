import DeleteIcon from "@mui/icons-material/Delete";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import React from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { MessageID } from "../i18n/messages";

export interface DeleteButtonProps {
    /** Whether to show the icon without text */
    iconOnly?: boolean;
    /** A function that is called when the button is clicked and that does the deleting. */
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}

/** A button that deletes something. The deletion should be handled by `onClick`. */
const DeleteButton: React.FC<DeleteButtonProps> = ({ iconOnly, onClick }) => {
    const intl = useIntl();

    if (iconOnly) {
        return <IconButton onClick={onClick} title={intl.formatMessage({ id: MessageID.delete })}>
            <DeleteIcon />
        </IconButton>;
    }

    return <Button startIcon={<DeleteIcon />} onClick={onClick}>
        <FormattedMessage id={MessageID.delete} />
    </Button>;
};

export default DeleteButton;
