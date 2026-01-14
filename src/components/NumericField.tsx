/* eslint-disable @stylistic/max-len */
import { NumberField } from "@base-ui/react/number-field";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import * as React from "react";
import { useIntl } from "react-intl";
import { MessageID } from "../i18n/messages";

interface NumericFieldProps extends React.ComponentProps<typeof NumberField.Root> {
    id: string;
    labelMessageID: MessageID;
}

const NumericField = React.forwardRef<HTMLDivElement, NumericFieldProps>(function NumericField(
    { id, labelMessageID, className, ...props },
    ref
) {
    const intl = useIntl();
    const label = intl.formatMessage({ id: labelMessageID });

    return (
        <div className={`relative mt-2 ${className || ""}`}>
            <label
                htmlFor={id}
                className="absolute -top-2 left-2 z-10 px-1 text-xs text-gray-500 transition-colors group-focus-within:text-blue-500 dark:text-gray-400"
            >
                {label}
            </label>
            <NumberField.Root
                ref={ref}
                id={id}
                {...props}
                className="group grid grid-cols-[1fr_32px] grid-rows-2 w-full rounded-md text-[inherit]"
            >
                <fieldset
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -top-2.5 z-0 rounded-md border border-gray-400/50 px-1.5 transition-all group-focus-within:border-2 group-focus-within:border-blue-500 dark:border-white/30"
                >
                    <legend className="invisible w-auto px-1 text-xs">
                        <span>{label}</span>
                    </legend>
                </fieldset>
                <NumberField.Input
                    className="z-10 row-span-2 w-full bg-transparent px-3 py-2 text-base outline-none tabular-nums text-[inherit] placeholder:opacity-0"
                />
                <NumberField.Increment className="z-10 flex items-center justify-center border-l border-b border-gray-400/30 bg-transparent hover:bg-black/5 active:bg-black/10 disabled:opacity-30 cursor-pointer text-[inherit] dark:border-white/30 dark:hover:bg-white/10">
                    <ArrowDropUpIcon fontSize="small" className="scale-125 opacity-70" />
                </NumberField.Increment>
                <NumberField.Decrement className="z-10 flex items-center justify-center border-l border-gray-400/30 bg-transparent hover:bg-black/5 active:bg-black/10 disabled:opacity-30 cursor-pointer text-[inherit] dark:border-white/30 dark:hover:bg-white/10">
                    <ArrowDropDownIcon fontSize="small" className="scale-125 opacity-70" />
                </NumberField.Decrement>
            </NumberField.Root>
        </div>
    );
});

export default NumericField;
