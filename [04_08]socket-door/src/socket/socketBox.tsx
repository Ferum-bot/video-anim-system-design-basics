import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInOutCubic,
  easeInOutSine,
  easeOutCubic,
  linear,
  range,
  waitFor,
} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// «Ему нужна одна вещь — абстракция соединения: что-то, куда можно записать, и что-то,
// откуда прочитать». Ящик с двумя щелями и есть эта абстракция. Дальше он получает имя,
// а на честной оговорке делится пополам: левая половина «как работает» уходит за матовую
// шторку, за которой **продолжает шевелиться машинерия из видео 03**, правая «что обещает»
// остаётся открытой. Механика не исчезла — она за стеклом.
const BOX = {width: 330, height: 214, radius: 16} as const;
const SLOT = {width: 92, height: 16, radius: 5, inset: 30} as const;

const IN = 0.6;
const TONE = 0.45;
const SWAP = {out: 0.22, in: 0.32} as const;
const TOKEN_TRIP = 1.6;

export interface SocketBox extends Widget {
  /** Щели `write` и `read` подписываются. */
  slots(): ThreadGenerator;
  /** Бесконечный токен: вошёл в одну щель, вышел из другой. Форкать через `yield`. */
  run(): ThreadGenerator;
  /** Имя ящика — сначала безымянный, потом СОКЕТ. */
  name(text: string): ThreadGenerator;
  /** Переехать и укрупниться: на оговорке ящик становится всем кадром. */
  moveTo(x: number, y: number, scale: number): ThreadGenerator;
  /** Левая половина уходит за матовую шторку, за ней остаётся живая механика. */
  shutter(): ThreadGenerator;
  /** Бесконечная машинерия за шторкой — форкать через `yield`. */
  machinery(): ThreadGenerator;
  /** Первая строка API с подсвеченным слотом аргумента. */
  apiLine(): ThreadGenerator;
  /** Аргумент оказывается тумблером на два положения. */
  toggle(): ThreadGenerator;
}

export interface SocketBoxOptions {
  x: number;
  y: number;
  label: string;
  /** Двойник-файл: те же две щели, но без шторки, API и тумблера. */
  plain?: boolean;
}

/** Дверь, за которой начинается транспорт. */
export function socketBox({x, y, label, plain = false}: SocketBoxOptions): SocketBox {
  const group = createRef<Node>();
  const shell = createRef<Rect>();
  const title = createRef<Txt>();
  const slotLabels = range(2).map(() => createRef<Txt>());
  const token = createRef<Circle>();
  const veil = createRef<Rect>();
  const gears = createRef<Node>();
  const api = createRef<Node>();
  const argSlot = createRef<Rect>();
  const switchNode = createRef<Node>();
  const knob = createSignal(0); // 0 — поток, 1 — сообщения
  const travel = createSignal(0); // 0…1 внутрь, 1…2 наружу
  const beat = createSignal(0); // дыхание окна за шторкой
  const scroll = createSignal(0); // бег пилы за шторкой

  const accent = colors.cyan;
  const slotY = -BOX.height / 2;
  const slotX = (index: number) => (index * 2 - 1) * (BOX.width / 2 - SLOT.inset - SLOT.width / 2);

  const tokenAt = (axis: 'x' | 'y') => () => {
    const p = travel();
    if (p <= 1) {
      return axis === 'x' ? slotX(0) : slotY + 46 * p;
    }
    return axis === 'x' ? slotX(1) : slotY + 46 * (2 - p);
  };

  const node = (
    <Node ref={group} x={x} y={y} opacity={0}>
      <Rect ref={shell} width={BOX.width} height={BOX.height} radius={BOX.radius}
        fill={colors.surface} stroke={withAlpha(accent, 0.75)} lineWidth={2}>
        {/* За шторкой — та самая механика, которую абстракция прячет. */}
        <Node ref={gears} x={-BOX.width / 4} opacity={0}>
          <Rect y={-16} width={120} height={20} radius={5}
            stroke={withAlpha(colors.green, 0.7)} lineWidth={1.4}>
            <Rect x={() => -60 + 30 * beat()} width={() => 40 + 30 * beat()} height={16}
              radius={4} fill={withAlpha(colors.green, 0.45)} offsetX={-1}/>
          </Rect>
          <Line
            y={30}
            points={() => range(11).map(index => [
              -60 + index * 12,
              14 - ((index * 7 + scroll() * 28) % 28),
            ])}
            stroke={withAlpha(colors.orange, 0.7)}
            lineWidth={1.6}
          />
        </Node>

        <Rect ref={veil} x={-BOX.width / 4} width={BOX.width / 2} height={BOX.height - 4}
          radius={12} fill={withAlpha(colors.background, 0.86)}
          stroke={withAlpha(colors.textMuted, 0.5)} lineWidth={1.4} opacity={0}>
          {/* Затянутая половина обязана быть подписана — иначе шутка не читается. */}
          <Txt y={BOX.height / 2 - 26} text="КАК РАБОТАЕТ" fill={colors.textMuted}
            fontSize={14} fontFamily={fonts.mono} letterSpacing={1.2}/>
        </Rect>

        <Txt ref={title} y={16} text={label} fill={withAlpha(colors.text, 0.95)} fontSize={26}
          fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.6}/>
      </Rect>

      {/* Две щели прорезаны в верхней кромке — это и есть весь интерфейс. */}
      {range(2).map(index => (
        <Node>
          <Rect x={slotX(index)} y={slotY} width={SLOT.width} height={SLOT.height}
            radius={SLOT.radius} fill={colors.background}
            stroke={withAlpha(accent, 0.8)} lineWidth={1.5}/>
          <Txt ref={slotLabels[index]} x={slotX(index)} y={slotY - 24}
            text={index === 0 ? 'write ↓' : 'read ↑'} fill={withAlpha(accent, 0.9)}
            fontSize={16} fontFamily={fonts.mono} letterSpacing={1.1} opacity={0}/>
        </Node>
      ))}

      <Circle ref={token} width={13} height={13} fill={accent}
        shadowColor={withAlpha(accent, 0.8)} shadowBlur={12}
        x={tokenAt('x')} y={tokenAt('y')}
        opacity={() => Math.sin(Math.PI * (travel() % 1 || (travel() > 0 ? 1 : 0)))}/>

      {/* Первая строка API — она же та самая развилка. */}
      <Node ref={api} y={BOX.height / 2 + 46} opacity={0}>
        <Txt x={-104} offsetX={-1} text="socket(" fill={colors.textDim} fontSize={22}
          fontFamily={fonts.mono} letterSpacing={1.1}/>
        <Rect ref={argSlot} x={22} width={128} height={38} radius={8}
          fill={withAlpha(colors.orange, 0.14)} stroke={withAlpha(colors.orange, 0.85)}
          lineWidth={1.6}/>
        <Txt x={96} offsetX={-1} text=")" fill={colors.textDim} fontSize={22}
          fontFamily={fonts.mono} letterSpacing={1.1}/>
      </Node>

      {/* Тумблер: абстракция скрыла механику, но выбор гарантий оставила тебе. */}
      <Node ref={switchNode} y={BOX.height / 2 + 46} opacity={0}>
        <Rect width={58} height={30} radius={999} x={-104}
          fill={() => withAlpha(colors.orange, 0.16)}
          stroke={withAlpha(colors.orange, 0.85)} lineWidth={1.5}>
          <Circle width={22} height={22} fill={colors.orange} x={() => -13 + knob() * 26}/>
        </Rect>
        <Txt x={-66} offsetX={-1} y={-14} text="НАДЁЖНЫЙ ПОТОК"
          fill={() => withAlpha(colors.text, 0.4 + (1 - knob()) * 0.55)} fontSize={17}
          fontFamily={fonts.mono} letterSpacing={1.1}/>
        <Txt x={-66} offsetX={-1} y={16} text="ОТДЕЛЬНЫЕ СООБЩЕНИЯ"
          fill={() => withAlpha(colors.text, 0.4 + knob() * 0.55)} fontSize={17}
          fontFamily={fonts.mono} letterSpacing={1.1}/>
      </Node>
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* group().opacity(1, IN, easeOutCubic);
  }

  function* slots(): ThreadGenerator {
    yield* all(...slotLabels.map((item, index) =>
      delay(index * 0.15, item().opacity(1, TONE, easeOutCubic))));
  }

  function* run(): ThreadGenerator {
    while (true) {
      travel(0);
      yield* travel(2, TOKEN_TRIP, linear);
      yield* waitFor(0.35);
    }
  }

  function* name(text: string): ThreadGenerator {
    yield* title().opacity(0, SWAP.out);
    title().text(text);
    yield* title().opacity(1, SWAP.in, easeOutCubic);
  }

  function* moveTo(nextX: number, nextY: number, scale: number): ThreadGenerator {
    yield* all(
      group().x(nextX, 0.8, easeInOutCubic),
      group().y(nextY, 0.8, easeInOutCubic),
      group().scale(scale, 0.8, easeInOutCubic),
    );
  }

  function* shutter(): ThreadGenerator {
    if (plain) return;
    yield* all(
      gears().opacity(0.9, TONE, easeOutCubic),
      title().x(BOX.width / 4, TONE, easeInOutCubic),
    );
    yield* veil().opacity(1, 0.6, easeInOutCubic);
  }

  function* machinery(): ThreadGenerator {
    yield* all(
      (function* () {
        while (true) {
          yield* beat(1, 1.4, easeInOutSine);
          yield* beat(0, 1.4, easeInOutSine);
        }
      })(),
      (function* () {
        while (true) {
          scroll(0);
          yield* scroll(1, 2.2, linear);
        }
      })(),
    );
  }

  function* apiLine(): ThreadGenerator {
    if (plain) return;
    yield* api().opacity(1, TONE, easeOutCubic);
  }

  function* toggle(): ThreadGenerator {
    if (plain) return;
    yield* all(api().opacity(0, SWAP.out), switchNode().opacity(1, SWAP.in, easeOutCubic));
    yield* waitFor(0.4);
    yield* knob(1, 0.5, easeInOutCubic);
  }

  return {node, appear, slots, run, name, moveTo, shutter, machinery, apiLine, toggle};
}
