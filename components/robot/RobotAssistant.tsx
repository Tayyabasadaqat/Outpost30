"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ChevronDown, ExternalLink, Lightbulb, MessageCircle, RefreshCw, Sparkles, X } from "lucide-react";
import RobotAvatar from "./RobotAvatar";
import RobotChat from "./RobotChat";
import { getRobotFact, getRobotHint, type RobotAnswer, type RobotContext } from "@/lib/robot/robotKnowledge";

export interface RobotAssistantProps {
  day: number;
  missionTitle?: string;
  missionDescription?: string;
  difficulty?: "safe" | "risky" | "dangerous";
  gameStatus?: string;
  visible?: boolean;
  className?: string;
}

type View = "fact" | "hint" | "chat" | null;

function isSafeNASAUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && (parsed.hostname === "nasa.gov" || parsed.hostname.endsWith(".nasa.gov"));
  } catch { return false; }
}

export default function RobotAssistant({
  day, missionTitle = "", missionDescription = "", difficulty,
  gameStatus = "playing", visible = true, className = "",
}: RobotAssistantProps) {
  const [view, setView] = useState<View>(null);
  const [bubble, setBubble] = useState(false);
  const [currentFact, setCurrentFact] = useState<RobotAnswer | null>(null);
  const [currentHint, setCurrentHint] = useState<RobotAnswer | null>(null);
  const [lastFactId, setLastFactId] = useState<string | null>(null);
  const [lastHintText, setLastHintText] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [factPaused, setFactPaused] = useState(false);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const context: RobotContext = useMemo(() => ({
    day, missionTitle, missionDescription, difficulty, gameStatus,
  }), [day, missionTitle, missionDescription, difficulty, gameStatus]);

  const clearBubbleTimers = useCallback(() => {
    if (autoTimer.current) clearTimeout(autoTimer.current);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    autoTimer.current = null;
    dismissTimer.current = null;
  }, []);

  const presentBubble = useCallback(() => {
    if (!visible) return;
    setBubble(true);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => setBubble(false), 8500);
  }, [visible]);

  // Refresh the NASA content once per mission, not on every status change.
  useEffect(() => {
    clearBubbleTimers();
    const result = getRobotFact(context, null);
    setCurrentFact(result.answer);
    setLastFactId(result.factId);
    setCurrentHint(null);
    setLastHintText(null);
    setView(null);
    setShowActions(false);
    setBubble(false);
    setFactPaused(false);
    if (visible) {
      autoTimer.current = setTimeout(() => presentBubble(), 2100);
    }
    return clearBubbleTimers;
    // Mission identity is intentionally day-based: don't reset chat/fact on prop object churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  // When the game hides ORBI, close everything immediately; reopening after a cinematic
  // does not force another interrupting popup.
  useEffect(() => {
    if (!visible) {
      clearBubbleTimers();
      setBubble(false);
      setView(null);
      setShowActions(false);
    }
  }, [visible, clearBubbleTimers]);

  const newFact = useCallback(() => {
    const result = getRobotFact(context, lastFactId);
    setCurrentFact(result.answer);
    setLastFactId(result.factId);
    setView(null);
    setShowActions(false);
    setFactPaused(false);
    presentBubble();
  }, [context, lastFactId, presentBubble]);

  const openHint = useCallback(() => {
    if (!currentHint) {
      const answer = getRobotHint(context, lastHintText);
      setCurrentHint(answer);
      setLastHintText(answer.text.replace(/^Mission hint:\s*/, ""));
    }
    setView("hint");
    setBubble(false);
    setShowActions(false);
    clearBubbleTimers();
  }, [context, currentHint, lastHintText, clearBubbleTimers]);

  const newHint = useCallback(() => {
    const answer = getRobotHint(context, lastHintText);
    setCurrentHint(answer);
    setLastHintText(answer.text.replace(/^Mission hint:\s*/, ""));
  }, [context, lastHintText]);

  if (!visible) return null;

  return (
    <div className={`pointer-events-none fixed bottom-3 right-3 z-[60] flex max-w-[calc(100vw-24px)] flex-col items-end gap-2 text-white sm:bottom-5 sm:right-5 ${className}`}>
      {/* Short, automatic NASA pop-up. No dashboard and no scrolling. */}
      {bubble && !view && currentFact && !factPaused && (
        <section aria-label="ORBI NASA fact" className="pointer-events-auto w-[min(310px,calc(100vw-104px))] animate-[orbi-in_.28s_ease-out] rounded-2xl border border-[#FFC300]/35 bg-[#001D3D]/95 p-3 shadow-[0_16px_45px_#0009] backdrop-blur-xl sm:w-[320px]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#FFD60A]"><Sparkles size={14}/> ORBI says...</span>
            <button type="button" onClick={() => { setBubble(false); clearBubbleTimers(); }} aria-label="Dismiss NASA fact" className="rounded-full p-1 text-slate-300 hover:bg-white/10 hover:text-white"><X size={16}/></button>
          </div>
          <p className="text-[13px] font-medium leading-[1.5] text-white sm:text-sm">{currentFact.text}</p>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
            {isSafeNASAUrl(currentFact.sourceUrl) ? (
              <a href={currentFact.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FFD60A] hover:underline">NASA source <ExternalLink size={11}/></a>
            ) : <span className="text-[10px] text-slate-400">Space fact</span>}
            <button type="button" onClick={newFact} className="inline-flex items-center gap-1 rounded-lg bg-[#FFC300]/15 px-2 py-1.5 text-[11px] font-bold text-[#FFD60A] hover:bg-[#FFC300]/25"><RefreshCw size={12}/> Another fact</button>
          </div>
        </section>
      )}

      {/* Only one compact card is open at a time. */}
      {view && (
        <section aria-label="ORBI assistant" className="pointer-events-auto flex w-[min(340px,calc(100vw-24px))] max-h-[min(420px,calc(100dvh-105px))] flex-col overflow-hidden rounded-2xl border border-[#FFC300]/35 bg-[#001D3D]/95 shadow-[0_20px_60px_#000a] backdrop-blur-xl">
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm font-extrabold text-[#FFD60A]">
              {view === "chat" ? <MessageCircle size={16}/> : view === "hint" ? <Lightbulb size={16}/> : <BookOpen size={16}/>}
              {view === "chat" ? "ASK ORBI" : view === "hint" ? "MISSION HINT" : "NASA FACT"}
            </span>
            <button type="button" aria-label="Close ORBI panel" onClick={() => setView(null)} className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10"><X size={18}/></button>
          </div>
          {view === "chat" ? (
            <RobotChat context={context} className="h-[310px] max-h-[42dvh] border-0"/>
          ) : (
            <div className="overflow-y-auto p-4">
              <p className="text-sm leading-relaxed text-slate-100">{view === "hint" ? currentHint?.text ?? "Try exploring your mission!" : currentFact?.text ?? "Ready for a Moon fact?"}</p>
              {view === "fact" && isSafeNASAUrl(currentFact?.sourceUrl) && (
                <a href={currentFact!.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFD60A] hover:underline">NASA source <ExternalLink size={12}/></a>
              )}
              <button type="button" onClick={view === "hint" ? newHint : newFact} className="mt-4 flex items-center gap-2 rounded-xl bg-[#FFC300] px-3 py-2 text-xs font-extrabold text-[#000814] hover:bg-[#FFD60A]"><RefreshCw size={14}/> {view === "hint" ? "Another hint" : "Another space fact"}</button>
            </div>
          )}
        </section>
      )}

      {/* Quick actions are only shown on demand. */}
      {showActions && !view && (
        <div className="pointer-events-auto flex flex-wrap justify-end gap-1.5 rounded-2xl border border-white/10 bg-[#000814]/95 p-2 shadow-xl">
          <button type="button" onClick={() => { setFactPaused(false); setShowActions(false); presentBubble(); }} className="flex items-center gap-1 rounded-xl bg-[#003566] px-2.5 py-2 text-xs font-bold hover:bg-[#124d80]"><Sparkles size={14} className="text-[#FFD60A]"/> Fact</button>
          <button type="button" onClick={openHint} className="flex items-center gap-1 rounded-xl bg-[#003566] px-2.5 py-2 text-xs font-bold hover:bg-[#124d80]"><Lightbulb size={14} className="text-[#FFD60A]"/> Hint</button>
          <button type="button" onClick={() => { setView("chat"); setShowActions(false); setBubble(false); clearBubbleTimers(); }} className="flex items-center gap-1 rounded-xl bg-[#FFC300] px-2.5 py-2 text-xs font-extrabold text-[#000814]"><MessageCircle size={14}/> Ask</button>
        </div>
      )}

      <div className="pointer-events-auto flex items-end gap-2">
        {!view && !showActions && !bubble && <span className="mb-3 hidden rounded-full border border-[#FFC300]/25 bg-[#001D3D]/80 px-2.5 py-1 text-[10px] font-bold text-[#FFD60A] sm:block">Tap ORBI ✨</span>}
        <button type="button" onClick={() => { if (view) { setView(null); } else { setShowActions(s => !s); setBubble(false); clearBubbleTimers(); } }} aria-label={view ? "Close ORBI" : "Open ORBI options"} aria-expanded={showActions || Boolean(view)} className="group relative grid h-[74px] w-[74px] place-items-center rounded-full border border-[#FFC300]/50 bg-[#001D3D] shadow-[0_8px_30px_#0008] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFC300] active:scale-95">
          <RobotAvatar size={61} talking={Boolean(view)}/>
          <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-[#001D3D] bg-[#FFC300] text-[#000814]">{view || showActions ? <ChevronDown size={15}/> : <Sparkles size={14}/>}</span>
        </button>
      </div>
      <style jsx>{`@keyframes orbi-in {from {opacity:0;transform:translateY(8px) scale(.96)}to {opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </div>
  );
}
