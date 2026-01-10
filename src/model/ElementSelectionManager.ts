import SelectionManager from "../utilities/SelectionManager";

export interface ElementSelectionManager extends Omit<SelectionManager, "selection" | "onSelectableElementClick"> {
    selection: ElementSelectionManager.Selection;
}

export namespace ElementSelectionManager {
    export class Selection {
        public readonly onSelectableElementClick: SelectionManager["onSelectableElementClick"];

        private _selectable = new Map<Element, number>();
        private _selected = new Set<Element>();

        get selectable(): ReadonlyMap<Element, number> {
            return this._selectable;
        }

        public get selected(): ReadonlySet<Element> {
            return this._selected;
        }

        constructor(
            elements: HTMLCollectionOf<Element> | readonly Element[],
            selectionSet: ReadonlySet<number>,
            onSelectableElementClick: SelectionManager["onSelectableElementClick"],
        ) {
            for (let i = 0; i < elements.length; ++i) {
                this._selectable.set(elements[i], i);
                if (selectionSet.has(i)) {
                    this._selected.add(elements[i]);
                }
            }
            this.onSelectableElementClick = onSelectableElementClick;
        }

        public indexOf(element: Element): number | undefined {
            return this.selectable.get(element);
        }

        public isSelected(element: Element): boolean {
            return this.selected.has(element);
        }
    }
}

export default ElementSelectionManager;
