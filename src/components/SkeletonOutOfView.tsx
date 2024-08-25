import Skeleton, { SkeletonProps } from "@mui/material/Skeleton";
import { IntersectionOptions, useInView } from "react-intersection-observer";

interface Size {
    width: number;
    height: number;
}

const measurements = new Map<string, Size>();

export default interface SkeletonOutOfView {
    /** The `Skeleton` to show instead of the usual element */
    skeleton: React.ReactElement | null;
    /** The `ref` to pass to the usual element */
    ref: (node?: Element | null) => void;
}

/**
 * Returns a `ref` to pass to an element. When the element is not inside the viewport, an alternative `Skeleton` is
 * also returned; you can render it instead of the usual element. All elements that are replaced with the same
 * `measurementKey` are assumed to have the same width and height! The ones that are in view will be used to measure the
 * widths and heights of the ones that are out of view.
 * @param measurementKey A string that identifies all elements that should have the same width and height
 * @param skeletonProps Props for the `Skeleton`, such as `variant`
 * @param inViewOptions Options to pass to `useInView`
 */
export function useSkeletonOutOfView(
    measurementKey: string,
    skeletonProps?: SkeletonProps,
    inViewOptions?: IntersectionOptions
): SkeletonOutOfView {
    const { ref: refInView, inView } = useInView({
        rootMargin: "100% 0%",
        ...inViewOptions
    });

    // Check whether the size has already been measured. If it hasn't, we have no choice but to render the child.
    const size = measurements.get(measurementKey);
    return {
        skeleton: inView || !size
            ? null
            : <Skeleton {...size} {...skeletonProps} ref={refInView} />,
        ref: (node?: Element | null) => {
            refInView(node);
            if (node) {
                const { width, height } = node.getBoundingClientRect();
                if (width && height) {
                    measurements.set(measurementKey, { width, height });
                }
            }
        },
    };
}
