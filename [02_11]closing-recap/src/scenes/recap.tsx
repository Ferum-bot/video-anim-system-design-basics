import {makeScene2D, Txt} from '@motion-canvas/2d';
import {all, createRef, easeInOutCubic, easeOutCubic, waitUntil} from '@motion-canvas/core';
import {colors, createStage, endScene, fonts, revealStage, sceneCaption} from '@lib';
import {recapGrid} from '../recap';

export default makeScene2D(function* (view) {
  const stage = createStage(view);
  stage.opacity(0);

  const grid = recapGrid({y: -10});
  const title = sceneCaption({text: 'Всё про сети · итог', fontWeight: 600});
  const thesis = createRef<Txt>();

  stage.add(grid.node);
  stage.add(title.node);
  stage.add(
    <Txt ref={thesis} y={360} text="Сеть — большая, разная, органическая система"
      fill={colors.text} fontSize={27} fontWeight={600} fontFamily={fonts.display} opacity={0}/>,
  );

  // "давай соберём всё в одно заключительное место": the whole scene (frame + title + grid)
  // eases in together here — no empty card hanging beforehand.
  yield* waitUntil('recap');
  yield* all(revealStage(stage), title.appear(), grid.assemble());

  // "все эти факты нужны лишь для одной мысли, которую ты должен понимать" — the takeaway lands
  yield* waitUntil('thesis');
  yield* all(thesis().opacity(1, 0.9, easeInOutCubic), thesis().y(330, 0.9, easeOutCubic));

  yield* endScene(stage);
});
