import {makeScene2D, Txt} from '@motion-canvas/2d';
import {all, createRef, easeInOutCubic, easeOutCubic, waitUntil} from '@motion-canvas/core';
import {
  backdrop, banner, colors, createStage, fonts, formatThousands, podIcon, specCard,
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

  // ── Compute: CPU + memory ────────────────────────────────────────────────────
  yield* waitUntil('cpu');
  yield bg.appear(); // fork: dark backing fades in together with the first content
  yield* label().opacity(1, 0.5, easeOutCubic);

  const cpu = specCard({
    name: 'CPU', tag: 'ядра', spec: '8–64 ядра на инстанс',
    accent: colors.blue, y: -110, icon: podIcon(),
    meter: {label: 'Ядра', fill: 1.0, value: 64, format: v => `${formatThousands(v)} ядер`},
  });
  stage.add(cpu.node);
  yield* cpu.appear();

  yield* waitUntil('memory');
  const memory = specCard({
    name: 'Память', tag: 'RAM', spec: '64–512 GB · high-memory — до 2 TB',
    accent: colors.purple, y: 110, icon: podIcon(),
    meter: {label: 'Объём', fill: 0.25, value: 512, format: v => `${formatThousands(v)} GB`},
  });
  stage.add(memory.node);
  yield* memory.appear();

  // ── Network: bandwidth + connections ────────────────────────────────────────
  yield* waitUntil('network');
  yield* all(
    cpu.node.opacity(0, 0.6),
    memory.node.opacity(0, 0.6),
  );
  cpu.node.remove();
  memory.node.remove();

  const network = specCard({
    name: 'Сеть', tag: 'Gbps', spec: '25 Gbps · high-perf — 50–100 Gbps',
    accent: colors.green, y: -110, icon: podIcon(),
    meter: {label: 'Пропускная способность', fill: 0.25, value: 25, format: v => `${formatThousands(v)} Gbps`},
  });
  stage.add(network.node);
  yield* network.appear();

  yield* waitUntil('connections');
  const connections = specCard({
    name: 'Подключения', tag: 'concurrent', spec: '100k+ на инстанс · оптимизированные конфигурации',
    accent: colors.cyan, y: 110, icon: podIcon(),
    meter: {label: 'Одновременно', fill: 1.0, value: '100k+'},
  });
  stage.add(connections.node);
  yield* connections.appear();

  yield* waitUntil('takeaway');
  const outro = banner({
    text: 'Один инстанс — десятки ядер и 100k+ соединений',
    accent: colors.blue, y: 410,
  });
  stage.add(outro.node);
  yield* outro.appear();
  yield* waitUntil('end'); // drag this anchor to set where the scene ends
  yield* stage.opacity(0, 0.8, easeInOutCubic); // smooth fade-out of everything
});
