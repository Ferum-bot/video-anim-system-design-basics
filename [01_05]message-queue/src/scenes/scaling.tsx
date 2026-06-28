import {makeScene2D, Txt} from '@motion-canvas/2d';
import {createRef, easeInOutCubic, easeOutCubic, waitUntil} from '@motion-canvas/core';
import {
  backdrop, banner, colors, createStage, fonts, formatThousands, kafkaIcon, specCard,
} from '@lib';

// Two "time to scale" thresholds — warning accents + near-full meters.
export default makeScene2D(function* (view) {
  const stage = createStage(view);

  const bg = backdrop();
  stage.add(bg.node); // behind everything, hidden until the first component appears

  const label = createRef<Txt>();
  stage.add(
    <Txt ref={label} text="Когда пора масштабироваться" fill={colors.textMuted}
      fontSize={26} fontWeight={600} fontFamily={fonts.mono} y={-330} opacity={0}/>,
  );

  // ── Throughput nearing the per-broker ceiling ───────────────────────────────
  yield* waitUntil('throughput');
  yield bg.appear(); // fork: dark backing fades in together with the first content
  yield* label().opacity(1, 0.5, easeOutCubic);

  const throughput = specCard({
    name: 'Throughput', tag: 'порог', spec: 'приближается к 800k msg/s на брокер',
    accent: colors.orange, y: -110, icon: kafkaIcon(),
    meter: {label: 'Сообщений/с', fill: 0.8, value: 800, format: v => `${formatThousands(v)}k msg/s`},
  });
  stage.add(throughput.node);
  yield* throughput.appear();

  // ── Partition count approaching the cluster limit ───────────────────────────
  yield* waitUntil('partitions');
  const partitions = specCard({
    name: 'Партиции', tag: 'порог', spec: 'приближается к 200k на кластер',
    accent: colors.orange, y: 110, icon: kafkaIcon(),
    meter: {label: 'На кластер', fill: 0.85, value: 200, format: v => `${formatThousands(v)}k`},
  });
  stage.add(partitions.node);
  yield* partitions.appear();

  yield* waitUntil('takeaway');
  const outro = banner({
    text: 'Близко к порогам → больше брокеров и партиций',
    accent: colors.orange, y: 300,
  });
  stage.add(outro.node);
  yield* outro.appear();
  yield* waitUntil('end'); // drag this anchor to set where the scene ends
  yield* stage.opacity(0, 0.8, easeInOutCubic); // smooth fade-out of everything
});
