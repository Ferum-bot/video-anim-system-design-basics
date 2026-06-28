import {makeScene2D, Txt} from '@motion-canvas/2d';
import {createRef, easeInOutCubic, easeOutCubic, waitUntil} from '@motion-canvas/core';
import {
  backdrop, banner, colors, createStage, fonts, formatThousands,
  kafkaIcon, latencyBand, specCard,
} from '@lib';

export default makeScene2D(function* (view) {
  const stage = createStage(view);

  const bg = backdrop();
  stage.add(bg.node); // behind everything, hidden until the first component appears

  const label = createRef<Txt>();
  stage.add(
    <Txt ref={label} text="Числа, которые нужно знать" fill={colors.textMuted}
      fontSize={26} fontWeight={600} fontFamily={fonts.mono} y={-330} opacity={0}/>,
  );

  // ── 1. Throughput ─────────────────────────────────────────────────────────────
  yield* waitUntil('throughput');
  yield bg.appear(); // fork: dark backing fades in together with the first content
  yield* label().opacity(1, 0.5, easeOutCubic);

  const throughput = specCard({
    name: 'Throughput', tag: 'на брокер', spec: 'современные конфигурации',
    accent: colors.green, y: -40, icon: kafkaIcon(),
    meter: {label: 'Сообщений/с', fill: 1.0, value: 1_000_000, format: v => `${formatThousands(v)} msg/s`},
  });
  stage.add(throughput.node);
  yield* throughput.appear();

  // ── 2. Latency (producer → consumer, end-to-end) ────────────────────────────
  yield* waitUntil('latency');
  yield* throughput.node.opacity(0, 0.6);
  throughput.node.remove();

  const e2e = latencyBand({
    scope: 'End-to-end · регион', kind: 'dot', from: 'producer', to: 'consumer',
    latency: '1–5 ms', accent: colors.green, travel: 0.5, y: 0, cue: 'lat-e2e',
  });
  stage.add(e2e.node);
  yield* e2e.reveal();
  yield e2e.pulse(); // fork: keeps bouncing in the background

  // ── 3. Message size ───────────────────────────────────────────────────────────
  yield* waitUntil('msg-size');
  yield* e2e.node.opacity(0, 0.6);
  e2e.node.remove();

  const size = specCard({
    name: 'Размер сообщения', tag: 'эффективно', spec: 'от мелких до крупных',
    accent: colors.purple, y: -40, icon: kafkaIcon(),
    meter: {label: 'Диапазон', fill: 0.6, value: '1 KB – 10 MB'},
  });
  stage.add(size.node);
  yield* size.appear();

  // ── 4. Storage ────────────────────────────────────────────────────────────────
  yield* waitUntil('storage');
  yield* size.node.opacity(0, 0.6);
  size.node.remove();

  const storage = specCard({
    name: 'Хранилище', tag: 'на брокер', spec: 'продвинутые конфигурации',
    accent: colors.blue, y: -40, icon: kafkaIcon(),
    meter: {label: 'Объём', fill: 1.0, value: 50, format: v => `${formatThousands(v)} TB`},
  });
  stage.add(storage.node);
  yield* storage.appear();

  // ── 5. Retention ──────────────────────────────────────────────────────────────
  yield* waitUntil('retention');
  yield* storage.node.opacity(0, 0.6);
  storage.node.remove();

  const retention = specCard({
    name: 'Хранение', tag: 'retention', spec: 'зависит от диска и конфигурации',
    accent: colors.cyan, y: -40, icon: kafkaIcon(),
    meter: {label: 'Срок', fill: 0.7, value: 'недели–месяцы'},
  });
  stage.add(retention.node);
  yield* retention.appear();

  yield* waitUntil('takeaway');
  const outro = banner({
    text: 'Один брокер — миллион сообщений/с',
    accent: colors.green, y: 410,
  });
  stage.add(outro.node);
  yield* outro.appear();
  yield* waitUntil('end'); // drag this anchor to set where the scene ends
  yield* stage.opacity(0, 0.8, easeInOutCubic); // smooth fade-out of everything
});
