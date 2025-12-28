/** Provides a comparison function `enum` values. */
export default class EnumCollator<E> {
    private _enumToNumber = new Map<E | "", number>();

    /**
     * Provides a comparison function for `Array.prototype.sort` that will cause `enum` values to be sorted in the
     * given order. If the array to be sorted contains a value that was not specified here, that value will be put at
     * the end of the array. If the array to be sorted contains an empty string, it will be sorted to the beginning of
     * the array. For example, given this enum:
     *
     *  ```
     *  enum Foo { Bar, Baz, Qux, Quux }
     *  ```
     *
     * If you construct an `EnumCollator` as follows:
     *
     *  ```
     *  const collator = new EnumCollator([Foo.Qux, Foo.Bar, Foo.Baz]);
     *  ```
     *
     * You could then sort an array of `Foo` values as follows:
     *
     *  ```
     *  const foos = [Foo.Quux, Foo.Baz, Foo.Qux];
     *  foos.sort(collator.compare);
     *  // Result: [Foo.Qux, Foo.Baz, Foo.Quux]
     *  ```
     *
     * @param enumOrder The order in which the enum values should be sorted
     */
    constructor(enumOrder: E[]) {
        this._enumToNumber.set("", -1);
        enumOrder.forEach((value, index) => this._enumToNumber.set(value, index));
    }

    /** The function to pass to `Array.prototype.sort` */
    public comparator = (a: E | "", b: E | ""): number => {
        const ordA = this._enumToNumber.get(a) ?? this._enumToNumber.size;
        const ordB = this._enumToNumber.get(b) ?? this._enumToNumber.size;
        return ordA - ordB;
    };
}
