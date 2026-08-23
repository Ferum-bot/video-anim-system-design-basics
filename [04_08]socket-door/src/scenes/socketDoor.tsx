import {Node, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, cancel, createRef, easeInOutCubic, easeOutCubic, waitUntil} from '@motion-canvas/core';
import {colors, createStage, fonts, revealStage} from '@lib';
import {interfaceStage, recapRow, socketBox, timeline, videoTwoHint} from '../socket';

// Три движения: сводка того, что уже показано → дверь, которая нужна приложению → честная
// оговорка о том, чего эта дверь не прячет. Ящик сквозной: он рождается на стыке, получает
// имя, обзаводится двойником-файлом и в финале становится всем кадром.
const STAGE_HEIGHT = 800;

const SEAM_Y = 32; // где рождается ящик — ровно на стыке
const PAIR_X = 190; // куда разъезжаются сокет и файл
const DOCK_Y = -110; // куда пара уезжает, освобождая место оси
const NOTE_Y = 312;

const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const recap = recapRow({y: -13});
  const seam = interfaceStage();
  const box = socketBox({x: 0, y: SEAM_Y, label: 'СОЕДИНЕНИЕ'});
  const file = socketBox({x: PAIR_X, y: SEAM_Y, label: 'ФАЙЛ', plain: true});
  const axis = timeline({y: 150});
  const hint = videoTwoHint({y: 222});

  const code = createRef<Node>();
  const note = createRef<Txt>();

  stage.add(seam.node);
  stage.add(recap.node);
  stage.add(axis.node);
  stage.add(file.node);
  stage.add(box.node);
  stage.add(hint.node);
  stage.add(
    <Node>
      <Node ref={code} y={SEAM_Y - 190} opacity={0}>
        <Txt text="http.get(…)" fill={colors.cyan} fontSize={22} fontFamily={fonts.mono}
          letterSpacing={1.1}/>
      </Node>
      <Txt ref={note} y={NOTE_Y} text="" fill={colors.textDim} fontSize={19}
        fontFamily={fonts.mono} letterSpacing={1.4} opacity={0}/>
    </Node>,
  );

  /** Комментарий под кадром — живёт через несколько битов. Пустая строка гасит. */
  function* remark(text: string) {
    if (note().opacity() > 0) yield* note().opacity(0, 0.2);
    if (!text) return;
    note().text(text);
    yield* note().opacity(1, 0.35, easeOutCubic);
  }

  // ── Сводка ─────────────────────────────────────────────────────────────────
  // «Протокол — это договорённость между пирами»
  yield* waitUntil('agreement');
  yield* all(revealStage(stage), recap.appear());

  // «Пиры говорят горизонтально, а байты едут лифтом»
  yield* waitUntil('lift');
  yield* recap.show(1);

  // «И каждая пара уровней связана интерфейсом»
  yield* waitUntil('interface');
  yield* recap.show(2);

  // «…договором о том, как нижний уровень общается с верхним»
  yield* waitUntil('contract');
  yield* recap.contract();

  // ── Что нужно приложению ───────────────────────────────────────────────────
  // «Отсюда вытекает очень простой вопрос»
  yield* waitUntil('question');
  yield* recap.focusInterface();

  // «А как этот интерфейс выглядит для твоего приложения?»
  yield* waitUntil('howlook');
  yield* all(recap.dismiss(), seam.appear());
  yield* seam.ask();

  // «Допустим, ты захотел написать свой собственный протокол»
  yield* waitUntil('suppose');
  yield* seam.yourProtocol();
  const caret = yield seam.blink();

  // Три вещи, которых приложению знать не надо: всплыли — и утянулись обратно под плиту.
  yield* waitUntil('noneed');
  yield* seam.hide(0);
  yield* waitUntil('window');
  yield* seam.hide(1);
  yield* waitUntil('handshake');
  yield* seam.hide(2);

  // «Ему нужна одна вещь — абстракция соединения»
  yield* waitUntil('oneThing');
  yield* all(seam.clearSeam(), box.appear());

  // «Что-то, куда можно записать, и что-то, откуда прочитать»
  yield* waitUntil('writeRead');
  yield* box.slots();
  const token = yield box.run();

  // «Эта абстракция должна быть единой, независимо от того, что снизу»
  yield* waitUntil('single');
  yield* seam.swap('TCP');
  yield* seam.swap('UDP');
  yield* seam.swap('QUIC');

  // «Приложение не должно перестраиваться из-за смены транспорта»
  yield* waitUntil('norewrite');
  yield* all(seam.swap('ЛОКАЛЬНЫЙ ОБМЕН'), remark('ЯЩИК НЕ ИЗМЕНИЛСЯ НИ РАЗУ'));

  // «И в идеале — чтобы с сетью можно было работать как с файлом»
  yield* waitUntil('likefile');
  yield* all(box.moveTo(-PAIR_X, SEAM_Y, 1), file.appear(), remark(''));

  // ── 1983 ───────────────────────────────────────────────────────────────────
  // «Ровно эту абстракцию придумали в 1983 году в Berkeley»
  yield* waitUntil('berkeley');
  yield* all(
    seam.dismiss(),
    box.moveTo(-PAIR_X, DOCK_Y, 0.86),
    file.moveTo(PAIR_X, DOCK_Y, 0.86),
    axis.appear(),
  );

  // «Она называется сокет»
  yield* waitUntil('named');
  yield* box.name('СОКЕТ');

  // «И она сегодня есть практически везде»
  yield* waitUntil('everywhere');
  yield* code().opacity(1, 0.45, easeOutCubic);

  // «В каждой библиотеке, в каждом языке, под каждым http.get»
  yield* waitUntil('undereach');
  yield* remark('В КАЖДОЙ БИБЛИОТЕКЕ · В КАЖДОМ ЯЗЫКЕ');

  // «Ей сорок с лишним лет, и она почти не изменилась»
  yield* waitUntil('forty');
  yield* all(axis.stretch(), remark(''));

  // ── Честная оговорка ───────────────────────────────────────────────────────
  // «Тут стоит сказать одну честную оговорку»
  yield* waitUntil('honest');
  cancel(token);
  yield* all(
    file.moveTo(900, DOCK_Y, 0.86),
    axis.dismiss(),
    code().opacity(0, 0.4),
    box.moveTo(0, -78, 1.3),
    remark('ЧЕСТНАЯ ОГОВОРКА'),
  );

  // «Прячет, как транспорт работает, но не прячет, что он обещает»
  yield* waitUntil('hideswhat');
  yield* all(box.shutter(), remark('ПРЯЧЕТ КАК · НЕ ПРЯЧЕТ ЧТО'));
  const gears = yield box.machinery();

  // «При создании сокета ты обязан сказать…»
  yield* waitUntil('onCreate');
  yield* box.apiLine();

  // «…надёжный поток или отдельные сообщения»
  yield* waitUntil('streamOrMsg');
  yield* all(box.toggle(), remark(''));

  // «Мы это разбирали в сравнении TCP и UDP в видео про транспортный уровень»
  yield* waitUntil('videotwo');
  yield* hint.appear();
  yield hint.run();

  // «Абстракция скрывает механику, но оставляет тебе выбор гарантий»
  yield* waitUntil('mechanics');
  yield* remark('СКРЫВАЕТ МЕХАНИКУ · ОСТАВЛЯЕТ ВЫБОР');

  // «Потому что от этого очень сильно зависит твой протокол»
  yield* waitUntil('depends');
  yield* all(hint.dismiss(), seam.yourProtocol());

  yield* waitUntil('end');
  cancel(gears);
  cancel(caret);
  yield* stage.opacity(0, FADE_OUT, easeInOutCubic);
});
