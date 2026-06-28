import {makeScene2D} from '@motion-canvas/2d';
import {waitUntil} from '@motion-canvas/core';
import {
  backdrop, banner, colors, createStage, endScene, formatThousands,
  kafkaIcon, sectionLabel, specCard,
} from '@lib';

// Two "time to scale" thresholds — warning accents + near-full meters.
export default makeScene2D(function* (view) {
  const stage = createStage(view);

  const bg = backdrop();
  stage.add(bg.node); // behind everything, hidden until the first component appears

  const label = sectionLabel('Когда пора масштабироваться');
  stage.add(label.node);

  // ── Throughput nearing the per-broker ceiling ───────────────────────────────
  yield* waitUntil('throughput');
  yield bg.appear(); // fork: dark backing fades in together with the first content
  yield* label.appear();

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
  yield* endScene(stage);
});
