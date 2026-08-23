# -*- coding: utf-8 -*-
"""Проверка центровки кадра сцены.

Снимаем кадр кнопкой-камерой в редакторе (он ложится в `output/still/project/NNNNNN.png`)
и прогоняем через этот скрипт. **Тема должна быть в режиме экспорта** (`transparent: true`
в `lib/themes/<name>.ts`) — панель находится по альфе, а в режиме редактирования фон залит
и «панелью» окажется весь кадр 3840×2160. он находит панель по альфе, отступает внутрь от её рамки,
берёт габарит яркого контента и печатает поля с четырёх сторон.

    python3 tools/check-centering.py output/still/project/000360.png [порог_яркости]

Глазом перекос в 40–80 единиц не всегда виден, особенно когда часть композиции (чип,
подпись) появляется только на отдельных битах, — а на экране он читается как «съехало».
Гонять на каждом ключевом бите сцены, а не только на финальном кадре.
"""
import sys
import numpy as np
from PIL import Image

path = sys.argv[1]
# Порог яркости, отделяющий контент от сетки. Мажорная линия сетки блюпринта (10% cyan
# по 90%-й подложке) даёт яркость ≈46, а элемент, показанный вполсилы, — ≈69, поэтому
# порог стоит между ними. С порогом 45 замер шёл по крайним линиям сетки, а не по кадру.
THRESHOLD = float(sys.argv[2]) if len(sys.argv) > 2 else 55
im = np.asarray(Image.open(path).convert('RGBA')).astype(np.int32)
a = im[..., 3]

# Панель — единственное, что вообще непрозрачно на экспортном кадре.
rows = np.where(a.max(axis=1) > 10)[0]
cols = np.where(a.max(axis=0) > 10)[0]
pt, pb, pl, pr = rows[0], rows[-1], cols[0], cols[-1]

# Рамка самой панели тоже яркая — отступаем внутрь, иначе она и будет «контентом».
INSET = 16
lum = (im[..., 0] * 0.299 + im[..., 1] * 0.587 + im[..., 2] * 0.114)
inner = lum[pt + INSET:pb + 1 - INSET, pl + INSET:pr + 1 - INSET]
bright = inner > THRESHOLD
rmask = np.where(bright.sum(axis=1) > 15)[0]
cmask = np.where(bright.sum(axis=0) > 15)[0]
ct, cb, cl, cr = rmask[0], rmask[-1], cmask[0], cmask[-1]

h, w = inner.shape
top, bottom = ct, (h - 1) - cb
left, right = cl, (w - 1) - cr
print(f'{path.split("/")[-1]}')
print(f'  панель      {pr - pl + 1} x {pb - pt + 1}  (замер с отступом {INSET}px от рамки)')
print(f'  поля  верх {top:5d}   низ {bottom:5d}   Δ {abs(top - bottom):5d}')
print(f'  поля  лево {left:5d}  право {right:5d}   Δ {abs(left - right):5d}')
verdict = 'OK' if abs(top - bottom) <= 12 and abs(left - right) <= 12 else 'СМЕЩЕНО'
print(f'  → {verdict}')
