/**
 * Half-period of the attention pulse that starts on the «ссылка появится здесь» beat.
 * Both cards and the chip loop on it, so forking them on the same frame keeps them
 * breathing in step — the number lives here so they can't drift apart.
 */
export const PULSE_HALF = 1.15;
