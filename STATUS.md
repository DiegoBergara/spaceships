# STATUS: SPACESHIPS

**Estado:** completo, validado y publicado.

- Repositorio: https://github.com/DiegoBergara/spaceships
- Juego en GitHub Pages: https://diegobergara.github.io/spaceships/
- Rama publicada: `main`

## Juego

### Base y distribución

- Build estático y autocontenido: `index.html`, `game.js` y `three.min.js` local.
- Funciona offline al abrir `index.html` en un navegador moderno.
- Three.js r128 está incluido localmente, sin CDN ni dependencia de red para jugar.
- README actualizado con controles, arquitectura local, máquina de desarrollo, modelo, benchmark y cómo verificar el proyecto.

### Nave, combate y supervivencia

- Nave low-poly en tercera persona con inercia, cámara suavizada y HUD neon.
- Controles de escritorio: WASD, flechas, Espacio, Enter y R.
- Disparos con pool de balas, triple shot y rapid fire.
- Asteroides low-poly de tres tamaños con fragmentación y capas de hielo azul brillante.
- Score por supervivencia y destrucción, récord persistente en `localStorage` y pantalla de crash.
- Dificultad progresiva hasta 180 segundos:
  - cadencia de asteroides: aproximadamente 0.92 s a 0.30 s;
  - velocidad global: ×1 a ×2.8;
  - aceleración individual durante la aproximación;
  - nave: ×1 a ×1.75 para mantener controlabilidad.
- Oleadas, entradas frontales, laterales y verticales. No existe una zona lateral segura permanente.

### Power-ups

- Shield, Triple Shot, Rapid Fire, Score ×2, Slow Time y Nova.
- Spawn, movimiento, recolección, temporizadores en HUD, expiración y limpieza al reiniciar.
- El escudo absorbe impactos de asteroides y un impacto planetario o solar.

### Menú, game over y presentación

- Menú y game over usan el mismo panel central con tarjeta translúcida, borde neon y fondo espacial animado.
- El menú oculta la nave para mantener la lectura limpia, mientras el espacio, polvo, asteroides y sobrevuelos siguen activos detrás.
- CRT luminoso con curvatura, scanlines y HUD con inercia. No hay viñeta oscura.
- Música y efectos se pueden iniciar desde una tecla, un tap/click de pantalla o el botón `♫ MUSIC`.

### Audio offline

- Soundtrack synthwave procedural de 108 BPM mediante Web Audio nativo.
- Kick, snare, hats, bajo, arpegio, pads y compresión.
- Efectos de láser, impacto, power-up y crash en un canal separado.
- Música continua en menú, partida y game over. El botón `♫ MUSIC` permite mutear y reactivar.

### Espacio y eventos ambientales

- Dos estelas de propulsión con 76 partículas intermitentes amarillo, naranja y rojo.
- 720 partículas de polvo, cristales y estrellas para profundidad espacial.
- Asteroides helados tipo cometa desprenden hasta 420 chips de hielo azul/blanco como estela.
- Los soles gigantes tienen una corona de 260 partículas ámbar animadas.
- Las partículas de motores, soles y cometas son decorativas: no hacen daño ni participan en colisiones.
- Planetas helados y soles gigantes aparecen aproximadamente cada 16 a 32 segundos.
- Planetas y soles son peligros durante la partida:
  - se pueden esquivar;
  - activan aviso `PLANETARY HAZARD` o `SOLAR HAZARD` en HUD;
  - provocan `PLANETARY IMPACT` o `SOLAR IMPACT` al colisionar;
  - el escudo absorbe un solo impacto celestial.

### Controles mobile

- Tap en el menú: inicia la partida.
- Tap en game over: reinicia.
- Inclinar el teléfono: mueve la nave.
- Tap durante la partida: dispara una ráfaga corta.
- En Safari/iOS se solicita permiso de orientación desde el primer tap, como exige el navegador.
- El menú muestra instrucciones mobile en dispositivos táctiles.

## Validación

Última validación completa ejecutada correctamente:

```bash
cd ~/spaceships
node --check game.js
./test.sh
```

Resultado: `RESULT PASS`.

El probe headless verifica, entre otros:

- fondo animado del menú y Enter para comenzar;
- tilt y tap mobile;
- audio procedural y efectos offline;
- partículas del Sol y chips de hielo visuales;
- disparos, división de asteroides, dificultad, HUD y power-ups;
- música continua durante game over;
- colisión fatal con planetas y soles;
- reinicio y generación de mundo posterior al crash.

## Desarrollo local

```bash
open -a "Google Chrome" ~/spaceships/index.html
```

## Pendientes

**Ninguno.**
