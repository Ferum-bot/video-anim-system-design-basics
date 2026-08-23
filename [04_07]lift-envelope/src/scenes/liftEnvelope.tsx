import {Line, Node, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, createRef, easeInOutCubic, easeOutCubic, waitUntil} from '@motion-canvas/core';
import {colors, createStage, fonts, revealStage, withAlpha} from '@lib';
import {COLUMN, envelope, floorColumn} from '../lift';

// Один объект на всю часть: сообщение обрастает заголовками, режется на два куска, уезжает
// по проводу и разбирается обратно. В конце та же полоса **сворачивается в матрёшку** —
// не другая картинка, а тот же набор сегментов в другой геометрии.
const STAGE_HEIGHT = 800;

// Колонка и полоса считаются как одна пара и центрируются вместе: иначе колонка липнет
// к левой рамке, а справа от полосы остаётся полторы сотни единиц пустоты.
const COLUMN_X = -230;
const BAR_X = 131;
const WIRE_Y = COLUMN.bottomY + 60;
const TITLE_Y = COLUMN.topY - 76;
const NOTE_Y = WIRE_Y + 46;

// Провод и подпись висят ниже колонки — поднимаем всю группу на половину перевеса.
const GROUP_Y = -31;

// Куда выходит матрёшка: центр кадра с поправкой на сдвиг группы и на хвост кадра,
// который торчит вправо и тянет габарит за собой.
const NEST_AT = {x: -8, y: -GROUP_Y, scale: 1.3} as const;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const column = floorColumn({x: COLUMN_X, titleY: TITLE_Y});
  const bar = envelope({x: BAR_X, y: COLUMN.floorY(0)});

  const wire = createRef<Line>();
  const note = createRef<Txt>();
  const limit = createRef<Txt>();

  stage.add(
    <Node y={GROUP_Y}>
      {column.node}
      <Line ref={wire} points={[[-420, WIRE_Y], [420, WIRE_Y]]}
        stroke={withAlpha(colors.cyan, 0.3)} lineWidth={2} lineDash={[9, 8]} opacity={0}/>
      <Txt ref={limit} y={COLUMN.floorY(2) - 52} x={BAR_X} text="ОГРАНИЧЕНИЕ НА РАЗМЕР"
        fill={colors.orange} fontSize={15} fontFamily={fonts.mono} letterSpacing={1.2}
        opacity={0}/>
      <Txt ref={note} y={NOTE_Y} text="" fill={colors.textDim} fontSize={19}
        fontFamily={fonts.mono} letterSpacing={1.4} opacity={0}/>
      {bar.node}
    </Node>,
  );

  /** Комментарий под кадром — живёт через несколько битов. Пустая строка просто гасит. */
  function* remark(text: string) {
    if (note().opacity() > 0) yield* note().opacity(0, 0.2);
    if (!text) return;
    note().text(text);
    yield* note().opacity(1, 0.35, easeOutCubic);
  }

  // «Давай посмотрим, что физически происходит с сообщением по дороге вниз и обратно вверх»
  yield* waitUntil('look');
  yield* all(revealStage(stage), column.appear(), wire().opacity(1, 0.6, easeOutCubic));

  // «Приложение рождает сообщение в каком-то формате»
  yield* waitUntil('born');
  yield* all(column.light(0), bar.appear());

  // «Транспорт берёт и приклеивает сверху свой заголовок»
  yield* waitUntil('transport');
  yield* all(column.light(1), bar.moveTo(COLUMN.floorY(1)));
  yield* bar.wrap('tcp');

  // «Адресация, порядковые номера — и отдаёт вниз»
  yield* waitUntil('addressing');
  yield* remark('АДРЕСАЦИЯ · ПОРЯДКОВЫЕ НОМЕРА');

  // «Сетевой уровень, а у него ограничение на размер»
  yield* waitUntil('network');
  yield* all(column.light(2), bar.moveTo(COLUMN.floorY(2)), remark(''));
  yield* limit().opacity(1, 0.4, easeOutCubic);

  // «Например, он режет сообщение на куски»
  yield* waitUntil('cut');
  yield* all(bar.split(), limit().opacity(0, 0.35));

  // «К каждому куску приклеивает свой заголовок и отдаёт дальше»
  yield* waitUntil('eachpiece');
  yield* bar.wrap('ip');

  // «Канальный добавляет каждому куску заголовок и концевую метку»
  yield* waitUntil('link');
  yield* all(column.light(3), bar.moveTo(COLUMN.floorY(3)));
  yield* bar.wrap('eth');
  yield* all(bar.wrap('fcs'), remark('ЗАГОЛОВОК СПЕРЕДИ · КОНЦЕВИК СЗАДИ'));

  // «Дальше у нас идёт физический провод»
  yield* waitUntil('wire');
  yield* all(column.light(4), remark(''));
  yield* bar.toWire(WIRE_Y);

  // «А на той стороне всё то же самое в обратную сторону»
  yield* waitUntil('reverse');
  yield* all(column.retitle('ПОЛУЧАТЕЛЬ'), bar.fromWire(COLUMN.floorY(3)));
  yield* column.light(3);

  // «Заголовки снимаются уровнем за уровнем»
  yield* waitUntil('strip');
  yield* all(bar.unwrap('fcs'), bar.unwrap('eth'));
  yield* all(column.light(2), bar.moveTo(COLUMN.floorY(2)));
  yield* bar.unwrap('ip');

  // «Куски собираются обратно, и наверх приходят исходные сообщения»
  yield* waitUntil('reassemble');
  yield* bar.merge();
  yield* all(column.light(1), bar.moveTo(COLUMN.floorY(1)));
  yield* bar.unwrap('tcp');
  yield* all(column.light(0), bar.moveTo(COLUMN.floorY(0)));

  // «Что стоит также понимать» — полоса возвращается в полном виде
  yield* waitUntil('rule');
  yield* all(bar.wrap('tcp'), bar.wrap('ip'), bar.wrap('eth'), bar.wrap('fcs'));

  // «На уровень N не попадает ни один заголовок нижележащих уровней»
  yield* waitUntil('noheaders');
  yield* remark('НИ ОДИН ЗАГОЛОВОК СНИЗУ НЕ ДОХОДИТ НАВЕРХ');

  // «Каждый этаж читает только свою наклейку» — яркость сегмента и подсветка этажа
  // связаны одним жестом: горит ровно то, что принадлежит горящему этажу.
  yield* waitUntil('ownlabel');
  yield* all(column.light(3), bar.focus('eth'), remark('КАЖДЫЙ ЧИТАЕТ ТОЛЬКО СВОЮ НАКЛЕЙКУ'));

  yield* waitUntil('net_no');
  yield* all(column.light(2), bar.focus('ip'));

  yield* waitUntil('tr_no');
  yield* all(column.light(1), bar.focus('tcp'));

  yield* waitUntil('app_no');
  yield* all(column.light(0), bar.focus('data'));

  // «Оно получает ровно то, что отправил его пир»
  yield* waitUntil('exact');
  yield* remark('РОВНО ТО, ЧТО ОТПРАВИЛ ЕГО ПИР');

  // «Формально это можно назвать инкапсуляцией»
  yield* waitUntil('encaps');
  yield* all(bar.focus(null), remark('ИНКАПСУЛЯЦИЯ'));

  // «Это всё выглядит как матрёшка» — та же полоса, другая геометрия
  yield* waitUntil('matryoshka');
  yield* all(
    bar.fold(),
    bar.center(NEST_AT.x, NEST_AT.y, NEST_AT.scale),
    column.recede(),
    // Провод тоже уходит: иначе он остаётся самым нижним объектом и тянет габарит вниз.
    wire().opacity(0, 0.6, easeInOutCubic),
    remark(''),
  );

  // «Сегмент внутри пакета, пакет внутри кадра»
  yield* waitUntil('nesting');
  yield* bar.rename();

  yield* waitUntil('end');
  yield* stage.opacity(0, FADE_OUT, easeInOutCubic);
});
