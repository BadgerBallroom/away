import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";

interface SnackbarCloseButtonProps {
    onClick: () => void;
}

/** A button that closes a snackbar. */
const SnackbarCloseButton: React.FC<SnackbarCloseButtonProps> = ({ onClick }) => {
    return <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={onClick}
    >
        <CloseIcon />
    </IconButton>;
};

export default SnackbarCloseButton;
