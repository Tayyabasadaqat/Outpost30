
"use client";

/* ==========================================
   OUTPOST 30 — ORBI ROBOT CHAT

   Child-friendly mission chat interface
   API support + offline knowledge fallback
   ========================================== */

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  Send,
  Sparkles,
  Loader2,
  ExternalLink,
  MessageCircle,
} from "lucide-react";

import {
  processRobotRequest,
  type RobotContext,
  type RobotAnswer,
  type RobotKnowledgeResult,
} from "@/lib/robot/robotKnowledge";

// ==========================================
// TYPES
// ==========================================

type ChatMessage = {
  id: number;
  role: "user" | "robot";
  text: string;
  sourceTitle?: string;
  sourceUrl?: string;
};

interface RobotChatProps {
  context: RobotContext;
  className?: string;
}

// ==========================================
// SUGGESTED QUESTIONS
// ==========================================

const QUICK_QUESTIONS = [
  "What is my mission?",
  "Give me a hint",
  "Tell me a NASA fact",
  "Why is the Moon different from Earth?",
];

// ==========================================
// SAFE RESPONSE HANDLING
// ==========================================

function isRobotAnswer(
  value: unknown
): value is RobotAnswer {
  if (!value || typeof value !== "object") {
    return false;
  }

  const answer = value as Partial<RobotAnswer>;

  return (
    typeof answer.text === "string" &&
    answer.text.length > 0 &&
    [
      "answer",
      "hint",
      "fact",
      "fallback",
    ].includes(answer.type ?? "")
  );
}

function isSafeNASAUrl(url?: string): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);

    return (
      parsed.protocol === "https:" &&
      (
        parsed.hostname === "nasa.gov" ||
        parsed.hostname.endsWith(".nasa.gov")
      )
    );
  } catch {
    return false;
  }
}

// ==========================================
// CHAT COMPONENT
// ==========================================

export default function RobotChat({
  context,
  className = "",
}: RobotChatProps) {
  const [messages, setMessages] = useState<
    ChatMessage[]
  >([
    {
      id: 0,
      role: "robot",
      text:
        "Beep boop! I'm ORBI, your Moon mission buddy! " +
        "Ask me about today's mission, NASA, or space science!",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(1);
  const requestRef = useRef(0);
  const mountedRef = useRef(true);

  // Prevent stale responses after unmounting.
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
    };
  }, []);

  // Scroll chat as new messages arrive.
  useEffect(() => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollTop =
      scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // Mission changes invalidate in-flight answers.
  useEffect(() => {
    requestRef.current += 1;
    setLoading(false);
    setMessages([
      {
        id: nextIdRef.current++,
        role: "robot",
        text:
          `We're now on Day ${context.day}! ` +
          `Ask me about ${
            context.missionTitle || "your mission"
          }, or tap a question below.`,
      },
    ]);
    setInput("");
  }, [context.day, context.missionTitle]);

  function addMessage(
    role: "user" | "robot",
    text: string,
    answer?: RobotAnswer
  ) {
    const message: ChatMessage = {
      id: nextIdRef.current++,
      role,
      text,
      sourceTitle: answer?.sourceTitle,
      sourceUrl: answer?.sourceUrl,
    };

    setMessages((previous) => [
      ...previous,
      message,
    ]);
  }

  // ========================================
  // ASK ORBI
  // ========================================

  async function askQuestion(rawQuestion: string) {
    const question = rawQuestion.trim();

    if (!question || loading) return;

    const safeQuestion = question.slice(0, 500);

    addMessage("user", safeQuestion);
    setInput("");
    setLoading(true);

    const requestId = ++requestRef.current;

    let answer: RobotAnswer;

    try {
      // Optional API: implemented in File 6.
      const response = await fetch("/api/robot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "question",
          context,
          question: safeQuestion,
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error("Robot API unavailable");
      }

      const data: RobotKnowledgeResult =
        await response.json();

      if (
        !data.success ||
        !isRobotAnswer(data.response)
      ) {
        throw new Error("Invalid robot response");
      }

      answer = data.response;
    } catch {
      // OFFLINE FALLBACK:
      // Still answers using our curated facts.
      answer = processRobotRequest(
        "question",
        context,
        { question: safeQuestion }
      ).response;
    }

    // Ignore responses from a previous mission.
    if (
      !mountedRef.current ||
      requestId !== requestRef.current
    ) {
      return;
    }

    addMessage("robot", answer.text, answer);
    setLoading(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void askQuestion(input);
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl bg-[#001D3D] text-white ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-3">
        <MessageCircle
          size={17}
          className="text-[#FFD60A]"
        />

        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">
            Ask ORBI
          </p>
          <p className="text-[11px] text-slate-300">
            Day {context.day} • Mission assistant
          </p>
        </div>

        <span className="ml-auto rounded-full bg-[#FFC300]/10 px-2 py-1 text-[10px] font-medium text-[#FFD60A]">
          NASA Learning
        </span>
      </div>

      {/* Conversation messages */}
      <div
        ref={scrollRef}
        role="log"
        aria-label="Conversation with ORBI"
        aria-live="polite"
        aria-relevant="additions"
        className="flex min-h-[130px] max-h-[240px] flex-1 flex-col gap-3 overflow-y-auto px-3 py-3"
      >
        {messages.map((message) => {
          const isRobot = message.role === "robot";

          return (
            <div
              key={message.id}
              className={`flex ${
                isRobot
                  ? "justify-start"
                  : "justify-end"
              }`}
            >
              <div
                className={`max-w-[92%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed sm:text-sm ${
                  isRobot
                    ? "rounded-tl-sm border border-white/10 bg-[#003566] text-slate-100"
                    : "rounded-tr-sm bg-[#FFC300] text-[#000814]"
                }`}
              >
                {isRobot && (
                  <div className="mb-1 flex items-center gap-1 text-[10px] font-bold tracking-wide text-[#FFD60A]">
                    <Sparkles size={11} />
                    ORBI
                  </div>
                )}

                {/* Plain text: no HTML injection */}
                <p className="whitespace-pre-wrap break-words">
                  {message.text}
                </p>

                {isRobot &&
                  message.sourceUrl &&
                  isSafeNASAUrl(
                    message.sourceUrl
                  ) && (
                    <a
                      href={message.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#FFD60A] underline underline-offset-2 hover:text-white"
                    >
                      {message.sourceTitle ||
                        "NASA source"}
                      <ExternalLink size={11} />
                    </a>
                  )}
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {loading && (
          <div
            role="status"
            className="flex items-center gap-2 self-start rounded-xl bg-[#003566] px-3 py-2 text-xs text-slate-200"
          >
            <Loader2
              size={14}
              className="animate-spin text-[#FFD60A]"
            />
            ORBI is thinking...
          </div>
        )}
      </div>

      {/* Quick questions */}
      <div className="border-t border-white/10 px-3 py-2">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">
          Try asking
        </p>

        <div className="flex flex-wrap gap-1.5">
          {QUICK_QUESTIONS.map((question) => (
            <button
              key={question}
              type="button"
              disabled={loading}
              onClick={() =>
                void askQuestion(question)
              }
              className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] text-slate-200 transition hover:border-[#FFC300]/60 hover:bg-[#003566] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-white/10 bg-[#00152d] p-3"
      >
        <label
          htmlFor="orbi-question"
          className="sr-only"
        >
          Ask ORBI a question
        </label>

        <input
          id="orbi-question"
          type="text"
          value={input}
          onChange={(event) =>
            setInput(event.target.value)
          }
          maxLength={500}
          disabled={loading}
          placeholder="Ask about your mission..."
          autoComplete="off"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#003566] px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-400 focus:border-[#FFC300] disabled:opacity-60 sm:text-sm"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFC300] text-[#000814] transition hover:bg-[#FFD60A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD60A] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <Loader2
              size={17}
              className="animate-spin"
            />
          ) : (
            <Send size={17} />
          )}
        </button>
      </form>

      <div className="bg-[#00152d] px-3 pb-2 text-center">
        <p className="text-[10px] text-slate-400">
          ORBI uses educational facts and
          mission hints, not live human
          Mission Control.
        </p>
      </div>
    </div>
  );
}