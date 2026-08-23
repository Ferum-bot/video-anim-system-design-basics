import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, delay, easeInCubic, easeInOutCubic, easeOutCubic, range, waitFor} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Стык прикладного и транспортного крупным планом. Три термина, которых приложению знать
// не надо, **всплывают из транспортной плиты и утягиваются обратно под неё** — они не
// исчезают, они прячутся, и это ровно то, что делает абстракция.
const PLATE = {width: 560, height: 84, radius: 12} as const;
// Раскладка считается так, чтобы вся связка «чип → плита → ящик → плита» стояла по центру:
// ящик рождается в зазоре, и зазоры над ним и под ним одинаковые.
const APP_Y = -165;
const TRANSPORT_Y = 229;
const SEAM_Y = 32;

/** Термины транспорта в порядке, в котором он их называет. */
const HIDDEN = ['НУМЕРАЦИЯ БАЙТОВ', 'ОКНО ПЕРЕГРУЗКИ', 'РУКОПОЖАТИЕ'] as const;
const HIDDEN_X = [-190, 0, 190] as const;

const IN = 0.6;
const TONE = 0.45;
const SWAP = {out: 0.22, in: 0.32} as const;

export interface InterfaceStage extends Widget {
  /** На стыке загорается знак вопроса: а как он выглядит для приложения? */
  ask(): ThreadGenerator;
  /** Чип «твой протокол» над прикладной плитой — с мигающим курсором. */
  yourProtocol(): ThreadGenerator;
  /** Мигание курсора — форкать через `yield`. */
  blink(): ThreadGenerator;
  /** Термин всплывает из транспорта и тут же утягивается обратно. */
  hide(index: number): ThreadGenerator;
  /** Вопрос и подписи гаснут: на стыке сейчас появится ящик. */
  clearSeam(): ThreadGenerator;
  /** Подменить протокол на транспортной плите. */
  swap(text: string): ThreadGenerator;
  /** Плиты уходят — дальше речь только про сам ящик. */
  dismiss(): ThreadGenerator;
}

export function interfaceStage(): InterfaceStage {
  const group = createRef<Node>();
  const plates = range(2).map(() => createRef<Rect>());
  const seam = createRef<Line>();
  const question = createRef<Txt>();
  const chip = createRef<Rect>();
  const caret = createRef<Rect>();
  const terms = HIDDEN.map(() => createRef<Node>());
  const transportName = createRef<Txt>();

  const accent = colors.cyan;

  const plate = (index: number, text: string, y: number) => (
    <Rect ref={plates[index]} y={y} width={PLATE.width} height={PLATE.height}
      radius={PLATE.radius} fill={colors.track} stroke={withAlpha(accent, 0.6)}
      lineWidth={1.8} opacity={0}>
      <Txt ref={index === 1 ? transportName : undefined} text={text}
        fill={withAlpha(colors.text, 0.85)} fontSize={22} fontFamily={fonts.mono}
        fontWeight={500} letterSpacing={1.3}/>
    </Rect>
  );

  const node = (
    <Node ref={group}>
      {plate(0, 'ПРИКЛАДНОЙ', APP_Y)}

      {/* Термины лежат под транспортной плитой и всплывают из-под неё. */}
      {HIDDEN.map((text, index) => (
        <Node ref={terms[index]} x={HIDDEN_X[index]} y={TRANSPORT_Y} opacity={0}>
          <Rect radius={999} padding={[9, 18]} layout
            fill={withAlpha(colors.orange, 0.12)} stroke={withAlpha(colors.orange, 0.7)}
            lineWidth={1.3}>
            <Txt text={text} fill={colors.orange} fontSize={16} fontFamily={fonts.mono}
              fontWeight={500} letterSpacing={1.1}/>
          </Rect>
        </Node>
      ))}

      {plate(1, 'ТРАНСПОРТНЫЙ', TRANSPORT_Y)}

      <Line ref={seam} points={[[-PLATE.width / 2 - 20, SEAM_Y], [PLATE.width / 2 + 20, SEAM_Y]]}
        stroke={withAlpha(colors.orange, 0.9)} lineWidth={2.2} end={0} opacity={0}/>
      <Txt ref={question} y={SEAM_Y - 30} text="ИНТЕРФЕЙС · КАК ОН ВЫГЛЯДИТ?"
        fill={colors.orange} fontSize={17} fontFamily={fonts.mono} letterSpacing={1.2}
        opacity={0}/>

      <Rect ref={chip} y={APP_Y - 78} width={300} height={54} radius={999}
        stroke={withAlpha(accent, 0.65)} lineWidth={1.6} lineDash={[8, 7]} opacity={0}>
        <Rect ref={caret} x={-116} width={3} height={24} fill={accent}/>
        <Txt x={-96} offsetX={-1} text="ТВОЙ ПРОТОКОЛ" fill={colors.textMuted} fontSize={16}
          fontFamily={fonts.mono} letterSpacing={1.2}/>
      </Rect>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      ...plates.map((item, index) => delay(index * 0.12, item().opacity(1, IN, easeOutCubic))),
    );
  }

  function* ask(): ThreadGenerator {
    yield* all(
      seam().opacity(1, 0.2),
      seam().end(1, TONE, easeOutCubic),
      delay(0.2, question().opacity(1, TONE, easeOutCubic)),
    );
  }

  function* yourProtocol(): ThreadGenerator {
    yield* chip().opacity(1, TONE, easeOutCubic);
  }

  function* blink(): ThreadGenerator {
    while (true) {
      yield* caret().opacity(0, 0.01);
      yield* caret().opacity(0, 0.45);
      yield* caret().opacity(1, 0.01);
      yield* caret().opacity(1, 0.45);
    }
  }

  /** Всплыл — и утянулся обратно под плиту: приложению этого знать не надо. */
  function* hide(index: number): ThreadGenerator {
    const term = terms[index]();
    term.y(TRANSPORT_Y);
    yield* all(
      term.opacity(1, 0.25, easeOutCubic),
      term.y(TRANSPORT_Y - 96, 0.5, easeOutCubic),
    );
    yield* waitFor(0.35);
    yield* all(
      term.y(TRANSPORT_Y + 30, 0.55, easeInCubic),
      term.opacity(0, 0.5, easeInOutCubic),
    );
  }

  function* clearSeam(): ThreadGenerator {
    yield* all(question().opacity(0, 0.3), seam().opacity(0, 0.3));
  }

  function* swap(text: string): ThreadGenerator {
    yield* transportName().opacity(0, SWAP.out);
    transportName().text(text);
    yield* transportName().opacity(1, SWAP.in, easeOutCubic);
  }

  function* dismiss(): ThreadGenerator {
    yield* all(
      ...plates.map(item => item().opacity(0, 0.5, easeInOutCubic)),
      chip().opacity(0, 0.5, easeInOutCubic),
    );
  }

  return {node, appear, ask, yourProtocol, blink, hide, clearSeam, swap, dismiss};
}
