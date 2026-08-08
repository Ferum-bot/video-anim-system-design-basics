/**
 * Half-period of the attention pulse that starts on the «переходи по подсказкам» beat.
 * The card and the chip each loop on it, so forking them on the same frame keeps them
 * breathing in step — the number lives here so the two can't drift apart.
 */
export const PULSE_HALF = 1.15;
