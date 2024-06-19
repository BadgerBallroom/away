import { useContext } from "react";
import SessionContext from "../components/SessionContext";
import Session from "./Session";

/** Walks up the node tree until a `SessionContext` is encountered and returns the session from it. */
export function useSession(): Session {
    return useContext(SessionContext);
}
