import Box from "@mui/material/Box";
import CircularProgress from '@mui/material/CircularProgress';
import { Suspense, useEffect } from "react";
import { useIntl } from "react-intl";
import { Outlet, UIMatch, useMatches } from "react-router-dom";
import { MessageID } from "../i18n/messages";
import { Handle } from "../routes";
import AppNavigation from './AppNavigation';
import DarkModeButton from './DarkModeButton';
import FabRenderer from "./FabRenderer";
import { usePageContext } from "./PageContext";

/**
 * Displays an `AppNavigation` and gives the page enough padding to clear it.
 * Adds the specified page title to `document.title` when rendered.
 */
const PageContent: React.FC = () => {
    const intl = useIntl();

    const { toggleThemeMode } = usePageContext();

    const matches = useMatches() as UIMatch<unknown, Handle>[];
    const currentHandle = matches[matches.length - 1]?.handle;

    const titleMessageID = currentHandle?.titleMessageID;
    useEffect(() => {
        document.title = intl.formatMessage({ id: MessageID.appNameForTitle }, {
            pageTitle: intl.formatMessage({ id: titleMessageID }),
        });
    }, [intl, titleMessageID]);

    return <>
        <AppNavigation
            drawerFooter={
                <Box>
                    <DarkModeButton onClick={toggleThemeMode} />
                </Box>
            }
        />
        <Box paddingTop={6}>
            <Suspense fallback={<Loading />}>
                <Outlet />
            </Suspense>
        </Box>
        <FabRenderer />
    </>;
};

export default PageContent;

const Loading: React.FC = () => {
    return <Box marginTop={5} marginLeft={5}><CircularProgress /></Box>;
};
