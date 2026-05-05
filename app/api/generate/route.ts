import { readFileSync } from "node:fs";
import { join } from "node:path";
import { google } from "@ai-sdk/google";
import { Output, createUIMessageStream, createUIMessageStreamResponse, generateText, streamText } from "ai";
import type { NextRequest } from "next/server";
import { z } from "zod";

const strudelRef = readFileSync(join(process.cwd(), "STRUDEL.md"), "utf-8");

const DJPlanSchema = z.object({
	intent: z.string(),
	genre: z.string(),
	bpm: z.number(),
	layers: z.array(
		z.object({
			name: z.string(),
			action: z.enum(["add", "remove", "modify", "keep"]),
			description: z.string(),
		}),
	),
	energy: z.enum(["low", "building", "peak", "breakdown"]),
	mixNote: z.string(),
});

export type DJPlan = z.infer<typeof DJPlanSchema>;

const ORCHESTRATOR_SYSTEM = `You are a seasoned DJ Pro and music director. Your job is to make musical decisions.

Given the user's intent (or an autonomous evolution trigger) and the current track state, output a structured plan. Think like a DJ: what genre, BPM, energy, which layers to add/remove/modify/keep.

For autonomous evolution (no user command), subtly advance the track — add variation, build energy, introduce new elements. Think in terms of a DJ set arc.

Be specific in layer descriptions. Instead of "add bass", say "distorted 303-style acid bass line on minor pentatonic, heavy resonance filter sweep".`;

const CODE_SYSTEM = `You are a Strudel code generator for a live DJ set. You receive a DJ plan and current track code, and output the next version as valid Strudel code.

Rules:
- Always output valid Strudel code using $: for multiple patterns
- Always include setcpm() at the top matching the plan's BPM
- Implement the plan's layer actions: add new layers, remove "remove" ones, modify "modify" ones, leave "keep" layers unchanged
- Reply ONLY with JSON: { "code": "...", "message": "..." } — no markdown fences, no explanation
  - code: the full new Strudel code
  - message: copy the plan's mixNote verbatim
- For "breakdown" energy: reduce layers, add space, lower gain
- For "peak" energy: dense patterns, high gain, heavy effects
- For "building" energy: add elements progressively

${strudelRef}`;

export async function POST(req: NextRequest) {
	const { command, currentCode, isAutoEvolve } = await req.json();

	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			// Pass 1 — DJ Pro makes musical decisions (structured, non-streamed)
			const orchestratorPrompt = [
				currentCode ? `Current track code:\n\`\`\`\n${currentCode}\n\`\`\`` : null,
				isAutoEvolve
					? "AUTONOMOUS EVOLUTION: No user command. Advance the track naturally."
					: `User command: "${command}"`,
			]
				.filter(Boolean)
				.join("\n\n");

			const { output: plan } = await generateText({
				model: google("gemini-flash-latest"),
				system: ORCHESTRATOR_SYSTEM,
				prompt: orchestratorPrompt,
				output: Output.object({ schema: DJPlanSchema }),
				temperature: 0.85,
			});

			// Send plan as message metadata so the client can show genre/bpm/energy
			writer.write({ type: "message-metadata", messageMetadata: plan });

			// Pass 2 — Code generator streams the Strudel code
			const layerInstructions = plan.layers.map((l) => `- ${l.name} [${l.action}]: ${l.description}`).join("\n");

			const codePrompt = `DJ Plan:
- Intent: ${plan.intent}
- Genre: ${plan.genre}
- BPM: ${plan.bpm}
- Energy: ${plan.energy}
- Mix note: ${plan.mixNote}

Layer instructions:
${layerInstructions}

${currentCode ? `Current code:\n\`\`\`\n${currentCode}\n\`\`\`` : "No current code — start fresh."}

Generate the Strudel code that implements this plan.`;

			const result = streamText({
				model: google("gemini-flash-latest"),
				system: CODE_SYSTEM,
				messages: [{ role: "user", content: codePrompt }],
				temperature: 0.7,
			});

			const textId = "code";
			writer.write({ type: "text-start", id: textId });
			for await (const chunk of result.textStream) {
				writer.write({ type: "text-delta", id: textId, delta: chunk });
			}
			writer.write({ type: "text-end", id: textId });
		},
		onError: (err) => {
			console.error("DJ stream error", err);
			return "Something went wrong generating the track.";
		},
	});

	return createUIMessageStreamResponse({ stream });
}
