import {Layout, Line, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutBack, easeOutCubic} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';
import type {Widget} from '@lib';

const CARD_W = 390;
const CARD_H = 200;
const TICK = 16; // length of the blueprint corner ticks

const FADE_IN = 0.6;

export interface ProtocolField {
  label: string;
  value: string;
}

export interface ProtocolCardOptions {
  name: string; // 'HTTP', 'DNS', ...
  /** Short tag on the right, e.g. transport: `TCP` / `UDP`. */
  transport: string;
  /** Two or three key/value spec rows (port, model, security…). */
  fields: ProtocolField[];
  /** One-line plain-language purpose. */
  purpose: string;
  accent: string;
  x: number;
  y: number;
}

/** Four L-shaped corner ticks — the blueprint framing motif. */
function CornerTicks({accent}: {accent: string}) {
  const hw = CARD_W / 2;
  const hh = CARD_H / 2;
  const corners: [number, number][][] = [
    [[-hw, -hh + TICK], [-hw, -hh], [-hw + TICK, -hh]], // TL
    [[hw - TICK, -hh], [hw, -hh], [hw, -hh + TICK]], // TR
    [[-hw, hh - TICK], [-hw, hh], [-hw + TICK, hh]], // BL
    [[hw - TICK, hh], [hw, hh], [hw, hh - TICK]], // BR
  ];
  return (
    <>
      {corners.map(points => (
        <Line points={points} lineWidth={2} stroke={accent} radius={1}/>
      ))}
    </>
  );
}

/**
 * An application-layer protocol tile in the blueprint language: name + transport tag, a
 * couple of spec rows, a plain-language purpose, framed by glowing corner ticks.
 */
export function protocolCard(options: ProtocolCardOptions): Widget {
  const {name, transport, fields, purpose, accent, x, y} = options;

  const group = createRef<Layout>();

  const node = (
    <Layout ref={group} x={x} y={y} scale={0.94} opacity={0}>
      <Rect width={CARD_W} height={CARD_H} radius={10}
        fill={colors.track} stroke={colors.border} lineWidth={1.5}/>
      <CornerTicks accent={accent}/>

      <Layout layout direction="column" gap={14} width={CARD_W} height={CARD_H} padding={[24, 26]}>
        {/* header: protocol name + transport tag */}
        <Layout layout direction="row" alignItems="center" width="100%">
          <Txt text={name} fill={colors.text} fontSize={34} fontWeight={700} fontFamily={fonts.mono}/>
          <Layout grow={1}/>
          <Rect layout radius={5} padding={[4, 11]} fill={withAlpha(accent, 0.12)}
            stroke={withAlpha(accent, 0.7)} lineWidth={1}>
            <Txt text={transport} fill={accent} fontSize={17} fontFamily={fonts.mono}/>
          </Rect>
        </Layout>

        {/* spec rows */}
        <Layout layout direction="column" gap={7} width="100%">
          {fields.map(f => (
            <Layout layout direction="row" justifyContent="space-between" width="100%">
              <Txt text={f.label} fill={colors.textMuted} fontSize={17} fontFamily={fonts.mono}/>
              <Txt text={f.value} fill={colors.textDim} fontSize={17} fontFamily={fonts.mono}/>
            </Layout>
          ))}
        </Layout>

        <Layout grow={1}/>
        <Txt text={purpose} fill={colors.textDim} fontSize={17} lineHeight={23}
          fontFamily={fonts.display} textWrap width={CARD_W - 52}/>
      </Layout>
    </Layout>
  );

  function* appear(): ThreadGenerator {
    yield* all(
      group().opacity(1, FADE_IN, easeOutCubic),
      group().scale(1, FADE_IN, easeOutBack),
    );
  }

  return {node, appear};
}
