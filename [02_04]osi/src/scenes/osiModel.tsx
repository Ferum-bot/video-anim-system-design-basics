import {makeScene2D, Node, Txt} from '@motion-canvas/2d';
import {all, cancel, createRef, easeInOutCubic, easeOutCubic, waitUntil} from '@motion-canvas/core';
import {colors, createStage, endScene, fonts, withAlpha} from '@lib';
import {abstractionIntro, osiStack} from '../osi';
import type {OsiLayer} from '../osi';

// The seven OSI layers, top (Application) to bottom (Physical). One accent per layer.
const LAYERS: OsiLayer[] = [
  {n: 7, name: 'Application',  role: 'осмысленная нагрузка приложения', protos: ['HTTP', 'DNS', 'SMTP'], accent: colors.purple},
  {n: 6, name: 'Presentation', role: 'кодировки · форматы · сериализация', protos: ['TLS', 'UTF-8'], accent: colors.purple},
  {n: 5, name: 'Session',      role: 'управляет сеансами', protos: ['Sockets'], accent: colors.blue},
  {n: 4, name: 'Transport',    role: 'доставка между процессами', protos: ['TCP', 'UDP'], accent: colors.cyan},
  {n: 3, name: 'Network',      role: 'маршрутизация · путь между машинами', protos: ['IP', 'ICMP'], accent: colors.blue},
  {n: 2, name: 'Data Link',    role: 'сигнал → байты', protos: ['Ethernet'], accent: colors.orange},
  {n: 1, name: 'Physical',     role: 'сами сигналы: свет · радио · ток', protos: ['Cable', 'RF'], accent: colors.red},
];

export default makeScene2D(function* (view) {
  const stage = createStage(view);
  stage.opacity(0); // scene stays hidden until the "idea" beat

  const intro = abstractionIntro({y: -10});
  const stack = osiStack({layers: LAYERS, y: 15});

  const patterns = createRef<Txt>();
  const takeaway = createRef<Txt>();
  const captions = (
    <Node>
      <Txt ref={patterns} text="инкапсуляция · абстракция · сокрытие" y={-430}
        fill={withAlpha(colors.cyan, 0.85)} fontSize={26} letterSpacing={1} fontFamily={fonts.mono} opacity={0}/>
      <Txt ref={takeaway} text="OSI — просто набор протоколов и рекомендаций" y={430}
        fill={colors.textDim} fontSize={24} fontFamily={fonts.mono} opacity={0}/>
    </Node>
  );

  stage.add(stack.node);
  stage.add(intro.node);
  stage.add(captions);

  // "Какая основная идея? — разделяем сеть на уровни абстракции": the scene eases in here,
  // not at the very start.
  yield* waitUntil('idea');
  yield* all(stage.opacity(1, 1.0, easeInOutCubic), intro.appear());

  // "…каждый использует нижележащий уровень как набор API-инструментов"
  yield* waitUntil('api');
  yield* intro.showApi();
  yield* intro.note('каждый работает через API нижнего');

  // "…такую систему и разработать проще, и поддерживать легче"
  yield* waitUntil('simpler');
  yield* intro.note('→ проще строить и поддерживать');

  // "…разные части живут в разных частях пути, проще работать с разными вендорами"
  yield* waitUntil('components');
  yield* intro.showComponents();
  yield* intro.note('разные части — в разных компонентах');

  // "…давайте пройдёмся по 7 уровням" — nothing concrete is shown yet, so fade the whole
  // scene (intro + frame) out instead of leaving a lone spine hanging over the backdrop.
  yield* waitUntil('stack');
  yield* stage.opacity(0, 0.7, easeInOutCubic);
  intro.node.opacity(0); // drop the intro while hidden — it won't come back

  // L7 — "седьмой прикладной": the frame + stack + first layer fade back in together, as the
  // narration actually starts on the layers.
  yield* waitUntil('l7');
  yield* all(stage.opacity(1, 0.8, easeInOutCubic), stack.appear());
  const pulseTask = yield stack.ridePulse(); // fork: ambient pulse down the spine
  yield* stack.reveal(0);

  // "…есть ещё два уровня ниже — шестой (представление) и пятый (сеансовый)"
  yield* waitUntil('l65');
  yield* stack.reveal(1, 2);

  // "…модель OSI — это знакомые паттерны: инкапсуляция, абстракция, сокрытие"
  yield* waitUntil('patterns');
  yield* patterns().opacity(1, 0.6, easeOutCubic);

  // L6 detail — "кодировки, форматы, сериализация"
  yield* waitUntil('l6f');
  yield* all(patterns().opacity(0, 0.4), stack.focus(1));

  // L5 detail — "сеансовый: управляет сеансами"
  yield* waitUntil('l5f');
  yield* stack.focus(2);

  // L4 — "четвёртый транспортный: доставка между процессами"
  yield* waitUntil('l4');
  yield* stack.reveal(3);

  // L3 — "третий сетевой: маршрутизация, путь между машинами"
  yield* waitUntil('l3');
  yield* stack.reveal(4);

  // L2 — "второй канальный: сигнал → байты"
  yield* waitUntil('l2');
  yield* stack.reveal(5);

  // L1 — "первый физический: сами сигналы"
  yield* waitUntil('l1');
  yield* stack.reveal(6);

  // Physical covered — light the whole stack and send a request down it and back up.
  yield* waitUntil('traverse');
  cancel(pulseTask); // free the spine pulse for the traversal
  yield* stack.unfocus();
  yield* stack.traverse();

  // "…всё это — просто набор рекомендаций"
  yield* waitUntil('takeaway');
  yield* takeaway().opacity(1, 0.7, easeOutCubic);

  yield* endScene(stage);
});
