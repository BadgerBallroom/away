import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";

interface WorkspaceWithToolbarProps {
    /** Content to put in the toolbar */
    toolbarChildren?: React.ReactNode;
    /** Content to put below the toolbar */
    children?: React.ReactNode;
}

/**
 * Puts content in a fixed toolbar above other content.
 * Adds enough `padding-top` so that the other content starts below the toolbar.
 */
const WorkspaceWithToolbar: React.FC<WorkspaceWithToolbarProps> = ({ toolbarChildren, children }) => {
    return <>
        <AppBar position="fixed" color="default" sx={{ marginTop: 6 }}>
            <Toolbar>{toolbarChildren}</Toolbar>
        </AppBar>
        <Box paddingTop={8}>{children}</Box>
    </>;
};

export default WorkspaceWithToolbar;
