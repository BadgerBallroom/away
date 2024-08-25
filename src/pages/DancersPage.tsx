import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import SortIcon from '@mui/icons-material/Sort';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import React, { useCallback, useEffect, useState } from 'react';
import { useHotkeys } from "react-hotkeys-hook";
import { FormattedMessage } from 'react-intl';
import DancerCard from '../components/DancerCard';
import DancerSortDialog from '../components/DancerSortDialog';
import DeleteButton from '../components/DeleteButton';
import { FabZoomerFabProps } from '../components/FabZoomer';
import WorkspaceWithToolbar from '../components/WorkspaceWithToolbar';
import { MessageID } from '../i18n/messages';
import { DancerListState } from '../model/DancerKLM';
import DancerState from '../model/DancerState';
import SelectionManager, { useSelectionManager } from '../model/SelectionManager';
import { useDancerListState, useSession } from '../model/SessionHooks';

const DancersPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const timeout = setTimeout(() => setLoading(false), 0);
        return () => clearTimeout(timeout);
    }, []);

    const session = useSession();

    const {
        selection: { set: selectionSet },
        clearSelection,
        addRangeToSelection,
        onSelectableElementClick
    } = useSelectionManager();

    const dancerListState = useDancerListState();

    const importCSVInputID = "dancers-csv-file-input";
    const onImportCSVClick = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.length) {
            return;
        }

        await dancerListState.importCSV(event.target.files[0], console.warn.bind(console));

        // Clear the input element so that selecting the same file again triggers this handler.
        event.target.value = "";
    }, [dancerListState]);

    const onExportCSVClick = useCallback(() => dancerListState.exportCSV(), [dancerListState]);

    const [showSortDialog, setShowSortDialog] = useState(false);
    const onSortClick = useCallback(() => setShowSortDialog(true), []);
    const onSortClose = useCallback(() => setShowSortDialog(false), []);

    const onDeleteSelectionClick = useCallback(() => {
        if (selectionSet.size < 1) {
            return;
        }
        // The selection manager stores the indices of the dancer cards that are selected.
        // Remove the dancer IDs that are at those indices.
        dancerListState.removeMulti(selectionSet);
        clearSelection();
    }, [dancerListState, selectionSet, clearSelection]);
    useHotkeys("Delete", onDeleteSelectionClick);

    const onSelectAllClick = useCallback(() => {
        addRangeToSelection(0, dancerListState.length);
    }, [addRangeToSelection, dancerListState]);
    useHotkeys("Ctrl+A", onSelectAllClick, { preventDefault: true });

    useEffect(() => {
        dancerListState.addTemporaryDancer();
    }, [dancerListState]);

    useEffect(() => {
        const handler = async () => {
            for (let i = 0; i < 240; ++i) {
                const temporaryDancer = dancerListState.temporaryDancer;
                // The temporary dancer might not be there if the `useEffect` above hasn't run yet.
                if (temporaryDancer) {
                    const nameControl = document.getElementById(`dancer-${temporaryDancer.evanescentID}-name`);
                    if (nameControl) {
                        nameControl.focus();
                        break;
                    }

                    // The input field might be outside the viewport and therefore not rendered.
                    document.getElementById(`dancer-${temporaryDancer.evanescentID}-name-skeleton`)?.scrollIntoView();
                }
                await new Promise(resolve => requestAnimationFrame(resolve));
            }
        };
        session.registerFABHandler(handler);
        return () => session.unregisterFABHandler(handler);
    }, [session, dancerListState]);

    return <WorkspaceWithToolbar
        toolbarChildren={<>
            <Button startIcon={<FileUploadIcon />} component="label">
                <FormattedMessage id={MessageID.importCSV} />
                <input
                    hidden
                    tabIndex={-1}
                    role="none"
                    id={importCSVInputID}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={onImportCSVClick}
                />
            </Button>
            <Button startIcon={<FileDownloadIcon />} onClick={onExportCSVClick}>
                <FormattedMessage id={MessageID.exportCSV} />
            </Button>
            <Button startIcon={<SortIcon />} onClick={onSortClick} disabled={dancerListState.length < 2}>
                <FormattedMessage id={MessageID.sort} />
            </Button>
            {selectionSet.size > 0 &&
                <DeleteButton onClick={onDeleteSelectionClick} />
            }
        </>}
    >
        <DancerSortDialog open={showSortDialog} onClose={onSortClose} toSort={dancerListState} />
        <Grid
            container
            spacing={2}
            padding={2}
            onClick={clearSelection}
        >
            {loading
                ? <>
                    <GridItemSkeleton />
                    <GridItemSkeleton />
                    <GridItemSkeleton />
                    <GridItemSkeleton />
                </>
                : dancerListState.getReferencedStates().map((dancerState, index) =>
                    <GridItem
                        key={dancerState.evanescentID}
                        {...{
                            dancerListState,
                            dancerState,
                            index,
                            onSelectableElementClick,
                        }}
                        selected={selectionSet.has(index)}
                    />
                )
            }
        </Grid>
    </WorkspaceWithToolbar>;
};

export default DancersPage;

const GridItemSkeleton = React.forwardRef(function GridItemSkeleton(
    _: {},
    ref: React.ForwardedRef<HTMLDivElement>
) {
    return <Grid item ref={ref}>
        <Skeleton variant="rounded" animation="wave" width={292} height={515} />
    </Grid>;
});

interface GridItemProps {
    /** The IDs of the dancers who are being displayed in the grid */
    dancerListState: DancerListState;
    /** The dancer to display in this grid item */
    dancerState: DancerState;
    /** The index of `dancerState` in `dancerListState` */
    index: number;
    /** A callback for when the user selects this dancer by clicking */
    onSelectableElementClick: SelectionManager["onSelectableElementClick"];
    /** Whether this dancer is selected */
    selected: boolean;
}

const GridItem = React.forwardRef(function GridItem(
    {
        dancerListState,
        dancerState,
        index,
        onSelectableElementClick,
        selected,
    }: GridItemProps,
    ref: React.ForwardedRef<HTMLDivElement>
) {
    const isTemporaryDancer = dancerListState.isTemporaryDancer(dancerState);
    const onDelete = useCallback(() => {
        dancerListState.pop(index);
    }, [dancerListState, index]);
    const onSelect = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();
        onSelectableElementClick(event, index);
    }, [onSelectableElementClick, index]);

    return <Grid item ref={ref}>
        <DancerCard
            id={`dancer-${dancerState.evanescentID}`}
            dancerState={dancerState}
            onDelete={isTemporaryDancer ? undefined : onDelete}
            onSelect={isTemporaryDancer ? undefined : onSelect}
            selected={selected}
        />
    </Grid>;
});

export const DANCERS_FAB: FabZoomerFabProps = {
    color: "primary",
    titleID: MessageID.dancersAdd,
    children: <AddIcon />,
};
