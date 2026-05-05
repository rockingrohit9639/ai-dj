"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

export interface StrudelEditorHandle {
	setCode: (code: string) => void;
	stop: () => void;
}

const StrudelEditor = forwardRef<StrudelEditorHandle, object>((_, ref) => {
	const iframeRef = useRef<HTMLIFrameElement>(null);

	useImperativeHandle(ref, () => ({
		setCode(code: string) {
			iframeRef.current?.contentWindow?.postMessage(
				{ type: "set-code", code },
				"*",
			);
		},
		stop() {
			iframeRef.current?.contentWindow?.postMessage({ type: "stop" }, "*");
		},
	}));

	return (
		<iframe
			ref={iframeRef}
			src="/strudel-frame.html"
			title="Strudel live coding editor"
			className="h-full w-full border-0"
			allow="autoplay"
		/>
	);
});

StrudelEditor.displayName = "StrudelEditor";
export default StrudelEditor;
