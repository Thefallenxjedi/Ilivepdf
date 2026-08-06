import type { IconColor, IconVariant } from "@/config/tools";

const SQUARE = 20;
const RADIUS = 5;
const CANVAS = 40;

const COLORS: Record<IconColor, { solid: string; soft: string }> = {
  coral: { solid: "#e86343", soft: "#f3b5a4" },
  teal: { solid: "#2f9e8b", soft: "#9bd5cb" },
  green: { solid: "#81b46a", soft: "#c6dfb8" },
  blue: { solid: "#5d81c1", soft: "#b7c8e5" },
  rose: { solid: "#d96b7e", soft: "#efc0c8" },
  indigo: { solid: "#6a6fd1", soft: "#bcbff0" },
  amber: { solid: "#d9a441", soft: "#f0d7a4" },
  slate: { solid: "#5f6f86", soft: "#b8c1ce" },
  violet: { solid: "#8b6edb", soft: "#d0c2f2" },
  navy: { solid: "#3f5aa8", soft: "#a9b7dc" },
  sky: { solid: "#4e9ad8", soft: "#b4d6ef" },
  magenta: { solid: "#c45f9b", soft: "#e6b7d2" },
};

type ToolIconProps = {
  variant: IconVariant;
  color: IconColor;
  mark?: string;
  title?: string;
  className?: string;
};

function Arrow({
  cx,
  cy,
  rotate = 0,
}: {
  cx: number;
  cy: number;
  rotate?: number;
}) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rotate})`}>
      <path d="M-3.2 -3.8 L3.4 0 L-3.2 3.8 Z" fill="#ffffff" />
    </g>
  );
}

function Square({
  x,
  y,
  fill,
}: {
  x: number;
  y: number;
  fill: string;
}) {
  return <rect x={x} y={y} width={SQUARE} height={SQUARE} rx={RADIUS} fill={fill} />;
}

function PairIcon({
  color,
  mode,
}: {
  color: IconColor;
  mode: "in" | "out";
}) {
  const { solid } = COLORS[color];
  const top = { x: 2, y: 2 };
  const bottom = { x: 18, y: 18 };
  const topRotate = mode === "in" ? 45 : 225;
  const bottomRotate = mode === "in" ? 225 : 45;

  return (
    <>
      <Square x={top.x} y={top.y} fill={solid} />
      <Square x={bottom.x} y={bottom.y} fill={solid} />
      <Arrow cx={top.x + SQUARE / 2} cy={top.y + SQUARE / 2} rotate={topRotate} />
      <Arrow
        cx={bottom.x + SQUARE / 2}
        cy={bottom.y + SQUARE / 2}
        rotate={bottomRotate}
      />
    </>
  );
}

function ClusterIcon({ color }: { color: IconColor }) {
  const { solid } = COLORS[color];
  // Same square size as pair/stack; slight overlap keeps the canvas aligned.
  const cells = [
    { x: 1, y: 1, rotate: 135 },
    { x: 19, y: 1, rotate: 225 },
    { x: 1, y: 19, rotate: 45 },
    { x: 19, y: 19, rotate: 315 },
  ];

  return (
    <>
      {cells.map((cell) => (
        <g key={`${cell.x}-${cell.y}`}>
          <Square x={cell.x} y={cell.y} fill={solid} />
          <Arrow cx={cell.x + SQUARE / 2} cy={cell.y + SQUARE / 2} rotate={cell.rotate} />
        </g>
      ))}
    </>
  );
}

function StackIcon({ color, mark = "A" }: { color: IconColor; mark?: string }) {
  const { solid, soft } = COLORS[color];
  const back = { x: 2, y: 2 };
  const front = { x: 18, y: 18 };

  return (
    <>
      <Square x={back.x} y={back.y} fill={soft} />
      <path
        d="M16 8 L22 14"
        stroke={solid}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M19.4 7.4 L22 14 L15.8 12.1" fill={solid} />
      <Square x={front.x} y={front.y} fill={solid} />
      <text
        x={front.x + SQUARE / 2}
        y={front.y + SQUARE / 2 + 4}
        textAnchor="middle"
        fill="#ffffff"
        fontSize="11"
        fontWeight="700"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        {mark}
      </text>
    </>
  );
}

export function ToolIcon({
  variant,
  color,
  mark,
  title,
  className,
}: ToolIconProps) {
  return (
    <span className={className ? `tool-icon-wrap ${className}` : "tool-icon-wrap"}>
      <svg
        className="tool-icon-svg"
        viewBox={`0 0 ${CANVAS} ${CANVAS}`}
        width={CANVAS}
        height={CANVAS}
        role="img"
        aria-hidden={title ? undefined : true}
      >
        {title ? <title>{title}</title> : null}
        {variant === "pair-in" ? <PairIcon color={color} mode="in" /> : null}
        {variant === "pair-out" ? <PairIcon color={color} mode="out" /> : null}
        {variant === "cluster" ? <ClusterIcon color={color} /> : null}
        {variant === "stack" ? <StackIcon color={color} mark={mark} /> : null}
      </svg>
    </span>
  );
}
