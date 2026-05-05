import { NextRequest, NextResponse } from 'next/server';

// Placeholder response until Claude API is wired up
export async function POST(req: NextRequest) {
  const { command } = await req.json();

  // TODO: call Claude API with the command and current code context
  // For now, echo back a placeholder
  return NextResponse.json({
    message: `Got: "${command}" — AI not connected yet. Wire up Claude in this route.`,
    code: null,
  });
}
