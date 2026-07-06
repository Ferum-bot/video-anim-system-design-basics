import {makeScene2D} from '@motion-canvas/2d';
import {waitFor, waitUntil} from '@motion-canvas/core';
import {colors, createStage, endScene} from '@lib';
import {protocolCard, sceneHeading} from '../net';

// A 2×2 board of application-layer protocols. Each tile keeps its layer accent.
const CARDS = [
  {
    name: 'HTTP', transport: 'TCP', accent: colors.purple,
    fields: [{label: 'port', value: '80 / 443'}, {label: 'model', value: 'request → response'}],
    purpose: 'Веб: браузер запрашивает страницы и API.',
    col: -1, row: -1,
  },
  {
    name: 'DNS', transport: 'UDP', accent: colors.blue,
    fields: [{label: 'port', value: '53'}, {label: 'model', value: 'query → answer'}],
    purpose: 'Имя домена → IP-адрес.',
    col: 1, row: -1,
  },
  {
    name: 'WebSocket', transport: 'TCP', accent: colors.cyan,
    fields: [{label: 'port', value: '80 / 443'}, {label: 'model', value: 'full-duplex'}],
    purpose: 'Постоянный двусторонний канал в реальном времени.',
    col: -1, row: 1,
  },
  {
    name: 'gRPC', transport: 'HTTP/2', accent: colors.green,
    fields: [{label: 'port', value: 'any'}, {label: 'model', value: 'streams · protobuf'}],
    purpose: 'Быстрые вызовы между сервисами.',
    col: 1, row: 1,
  },
] as const;

const COL_X = 215; // half the horizontal gap between the two columns
const ROW_Y = 130; // half the vertical gap between the two rows

export default makeScene2D(function* (view) {
  const stage = createStage(view);

  const heading = sceneHeading({
    caption: 'LAYER 7 // APPLICATION',
    title: 'Протоколы приложений',
    accent: colors.purple,
    y: -360,
  });
  stage.add(heading.node);
  yield* heading.appear();

  yield* waitUntil('cards');
  const cards = CARDS.map(c =>
    protocolCard({
      name: c.name, transport: c.transport, fields: [...c.fields],
      purpose: c.purpose, accent: c.accent,
      x: c.col * COL_X, y: 70 + c.row * ROW_Y,
    }),
  );
  for (const card of cards) {
    stage.add(card.node);
    yield* card.appear();
    yield* waitFor(0.2);
  }

  yield* waitFor(0.5);
  yield* endScene(stage);
});
