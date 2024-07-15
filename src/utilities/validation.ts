import dayjs from "dayjs";

/**
 * Tries to parse a value into an `enum`.
 * @param enumObject An `enum` that is not `const`
 * @param value A value that might be a valid value in `enumObject`
 * @returns The value in `enumObject` that equals `value` if it is found, else `""`
 */
export function validateEnumValue<E extends object>(enumObject: E, value: any): E[keyof E] | "" {
    let key: keyof E;
    for (key in enumObject) {
        if (value === enumObject[key]) {
            return enumObject[key];
        }
    }

    return "";
}

/**
 * Tries to parse a value into a `Dayjs` instance.
 * @param newValue A value to parse into a `Dayjs` instance
 * @returns The `Dayjs` instance if it is valid, else `null`
 */
export function validateDayjsValue(newValue: dayjs.ConfigType): dayjs.Dayjs | null {
    const result = dayjs(newValue);
    if (result.isValid()) {
        return result;
    }
    return null;
}
