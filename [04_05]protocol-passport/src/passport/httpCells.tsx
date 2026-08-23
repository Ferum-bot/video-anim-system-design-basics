import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {range} from '@motion-canvas/core';
import {colors, fonts, withAlpha} from '@lib';

// Содержимое четырёх ячеек паспорта для HTTP. Строит их сцена, а не сам паспорт: форма —
// общая на весь сезон, а что в неё пишут — дело конкретного протокола.

/** Типы сообщений: их ровно два, и это стоит показать числом. */
export const httpTypes = () => (
  <Node>
    <Txt y={-8} text="ЗАПРОС  ·  ОТВЕТ" fill={colors.text} fontSize={26}
      fontFamily={fonts.mono} fontWeight={500} letterSpacing={1.6}/>
    <Txt y={30} text="ВСЕГО ДВА" fill={colors.textMuted} fontSize={15}
      fontFamily={fonts.mono} letterSpacing={1.3}/>
  </Node>
);

// Мини-макет сообщения: стартовая строка, заголовки, пустая строка, тело. Пустая строка
// намеренно тоньше и без заливки — именно она разделяет заголовки и тело.
const ROW = {width: 300, height: 20, gap: 7} as const;
const LINES = [
  {label: 'СТАРТОВАЯ СТРОКА', fill: 0.5},
  {label: 'ЗАГОЛОВКИ', fill: 0.32},
  {label: '', fill: 0},
  {label: 'ТЕЛО', fill: 0.22},
] as const;

/** Синтаксис: какие части и как разделены. */
export const httpSyntax = () => (
  <Node y={-4}>
    {LINES.map((line, index) => (
      <Rect
        y={(index - 1.5) * (ROW.height + ROW.gap)}
        width={ROW.width}
        height={line.label ? ROW.height : 10}
        radius={4}
        fill={line.fill ? withAlpha(colors.cyan, line.fill) : null}
        stroke={line.label ? null : withAlpha(colors.textMuted, 0.55)}
        lineWidth={line.label ? 0 : 1.4}
        lineDash={[6, 5]}
      >
        {line.label ? (
          <Txt text={line.label} fill={colors.background} fontSize={12}
            fontFamily={fonts.mono} fontWeight={600} letterSpacing={1}/>
        ) : (
          <Txt y={0} text="ПУСТАЯ СТРОКА" fill={colors.textMuted} fontSize={10}
            fontFamily={fonts.mono} letterSpacing={1}/>
        )}
      </Rect>
    ))}
  </Node>
);

/** Семантика: что означает информация в полях. */
export const httpSemantics = () => {
  const codes = [
    {code: '200', text: 'ВСЁ ХОРОШО', tone: colors.green},
    {code: '404', text: 'НЕ НАЙДЕНО', tone: colors.red},
  ];
  return (
    <Node>
      {codes.map((entry, index) => (
        <Node y={(index - 0.5) * 44}>
          <Txt x={-92} offsetX={-1} text={entry.code} fill={entry.tone} fontSize={30}
            fontFamily={fonts.mono} fontWeight={600} letterSpacing={1.4}/>
          <Txt x={-14} offsetX={-1} text={entry.text} fill={colors.textDim} fontSize={17}
            fontFamily={fonts.mono} letterSpacing={1.2}/>
        </Node>
      ))}
    </Node>
  );
};

/** Правила: кто когда говорит. */
export const httpRules = () => {
  const node = {width: 96, height: 40, radius: 8} as const;
  const x = 118;
  return (
    <Node>
      {range(2).map(index => (
        <Rect x={(index * 2 - 1) * x} width={node.width} height={node.height}
          radius={node.radius} fill={colors.surface}
          stroke={withAlpha(colors.cyan, 0.7)} lineWidth={1.5}>
          <Txt text={index === 0 ? 'КЛИЕНТ' : 'СЕРВЕР'} fill={colors.text} fontSize={15}
            fontFamily={fonts.mono} letterSpacing={1.2}/>
        </Rect>
      ))}
      <Line points={[[-x + 54, -12], [x - 54, -12]]} stroke={withAlpha(colors.cyan, 0.75)}
        lineWidth={1.8} endArrow arrowSize={8}/>
      <Line points={[[x - 54, 12], [-x + 54, 12]]} stroke={withAlpha(colors.textMuted, 0.7)}
        lineWidth={1.8} endArrow arrowSize={8}/>
      <Txt y={42} text="КЛИЕНТ ГОВОРИТ ПЕРВЫМ" fill={colors.textMuted} fontSize={14}
        fontFamily={fonts.mono} letterSpacing={1.2}/>
    </Node>
  );
};
