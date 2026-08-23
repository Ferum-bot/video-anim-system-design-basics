import {Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, delay, easeOutCubic, range} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

const IN = 0.45;

const VIDEO = {width: 320, height: 46, radius: 999, gap: 24} as const;
const TITLES = ['ФУНДАМЕНТ СЕТЕЙ', 'ТРАНСПОРТНЫЙ УРОВЕНЬ'] as const;

export interface VideoChips extends Widget {
  /** Подсветить обе: «там разобраны все проблемы нижних уровней». */
  light(): ThreadGenerator;
}

export interface VideoChipsOptions {
  y: number;
  captionY: number;
}

/** Две предыдущие серии — то, куда эта часть отправляет за деталями. */
export function videoChips({y, captionY}: VideoChipsOptions): VideoChips {
  const group = createRef<Node>();
  const caption = createRef<Txt>();
  const chips = range(TITLES.length).map(() => createRef<Rect>());

  const accent = colors.cyan;
  const chipX = (index: number) => (index - 0.5) * (VIDEO.width + VIDEO.gap);

  const node = (
    <Node ref={group}>
      <Txt ref={caption} y={captionY} text="ПОДРОБНО РАЗОБРАНО В" fill={colors.textMuted}
        fontSize={16} fontFamily={fonts.mono} letterSpacing={1.5} opacity={0}/>
      {range(TITLES.length).map(index => (
        <Rect ref={chips[index]} x={chipX(index)} y={y} width={VIDEO.width}
          height={VIDEO.height} radius={VIDEO.radius} fill={colors.track}
          stroke={withAlpha(accent, 0.55)} lineWidth={1.4}
          shadowColor={withAlpha(accent, 0.6)} shadowBlur={0} opacity={0}>
          <Txt text={TITLES[index]} fill={withAlpha(colors.text, 0.85)} fontSize={17}
            fontFamily={fonts.mono} fontWeight={500} letterSpacing={1.3}/>
        </Rect>
      ))}
    </Node>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      caption().opacity(1, IN, easeOutCubic),
      ...chips.map((item, index) =>
        delay(0.2 + index * 0.16, item().opacity(1, IN, easeOutCubic))),
    );
  }

  function* light(): ThreadGenerator {
    yield* all(
      ...chips.map(item => all(
        item().shadowBlur(18, 0.5, easeOutCubic),
        item().stroke(withAlpha(accent, 0.95), 0.5),
      )),
    );
  }

  return {node, appear, light};
}
