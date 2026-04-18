import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { serializeUserRecord, userSelect } from "@/lib/user-store"

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("ANTHROPIC_API_KEY is not set", { status: 500 })
  }

  const anthropic = new Anthropic()
  const body = await request.json()
  const { userId, messages } = body as {
    userId: string
    messages: { role: "user" | "assistant"; content: string }[]
  }

  if (!userId || !messages?.length) {
    return NextResponse.json({ error: "Missing userId or messages" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const data = serializeUserRecord(user)

  const systemPrompt = `You are a concise intelligence analyst. Answer only from the data below — no filler, no intros, no sign-offs. Be direct and terse. Use plain prose or short bullets. No emojis. If something isn't in the data, say "not in data."

## ${data.name}
${JSON.stringify(data, null, 2)}`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          stream: true,
          system: systemPrompt,
          messages,
        })

        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
