import {Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, cancel, createRef, easeInOutCubic, easeOutCubic, waitUntil} from '@motion-canvas/core';
import {colors, createStage, fonts, revealStage, withAlpha} from '@lib';
import {PLATE, liftLink, partsGrid, plateY, recapStack, sideNotes} from '../sum';

// Итог ничего не вводит — он возвращает построенное. Поэтому кадр держит **один объект**:
// знакомая пятиэтажка слева стоит от начала до конца, а правая колонка трижды полностью
// сменяется. Иначе 24 бита за 72 секунды рассыпались бы на семь разных картинок.
const STAGE_HEIGHT = 860;

// Стопка слева и колонка справа считаются как одна пара: колонка получает **фиксированный
// габарит** (панель), иначе её ширина скачет вслед за длиной строк и кадр ведёт влево-вправо.
const STACK_X = -265;
const GHOST_X = 265;
const NOTES_X = -13;
const SIDE = {x: 203, width: 466, height: 310, y: -40, radius: 16} as const;

const INNER = STACK_X + PLATE.width / 2; // внутренняя кромка верхней плиты
const WIRE_Y = 302;

const CAPTION_Y = -360;
const NOTE_Y = 360;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const stack = recapStack({x: STACK_X});
  const ghost = recapStack({x: GHOST_X, ghost: true});
  const notes = sideNotes({x: NOTES_X});
  const grid = partsGrid({x: NOTES_X});
  const link = liftLink({
    inner: -INNER,
    center: GHOST_X,
    topY: plateY(0),
    wireY: WIRE_Y,
  });

  const caption = createRef<Txt>();
  const note = createRef<Txt>();
  const side = createRef<Rect>();

  stage.add(
    <Rect ref={side} x={SIDE.x} y={SIDE.y} width={SIDE.width} height={SIDE.height}
      radius={SIDE.radius} fill={colors.track} stroke={withAlpha(colors.border, 0.85)}
      lineWidth={1.4} opacity={0}/>,
  );
  stage.add(ghost.node);
  stage.add(stack.node);
  // Провод и конверт рисуются **поверх обеих** стопок: иначе слева линия уходит под плиты,
  // а справа лежит на них, и лифт читается по-разному на двух концах.
  stage.add(link.node);
  stage.add(notes.node);
  stage.add(grid.node);
  stage.add(
    <Node>
      <Txt ref={caption} y={CAPTION_Y} text="ИТОГ · ПРИКЛАДНОЙ УРОВЕНЬ" fill={colors.textMuted}
        fontSize={16} fontFamily={fonts.mono} letterSpacing={1.8} opacity={0}/>
      <Txt ref={note} y={NOTE_Y} text="" fill={colors.textDim} fontSize={19}
        fontFamily={fonts.mono} letterSpacing={1.4} opacity={0}/>
    </Node>,
  );

  /** Нижняя строка — заголовок движения. Она стоит на месте всю часть. */
  function* remark(text: string) {
    if (note().opacity() > 0) yield* note().opacity(0, 0.2);
    note().text(text);
    yield* note().opacity(1, 0.35, easeOutCubic);
  }

  // ── Три вещи, которые рассмотрели ──────────────────────────────────────────
  // «Итак, что мы рассмотрели»
  yield* waitUntil('recap');
  yield* all(
    revealStage(stage),
    stack.appear(),
    caption().opacity(1, 0.6, easeOutCubic),
    remark('ЧТО МЫ РАССМОТРЕЛИ'),
  );

  // «Договорённость есть между пирами»
  yield* waitUntil('agreement');
  yield* all(
    side().opacity(1, 0.6, easeOutCubic),
    notes.line(0, 'ДОГОВОРЁННОСТЬ МЕЖДУ ПИРАМИ'),
    stack.peerStub(),
  );

  // «Лифты едут вниз и вверх»
  yield* waitUntil('lifts');
  yield* all(notes.line(1, 'ЛИФТЫ ВНИЗ И ВВЕРХ'), stack.pulse());

  // «Дверь существует в границе ядра»
  yield* waitUntil('door');
  yield* all(notes.line(2, 'ДВЕРЬ В ГРАНИЦЕ ЯДРА'), stack.openDoor());

  // «Это полная картина того, как твоё приложение выходит в сеть»
  yield* waitUntil('full');
  yield* notes.rail('ПОЛНАЯ КАРТИНА');

  // «…используя протоколы прикладного уровня»
  yield* waitUntil('via');
  yield* notes.chip('ЧЕРЕЗ ПРОТОКОЛЫ ПРИКЛАДНОГО УРОВНЯ');

  // «…либо же абстрагируясь над ними»
  yield* waitUntil('orabove');
  yield* notes.chip('ИЛИ АБСТРАГИРУЯСЬ НАД НИМИ');

  // ── Единственный уровень ───────────────────────────────────────────────────
  // «Прикладной уровень единственный, где происходит полезная работа»
  yield* waitUntil('useful');
  yield* notes.clear();
  yield* all(
    remark('ПРИКЛАДНОЙ УРОВЕНЬ'),
    stack.light(0, 1),
    notes.line(0, 'ПОЛЕЗНАЯ РАБОТА — ТОЛЬКО ЗДЕСЬ'),
  );

  // «Всё ниже — это просто доставка байтов»
  yield* waitUntil('below');
  yield* all(stack.dimBelow(), notes.line(1, 'ВСЁ НИЖЕ — ДОСТАВКА БАЙТОВ'));

  // «Это единственный уровень, который полностью принадлежит тебе»
  yield* waitUntil('yours');
  yield* all(notes.line(2, 'И ТОЛЬКО ОН ТВОЙ ЦЕЛИКОМ'), notes.rail('ЕДИНСТВЕННЫЙ УРОВЕНЬ'));

  // ── Протокол ───────────────────────────────────────────────────────────────
  // «Протокол — это не технология, а просто договорённость»
  yield* waitUntil('nottech');
  yield* notes.clear();
  yield* all(remark('ПРОТОКОЛ'), grid.deny());
  yield* grid.affirm();

  // «…которая состоит из четырёх частей»
  yield* waitUntil('four');
  yield* grid.open();

  // «Какие сообщения, как они выглядят, что значат и кто когда говорит»
  yield* waitUntil('p1');
  yield* grid.fill(0, 'КАКИЕ СООБЩЕНИЯ');
  yield* waitUntil('p2');
  yield* grid.fill(1, 'КАК ОНИ ВЫГЛЯДЯТ');
  yield* waitUntil('p3');
  yield* grid.fill(2, 'ЧТО ОНИ ЗНАЧАТ');
  yield* waitUntil('p4');
  yield* grid.fill(3, 'КТО КОГДА ГОВОРИТ');

  // ── Пиры и лифт ────────────────────────────────────────────────────────────
  // «Пиры думают, что общаются напрямую»
  yield* waitUntil('peers');
  yield* all(
    grid.dismiss(),
    side().opacity(0, 0.5, easeInOutCubic),
    remark('ПИРЫ И ЛИФТ'),
    ghost.appear(),
  );
  yield* link.connect();

  // «…а байты едут лифтом через все этажи»
  yield* waitUntil('lift2');
  yield* link.bendDown();

  // «…обрастая заголовками и дополнительной мета-информацией»
  yield* waitUntil('headers');
  const flight = yield link.run(3);

  // ── Сокет ──────────────────────────────────────────────────────────────────
  // «Между приложением и всеми этими уровнями одна дверь»
  yield* waitUntil('onedoor');
  cancel(flight);
  yield* all(
    link.dismiss(),
    ghost.dismiss(),
    side().opacity(1, 0.5, easeOutCubic),
    remark('СОКЕТ'),
    notes.line(0, 'ВНИЗ ВЕДЁТ ОДНА ДВЕРЬ'),
  );

  // «…и называется сокет»
  yield* waitUntil('socket');
  yield* stack.nameDoor('СОКЕТ');

  // «Сорокалетняя абстракция»
  yield* waitUntil('forty');
  yield* notes.chip('40 ЛЕТ');

  // «…которая прячет, как транспорт работает»
  yield* waitUntil('hides');
  yield* all(stack.machinery(), notes.line(1, 'ПРЯЧЕТ, КАК ТРАНСПОРТ РАБОТАЕТ'));
  const gears = yield stack.gears();

  // «…но не прячет, что он обещает»
  yield* waitUntil('promises');
  yield* all(stack.guarantee(), notes.line(2, 'НЕ ПРЯЧЕТ, ЧТО ОН ОБЕЩАЕТ'));

  // ── Три уровня в одном ─────────────────────────────────────────────────────
  // «Прикладной уровень делает больше, чем все остальные»
  yield* waitUntil('more');
  yield* notes.clear();
  yield* all(
    remark('ТРИ УРОВНЯ В ОДНОМ'),
    // Пометки сокета уходят: верхнюю плиту сейчас займут три уровня, там станет тесно.
    stack.clearMarks(),
    notes.line(0, 'ДЕЛАЕТ БОЛЬШЕ ВСЕХ ОСТАЛЬНЫХ'),
  );

  // «Он на себе закрывает сразу три уровня модели OSI» — верхняя плита не надстраивается,
  // она делится: три уровня живут внутри неё.
  yield* waitUntil('three');
  yield* all(stack.split(), notes.line(1, 'ЗАКРЫВАЕТ СРАЗУ ТРИ УРОВНЯ OSI'));

  // «…которую мы разбирали в первом видео»
  yield* waitUntil('firstvideo');
  yield* notes.chip('МОДЕЛЬ OSI · ПЕРВОЕ ВИДЕО');

  // «Поэтому протоколы на нём такие большие, такие разные и такие интересные»
  yield* waitUntil('why');
  yield* all(
    stack.merge(),
    remark('ПОЭТОМУ ПРОТОКОЛЫ ТАКИЕ БОЛЬШИЕ, РАЗНЫЕ И ИНТЕРЕСНЫЕ'),
  );

  yield* waitUntil('end');
  cancel(gears);
  yield* stage.opacity(0, FADE_OUT, easeInOutCubic);
});
