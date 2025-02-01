import { IframeHTMLAttributes, useState } from "react";
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
    const [iframe, setIFrame] = useState<HTMLIFrameElement | null>(null);

    const iframeWindow = iframe?.contentWindow ?? null;
    let iframeHead: HTMLHeadElement | undefined = undefined;
    let iframeBody: HTMLElement | undefined = undefined;
    if (iframeWindow) {
        iframeWindow.document.title = title;
        iframeHead = iframeWindow.document.head;
        iframeBody = iframeWindow.document.body;
    }

    if (setContentWindow) {
        setContentWindow(iframeWindow);
    }

    return <iframe {...props} title={title} ref={setIFrame}>
        {iframeHead && head && createPortal(head, iframeHead)}
        {iframeBody && createPortal(children, iframeBody)}
    </iframe>;
};

export default IFrame;
