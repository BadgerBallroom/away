import arraysEqual from "../arraysEqual";

/** A simple class that compares whether two strings are equal except for their line endings. */
export class MultilineString {
    private _lines: string[];

    /**
     * Compares whether two multi-line strings are equal except for their line endings
     * @param s The string to split into lines
     */
    constructor(s: string | string[]) {
        this._lines = Array.isArray(s) ? s : MultilineString.splitLines(s);
    }

    /**
     * Compares whether this multi-line string is equal to another multi-line string
     * @param other The other string
     * @returns Whether the two strings are equal except for their line endings
     */
    public equals(other: string | MultilineString): boolean {
        if (typeof other === "string") {
            other = new MultilineString(other);
        }

        return arraysEqual(this._lines, other._lines);
    }

    /** Splits a string by line endings (`\r\n` or just `\n`) */
    private static splitLines(s: string): string[] {
        return s.split(/\r?\n/);
    }
}

/** A custom Jest matcher that compares whether two multi-line strings are equal, except for their line endings. */
export default function areMultilineStringsEqual(a: unknown, b: unknown): boolean | undefined {
    let multilineString: MultilineString;
    let other: unknown;
    if (a instanceof MultilineString) {
        multilineString = a;
        other = b;
    } else if (b instanceof MultilineString) {
        other = a;
        multilineString = b;
    } else {
        return undefined;
    }

    if (typeof other === "string" || other instanceof MultilineString) {
        return multilineString.equals(other);
    }

    return undefined;
}
