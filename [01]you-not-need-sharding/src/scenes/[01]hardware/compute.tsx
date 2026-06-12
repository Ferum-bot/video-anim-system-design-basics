import {makeScene2D, Layout, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutCubic, sequence, waitFor} from '@motion-canvas/core';
import {
  banner, colors, counter, createStage, fonts,
  formatThousands, sceneTitle, specCard, withAlpha,
} from '@lib';

// Comparison grid: eight small servers that add up to one big one.
const MINI_W = 182;
const MINI_H = 104;
const MINI_GAP = 16;
const MINI_COUNT = 8;

export default makeScene2D(function* (view) {
  const stage = createStage(view);

  const title = sceneTitle({
    title: 'Современное железо',
    subtitle: 'AWS EC2 — On-Demand цены',
    accent: colors.blue,
  });
  stage.add(title.node);
  yield* title.appear();
  yield* waitFor(0.4);

  // ── The big server (stays at the top for the whole scene) ───────────────────
  const big = specCard({
    name: 'm6i.32xlarge', tag: 'General Purpose', spec: '128 vCPU',
    accent: colors.blue, y: -320,
    meter: {label: 'Память', fill: 0.32, value: 512, format: v => `${formatThousands(v)} GiB`},
    cost: {value: 6144, prefix: '$'},
  });
  stage.add(big.node);
  yield* big.appear();
  yield* waitFor(0.8);

  // ── Comparison: 8 × m6i.4xlarge add up to the same specs and the same price ──
  const prompt = createRef<Txt>();
  stage.add(
    <Txt ref={prompt} text="А что если взять 8 серверов поменьше?"
      fill={colors.textMuted} fontSize={24} fontFamily={fonts.mono} y={-150} opacity={0}/>,
  );
  yield* prompt().opacity(1, 0.6, easeOutCubic);
  yield* waitFor(0.3);

  const grid = createRef<Layout>();
  const cells = Array.from({length: MINI_COUNT}, () => createRef<Rect>());
  stage.add(
    <Layout ref={grid} layout wrap="wrap" gap={MINI_GAP}
      width={4 * MINI_W + 3 * MINI_GAP} y={0}>
      {cells.map(ref => (
        <Rect ref={ref} layout direction="column" gap={5} padding={12}
          alignItems="center" justifyContent="center"
          width={MINI_W} height={MINI_H} radius={8}
          fill={colors.surface} stroke={colors.red} lineWidth={1.5}
          shadowColor={withAlpha(colors.red, 0.2)} shadowBlur={10}
          opacity={0} scale={0.85}>
          <Txt text="m6i.4xlarge" fill={colors.textDim} fontSize={15} fontWeight={600} fontFamily={fonts.mono}/>
          <Txt text="64 GiB" fill={colors.red} fontSize={19} fontWeight={700} fontFamily={fonts.mono}/>
          <Txt text="16 vCPU" fill={colors.textMuted} fontSize={13} fontFamily={fonts.mono}/>
          <Txt text="$768 / мес" fill={colors.green} fontSize={15} fontWeight={600} fontFamily={fonts.mono}/>
        </Rect>
      ))}
    </Layout>,
  );
  yield* sequence(0.12, ...cells.map(ref =>
    all(ref().opacity(1, 0.5, easeOutCubic), ref().scale(1, 0.5, easeOutCubic)),
  ));
  yield* waitFor(0.5);

  // Badge: the total counts up to exactly the price of the big server.
  const total = counter(6144, v => `$${formatThousands(v)} / мес`);
  const badge = createRef<Rect>();
  stage.add(
    <Rect ref={badge} layout direction="row" gap={18} padding={[16, 30]}
      alignItems="center" justifyContent="center" radius={12}
      fill={withAlpha(colors.green, 0.1)} stroke={colors.green} lineWidth={2}
      y={200} opacity={0} scale={0.9}>
      <Txt text="8 × $768" fill={colors.textDim} fontSize={28} fontFamily={fonts.mono}/>
      <Txt text="=" fill={colors.textMuted} fontSize={28} fontFamily={fonts.mono}/>
      <Txt text={total.text} fill={colors.green} fontSize={30} fontWeight={700} fontFamily={fonts.mono}/>
      <Txt text="✓ та же цена!" fill={colors.green} fontSize={22} fontFamily={fonts.mono}/>
    </Rect>,
  );
  yield* all(
    badge().opacity(1, 0.6, easeOutCubic),
    badge().scale(1, 0.6, easeOutCubic),
  );
  yield* total.count(1.2);
  yield* waitFor(1.6);

  // Clear the comparison, keep the big server.
  yield* all(
    prompt().opacity(0, 0.5),
    grid().opacity(0, 0.5),
    badge().opacity(0, 0.5),
  );
  prompt().remove();
  grid().remove();
  badge().remove();
  yield* waitFor(0.3);

  // ── Memory-optimized and high-memory instances ──────────────────────────────
  const memoryOptimized = specCard({
    name: 'x1e.32xlarge', tag: 'Memory Optimized', spec: '128 vCPU',
    accent: colors.purple, y: -90,
    meter: {label: 'Память', fill: 0.66, value: 3904, format: v => `${formatThousands(v)} GiB`},
    cost: {value: 19216, prefix: '$'},
  });
  stage.add(memoryOptimized.node);
  yield* memoryOptimized.appear();
  yield* waitFor(0.8);

  const highMemory = specCard({
    name: 'u-24tb1.metal', tag: 'High Memory', spec: '448 vCPU',
    accent: colors.orange, y: 140,
    meter: {label: 'Память', fill: 1.0, value: 24, format: v => `${v.toFixed(0)} TB`},
    cost: {value: 157000, prefix: '~$'},
  });
  stage.add(highMemory.node);
  yield* highMemory.appear();
  yield* waitFor(0.8);

  const outro = banner({
    text: 'Многие задачи решаются на одной машине',
    accent: colors.blue, y: 320,
  });
  stage.add(outro.node);
  yield* outro.appear();
  yield* waitFor(2.5);
});
