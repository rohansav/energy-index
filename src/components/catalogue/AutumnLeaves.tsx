import type { CSSProperties } from "react";

const leaves = [
  ["left", "1%", 12, "#b85d45"],
  ["right", "7%", -35, "#d5ad3f"],
  ["left", "10%", -18, "#c8a039"],
  ["right", "18%", 28, "#c8a039"],
  ["left", "22%", -30, "#bb5842"],
  ["right", "30%", 12, "#b85d45"],
  ["left", "33%", 38, "#c8a039"],
  ["right", "42%", -20, "#c8a039"],
  ["left", "44%", 18, "#b85d45"],
  ["right", "54%", -32, "#d5ad3f"],
  ["left", "55%", -28, "#c8a039"],
  ["right", "67%", 15, "#bb5842"],
  ["left", "67%", -12, "#c8a039"],
  ["left", "79%", 20, "#d5ad3f"],
  ["right", "90%", -25, "#b85d45"],
  ["right", "2%", -22, "#c8a039"],
  ["left", "16%", 35, "#d5ad3f"],
  ["right", "23%", 18, "#bb5842"],
  ["left", "38%", -15, "#d5ad3f"],
  ["right", "48%", 42, "#b85d45"],
  ["left", "60%", 25, "#bb5842"],
  ["right", "72%", -18, "#d5ad3f"],
  ["left", "85%", -35, "#b85d45"],
  ["right", "96%", 30, "#bb5842"],
  ["left", "5%", -28, "#c8a039"],
  ["right", "12%", 35, "#b85d45"],
  ["left", "27%", 20, "#bb5842"],
  ["right", "36%", -40, "#d5ad3f"],
  ["left", "49%", -42, "#d5ad3f"],
  ["right", "61%", 23, "#b85d45"],
  ["left", "73%", 30, "#bd6543"],
  ["right", "84%", -30, "#d5ad3f"],
  ["left", "94%", -18, "#d5ad3f"],
] as const;

export function AutumnLeaves() {
  return (
    <div className="autumn-leaves" aria-hidden="true">
      {leaves.map(([side, top, rotation, color], index) => (
        <svg
          key={index}
          className={`autumn-leaf autumn-leaf-${side}`}
          viewBox="0 0 64 80"
          focusable="false"
          style={
            { top, color, "--leaf-turn": `${rotation}deg` } as CSSProperties
          }
        >
          <path
            fill="currentColor"
            d="M32 4 39 22 48 15 46 32 60 28 53 43 62 47 42 57 34 63 30 63 22 57 2 47 11 42 4 28 18 32 16 15 25 22Z"
          />
          <path
            d="M32 16V74M32 43 20 32M32 48 45 36M32 57 16 49M32 57 49 49"
            fill="none"
            stroke="#775b35"
            strokeOpacity=".45"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      ))}
    </div>
  );
}
