/* =====================================================================
   SPACESHIPS — low-poly 3D (Three.js r128, autocontenido/offline)
   Construcción progresiva: cada bloque "Part N" es verificable solo.
   ===================================================================== */
(function () {
  'use strict';

  // ---------------------------------------------------------------
  // PART 1: escena + cámara en 3era persona + nave low-poly + loop
  // ---------------------------------------------------------------

  var canvas = document.getElementById('scene');
  var msg = document.getElementById('msg');

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  } catch (e) {
    msg.style.display = 'grid';
    msg.textContent = 'WebGL no disponible en este navegador: ' + e.message;
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060f);
  scene.fog = new THREE.Fog(0x05060f, 60, 170);

  var camera = new THREE.PerspectiveCamera(70, 1, 0.1, 400);

  // Luces
  scene.add(new THREE.HemisphereLight(0x8899ff, 0x202838, 0.9));
  var sun = new THREE.DirectionalLight(0xffffff, 1.15);
  sun.position.set(6, 12, 8);
  scene.add(sun);

  // --- Nave low-poly (grupos de cajas/conos, flatShading) ---
  var ship = new THREE.Group();

  var matBody = new THREE.MeshPhongMaterial({ color: 0x9fb4d8, flatShading: true, shininess: 30 });
  var matWing = new THREE.MeshPhongMaterial({ color: 0x54719c, flatShading: true, shininess: 30 });
  var matCock = new THREE.MeshPhongMaterial({ color: 0x27e0ff, flatShading: true, emissive: 0x0a3d4a, shininess: 80 });
  var matEng  = new THREE.MeshPhongMaterial({ color: 0xff8833, flatShading: true, emissive: 0xff5500, emissiveIntensity: 0.9 });

  var hull = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 2.2), matBody);
  ship.add(hull);

  var nose = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.1, 4), matWing);
  nose.rotation.x = -Math.PI / 2; // punta hacia -Z (hacia adelante)
  nose.position.z = -1.65;
  ship.add(nose);

  var wings = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.95), matWing);
  wings.position.set(0, -0.05, 0.55);
  ship.add(wings);

  var finL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.55), matWing);
  finL.position.set(-1.25, 0.2, 0.6);
  ship.add(finL);
  var finR = finL.clone();
  finR.position.x = 1.25;
  ship.add(finR);

  var cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.7), matCock);
  cockpit.position.set(0, 0.35, -0.35);
  ship.add(cockpit);

  var engL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.5), matEng);
  engL.position.set(-0.28, 0, 1.25);
  ship.add(engL);
  var engR = engL.clone();
  engR.position.x = 0.28;
  ship.add(engR);

  scene.add(ship);

  // --- Propulsores: columnas densas de plasma que viven en el espacio local de la nave ---
  var engineTrails = [];
  function makeEngineTrail(x) {
    var count = 38, pos = new Float32Array(count * 3), col = new Float32Array(count * 3), cooldowns = new Float32Array(count);
    for (var i = 0; i < count; i++) {
      pos[i * 3] = x + (Math.random() - 0.5) * 0.18;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.18;
      pos[i * 3 + 2] = i % 2 ? 1.25 + Math.random() * 3.1 : 30;
      cooldowns[i] = i % 2 ? 0 : Math.random() * 0.38;
      var heat = 1 - (pos[i * 3 + 2] - 1.2) / 3.4;
      col[i * 3] = 1; col[i * 3 + 1] = 0.08 + heat * 0.9; col[i * 3 + 2] = heat * 0.12;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.13, vertexColors: true, transparent: true, opacity: 0.82, depthWrite: false }));
    pts.userData.cooldowns = cooldowns;
    ship.add(pts);
    engineTrails.push(pts);
  }
  makeEngineTrail(-0.28); makeEngineTrail(0.28);

  function updateEngineTrails(dt) {
    var shipMotion = shipVel ? Math.abs(shipVel.x) + Math.abs(shipVel.y) : 0;
    var thrust = 1 + Math.min(1, shipMotion) * 0.08;
    for (var t = 0; t < engineTrails.length; t++) {
      var a = engineTrails[t].geometry.attributes.position;
      var c = engineTrails[t].geometry.attributes.color;
      var cooldowns = engineTrails[t].userData.cooldowns;
      for (var i = 0; i < a.count; i++) {
        var z = a.getZ(i);
        if (cooldowns[i] > 0) {
          cooldowns[i] -= dt;
          if (cooldowns[i] > 0) continue;
          z = 1.2 + Math.random() * 0.22;
        } else {
          z += dt * 10 * thrust;
          if (z > 4.3) {
            cooldowns[i] = 0.07 + Math.random() * 0.34;
            a.setZ(i, 30);
            continue;
          }
        }
        a.setZ(i, z);
        a.setX(i, (t ? 0.28 : -0.28) + (Math.random() - 0.5) * 0.16 * (z / 3));
        a.setY(i, (Math.random() - 0.5) * 0.18 * (z / 2));
        var heat = 1 - (z - 1.2) / 3.4;
        c.setXYZ(i, 1, 0.08 + heat * 0.9, heat * 0.12);
      }
      a.needsUpdate = true;
      c.needsUpdate = true;
    }
  }

  // --- Espacio poblado: polvo, cristales y estrellas que atraviesan el campo de visión ---
  var dustCount = 720, dustPos = new Float32Array(dustCount * 3), dustCol = new Float32Array(dustCount * 3);
  for (var d = 0; d < dustCount; d++) {
    dustPos[d * 3] = (Math.random() * 2 - 1) * 42;
    dustPos[d * 3 + 1] = (Math.random() * 2 - 1) * 27;
    dustPos[d * 3 + 2] = -Math.random() * 180;
    var cold = 0.55 + Math.random() * 0.45;
    dustCol[d * 3] = cold * 0.55; dustCol[d * 3 + 1] = cold * 0.82; dustCol[d * 3 + 2] = cold;
  }
  var dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  dustGeo.setAttribute('color', new THREE.BufferAttribute(dustCol, 3));
  var spaceDust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.86, depthWrite: false }));
  scene.add(spaceDust);

  function updateSpaceDust(dt) {
    var a = dustGeo.attributes.position;
    var shipMotion = shipVel ? Math.abs(shipVel.x) + Math.abs(shipVel.y) : 0;
    var drift = 18 + Math.min(18, shipMotion);
    for (var i = 0; i < a.count; i++) {
      var z = a.getZ(i) + dt * drift;
      if (z > 12) {
        z = -175 - Math.random() * 30;
        a.setX(i, (Math.random() * 2 - 1) * 42);
        a.setY(i, (Math.random() * 2 - 1) * 27);
      }
      a.setZ(i, z);
    }
    a.needsUpdate = true;
  }

  // --- Banda sonora procedural offline: synthwave generativo con Web Audio nativo ---
  var audioEngine = (function () {
    var ctx, master, fx, compressor, timer, nextNote = 0, step = 0, muted = false;
    var bpm = 108, noiseBuffer;

    function ensure() {
      if (ctx) return true;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try {
        ctx = new AC();
        compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -16; compressor.knee.value = 18; compressor.ratio.value = 5;
        master = ctx.createGain(); master.gain.value = muted ? 0.0001 : 0.34;
        fx = ctx.createGain(); fx.gain.value = muted ? 0.0001 : 0.52;
        master.connect(compressor); fx.connect(compressor); compressor.connect(ctx.destination);
        noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.35, ctx.sampleRate);
        var data = noiseBuffer.getChannelData(0);
        for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        return true;
      } catch (e) { return false; }
    }

    function gainEnvelope(node, when, attack, release, volume) {
      node.gain.setValueAtTime(0.0001, when);
      node.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), when + attack);
      node.gain.exponentialRampToValueAtTime(0.0001, when + release);
    }

    function synth(freq, when, duration, type, volume, cutoff) {
      var osc = ctx.createOscillator(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, when);
      filter.type = 'lowpass'; filter.frequency.setValueAtTime(cutoff || 1800, when); filter.Q.value = 3;
      osc.connect(filter); filter.connect(gain); gain.connect(master);
      gainEnvelope(gain, when, 0.012, Math.max(0.05, duration), volume);
      osc.start(when); osc.stop(when + duration + 0.05);
    }

    function kick(when) {
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(150, when); osc.frequency.exponentialRampToValueAtTime(46, when + 0.13);
      osc.connect(gain); gain.connect(master); gainEnvelope(gain, when, 0.002, 0.2, 0.82);
      osc.start(when); osc.stop(when + 0.22);
    }

    function noise(when, duration, volume, highpass) {
      var src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      src.buffer = noiseBuffer; filter.type = highpass ? 'highpass' : 'bandpass';
      filter.frequency.value = highpass ? 6500 : 1600; filter.Q.value = 0.7;
      src.connect(filter); filter.connect(gain); gain.connect(master);
      gainEnvelope(gain, when, 0.004, duration, volume);
      src.start(when); src.stop(when + duration + 0.03);
    }

    function fxTone(freq, when, duration, type, volume, endFreq) {
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, when);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, when + duration);
      osc.connect(gain); gain.connect(fx);
      gainEnvelope(gain, when, 0.004, duration, volume);
      osc.start(when); osc.stop(when + duration + 0.04);
    }

    function fxNoise(when, duration, volume, highpass) {
      var src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      src.buffer = noiseBuffer; filter.type = highpass ? 'highpass' : 'bandpass';
      filter.frequency.value = highpass ? 3500 : 850; filter.Q.value = 0.9;
      src.connect(filter); filter.connect(gain); gain.connect(fx);
      gainEnvelope(gain, when, 0.003, duration, volume);
      src.start(when); src.stop(when + duration + 0.03);
    }

    function pad(freq, when) {
      var notes = [freq, freq * 1.2599, freq * 1.4983];
      for (var i = 0; i < notes.length; i++) synth(notes[i], when, 1.75, 'triangle', 0.055, 950);
    }

    function schedule(index, when) {
      var sixteenth = 60 / bpm / 4, beat = index % 16;
      var bass = [55, 55, 65.41, 49][Math.floor(index / 16) % 4];
      var arp = [220, 261.63, 329.63, 392, 329.63, 261.63, 220, 196][index % 8];
      if (beat === 0 || beat === 8 || beat === 12) kick(when);
      if (beat === 4 || beat === 12) noise(when, 0.16, 0.23, false);
      if (beat % 2 === 0) noise(when, 0.045, 0.075, true);
      if (beat % 2 === 0) synth(bass, when, sixteenth * 1.8, 'sawtooth', 0.15, 420);
      if (beat % 2 === 1) synth(arp, when, sixteenth * 1.45, 'square', 0.048, 2200);
      if (beat === 0) pad([110, 130.81, 98][Math.floor(index / 16) % 3], when);
    }

    function tick() {
      if (!ctx) return;
      var sixteenth = 60 / bpm / 4;
      while (nextNote < ctx.currentTime + 0.16) {
        schedule(step++, nextNote);
        nextNote += sixteenth;
      }
    }

    return {
      bpm: bpm,
      start: function () {
        if (!ensure()) return false;
        ctx.resume();
        if (timer) return true;
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(muted ? 0.0001 : 0.34, ctx.currentTime, 0.08);
        fx.gain.setTargetAtTime(muted ? 0.0001 : 0.52, ctx.currentTime, 0.05);
        nextNote = ctx.currentTime + 0.06; step = 0;
        timer = window.setInterval(tick, 45);
        return true;
      },
      stop: function () {
        if (!ctx) return;
        if (timer) { window.clearInterval(timer); timer = null; }
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.12);
      },
      toggle: function () {
        muted = !muted;
        if (!ensure()) return muted;
        master.gain.setTargetAtTime(muted ? 0.0001 : 0.34, ctx.currentTime, 0.06);
        fx.gain.setTargetAtTime(muted ? 0.0001 : 0.52, ctx.currentTime, 0.04);
        if (!muted) this.start();
        return muted;
      },
      sfx: function (kind) {
        if (!ensure() || muted) return false;
        ctx.resume();
        var now = ctx.currentTime + 0.012;
        if (kind === 'laser') {
          fxTone(920, now, 0.12, 'square', 0.11, 190);
        } else if (kind === 'impact') {
          fxTone(180, now, 0.16, 'triangle', 0.12, 55); fxNoise(now, 0.13, 0.19, false);
        } else if (kind === 'pickup') {
          fxTone(520, now, 0.09, 'sine', 0.13, 780); fxTone(780, now + 0.09, 0.12, 'sine', 0.13, 1180);
        } else if (kind === 'crash') {
          fxTone(95, now, 0.5, 'sawtooth', 0.2, 34); fxNoise(now, 0.46, 0.32, false);
        }
        return true;
      },
      get muted() { return muted; },
      get active() { return !!timer; },
      get state() { return ctx ? ctx.state : 'uninitialized'; }
    };
  })();

  // --- Encuentros de fondo: planetas y estrellas pasan cerca a intervalos irregulares ---
  var flyby = new THREE.Group();
  var planet = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshPhongMaterial({ color: 0x315b9a, emissive: 0x07142f, emissiveIntensity: 0.7, shininess: 22 }));
  var planetGlow = new THREE.Mesh(new THREE.SphereGeometry(1.08, 16, 12), new THREE.MeshBasicMaterial({ color: 0x61b9ff, transparent: true, opacity: 0.16, side: THREE.BackSide, depthWrite: false }));
  var sun = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffba45 }));
  var sunLight = new THREE.PointLight(0xffa54b, 2.4, 210);
  var flareCount = 260, flarePos = new Float32Array(flareCount * 3), flareBase = new Float32Array(flareCount * 3), flareCol = new Float32Array(flareCount * 3), flarePhase = new Float32Array(flareCount);
  for (var fi = 0; fi < flareCount; fi++) {
    var fv = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
    var fr = 1.04 + Math.random() * 0.52;
    flarePos[fi * 3] = flareBase[fi * 3] = fv.x * fr;
    flarePos[fi * 3 + 1] = flareBase[fi * 3 + 1] = fv.y * fr;
    flarePos[fi * 3 + 2] = flareBase[fi * 3 + 2] = fv.z * fr;
    flareCol[fi * 3] = 1; flareCol[fi * 3 + 1] = 0.34 + Math.random() * 0.58; flareCol[fi * 3 + 2] = 0.04;
    flarePhase[fi] = Math.random() * Math.PI * 2;
  }
  var flareGeo = new THREE.BufferGeometry();
  flareGeo.setAttribute('position', new THREE.BufferAttribute(flarePos, 3));
  flareGeo.setAttribute('color', new THREE.BufferAttribute(flareCol, 3));
  var sunFlare = new THREE.Points(flareGeo, new THREE.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.92, depthWrite: false }));
  sunFlare.userData.phase = flarePhase;
  flyby.add(planet); flyby.add(planetGlow); flyby.add(sun); flyby.add(sunLight); flyby.add(sunFlare);
  flyby.visible = false;
  scene.add(flyby);
  var flybyTimer = 12;

  function spawnFlyby(forceSun) {
    var isSun = typeof forceSun === 'boolean' ? forceSun : Math.random() < 0.38;
    // Son cuerpos de escala planetaria: el encuadre solo alcanza a mostrar una porción al pasar cerca.
    var radius = isSun ? 46 + Math.random() * 18 : 36 + Math.random() * 16;
    planet.visible = !isSun; planetGlow.visible = !isSun; sun.visible = isSun; sunLight.visible = isSun; sunFlare.visible = isSun;
    planet.scale.setScalar(radius); planetGlow.scale.setScalar(radius * 1.05); sun.scale.setScalar(radius);
    sunFlare.scale.setScalar(radius);
    // El borde del cuerpo pasa cerca, pero deja una ruta de escape si el piloto se mueve.
    flyby.position.set((Math.random() < 0.5 ? -1 : 1) * (radius + 6 + Math.random() * 12), (Math.random() * 2 - 1) * 14, -128);
    flyby.rotation.set(Math.random() * 4, Math.random() * 4, Math.random() * 2);
    flyby.userData.speed = 13 + Math.random() * 7;
    flyby.userData.radius = radius;
    flyby.userData.isSun = isSun;
    flyby.visible = true;
  }

  function updateFlyby(dt) {
    if (!flyby.visible) {
      flybyTimer -= dt;
      if (flybyTimer <= 0) spawnFlyby();
      return;
    }
    flyby.position.z += dt * flyby.userData.speed;
    flyby.rotation.y += dt * 0.13;
    if (sunFlare.visible) {
      var fp = flareGeo.attributes.position, phase = sunFlare.userData.phase;
      for (var i = 0; i < fp.count; i++) {
        var pulse = 1 + Math.sin(simTime * 4 + phase[i]) * 0.12;
        fp.setXYZ(i, flareBase[i * 3] * pulse, flareBase[i * 3 + 1] * pulse, flareBase[i * 3 + 2] * pulse);
      }
      fp.needsUpdate = true;
    }
    // Planetas y soles son peligros físicos solo durante la partida. Sus partículas siguen siendo decorativas.
    if (state === 'play') {
      var dx = flyby.position.x - ship.position.x, dy = flyby.position.y - ship.position.y, dz = flyby.position.z - ship.position.z;
      var hitRadius = flyby.userData.radius + 1.0;
      if (dx * dx + dy * dy + dz * dz < hitRadius * hitRadius) {
        if (effects.shield > 0) {
          effects.shield = 0;
          flyby.visible = false;
          flybyTimer = 8 + Math.random() * 8;
          audioEngine.sfx('impact');
        } else {
          crash(null, flyby.userData.isSun ? 'SOLAR IMPACT' : 'PLANETARY IMPACT');
          return;
        }
      }
    }
    if (flyby.position.z > 34) {
      flyby.visible = false;
      flybyTimer = 16 + Math.random() * 16;
    }
  }

  // --- Redimensionado ---
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // --- Loop de juego ---
  // updateFn(dt): simulacion (Part 2+ la reasigna); render(): dibuja estado
  var clock = new THREE.Clock();
  var simTime = 0;
  var state = 'menu';                 // 'menu' | 'play' | 'crashed'
  var worldReady = false;
  var crashT = 0;
  var updateFn = updateIdle;
  var updateCrashed = function () {}; // lo implementa Part 2

  function updateIdle(dt) {
    var t = simTime;
    // flotido idle (Part 2 lo reemplaza con control real)
    ship.position.y = Math.sin(t * 1.3) * 0.25;
    ship.rotation.z = Math.sin(t * 0.9) * 0.12;
    ship.rotation.x = Math.sin(t * 1.1) * 0.05;
    // cámara en 3era persona: detrás y arriba de la nave
    camera.position.set(0, 1.5 + ship.position.y * 0.5, 4.4);
    camera.lookAt(0, ship.position.y, -2);
  }

  function updateMenu(dt) {
    if (!worldReady) return;
    updateEngineTrails(dt * 0.45);
    updateSpaceDust(dt);
    updateFlyby(dt);
    updateRocks(dt);
    updateIceDebris(dt);
    camera.position.set(0, 2.6, 8.5);
    camera.lookAt(0, 0, -16);
  }

  function render() {
    renderer.render(scene, camera);
  }

  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.1);
    if (state === 'crashed') { crashT += dt; updateCrashed(dt); }
    else if (state === 'play') { simTime += dt; updateFn(dt); }
    else if (state === 'menu') { simTime += dt; updateMenu(dt); }
    render();
  }
  animate();

  // Manija de depuración / tests headless
  window.__game = {
    scene: scene, ship: ship, camera: camera, renderer: renderer,
    update: function (dt) { updateFn(dt); }, render: render,
    // avanza n frames a 60fps y deja renderizado el estado final
    debugRun: function (n) {
      for (var i = 0; i < n; i++) {
        var dt = 1 / 60;
        if (state === 'crashed') { crashT += dt; updateCrashed(dt); }
        else if (state === 'play') { simTime += dt; updateFn(dt); }
        else if (state === 'menu') { simTime += dt; updateMenu(dt); }
      }
      render();
    },
    get time() { return simTime; }
  };

  // ---------------------------------------------------------------
  // PART 2: control de la nave (teclado) + asteroides aleatorios
  //          (3 tamaños) que se aproximan + colisión => crash
  // ---------------------------------------------------------------

  // ---- Input (WASD / flechas) ----
  var keys = {};
  var mobile = { enabled: false, calibrated: false, baseBeta: 0, baseGamma: 0, x: 0, y: 0, fireUntil: 0 };

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function enableMobileTilt() {
    if (!window.DeviceOrientationEvent) return;
    function granted() { mobile.enabled = true; mobile.calibrated = false; }
    // Safari/iOS exige pedir permiso dentro de un gesto del usuario; Android expone el sensor directamente.
    if (typeof window.DeviceOrientationEvent.requestPermission === 'function') {
      window.DeviceOrientationEvent.requestPermission().then(function (result) {
        if (result === 'granted') granted();
      }).catch(function () {});
    } else {
      granted();
    }
  }
  window.addEventListener('deviceorientation', function (e) {
    if (!mobile.enabled || e.beta === null || e.gamma === null) return;
    if (!mobile.calibrated) {
      mobile.baseBeta = e.beta; mobile.baseGamma = e.gamma; mobile.calibrated = true;
      return;
    }
    mobile.x = clamp((e.gamma - mobile.baseGamma) / 18, -1, 1);
    mobile.y = clamp(-(e.beta - mobile.baseBeta) / 18, -1, 1);
  }, true);
  window.addEventListener('keydown', function (e) {
    keys[e.code] = true;
    // Cualquier tecla física desbloquea Web Audio, incluso si el foco llegó al canvas antes que Enter.
    if (e.isTrusted && !audioEngine.active) { audioEngine.start(); syncAudioLabel(); }
    if (e.code === 'Enter' && state === 'menu') {
      startGame();
      if (e.isTrusted) { audioEngine.start(); syncAudioLabel(); }
    }
    if (e.code === 'KeyR' && state === 'crashed') {
      startGame();
      if (e.isTrusted) { audioEngine.start(); syncAudioLabel(); }
    }
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });

  var shipVel = { x: 0, y: 0 };
  // Arena compacta: no hay "zonas seguras" laterales para esquivar sin riesgo.
  var BOUNDS = { x: 17, y: 9.5 };

  function updateShip(dt) {
    var ax = ((keys.KeyD || keys.ArrowRight) ? 1 : 0) - ((keys.KeyA || keys.ArrowLeft) ? 1 : 0);
    var ay = ((keys.KeyW || keys.ArrowUp) ? 1 : 0) - ((keys.KeyS || keys.ArrowDown) ? 1 : 0);
    if (mobile.enabled && mobile.calibrated) { ax += mobile.x; ay += mobile.y; }
    ax = clamp(ax, -1, 1); ay = clamp(ay, -1, 1);
    // La nave gana respuesta con el nivel de amenaza, para seguir siendo pilotable.
    var ACC = 42 * playerSpeed(simTime);
    var FRIC = Math.pow(0.001, dt); // fricción exponencial (~0.887/frame a 60fps)
    shipVel.x = (shipVel.x + ax * ACC * dt) * FRIC;
    shipVel.y = (shipVel.y + ay * ACC * dt) * FRIC;
    ship.position.x = Math.max(-BOUNDS.x, Math.min(BOUNDS.x, ship.position.x + shipVel.x * dt));
    ship.position.y = Math.max(-BOUNDS.y, Math.min(BOUNDS.y, ship.position.y + shipVel.y * dt));
    // inclinación (banking) según velocidad: feeling de vuelo
    ship.rotation.z = -shipVel.x * 0.055;
    ship.rotation.x = shipVel.y * 0.045;
  }

  // ---- Asteroides: 3 tiers (grande/mediano/chico) ----
  var TIERS = [
    { r: 3.25, s: 10, w: 0.18, pts: 100 },
    { r: 1.85, s: 15, w: 0.40, pts: 50 },
    { r: 0.95, s: 21, w: 0.42, pts: 10 }
  ];

  // forma low-poly: icosaedro con vertices "carcomidos" (4 variantes)
  function rockGeo() {
    var g = new THREE.IcosahedronGeometry(1, 0);
    var p = g.attributes.position, seen = {};
    for (var i = 0; i < p.count; i++) {
      var x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      var k = x.toFixed(2) + ',' + y.toFixed(2) + ',' + z.toFixed(2);
      var s = seen[k];
      if (s === undefined) { s = (0.78 + Math.random() * 0.3) * (0.9 + Math.random() * 0.2); seen[k] = s; }
      p.setXYZ(i, x * s, y * s, z * s);
    }
    p.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }
  var rockGeos = [rockGeo(), rockGeo(), rockGeo(), rockGeo()];
  var rockMats = [
    new THREE.MeshPhongMaterial({ color: 0x8a8073, flatShading: true, shininess: 6 }),
    new THREE.MeshPhongMaterial({ color: 0x77695a, flatShading: true, shininess: 6 }),
    new THREE.MeshPhongMaterial({ color: 0x93856f, flatShading: true, shininess: 6 })
  ];
  var iceGeo = new THREE.IcosahedronGeometry(1.02, 0);
  var iceMat = new THREE.MeshPhongMaterial({ color: 0x8eeaff, emissive: 0x17698a, emissiveIntensity: 0.65, transparent: true, opacity: 0.58, flatShading: true, shininess: 100, depthWrite: false });

  var rocks = [], rockPool = [], spawnTimer = 0.5;
  var stats = { spawned: 0, alive: 0, crashed: false, destroyed: 0, fired: 0 };
  var crashCause = 'ASTEROID IMPACT';
  // Fragmentos puramente visuales que se desprenden de los asteroides helados. No tienen colisión.
  var iceDebrisCount = 420, iceDebrisPos = new Float32Array(iceDebrisCount * 3), iceDebrisCol = new Float32Array(iceDebrisCount * 3), iceDebrisSlots = [], iceDebrisCursor = 0;
  for (var id = 0; id < iceDebrisCount; id++) {
    iceDebrisPos[id * 3 + 2] = 999;
    iceDebrisCol[id * 3] = 0.48; iceDebrisCol[id * 3 + 1] = 0.9; iceDebrisCol[id * 3 + 2] = 1;
    iceDebrisSlots.push({ life: 0, vel: new THREE.Vector3() });
  }
  var iceDebrisGeo = new THREE.BufferGeometry();
  iceDebrisGeo.setAttribute('position', new THREE.BufferAttribute(iceDebrisPos, 3));
  iceDebrisGeo.setAttribute('color', new THREE.BufferAttribute(iceDebrisCol, 3));
  var iceDebris = new THREE.Points(iceDebrisGeo, new THREE.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false }));
  iceDebris.userData.visualOnly = true;
  scene.add(iceDebris);

  function emitIceChip(rock) {
    var index = iceDebrisCursor++ % iceDebrisCount, slot = iceDebrisSlots[index];
    var direction = rock.userData.vel.clone().normalize();
    var r = rock.scale.x * 0.75;
    iceDebrisGeo.attributes.position.setXYZ(index,
      rock.position.x - direction.x * r + (Math.random() - 0.5) * r,
      rock.position.y - direction.y * r + (Math.random() - 0.5) * r,
      rock.position.z - direction.z * r + (Math.random() - 0.5) * r);
    slot.vel.copy(rock.userData.vel).multiplyScalar(0.2).add(new THREE.Vector3(
      (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 3));
    slot.life = 0.55 + Math.random() * 0.85;
  }

  function updateIceDebris(dt) {
    var a = iceDebrisGeo.attributes.position;
    for (var i = 0; i < iceDebrisCount; i++) {
      var slot = iceDebrisSlots[i];
      if (slot.life <= 0) continue;
      slot.life -= dt;
      if (slot.life <= 0) { a.setZ(i, 999); continue; }
      a.setXYZ(i, a.getX(i) + slot.vel.x * dt, a.getY(i) + slot.vel.y * dt, a.getZ(i) + slot.vel.z * dt);
    }
    a.needsUpdate = true;
  }

  function pickTier() {
    var x = Math.random(), acc = 0;
    for (var i = 0; i < TIERS.length; i++) { acc += TIERS[i].w; if (x < acc) return i; }
    return TIERS.length - 1;
  }

  // px/py/pz opcionales: si se pasan, spawn forzado apuntando a la nave (debug/tests)
  function spawnRock(tier, px, py, pz, vel) {
    var m = rockPool.length ? rockPool.pop()
      : new THREE.Mesh(rockGeos[(Math.random() * rockGeos.length) | 0],
                        rockMats[(Math.random() * 3) | 0]);
    if (!m.userData.ice) {
      var ice = new THREE.Mesh(iceGeo, iceMat);
      ice.scale.set(0.84, 0.84, 0.84);
      m.add(ice);
      m.userData.ice = ice;
    }
    m.visible = true;
    m.userData.ice.visible = Math.random() < 0.62;
    m.userData.iceCd = Math.random() * 0.2;
    m.userData.ice.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    m.scale.setScalar(TIERS[tier].r * (0.85 + Math.random() * 0.3));
    if (px !== undefined) {
      m.position.set(px, py, pz);
    } else {
      // Entradas frontal, laterales y verticales: la amenaza no viene de un único pasillo.
      var lane = (Math.random() * 5) | 0;
      var sx = (Math.random() * 2 - 1) * 18;
      var sy = (Math.random() * 2 - 1) * 10;
      if (lane === 1) sx = -28 - Math.random() * 8;
      if (lane === 2) sx = 28 + Math.random() * 8;
      if (lane === 3) sy = 17 + Math.random() * 7;
      if (lane === 4) sy = -17 - Math.random() * 7;
      m.position.set(sx, sy, -90 - Math.random() * 65);
    }
    m.userData.tier = tier;
    if (vel) {
      m.userData.vel = vel;
    } else {
      var sx = px !== undefined ? ship.position.x : ship.position.x + (Math.random() * 2 - 1) * 6;
      var sy = px !== undefined ? ship.position.y : ship.position.y + (Math.random() * 2 - 1) * 4;
      var v = new THREE.Vector3(sx - m.position.x, sy - m.position.y, -m.position.z).normalize();
      m.userData.vel = v.multiplyScalar(TIERS[tier].s * (0.85 + Math.random() * 0.4) * diff(simTime).speed); // Part 4
    }
    m.userData.spawnSpeed = diff(simTime).speed;
    m.userData.spin = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
      .multiplyScalar(0.5 + Math.random());
    // Cada roca gana velocidad durante su aproximación, no solo al aparecer.
    m.userData.accel = 1;
    m.userData.hr = m.scale.x * 0.85; // radio de colision (indulgente)
    m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    scene.add(m);
    rocks.push(m);
    stats.spawned++;
  }

  function despawnRock(i) {
    var m = rocks[i];
    m.visible = false;
    scene.remove(m);
    rockPool.push(m);
    rocks.splice(i, 1);
  }

  function updateRocks(dt) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      var df = diff(simTime); // Part 4: rampa + variacion
      spawnTimer = Math.max(0.26, df.spawn * (0.72 + Math.random() * 0.42));
      var wave = 1 + Math.floor(Math.min(2, simTime / 55));
      for (var w = 0; w < wave; w++) spawnRock(pickTier());
    }
    for (var i = rocks.length - 1; i >= 0; i--) {
      var m = rocks[i];
      m.userData.accel = Math.min(2.45, m.userData.accel + dt * 0.16);
      var globalSpeed = diff(simTime).speed / m.userData.spawnSpeed;
      m.position.addScaledVector(m.userData.vel, dt * m.userData.accel * globalSpeed * (effects.slow > 0 ? 0.42 : 1));
      m.rotation.x += m.userData.spin.x * dt;
      m.rotation.y += m.userData.spin.y * dt;
      if (m.userData.ice.visible) {
        m.userData.iceCd -= dt;
        if (m.userData.iceCd <= 0) {
          emitIceChip(m);
          m.userData.iceCd = 0.08 + Math.random() * 0.17;
        }
      }
      if (m.position.z > 24) { despawnRock(i); continue; }
      if (state === 'play') {
        var dx = m.position.x - ship.position.x;
        var dy = m.position.y - ship.position.y;
        var dz = m.position.z - ship.position.z;
        var rr = m.userData.hr + 1.0;
        if (dx * dx + dy * dy + dz * dz < rr * rr) {
          if (effects.shield > 0) {
            burst(m.position.x, m.position.y, m.position.z, m.userData.tier);
            despawnRock(i);
          } else {
            crash(m);
          }
        }
      }
    }
    stats.alive = rocks.length;
  }

  // ---- Crash (colision) ----
  function crash(rock, cause) {
    if (state === 'crashed') return;
    crashCause = cause || 'ASTEROID IMPACT';
    state = 'crashed';
    audioEngine.sfx('crash');
    // La música continúa también durante game over; el usuario puede mutearla desde el control MUSIC.
    stats.crashed = true;
    if (rock) rock.visible = false;
    gameOver(); // Part 4: score final + best + [R] reiniciar
  }

  updateCrashed = function (dt) {
    // giro de muerte; los roques siguen inerciales; el fx sigue vivo
    updateEngineTrails(dt * 0.35);
    updateSpaceDust(dt);
    updateFlyby(dt);
    fireBullets(dt);
    shootRocks();
    updateParts(dt);
    ship.rotation.z += dt * 2.6;
    ship.rotation.x += dt * 3.4;
    ship.position.y -= dt * 2.2;
    // El campo sigue vivo tras el crash: asteroides existentes y nuevas oleadas atraviesan la escena.
    updateRocks(dt);
    updateIceDebris(dt);
    camera.rotation.z += dt * 0.35;
  };

  // ---- Update principal ----
  function updatePlay(dt) {
    score += SCORE_RATE * scoreMult * dt; // Part 4: puntos por tiempo
    updateEffects(dt);
    updateShip(dt);
    updateEngineTrails(dt);
    updateSpaceDust(dt);
    updateFlyby(dt);
    var sway = 1 - Math.exp(-7 * dt);
    hudDriftX += (-shipVel.x * 0.42 - hudDriftX) * sway;
    hudDriftY += (shipVel.y * 0.24 - hudDriftY) * sway;
    hud.style.transform = 'translate(' + hudDriftX.toFixed(2) + 'px,' + hudDriftY.toFixed(2) + 'px) rotate(' + (-shipVel.x * 0.08).toFixed(2) + 'deg)';
    updateRocks(dt);
    updateIceDebris(dt);
    updatePowerups(dt);
    fireBullets(dt);
    shootRocks();
    if (state !== 'play') return;
    updateParts(dt);
    // camara 3era persona sigue a la nave con suavizado
    var k = 1 - Math.exp(-5 * dt);
    camera.position.x += (ship.position.x * 0.8 - camera.position.x) * k;
    camera.position.y += (2.6 + ship.position.y * 0.5 - camera.position.y) * k;
    camera.position.z += (8.5 - camera.position.z) * k;
    camera.lookAt(ship.position.x * 0.85, ship.position.y * 0.7 + 0.3, -16);
    updateHud(); // Part 4
  }
  updateFn = updatePlay;

  // ---- Debug extra (tests headless) ----
  window.__game.stats = stats;
  window.__game.rocks = rocks;
  window.__game.keys = keys;
  window.__game.debugCrash = function () { crash(null); };
  // ---------------------------------------------------------------
  // PART 3: disparo (espacio) + romper asteroides (se dividen) + partículas
  // ---------------------------------------------------------------

  // ---- Disparo ----
  var fire = { cooldown: 0.16, cd: 0, speed: 62 }; // Part 6: powerups lo modulan
  var bullets = [], bulletPool = [];
  var bulletGeo = new THREE.BoxGeometry(0.18, 0.18, 1.2);
  var bulletMat = new THREE.MeshBasicMaterial({ color: 0x66e0ff });

  function despawnBullet(i) {
    var b = bullets[i];
    b.visible = false;
    scene.remove(b);
    bulletPool.push(b);
    bullets.splice(i, 1);
  }

  function fireBullets(dt) {
    fire.cd -= dt;
    if (state === 'play' && (keys.Space || (mobile.enabled && simTime < mobile.fireUntil)) && fire.cd <= 0) {
      fire.cd = effects.rapid > 0 ? 0.065 : fire.cooldown;
      var spread = effects.triple > 0 ? [-0.52, 0, 0.52] : [0];
      for (var n = 0; n < spread.length; n++) spawnBullet(spread[n]);
      audioEngine.sfx('laser');
    }
    for (var i = bullets.length - 1; i >= 0; i--) {
      var b2 = bullets[i];
      b2.position.z -= fire.speed * dt;
      if (b2.position.z < -170) despawnBullet(i);
    }
  }

  function spawnBullet(offsetX) {
    stats.fired++;
    var b = bulletPool.length ? bulletPool.pop() : new THREE.Mesh(bulletGeo, bulletMat);
    b.visible = true;
    b.position.set(ship.position.x + offsetX, ship.position.y - 0.1, ship.position.z - 1.9);
    scene.add(b);
    bullets.push(b);
  }

  // ---- Romper: el roque estalla en fragmentos un tier menor ----
  function destroyRock(j) {
    var m = rocks[j];
    var x = m.position.x, y = m.position.y, z = m.position.z;
    var vel = m.userData.vel, tier = m.userData.tier;
    despawnRock(j);
    stats.destroyed++;
    score += TIERS[tier].pts * scoreMult; // Part 4: puntos por roque (segun tier)
    burst(x, y, z, tier);
    audioEngine.sfx('impact');
    if (tier < TIERS.length - 1) {
      for (var k = 0; k < 3; k++) {
        var cv = new THREE.Vector3(
          vel.x * 1.05 + (Math.random() * 2 - 1) * 7,
          vel.y * 1.05 + (Math.random() * 2 - 1) * 7,
          vel.z * 1.05 + (Math.random() * 2 - 1) * 2);
        spawnRock(tier + 1,
          x + (Math.random() * 2 - 1) * 0.7,
          y + (Math.random() * 2 - 1) * 0.7,
          z, cv);
      }
    }
  }

  function shootRocks() {
    for (var i = bullets.length - 1; i >= 0; i--) {
      var b = bullets[i];
      for (var j = rocks.length - 1; j >= 0; j--) {
        var m = rocks[j];
        var dx = b.position.x - m.position.x,
            dy = b.position.y - m.position.y,
            dz = b.position.z - m.position.z;
        var rr = m.userData.hr + 0.35;
        if (dx * dx + dy * dy + dz * dz < rr * rr) {
          despawnBullet(i);
          destroyRock(j);
          break;
        }
      }
    }
  }

  // ---- Partículas de estallido (fragmentos breves) ----
  var parts = [], partPool = [];
  var partGeo = new THREE.TetrahedronGeometry(0.22, 0);
  var partMats = [
    new THREE.MeshBasicMaterial({ color: 0xffa94d }),
    new THREE.MeshBasicMaterial({ color: 0xffe08a }),
    new THREE.MeshBasicMaterial({ color: 0x9fb4d8 })
  ];

  function burst(x, y, z, tier) {
    var n = 7 + tier * 3;
    for (var i = 0; i < n; i++) {
      var m = partPool.length ? partPool.pop()
        : new THREE.Mesh(partGeo, partMats[(Math.random() * partMats.length) | 0]);
      m.visible = true;
      m.position.set(x, y, z);
      m.userData.vel = new THREE.Vector3(
        Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1
      ).normalize().multiplyScalar(5 + Math.random() * 9);
      m.userData.life = 0.5 + Math.random() * 0.5;
      scene.add(m);
      parts.push(m);
    }
  }

  function updateParts(dt) {
    for (var i = parts.length - 1; i >= 0; i--) {
      var m = parts[i];
      m.userData.life -= dt;
      if (m.userData.life <= 0) {
        m.visible = false;
        scene.remove(m);
        partPool.push(m);
        parts.splice(i, 1);
        continue;
      }
      m.position.addScaledVector(m.userData.vel, dt);
      m.scale.setScalar(Math.max(0.05, m.userData.life * 0.9));
      m.rotation.x += dt * 7;
      m.rotation.y += dt * 5;
    }
  }

  // ---- Debug (tests headless) ----
  window.__game.debugSpawn = function (x, y, z, tier) { spawnRock(tier | 0, x, y, z); };
  window.__game.bullets = bullets;
  window.__game.parts = parts;
  window.__game.engineTrails = engineTrails;
  window.__game.spaceDust = spaceDust;
  window.__game.audio = audioEngine;
  window.__game.fire = fire;
  Object.defineProperty(window.__game, 'state', { get: function () { return state; } });

  // ---------------------------------------------------------------
  // PART 5/6: menu + power-ups (escudo, triple, rapid fire, x2)
  // ---------------------------------------------------------------

  var effects = { shield: 0, triple: 0, rapid: 0, score: 0, slow: 0 };
  var powerups = [], powerPool = [], powerTimer = 8;
  var POWERUPS = {
    shield: { color: 0x54dfff, duration: 8, label: 'ESCUDO' },
    triple: { color: 0xffca4d, duration: 10, label: 'TRIPLE' },
    rapid:  { color: 0xff5d8f, duration: 10, label: 'RAPID' },
    score:  { color: 0x8cff75, duration: 10, label: 'x2 SCORE' },
    slow:   { color: 0xb18cff, duration: 8, label: 'TIEMPO LENTO' },
    nova:   { color: 0xffffff, duration: 0, label: 'NOVA' }
  };
  var powerTypes = ['shield', 'triple', 'rapid', 'score', 'slow', 'nova'];
  var shieldBubble = new THREE.Mesh(
    new THREE.SphereGeometry(1.35, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x54dfff, transparent: true, opacity: 0.22, wireframe: true })
  );
  shieldBubble.visible = false;
  ship.add(shieldBubble);

  function makePowerup(type) {
    var p = powerPool.length ? powerPool.pop() : new THREE.Mesh(
      new THREE.OctahedronGeometry(0.72, 0),
      new THREE.MeshPhongMaterial({ color: POWERUPS[type].color, emissive: POWERUPS[type].color, emissiveIntensity: 0.8, flatShading: true })
    );
    p.material.color.setHex(POWERUPS[type].color);
    p.material.emissive.setHex(POWERUPS[type].color);
    p.userData.type = type;
    p.visible = true;
    return p;
  }

  function spawnPowerup(type, x, y, z) {
    type = POWERUPS[type] ? type : powerTypes[(Math.random() * powerTypes.length) | 0];
    var p = makePowerup(type);
    p.position.set(x === undefined ? (Math.random() * 2 - 1) * 16 : x,
                   y === undefined ? (Math.random() * 2 - 1) * 9 : y,
                   z === undefined ? -115 : z);
    p.rotation.set(Math.random() * 6, Math.random() * 6, 0);
    p.userData.vel = new THREE.Vector3((ship.position.x - p.position.x) * 0.025,
                                        (ship.position.y - p.position.y) * 0.025, 13);
    scene.add(p);
    powerups.push(p);
  }

  function despawnPowerup(i) {
    var p = powerups[i];
    p.visible = false;
    scene.remove(p);
    powerPool.push(p);
    powerups.splice(i, 1);
  }

  function collectPowerup(type) {
    audioEngine.sfx('pickup');
    if (type === 'nova') {
      novaBlast();
      return;
    }
    effects[type] = POWERUPS[type].duration;
    scoreMult = effects.score > 0 ? 2 : 1;
  }

  function novaBlast() {
    var gained = 0;
    while (rocks.length) {
      var rock = rocks[rocks.length - 1];
      gained += TIERS[rock.userData.tier].pts;
      burst(rock.position.x, rock.position.y, rock.position.z, rock.userData.tier);
      despawnRock(rocks.length - 1);
      stats.destroyed++;
    }
    score += gained * scoreMult;
  }

  function updatePowerups(dt) {
    powerTimer -= dt;
    if (powerTimer <= 0) {
      powerTimer = 9 + Math.random() * 7;
      spawnPowerup(powerTypes[(Math.random() * powerTypes.length) | 0]);
    }
    for (var i = powerups.length - 1; i >= 0; i--) {
      var p = powerups[i];
      p.position.addScaledVector(p.userData.vel, dt);
      p.rotation.x += dt * 2.5; p.rotation.y += dt * 3.2;
      var dx = p.position.x - ship.position.x, dy = p.position.y - ship.position.y, dz = p.position.z - ship.position.z;
      if (dx * dx + dy * dy + dz * dz < 2.1 * 2.1) {
        collectPowerup(p.userData.type);
        despawnPowerup(i);
      } else if (p.position.z > 24) {
        despawnPowerup(i);
      }
    }
  }

  function updateEffects(dt) {
    for (var k in effects) effects[k] = Math.max(0, effects[k] - dt);
    scoreMult = effects.score > 0 ? 2 : 1;
    shieldBubble.visible = effects.shield > 0;
    if (shieldBubble.visible) {
      var s = 1 + Math.sin(simTime * 7) * 0.08;
      shieldBubble.scale.setScalar(s);
      shieldBubble.rotation.y += dt * 1.5;
    }
  }

  // ---------------------------------------------------------------
  // PART 4: score (tiempo + asteroides rotos) + HUD + dificultad
  //          progresiva + game over (best en localStorage) + R
  // ---------------------------------------------------------------

  var SCORE_RATE = 10;    // puntos por segundo de supervivencia
  var score = 0;          // float interno; se muestra con floor()
  var scoreMult = 1;      // Part 6: powerup x2 lo modifica
  var best = 0;
  try { best = Number(localStorage.getItem('spaceships_best')) || 0; } catch (e) {}

  function saveBest() {
    try { localStorage.setItem('spaceships_best', String(Math.floor(best))); } catch (e) {}
  }

  // HUD: game.js crea el DOM (index/test solo llevan el CSS)
  var hud = document.createElement('div'); hud.id = 'hud';
  var hudScore = document.createElement('div');
  var hudTime = document.createElement('div');
  var hudBest = document.createElement('div');
  var hudEffects = document.createElement('div');
  var hudHazard = document.createElement('div');
  var hudDriftX = 0, hudDriftY = 0;
  hudScore.id = 'score'; hudScore.className = 'big'; hudScore.textContent = '0';
  hudTime.id = 'time'; hudTime.textContent = '0:00';
  hudBest.id = 'best'; hudBest.className = 'dim';
  hudBest.textContent = 'BEST ' + Math.floor(best);
  hudEffects.id = 'effects'; hudEffects.className = 'dim';
  hudHazard.id = 'hazard'; hudHazard.className = 'hazard';
  hud.appendChild(hudScore); hud.appendChild(hudTime); hud.appendChild(hudBest); hud.appendChild(hudEffects); hud.appendChild(hudHazard);
  document.body.appendChild(hud);
  var audioBtn = document.createElement('button');
  audioBtn.id = 'audioToggle';
  audioBtn.type = 'button';
  document.body.appendChild(audioBtn);
  function syncAudioLabel() {
    audioBtn.textContent = audioEngine.active ? (audioEngine.muted ? '♫ UNMUTE' : '♫ MUTE') : '♫ MUSIC';
  }
  audioBtn.addEventListener('click', function () {
    if (!audioEngine.active) audioEngine.start();
    else audioEngine.toggle();
    syncAudioLabel();
  });
  // Un tap inicia la partida en móvil y, durante la partida, dispara una ráfaga corta.
  window.addEventListener('pointerdown', function (e) {
    if (e.target === audioBtn) return;
    if (!audioEngine.active) { audioEngine.start(); syncAudioLabel(); }
    enableMobileTilt();
    if (state === 'menu' || state === 'crashed') {
      startGame();
      return;
    }
    if (state === 'play' && e.pointerType !== 'mouse') mobile.fireUntil = simTime + 0.19;
  });
  syncAudioLabel();

  function fmtTime(t) {
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  var lastScore = -1, lastTime = -1;
  function updateHud() {
    var s = Math.floor(score);
    if (s !== lastScore) { hudScore.textContent = s; lastScore = s; }
    var t = Math.floor(simTime);
    if (t !== lastTime) { hudTime.textContent = fmtTime(t); lastTime = t; }
    var b = 'BEST ' + Math.floor(best);
    if (hudBest.textContent !== b) hudBest.textContent = b;
    var active = [];
    for (var k in effects) if (effects[k] > 0) active.push(POWERUPS[k].label + ' ' + effects[k].toFixed(1) + 's');
    hudEffects.textContent = active.join('  ');
    var hazard = '';
    if (state === 'play' && flyby.visible) {
      var dx = flyby.position.x - ship.position.x, dy = flyby.position.y - ship.position.y, dz = flyby.position.z - ship.position.z;
      var surfaceDistance = Math.sqrt(dx * dx + dy * dy + dz * dz) - flyby.userData.radius;
      if (surfaceDistance < 28) hazard = '⚠ ' + (flyby.userData.isSun ? 'SOLAR' : 'PLANETARY') + ' HAZARD ' + Math.max(0, Math.ceil(surfaceDistance));
    }
    hudHazard.textContent = hazard;
  }

  // Presión sostenida: cada 55 s agrega una roca por oleada; la velocidad sigue subiendo hasta 3 min.
  function diff(t) {
    var d = Math.min(1, t / 180);
    return { spawn: 0.92 - 0.62 * d, speed: 1 + 1.8 * d };
  }

  function playerSpeed(t) {
    return 1 + Math.min(1, t / 180) * 0.75;
  }

  // Game over (lo llama crash())
  function gameOver() {
    var s = Math.floor(score);
    var newBest = s > best;
    if (newBest) { best = s; saveBest(); }
    msg.innerHTML =
      '<div id="crashBox">' +
      '<div class="t1">CRASH</div>' +
      '<div class="t2">' + crashCause + '</div>' +
      '<div class="t3">SCORE ' + s + '<br>BEST ' + Math.floor(best) + (newBest ? '  -  !NUEVO RECORD!' : '') + '</div>' +
      '<div class="t4">[R] para reiniciar</div>' +
      '</div>';
    msg.style.display = 'grid';
  }

  // Reinicio compartido por el menu inicial y la tecla R tras el crash.
  function restart() {
    while (rocks.length) despawnRock(rocks.length - 1);
    while (bullets.length) despawnBullet(bullets.length - 1);
    while (parts.length) {
      var p = parts.pop(); p.visible = false; scene.remove(p); partPool.push(p);
    }
    while (powerups.length) despawnPowerup(powerups.length - 1);
    ship.position.set(0, 0, 0);
    ship.rotation.set(0, 0, 0);
    shipVel.x = 0; shipVel.y = 0;
    hudDriftX = 0; hudDriftY = 0;
    hud.style.transform = '';
    camera.position.set(0, 2.6, 8.5);
    camera.rotation.set(0, 0, 0);
    score = 0; scoreMult = 1; simTime = 0; crashT = 0; crashCause = 'ASTEROID IMPACT';
    hudHazard.textContent = '';
    for (var k in effects) effects[k] = 0;
    shieldBubble.visible = false;
    powerTimer = 8;
    spawnTimer = 0.5; fire.cd = 0; mobile.fireUntil = 0;
    flyby.visible = false; flybyTimer = 12 + Math.random() * 7;
    stats.spawned = 0; stats.alive = 0; stats.destroyed = 0; stats.fired = 0; stats.crashed = false;
    lastScore = -1; lastTime = -1;
    msg.style.display = 'none'; msg.innerHTML = '';
    updateFn = updatePlay;
  }

  function startGame() {
    restart();
    ship.visible = true;
    state = 'play';
    updateHud();
  }

  function showMenu() {
    state = 'menu';
    ship.visible = false;
    // El inicio reutiliza exactamente la composición del game over.
    msg.innerHTML = '<div id="crashBox"><div class="t1">SPACESHIPS</div>' +
      '<div class="t2">ASTEROID ASSAULT</div>' +
      '<div class="t3">WASD / FLECHAS para volar · ESPACIO para disparar<span class="mobile"><br>INCLINA para volar · TOCA para disparar</span></div>' +
      '<div class="t4">[ENTER] para jugar<span class="mobile"> · TOCA para comenzar</span></div></div>';
    msg.style.display = 'grid';
  }

  // Debug (tests headless, Part 4)
  Object.defineProperty(window.__game, 'score', { get: function () { return score; } });
  Object.defineProperty(window.__game, 'best', { get: function () { return best; } });
  window.__game.diff = diff;
  window.__game.playerSpeed = playerSpeed;
  window.__game.debugRestart = restart;
  window.__game.debugStart = startGame;
  window.__game.debugMenu = showMenu;
  window.__game.debugSpawnPowerup = spawnPowerup;
  window.__game.powerups = powerups;
  window.__game.effects = effects;
  window.__game.mobile = mobile;
  window.__game.debugMobileTilt = function (x, y) { mobile.enabled = true; mobile.calibrated = true; mobile.x = clamp(x, -1, 1); mobile.y = clamp(y, -1, 1); };
  window.__game.debugMobileTap = function () { mobile.enabled = true; mobile.fireUntil = simTime + 0.19; };
  window.__game.celestial = flyby;
  window.__game.sunFlare = sunFlare;
  window.__game.iceDebris = iceDebris;
  window.__game.debugFlyby = spawnFlyby;
  showMenu();
  worldReady = true;

})();
