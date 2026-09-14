# SPACESHIPS

A neon CRT-style, low-poly 3D space-survival game. Fly, shoot asteroids, collect power-ups, avoid immense planetary flybys, and survive as the arena accelerates.

**Play it:** https://diegobergara.github.io/spaceships/

## Offline AI build

This project was made **100% offline** with:

- **Qwen3.8 27B**, running locally in **LM Studio**
- **Pi** as the coding agent
- No cloud-model inference, API calls, or remote coding service was used to build the game

The repository is hosted on GitHub Pages only to make the finished static game available in a browser.

## Local development machine

| Component | Specification |
| --- | --- |
| Computer | MacBook Pro (Mac17,2) |
| Chip | Apple M5 |
| CPU | 10 cores: 4 performance + 6 efficiency |
| GPU | Integrated 10-core Apple M5 GPU, Metal 4 |
| Unified memory | 32 GB |
| Display | Liquid Retina XDR, 3024 × 1964 |
| Operating system | macOS 26.5.2 (25F84) |
| Local model | `qwen/qwen3.8-27b` |
| Model format | MLX, 4-bit, 27B parameters, 16.08 GB on disk |
| Loaded context | 42,496 tokens |
| LM Studio | 0.4.20+1 |
| Pi | 0.84.4 |

## Token throughput and project scale

Approximately **3.7 million tokens** were used during the project.

A local LM Studio benchmark of the loaded Qwen3.8 27B model measured an average sustained generation rate of **5.36 tokens/second** across three runs.

This is an approximate effective generation time, not elapsed wall-clock project time. Token rate varies with prompt size, context length, reasoning mode, thermals, and concurrent system work.

## Controls

| Input | Action |
| --- | --- |
| `Enter` | Start from the main menu |
| `WASD` or arrow keys | Fly |
| `Space` | Fire |
| `R` | Restart after a crash |
| `♫ MUSIC` | Start, mute, or unmute the offline soundtrack |
| Tilt device | Fly on mobile after sensor permission is granted |
| Tap the game screen | Start/restart, or fire during active play |

## Features

- Fully self-contained static build. Three.js is bundled locally, so the game can also run without an internet connection.
- Procedural Web Audio synthwave soundtrack plus laser, impact, pickup, and crash effects.
- Progressive survival difficulty: asteroid density and speed ramp up over time, while ship responsiveness increases to remain controllable.
- Six power-ups: shield, triple shot, rapid fire, score multiplier, slow time, and nova.
- Living backgrounds in the menu and game-over states.
- Mobile controls: device tilt to fly and tap to fire. iOS requests device-orientation permission from the first tap.
- Huge planet and Sun flybys with solar-corona particles.
- Icy asteroid-comets that shed visual ice fragments. Decorative particles never deal damage.
- Planetary and solar bodies are gameplay hazards during active play. A HUD warning appears when one approaches; avoid impact or use a shield.

## Run locally

Open `index.html` in a modern browser:

```bash
open -a "Google Chrome" ~/spaceships/index.html
```

## Verify

```bash
cd ~/spaceships
node --check game.js
./test.sh
```

The headless test checks gameplay states, offline audio initialization, power-ups, environmental particles, celestial hazards, and the menu/game-over flows.

## License

No license has been selected yet.
