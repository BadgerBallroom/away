import { Dayjs } from "dayjs";
import PriorityQueue from "ts-priority-queue";
import Carpool from "../model/Carpool";
import CarpoolArrangement from "../model/CarpoolArrangement";
import CarpoolArrangementState from "../model/CarpoolArrangementState";
import CarpoolMakerMessage from "../model/CarpoolMakerMessage";
import { CarpoolMakerSettings } from "../model/CarpoolMakerSettings";
import Dancer, { Accommodation, CanDriveCarpool } from "../model/Dancer";
import { DeepReadonly } from "../model/DeepState";
import { ValueWithID } from "../model/KeyListAndMap";
import Session from "../model/Session";

type DancerWithID = ValueWithID<Dancer>;

const settings: CarpoolMakerSettings = {
    numPeopleToUnassignInSearchOfBetterResult: 7,
    maxQueueSize: 262144,
    costEquivalents: {
        lonelyDriver: 2.0,
        makeWillingDriverDrive: 0.25,
        makeIfNeededDriverDrive: 2.0,
        preferDifferentAccomodation: 2.0,
        differentGenderPreferSameGender: 1.5,
        differentGenderNoGenderPreference: 0.5,
    },
};
let session: Session;

declare const self: Window & typeof globalThis;

self.onmessage = (e: MessageEvent<CarpoolMakerMessage>) => {
    switch (e.data.command) {
        case "makeCarpools":
            makeCarpools((e.data as CarpoolMakerMessage<"makeCarpools">).payload);
            break;
    }
};

/**
 * Automatically arranges the dancers in the given session into carpools.
 * @param sessionString The output of `toString` of the `Session` object that contains the dancers
 */
function makeCarpools(sessionString: string): void {
    session = Session.fromString(sessionString);

    const people = session.getChildState("dancers").list.getReferencedValues().filter(person => {
        return person.canDriveCarpool !== CanDriveCarpool.TravelingOnOwn;
    });

    const solutions = dijkstra(people);

    self.postMessage(CarpoolMakerMessage.create(
        "handleMadeCarpools",
        solutions.map(solution => new CarpoolArrangementState(session, solution).toString()),
    ));
}

class DijkstraState {
    public visited = DijkstraState._newVisitedSet();
    public toVisit = DijkstraState._newQueue();

    /** The number of nodes that have been visited */
    public get numVisited(): number {
        return this._numVisitedDiscarded + this.visited.size;
    }

    private _numVisitedDiscarded = 0;

    private static _newVisitedSet() {
        return new Set<string>();
    }

    private static _newQueue() {
        return new PriorityQueue<[number, string]>({ comparator: ([costA, _a], [costB, _b]) => costA - costB });
    }

    /**
     * Discards nodes that have more than the specified number of unassigned people.
     * @param people The people who are being put in carpools
     * @param numUnassigned The maximum number of unassigned people
     */
    public discardNodesWithNumUnassignedPeople(people: DeepReadonly<ValueWithID<Dancer>[]>, numUnassigned: number): void {
        if (this.visited.size) {
            const newVisitedSet = DijkstraState._newVisitedSet();
            this.visited.forEach(nodeID => {
                if (Node.fromString(people, nodeID).numUnassigned <= numUnassigned) {
                    newVisitedSet.add(nodeID);
                }
            });
            this._numVisitedDiscarded += this.visited.size;
            this.visited = newVisitedSet;
        }

        if (this.toVisit.length) {
            const newQueue = DijkstraState._newQueue();
            while (this.toVisit.length) {
                const entry = this.toVisit.dequeue();
                if (Node.fromString(people, entry[1]).numUnassigned <= numUnassigned) {
                    newQueue.queue(entry);
                }
            }
            this.toVisit = newQueue;
        }
    }

    /**
     * If the visit queue is larger than the specified size, discards the back half of the queue.
     * @param maxSize The maximum size of the visit queue
     */
    public truncateQueue(maxSize: number): void {
        if (this.toVisit.length > maxSize) {
            const newQueue = DijkstraState._newQueue();

            maxSize /= 2;
            while (newQueue.length < maxSize) {
                newQueue.queue(this.toVisit.dequeue());
            }

            this.toVisit = newQueue;
        }
    }
}

/**
 * Uses Dijkstra's algorithm to put people into carpools.
 * @param people The people to put in carpools
 * @param rootNodeId 
 * @returns 
 */
function dijkstra(people: DeepReadonly<DancerWithID[]>): CarpoolArrangement[] {
    const rootNodeId = new Node(people).toString();

    const costs: { [nodeID: string]: number | undefined } = {};
    const state = new DijkstraState();

    costs[rootNodeId] = 0.0;
    state.toVisit.queue([0.0, rootNodeId]);

    let minUnassignedPeople = Infinity;
    let solutions: Node[] = [];
    while (state.toVisit.length > 0) {
        const [costToCurrentNode, currentNodeId] = state.toVisit.dequeue();
        if (state.visited.has(currentNodeId)) {
            continue;
        }
        state.visited.add(currentNodeId);

        const currentNode = Node.fromString(people, currentNodeId);
        delete costs[currentNodeId]; // We don't need it anymore.

        if (currentNode.numUnassigned <= minUnassignedPeople) {
            if (currentNode.numUnassigned !== minUnassignedPeople) {
                minUnassignedPeople = currentNode.numUnassigned;
                solutions = [];

                // To reduce our memory footprint, we can discard nodes that have too many unassigned people.
                state.discardNodesWithNumUnassignedPeople(
                    people,
                    minUnassignedPeople + settings.numPeopleToUnassignInSearchOfBetterResult
                );
            }

            if (solutions.length < 3) {
                solutions.push(currentNode);
            } else if (currentNode.isDoneState()) {
                break;
            }
        }

        for (const edge of currentNode.getEdges()) {
            const nextNodeId = edge.node.toString();
            const oldCostToNode = costs[nextNodeId];
            const costToNodeViaCurrent = costToCurrentNode + edge.cost;
            if (oldCostToNode === undefined || oldCostToNode > costToNodeViaCurrent) {
                costs[nextNodeId] = costToNodeViaCurrent;

                // If the queue is getting large, discard the back half.
                // We're probably never going to get to it anyway.
                state.truncateQueue(settings.maxQueueSize);

                // Ideally, we'd update the node in the queue with the new length, but this queue library doesn't support that.
                if (!state.visited.has(nextNodeId)) {
                    state.toVisit.queue([costToNodeViaCurrent, nextNodeId]);
                }
            }

            progress(state.numVisited, state.toVisit.length, edge.node);
        }
    }

    return solutions.map((solution, index) => solution.toCarpoolArrangement(`Auto ${index + 1}`));
}

let progressTime = 0;
/**
 * Displays progress periodically.
 * @param numNodesVisited The number of nodes that have been visited
 * @param queueSize The size of the priority queue in the Dijkstra algorithm
 * @param latestNode The node that was last visited
 */
function progress(numNodesVisited: number, queueSize: number, latestNode: Node): void {
    const now = Date.now();
    if (now - progressTime >= 500) {
        progressTime = now;
        self.postMessage(CarpoolMakerMessage.create("handleProgressUpdate", {
            numArrangementsDiscovered: queueSize,
            numArrangementsExplored: numNodesVisited,
            latestArrangementExplored:
                new CarpoolArrangementState(session, latestNode.toCarpoolArrangement("")).toString(),
        }));
    }
}

interface Edge {
    cost: number;
    node: Node;
}

class Node {
    /** A reference to an array of people who are being put in carpools */
    private _people: readonly DancerWithID[];
    /**
     * Each car is represented by an array.
     * The first element is the index of the driver, and the rest are the indices of the passengers.
     * To reduce the memory footprint of this algorithm, the dancer IDs are not stored;
     * instead, their indices within `_people` are stored.
     */
    private _cars: readonly (readonly number[])[];
    /** The index of the first person who has not been put in a car (as a driver or passenger) */
    private _firstUnassignedPerson: number;
    /** The number of people who are already in a car (as a driver or passenger) */
    private _numAssigned: number;
    /** The indices of people who are already driving */
    private _existingDrivers: Set<number>;

    /** The number of people who are not in a car (as a driver or a passenger) */
    public get numUnassigned(): number {
        return this._people.length - this._numAssigned;
    }

    /**
     * Represents one possible arrangement of people in cars.
     * @param people The people who are being put in carpools
     */
    constructor(people: DeepReadonly<DancerWithID[]>);
    constructor(people: DeepReadonly<DancerWithID[]>, cars: readonly (readonly number[])[], firstUnassignedPerson: number);
    constructor(people: DeepReadonly<DancerWithID[]>, cars?: readonly (readonly number[])[], firstUnassignedPerson?: number) {
        this._people = people;
        this._cars = cars ?? [];
        this._firstUnassignedPerson = firstUnassignedPerson ?? 0;

        this._numAssigned = 0;
        this._existingDrivers = new Set<number>();
        for (const car of this._cars) {
            this._existingDrivers.add(car[0]);
            this._numAssigned += car.length;
        }
    }

    /** Returns the string representation of this `Node`. */
    public toString(): string {
        // Cars will be in the order that they were created (by promoting someone to a driver).
        // The same set of drivers will always be in the same order because we generate nodes in order by person.
        return JSON.stringify([this._cars, this._firstUnassignedPerson]);
    }

    /**
     * Creates a `Node` from the output of `toString`.
     * @param people The people who are being put in carpools
     * @param s The string
     */
    public static fromString(people: DeepReadonly<DancerWithID[]>, s: string): Node {
        const [cars, firstUnassignedPerson] = JSON.parse(s);
        return new Node(people, cars, firstUnassignedPerson);
    }

    /**
     * Converts this `Node` to a `CarpoolArrangement`.
     * @param name The name to give the `CarpoolArrangement`
     */
    public toCarpoolArrangement(name: string): CarpoolArrangement {
        const carpools = this._cars.map(car => ({
            departure: this._getLastEarliestDeparture(car),
            occupants: car.map(i => this._people[i].id)
        }));
        carpools.sort(Carpool.comparator);

        // `CarpoolArrangement` doesn't need to be passed the people who are not in a carpool.
        // It will find them by checking the people who are in carpools against the most up-to-date list of people.

        return {
            auto: true,
            name,
            carpools,
        };
    }

    /** Returns whether this node represents a valid solution. */
    public isDoneState(): boolean {
        // We are done when there are no more people to assign.
        return this._firstUnassignedPerson === this._people.length;
    }

    /** Computes the next edges that can come from this node. Assumes that isDoneState returns false. */
    public getEdges(): Edge[] {
        if (this.isDoneState()) {
            return [];
        }

        const egdes: Edge[] = [];

        // For each person who wants to drive but is not already driving or assigned to another car,
        // generate a node where they become a driver.
        for (let driverIndex = this._firstUnassignedPerson; driverIndex < this._people.length; ++driverIndex) {
            if (this._existingDrivers.has(driverIndex)) {
                continue;
            }

            const person = this._people[driverIndex];
            if (person.canDriveCarpool === CanDriveCarpool.No) {
                continue;
            }

            let nextUnassignedPassenger = this._firstUnassignedPerson;
            while (driverIndex === nextUnassignedPassenger || this._existingDrivers.has(nextUnassignedPassenger)) {
                ++nextUnassignedPassenger;
            }

            let i = 0;
            const cars: (readonly number[])[] = [];
            for (; i < this._cars.length; ++i) {
                if (this._cars[i][0] > driverIndex) {
                    break;
                }
                cars.push(this._cars[i]);
            }
            cars.push([driverIndex]);
            for (; i < this._cars.length; ++i) {
                cars.push(this._cars[i]);
            }

            egdes.push({
                cost: settings.costEquivalents.lonelyDriver + (
                    person.canDriveCarpool === CanDriveCarpool.Yes
                        ? settings.costEquivalents.makeWillingDriverDrive
                        : settings.costEquivalents.makeIfNeededDriverDrive
                ),
                node: new Node(this._people, cars, nextUnassignedPassenger)
            });
        }

        // Determine the next node's first unassigned person.
        // The next index may the driver of an existing car. If so, skip them.
        let nextUnassignedPassenger = this._firstUnassignedPerson + 1;
        while (this._existingDrivers.has(nextUnassignedPassenger)) {
            ++nextUnassignedPassenger;
        }

        // Generate nodes where the first unassigned person joins the existing cars.
        this._cars.forEach((car, i) => {
            // If the car is full, skip it.
            if (car.length === this._people[car[0]].canDriveMaxPeople) {
                return;
            }

            // Build a copy this._cars except that this car has this person in it.
            const cars: (readonly number[])[] = [];
            for (let j = 0; j < i; ++j) {
                cars.push(this._cars[j]);
            }
            cars.push([...car, this._firstUnassignedPerson]);
            for (let j = i + 1; j < this._cars.length; ++j) {
                cars.push(this._cars[j]);
            }

            egdes.push({
                cost: this._computeCostOfAddingFirstUnassignedPersonToCar(car),
                node: new Node(this._people, cars, nextUnassignedPassenger)
            });
        });

        return egdes;
    }

    /**
     * Computes the cost of putting the person at this._firstUnassignedPerson into the specified car.
     * @param car The car
     * @returns The cost (in hours)
     */
    private _computeCostOfAddingFirstUnassignedPersonToCar(car: readonly number[]): number {
        const person = this._people[this._firstUnassignedPerson];
        const personDepartureTime = person.earliestPossibleDeparture;
        let cost = 0.0;

        // If the car currently only has the driver, adding this person to it should remove the lonely driver cost.
        if (car.length === 1) {
            cost -= settings.costEquivalents.lonelyDriver;
        }

        // See whether adding this person to the car would cause the car to leave later.
        const currentDepartureTime = this._getLastEarliestDeparture(car);
        if (currentDepartureTime && personDepartureTime) {
            if (currentDepartureTime.isBefore(personDepartureTime)) {
                // The cost is the difference multiplied by the number of people already in the car.
                cost += personDepartureTime.diff(currentDepartureTime, "hour", true) * car.length;
            } else {
                // Only this person's departure time changes, so the difference is not multiplied.
                cost += currentDepartureTime.diff(personDepartureTime, "hour", true);
            }
        }

        // Add the cost of putting this person with each of the people already in the car.
        for (const personIndex of car) {
            cost += Node._computeCostBetweenTwoPeople(person, this._people[personIndex]);
        }

        return cost;
    }

    /**
     * Given a group of people, finds the earliest time that they could all leave together.
     * @param car An array of indices of people from `this._people`
     * @returns The time (or null if none of the people have a departure time)
     */
    private _getLastEarliestDeparture(car: readonly number[]): Dayjs | null {
        const people = car.map(personIndex => this._people[personIndex]);

        let maximum: Dayjs | null = null;
        for (const person of people) {
            if (person.earliestPossibleDeparture && (!maximum || maximum.isBefore(person.earliestPossibleDeparture))) {
                maximum = person.earliestPossibleDeparture;
            }
        }

        return maximum;
    }

    /**
     * Computes the cost of putting two people in the same car.
     * The cost is the number of hours that you would delay one person to put them with the other.
     * @param personA One person
     * @param personB Another person
     * @returns The cost (in hours)
     */
    private static _computeCostBetweenTwoPeople(personA: DancerWithID, personB: DancerWithID): number {
        let distance = 0.0;

        // If both people prefer different types of housing, add some distance.
        // If one or both have no preference, don't add distance.
        if (personA.accommodation !== Accommodation.NoPreference && personB.accommodation !== Accommodation.NoPreference && personA.accommodation !== personB.accommodation) {
            distance += settings.costEquivalents.preferDifferentAccomodation;
        }

        // Some people prefer to be in same-gender housing.
        // For carpools, if the people are different genders, add some distance.
        // If they are different genders and at least one person prefers same-gender housing, add more distance.
        if (personA.gender !== personB.gender) {
            if (personA.prefersSameGender || personB.prefersSameGender) {
                distance += settings.costEquivalents.differentGenderPreferSameGender;
            } else {
                distance += settings.costEquivalents.differentGenderNoGenderPreference;
            }
        }

        return distance;
    }
}
