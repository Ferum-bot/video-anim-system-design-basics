import {makeScene2D, Txt} from '@motion-canvas/2d';
import {all, createRef, easeInOutCubic, easeOutCubic, waitUntil} from '@motion-canvas/core';
import {
  backdrop, banner, colors, createStage, fonts, formatThousands,
  latencyBand, specCard,
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

  // ── Phase A: capacity numbers (memory + throughput) ─────────────────────────
  yield* waitUntil('memory');
  yield bg.appear(); // fork: dark backing fades in together with the first content
  yield* label().opacity(1, 0.5, easeOutCubic);

  const memory = specCard({
    name: 'Память', tag: 'Memory-optimized', spec: 'до ~1 TB · больше для спец-задач',
    accent: colors.blue, y: -200,
    meter: {label: 'Объём', fill: 0.65, value: 1024, format: v => `${formatThousands(v)} GB`},
  });
  stage.add(memory.node);
  yield* memory.appear();

  yield* waitUntil('throughput');
  const throughput = specCard({
    name: 'Throughput', tag: 'Redis · Graviton', spec: 'ElastiCache · на инстанс · 100–200k+',
    accent: colors.green, y: 30,
    meter: {label: 'Операций/с', fill: 1.0, value: 200, format: v => `${formatThousands(v)}k ops/s`},
  });
  stage.add(throughput.node);
  yield* throughput.appear();

  // ── Transition to latency ───────────────────────────────────────────────────
  yield* waitUntil('latency');
  yield* all(
    memory.node.opacity(0, 0.6),
    throughput.node.opacity(0, 0.6),
  );
  memory.node.remove();
  throughput.node.remove();
  yield* label().text('Задержки', 0.4);

  // ── Phase B: read / write latency (pulse speed = latency) ───────────────────
  const bands = [
    latencyBand({scope: 'Чтение · регион', kind: 'dot', from: 'app', to: 'cache',
      latency: '< 1 ms', accent: colors.green, travel: 0.4, y: -150, cue: 'lat-read'}),
    latencyBand({scope: 'Запись · 1 AZ', kind: 'dot', from: 'app', to: 'cache',
      latency: '< 1 ms', accent: colors.cyan, travel: 0.5, y: 50, cue: 'lat-write-az'}),
    latencyBand({scope: 'Запись · между AZ', kind: 'box', from: 'AZ-a', to: 'AZ-b',
      latency: '1–2 ms', accent: colors.orange, travel: 0.8, y: 250, cue: 'lat-write-cross'}),
  ];
  for (const band of bands) stage.add(band.node);
  for (const band of bands) {
    yield* waitUntil(band.cue);
    yield* band.reveal();
    yield band.pulse(); // fork: keeps bouncing in the background
  }

  yield* waitUntil('takeaway');
  const outro = banner({
    text: 'Кэш в памяти — суб-миллисекундный доступ',
    accent: colors.green, y: 410,
  });
  stage.add(outro.node);
  yield* outro.appear();
  yield* waitUntil('end'); // drag this anchor to set where the scene ends
  yield* stage.opacity(0, 0.8, easeInOutCubic); // smooth fade-out of everything
});
