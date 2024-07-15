import { useContext } from "react";
import SessionContext from "../components/SessionContext";
import { DancerListState } from "./DancerKLM";
import { useDeepState } from "./DeepStateHooks";
import Session from "./Session";

/** Walks up the node tree until a `SessionContext` is encountered and returns the session from it. */
export function useSession(): Session {
    return useContext(SessionContext);
}

/**
 * Retrieves the current session and returns an array of the states of the dancers who are going to the competition.
 * Triggers re-renders when the array is mutated but not when a dancer is mutated.
 */
export function useDancerListState(): DancerListState {
    const session = useSession();
    const dancerListState = session.getChildState("dancers").getChildState("list");
    useDeepState(dancerListState, [], true);
    return dancerListState;
}
