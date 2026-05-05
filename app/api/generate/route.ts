import { readFileSync } from "node:fs";
import { join } from "node:path";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import type { NextRequest } from "next/server";

const strudelRef = readFileSync(join(process.cwd(), "STRUDEL.md"), "utf-8");

const SYSTEM_PROMPT = `You are an AI DJ controlling a live Strudel music session.
Strudel is a browser-based live coding music environment. You respond to commands like
"go darker", "bring in acid", "drop the kick", "slower", "more chaotic", etc.

When given a command and the current Strudel code, you output updated Strudel code
that evolves the music in the requested direction. Keep what's working unless the
command implies removing it. Maintain energy and coherence.

Rules:
- Always output valid Strudel code using $: for multiple patterns
- Always include setcpm() at the top
- Keep patterns evolving — vary gain, lpf, timing subtly
- Reply with JSON: { "code": "...", "message": "..." }
  - code: the full new Strudel code to play
  - message: one short sentence describing what changed (for the chat log)
- Do not include any markdown fences or explanation outside the JSON

Here is the complete Strudel reference:

${strudelRef}`;

export async function POST(req: NextRequest) {
	const { messages, currentCode } = await req.json();

	const lastMessage = messages?.at(-1);
	// AI SDK v6 sends parts array; extract text parts
	const command = (
		lastMessage?.parts
			?.filter((p: { type: string }) => p.type === "text")
			.map((p: { type: string; text: string }) => p.text)
			.join("") ??
		lastMessage?.content ??
		""
	).trim();

	if (!command) {
		return new Response(JSON.stringify({ error: "No command provided." }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const contextualPrompt = currentCode
		? `Current code:\n\`\`\`\n${currentCode}\n\`\`\`\n\nCommand: ${command}`
		: `Command: ${command}\n\nNo current code — create something fresh.`;

	const result = streamText({
		model: google("gemini-flash-latest"),
		system: SYSTEM_PROMPT,
		messages: [{ role: "user", content: contextualPrompt }],
		temperature: 0.9,
	});

	return result.toUIMessageStreamResponse();
}
