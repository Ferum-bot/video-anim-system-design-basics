import {Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {
  all,
  cancel,
  createRef,
  delay,
  easeInOutCubic,
  easeOutCubic,
  waitUntil,
} from '@motion-canvas/core';
import {colors, createStage, fonts, revealStage, withAlpha} from '@lib';
import {
  TILE,
  WALL,
  apiElbow,
  carbonSheet,
  fileTile,
  headline,
  kernelWall,
  request,
  shapeTrial,
} from '../berkeley';

// Откуда взялись сокеты. Кадр держат две неподвижные вещи — твоя программа сверху и ядро
// снизу; всё остальное происходит между ними. Габарит поэтому один и тот же на каждом бите:
// верх плиты и низ стены симметричны относительно центра панели.
const STAGE_HEIGHT = 860;

const PLATE = {width: 360, height: 64} as const;
const PLATE_Y = -335;
const WALL_Y = 266;
const WALL_TOP = WALL_Y - WALL.height / 2;

const HEADLINE_Y = -140;
const HEADLINE_DOCK = -240;

const TILE_Y = -40;
const TILE_X = 210;
// Третий лист выезжает из-под сокета вправо-вниз: наружу торчит только полоса с подписью.
// Он утяжеляет правый край, поэтому вся пара на этом бите сдвигается ему навстречу.
const SHEET_OFFSET = 36;
const PAIR_SHIFT = -SHEET_OFFSET / 2;

const SHAPES_Y = 45;
const BANNER_Y = 128;
const ELBOW_MID_Y = 118;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const wall = kernelWall({y: WALL_Y});
  // Провод рисуется уже после того, как сокет встал по центру над дверью, — прямой отвес.
  const elbow = apiElbow({
    fromX: 0,
    fromY: TILE_Y + TILE.height / 2,
    midY: ELBOW_MID_Y,
    toX: 0,
    toY: WALL_TOP,
  });
  const trial = shapeTrial({y: SHAPES_Y});
  const knock = request({x: 0, fromY: PLATE_Y + 45, toY: WALL_TOP - 12});
  const sheet = carbonSheet({x: TILE_X + SHEET_OFFSET, y: TILE_Y + SHEET_OFFSET});
  const file = fileTile({x: 0, y: TILE_Y, label: 'ФАЙЛ'});
  const sock = fileTile({x: TILE_X, y: TILE_Y, label: 'СЕТЕВОЕ СОЕДИНЕНИЕ'});
  const title = headline({y: HEADLINE_Y});

  const plate = createRef<Rect>();
  const banner = createRef<Txt>();
  // Плитки живут в одной группе: третий лист сдвигает всю пару, а не себя одного.
  const pair = createRef<Node>();

  stage.add(wall.node);
  stage.add(elbow.node);
  stage.add(trial.node);
  stage.add(knock.node);
  stage.add(
    // Порядок объявления = порядок отрисовки: копия обязана лежать **под** оригиналом.
    <Node ref={pair}>
      {sheet.node}
      {file.node}
      {sock.node}
    </Node>,
  );
  stage.add(
    <Node>
      <Rect ref={plate} y={PLATE_Y} width={PLATE.width} height={PLATE.height} radius={10}
        fill={colors.track} stroke={withAlpha(colors.cyan, 0.55)} lineWidth={1.5} opacity={0}>
        <Txt text="ТВОЯ ПРОГРАММА" fill={withAlpha(colors.text, 0.9)} fontSize={20}
          fontFamily={fonts.mono} fontWeight={500} letterSpacing={1.4}/>
      </Rect>
      {title.node}
      <Txt ref={banner} y={BANNER_Y} text="" fill={colors.textMuted} fontSize={17}
        fontFamily={fonts.mono} letterSpacing={1.4} opacity={0}/>
    </Node>,
  );

  /** Подпись под плитками — живёт через несколько битов. Пустая строка гасит её. */
  function* say(text: string) {
    if (banner().opacity() > 0) yield* banner().opacity(0, 0.2);
    if (!text) return;
    banner().text(text);
    yield* banner().opacity(1, 0.35, easeOutCubic);
  }

  // ── Вопрос ─────────────────────────────────────────────────────────────────
  // «Разберём сокеты»: программа сверху, ядро снизу, между ними пока ничего.
  yield* waitUntil('open');
  yield* all(revealStage(stage), plate().opacity(1, 0.7, easeOutCubic), wall.appear());
  yield* knock.channel();

  // «1983 год. Команда Berkeley встраивает свежий стек TCP/IP в Unix»
  yield* waitUntil('team');
  yield* all(
    wall.stack('TCP/IP'),
    title.set('1983', 'КОМАНДА BERKELEY ВСТРАИВАЕТ TCP/IP В UNIX'),
  );

  // «Как обычная программа должна просить у ядра сетевое соединение?» — запрос доезжает
  // до кромки и отскакивает: двери ещё нет.
  yield* waitUntil('howask');
  yield* title.clear();
  yield* knock.knock();
  yield* title.set('КАК ПРОСИТЬ У ЯДРА?', 'СЕТЕВОЕ СОЕДИНЕНИЕ — ОБЫЧНОЙ ПРОГРАММОЙ');

  // «Какой формы должна быть эта дверь?»
  yield* waitUntil('whatshape');
  yield* all(title.set('КАКОЙ ФОРМЫ ДВЕРЬ?'), trial.appear());
  const trying = yield trial.cycle();

  // «И они принимают дизайнерское решение, которое пережило всех»
  yield* waitUntil('decision');
  cancel(trying);
  yield* all(trial.settle(), title.set('РЕШЕНИЕ ПЕРЕЖИЛО ВСЕХ'));

  // ── Всё есть файл ──────────────────────────────────────────────────────────
  // «В Unix уже была великая идея» — ни один из вариантов не понадобился.
  yield* waitUntil('unix');
  yield* all(trial.reject(), title.set('В UNIX УЖЕ БЫЛА ИДЕЯ'));

  // «Всё есть файл»
  yield* waitUntil('everything');
  yield* title.set('ВСЁ ЕСТЬ ФАЙЛ');

  // «Открыл, получил дескриптор» — строка уезжает наверх и становится шапкой, освобождая
  // середину кадра плитке.
  yield* waitUntil('descriptor');
  yield* all(
    title.dock(HEADLINE_DOCK),
    knock.dismiss(),
    delay(0.35, file.appear()),
  );
  yield* file.descriptor('fd 3');
  yield* file.note('ОТКРЫЛ — ПОЛУЧИЛ ДЕСКРИПТОР');

  // «Пусть сетевое соединение выглядит так же» — копия выходит из-под оригинала.
  yield* waitUntil('same');
  yield* all(
    file.moveTo(-TILE_X, TILE_Y),
    sock.emerge(0, TILE_Y),
    title.say('ПУСТЬ ВЫГЛЯДИТ ТАК ЖЕ'),
  );

  // «Не новая модель ввода-вывода, не какая-то магия — просто ещё один дескриптор»
  yield* waitUntil('justfd');
  yield* all(sock.descriptor('fd 4'), title.say('НЕ НОВАЯ МОДЕЛЬ · НЕ МАГИЯ'));
  yield* sock.note('ЕЩЁ ОДИН ДЕСКРИПТОР');

  // «Так в Berkeley Unix 4.2BSD родились сокеты» — и в стене наконец прорезают проём.
  yield* waitUntil('bsd');
  yield* all(sock.stamp('4.2BSD'), wall.openDoor(), title.say('ТАК РОДИЛИСЬ СОКЕТЫ'));
  const breathA = yield file.idle();
  const breathB = yield sock.idle();

  // ── Почему это гениально ───────────────────────────────────────────────────
  // «Почему это вообще гениально?»
  yield* waitUntil('why');
  yield* title.say('ПОЧЕМУ ЭТО ГЕНИАЛЬНО');

  // «Умеешь работать с файлами — умеешь работать и с сетью»: один и тот же ряд кнопок
  // мигает на обеих плитках одним жестом.
  yield* waitUntil('knowfiles');
  yield* all(
    file.blink(3),
    sock.blink(3),
    title.say('УМЕЕШЬ С ФАЙЛАМИ — УМЕЕШЬ С СЕТЬЮ'),
  );

  // «Сокеты де-факто стали стандартом абстрагирования транспорта»
  yield* waitUntil('defacto');
  yield* all(title.say('ДЕ-ФАКТО СТАНДАРТ'), say('АБСТРАКЦИЯ ТРАНСПОРТА ДЛЯ ПРИКЛАДНОГО УРОВНЯ'));

  // «Победа настолько полная, что даже Windows скопировал подход» — третий лист.
  yield* waitUntil('win');
  yield* all(
    sheet.emerge(TILE_X, TILE_Y),
    pair().x(PAIR_SHIFT, 1.0, easeInOutCubic),
    say(''),
  );

  // «В экосистеме Windows это называется WinSock»
  yield* waitUntil('winsock');
  yield* all(sheet.name('WINDOWS · WINSOCK'), title.say('ДАЖЕ WINDOWS СКОПИРОВАЛ'));

  // ── Независимость от того, что снизу ───────────────────────────────────────
  // «Вся эта независимость от того, что было снизу» — меняется только содержимое стены.
  yield* waitUntil('independent');
  yield* title.say('НЕЗАВИСИМО ОТ ТОГО, ЧТО СНИЗУ');
  yield* wall.swap('ЛОКАЛЬНЫЙ ОБМЕН');
  yield* wall.swap('ЧТО УГОДНО СНИЗУ');

  // «Заложена архитектурно» — сокет наконец подключается к двери.
  yield* waitUntil('arch');
  cancel(breathA);
  yield* all(
    wall.swap('TCP/IP'),
    title.say('ЗАЛОЖЕНО АРХИТЕКТУРНО'),
    sheet.dismiss(),
    file.dismiss(),
    pair().x(0, 0.9, easeInOutCubic),
    sock.moveTo(0, TILE_Y),
  );
  yield* elbow.draw();
  yield* wall.plug();
  const calls = yield elbow.run(1.9);

  // «Уже первая версия поддерживала несколько семейств протоколов»
  yield* waitUntil('families');
  yield* all(wall.fork(), title.say('ИНТЕРНЕТ И СОСЕДНИЙ ПРОЦЕСС'));

  // «И всё это через один и тот же API»
  yield* waitUntil('sameapi');
  yield* all(wall.oneApi(), title.say('ЧЕРЕЗ ОДИН И ТОТ ЖЕ API'));
  yield wall.breathe();

  yield* waitUntil('end');
  cancel(calls);
  cancel(breathB);
  yield* stage.opacity(0, FADE_OUT, easeInOutCubic);
});
