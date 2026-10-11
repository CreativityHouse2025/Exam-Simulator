import React from "react";

// A small activity-on-node network; the gold chain is its critical path.
const NODES = {
  a: [40, 120],
  b: [140, 60],
  c: [140, 180],
  d: [250, 40],
  e: [250, 120],
  f: [250, 200],
  g: [360, 80],
  h: [360, 170],
  i: [450, 120],
} as const;

type NodeId = keyof typeof NODES;

const EDGES: [NodeId, NodeId][] = [
  ["a", "b"],
  ["b", "d"],
  ["b", "e"],
  ["c", "f"],
  ["d", "g"],
  ["e", "h"],
  ["f", "h"],
  ["h", "i"],
];

const CRITICAL_PATH: NodeId[] = ["a", "c", "e", "g", "i"];

const NODE_WIDTH = 34;
const NODE_HEIGHT = 18;

/**
 * Muted backdrop for the track panel's band: a dot grid with a faint critical-path network on the
 * end side, fading out before it reaches the title. Purely decorative; mirrors in RTL.
 */
const TrackPanelTexture: React.FC = () => {
  const id = React.useId();
  const dotsId = `${id}-dots`;
  const fadeId = `${id}-fade`;
  const maskId = `${id}-mask`;

  const edge = ([from, to]: [NodeId, NodeId]) => {
    const [x1, y1] = NODES[from];
    const [x2, y2] = NODES[to];
    return {
      x1: x1 + NODE_WIDTH / 2,
      y1,
      x2: x2 - NODE_WIDTH / 2,
      y2,
    };
  };

  const criticalEdges = CRITICAL_PATH.slice(1).map(
    (to, i): [NodeId, NodeId] => [CRITICAL_PATH[i], to],
  );

  return (
    <svg
      aria-hidden
      // On narrow bands the network lands behind the title, so it's dimmed until md.
      className="pointer-events-none absolute inset-0 size-full opacity-30 md:opacity-70 rtl:-scale-x-100"
      preserveAspectRatio="xMaxYMid slice"
      viewBox="0 0 960 240"
    >
      <defs>
        <pattern
          id={dotsId}
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1" fill="white" fillOpacity="0.14" />
        </pattern>
        <linearGradient id={fadeId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0.3" stopColor="white" stopOpacity="0" />
          <stop offset="0.75" stopColor="white" stopOpacity="1" />
        </linearGradient>
        <mask id={maskId}>
          <rect width="960" height="240" fill={`url(#${fadeId})`} />
        </mask>
      </defs>

      <g mask={`url(#${maskId})`}>
        <rect width="960" height="240" fill={`url(#${dotsId})`} />

        <g transform="translate(480 0)" strokeWidth="1.5" fill="none">
          {EDGES.map((pair) => (
            <line
              key={pair.join("")}
              {...edge(pair)}
              stroke="white"
              strokeOpacity="0.16"
            />
          ))}
          {criticalEdges.map((pair) => (
            <line
              key={pair.join("")}
              {...edge(pair)}
              stroke="var(--primary)"
              strokeOpacity="0.55"
            />
          ))}
          {(Object.keys(NODES) as NodeId[]).map((node) => {
            const [x, y] = NODES[node];
            const isCritical = CRITICAL_PATH.includes(node);
            return (
              <rect
                key={node}
                x={x - NODE_WIDTH / 2}
                y={y - NODE_HEIGHT / 2}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx="4"
                fill="white"
                fillOpacity="0.05"
                stroke={isCritical ? "var(--primary)" : "white"}
                strokeOpacity={isCritical ? 0.6 : 0.2}
              />
            );
          })}
        </g>
      </g>
    </svg>
  );
};

export default TrackPanelTexture;
