import { Theme } from "@mui/material/styles";

export namespace SelectionColors {
    /**
     * The color of the outline of an element that appears upon hover.
     *
     * @argument theme The current theme
     */
    export function hover(theme: Theme): string {
        const darkMode = theme.palette.mode === "dark";
        return darkMode ? "#fff" : "rgba(0, 0, 0, 0.87)";
    }
}

export default SelectionColors;
