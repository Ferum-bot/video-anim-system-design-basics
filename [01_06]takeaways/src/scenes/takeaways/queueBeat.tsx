import {Circle, Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeInOutCubic, easeOutBack, sequence, waitFor} from '@motion-canvas/core';
import type {ThreadGenerator} from '@motion-canvas/core';
import {colors, fonts, kafkaIcon} from '@lib';
import {beatBlock, showBlock} from './beat';
import type {Beat} from './beat';

const ROW_Y = -10;

// Sync for the client, async under the hood: client→server→Kafka→consumer round-trip.
export function queueBeat(): Beat {
  const block = createRef<Rect>();
  const icon = createRef<Node>();
  const text = createRef<Txt>();
  const syncCap = createRef<Txt>();
  const asyncCap = createRef<Txt>();
  const dot = createRef<Circle>();
  const line = createRef<Line>();
  const boxes = [
    {ref: createRef<Rect>(), label: 'client', x: -390},
    {ref: createRef<Rect>(), label: 'server', x: -130},
    {ref: createRef<Rect>(), label: 'Kafka', x: 130},
    {ref: createRef<Rect>(), label: 'consumer', x: 390},
  ];
  const [clientX, serverX, kafkaX, consumerX] = boxes.map(b => b.x);

  const node = beatBlock({
    block, accent: colors.orange, caption: text, captionText: 'Очередь быстра для синхронных потоков',
    content: (
      <Node>
        <Node ref={icon} y={-180} scale={0} opacity={0}>{kafkaIcon()}</Node>
        <Txt ref={syncCap} y={-105} text="Снаружи — один синхронный запрос · ответ"
          fill={colors.textDim} fontSize={22} fontFamily={fonts.mono} opacity={0}/>
        <Line ref={line} points={[[clientX, ROW_Y], [consumerX, ROW_Y]]}
          stroke={colors.border} lineWidth={2} opacity={0} end={0}/>
        {boxes.map(b => (
          <Rect ref={b.ref} x={b.x} y={ROW_Y} width={120} height={56} radius={8}
            fill={colors.surface} stroke={colors.orange} lineWidth={2} opacity={0} scale={0.6}>
            <Txt text={b.label} fill={colors.text} fontSize={16} fontWeight={600} fontFamily={fonts.mono}/>
          </Rect>
        ))}
        <Circle ref={dot} width={16} height={16} x={clientX} y={ROW_Y} fill={colors.green}
          shadowColor={colors.green} shadowBlur={10} opacity={0}/>
        <Txt ref={asyncCap} y={75} text="Внутри — асинхронно через Kafka"
          fill={colors.orange} fontSize={22} fontWeight={600} fontFamily={fonts.mono} opacity={0}/>
      </Node>
    ),
  });

  function* play(): ThreadGenerator {
    yield* showBlock(block());
    yield* all(
      icon().scale(1.2, 0.5, easeOutBack), icon().opacity(1, 0.4),
      syncCap().opacity(1, 0.5),
    );
    yield* line().end(1, 0.4, easeInOutCubic);
    yield* sequence(0.1, ...boxes.map(b =>
      all(b.ref().opacity(1, 0.4), b.ref().scale(1, 0.4, easeOutBack)),
    ));
    yield* all(asyncCap().opacity(1, 0.5), text().opacity(1, 0.5));
  }

  function* loop(): ThreadGenerator {
    while (true) {
      // request: client → server → Kafka → consumer
      dot().fill(colors.green).position([clientX, ROW_Y]);
      yield* dot().opacity(1, 0.12);
      yield* dot().position.x(serverX, 0.45, easeInOutCubic);
      yield* dot().position.x(kafkaX, 0.45, easeInOutCubic);
      yield* dot().position.x(consumerX, 0.45, easeInOutCubic);
      yield* boxes[3].ref().scale(1.12, 0.12).to(1, 0.12); // consumer processes
      yield* waitFor(0.15);
      // response: consumer → Kafka → server → client
      dot().fill(colors.cyan);
      yield* dot().position.x(kafkaX, 0.45, easeInOutCubic);
      yield* dot().position.x(serverX, 0.45, easeInOutCubic);
      yield* dot().position.x(clientX, 0.45, easeInOutCubic);
      yield* boxes[0].ref().scale(1.12, 0.12).to(1, 0.12); // client gets the answer
      yield* dot().opacity(0, 0.15);
      yield* waitFor(0.4);
    }
  }

  return {node, play, loop};
}
