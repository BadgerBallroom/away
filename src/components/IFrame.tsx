import { IframeHTMLAttributes, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface IFrameProps extends Omit<IframeHTMLAttributes<HTMLIFrameElement>, "src"> {
    /** A unique title for the `<iframe>` (required by jsx-a11y/iframe-has-title) */
    title: string;
    /** A callback that takes the `contentWindow` property of the `<iframe>` */
    setContentWindow?: (contentWindow: Window | null) => void;
    /** A node to put in the `<head>` section of the document in the `<iframe>` */
    head?: React.ReactNode;
    /** A node to put in the `<body>` section of the document in the `<iframe>` */
    children: React.ReactNode;
}

/** Renders the children inside an <iframe> element. */
const IFrame: React.FC<IFrameProps> = ({ title, setContentWindow, head, children, ...props }) => {
    "use no memo";

    const [iframe, setIFrame] = useState<HTMLIFrameElement | null>(null);
    const iframeWindow = iframe?.contentWindow ?? null;

    useEffect(() => {
        if (iframeWindow) {
            iframeWindow.document.title = title; // eslint-disable-line react-compiler/react-compiler
        }
    }, [iframeWindow, title]);

    useEffect(() => {
        if (setContentWindow) {
            setContentWindow(iframeWindow);
        }
    }, [iframeWindow, setContentWindow]);

    const iframeHead = iframeWindow?.document.head;
    const iframeBody = iframeWindow?.document.body;

    return <iframe {...props} title={title} ref={setIFrame}>
        {iframeHead && head && createPortal(head, iframeHead)}
        {iframeBody && createPortal(children, iframeBody)}
    </iframe>;
};

export default IFrame;
