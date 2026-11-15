
"use client";

import { useId } from "react";

interface RobotAvatarProps {
  size?: number;
  talking?: boolean;
  className?: string;
}

export default function RobotAvatar({
  size = 90,
  talking = false,
  className = "",
}: RobotAvatarProps) {
  const id = useId().replace(/:/g, "");

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
      }}
      aria-label="ORBI, your lunar mission companion"
      role="img"
    >
      {/* Soft glow behind robot */}
      <div
        className="absolute inset-[12%] rounded-full bg-[#FFC300]/15 blur-xl"
        aria-hidden="true"
      />

      {/* Floating robot */}
      <div
        className="relative h-full w-full"
        style={{
          animation: "orbi-float 3.5s ease-in-out infinite",
        }}
      >
        <svg
          viewBox="0 0 160 160"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id={`${id}-body`}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="55%" stopColor="#DCEAF7" />
              <stop offset="100%" stopColor="#8DA9C5" />
            </linearGradient>

            <linearGradient
              id={`${id}-face`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#003566" />
              <stop offset="100%" stopColor="#000814" />
            </linearGradient>

            <filter id={`${id}-glow`}>
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {/* Antenna */}
          <path
            d="M80 35 V19"
            stroke="#B8CADB"
            strokeWidth="6"
            strokeLinecap="round"
          />

          <circle
            cx="80"
            cy="16"
            r="7"
            fill="#FFC300"
          >
            <animate
              attributeName="opacity"
              values="1;0.45;1"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Side ears */}
          <rect
            x="17"
            y="65"
            width="18"
            height="35"
            rx="9"
            fill="#8DA9C5"
          />

          <rect
            x="125"
            y="65"
            width="18"
            height="35"
            rx="9"
            fill="#8DA9C5"
          />

          <rect
            x="20"
            y="72"
            width="8"
            height="20"
            rx="4"
            fill="#FFC300"
          />

          <rect
            x="132"
            y="72"
            width="8"
            height="20"
            rx="4"
            fill="#FFC300"
          />

          {/* Main head */}
          <rect
            x="28"
            y="36"
            width="104"
            height="85"
            rx="35"
            fill={`url(#${id}-body)`}
            stroke="#EDF6FF"
            strokeWidth="3"
          />

          {/* Face screen */}
          <rect
            x="38"
            y="49"
            width="84"
            height="60"
            rx="24"
            fill={`url(#${id}-face)`}
          />

          {/* Screen highlight */}
          <path
            d="M51 60 Q80 45 109 60"
            stroke="#FFFFFF"
            strokeOpacity="0.12"
            strokeWidth="3"
            fill="none"
          />

          {/* Eye glow */}
          <ellipse
            cx="61"
            cy="78"
            rx="11"
            ry="13"
            fill="#FFD60A"
            opacity="0.25"
            filter={`url(#${id}-glow)`}
          />

          <ellipse
            cx="99"
            cy="78"
            rx="11"
            ry="13"
            fill="#FFD60A"
            opacity="0.25"
            filter={`url(#${id}-glow)`}
          />

          {/* Animated eyes */}
          <g className="orbi-eyes">
            <rect
              x="54"
              y="68"
              width="14"
              height="21"
              rx="7"
              fill="#FFD60A"
            />

            <rect
              x="92"
              y="68"
              width="14"
              height="21"
              rx="7"
              fill="#FFD60A"
            />
          </g>

          {/* Animated mouth */}
          {talking ? (
            <g>
              <rect
                x="72"
                y="96"
                width="16"
                height="6"
                rx="3"
                fill="#FFC300"
              >
                <animate
                  attributeName="height"
                  values="4;9;4"
                  dur="0.4s"
                  repeatCount="indefinite"
                />
              </rect>
            </g>
          ) : (
            <path
              d="M73 96 Q80 103 87 96"
              stroke="#FFC300"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Neck */}
          <rect
            x="68"
            y="119"
            width="24"
            height="10"
            rx="4"
            fill="#90AFC9"
          />

          {/* Small robot body */}
          <rect
            x="49"
            y="125"
            width="62"
            height="28"
            rx="14"
            fill={`url(#${id}-body)`}
            stroke="#EDF6FF"
            strokeWidth="2"
          />

          {/* Chest indicator */}
          <circle
            cx="80"
            cy="139"
            r="7"
            fill="#FFC300"
          >
            <animate
              attributeName="opacity"
              values="1;0.6;1"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>

      <style jsx>{`
        @keyframes orbi-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        .orbi-eyes {
          transform-box: fill-box;
          transform-origin: center;
          animation: orbi-blink 5s infinite;
        }

        @keyframes orbi-blink {
          0%,
          43%,
          47%,
          100% {
            transform: scaleY(1);
          }
          45% {
            transform: scaleY(0.08);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          div,
          .orbi-eyes {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}