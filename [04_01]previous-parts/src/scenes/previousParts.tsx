import {makeScene2D} from '@motion-canvas/2d';
import {all, cancel, delay, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {createStage, revealStage} from '@lib';
import {hintChip, seriesCard} from '../series';
import partOne from '../assets/part-01-networks.jpg';
import partTwo from '../assets/part-02-transport.jpg';

// Nearly the full canvas height: the two thumbnails stack and take all of it, so there is no
// dead air left over at the top or the bottom. 978 usable units after the 16px frame inset.
const STAGE_HEIGHT = 1010;

// Раскладка считается от **габарита с засечками**: уголок торчит за карточку на 13 единиц,
// и если мерить по краю картинки, сверху остаётся меньше воздуха, чем снизу. Блок из двух
// карточек с подписями (824 единицы) центрируется в панели, а под чип место освобождается
// подъёмом — иначе кадр без чипа, а он живёт 22 секунды из 29, оказывается нижнетяжёлым.
const SLOT_TOP_Y = -224;
const SLOT_BOTTOM_Y = 203;
const CHIP_LIFT = 42; // на сколько стопка поднимается, впуская чип
const CHIP_Y = 425;

// Пока карточка одна, она играет героя: 837 в ширину — почти во всю панель, и её блок
// центрирован так же, как потом центрирована стопка. На `dock` она ужимается до слотовой
// ширины, освобождая место второй.
const SOLO = {y: -12, scale: 1.35} as const;
const SLOT_HANDOVER = 0.7; // вторая ждёт, пока первая ужмётся и уйдёт из нижней половины

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  // The first card enters alone in the middle, then docks up when the second one arrives.
  const first = seriesCard({
    src: partOne,
    label: 'ЧАСТЬ 1 · ФУНДАМЕНТ СЕТЕЙ',
    x: 0,
    y: SLOT_TOP_Y,
    enter: SOLO,
  });
  const second = seriesCard({
    src: partTwo,
    label: 'ЧАСТЬ 2 · ТРАНСПОРТНЫЙ УРОВЕНЬ',
    x: 0,
    y: SLOT_BOTTOM_Y,
  });
  const chip = hintChip({text: 'СМОТРИ ПРЕДЫДУЩИЕ ЧАСТИ', y: CHIP_Y});

  stage.add(first.node);
  stage.add(second.node);
  stage.add(chip.node);

  // «В первом видео мы разбирали, что такое компьютерная сеть»
  yield* waitUntil('series1');
  yield* all(revealStage(stage), first.appear());
  const breathFirst = yield first.idle(); // fork: a barely-there breath through the hold

  // «Во втором видео мы коснулись транспортного уровня» — первая карточка уходит наверх,
  // освобождая нижний слот, и только потом в него садится вторая: без задержки они
  // накладываются рамками посреди проезда. `dock` двигает group, `idle` — вложенный breath,
  // так что отменять дыхание не нужно: они крутят разные ноды.
  yield* waitUntil('series2');
  yield* all(first.dock(), delay(SLOT_HANDOVER, second.appear()));
  const breathSecond = yield second.idle();

  // «Если ты не смотрел предыдущие части — обязательно посмотри их»: карточки загораются
  // по очереди, и соседка на это время притухает — прожектор читается лучше, чем вспышка
  // сама по себе. Дыхание и вспышка делят glow, поэтому циклы гасим первыми.
  yield* waitUntil('watch');
  cancel(breathFirst);
  cancel(breathSecond);
  yield* all(first.flare(), second.dim());
  yield* all(second.flare(), second.undim(), first.dim());
  yield* first.undim();

  // «Ссылка появится здесь» — сюда хост кладёт YouTube-карточку. Чип и обе карточки
  // форкаются на одном кадре и на общем полупериоде, поэтому пульсируют в такт.
  yield* waitUntil('link');
  yield* all(first.lift(CHIP_LIFT), second.lift(CHIP_LIFT), chip.appear());
  yield first.pulse();
  yield second.pulse();
  yield chip.pulse();

  // Exit is composed by hand instead of `endScene`: the cards drift up and shrink while the
  // panel fades, which reads better than a flat opacity drop on two still images.
  yield* waitUntil('end');
  yield* all(first.dismiss(), second.dismiss(), stage.opacity(0, FADE_OUT, easeInOutCubic));
});
