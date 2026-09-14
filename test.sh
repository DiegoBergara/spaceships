#!/bin/bash
# Test progresivo: sintaxis + probe readPixels (WebGL headless) + screenshot informativo
set -e
DIR="$HOME/spaceships"
cd "$DIR"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

echo "== node --check game.js =="
node --check game.js && echo "OK sintaxis"

echo "== probe headless (readPixels en el mismo task) =="
PROBE=$("$CHROME" --headless --disable-background-networking \
  --window-size=960,600 --hide-scrollbars \
  --use-angle=swiftshader \
  --virtual-time-budget=10000 \
  --dump-dom "file://$DIR/test.html" 2>/dev/null \
  | tr -d '\n' | grep -o '<pre id="dbg">.*</pre>' | sed 's/<[^>]*>//g' | tr ' ' '\n' | grep -v '^$')
printf '%s\n' "$PROBE"
if printf '%s\n' "$PROBE" | grep -q 'FAIL'; then
  echo "FAIL: una asercion del probe no paso" >&2
  exit 1
fi
printf '%s\n' "$PROBE" | grep -q 'PASS'

echo "== screenshot (informativo: SwiftShader a veces deja la capa en negro) =="
"$CHROME" --headless --disable-background-networking \
  --window-size=960,600 --hide-scrollbars \
  --use-angle=swiftshader \
  --virtual-time-budget=60000 \
  --screenshot="$DIR/shot.png" \
  "file://$DIR/index.html" 2>/dev/null || true
node "$DIR/pngstats.js" "$DIR/shot.png" 2>/dev/null || echo "(sin stats de screenshot)"
