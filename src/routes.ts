import { redirect, resolvePath, RouteObject } from "react-router-dom";
import { MessageID } from "./i18n/messages";

export interface Handle {
    /** The message ID of the page title */
    titleMessageID: MessageID;
}

/** The application's routes */
const routes: RouteObject[] = [
    {
        index: true,
        lazy: async () => import("./pages/HomePage"),
        handle: {
            titleMessageID: MessageID.navHome,
        },
    },
    {
        path: "dancers",
        lazy: () => import("./pages/DancersPage"),
        handle: {
            titleMessageID: MessageID.navDancers,
        },
    },
    {
        path: "carpools",
        lazy: () => import("./pages/CarpoolsPage"),
        handle: {
            titleMessageID: MessageID.navCarpools,
        },
    },
    {
        path: "*",
        loader: () => redirect("/"),
    },
];

export default routes;

export function getPath(route: RouteObject): RouteObject["path"] {
    return route.index ? "/" : route.path;
}

export function getAbsolutePath(route: RouteObject): RouteObject["path"] {
    const path = getPath(route);
    if (!path) {
        return undefined;
    }
    return resolvePath(path).pathname;
}

/**
 * Builds a map from each route's `titleMessageID` to its `path`.
 * @returns The map
 */
export function getMessageIDsToPaths(): Record<MessageID, string> {
    const result = {} as Record<MessageID, string>;
    for (const route of routes) {
        const handle = route.handle as Handle | undefined;
        if (!handle) {
            continue;
        }

        const path = getPath(route);
        if (!path) {
            continue;
        }

        result[handle.titleMessageID] = path;
    }
    return result;
}
