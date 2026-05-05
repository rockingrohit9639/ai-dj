'use client';

import { useEffect, useRef } from 'react';

interface StrudelEditorProps {
  code: string;
  onReady?: (editor: StrudelMirrorInstance) => void;
}

interface StrudelMirrorInstance {
  setCode: (code: string) => void;
  evaluate: () => void;
}

interface StrudelEditorElement extends HTMLElement {
  editor?: StrudelMirrorInstance;
}

export default function StrudelEditor({ code, onReady }: StrudelEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<StrudelEditorElement | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    // Dynamically import to avoid SSR issues with web components
    import('@strudel/repl').then(() => {
      if (!containerRef.current) return;

      const el = document.createElement('strudel-editor') as StrudelEditorElement;
      containerRef.current.appendChild(el);
      editorRef.current = el;

      // Wait for the editor instance to be available
      function waitForEditor() {
        if (el.editor) {
          el.editor.setCode(code);
          onReadyRef.current?.(el.editor);
        } else {
          setTimeout(waitForEditor, 100);
        }
      }
      waitForEditor();
    });

    return () => {
      if (editorRef.current && containerRef.current) {
        containerRef.current.removeChild(editorRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      id="strudel-mount"
      ref={containerRef}
      className="h-full w-full overflow-hidden"
    />
  );
}
