import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import React, { useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Link as RouterLink } from "react-router-dom";
import { MessageID } from "../i18n/messages";
import logo from "../logo.svg";
import { getMessageIDsToPaths } from "../routes";

export function Component() {
    return <HomePage />;
}

const Paragraph = styled(Typography)({ marginBottom: "1rem" });

const HomePage: React.FC = () => {
    const intl = useIntl();

    const pages = getMessageIDsToPaths();

    const NavLink: React.FC<{ to: MessageID }> = useCallback(
        ({ to }) => <Link component={RouterLink} to={pages[to]}><FormattedMessage id={to} /></Link>,
        [pages]
    );

    // Format the instructions:
    // - Split every line of text into a separate paragraph.
    // - Replace placeholders like `{navCarpools}` with links to pages.
    const instructionsRaw = intl.formatMessage({ id: MessageID.instructions });
    const instructions = useMemo(() => instructionsRaw.split("\n").map(
        paragraphRaw => <Paragraph key={paragraphRaw}>{
            paragraphRaw.split(/(\{navCarpools\}|\{navDancers\})/).map(
                textOrPlaceholder => {
                    switch (textOrPlaceholder) {
                        case "{navCarpools}":
                            return <NavLink to={MessageID.navCarpools} key="navCarpools" />;
                        case "{navDancers}":
                            return <NavLink to={MessageID.navDancers} key="navDancers" />;
                        default:
                            return textOrPlaceholder;
                    }
                }
            )
        }</Paragraph>
    ), [instructionsRaw, NavLink]);

    // Format the development roadmap:
    // - Wrap the first line in a paragraph.
    // - Wrap each of the other lines in an unordered list.
    const developmentRoadmapRaw = intl.formatMessage({ id: MessageID.developmentRoadmap });
    const developmentRoadmap = useMemo(() => {
        const lines = developmentRoadmapRaw.split("\n");
        return <>
            <Paragraph>{lines.shift()}</Paragraph>
            <List sx={{
                p: 0,
                pl: 2,
                listStyleType: "disc",
                "& .MuiListItem-root": {
                    display: "list-item",
                    paddingTop: 0,
                    paddingBottom: 0,
                },
            }}>{lines.map(line =>
                <ListItem key={line}>{line}</ListItem>
            )}</List>
        </>;
    }, [developmentRoadmapRaw]);

    return <Paper sx={{ m: 2, p: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <img src={logo} width={150} height={150} role="presentation" alt="" aria-hidden="true" />
            <Box sx={{ maxWidth: "md" }}>
                <Typography variant="h1"><FormattedMessage id={MessageID.appName} /></Typography>
                {instructions}
                {developmentRoadmap}
            </Box>
        </Stack>
    </Paper>;
};

export default HomePage;
