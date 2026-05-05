"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StrudelEditorHandle } from "@/components/strudel-editor";

const StrudelEditor = dynamic(() => import("@/components/strudel-editor"), {
	ssr: false,
	loading: () => (
		<div className="h-full w-full flex items-center justify-center text-zinc-600 font-mono text-sm">
			loading strudel...
		</div>
	),
});

const INITIAL_CODE = `// AI DJ — waiting for your command
// Click here then Ctrl+Enter to start · Ctrl+. to stop

setcpm(128 / 4)

$: sound("bd ~ bd ~")
  .bank("RolandTR909")
  .gain(1.2)
`;

const INITIAL_MESSAGES: UIMessage[] = [
	{
		id: "init",
		role: "assistant",
		parts: [
			{
				type: "text",
				text: "Ready. Click the editor, Ctrl+Enter to start, then tell me what you want.",
			},
		],
	},
];

export default function Home() {
	const editorRef = useRef<StrudelEditorHandle>(null);
	const currentCodeRef = useRef<string>(INITIAL_CODE);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [input, setInput] = useState("");

	const transport = useMemo(
		() =>
			new DefaultChatTransport({
				api: "/api/generate",
				prepareSendMessagesRequest({ body, messages, ...rest }) {
					return {
						...rest,
						body: { ...body, messages, currentCode: currentCodeRef.current },
					};
				},
			}),
		[],
	);

	const { messages, sendMessage, status, error } = useChat({
		transport,
		messages: INITIAL_MESSAGES,
		onFinish({ message }) {
			const text = message.parts
				.filter((p): p is { type: "text"; text: string } => p.type === "text")
				.map((p) => p.text)
				.join("");
			const raw = text
				.replace(/```json\n?/g, "")
				.replace(/```\n?/g, "")
				.trim();
			try {
				const parsed = JSON.parse(raw);
				if (parsed.code && editorRef.current) {
					currentCodeRef.current = parsed.code;
					editorRef.current.setCode(parsed.code);
				}
			} catch {
				// model didn't return JSON — message still shows
			}
		},
	});

	const isLoading = status === "streaming" || status === "submitted";

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll on every message/loading change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isLoading]);

	function submit() {
		const text = input.trim();
		if (!text || isLoading) return;
		setInput("");
		sendMessage({ text });
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			submit();
		}
	}

	function displayContent(msg: UIMessage) {
		const text = msg.parts
			.filter((p): p is { type: "text"; text: string } => p.type === "text")
			.map((p) => p.text)
			.join("");
		try {
			const parsed = JSON.parse(
				text
					.replace(/```json\n?/g, "")
					.replace(/```\n?/g, "")
					.trim(),
			);
			return parsed.message ?? text;
		} catch {
			return text;
		}
	}

	return (
		<div className="flex flex-col h-screen bg-[#0a0a0a] text-zinc-300">
			<header className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 shrink-0">
				<span className="font-mono text-xs text-zinc-500 tracking-widest uppercase">
					AI DJ
				</span>
				<span className="font-mono text-xs text-zinc-600">
					Ctrl+Enter to play · Ctrl+. to stop
				</span>
			</header>

			<div className="flex-1 overflow-hidden">
				<StrudelEditor ref={editorRef} />
			</div>

			<div className="h-36 overflow-y-auto px-5 py-3 border-t border-zinc-800 flex flex-col gap-2 text-sm font-mono">
				{messages.map((msg) => (
					<div
						key={msg.id}
						className={msg.role === "user" ? "text-white" : "text-zinc-500"}
					>
						<span className="text-zinc-700 mr-2">
							{msg.role === "user" ? ">" : "$"}
						</span>
						{displayContent(msg)}
					</div>
				))}
				{isLoading && (
					<div className="text-zinc-600">
						<span className="mr-2">$</span>
						<span className="animate-pulse">thinking...</span>
					</div>
				)}
				{error && (
					<div className="text-red-500">
						<span className="mr-2">!</span>
						{error.message}
					</div>
				)}
				<div ref={messagesEndRef} />
			</div>

			<div className="flex items-center gap-3 px-5 py-3 border-t border-zinc-800 shrink-0">
				<span className="text-zinc-600 font-mono text-sm">{">"}</span>
				<input
					className="flex-1 bg-transparent font-mono text-sm text-white placeholder-zinc-700 outline-none"
					placeholder="go darker · drop the kick · bring in acid · slower..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					disabled={isLoading}
					autoFocus
				/>
				<button
					type="button"
					onClick={submit}
					disabled={isLoading || !input.trim()}
					className="font-mono text-xs text-zinc-600 hover:text-zinc-300 disabled:opacity-30 transition-colors"
				>
					send
				</button>
			</div>
		</div>
	);
}
