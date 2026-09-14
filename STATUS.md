# STATUS — Spaceships (lowpoly 3D)

Última actualización: juego completo, dificultad reforzada, seis power-ups, espacio poblado, música procedural offline y estética neon/CRT verificadas.

## Regla de trabajo
- Implementación **progresiva en partes pequeñas**. Después de cada parte:
  1. Verificar sintaxis: `node --check game.js`
  2. Test headless (si aplica a la parte): `./test.sh`
  3. No avanzar a la siguiente hasta que la actual pase.
- Nada de oneshots: cada parte es un bloque delimitado con comentario `// PART n:`.
- `game.js` vive en `~/spaceships/` y se edita in-place por bloques (ya no se reconstruye desde /tmp).

## Partes (checklist)
| # | Parte | Contenido | Estado |
|---|-------|-----------|--------|
| 1 | Bootstrap | Three.js r128 embebido, escena, estrellas, nave lowpoly, loop con reloj rAF | ✅ verificado (probe t1.0s) |
| 2 | Mundo vivo | Cámara 3ª persona, WASD, asteroides 3 tiers que se aproximan, colisión + crash + partículas | ✅ verificado (probe) |
| 3 | Combate | Fuego (espacio), bullets + pool, tiers se dividen en 2 menores, partículas por impacto/destrucción | ✅ verificado (probe) |
| 4 | Score + HUD + dificultad | Score = tiempo×10 + puntos por roque (100/50/10), best en localStorage, oleadas más densas y veloces hasta 3 min, game over con R para reiniciar | ✅ verificado (probe de escalada) |
| 5 | Escudo + menú | Power-up escudo + estado `menu` congelado + `startGame()` con reset del mundo | ✅ verificado (menu/Enter + pickup + impacto absorbido) |
| 6 | Power-ups | Triple shot, rapid fire, score ×2, tiempo lento y nova (spawn + temporización + HUD + física de pickup) | ✅ verificado (pickups + fire rate/spread + score ×2 + slow + nova + HUD) |

Notas:
- Part 4: "reinicio con R" y "HUD game over" se movieron a la Part 4 (ahí vivía el score); la Part 5 queda reducida a escudo + menú.
- `window.__game.debug*` (debugSpawn/debugCrash/debugRun/debugRestart) permanecen en el build final como API de test — costo ~0.

## Estado actual (juego completo)
- ✅ `three.min.js` embebido (r128, 603 KB) — build autocontenido, funciona offline.
- ✅ `game.js`: scene + cámara 3ª persona + nave (WASD) + asteroides 3 tiers
  (grande 2.5 → mediano 1.45 → pequeño 0.75) + colisiones + fuego + bullets + pool +
  splitting + partículas + score (tiempo + roques) + HUD neon reactivo + best (localStorage) +
  dificultad progresiva + game over (CRASH + score/best + R reinicia) + menú inicial +
  escudo (8 s, burbuja e impacto absorbido) + triple shot + rapid fire + score ×2 +
  tiempo lento + nova que limpia la oleada.
- ✅ Arena más compacta y oleadas: salir hacia los lados ya no crea una zona segura; las rocas entran por frente, laterales y arriba/abajo, son más grandes (3.25 / 1.85 / 0.95), aceleran individualmente al aproximarse, cada 55 s agrega rocas por oleada y la velocidad global escala ×1 → ×2.8 hasta los 3 min. La aceleración de la nave también escala ×1 → ×1.75 para mantener la respuesta.
- ✅ `index.html`: HUD neon con sway ligado a la inercia de la nave, scanlines y marco curvo CRT luminoso (sin viñeta oscura).
- ✅ FX espacial: 76 partículas de plasma de motor en emisiones esporádicas amarillo/naranja/rojo, 720 partículas de polvo/estrellas en suspensión y capas de hielo azul luminoso en los asteroides.
- ✅ FX celestes: cada Sol gigante tiene una corona de 260 partículas ámbar animadas. Los asteroides helados desprenden hasta 420 chips de hielo azul como estela de cometa; son estrictamente visuales y no participan en colisiones ni daño.
- ✅ Música y SFX offline: synthwave a 108 BPM generada por Web Audio nativo, desbloqueada por cualquier tecla física, click en la pantalla inicial o el botón MUSIC. Continúa en menú, partida y game over; incluye laser, impacto, pickup y crash en un canal de efectos independiente.
- ✅ Tras el crash y en el menú, el campo de asteroides sigue generando nuevas oleadas detrás del mismo panel central de game over. El menú oculta la nave y protege la lectura con una tarjeta oscura translúcida. Los asteroides reciben la progresión global ×1 → ×2.8 y su aceleración individual de aproximación. Planetas helados y una estrella/Sol inmensos pasan cerca de la nave aproximadamente cada 16–32 s. Son peligros durante la partida: muestran alerta HUD, se pueden esquivar y provocan crash por impacto planetario o solar. El escudo absorbe un único impacto celeste; las partículas siguen siendo decorativas.
- ✅ Power-ups: aparecen durante la partida, se mueven hacia la nave, se recogen por colisión,
  muestran su temporizador en el HUD, expiran y se limpian al reiniciar.
- ⚠️ La capa WebGL de SwiftShader puede verse negra en screenshot headless → el check serio
  es el probe de `test.html` (readPixels en el mismo task): **todas las aserciones pasan**.

## Comandos
- `node --check game.js`        # sintaxis
- `./test.sh`                   # probe headless + screenshot (index.html)
- abrir `index.html` en Chrome  # gameplay manual

## Verificación final
- `test.html` contiene aserciones deterministas para: menú congelado, Enter → play, escudo,
  absorción de crash, power-ups, triple/rapid fire, score ×2, tiempo lento, nova, HUD de
  efectos y dificultad escalable.
- `test.sh` falla si alguna aserción devuelve `FAIL`; el último resultado fue `RESULT PASS`.

## Verificación (reusable)
- `test.html`: probe SINCRÓNICO — `debugRun(n)` corre update+render en el mismo task y
  `readPixels` en el mismo task → buffer fresco (evita el problema de swap/composite de
  `--screenshot`).
- `test.sh`: `--dump-dom` + `--virtual-time-budget=10000` + `--use-angle=swiftshader`.
- Chrome disponible: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
