import {makeScene2D} from '@motion-canvas/2d';
import {waitUntil} from '@motion-canvas/core';
import {
  backdrop, banner, colors, createStage, endScene, formatThousands,
  redisIcon, sectionLabel, specCard,
} from '@lib';

// Each card is a "you've hit a limit" signal — warning accents + near-full meters.
export default makeScene2D(function* (view) {
  const stage = createStage(view);

  const bg = backdrop();
  stage.add(bg.node); // behind everything, hidden until the first component appears

  const label = sectionLabel('Когда пора масштабироваться');
  stage.add(label.node);

  // ── Dataset size approaching 1 TB ───────────────────────────────────────────
  yield* waitUntil('dataset');
  yield bg.appear(); // fork: dark backing fades in together with the first content
  yield* label.appear();

  const dataset = specCard({
    name: 'Объём данных', tag: 'порог', spec: 'приближается к 1 TB',
    accent: colors.orange, y: -220, icon: redisIcon(),
    meter: {label: 'Заполнение', fill: 0.92, value: '~1 TB'},
  });
  stage.add(dataset.node);
  yield* dataset.appear();

  // ── Sustained throughput 100k+ ops/s ────────────────────────────────────────
  yield* waitUntil('throughput');
  const throughput = specCard({
    name: 'Throughput', tag: 'порог', spec: 'устойчиво 100k+ ops/s',
    accent: colors.orange, y: 10, icon: redisIcon(),
    meter: {label: 'Операций/с', fill: 0.9, value: 100, format: v => `${formatThousands(v)}k+ ops/s`},
  });
  stage.add(throughput.node);
  yield* throughput.appear();

  // ── Read latency requirement below 0.5 ms ───────────────────────────────────
  yield* waitUntil('read-latency');
  const latency = specCard({
    name: 'Задержка чтения', tag: 'порог', spec: 'нужно стабильно < 0.5 ms',
    accent: colors.red, y: 240, icon: redisIcon(),
    meter: {label: 'Цель', fill: 0.95, value: '< 0.5 ms'},
  });
  stage.add(latency.node);
  yield* latency.appear();

  yield* waitUntil('takeaway');
  const outro = banner({
    text: 'Достиг порогов — пора масштабировать кэш',
    accent: colors.orange, y: 400,
  });
  stage.add(outro.node);
  yield* outro.appear();
  yield* endScene(stage);
});
