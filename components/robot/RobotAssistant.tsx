
"use client";

/* ==========================================
   OUTPOST 30 — ORBI ROBOT ASSISTANT

   Reusable floating mission companion
   NASA facts + mission hints + robot chat

   Does not modify mission/game state.
   ========================================== */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BookOpen,
  ChevronDown,
  ExternalLink,
  Lightbulb,
  MessageCircle,
  Minimize2,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";

import RobotAvatar from "./RobotAvatar";
import RobotChat from "./RobotChat";

import {
  getRobotFact,
  getRobotHint,
  type RobotAnswer,
  type RobotContext,
} from "@/lib/robot/robotKnowledge";

// ==========================================
// PROPS
// ==========================================

export interface RobotAssistantProps {
  day: number;
  missionTitle?: string;
  missionDescription?: string;

  difficulty?: "safe" | "risky" | "dangerous";
  gameStatus?: string;

  // Hide during cinematics, emergencies, etc.
  visible?: boolean;

  className?: string;
}

type AssistantTab = "fact" | "hint" | "chat";

// ==========================================
// SOURCE LINK SAFETY
// ==========================================

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
// MAIN COMPONENT
// ==========================================

export default function RobotAssistant({
  day,
  missionTitle = "",
  missionDescription = "",
  difficulty,
  gameStatus = "playing",
  visible = true,
  className = "",
}: RobotAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] =
    useState<AssistantTab>("fact");

  const [currentFact, setCurrentFact] =
    useState<RobotAnswer | null>(null);

  const [currentHint, setCurrentHint] =
    useState<RobotAnswer | null>(null);

  const [lastFactId, setLastFactId] =
    useState<string | null>(null);

  const [lastHintText, setLastHintText] =
    useState<string | null>(null);

  const [factLoading, setFactLoading] =
    useState(false);

  const [hintLoading, setHintLoading] =
    useState(false);

  // ========================================
  // MISSION CONTEXT
  // ========================================

  const context: RobotContext = useMemo(
    () => ({
      day,
      missionTitle,
      missionDescription,
      difficulty,
      gameStatus,
    }),
    [
      day,
      missionTitle,
      missionDescription,
      difficulty,
      gameStatus,
    ]
  );

  // ========================================
  // FACT SELECTION
  // ========================================

  const selectFact = useCallback(
    (previousFactId?: string | null) => {
      setFactLoading(true);

      const result = getRobotFact(
        context,
        previousFactId
      );

      setCurrentFact(result.answer);
      setLastFactId(result.factId);

      setFactLoading(false);
    },
    [context]
  );

  // ========================================
  // HINT SELECTION
  // ========================================

  const selectHint = useCallback(
    (previousHint?: string | null) => {
      setHintLoading(true);

      const result = getRobotHint(
        context,
        previousHint
      );

      setCurrentHint(result);

      // Save the hint content to avoid
      // repeating it immediately.
      const hintText = result.text.replace(
        /^Mission hint:\s*/,
        ""
      );

      setLastHintText(hintText);
      setHintLoading(false);
    },
    [context]
  );

  // ========================================
  // AUTO UPDATE ON NEW MISSION DAY
  // ========================================

  useEffect(() => {
    const result = getRobotFact(
      {
        day,
        missionTitle,
        missionDescription,
        difficulty,
        gameStatus,
      },
      null
    );

    setCurrentFact(result.answer);
    setLastFactId(result.factId);

    setCurrentHint(null);
    setLastHintText(null);

    setActiveTab("fact");

    // Don't interrupt the player when
    // a new mission begins.
    setIsOpen(false);
  }, [
    day,
    missionTitle,
    missionDescription,
    difficulty,
    gameStatus,
  ]);

  // ========================================
  // CLOSE DURING HIDDEN GAME STATES
  // ========================================

  useEffect(() => {
    if (!visible) {
      setIsOpen(false);
    }
  }, [visible]);

  // ========================================
  // SELECT TABS
  // ========================================

  function handleTabChange(tab: AssistantTab) {
    setActiveTab(tab);

    if (tab === "fact" && !currentFact) {
      selectFact(lastFactId);
    }

    if (tab === "hint" && !currentHint) {
      selectHint(lastHintText);
    }
  }

  // ========================================
  // RETURN EARLY IF HIDDEN
  // ========================================

  if (!visible) {
    return null;
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div
      className={`pointer-events-none fixed bottom-4 right-4 z-[60] sm:bottom-6 sm:right-6 ${className}`}
    >
      {/* ====================================
          ASSISTANT PANEL
          ==================================== */}

      {isOpen && (
        <section
          aria-label="ORBI lunar mission assistant"
          className="pointer-events-auto mb-3 flex w-[min(360px,calc(100vw-24px))] max-h-[min(560px,calc(100dvh-105px))] flex-col overflow-hidden rounded-[22px] border border-[#FFC300]/30 bg-[#001D3D] text-white shadow-[0_20px_65px_rgba(0,0,0,0.55)]"
        >
          {/* HEADER */}

          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#000814] px-3 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <RobotAvatar size={44} />

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold tracking-wide text-[#FFD60A]">
                    ORBI
                  </h2>

                  <Sparkles
                    size={13}
                    className="text-[#FFC300]"
                  />
                </div>

                <p className="truncate text-[11px] text-slate-300">
                  Your lunar mission companion
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Minimize ORBI"
                title="Minimize"
                className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <Minimize2 size={16} />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close ORBI"
                title="Close"
                className="rounded-lg p-2 text-slate-300 transition hover:bg-red-500/15 hover:text-white"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* CURRENT MISSION */}

          <div className="shrink-0 border-b border-white/10 bg-[#003566]/40 px-4 py-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#FFD60A]">
                Current Mission
              </span>

              <span className="rounded-full border border-[#FFC300]/25 bg-[#FFC300]/10 px-2 py-0.5 text-[10px] font-semibold text-[#FFD60A]">
                Day {day}/30
              </span>
            </div>

            <p className="truncate text-sm font-semibold text-white">
              {missionTitle || "Lunar Operations"}
            </p>

            {missionDescription && (
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-300">
                {missionDescription}
              </p>
            )}
          </div>

          {/* TABS */}

          <div
            role="group"
            aria-label="Choose ORBI feature"
            className="grid shrink-0 grid-cols-3 gap-1.5 bg-[#001D3D] p-3"
          >
            <button
              type="button"
              onClick={() => handleTabChange("fact")}
              aria-pressed={activeTab === "fact"}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-semibold transition ${
                activeTab === "fact"
                  ? "border-[#FFC300] bg-[#FFC300] text-[#000814]"
                  : "border-white/10 bg-white/5 text-slate-200 hover:border-[#FFC300]/50"
              }`}
            >
              <BookOpen size={17} />
              NASA Fact
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("hint")}
              aria-pressed={activeTab === "hint"}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-semibold transition ${
                activeTab === "hint"
                  ? "border-[#FFC300] bg-[#FFC300] text-[#000814]"
                  : "border-white/10 bg-white/5 text-slate-200 hover:border-[#FFC300]/50"
              }`}
            >
              <Lightbulb size={17} />
              Get a Hint
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("chat")}
              aria-pressed={activeTab === "chat"}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-semibold transition ${
                activeTab === "chat"
                  ? "border-[#FFC300] bg-[#FFC300] text-[#000814]"
                  : "border-white/10 bg-white/5 text-slate-200 hover:border-[#FFC300]/50"
              }`}
            >
              <MessageCircle size={17} />
              Ask ORBI
            </button>
          </div>

          {/* CONTENT */}

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            {/* NASA FACT TAB */}

            {activeTab === "fact" && (
              <div className="rounded-2xl border border-white/10 bg-[#003566]/65 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <BookOpen
                    size={17}
                    className="text-[#FFD60A]"
                  />

                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFD60A]">
                    NASA Learning Fact
                  </h3>
                </div>

                <p
                  aria-live="polite"
                  className="text-sm leading-relaxed text-slate-100"
                >
                  {factLoading
                    ? "Finding another space fact..."
                    : currentFact?.text ??
                      "Let's explore the Moon together!"}
                </p>

                {/* NASA SOURCE */}

                {currentFact?.sourceUrl &&
                  isSafeNASAUrl(
                    currentFact.sourceUrl
                  ) && (
                    <a
                      href={currentFact.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFD60A] underline underline-offset-4 transition hover:text-white"
                    >
                      {currentFact.sourceTitle ||
                        "NASA Official Source"}
                      <ExternalLink size={12} />
                    </a>
                  )}

                <button
                  type="button"
                  disabled={factLoading}
                  onClick={() => selectFact(lastFactId)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFC300] px-3 py-2.5 text-xs font-bold text-[#000814] transition hover:bg-[#FFD60A] disabled:opacity-50"
                >
                  <RefreshCw size={15} />
                  Another NASA Fact
                </button>

                <p className="mt-3 text-center text-[10px] text-slate-400">
                  Educational NASA science, not
                  simulated game rules.
                </p>
              </div>
            )}

            {/* HINT TAB */}

            {activeTab === "hint" && (
              <div className="rounded-2xl border border-white/10 bg-[#003566]/65 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Lightbulb
                    size={17}
                    className="text-[#FFD60A]"
                  />

                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFD60A]">
                    Mission Hint
                  </h3>
                </div>

                <p
                  aria-live="polite"
                  className="text-sm leading-relaxed text-slate-100"
                >
                  {hintLoading
                    ? "Preparing your hint..."
                    : currentHint?.text ??
                      "Tap below to get a helpful mission hint!"}
                </p>

                <button
                  type="button"
                  disabled={hintLoading}
                  onClick={() => selectHint(lastHintText)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFC300] px-3 py-2.5 text-xs font-bold text-[#000814] transition hover:bg-[#FFD60A] disabled:opacity-50"
                >
                  <RefreshCw size={15} />
                  {currentHint
                    ? "Another Hint"
                    : "Give Me a Hint"}
                </button>

                <p className="mt-3 text-center text-[10px] text-slate-400">
                  OUTPOST 30 gameplay guidance,
                  not official NASA instructions.
                </p>
              </div>
            )}

            {/* CHAT TAB */}

            {activeTab === "chat" && (
              <RobotChat
                context={context}
                className="h-[310px] max-h-[45dvh] border border-white/10"
              />
            )}
          </div>

          {/* FOOTER */}

          <div className="flex shrink-0 items-center justify-between border-t border-white/10 bg-[#000814] px-4 py-2">
            <span className="text-[10px] text-slate-400">
              OUTPOST 30 Mission Companion
            </span>

            <span className="flex items-center gap-1 text-[10px] text-[#FFD60A]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFD60A]" />
              Ready
            </span>
          </div>
        </section>
      )}

      {/* ====================================
          FLOATING ROBOT BUTTON
          ==================================== */}

      <div className="pointer-events-auto flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={
            isOpen
              ? "Minimize ORBI assistant"
              : "Open ORBI assistant"
          }
          aria-expanded={isOpen}
          title={
            isOpen
              ? "Minimize ORBI"
              : "Ask ORBI for help"
          }
          className="group relative flex items-center justify-center rounded-full border border-[#FFC300]/50 bg-[#001D3D] p-1.5 shadow-[0_8px_35px_rgba(0,0,0,0.45)] transition duration-200 hover:scale-105 hover:border-[#FFD60A] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFC300] active:scale-95"
        >
          {/* Robot glow */}
          <div
            className="pointer-events-none absolute -inset-1 rounded-full bg-[#FFC300]/10 blur-lg transition group-hover:bg-[#FFC300]/20"
            aria-hidden="true"
          />

          <RobotAvatar
            size={65}
            talking={isOpen}
          />

          {/* Open / close indicator */}
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#001D3D] bg-[#FFC300] text-[#000814]">
            {isOpen ? (
              <ChevronDown size={15} />
            ) : (
              <MessageCircle size={14} />
            )}
          </span>
        </button>
      </div>
    </div>
  );
}