import {makeScene2D, Txt} from '@motion-canvas/2d';
import {all, createRef, easeInOutCubic, waitUntil} from '@motion-canvas/core';
import {colors, createStage, endScene, fonts, revealStage, sceneCaption} from '@lib';
import {layerCollapse} from '../collapse';

export default makeScene2D(function* (view) {
  const stage = createStage(view);
  stage.opacity(0);

  const diagram = layerCollapse({y: 20});
  const title = sceneCaption({text: 'OSI vs TCP/IP · 7 → 4', fontWeight: 600});
  const verdict = createRef<Txt>();

  stage.add(diagram.node);
  stage.add(title.node);
  stage.add(
    <Txt ref={verdict} y={430} text="мир выбрал удобство, а не красоту" fill={colors.text}
      fontSize={26} fontWeight={600} fontFamily={fonts.display} opacity={0}/>,
  );

  // "сравним с моделью OSI, выработанной годами": the whole scene (OSI stack + title) eases in
  // together here — no empty card hanging beforehand.
  yield* waitUntil('osi');
  yield* all(revealStage(stage), title.appear(), diagram.showOsi());

  // "все уровни повторяют друг друга" — the lower layers line up 1:1
  yield* waitUntil('tcpip');
  yield* diagram.showTcpip();

  // "…кроме трёх последних — они слопнулись в один прикладной"
  yield* waitUntil('collapse');
  yield* diagram.collapse();

  // "жёсткое разделение OSI не прижилось · мир выбрал удобство, а не красоту"
  yield* waitUntil('verdict');
  yield* verdict().opacity(1, 0.9, easeInOutCubic);

  yield* endScene(stage);
});
