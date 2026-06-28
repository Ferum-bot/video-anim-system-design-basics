import {makeScene2D} from '@motion-canvas/2d';
import {all, waitUntil} from '@motion-canvas/core';
import {
  backdrop, banner, colors, createStage, endScene, formatThousands,
  latencyBand, postgresIcon, sectionLabel, specCard,
} from '@lib';

export default makeScene2D(function* (view) {
  const stage = createStage(view);

  const bg = backdrop();
  stage.add(bg.node); // behind everything, hidden until the first component appears

  const label = sectionLabel('Числа, которые нужно знать');
  stage.add(label.node);

  // ── 1. Storage ───────────────────────────────────────────────────────────────
  yield* waitUntil('storage');
  yield bg.appear(); // fork: dark backing fades in together with the first content
  yield* label.appear();

  const storage = specCard({
    name: 'Хранилище', tag: 'RDS / Aurora', spec: 'до 64 TiB · Aurora — до 256 TiB',
    accent: colors.blue, y: -40, icon: postgresIcon(),
    meter: {label: 'Объём', fill: 0.5, value: 64, format: v => `${formatThousands(v)} TiB`},
  });
  stage.add(storage.node);
  yield* storage.appear();

  // ── 2. Latency (read from memory / read from disk / write — pulse speed = latency) ──
  yield* waitUntil('latency');
  yield* storage.node.opacity(0, 0.6);
  storage.node.remove();
  yield* label.retitle('Задержки');

  const bands = [
    latencyBand({scope: 'Чтение · из памяти', kind: 'dot', from: 'app', to: 'буфер',
      latency: '1–5 ms', accent: colors.green, travel: 0.45, y: -150, cue: 'lat-read-cache'}),
    latencyBand({scope: 'Чтение · с диска', kind: 'dot', from: 'app', to: 'диск',
      latency: '5–30 ms', accent: colors.orange, travel: 1.4, y: 50, cue: 'lat-read-disk'}),
    latencyBand({scope: 'Запись · commit', kind: 'dot', from: 'app', to: 'БД',
      latency: '5–15 ms', accent: colors.cyan, travel: 0.9, y: 250, cue: 'lat-write'}),
  ];
  for (const band of bands) stage.add(band.node);
  for (const band of bands) {
    yield* waitUntil(band.cue);
    yield* band.reveal();
    yield band.pulse(); // fork: keeps bouncing in the background
  }

  // ── 3. Throughput & connections (three stacked cards) ───────────────────────
  yield* waitUntil('tput-reads');
  yield* all(...bands.map(band => band.node.opacity(0, 0.6)));
  for (const band of bands) band.node.remove();
  yield* label.retitle('Пропускная способность · подключения');

  const reads = specCard({
    name: 'Чтение', tag: 'TPS', spec: 'одиночный узел · Aurora / RDS',
    accent: colors.green, y: -220, icon: postgresIcon(),
    meter: {label: 'Операций/с', fill: 1.0, value: 50, format: v => `${formatThousands(v)}k TPS`},
  });
  stage.add(reads.node);
  yield* reads.appear();

  yield* waitUntil('tput-writes');
  const writes = specCard({
    name: 'Запись', tag: 'TPS', spec: 'commit · одиночный узел',
    accent: colors.cyan, y: 10, icon: postgresIcon(),
    meter: {label: 'Операций/с', fill: 0.4, value: '10–20k TPS'},
  });
  stage.add(writes.node);
  yield* writes.appear();

  yield* waitUntil('connections');
  const connections = specCard({
    name: 'Подключения', tag: 'concurrent', spec: 'зависит от движка и инстанса',
    accent: colors.purple, y: 240, icon: postgresIcon(),
    meter: {label: 'Одновременно', fill: 0.6, value: '5–20k'},
  });
  stage.add(connections.node);
  yield* connections.appear();

  yield* waitUntil('takeaway');
  const outro = banner({
    text: 'Одна БД — десятки TiB и тысячи TPS',
    accent: colors.blue, y: 410,
  });
  stage.add(outro.node);
  yield* outro.appear();
  yield* endScene(stage);
});
