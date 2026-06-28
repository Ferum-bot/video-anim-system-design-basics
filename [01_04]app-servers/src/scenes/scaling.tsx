import {Layout, makeScene2D, Txt} from '@motion-canvas/2d';
import {
  all, createRef, easeInOutCubic, easeOutBack, easeOutCubic, sequence, waitUntil,
} from '@motion-canvas/core';
import {backdrop, banner, colors, createStage, fonts, podIcon, specCard} from '@lib';

export default makeScene2D(function* (view) {
  const stage = createStage(view);

  const bg = backdrop();
  stage.add(bg.node); // behind everything, hidden until the first component appears

  const label = createRef<Txt>();
  stage.add(
    <Txt ref={label} text="Когда масштабироваться горизонтально" fill={colors.textMuted}
      fontSize={26} fontWeight={600} fontFamily={fonts.mono} y={-330} opacity={0}/>,
  );

  // ── The signal: CPU utilization stays high ──────────────────────────────────
  yield* waitUntil('cpu');
  yield bg.appear(); // fork: dark backing fades in together with the first content
  yield* label().opacity(1, 0.5, easeOutCubic);

  const cpu = specCard({
    name: 'Загрузка CPU', tag: 'сигнал', spec: 'устойчиво выше 70–80%',
    accent: colors.orange, y: -130, icon: podIcon(),
    meter: {label: 'Utilization', fill: 0.78, value: '70–80%'},
  });
  stage.add(cpu.node);
  yield* cpu.appear();

  // ── The response: scale out — add pods ──────────────────────────────────────
  yield* waitUntil('scale-out');
  const pods = Array.from({length: 4}, () => podIcon());
  for (const pod of pods) {
    pod.opacity(0);
    pod.scale(0.5);
  }
  stage.add(<Layout layout gap={28} y={150}>{pods}</Layout>);
  yield* sequence(0.18, ...pods.map(pod =>
    all(pod.opacity(1, 0.4, easeOutCubic), pod.scale(1, 0.45, easeOutBack)),
  ));

  yield* waitUntil('takeaway');
  const outro = banner({
    text: 'Загрузка растёт → добавляем поды',
    accent: colors.orange, y: 320,
  });
  stage.add(outro.node);
  yield* outro.appear();
  yield* waitUntil('end'); // drag this anchor to set where the scene ends
  yield* stage.opacity(0, 0.8, easeInOutCubic); // smooth fade-out of everything
});
