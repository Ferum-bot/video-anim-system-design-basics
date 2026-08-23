import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, delay, easeInOutCubic, easeOutCubic, range} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Определение и три слова, которые из него следуют. Ключевой ход: слова **не гаснут**,
// а поднимаются наверх и становятся шапкой паспорта — то есть определение буквально
// превращается в форму, по которой дальше разбирают протоколы.
const LINE_Y = -71;
const WORDS_Y = 79;
const WORD_STEP = 268;

// Куда три слова уезжают, став заголовком карточки. Позиция считается от **итогового**
// положения текста: группа ужимается, и её содержимое подтягивается к своему началу.
const HEADER_Y = -286;
const HEADER_SCALE = 0.72;

const FALSE_LABELS = ['ТЕХНОЛОГИЯ', 'ФОРМАТ'] as const;
const FALSE_Y = 24;
const FALSE_STEP = 300;

const WORDS = ['ФОРМАТ', 'ПОРЯДОК', 'ДЕЙСТВИЯ'] as const;

const IN = 0.6;
const TONE = 0.4;
const RISE = 0.85;

export interface Definition extends Widget {
  /** «Обрати внимание на слово» — в цвете остаётся только «СОГЛАШЕНИЕ». */
  highlight(): ThreadGenerator;
  /** «Это не технология, не формат» — два ложных ярлыка перечёркиваются. */
  refute(): ThreadGenerator;
  /** Открываются три пустых слота. */
  slots(): ThreadGenerator;
  /** Очередное слово встаёт в слот. */
  word(index: number): ThreadGenerator;
  /** Слова поднимаются наверх и становятся шапкой карточки. */
  toHeader(): ThreadGenerator;
}

/** Определение протокола и три слова, в которые оно сворачивается. */
export function definition(): Definition {
  const group = createRef<Node>();
  const lead = createRef<Txt>();
  const key = createRef<Txt>();
  const tail = createRef<Txt>();
  const falseLabels = FALSE_LABELS.map(() => createRef<Node>());
  const strikes = FALSE_LABELS.map(() => createRef<Line>());
  const slotFrames = WORDS.map(() => createRef<Rect>());
  const words = WORDS.map(() => createRef<Txt>());
  const wordsGroup = createRef<Node>();
  const dim = createSignal(0); // 0 — вся строка равнозначна, 1 — светится одно слово

  const accent = colors.cyan;
  const quiet = () => withAlpha(colors.text, 0.8 - dim() * 0.55);

  const node = (
    <Node ref={group}>
      {/* Строка определения разбита на три куска: до ключевого слова, само слово, после. */}
      <Txt ref={lead} y={LINE_Y - 34} text="ПРОТОКОЛ — ЭТО" fill={quiet} fontSize={30}
        fontFamily={fonts.mono} letterSpacing={1.4} opacity={0}/>
      <Txt ref={key} y={LINE_Y + 14} text="СОГЛАШЕНИЕ" fill={colors.text} fontSize={46}
        fontFamily={fonts.mono} fontWeight={600} letterSpacing={2} opacity={0}/>
      <Txt ref={tail} y={LINE_Y + 62} text="О ТОМ, КАК ПРОИСХОДИТ ВЗАИМОДЕЙСТВИЕ СТОРОН"
        fill={quiet} fontSize={22} fontFamily={fonts.mono} letterSpacing={1.3} opacity={0}/>

      {/* Чем протокол не является — обе плашки приезжают уже с занесённым пером. */}
      {FALSE_LABELS.map((label, index) => (
        <Node ref={falseLabels[index]} x={(index * 2 - 1) * (FALSE_STEP / 2)} y={FALSE_Y}
          opacity={0}>
          <Txt text={label} fill={colors.textMuted} fontSize={24} fontFamily={fonts.mono}
            letterSpacing={1.4}/>
          <Line ref={strikes[index]} points={[[-96, 0], [96, 0]]} stroke={colors.red}
            lineWidth={2.4} end={0}/>
        </Node>
      ))}

      <Node ref={wordsGroup}>
        {WORDS.map((word, index) => (
          <Node x={(index - 1) * WORD_STEP} y={WORDS_Y}>
            <Rect ref={slotFrames[index]} width={244} height={72} radius={10}
              stroke={withAlpha(accent, 0.45)} lineWidth={1.6} lineDash={[8, 7]} opacity={0}/>
            <Txt ref={words[index]} text={word} fill={colors.text} fontSize={26}
              fontFamily={fonts.mono} fontWeight={500} letterSpacing={1.6} opacity={0}/>
          </Node>
        ))}
      </Node>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      lead().opacity(1, IN, easeOutCubic),
      delay(0.15, key().opacity(1, IN, easeOutCubic)),
      delay(0.3, tail().opacity(1, IN, easeOutCubic)),
    );
  }

  function* highlight(): ThreadGenerator {
    yield* dim(1, TONE, easeInOutCubic);
  }

  function* refute(): ThreadGenerator {
    yield* all(
      ...falseLabels.map((label, index) =>
        delay(index * 0.5, all(
          label().opacity(1, 0.3, easeOutCubic),
          delay(0.25, strikes[index]().end(1, 0.3, easeOutCubic)),
        )),
      ),
    );
  }

  function* slots(): ThreadGenerator {
    yield* all(
      ...falseLabels.map(label => label().opacity(0, 0.3)),
      ...slotFrames.map((frame, index) =>
        delay(index * 0.1, frame().opacity(1, TONE, easeOutCubic)),
      ),
    );
  }

  function* word(index: number): ThreadGenerator {
    yield* words[index]().opacity(1, 0.3, easeOutCubic);
  }

  /** Определение уходит, три слова уезжают наверх и ужимаются в заголовок. */
  function* toHeader(): ThreadGenerator {
    yield* all(
      lead().opacity(0, 0.4),
      key().opacity(0, 0.4),
      tail().opacity(0, 0.4),
      ...slotFrames.map(frame => frame().opacity(0, 0.4)),
      wordsGroup().y(HEADER_Y - WORDS_Y * HEADER_SCALE, RISE, easeInOutCubic),
      wordsGroup().scale(HEADER_SCALE, RISE, easeInOutCubic),
    );
  }

  return {node, appear, highlight, refute, slots, word, toHeader};
}
