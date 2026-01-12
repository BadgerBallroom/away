import { createContext, useContext } from "react";
import { FabDisplayer } from "../components/FabZoomerProps";

export class PageContextValue {
    /** A callback to pass parameters to display the floating action button (FAB) */
    private _fabDisplayer: FabDisplayer | null = null;
    /** A buffer that stores parameters to display the floating action button while {@link _fabDisplayer} is `null` */
    private _fabDisplayQueue: Parameters<FabDisplayer>[] = [];

    // #region Floating Action Button
    /**
     * Registers a callback that gets called when a page passes parameters to display the floating action button.
     * @param displayer The callback (or `null` to unregister)
     */
    public registerFABDisplayer(displayer: FabDisplayer | null): void {
        this._fabDisplayer = displayer;
        if (this._fabDisplayer) {
            for (const props of this._fabDisplayQueue) {
                this._fabDisplayer(...props);
            }
            this._fabDisplayQueue = [];
        }
    }

    /**
     * Forwards parameters to display the floating action button to the callback that will display it.
     * @param props Parameters for the floating action button
     */
    public displayFAB(...props: Parameters<FabDisplayer>): void {
        if (this._fabDisplayer) {
            this._fabDisplayer(...props);
        } else {
            this._fabDisplayQueue.push(props);
        }
    }
    // #endregion
}

const PageContext = createContext(new PageContextValue());

export default PageContext;

export function usePageContext(): PageContextValue {
    return useContext(PageContext);
}
