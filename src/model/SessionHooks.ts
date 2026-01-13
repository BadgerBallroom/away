import { useContext } from "react";
import SessionContext from "../components/SessionContext";
import { DancerListState, DancerMapState } from "./DancerKLM";
import { useDeepState } from "./DeepStateHooks";
import Session from "./Session";

/** Walks up the node tree until a `SessionContext` is encountered and returns the session from it. */
export function useSession(): Session {
    return useContext(SessionContext);
}

/**
 * Retrieves the current session and returns an array of the states of the dancers who are going to the competition.
 * Triggers re-renders when the array is mutated but not when a dancer is mutated.
 * @returns The array
 */
export function useDancerListState(): DancerListState {
    const session = useSession();
    const dancerListState = session.getChildState("dancers").getChildState("list");
    useDeepState(dancerListState, [], true);
    return dancerListState;
}

/**
 * Retrieves the current session and returns a map from the ID of every dancer who is going to the competition to that
 * dancer's state. Triggers re-renders when the map is mutated but not when a dancer is mutated.
 * @returns The map
 */
export function useDancerMapState(): DancerMapState {
    const session = useSession();
    const dancerMapState = session.getChildState("dancers").getChildState("map");
    useDeepState(dancerMapState, [], true);
    return dancerMapState;
}
