import {Circle, Line, Node, Rect} from '@motion-canvas/2d';

// Small schematic glyphs for the journey hops — thin blueprint line-art, drawn from
// primitives and tinted with the hop's accent. Each fits inside a ~44px node tile.

export type HopKind = 'phone' | 'tower' | 'isp' | 'router' | 'dc';

export function HopGlyph({kind, color}: {kind: HopKind; color: string}) {
  const s = {stroke: color, lineWidth: 2, lineCap: 'round'} as const;
  switch (kind) {
    case 'phone':
      return (
        <Node>
          <Rect width={20} height={34} radius={5} {...s} fill={null}/>
          <Line points={[[-4, 11], [4, 11]]} {...s}/>
        </Node>
      );
    case 'tower':
      return (
        <Node>
          <Line points={[[-9, 12], [0, -14], [9, 12]]} {...s} fill={null}/>
          <Line points={[[-5, 0], [5, 0]]} {...s}/>
          <Circle y={-14} size={5} fill={color}/>
          {/* signal arcs */}
          <Line points={[[8, -16], [12, -12]]} {...s} opacity={0.7}/>
          <Line points={[[-8, -16], [-12, -12]]} {...s} opacity={0.7}/>
        </Node>
      );
    case 'isp':
      return (
        <Node>
          {[-9, 0, 9].map(oy => (
            <Line points={[[-11, oy], [11, oy]]} {...s}/>
          ))}
          <Rect width={26} height={30} radius={3} {...s} fill={null}/>
        </Node>
      );
    case 'router':
      return (
        <Node>
          <Rect width={22} height={22} radius={4} rotation={45} {...s} fill={null}/>
          <Line points={[[-15, 0], [15, 0]]} {...s} opacity={0.75}/>
          <Line points={[[0, -15], [0, 15]]} {...s} opacity={0.75}/>
        </Node>
      );
    case 'dc':
      return (
        <Node>
          {[-7, 7].flatMap(ox => [-7, 7].map(oy => (
            <Rect x={ox} y={oy} width={11} height={11} radius={2} {...s} fill={null}/>
          )))}
        </Node>
      );
  }
}
