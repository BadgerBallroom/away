interface MessagePayloads {
    /**
     * Sent from the UI thread to the worker.
     * Automatically arranges the dancers in the given session into carpools.
     * The payload is the output of `toString` of the `Session` object that contains the dancers.
     */
    makeCarpools: string;
    /**
     * Sent from the worker to the UI thread in response to `makeCarpools`.
     * Sent periodically to update the UI with progress information.
     */
    handleProgressUpdate: CarpoolMakerProgress;
    /**
     * Sent from the worker to the UI thread in response to `makeCarpools`.
     * Sent when the dancers have been arranged into carpools.
     * The payload is an array of strings. Each string is the output of `toString` of the `FleetState` object that
     * represents one possible arrangment of carpools.
     */
    handleMadeCarpools: string[];
}

type Command = keyof MessagePayloads;

export interface CarpoolMakerMessage<C extends Command = Command> {
    command: C;
    payload: MessagePayloads[C];
}

export namespace CarpoolMakerMessage {
    export function create<C extends Command>(command: C, payload: MessagePayloads[C]): CarpoolMakerMessage<C> {
        return { command, payload };
    }
}

export default CarpoolMakerMessage;

export interface CarpoolMakerProgress {
    /** The number of arrangements that have are queued to be evaluated */
    numArrangementsDiscovered: number;
    /** The number of arrangements that have already been evaluated */
    numArrangementsExplored: number;
    /**
     * The last arrangement that was evaluated.
     * The string is the output of `toString` of the `FleetState` object that represents the arrangement.
     */
    latestArrangementExplored: string | null;
}

export namespace CarpoolMakerProgress {
    export const DEFAULT: CarpoolMakerProgress = {
        numArrangementsDiscovered: 0,
        numArrangementsExplored: 0,
        latestArrangementExplored: null,
    };
}
