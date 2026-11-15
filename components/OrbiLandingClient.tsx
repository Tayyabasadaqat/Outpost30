
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import RobotAssistant from "@/components/robot/RobotAssistant";

export default function OrbiLandingClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <RobotAssistant
        day={1}
        missionTitle="Welcome to OUTPOST 30"
        missionDescription="Get ready for your 30-day lunar survival adventure!"
      />
    </div>,
    document.body
  );
}