
export interface CarpoolMakerSettings {
    /**
     * Sometimes, removing some people from cars, putting other people in, and then putting the first people in other
     * cars results in a better arrangement of carpools overall. This value controls the maximum number of people that
     * can be removed in search of a better arrangement. When the value is higher, the resulting arrangements will be
     * better, but the memory usage and runtime of the algorithm will be increased.
     */
    numPeopleToUnassignInSearchOfBetterResult: number;
    /**
     * The carpool algorithm works by adding people to various cars to produce different arrangements of carpools. It
     * internally tracks arrangements that it hasn't explored yet. This value controls the maximum number of
     * arrangements to track; any arrangement that is worse than the top `maxQueueSize / 2`-th arrangement is discarded.
     * When the value is higher, the resulting arrangements will be better, but the memory usage and runtime of the
     * algorithm will be increased.
     */
    maxQueueSize: number;
    /**
     * The carpool algorithm looks for certain undesirable scenarios. For each scenario, you should specify the number
     * of person-hours that you are willing to delay a car from departing to avoid the scenario.
     */
    costEquivalents: {
        /** Sending a driver off alone with no passengers */
        lonelyDriver: number;
        /** Making someone who wants to be a driver drive */
        makeWillingDriverDrive: number;
        /** Making someone who only wants to drive if necessary drive */
        makeIfNeededDriverDrive: number;
        /** Putting two people who prefer different housing types together */
        preferDifferentAccomodation: number;
        /** Putting two people who have different genders and who want to be in same-gender housing in the same car */
        differentGenderPreferSameGender: number;
        /** Putting two people who have different genders but do not prefer same-gender housing in the same car */
        differentGenderNoGenderPreference: number;
    };
}
