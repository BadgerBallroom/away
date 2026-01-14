import FabZoomer from "./FabZoomer";
import { useFabRenderInfo } from "./FabZoomerHooks";

/** Renders the floating action button (FAB) for all pages. */
const FabRenderer: React.FC = () => {
    const fabZoomerProps = useFabRenderInfo();
    return <>{Array.from(fabZoomerProps.entries()).map(([path, fab]) =>
        <FabZoomer key={path} path={path} fab={fab} />,
    )}</>;
};

export default FabRenderer;
