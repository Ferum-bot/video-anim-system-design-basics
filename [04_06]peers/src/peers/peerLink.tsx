import {Circle, Line, Node, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  easeInOutCubic,
  easeOutCubic,
  linear,
  waitFor,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// Ядро части. Пунктирный «разговор» пиров и фактическая траектория данных — это **одна и
// та же ломаная**: её средние точки лежат на сигнале `bend`. На реплике «ни один байт не
// летит горизонтально» прямая провисает в лифт-провод-лифт и утаскивает за собой пакет.
// Виртуальная линия не сменяется физической — она на глазах оказывается ею же,
// только распрямлённой.
const PACKET = {radius: 8} as const;
const BEND_TIME = 1.4;

export interface PeerLinkOptions {
  /** Где линия начинается, пока она только «разговор»: внутренние кромки верхних плит. */
  inner: number;
  /** Куда она дотягивается, оказавшись физическим путём: центры стопок. */
  center: number;
  topY: number;
  /** Куда провисает середина: уровень провода под стопками. */
  wireY: number;
}

export interface PeerLink {
  readonly node: Node;
  /** Пунктир между пирами: они считают, что говорят напрямую. */
  connect(): ThreadGenerator;
  /** Один проход пакета по текущей траектории. */
  send(duration: number): ThreadGenerator;
  /** Бесконечная отправка — форкать через `yield`. */
  run(duration: number): ThreadGenerator;
  /** «Ни один байт не летит горизонтально»: прямая провисает в лифт. */
  bendDown(): ThreadGenerator;
  /** «Виртуальное — пунктиром, физическое — сплошной»: возвращается прямой пунктир. */
  showVirtual(): ThreadGenerator;
}

/** Разговор пиров и путь, которым он на самом деле идёт. */
export function peerLink({inner, center, topY, wireY}: PeerLinkOptions): PeerLink {
  const path = createRef<Line>();
  const ghost = createRef<Line>();
  const wireLabel = createRef<Txt>();
  const bend = createSignal(0); // 0 — прямая, 1 — лифт вниз, провод, лифт вверх
  const reach = createSignal(0); // 0 — линия только в зазоре, 1 — дотянулась в машины
  const travel = createSignal(0);
  const solid = createSignal(0); // 0 — пунктир, 1 — сплошная

  const accent = colors.cyan;
  const drop = () => topY + (wireY - topY) * bend();
  // Пока это «разговор», линия живёт строго в зазоре и не лезет на плиты; на сгибе она
  // дотягивается до центров стопок — и только тогда проваливается вниз.
  const endX = () => inner + (center - inner) * reach();

  const points = () => [
    [-endX(), topY],
    [-endX(), drop()],
    [endX(), drop()],
    [endX(), topY],
  ] as [number, number][];

  // Пакет идёт по длине ломаной, а не по индексу сегмента: пока линия прямая, средние
  // сегменты нулевые, и он просто едет слева направо.
  const spanH = () => drop() - topY;
  const spanW = () => 2 * endX();
  const total = () => spanW() + 2 * spanH();

  const at = (axis: 'x' | 'y') => () => {
    const d = travel() * total();
    const h = spanH();
    const w = spanW();
    if (d <= h) return axis === 'x' ? -endX() : topY + d;
    if (d <= h + w) return axis === 'x' ? -endX() + (d - h) : drop();
    return axis === 'x' ? endX() : drop() - (d - h - w);
  };

  const node = (
    <Node>
      <Line ref={path} points={points}
        stroke={() => withAlpha(accent, 0.4 + solid() * 0.45)}
        lineWidth={() => 1.8 + solid() * 0.8}
        lineDash={() => (solid() > 0.5 ? [] : [9, 8])}
        opacity={0}/>

      {/* Второй слой: он приезжает уже после того, как первый согнулся. */}
      <Line ref={ghost} points={[[-inner, topY], [inner, topY]]}
        stroke={withAlpha(accent, 0.45)} lineWidth={1.8} lineDash={[9, 8]} opacity={0}/>

      <Txt ref={wireLabel} y={wireY - 22} text="ПО ПРОВОДУ" fill={colors.textMuted}
        fontSize={15} fontFamily={fonts.mono} letterSpacing={1.3}
        opacity={() => bend() * 0.9}/>

      <Circle width={PACKET.radius * 2} height={PACKET.radius * 2} fill={accent}
        shadowColor={withAlpha(accent, 0.8)} shadowBlur={14}
        x={at('x')} y={at('y')}
        opacity={() => Math.sin(Math.PI * travel())}/>
    </Node>
  );

  function* connect(): ThreadGenerator {
    yield* path().opacity(1, 0.5, easeOutCubic);
  }

  function* send(duration: number): ThreadGenerator {
    travel(0);
    yield* travel(1, duration, linear);
  }

  function* run(duration: number): ThreadGenerator {
    while (true) {
      yield* send(duration);
      yield* waitFor(0.4);
    }
  }

  function* bendDown(): ThreadGenerator {
    yield* reach(1, 0.5, easeInOutCubic);
    yield* all(
      bend(1, BEND_TIME, easeInOutCubic),
      solid(1, BEND_TIME * 0.6, easeOutCubic),
    );
  }

  function* showVirtual(): ThreadGenerator {
    yield* ghost().opacity(1, 0.5, easeOutCubic);
  }

  return {node, connect, send, run, bendDown, showVirtual};
}
