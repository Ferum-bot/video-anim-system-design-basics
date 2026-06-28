import {makeScene2D, Txt} from '@motion-canvas/2d';
import {all, createRef, easeInOutCubic, easeOutCubic, waitUntil} from '@motion-canvas/core';
import {
  backdrop, banner, colors, createStage, fonts, formatThousands, postgresIcon, specCard,
} from '@lib';

// "Time to shard" signals: three quantitative thresholds, then geo-distribution.
export default makeScene2D(function* (view) {
  const stage = createStage(view);

  const bg = backdrop();
  stage.add(bg.node); // behind everything, hidden until the first component appears

  const label = createRef<Txt>();
  stage.add(
    <Txt ref={label} text="Когда пора шардировать" fill={colors.textMuted}
      fontSize={26} fontWeight={600} fontFamily={fonts.mono} y={-330} opacity={0}/>,
  );

  // ── Group 1: quantitative thresholds ────────────────────────────────────────
  yield* waitUntil('dataset');
  yield bg.appear(); // fork: dark backing fades in together with the first content
  yield* label().opacity(1, 0.5, easeOutCubic);

  const dataset = specCard({
    name: 'Объём данных', tag: 'порог', spec: 'приближается / превышает 50 TiB',
    accent: colors.orange, y: -220, icon: postgresIcon(),
    meter: {label: 'Заполнение', fill: 0.9, value: '~50 TiB'},
  });
  stage.add(dataset.node);
  yield* dataset.appear();

  yield* waitUntil('write-throughput');
  const writes = specCard({
    name: 'Запись', tag: 'порог', spec: 'устойчиво выше 10k TPS',
    accent: colors.orange, y: 10, icon: postgresIcon(),
    meter: {label: 'Операций/с', fill: 0.9, value: 10, format: v => `${formatThousands(v)}k+ TPS`},
  });
  stage.add(writes.node);
  yield* writes.appear();

  yield* waitUntil('read-latency');
  const latency = specCard({
    name: 'Задержка чтения', tag: 'порог', spec: 'нужно < 5 ms даже для чтений с диска',
    accent: colors.red, y: 240, icon: postgresIcon(),
    meter: {label: 'Цель', fill: 0.95, value: '< 5 ms'},
  });
  stage.add(latency.node);
  yield* latency.appear();

  // ── Group 2: operational signals ────────────────────────────────────────────
  yield* waitUntil('geo');
  yield* all(
    dataset.node.opacity(0, 0.6),
    writes.node.opacity(0, 0.6),
    latency.node.opacity(0, 0.6),
  );
  dataset.node.remove();
  writes.node.remove();
  latency.node.remove();

  const geo = specCard({
    name: 'Геораспределение', tag: 'сигнал', spec: 'репликация / распределение между регионами',
    accent: colors.purple, y: -40, icon: postgresIcon(),
    meter: {label: 'Охват', fill: 0.7, value: 'cross-region'},
  });
  stage.add(geo.node);
  yield* geo.appear();

  yield* waitUntil('takeaway');
  const outro = banner({
    text: 'Эти сигналы → пора шардировать / распределять',
    accent: colors.orange, y: 300,
  });
  stage.add(outro.node);
  yield* outro.appear();
  yield* waitUntil('end'); // drag this anchor to set where the scene ends
  yield* stage.opacity(0, 0.8, easeInOutCubic); // smooth fade-out of everything
});
