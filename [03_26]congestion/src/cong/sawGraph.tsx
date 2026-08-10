import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  clamp,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeOutCubic,
  linear,
  range,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// График скорости во времени, который рисует сам себя: медленный старт, потом «растём
// понемногу — на потере режем пополам», и пила появляется как след, а не как готовая картинка.
// Потом та же пила размножается в сетку чужих соединений.
const PLOT = {width: 720, height: 260} as const;
const CEIL_LABEL_Y = -150;
const CHIP_Y = -192;
const TIME_LABEL_Y = 152;
const TEETH = 6;
const RISE_X = 92; // ширина одного разгона
const START_X = -PLOT.width / 2;
const START_RATE = 0.03;
const SLOW_RATE = 0.52; // куда доходит медленный старт
const DROP_RATE = 0.5; // «режем пополам»

const TILE = {width: 132, height: 56, gapX: 12, gapY: 10, cols: 6, rows: 4} as const;
const TILES = TILE.cols * TILE.rows;
const MINE = 2; // чьё соединение подсвечено — верхний ряд, чтобы подпись встала над ним
const SAMPLES = 40;
const CYCLES = 2.4;
const PLATE_Y = 178;

const IN = 0.7;
const LIGHT = 0.45;
const PHASE_PERIOD = 3.4;

const rateY = (rate: number) => PLOT.height / 2 - rate * PLOT.height;
const frac = (value: number) => value - Math.floor(value);

/** Ломаная целиком: медленный старт, потом зубья «разгон — потеря — сброс вдвое». */
function buildPath(): {points: [number, number][]; peaks: number[]} {
  const points: [number, number][] = [];
  const peaks: number[] = [];
  for (const step of range(9)) {
    const t = step / 8;
    points.push([START_X + RISE_X * t, START_RATE * Math.pow(SLOW_RATE / START_RATE, t)]);
  }
  let x = START_X + RISE_X;
  let rate = SLOW_RATE;
  for (const _ of range(TEETH)) {
    x += RISE_X;
    points.push([x, 1]);
    peaks.push(points.length - 1);
    points.push([x, DROP_RATE]);
    rate = DROP_RATE;
  }
  // Хвост: последний разгон обрывается ровно на правом краю кадра.
  points.push([PLOT.width / 2, rate + (0.5 * (PLOT.width / 2 - x)) / RISE_X]);
  return {points, peaks};
}

const {points: PATH, peaks: PEAKS} = buildPath();

/** Доли длины ломаной — по ним и рисуется линия, и всплывают крестики потерь. */
function buildFractions(): {atIndex: number[]; total: number} {
  const atIndex = [0];
  let total = 0;
  for (const i of range(PATH.length - 1)) {
    const [x1, r1] = PATH[i];
    const [x2, r2] = PATH[i + 1];
    total += Math.hypot(x2 - x1, rateY(r2) - rateY(r1));
    atIndex.push(total);
  }
  return {atIndex: atIndex.map(value => value / total), total};
}

const {atIndex: FRACTION} = buildFractions();
/** Конец медленного старта = 0, дальше по одному зубу. */
const STAGE = [FRACTION[8], ...PEAKS.map(index => FRACTION[index + 1]), 1];

export interface SawGraph extends Widget {
  /** Дорисовать график до конца ступени: 0 — медленный старт, дальше по зубьям. */
  draw(stage: number, duration: number): ThreadGenerator;
  /** Подпись над графиком. */
  retitle(text: string): ThreadGenerator;
  /** Одна пила превращается в сетку чужих соединений. */
  toGrid(y: number): ThreadGenerator;
  /** Endless: все пилы едут — **fork** it. */
  run(): ThreadGenerator;
  /** Остальные соединения проступают вокруг твоего. */
  crowd(): ThreadGenerator;
  /** Плита с выводом под сеткой. */
  say(text: string): ThreadGenerator;
}

/** Пила AIMD и её тысячи копий. */
export function sawGraph({y}: {y: number}): SawGraph {
  const group = createRef<Node>();
  const plot = createRef<Node>();
  const curve = createRef<Line>();
  const chip = createRef<Rect>();
  const chipLabel = createRef<Txt>();
  const grid = createRef<Node>();
  const others = createRef<Node>();
  const plate = createRef<Rect>();
  const plateLabel = createRef<Txt>();

  const accent = colors.cyan;
  const drawn = createSignal(0);
  const phase = createSignal(0);

  const tileX = (index: number) =>
    ((index % TILE.cols) - (TILE.cols - 1) / 2) * (TILE.width + TILE.gapX);
  const tileY = (index: number) =>
    (Math.floor(index / TILE.cols) - (TILE.rows - 1) / 2) * (TILE.height + TILE.gapY);
  const speed = (index: number) => 0.7 + (((index * 37) % 13) / 13) * 0.9;
  const offset = (index: number) => ((index * 53) % 17) / 17;

  /** Пила внутри плитки: та же форма, только едет и уже без объяснений. */
  const tileSaw = (index: number) => () =>
    range(SAMPLES + 1).map(k => {
      const u = k / SAMPLES;
      const rate = 0.42 + 0.5 * frac(u * CYCLES + phase() * speed(index) + offset(index));
      const inner = TILE.height - 16;
      return [
        -TILE.width / 2 + 10 + (TILE.width - 20) * u,
        inner / 2 - rate * inner,
      ] as [number, number];
    });

  const node = (
    <Node ref={group} y={y} opacity={0}>
      <Node ref={plot}>
        <Line points={[[START_X, rateY(0)], [PLOT.width / 2, rateY(0)]]}
          stroke={withAlpha(colors.textMuted, 0.5)} lineWidth={1.6}/>
        <Line points={[[START_X, rateY(0)], [START_X, rateY(1.05)]]}
          stroke={withAlpha(colors.textMuted, 0.5)} lineWidth={1.6}/>
        <Line points={[[START_X, rateY(1)], [PLOT.width / 2, rateY(1)]]}
          stroke={withAlpha(colors.red, 0.45)} lineWidth={2} lineDash={[10, 8]}/>
        <Txt offset={[1, 0]} x={PLOT.width / 2} y={CEIL_LABEL_Y} text="ПРОПУСКНАЯ СПОСОБНОСТЬ"
          fill={withAlpha(colors.red, 0.8)} fontSize={16} fontFamily={fonts.mono}
          letterSpacing={1.2}/>
        <Txt offset={[-1, 0]} x={START_X} y={CEIL_LABEL_Y} text="СКОРОСТЬ" fill={colors.textMuted}
          fontSize={16} fontFamily={fonts.mono} letterSpacing={1.2}/>
        <Txt offset={[1, 0]} x={PLOT.width / 2} y={TIME_LABEL_Y} text="ВРЕМЯ"
          fill={colors.textMuted} fontSize={16} fontFamily={fonts.mono} letterSpacing={1.2}/>

        <Line ref={curve} points={PATH.map(([x, rate]) => [x, rateY(rate)])} stroke={accent}
          lineWidth={3} lineJoin="round" end={0}/>

        {PEAKS.map(index => (
          <Node x={PATH[index][0]} y={rateY(1)}
            opacity={() => clamp(0, 1, (drawn() - FRACTION[index]) / 0.015)}>
            <Line points={[[-9, -9], [9, 9]]} stroke={colors.red} lineWidth={2.6}
              lineCap="round"/>
            <Line points={[[9, -9], [-9, 9]]} stroke={colors.red} lineWidth={2.6}
              lineCap="round"/>
          </Node>
        ))}

        <Rect ref={chip} offset={[-1, 0]} x={START_X} y={CHIP_Y} width={306} height={44}
          radius={10} fill={withAlpha(accent, 0.12)} stroke={withAlpha(accent, 0.8)}
          lineWidth={1.6} opacity={0}>
          <Txt ref={chipLabel} text="МЕДЛЕННЫЙ СТАРТ" fill={accent} fontSize={19}
            fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.3}/>
        </Rect>
      </Node>

      <Node ref={grid} opacity={0} scale={0.94}>
        <Node ref={others} opacity={0}>
          {range(TILES).filter(index => index !== MINE).map(index => (
            <Rect x={tileX(index)} y={tileY(index)} width={TILE.width} height={TILE.height}
              radius={8} fill={withAlpha(colors.surface, 0.7)}
              stroke={withAlpha(colors.textMuted, 0.35)} lineWidth={1.2}>
              <Line points={tileSaw(index)} stroke={withAlpha(colors.textMuted, 0.85)}
                lineWidth={1.8} lineJoin="round"/>
            </Rect>
          ))}
        </Node>
        <Rect x={tileX(MINE)} y={tileY(MINE)} width={TILE.width} height={TILE.height} radius={8}
          fill={withAlpha(accent, 0.12)} stroke={withAlpha(accent, 0.9)} lineWidth={1.8}>
          <Line points={tileSaw(MINE)} stroke={accent} lineWidth={2.2} lineJoin="round"/>
        </Rect>
        <Txt x={tileX(MINE)} y={tileY(MINE) - TILE.height / 2 - 18} text="ТВОЁ СОЕДИНЕНИЕ"
          fill={accent} fontSize={15} fontFamily={fonts.mono} letterSpacing={1.2}/>
      </Node>

      <Rect ref={plate} y={PLATE_Y} width={606} height={62} radius={12}
        fill={withAlpha(colors.orange, 0.12)} stroke={withAlpha(colors.orange, 0.8)}
        lineWidth={1.6} opacity={0}>
        <Txt ref={plateLabel} text="" fill={colors.orange} fontSize={20} fontFamily={fonts.mono}
          fontWeight={600} letterSpacing={1.2}/>
      </Rect>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(group().opacity(1, IN, easeOutCubic), chip().opacity(1, LIGHT, easeOutCubic));
  }

  function* draw(stage: number, duration: number): ThreadGenerator {
    const target = STAGE[Math.min(stage, STAGE.length - 1)];
    yield* all(
      curve().end(target, duration, stage === 0 ? easeOutCubic : linear),
      drawn(target, duration, stage === 0 ? easeOutCubic : linear),
    );
  }

  function* retitle(text: string): ThreadGenerator {
    yield* chipLabel().opacity(0, 0.2, easeInOutCubic);
    chipLabel().text(text);
    yield* chipLabel().opacity(1, 0.35, easeOutCubic);
  }

  function* toGrid(gridY: number): ThreadGenerator {
    yield* all(
      plot().opacity(0, 0.55, easeInOutCubic),
      plot().scale(0.9, 0.55, easeInOutCubic),
      group().y(gridY, 0.7, easeInOutCubic),
      delay(0.3, all(
        grid().opacity(1, 0.6, easeOutCubic),
        grid().scale(1, 0.6, easeOutCubic),
      )),
    );
  }

  function* run(): ThreadGenerator {
    while (true) {
      phase(0);
      yield* phase(1, PHASE_PERIOD, linear);
    }
  }

  function* crowd(): ThreadGenerator {
    yield* others().opacity(1, 0.8, easeOutCubic);
  }

  function* say(text: string): ThreadGenerator {
    if (plate().opacity() > 0) yield* plateLabel().opacity(0, 0.2, easeInOutCubic);
    plateLabel().text(text);
    yield* all(plate().opacity(1, LIGHT, easeOutCubic), plateLabel().opacity(1, 0.35, easeOutCubic));
  }

  return {node, appear, draw, retitle, toGrid, run, crowd, say};
}
