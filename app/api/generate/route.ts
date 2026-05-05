import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GoogleGenAI } from "@google/genai";
import { type NextRequest, NextResponse } from "next/server";

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

let client: GoogleGenAI | null = null;

function getClient() {
	if (!client) {
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
		client = new GoogleGenAI({ apiKey });
	}
	return client;
}

export async function POST(req: NextRequest) {
	const { command, currentCode } = await req.json();

	if (!command?.trim()) {
		return NextResponse.json(
			{ message: "No command provided.", code: null },
			{ status: 400 },
		);
	}

	try {
		const ai = getClient();

		const userMessage = currentCode
			? `Current code:\n\`\`\`\n${currentCode}\n\`\`\`\n\nCommand: ${command}`
			: `Command: ${command}\n\nNo current code — create something fresh.`;

		const response = await ai.models.generateContent({
			model: "gemini-flash-latest",
			contents: [{ role: "user", parts: [{ text: userMessage }] }],
			config: {
				systemInstruction: SYSTEM_PROMPT,
				temperature: 0.9,
			},
		});

		const text = response.text ?? "";

		// Strip markdown fences if model adds them anyway
		const cleaned = text
			.replace(/```json\n?/g, "")
			.replace(/```\n?/g, "")
			.trim();

		let parsed: { code?: string; message?: string };
		try {
			parsed = JSON.parse(cleaned);
		} catch {
			return NextResponse.json(
				{ message: "AI returned unparseable response. Try again.", code: null },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			code: parsed.code ?? null,
			message: parsed.message ?? "Done.",
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error";
		return NextResponse.json(
			{ message: `Error: ${message}`, code: null },
			{ status: 500 },
		);
	}
}
