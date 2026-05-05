'use client';

import { useRef, useImperativeHandle, forwardRef } from 'react';

export interface StrudelEditorHandle {
  setCode: (code: string) => void;
  stop: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const StrudelEditor = forwardRef<StrudelEditorHandle, {}>(
  (_, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useImperativeHandle(ref, () => ({
      setCode(code: string) {
        iframeRef.current?.contentWindow?.postMessage({ type: 'set-code', code }, '*');
      },
      stop() {
        iframeRef.current?.contentWindow?.postMessage({ type: 'stop' }, '*');
      },
    }));

    return (
      <iframe
        ref={iframeRef}
        src="/strudel-frame.html"
        className="h-full w-full border-0"
        allow="autoplay"
      />
    );
  }
);

StrudelEditor.displayName = 'StrudelEditor';
export default StrudelEditor;
