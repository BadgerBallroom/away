import {
    unstable_useNumberInput as useNumberInput,
    UseNumberInputParameters,
} from '@mui/base/unstable_useNumberInput';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { styled } from '@mui/material/styles';
import { unstable_useForkRef as useForkRef } from '@mui/utils';
import * as React from 'react';
import { useIntl } from 'react-intl';
import { MessageID } from '../i18n/messages';

interface NumberFieldProps extends NumberInputProps {
    id: string;
    labelMessageID: MessageID;
}

const NumericField = React.forwardRef(function NumericField(
    { id, labelMessageID, ...props }: NumberFieldProps,
    ref: React.ForwardedRef<HTMLDivElement>,
) {
    const intl = useIntl();

    const idInputLabel = `${id}-label`;
    const label = intl.formatMessage({ id: labelMessageID });

    return <FormControl ref={ref}>
        <InputLabel id={idInputLabel} htmlFor={id} shrink>{label}</InputLabel>
        <NumberInput id={id} label={label} {...props} />
    </FormControl>;
});

export default NumericField;

const enum ClassNames {
    focused = "focused",
    incrementButton = "increment",
    decrementButton = "decrement",
}

type NumberInputProps = UseNumberInputParameters & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">;

// Hopefully, when https://github.com/mui/material-ui/issues/19154 is fixed, this NumberInput, which was adapted from
// the example at https://mui.com/base-ui/react-number-input/#hook, can be replaced with MUI's built-in implementation.
export const NumberInput = React.forwardRef(function NumberInput(
    { label, ...props }: NumberInputProps & { label: string },
    ref: React.ForwardedRef<HTMLInputElement>,
) {
    const {
        getRootProps,
        getInputProps,
        getIncrementButtonProps,
        getDecrementButtonProps,
        focused,
    } = useNumberInput(props);

    const inputProps = getInputProps();

    // Make sure that both the forwarded ref and the ref returned from the getInputProps are applied on the input element
    inputProps.ref = useForkRef(inputProps.ref, ref);

    return <StyledDiv {...getRootProps()} className={focused ? ClassNames.focused : undefined}>
        <StyledButton {...getIncrementButtonProps()} className={ClassNames.incrementButton}>
            {"\u25b4"}
        </StyledButton>
        <StyledButton {...getDecrementButtonProps()} className={ClassNames.decrementButton}>
            {"\u25be"}
        </StyledButton>
        <StyledInput {...inputProps} />
        <StyledFieldset aria-hidden="true">
            <StyledLegend>
                <span>{label}</span>
            </StyledLegend>
        </StyledFieldset>
    </StyledDiv>;
});

const StyledDiv = styled("div")(({ theme }) => {
    const darkMode = theme.palette.mode === "dark";

    return `
        font-family: "Roboto", "Helvetica", "Arial", sans-serif;
        font-weight: 400;
        font-size: 1rem;
        line-height: 1.4375em;
        letter-spacing: 0.00938em;
        color: ${darkMode ? "#fff" : "rgba(0, 0, 0, 0.87)"};
        box-sizing: border-box;
        position: relative;
        cursor: text;
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        position: relative;
        border-radius: 4px;

        display: grid;
        grid-template-columns: 1fr 19px;
        grid-template-rows: 1fr 1fr;
        overflow: hidden;
        column-gap: 8px;
        padding: 4px;

        &:focus-visible {
            outline: 0;
        }

        & > fieldset {
            border: 1px solid ${darkMode ? "rgba(255, 255, 255, 0.23)" : "rgba(0, 0, 0, 0.23)"};
        }

        &:hover > fieldset {
            border-color: ${darkMode ? "#fff" : "rgba(0, 0, 0, 0.87)"};
        }

        &.${ClassNames.focused} > fieldset {
            border: 2px solid ${theme.palette.primary.main};
        }
    `;
});

const StyledInput = styled("input")(`
    font: inherit;
    letter-spacing: inherit;
    color: currentColor;
    padding: 4px 0 5px;
    border: 0;
    box-sizing: content-box;
    background: none;
    height: 1.4375em;
    margin: 0;
    -webkit-tap-highlight-color: transparent;
    display: block;
    min-width: 0;
    width: 100%;
    -webkit-animation-name: mui-auto-fill-cancel;
    animation-name: mui-auto-fill-cancel;
    -webkit-animation-duration: 10ms;
    animation-duration: 10ms;

    outline: 0;
    line-height: 1.5;
    grid-column: 1 / 2;
    grid-row: 1 / 3;
    background: inherit;
    border: none;
    border-radius: inherit;
    padding: 8px 0 8px 8px;
    outline: 0;
`);

const StyledButton = styled("button")(`
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    align-items: center;
    appearance: none;
    padding: 0;
    width: 19px;
    height: 19px;
    cursor: pointer;

    &.${ClassNames.incrementButton} {
        grid-column: 2 / 3;
        grid-row: 1 / 2;
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
        border: 1px solid;
        border-bottom: 0;
        margin-bottom: -1px;
    }

    &.${ClassNames.decrementButton} {
        grid-column: 2 / 3;
        grid-row: 2 / 3;
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
        border: 1px solid;
    }
`);

const StyledFieldset = styled("fieldset")(({ theme }) => `
    text-align: left;
    position: absolute;
    bottom: 0;
    right: 0;
    top: -5px;
    left: 0;
    margin: 0;
    padding: 0 8px;
    pointer-events: none;
    border-radius: inherit;
    border-style: solid;
    border-width: 1px;
    overflow: hidden;
    min-width: 0%;
    border-color: rgba(255, 255, 255, 0.23);
`);

const StyledLegend = styled("legend")(`
    float: unset;
    width: auto;
    overflow: hidden;
    display: block;
    padding: 0;
    height: 11px;
    font-size: 0.75em;
    visibility: hidden;
    max-width: 100%;
    white-space: nowrap;

    & > span {
        padding-left: 5px;
        padding-right: 5px;
        display: inline-block;
        opacity: 0;
        visibility: visible;
    }
`);
