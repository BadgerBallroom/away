import SelectionManager from "../utilities/SelectionManager";

export interface ElementSelectionManager<E extends Element>
    extends Omit<SelectionManager, "selection" | "onSelectableElementClick"> {
    selection: ElementSelectionManager.Selection<E>;
}

export namespace ElementSelectionManager {
    export interface GetElements<E extends Element> {
        (): readonly E[];
    }

    export class Selection<E extends Element> {
        public readonly selectionSet: ReadonlySet<number>;
        public readonly getElements: GetElements<E>;
        public readonly onSelectableElementClick: SelectionManager["onSelectableElementClick"];

        public get selected(): Set<E> {
            const elements = this.getElements();
            const result = new Set<E>();
            for (const index of this.selectionSet) {
                result.add(elements[index]);
            }
            return result;
        }

        constructor(
            selectionSet: ReadonlySet<number>,
            getElements: GetElements<E>,
            onSelectableElementClick: SelectionManager["onSelectableElementClick"],
        ) {
            this.selectionSet = selectionSet;
            this.getElements = getElements;
            this.onSelectableElementClick = onSelectableElementClick;
        }

        public indexOf(element: E): number {
            return this.getElements().indexOf(element);
        }

        public isSelected(element: E): boolean {
            return this.selectionSet.has(this.indexOf(element));
        }
    }
}

export default ElementSelectionManager;
