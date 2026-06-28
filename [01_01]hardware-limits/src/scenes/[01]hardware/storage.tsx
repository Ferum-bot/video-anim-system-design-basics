import {makeScene2D} from '@motion-canvas/2d';
import {waitUntil} from '@motion-canvas/core';
import {backdrop, banner, colors, createStage, endScene, formatThousands, specCard} from '@lib';

// Sync markers — drag these on the editor timeline to match the narration.
export default makeScene2D(function* (view) {
  const stage = createStage(view);

  const bg = backdrop();
  stage.add(bg.node); // behind everything, hidden until the first component appears

  // ── Local NVMe SSD ──────────────────────────────────────────────────────────
  yield* waitUntil('ssd');
  yield bg.appear(); // fork: dark backing fades in together with the first card
  const ssd = specCard({
    name: 'i3en.24xlarge', tag: 'Local SSD', spec: 'NVMe SSD · 8 × 7.5 TB',
    accent: colors.cyan, y: -260,
    meter: {label: 'Хранилище', fill: 0.25, value: 60, format: v => `${v.toFixed(0)} TB`},
    cost: {value: 7920, prefix: '~$'},
  });
  stage.add(ssd.node);
  yield* ssd.appear();

  // ── Dense HDD ────────────────────────────────────────────────────────────────
  yield* waitUntil('hdd');
  const hdd = specCard({
    name: 'd3en.12xlarge', tag: 'Dense HDD', spec: 'HDD · магнитные диски',
    accent: colors.orange, y: -30,
    meter: {label: 'Хранилище', fill: 0.72, value: 336, format: v => `${formatThousands(v)} TB`},
    cost: {value: 4606, prefix: '~$'},
  });
  stage.add(hdd.node);
  yield* hdd.appear();

  // ── Object storage: effectively unlimited ───────────────────────────────────
  yield* waitUntil('object-storage');
  const object = specCard({
    name: 'Amazon S3', tag: 'Object Storage', spec: 'Петабайтный масштаб',
    accent: colors.purple, y: 200,
    meter: {label: 'Хранилище', fill: 1.0, value: '∞'},
    cost: {value: '$0.023', note: 'за GB / мес'},
  });
  stage.add(object.node);
  yield* object.appear();

  yield* waitUntil('takeaway');
  const outro = banner({
    text: 'Хранилище давно не главное ограничение',
    accent: colors.cyan, y: 385,
  });
  stage.add(outro.node);
  yield* outro.appear();
  yield* endScene(stage);
});
