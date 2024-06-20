import Box from "@mui/material/Box";
import React from "react";

interface ZeroStateProps {
    show?: boolean;
    children: React.ReactNode;
}

/** Centers a message in large text in the middle of the screen. */
const ZeroState: React.FC<ZeroStateProps> = ({ show, children }) => {
    if (show === false) {
        return null;
    }

    return <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="calc(100vh - 160px)"
        color="GrayText"
        fontSize="32px"
    >
        {children}
    </Box>;
};

export default ZeroState;
