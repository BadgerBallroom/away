export { };

interface ExpectExtension {
    addEqualityTesters: (testers: ((a: any, b: any) => boolean | undefined)[]) => void;
}

declare global {
    namespace jest {
        interface Expect extends ExpectExtension { }
    }
}
