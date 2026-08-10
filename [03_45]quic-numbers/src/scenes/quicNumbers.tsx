import {makeScene2D} from '@motion-canvas/2d';
import {all, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage, sceneCaption} from '@lib';
import {runningNote, speedChart, userspaceCost} from '../num';

const STAGE_HEIGHT = 700;
const CAPTION_Y = -304;
const CHART_Y = 16;
const COST_Y = -40;
const NOTE_Y = 292;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const caption = sceneCaption({text: 'ЦИФРЫ ВМЕСТО МИФА', y: CAPTION_Y, fontWeight: 500});
  const chart = speedChart({y: CHART_Y});
  const cost = userspaceCost({y: COST_Y});
  const note = runningNote({y: NOTE_Y});

  stage.add(chart.node);
  stage.add(cost.node);
  stage.add(note.node);
  stage.add(caption.node);

  // «Есть вторая часть, где миф уже не работает, — это цифры»
  yield* waitUntil('numbers');
  yield* all(revealStage(stage), caption.appear(), chart.appear());

  yield* waitUntil('study');
  yield* all(chart.study(), note.say('исследование 2024 года, главная конференция веб-мира'));

  // «На быстрых каналах связи…»
  yield* waitUntil('fast');
  yield* all(chart.drawTcp(), note.say('на быстрых каналах связи'));

  // «QUIC + HTTP/3 теряет до 45% скорости против TCP + TLS + HTTP/2»
  yield* waitUntil('lose45');
  yield* chart.drawQuic();

  // «Примерно до 600 мегабит в секунду протоколы идут вровень»
  yield* waitUntil('six00');
  yield* all(chart.mark(), note.say('примерно до 600 Мбит/с протоколы идут вровень'));

  // «А дальше QUIC стабильно отстаёт, и разрыв растёт с ростом полосы»
  yield* waitUntil('gap');
  yield* all(chart.gap(), note.say('дальше разрыв только растёт вместе с полосой'));

  yield* waitUntil('browsers');
  yield* chart.chips(0);

  yield* waitUntil('bitrate');
  yield* all(chart.chips(1), note.say('бьёт даже по стримингу'));

  // «Причина ровно та — цена user space»
  yield* waitUntil('why');
  yield* all(chart.dismiss(), caption.retitle('ЦЕНА USER SPACE'));
  yield* all(cost.appear(), note.say('приёмная сторона захлёбывается обработкой'));

  // «Ядро передаёт наверх лавину мелких UDP-пакетов поштучно, офлоадов нет»
  yield* waitUntil('flood');
  yield cost.flow(); // fork: обе стороны отдают наверх до самой шторки
  yield* note.say('ядро отдаёт наверх лавину мелких пакетов поштучно');

  yield* waitUntil('userspace');
  yield* note.say('вся нагрузка уезжает в пользовательский код, где оптимизаций пока мало');

  yield* waitUntil('forty');
  yield* cost.forty();

  // Exit is composed by hand instead of `endScene`, matching the other video-03 parts.
  yield* waitUntil('end');
  yield* all(
    stage.opacity(0, FADE_OUT, easeInOutCubic),
    stage.scale(0.98, FADE_OUT, easeInOutCubic),
  );
});
