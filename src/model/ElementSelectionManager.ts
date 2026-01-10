import SelectionManager from "../utilities/SelectionManager";

export interface ElementSelectionManager<E extends Element>
    extends Omit<SelectionManager, "selection" | "onSelectableElementClick"> {
    selection: ElementSelectionManager.Selection<E>;
}

export namespace ElementSelectionManager {
    export class Selection<E extends Element> {
        public readonly onSelectableElementClick: SelectionManager["onSelectableElementClick"];

        private _selectable = new Map<E, number>();
        private _selected = new Set<E>();

        get selectable(): ReadonlyMap<E, number> {
            return this._selectable;
        }

        public get selected(): ReadonlySet<E> {
            return this._selected;
        }

        constructor(
            elements: NodeListOf<E> | HTMLCollectionOf<E> | readonly E[],
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

        public indexOf(element: E): number | undefined {
            return this.selectable.get(element);
        }

        public isSelected(element: E): boolean {
            return this.selected.has(element);
        }
    }
}

export default ElementSelectionManager;
