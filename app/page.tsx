"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
// Tell me what to play, e.g. "a techno track" or "something chill"

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
				text: 'Ready. Tell me what you want — e.g. "a techno track", "something dark and hypnotic". I\'ll keep evolving the set automatically.',
			},
		],
	},
];

type DJPlan = {
	genre: string;
	bpm: number;
	energy: string;
	mixNote: string;
};

const AUTO_EVOLVE_INTERVAL = 25000;

export default function Home() {
	const editorRef = useRef<StrudelEditorHandle>(null);
	const currentCodeRef = useRef<string>(INITIAL_CODE);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const autoEvolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isPlayingRef = useRef(false);
	const [input, setInput] = useState("");
	const [djPlan, setDjPlan] = useState<DJPlan | null>(null);

	const transport = useMemo(
		() =>
			new DefaultChatTransport({
				api: "/api/generate",
				prepareSendMessagesRequest({ body, messages, ...rest }) {
					return {
						...rest,
						body: {
							...(body ?? {}),
							// Pass command and context directly — the route no longer uses messages array
							command: (body as Record<string, unknown>)?.command ?? "",
							currentCode: currentCodeRef.current,
							isAutoEvolve: (body as Record<string, unknown>)?.isAutoEvolve ?? false,
						},
					};
				},
			}),
		[],
	);

	const { messages, sendMessage, status, error } = useChat({
		transport,
		messages: INITIAL_MESSAGES,
		onFinish({ message }) {
			// message-metadata chunk updates message.metadata with the DJ plan
			const meta = message.metadata as DJPlan | undefined;
			if (meta?.genre) setDjPlan(meta);

			// Extract code from text parts
			const text = message.parts
				.filter((p): p is { type: "text"; text: string } => p.type === "text")
				.map((p) => p.text)
				.join("");
			const raw = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
			try {
				const parsed = JSON.parse(raw);
				if (parsed.code && editorRef.current) {
					currentCodeRef.current = parsed.code;
					editorRef.current.setCode(parsed.code);
					isPlayingRef.current = true;
				}
			} catch {
				// model didn't return JSON — message still shows
			}
		},
	});

	const isLoading = status === "streaming" || status === "submitted";

	// Schedule auto-evolve — defined with useCallback so the ref stays stable
	const scheduleAutoEvolve = useCallback(() => {
		if (autoEvolveTimerRef.current) clearTimeout(autoEvolveTimerRef.current);
		autoEvolveTimerRef.current = setTimeout(() => {
			if (!isPlayingRef.current) return;
			sendMessage(
				{ text: "" },
				{ body: { command: "", isAutoEvolve: true } },
			);
		}, AUTO_EVOLVE_INTERVAL);
	}, [sendMessage]);

	// Re-schedule after each completed generation
	// biome-ignore lint/correctness/useExhaustiveDependencies: only re-run when status goes idle
	useEffect(() => {
		if (status === "ready" && isPlayingRef.current) {
			scheduleAutoEvolve();
		}
	}, [status, scheduleAutoEvolve]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (autoEvolveTimerRef.current) clearTimeout(autoEvolveTimerRef.current);
		};
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll on every message/loading change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isLoading]);

	function submit() {
		const text = input.trim();
		if (!text || isLoading) return;
		setInput("");
		sendMessage({ text }, { body: { command: text, isAutoEvolve: false } });
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
		if (!text) return null;
		try {
			const parsed = JSON.parse(
				text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim(),
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
				<div className="flex items-center gap-4">
					{djPlan && (
						<span className="font-mono text-xs text-zinc-600">
							{djPlan.genre} · {djPlan.bpm} bpm · {djPlan.energy}
						</span>
					)}
					<span className="font-mono text-xs text-zinc-700">
						Ctrl+Enter to play · Ctrl+. to stop
					</span>
				</div>
			</header>

			<div className="flex flex-1 overflow-hidden">
				<div className="flex-1 overflow-hidden">
					<StrudelEditor ref={editorRef} />
				</div>

				<div className="w-md flex flex-col border-l border-zinc-800 shrink-0">
					<div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 text-sm font-mono">
						{messages.map((msg) => {
							const content = displayContent(msg);
							if (!content) return null;
							return (
								<div
									key={msg.id}
									className={msg.role === "user" ? "text-white" : "text-zinc-500"}
								>
									<span className="text-zinc-700 mr-2">
										{msg.role === "user" ? ">" : "$"}
									</span>
									{content}
								</div>
							);
						})}
						{isLoading && (
							<div className="text-zinc-600">
								<span className="mr-2">$</span>
								<span className="animate-pulse">
									{status === "submitted" ? "dj planning..." : "coding..."}
								</span>
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

					<div className="flex items-center gap-3 px-4 py-3 border-t border-zinc-800 shrink-0">
						<span className="text-zinc-600 font-mono text-sm">{">"}</span>
						<input
							className="flex-1 bg-transparent font-mono text-sm text-white placeholder-zinc-700 outline-none"
							placeholder="a techno track..."
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
			</div>
		</div>
	);
}
