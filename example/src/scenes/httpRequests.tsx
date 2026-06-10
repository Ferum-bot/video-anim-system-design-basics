import {makeScene2D, Circle, Rect, Line, Txt, Node} from '@motion-canvas/2d';
import {
  all,
  chain,
  createRef,
  easeInOutCubic,
  easeOutElastic,
  sequence,
  waitFor,
  Vector2,
} from '@motion-canvas/core';

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg:        '#0f1117',
  server:    '#1e2433',
  srvBorder: '#3d5afe',
  srvText:   '#e8eaf6',
  client:    '#1a2744',
  pipeShell: '#0b1520',   // dark outer casing of the "pipe"
  colorA:    '#00bcd4',
  colorB:    '#4caf50',
  colorC:    '#ff9800',
  req:       '#80cbc4',
  res:       '#aed581',
  syn:       '#90caf9',
  fin:       '#ef9a9a',
};

// ─── Layout ───────────────────────────────────────────────────────────────────
// Server: right-center
const SRV = { x: 250, y: 0, w: 170, h: 310 };
const SRV_LEFT = SRV.x - SRV.w / 2;   // x of server left face = 165

// Clients: left side
const CLI_X    = -460;
const CLI_W    = 140;
const CLI_EDGE = CLI_X + CLI_W / 2;    // right edge of client boxes = -390

// Each client has its own port on the server's left face (within the server height)
const CLIENTS = [
  { y: -190, portY: -95,  color: C.colorA, name: 'Client A', port: ':52100' },
  { y:    0, portY:   0,  color: C.colorB, name: 'Client B', port: ':52101' },
  { y:  190, portY:  95,  color: C.colorC, name: 'Client C', port: ':52102' },
] as const;

// ─── Packet dot helper ────────────────────────────────────────────────────────
function* packet(
  scene: Node,
  from: Vector2,
  to: Vector2,
  color: string,
  label: string,
  dur: number,
) {
  const g = createRef<Node>();
  scene.add(
    <Node ref={g} position={from}>
      <Circle size={22} fill={color} shadowColor={color} shadowBlur={22} />
      <Txt
        text={label}
        fontSize={12}
        fontWeight={700}
        fontFamily={'JetBrains Mono, monospace'}
        fill={color}
        y={-20}
      />
    </Node>,
  );
  yield* g().position(to, dur, easeInOutCubic);
  g().remove();
}

// ─── Scene ────────────────────────────────────────────────────────────────────
export default makeScene2D(function* (view) {
  view.fill(C.bg);

  // ── Server ────────────────────────────────────────────────────────────────
  const serverRef = createRef<Rect>();
  view.add(
    <Rect
      ref={serverRef}
      width={SRV.w} height={SRV.h} radius={16}
      fill={C.server} stroke={C.srvBorder} lineWidth={2.5}
      shadowColor={C.srvBorder} shadowBlur={30}
      x={SRV.x} y={SRV.y} scale={0}
    >
      <Txt text={'SERVER'} fontSize={16} fontWeight={700} letterSpacing={2}
        fontFamily={'JetBrains Mono, monospace'} fill={C.srvText} y={-115} />
      <Txt text={'HTTP/1.1'} fontSize={12}
        fontFamily={'JetBrains Mono, monospace'} fill={'#546e7a'} y={-90} />
      <Circle size={10} fill={'#4caf50'} shadowColor={'#4caf50'} shadowBlur={8} y={-68} />
      <Txt text={':8080'} fontSize={14}
        fontFamily={'JetBrains Mono, monospace'} fill={'#78909c'} y={-48} />
      <Txt text={'● listening'} fontSize={12}
        fontFamily={'JetBrains Mono, monospace'} fill={'#4caf50'} y={-20} />
    </Rect>,
  );

  // ── Port indicator dots on server left face ────────────────────────────────
  // Separate from the Rect so they sit at exact world-space connection points
  const portDots = CLIENTS.map(c => {
    const ref = createRef<Circle>();
    view.add(
      <Circle
        ref={ref}
        size={12}
        fill={'#1a2d45'}
        stroke={'#2d4a6e'}
        lineWidth={2}
        x={SRV_LEFT}
        y={SRV.y + c.portY}
        opacity={0}
      />,
    );
    return ref;
  });

  // ── Pipe outer casings (z-order: drawn first → behind) ────────────────────
  const pipeOuter = CLIENTS.map(c => {
    const ref = createRef<Line>();
    view.add(
      <Line
        ref={ref}
        points={[
          new Vector2(CLI_EDGE, c.y),
          new Vector2(SRV_LEFT, SRV.y + c.portY),
        ]}
        stroke={C.pipeShell}
        lineWidth={16}
        lineCap={'round'}
        opacity={0}
        end={0}
      />,
    );
    return ref;
  });

  // ── Pipe inner wires (z-order: drawn second → in front of casing) ─────────
  const pipeInner = CLIENTS.map(c => {
    const ref = createRef<Line>();
    view.add(
      <Line
        ref={ref}
        points={[
          new Vector2(CLI_EDGE, c.y),
          new Vector2(SRV_LEFT, SRV.y + c.portY),
        ]}
        stroke={c.color}
        lineWidth={6}
        lineCap={'round'}
        shadowColor={c.color}
        shadowBlur={16}
        opacity={0}
        end={0}
      />,
    );
    return ref;
  });

  // ── Clients (drawn last → in front of pipes) ───────────────────────────────
  const clientRefs = CLIENTS.map(c => {
    const ref = createRef<Rect>();
    view.add(
      <Rect
        ref={ref}
        width={CLI_W} height={80} radius={12}
        fill={C.client} stroke={c.color} lineWidth={2}
        shadowColor={c.color} shadowBlur={18}
        x={CLI_X} y={c.y}
        scale={0}
      >
        <Txt text={c.name} fontSize={15} fontWeight={700}
          fontFamily={'JetBrains Mono, monospace'} fill={c.color} y={-12} />
        <Txt text={c.port} fontSize={11}
          fontFamily={'JetBrains Mono, monospace'} fill={'#546e7a'} y={12} />
      </Rect>,
    );
    return ref;
  });

  // ── Initial appearance ────────────────────────────────────────────────────
  yield* all(
    serverRef().scale(1, 0.55, easeOutElastic),
    sequence(0.12, ...portDots.map(d => d().opacity(1, 0.3))),
    sequence(0.12, ...clientRefs.map(r => r().scale(1, 0.45, easeOutElastic))),
  );

  yield* waitFor(0.35);

  // ── Connection flow ───────────────────────────────────────────────────────
  function* connectionFlow(
    idx: number,
    reqLabel: string,
    resLabel: string,
    holdDelay: number,
  ) {
    const c     = CLIENTS[idx];
    const from  = new Vector2(CLI_EDGE, c.y);
    const to    = new Vector2(SRV_LEFT, SRV.y + c.portY);
    const outer = pipeOuter[idx];
    const inner = pipeInner[idx];
    const port  = portDots[idx];

    // 1. SYN — pipe grows from client to server simultaneously
    yield* all(
      packet(view, from, to, C.syn, 'SYN', 0.45),
      outer().opacity(1, 0.05),
      outer().end(1, 0.4, easeInOutCubic),
      inner().opacity(0.95, 0.05),
      inner().end(1, 0.4, easeInOutCubic),
    );

    // Port dot lights up with client color on connect
    yield* all(
      port().fill(c.color, 0.15),
      port().shadowColor(c.color, 0.15),
      port().shadowBlur(14, 0.15),
      clientRefs[idx]().shadowBlur(38, 0.12),
    );
    yield* all(
      clientRefs[idx]().shadowBlur(18, 0.15),
    );

    yield* waitFor(0.1);

    // 2. Request →
    yield* packet(view, from, to, C.req, reqLabel, 0.5);
    yield* waitFor(0.15);

    // 3. Response ←
    yield* packet(view, to, from, C.res, resLabel, 0.5);
    yield* waitFor(holdDelay);

    // 4. FIN — packet flies, then pipe retracts from client side
    yield* packet(view, from, to, C.fin, 'FIN', 0.35);
    yield* all(
      inner().start(1, 0.3, easeInOutCubic),
      outer().start(1, 0.3, easeInOutCubic),
      port().fill('#1a2d45', 0.3),
      port().shadowBlur(0, 0.3),
    );

    // Reset to clean state for potential reuse
    inner().start(0); inner().end(0); inner().opacity(0);
    outer().start(0); outer().end(0); outer().opacity(0);
  }

  // ── Sequences ─────────────────────────────────────────────────────────────
  yield* connectionFlow(0, 'GET /api/users', '200 OK', 0.3);
  yield* waitFor(0.3);

  yield* all(
    connectionFlow(1, 'POST /api/order', '201 Created', 0.3),
    chain(
      waitFor(0.5),
      connectionFlow(2, 'GET /api/status', '200 OK', 0.2),
    ),
  );

  yield* waitFor(0.4);

  yield* connectionFlow(0, 'GET /api/data', '200 OK', 0.15);

  yield* waitFor(0.6);

  // ── Fade out ──────────────────────────────────────────────────────────────
  yield* all(
    serverRef().opacity(0, 0.5),
    ...clientRefs.map(r => r().opacity(0, 0.5)),
    ...portDots.map(d => d().opacity(0, 0.3)),
  );
});
