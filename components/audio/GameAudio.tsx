
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Volume2, VolumeX } from "lucide-react";

/*
  OUTPOST 30 — GLOBAL AUDIO SYSTEM

  Original synthesized sound effects and ambient music.
  No external audio files.
  No dependency on game state or minigames.

  Available sounds:
  click, launch, mission, success, warning, complete, robot

  Custom event example:
  window.dispatchEvent(
    new CustomEvent("outpost:sound", {
      detail: "success",
    })
  );
*/

export type GameSound =
  | "click"
  | "launch"
  | "mission"
  | "success"
  | "warning"
  | "complete"
  | "robot";

let audioContext: AudioContext | null = null;
let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicStep = 0;
let audioEnabled = true;

// ==========================================
// AUDIO CONTEXT
// ==========================================

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    return audioContext;
  } catch {
    return null;
  }
}

function unlockAudio() {
  const ctx = getAudioContext();

  if (ctx?.state === "suspended") {
    void ctx.resume().catch(() => {});
  }
}

// ==========================================
// SYNTHESIZED NOTES
// ==========================================

function playNote(
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
  delay = 0,
  endFrequency?: number
) {
  if (!audioEnabled) return;

  const ctx = getAudioContext();

  if (!ctx || ctx.state !== "running") return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  const start = ctx.currentTime + delay;
  const end = start + duration;

  oscillator.type = type;

  oscillator.frequency.setValueAtTime(
    Math.max(1, frequency),
    start
  );

  if (endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(1, endFrequency),
      end
    );
  }

  gain.gain.setValueAtTime(0.0001, start);

  gain.gain.linearRampToValueAtTime(
    volume,
    start + Math.min(0.08, duration / 4)
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    end
  );

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(start);
  oscillator.stop(end + 0.02);
}

// ==========================================
// GAME SOUND EFFECTS
// ==========================================

export function playGameSound(sound: GameSound) {
  if (!audioEnabled) return;

  unlockAudio();

  switch (sound) {
    case "click":
      playNote(620, 0.07, 0.018, "sine");
      break;

    case "launch":
      playNote(180, 0.7, 0.045, "sawtooth", 0, 540);
      playNote(440, 0.45, 0.022, "sine", 0.35, 880);
      break;

    case "mission":
      playNote(392, 0.18, 0.035);
      playNote(523.25, 0.22, 0.035, "sine", 0.16);
      playNote(659.25, 0.35, 0.035, "sine", 0.32);
      break;

    case "success":
      playNote(523.25, 0.16, 0.045);
      playNote(659.25, 0.16, 0.045, "sine", 0.13);
      playNote(783.99, 0.38, 0.045, "sine", 0.27);
      break;

    case "warning":
      playNote(310, 0.2, 0.035, "triangle");
      playNote(250, 0.25, 0.035, "triangle", 0.24);
      break;

    case "complete":
      playNote(392, 0.2, 0.045);
      playNote(523.25, 0.2, 0.045, "sine", 0.18);
      playNote(659.25, 0.2, 0.045, "sine", 0.36);
      playNote(783.99, 0.55, 0.05, "sine", 0.54);
      break;

    case "robot":
      playNote(740, 0.1, 0.025, "sine", 0, 920);
      playNote(980, 0.13, 0.022, "sine", 0.12, 780);
      break;
  }
}

// ==========================================
// ORIGINAL AMBIENT BACKGROUND MUSIC
// ==========================================

// Soft, minimal space-themed chord progression.
const AMBIENT_CHORDS = [
  [174.61, 261.63, 349.23],
  [146.83, 220.0, 293.66],
  [130.81, 196.0, 261.63],
  [164.81, 246.94, 329.63],
];

function playAmbientChord() {
  if (!audioEnabled) return;

  const chord =
    AMBIENT_CHORDS[musicStep % AMBIENT_CHORDS.length];

  chord.forEach((frequency, index) => {
    playNote(
      frequency,
      4.0,
      0.006,
      "sine",
      index * 0.08
    );
  });

  // A gentle high-frequency sparkle.
  if (musicStep % 2 === 0) {
    playNote(
      chord[1] * 2,
      1.4,
      0.004,
      "sine",
      0.55
    );
  }

  musicStep++;
}

function startMusic() {
  if (!audioEnabled || musicTimer) return;

  const ctx = getAudioContext();

  if (!ctx || ctx.state !== "running") return;

  playAmbientChord();

  musicTimer = setInterval(() => {
    playAmbientChord();
  }, 4400);
}

function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

// ==========================================
// GLOBAL AUDIO COMPONENT
// ==========================================

export default function GameAudio() {
  const pathname = usePathname();

  const [enabled, setEnabled] = useState(true);

  // Restore saved audio preference.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        "outpost30_audio_enabled"
      );

      if (saved === "false") {
        audioEnabled = false;
        setEnabled(false);
      }
    } catch {
      // Continue with default preference.
    }

    return () => {
      stopMusic();
    };
  }, []);

  // Start audio after the first user interaction.
  useEffect(() => {
    function handleInteraction(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Element)) return;

      // Mute button has its own handler.
      if (
        target.closest("[data-outpost-audio-toggle]")
      ) {
        return;
      }

      unlockAudio();

      if (!audioEnabled) return;

      startMusic();

      const button = target.closest(
        "button, a, [role='button']"
      );

      if (button) {
        const link = button.closest("a");

        if (
          link?.getAttribute("href") === "/welcome"
        ) {
          playGameSound("launch");
        } else {
          playGameSound("click");
        }
      }
    }

    document.addEventListener(
      "pointerdown",
      handleInteraction,
      true
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleInteraction,
        true
      );
    };
  }, []);

  // Play mission start sound when entering /game.
  useEffect(() => {
    if (pathname !== "/game" || !audioEnabled) {
      return;
    }

    // The sound plays only if audio has already
    // been unlocked by a user interaction.
    const ctx = audioContext;

    if (ctx?.state === "running") {
      playGameSound("mission");
    }
  }, [pathname]);

  // Listen for future game events.
  useEffect(() => {
    function handleSound(event: Event) {
      const customEvent = event as CustomEvent<GameSound>;

      const allowed: GameSound[] = [
        "click",
        "launch",
        "mission",
        "success",
        "warning",
        "complete",
        "robot",
      ];

      if (allowed.includes(customEvent.detail)) {
        playGameSound(customEvent.detail);
      }
    }

    window.addEventListener(
      "outpost:sound",
      handleSound
    );

    return () => {
      window.removeEventListener(
        "outpost:sound",
        handleSound
      );
    };
  }, []);

  // Mute/unmute all sounds.
  function toggleAudio() {
    const next = !enabled;

    audioEnabled = next;
    setEnabled(next);

    try {
      localStorage.setItem(
        "outpost30_audio_enabled",
        String(next)
      );
    } catch {
      // Audio continues without saved preferences.
    }

    if (next) {
      unlockAudio();
      startMusic();
      playGameSound("success");
    } else {
      stopMusic();

      // Suspend the context to immediately mute
      // any notes that are still playing.
      if (audioContext) {
        void audioContext.suspend().catch(() => {});
      }
    }
  }

  return (
    <button
      type="button"
      data-outpost-audio-toggle
      onClick={toggleAudio}
      aria-label={
        enabled ? "Mute game audio" : "Enable game audio"
      }
      title={enabled ? "Mute sound" : "Enable sound"}
      className="fixed bottom-5 left-5 z-[100] flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#001D3D]/85 text-[#FFC300] shadow-lg backdrop-blur-md transition hover:border-[#FFC300]/60 hover:bg-[#003566]"
    >
      {enabled ? (
        <Volume2 size={18} />
      ) : (
        <VolumeX size={18} />
      )}
    </button>
  );
}