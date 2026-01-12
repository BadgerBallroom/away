import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppNavigationPage } from "./AppNavigation";
import { FabZoomerFabProps } from "./FabZoomerProps";
import { usePageContext } from "./PageContext";

/**
 * Gathers properties for the floating action button from all pages.
 * @returns A map from each page's path to its properties for its floating action button
 */
export function useFabRenderInfo(): Map<AppNavigationPage["path"], FabZoomerFabProps> {
    const pageContext = usePageContext();
    const location = useLocation();

    const [result, setResult] = useState(() => new Map<AppNavigationPage["path"], FabZoomerFabProps>());
    useEffect(() => {
        pageContext.registerFABDisplayer(fab => {
            const newResult = new Map(result);
            newResult.set(location.pathname, fab);
            setResult(newResult);
        });
        return () => pageContext.registerFABDisplayer(null);
    }, [pageContext, result, location.pathname]);

    return result;
}

/**
 * Displays the current page's floating action button.
 * @param props The current page's properties for its floating action button
 */
export function useFabForPage(factory: () => FabZoomerFabProps, deps: React.DependencyList): void {
    const pageContext = usePageContext();
    const props = useMemo(factory, deps); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        pageContext.displayFAB(props);
    }, [pageContext, props]);
}
