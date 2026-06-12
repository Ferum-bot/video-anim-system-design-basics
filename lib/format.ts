/** `1234567` → `"1,234,567"`. */
export const formatThousands = (value: number): string =>
  Math.round(value).toLocaleString('en-US');
