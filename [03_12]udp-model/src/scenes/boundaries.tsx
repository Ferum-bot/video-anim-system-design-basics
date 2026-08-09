import {Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {
  all,
  createRef,
  easeInOutCubic,
  easeOutCubic,
  waitUntil,
} from '@motion-canvas/core';
import {colors, createStage, fonts, revealStage, sceneCaption, withAlpha} from '@lib';
import {datagramLane, impossibleRow} from '../boxes';

const STAGE_HEIGHT = 700;
const CAPTION_Y = -262;
const BOOKMARK_Y = -206;
const LANE_Y = -20;
const IMPOSSIBLE_Y = 176;

const LOST_INDEX = 1; // the middle datagram is the one that goes missing
const FADE_OUT = 0.9;

export default makeScene2D(function* (view) {
  const stage = createStage(view, {height: STAGE_HEIGHT});
  stage.opacity(0);

  const caption = sceneCaption({text: 'ВАЖНОЕ СЛЕДСТВИЕ', y: CAPTION_Y, fontWeight: 500});
  const lane = datagramLane({y: LANE_Y});
  const impossible = impossibleRow();
  impossible.node.y(IMPOSSIBLE_Y);

  // He tells the viewer to hold on to this until TCP; the chip is that instruction on screen.
  const bookmark = createRef<Rect>();

  stage.add(lane.node);
  stage.add(impossible.node);
  stage.add(caption.node);
  stage.add(
    <Rect ref={bookmark} y={BOOKMARK_Y} layout padding={[8, 20]} radius={999}
      fill={withAlpha(colors.orange, 0.12)} stroke={withAlpha(colors.orange, 0.55)}
      lineWidth={1.5} opacity={0}>
      <Txt text="запомни — в TCP будет иначе" fill={colors.orange} fontSize={19}
        fontFamily={fonts.display}/>
    </Rect>,
  );

  // «Важное следствие, которое обычно никто до конца не понимает»
  yield* waitUntil('tease');
  yield* all(revealStage(stage), caption.appear(), lane.appear());

  // «UDP сохраняет границы сообщения»
  yield* waitUntil('boundary');
  yield* caption.retitle('UDP СОХРАНЯЕТ ГРАНИЦЫ СООБЩЕНИЯ');

  // «Один вызов отправки — это одна датаграмма, одно получение на той стороне»
  yield* waitUntil('single');
  yield* lane.single();

  // «Отправили три сообщения — получатель получит три сообщения»
  yield* waitUntil('three');
  yield* lane.three();

  // «Может меньше, если что-то случилось по пути»
  yield* waitUntil('lost');
  yield* lane.lose(LOST_INDEX);

  // «…но никогда полтора склеенных сообщения»
  yield* waitUntil('glued');
  yield* impossible.glued();

  // «Это очень важный пункт, запомни его — в TCP мы к нему вернёмся»
  yield* waitUntil('bookmark');
  yield* all(
    bookmark().opacity(1, 0.5, easeOutCubic),
    bookmark().y(BOOKMARK_Y - 8, 0.5, easeOutCubic),
  );

  // «Датаграмма либо доходит вся, либо не доходит вообще»
  yield* waitUntil('whole');
  yield* lane.stressWhole();

  // «Половины сообщения также не бывает»
  yield* waitUntil('half');
  yield* impossible.half();

  // Exit is composed by hand instead of `endScene`, matching the other video-03 parts.
  yield* waitUntil('end');
  yield* all(
    stage.opacity(0, FADE_OUT, easeInOutCubic),
    stage.scale(0.98, FADE_OUT, easeInOutCubic),
  );
});
