import SelectionManager from "../utilities/SelectionManager";

export interface ElementSelectionManager extends Omit<SelectionManager, "selection" | "onSelectableElementClick"> {
    selection: ElementSelectionManager.Selection;
}

export namespace ElementSelectionManager {
    export interface GetElements {
        (): HTMLCollectionOf<Element> | readonly Element[];
    }

    export class Selection {
        public readonly selectionSet: ReadonlySet<number>;
        public readonly getElements: GetElements;
        public readonly onSelectableElementClick: SelectionManager["onSelectableElementClick"];

        public get selected(): Set<Element> {
            const elements = this.getElements();
            const result = new Set<Element>();
            for (const index of this.selectionSet) {
                result.add(elements[index]);
            }
            return result;
        }

        constructor(
            selectionSet: ReadonlySet<number>,
            getElements: GetElements,
            onSelectableElementClick: SelectionManager["onSelectableElementClick"],
        ) {
            this.selectionSet = selectionSet;
            this.getElements = getElements;
            this.onSelectableElementClick = onSelectableElementClick;
        }

        public indexOf(element: Element): number {
            return Array.from(this.getElements()).indexOf(element);
        }

        public isSelected(element: Element): boolean {
            return this.selectionSet.has(this.indexOf(element));
        }
    }
}

export default ElementSelectionManager;
