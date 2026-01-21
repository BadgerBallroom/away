import { DANCER_TILE_CONTAINER_CLASSNAME } from "./DancerTileContainer";

/** Returns whether the given element is inside a `DancerTileContainer`. */
export function isInsideDancerTileContainer(target: EventTarget): boolean {
    return target instanceof Element && !!target.closest(`.${DANCER_TILE_CONTAINER_CLASSNAME}`);
}
