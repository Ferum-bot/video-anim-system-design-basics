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

  // Section label, reused across the two phases (hidden until the bandwidth cue).
  const phase = createRef<Txt>();
  stage.add(
    <Txt ref={phase} text="Пропускная способность" fill={colors.textMuted}
      fontSize={26} fontWeight={600} fontFamily={fonts.mono} y={-330} opacity={0}/>,
  );

  // ── Phase A: bandwidth (cards without a price) ──────────────────────────────
  yield* waitUntil('bandwidth');
  yield bg.appear(); // fork: dark backing fades in together with the first content
  yield* phase().opacity(1, 0.5, easeOutCubic);

  const standard = specCard({
    name: 'Standard instance', tag: 'EC2', spec: 'Внутри датацентра',
    accent: colors.blue, y: -200, pace: 1.5,
    meter: {label: 'Пропускная способность', fill: 0.25, value: 25, format: v => `${formatThousands(v)} Gbps`},
  });
  stage.add(standard.node);
  yield* standard.appear();

  yield* waitUntil('high-perf');
  const highPerf = specCard({
    name: 'High-performance', tag: 'EFA / Enhanced', spec: '50–100 Gbps и выше',
    accent: colors.green, y: 30, pace: 1.5,
    meter: {label: 'Пропускная способность', fill: 1.0, value: 100, format: v => `${formatThousands(v)} Gbps`},
  });
  stage.add(highPerf.node);
  yield* highPerf.appear();

  yield* waitUntil('az-bandwidth');
  const note = createRef<Txt>();
  stage.add(
    <Txt ref={note} text="Между AZ в регионе — ограничено только сетью инстанса"
      fill={colors.textMuted} fontSize={21} fontFamily={fonts.mono} y={210} opacity={0}/>,
  );
  yield* note().opacity(1, 0.7, easeOutCubic);

  // ── Transition to latency ───────────────────────────────────────────────────
  yield* waitUntil('latency');
  yield* all(
    standard.node.opacity(0, 0.6),
    highPerf.node.opacity(0, 0.6),
    note().opacity(0, 0.6),
  );
  standard.node.remove();
  highPerf.node.remove();
  note().remove();
  yield* phase().text('Задержки предсказуемы', 0.4);

  // ── Phase B: latency topology (one cue per tier) ────────────────────────────
  const bands = [
    latencyBand({scope: 'Внутри AZ', kind: 'dot', from: 'node', to: 'node',
      latency: '< 1 ms', accent: colors.green, travel: 0.4, y: -170, cue: 'lat-within-az'}),
    latencyBand({scope: 'Между AZ', kind: 'box', from: 'AZ-a', to: 'AZ-b',
      latency: '1–2 ms', accent: colors.cyan, travel: 0.7, y: 40, cue: 'lat-across-az'}),
    latencyBand({scope: 'Между регионами', kind: 'box', from: 'us-east-1', to: 'eu-west-1',
      latency: '50–150 ms', accent: colors.orange, travel: 1.5, y: 250, cue: 'lat-cross-region'}),
  ];
  for (const band of bands) stage.add(band.node);
  for (const band of bands) {
    yield* waitUntil(band.cue);
    yield* band.reveal();
    yield band.pulse(); // fork: keeps bouncing in the background
  }

  yield* waitUntil('takeaway');
  const outro = banner({
    text: 'Предсказуемая сеть → надёжные распределённые системы',
    accent: colors.blue, y: 410,
  });
  stage.add(outro.node);
  yield* outro.appear();
  yield* waitUntil('end'); // drag this anchor to set where the scene ends
  yield* stage.opacity(0, 0.8, easeInOutCubic); // smooth fade-out of everything
});
