import Box from "@mui/material/Box";
import { useEffect } from "react";
import { useIntl } from "react-intl";
import { MessageID } from "../i18n/messages";

interface PageContentProps {
    /** The message ID of the page title */
    titleMessageID: MessageID;
    /** The page content */
    children: React.ReactNode;
}

/**
 * Wraps the page content in a `Box` with enough `padding-top` to clear `AppNavigation`.
 * Adds the specified page title to `document.title` when rendered.
 */
const PageContent: React.FC<PageContentProps> = ({ titleMessageID, children }) => {
    const intl = useIntl();

    useEffect(() => {
        document.title = intl.formatMessage({ id: MessageID.appNameForTitle }, {
            pageTitle: intl.formatMessage({ id: titleMessageID }),
        });
    }, [intl, titleMessageID]);

    // Padding is used instead of margin to avoid margin collapse.
    return <Box paddingTop={6}>{children}</Box>;
}

export default PageContent;
