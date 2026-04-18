"use client"

import React, { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { ArrowUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
  role: "user" | "assistant"
  content: string
}

const mdComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ children }) => <h1 className="mb-3 mt-4 text-base font-semibold text-neutral-100">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-3 text-sm font-semibold text-neutral-200">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1 mt-3 text-sm font-medium text-neutral-200">{children}</h3>,
  p:  ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc pl-4 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal pl-4 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => <blockquote className="mb-2 border-l-2 border-neutral-700 pl-3 text-neutral-400">{children}</blockquote>,
  hr: () => <hr className="my-3 border-neutral-800" />,
  pre: ({ children }) => <pre className="mb-2">{children}</pre>,
  code: ({ children, className }) =>
    className?.includes("language-") ? (
      <code className="block rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 font-mono text-xs text-neutral-200 overflow-x-auto mb-2">{children}</code>
    ) : (
      <code className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-xs text-neutral-200">{children}</code>
    ),
  strong: ({ children }) => <strong className="font-semibold text-neutral-100">{children}</strong>,
  em:     ({ children }) => <em className="italic text-neutral-400">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} className="text-blue-400 underline hover:text-blue-300" target="_blank" rel="noopener noreferrer">{children}</a>
  ),
  table: ({ children }) => <div className="mb-2 overflow-x-auto"><table className="w-full border-collapse text-xs">{children}</table></div>,
  th: ({ children }) => <th className="border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-left font-semibold text-neutral-200">{children}</th>,
  td: ({ children }) => <td className="border border-neutral-800 px-3 py-1.5 text-neutral-300">{children}</td>,
}

function AssistantMessage({ content, streaming, onUpdate }: { content: string; streaming: boolean; onUpdate?: () => void }) {
  const [displayed, setDisplayed] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const wasStreaming = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (wasStreaming.current && !streaming && content) {
      // Stream finished — start word-by-word typewriter
      setDisplayed("")
      setIsTyping(true)

      const words = content.match(/\S+\s*/g) ?? [content]
      let i = 0

      intervalRef.current = setInterval(() => {
        i++
        setDisplayed(words.slice(0, i).join(""))
        onUpdate?.()
        if (i >= words.length) {
          clearInterval(intervalRef.current!)
          setDisplayed(content) // ensure exact final string
          setIsTyping(false)
        }
      }, 22)
    }
    wasStreaming.current = streaming
  }, [streaming, content])

  // Cleanup on unmount
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  // Collecting stream: subtle loading dots
  if (streaming) {
    return (
      <span className="flex items-center gap-1 pt-1">
        {[0, 160, 320].map((d) => (
          <span
            key={d}
            className="inline-block h-1.5 w-1.5 rounded-full bg-neutral-600"
            style={{ animation: "blink 1.2s ease-in-out infinite", animationDelay: `${d}ms` }}
          />
        ))}
      </span>
    )
  }

  if (!content) return null

  // Typing animation: render partial markdown + cursor appended
  if (isTyping) {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {displayed + "▍"}
      </ReactMarkdown>
    )
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
      {content}
    </ReactMarkdown>
  )
}

interface ChatPanelProps {
  userId: string
  onActiveChange?: (active: boolean) => void
}

export function ChatPanel({ userId, onActiveChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  function scrollToBottom() {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  async function sendMessage() {
    const text = input.trim()
    if (!text || isStreaming) return

    const userMessage: Message = { role: "user", content: text }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput("")
    setIsOpen(true)
    onActiveChange?.(true)
    setIsStreaming(true)

    setMessages([...nextMessages, { role: "assistant", content: "" }])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, messages: nextMessages }),
      })

      if (!response.ok || !response.body) throw new Error("Request failed")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: "assistant",
            content: (updated[updated.length - 1].content ?? "") + chunk,
          }
          return updated
        })
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div
      className="flex flex-col border-t border-neutral-800 bg-neutral-950 min-h-0"
      style={{
        flexGrow: isOpen ? 1 : 0,
        flexShrink: 0,
        flexBasis: "88px",
        overflow: "hidden",
        transition: "flex-grow 450ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {isOpen && (
        <>
          {messages.length > 0 && (
            <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
              <button
                onClick={() => { setIsOpen(false); onActiveChange?.(false) }}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] tracking-[0.15em] text-neutral-600 uppercase transition-colors hover:text-neutral-400"
              >
                <ChevronDown className="h-3 w-3" />
                hide chat
              </button>
            </div>
          )}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
        <div className="mx-auto flex max-w-[640px] flex-col gap-5">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "text-sm leading-relaxed",
                  msg.role === "user"
                    ? "self-end rounded-xl bg-neutral-800 px-4 py-2.5 text-neutral-100 max-w-[80%]"
                    : "self-start w-full text-neutral-300"
                )}
              >
                {msg.role === "assistant" && (
                  <span className="mb-2 block font-mono text-[10px] tracking-[0.25em] text-neutral-500 uppercase">
                    THEA
                  </span>
                )}
                {msg.role === "assistant" ? (
                  <AssistantMessage
                    content={msg.content}
                    streaming={isStreaming && i === messages.length - 1}
                    onUpdate={scrollToBottom}
                  />
                ) : (
                  msg.content
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        </>
      )}

      <div className="flex-shrink-0 flex justify-center px-6 pb-5 pt-4">
        <div className="flex w-full max-w-[640px] items-center gap-3 rounded-2xl border border-neutral-700/60 bg-neutral-900/60 px-5 py-3.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about this person…"
            disabled={isStreaming}
            className="flex-1 bg-transparent font-mono text-sm text-neutral-300 placeholder-neutral-600 outline-none disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className={cn(
              "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-colors",
              input.trim() && !isStreaming
                ? "bg-neutral-200 text-neutral-900 hover:bg-white"
                : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
            )}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
