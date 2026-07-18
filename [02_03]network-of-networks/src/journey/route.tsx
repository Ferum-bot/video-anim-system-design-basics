import {Circle, Line, Node} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, withAlpha} from '@lib';

export type SegStyle = 'radio' | 'fiber' | 'link' | 'subsea';

export interface RouteSegment {
  /** Full polyline for this hop; `points[0]` must equal the previous segment's last point. */
  points: [number, number][];
  style: SegStyle;
  accent: string;
}

// Travel pacing — a segment's draw time scales with its length, clamped for readability.
const PX_PER_SEC = 260;
const MIN_DUR = 0.9;
const MAX_DUR = 2.6;

function length(points: [number, number][]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    d += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return d;
}

function styleProps(style: SegStyle, accent: string) {
  switch (style) {
    case 'radio': return {stroke: withAlpha(accent, 0.7), lineWidth: 2, lineDash: [3, 7]};
    case 'fiber': return {stroke: accent, lineWidth: 3, lineDash: [], shadowColor: withAlpha(accent, 0.6), shadowBlur: 8};
    case 'link': return {stroke: accent, lineWidth: 2.5, lineDash: []};
    case 'subsea': return {stroke: withAlpha(accent, 0.85), lineWidth: 2.5, lineDash: [10, 8], shadowColor: withAlpha(accent, 0.4), shadowBlur: 6};
  }
}

export interface JourneyRoute {
  node: Node;
  /** Draw segment `i` and glide the packet along it. Hops are advanced in order. */
  advance(i: number): ThreadGenerator;
}

/** The connective route + the travelling packet. Segments are drawn one hop at a time. */
export function journeyRoute(segments: RouteSegment[]): JourneyRoute {
  const lines = segments.map(() => createRef<Line>());
  const packet = createRef<Circle>();
  const progress = createSignal(0);
  const start = segments[0].points[0];

  const node = (
    <Node>
      {segments.map((seg, i) => (
        <Line ref={lines[i]} points={seg.points} end={0} lineCap="round"
          {...styleProps(seg.style, seg.accent)}/>
      ))}
      <Circle ref={packet} x={start[0]} y={start[1]} size={15} fill={colors.primary}
        shadowColor={colors.primary} shadowBlur={16} opacity={0}/>
    </Node>
  );

  function* advance(i: number): ThreadGenerator {
    const seg = lines[i]();
    if (i === 0) yield* packet().opacity(1, 0.2);
    packet().fill(segments[i].accent).shadowColor(segments[i].accent);
    progress(0);
    packet().position(() => seg.getPointAtPercentage(progress()).position);
    const dur = Math.max(MIN_DUR, Math.min(MAX_DUR, length(segments[i].points) / PX_PER_SEC));
    yield* all(
      seg.end(1, dur, easeInOutCubic),
      progress(1, dur, easeInOutCubic),
    );
  }

  return {node, advance};
}
