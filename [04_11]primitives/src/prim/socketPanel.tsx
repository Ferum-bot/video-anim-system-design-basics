import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

// Первая строчка стандарта — и та самая оговорка. Аргумент `тип` не подписывается словами,
// а **оказывается тумблером**: одно и то же поле принимает два значения, и от того, какое,
// зависит всё остальное. Тот же тумблер, что в `[04_08]` и `[04_10]`.
export const PANEL = {width: 760, height: 190, radius: 14} as const;

const CODE_Y = -58;
const SWITCH_Y = 6;
const KNOB = {width: 58, height: 30, x: -184} as const;

const IN = 0.55;
const TONE = 0.4;

export interface SocketPanel extends Widget {
  /** Аргумент раскрывается тумблером на два положения. */
  toggle(): ThreadGenerator;
  /** Переключить обратно: выбор действительно твой. */
  flip(): ThreadGenerator;
  /** Штамп под панелью: это буквально первые строчки стандарта. */
  stamp(text: string): ThreadGenerator;
  dismiss(): ThreadGenerator;
}

export interface SocketPanelOptions {
  y: number;
  /** Кнопка, из которой панель растёт: к ней тянется поводок. */
  anchorX: number;
  /** Ряд ездит по кадру, поэтому конец поводка — функция, а не число. */
  anchorY: () => number;
}

export function socketPanel({y, anchorX, anchorY}: SocketPanelOptions): SocketPanel {
  const group = createRef<Node>();
  const shell = createRef<Rect>();
  const leader = createRef<Line>();
  const switchNode = createRef<Node>();
  const stampNode = createRef<Rect>();
  const stampText = createRef<Txt>();

  const accent = colors.orange;
  const knob = createSignal(0); // 0 — поток, 1 — сообщения

  const argText = () => (knob() < 0.5 ? 'SOCK_STREAM' : 'SOCK_DGRAM');

  const node = (
    <Node ref={group} opacity={0}>
      {/* Поводок от кнопки `socket` вверх, в нижнюю кромку панели. */}
      <Line ref={leader}
        points={() => [[anchorX, anchorY()], [anchorX, y + PANEL.height / 2]] as [number, number][]}
        stroke={withAlpha(accent, 0.55)} lineWidth={1.4} lineDash={[7, 7]} end={0}/>

      <Rect ref={shell} y={y} width={PANEL.width} height={PANEL.height} radius={PANEL.radius}
        fill={colors.surface} stroke={withAlpha(accent, 0.6)} lineWidth={1.6}>
        {/* Строка вызова — layout-ряд: подсвеченный аргумент меняет ширину вместе с текстом. */}
        <Rect y={CODE_Y} layout gap={10} alignItems="center">
          <Txt text="socket(AF_INET," fill={colors.textDim} fontSize={22}
            fontFamily={fonts.mono} letterSpacing={1}/>
          <Rect radius={8} padding={[6, 14]} layout
            fill={withAlpha(accent, 0.16)} stroke={withAlpha(accent, 0.9)} lineWidth={1.6}>
            <Txt text={argText} fill={accent} fontSize={21} fontFamily={fonts.mono}
              fontWeight={600} letterSpacing={1}/>
          </Rect>
          <Txt text=", 0)" fill={colors.textDim} fontSize={22} fontFamily={fonts.mono}
            letterSpacing={1}/>
        </Rect>

        {/* Тумблер: абстракция скрыла механику, но выбор гарантий оставила тебе. */}
        <Node ref={switchNode} opacity={0}>
          <Rect x={KNOB.x} y={SWITCH_Y} width={KNOB.width} height={KNOB.height} radius={999}
            fill={withAlpha(accent, 0.16)} stroke={withAlpha(accent, 0.85)} lineWidth={1.5}>
            <Circle width={22} height={22} fill={accent} x={() => -13 + knob() * 26}/>
          </Rect>
          <Txt x={KNOB.x + 44} offsetX={-1} y={SWITCH_Y - 15} text="ПОТОК НАДЁЖНЫХ БАЙТОВ"
            fill={() => withAlpha(colors.text, 0.35 + (1 - knob()) * 0.6)} fontSize={17}
            fontFamily={fonts.mono} letterSpacing={1.1}/>
          <Txt x={KNOB.x + 44} offsetX={-1} y={SWITCH_Y + 15} text="ОТДЕЛЬНЫЕ СООБЩЕНИЯ БЕЗ ГАРАНТИЙ"
            fill={() => withAlpha(colors.text, 0.35 + knob() * 0.6)} fontSize={17}
            fontFamily={fonts.mono} letterSpacing={1.1}/>
        </Node>

        {/* Штамп живёт внутри панели: снаружи ему негде встать, не перекосив кадр. */}
        <Rect ref={stampNode} x={PANEL.width / 2 - 30} y={64} offsetX={1} rotation={-3}
          radius={7} padding={[7, 18]} layout
          fill={withAlpha(accent, 0.12)} stroke={withAlpha(accent, 0.9)} lineWidth={2}
          opacity={0} scale={1.4}>
          <Txt ref={stampText} text="" fill={accent} fontSize={16} fontFamily={fonts.mono}
            fontWeight={600} letterSpacing={1.5}/>
        </Rect>
      </Rect>
    </Node>
  );

  function* appear(): ThreadGenerator {
    shell().scale(0.94);
    yield* all(
      group().opacity(1, 0.01),
      leader().end(1, 0.5, easeOutCubic),
      shell().opacity(1, IN, easeOutCubic),
      shell().scale(1, IN, easeOutCubic),
    );
  }

  function* toggle(): ThreadGenerator {
    yield* switchNode().opacity(1, TONE, easeOutCubic);
    yield* knob(1, 0.55, easeInOutCubic);
  }

  function* flip(): ThreadGenerator {
    yield* knob(knob() > 0.5 ? 0 : 1, 0.55, easeInOutCubic);
  }

  function* stamp(text: string): ThreadGenerator {
    stampText().text(text);
    yield* all(
      stampNode().opacity(1, 0.3, easeOutCubic),
      stampNode().scale(1, 0.3, easeOutCubic),
    );
  }

  function* dismiss(): ThreadGenerator {
    yield* all(
      group().opacity(0, 0.6, easeInOutCubic),
      shell().scale(0.96, 0.6, easeInOutCubic),
    );
  }

  return {node, appear, toggle, flip, stamp, dismiss};
}
