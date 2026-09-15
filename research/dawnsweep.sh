#!/bin/bash
cd /tmp/now2
for m in "$@"; do TONIGHT=$m node runN.js 4 '{"dawn":"duel"}' "dawn/duel t$m" > dawn_duel_t$m.sw 2>/dev/null & TONIGHT=$m node runN.js 4 '{}' "plain t$m" > plain_t$m.sw 2>/dev/null & wait; done
