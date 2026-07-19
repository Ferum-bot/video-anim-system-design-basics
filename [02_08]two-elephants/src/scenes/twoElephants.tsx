import {makeScene2D, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutCubic, waitUntil} from '@motion-canvas/core';
import {colors, createStage, endScene, fonts, revealStage, sceneCaption} from '@lib';
import {elephantsCurve} from '../std';

export default makeScene2D(function* (view) {
  const stage = createStage(view);
  stage.opacity(0);

  const curve = elephantsCurve({y: -30});

  const title = sceneCaption({text: '«Апокалипсис двух слонов»', y: -415, fontWeight: 600});
  const verdict = createRef<Txt>();
  const osi = createRef<Txt>();

  stage.add(curve.node);
  stage.add(title.node);
  stage.add(
    <Txt ref={verdict} y={320} text="побеждает не красивый, а работающий стандарт"
      fill={colors.cyan} fontSize={25} fontWeight={600} fontFamily={fonts.mono} opacity={0}/>,
  );
  stage.add(
    <Txt ref={osi} y={364} text="OSI красивый — но в реальном мире прижился TCP/IP"
      fill={colors.textDim} fontSize={20} fontFamily={fonts.mono} opacity={0}/>,
  );

  // "красивая теория Тоненбаума — апокалипсис двух слонов"
  yield* waitUntil('title');
  yield* all(revealStage(stage), title.appear(), curve.appear());

  // "…сначала всплеск исследований: статьи, конференции, споры"
  yield* waitUntil('research');
  yield* curve.research();

  // "…а потом, когда замечают корпорации — миллиардные инвестиции"
  yield* waitUntil('investment');
  yield* curve.investment();

  // "стандарт нужно успеть написать ровно во впадину между всплесками"
  yield* waitUntil('window');
  yield* curve.window();

  // "напишешь слишком рано — тема не изучена, негибкий стандарт"
  yield* waitUntil('early');
  yield* curve.early();

  // "слишком поздно — компании сделают свои решения, стандартом никто не пользуется"
  yield* waitUntil('late');
  yield* curve.late();

  // "побеждает не самый правильный и красивый, а тот, который работает и используется"
  yield* waitUntil('verdict');
  yield* verdict().opacity(1, 0.7, easeOutCubic);

  // "OSI академически красивый, но в мире прижился TCP/IP"
  yield* waitUntil('osi');
  yield* osi().opacity(1, 0.6, easeOutCubic);

  yield* endScene(stage);
});
