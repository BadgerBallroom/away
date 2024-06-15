import { createContext } from "react";
import Session from "../model/Session";

const SessionContext = createContext(new Session());

export default SessionContext;
