/**
 * "Blueprint Signal" components for video 02 "Всё про сети".
 *
 * These build on the shared `@lib` framework (stage, theme system, `Widget`, `withAlpha`)
 * and read the active theme through `@lib`'s `colors`/`fonts` proxies — so the blueprint
 * style comes entirely from the applied theme preset (`@lib/themes/blueprint`).
 */
export {PANEL_WIDTH} from './metrics';
export {sceneHeading} from './components/heading';
export {osiStack} from './components/osiStack';
export type {OsiLayer} from './components/osiStack';
export {handshake} from './components/handshake';
export type {HandshakeStep} from './components/handshake';
export {protocolCard} from './components/protocolCard';
export type {ProtocolField} from './components/protocolCard';
