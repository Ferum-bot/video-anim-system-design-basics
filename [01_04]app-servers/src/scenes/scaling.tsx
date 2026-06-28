import {Layout, makeScene2D} from '@motion-canvas/2d';
import {all, easeOutBack, easeOutCubic, sequence, waitUntil} from '@motion-canvas/core';
import {
  backdrop, banner, colors, createStage, endScene, podIcon, sectionLabel, specCard,
} from '@lib';

export default makeScene2D(function* (view) {
  const stage = createStage(view);

  const bg = backdrop();
  stage.add(bg.node); // behind everything, hidden until the first component appears

  const label = sectionLabel('Когда масштабироваться горизонтально');
  stage.add(label.node);

  // ── The signal: CPU utilization stays high ──────────────────────────────────
  yield* waitUntil('cpu');
  yield bg.appear(); // fork: dark backing fades in together with the first content
  yield* label.appear();

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
  yield* endScene(stage);
});
