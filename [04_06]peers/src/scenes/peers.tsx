import {Node, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, cancel, createRef, easeInOutCubic, easeOutCubic, waitUntil} from '@motion-canvas/core';
import {colors, createStage, fonts, revealStage} from '@lib';
import {STACK, codeChip, peerLink, peerStack} from '../peers';

// Две машины, на каждой — знакомая пятиэтажка. Пиры считают, что говорят горизонтально;
// на «ни один байт не летит горизонтально» та же самая линия провисает в лифт-провод-лифт.
const STAGE_HEIGHT = 780;
const STACK_X = 292;

// Шапка каждой стопки: чья это машина и какой код там написан. Чип кода не должен касаться
// кромки верхней плиты — между ними остаётся привязка-пунктир.
const CAPTION_Y = -286;
const CODE_Y = -232;
const PLATE_TOP = STACK.topY - 35;

const WIRE_Y = STACK.bottomY + 56;
// Подпись под всем кадром — она переживает несколько битов подряд.
const NOTE_Y = WIRE_Y + 40;

// Провод и подпись висят ниже стопок — поднимаем группу на половину перевеса.
const GROUP_Y = -5;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const left = peerStack({x: -STACK_X, caption: 'ТВОЙ КЛИЕНТ', captionY: CAPTION_Y});
  const right = peerStack({x: STACK_X, caption: 'СЕРВЕР НА ДРУГОМ КОНЦЕ', captionY: CAPTION_Y});
  const link = peerLink({
    inner: STACK_X - STACK.width / 2,
    // Не по центру плиты, а правее названий: иначе вертикаль лифта задевает последние буквы.
    center: STACK_X + 26,
    topY: STACK.topY,
    wireY: WIRE_Y,
  });

  const leftCode = codeChip({text: 'http.post(…)', x: -STACK_X, y: CODE_Y, anchorY: PLATE_TOP});
  const rightCode = codeChip({text: 'http.listen(…)', x: STACK_X, y: CODE_Y, anchorY: PLATE_TOP});
  const pairLabel = createRef<Txt>();
  const note = createRef<Txt>();
  // Подписи к стыку живут в зазоре между стопками — на самих плитах для них нет места.
  const ifaceLabel = createRef<Txt>();
  const ifaceNote = createRef<Txt>();

  stage.add(
    <Node y={GROUP_Y}>
      {left.node}
      {right.node}
      {link.node}
      {leftCode.node}
      {rightCode.node}
      {/* Живёт в зазоре между стопками — туда влезает только короткое слово. */}
      <Txt ref={pairLabel} y={0} text="" fill={colors.text} fontSize={24}
        fontFamily={fonts.mono} fontWeight={500} letterSpacing={1.1} opacity={0}/>
      <Txt ref={ifaceLabel} y={STACK.seamY - 24} text="ИНТЕРФЕЙС" fill={colors.orange}
        fontSize={14} fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.2} opacity={0}/>
      <Txt ref={ifaceNote} y={STACK.seamY + 24} text="НЕ МЕНЯЛСЯ" fill={colors.orange}
        fontSize={14} fontFamily={fonts.mono} letterSpacing={1.2} opacity={0}/>
      <Txt ref={note} y={NOTE_Y} text="" fill={colors.textDim} fontSize={19}
        fontFamily={fonts.mono} letterSpacing={1.4} opacity={0}/>
    </Node>,
  );

  /** Слово между стопками — им подписывают, кем сейчас оказались пиры. */
  function* say(text: string) {
    if (pairLabel().opacity() > 0) yield* pairLabel().opacity(0, 0.2);
    pairLabel().text(text);
    yield* pairLabel().opacity(1, 0.3, easeOutCubic);
  }

  /** Комментарий под кадром — он переживает несколько битов. Пустая строка просто гасит. */
  function* remark(text: string) {
    if (note().opacity() > 0) yield* note().opacity(0, 0.2);
    if (!text) return;
    note().text(text);
    yield* note().opacity(1, 0.35, easeOutCubic);
  }

  // «В этот момент у нас появляется новая абстракция — пиры»
  yield* waitUntil('abstraction');
  yield* all(revealStage(stage), left.appear(), right.appear());

  // «Сущности одного уровня на разных машинах называются пирами» — на обеих стопках
  // загорается один и тот же этаж.
  yield* waitUntil('define');
  yield* all(left.light(2), right.light(2));

  // «Могут быть процессы, могут быть железками, а могут быть и люди»
  yield* waitUntil('who');
  yield* say('ПРОЦЕССЫ');
  yield* waitUntil('who2');
  yield* say('ЖЕЛЕЗКИ');
  yield* waitUntil('who3');
  yield* say('ЛЮДИ');

  // «Под ними может быть что угодно» — важен не этаж, важно что одинаковый.
  yield* waitUntil('broad');
  yield* all(
    left.light(3),
    right.light(3),
    pairLabel().opacity(0, 0.25),
    remark('ЛЮБОЙ ЭТАЖ — ЛИШЬ БЫ ОДИН И ТОТ ЖЕ'),
  );
  yield* all(left.light(1), right.light(1));

  // «Общение пиров — оно виртуальное»
  yield* waitUntil('virtual');
  yield* all(left.light(0), right.light(0), remark(''));

  // «Считают, что разговаривают напрямую, горизонтально»
  yield* waitUntil('directly');
  yield* link.connect();
  const talk = yield link.run(1.8);

  // «Ты вызываешь http.post, а сервер — http.listen»
  yield* waitUntil('code');
  yield* all(leftCode.appear(), rightCode.appear(), remark('ТАК ЭТО ВЫГЛЯДИТ В КОДЕ'));

  // «Но на самом деле ни один байт не летит горизонтально» — та же линия провисает.
  yield* waitUntil('nobyte');
  cancel(talk);
  yield* all(link.bendDown(), remark('НИ ОДИН БАЙТ НЕ ЛЕТИТ ГОРИЗОНТАЛЬНО'));

  // «Данные едут лифтом вниз, потом по проводу, потом лифтом вверх»
  yield* waitUntil('lift');
  yield* link.send(2.6);
  const wire = yield link.run(2.6);

  // «Виртуальное общение — пунктиром, физическое — сплошной линией»
  yield* waitUntil('dashed');
  yield* link.showVirtual();

  // «Абстракция пира позволяет думать горизонтально, хотя всё движется вертикально»
  yield* waitUntil('think');
  yield* remark('ДУМАЕШЬ ГОРИЗОНТАЛЬНО · ДВИЖЕТСЯ ВЕРТИКАЛЬНО');

  // «Ты пишешь send и представляешь собеседника, а не 20 слоёв под собой»
  yield* waitUntil('send');
  yield* all(left.flashLayers(), remark('ПИШЕШЬ SEND — НЕ ВИДИШЬ ДВАДЦАТИ СЛОЁВ'));

  // «Каждая пара смежных слоёв связана интерфейсом»
  yield* waitUntil('interface');
  cancel(wire);
  yield* all(left.seam(), right.seam(), ifaceLabel().opacity(1, 0.4, easeOutCubic));

  // «Интерфейс определяет, какие услуги нижний уровень предоставляет верхнему»
  yield* waitUntil('services');
  yield* remark('ЧТО НИЖНИЙ ОБЕЩАЕТ ВЕРХНЕМУ');

  // «Протоколы нижнего уровня можно незаметно поменять для вышележащих» — верх при этом
  // не шевелится, и именно поэтому нижнюю половину трясёт, а верхнюю нет.
  yield* waitUntil('swap');
  yield* all(left.swap('TCP'), right.swap('TCP'));
  yield* all(left.shakeLower(), right.shakeLower(), left.swap('QUIC'), right.swap('QUIC'));
  yield* all(left.shakeLower(), right.shakeLower(), left.swap('UDP'), right.swap('UDP'));

  // «Главное, чтобы не менялся интерфейс»
  yield* waitUntil('sameiface');
  yield* ifaceNote().opacity(1, 0.4, easeOutCubic);

  // «Мы это уже обсуждали на примере транспортного уровня — TCP, UDP и QUIC»
  yield* waitUntil('already');
  yield* remark('TCP · UDP · QUIC — ЭТО БЫЛО ВТОРОЕ ВИДЕО');

  // «Пиры думают, что байты идут напрямую, но на самом деле они едут лифтом»
  yield* waitUntil('recap');
  yield* remark('ДУМАЮТ — НАПРЯМУЮ · ЕДУТ — ЛИФТОМ');
  yield link.run(2.6);

  yield* waitUntil('end');
  yield* stage.opacity(0, FADE_OUT, easeInOutCubic);
});
