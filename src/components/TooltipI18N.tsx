import Tooltip, { TooltipProps } from "@mui/material/Tooltip";
import { createContext, forwardRef, useContext, useMemo } from "react";
import { IntlFormatters, useIntl } from "react-intl";
import { MessageID } from "../i18n/messages";

type TooltipPropsContextValue = Omit<TooltipProps, "title" | "children">;

const TooltipPropsContext = createContext<TooltipPropsContextValue>({});

interface TooltipPropsContextProviderProps extends TooltipPropsContextValue {
    children: React.ReactNode;
}

/**
 * Like `TooltipPropsContext.Provider`, but if contexts are nested, properties that are not overridden by the child are
 * inherited from the parent.
 */
export const TooltipPropsContextProvider: React.FC<TooltipPropsContextProviderProps> = ({ children, ...props }) => {
    const parentProps = useContext(TooltipPropsContext);
    const combinedProps = useMemo(() => ({ ...parentProps, ...props }), [parentProps, props]);

    return <TooltipPropsContext.Provider value={combinedProps}>{children}</TooltipPropsContext.Provider>;
};

export type FormatArguments = Parameters<IntlFormatters<React.ReactNode>["formatMessage"]>[1];

export interface TooltipI18NProps extends Omit<TooltipProps, "title"> {
    /** The ID of the message to display in the tooltip */
    messageID: MessageID;
    /** Values to format into the message */
    values?: FormatArguments;
}

/**
 * Wraps an element in a `Tooltip`.
 * The `title` attribute is generated from the given message ID.
 * Attributes other than `title` and `children` will be retrieved from the `TooltipPropsContext` if it is present.
 */
const TooltipI18N = forwardRef(function TooltipI18N({ messageID, values, children, ...props }: TooltipI18NProps, ref) {
    const intl = useIntl();
    const contextProps = useContext(TooltipPropsContext);

    return <Tooltip
        ref={ref}
        title={intl.formatMessage({ id: messageID }, values)}
        {...contextProps}
        {...props}
    >{children}</Tooltip>;
});

export default TooltipI18N;
