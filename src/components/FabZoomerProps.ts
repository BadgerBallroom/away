import { FabProps } from "@mui/material/Fab";
import { MessageID } from "../i18n/messages";

/** Information to display one page's floating action button */
export interface FabZoomerFabProps extends FabProps {
    titleID: MessageID;
}

/** A function that uses `props` to display the floating action button */
export interface FabDisplayer {
    (fab: FabZoomerFabProps): void;
}
