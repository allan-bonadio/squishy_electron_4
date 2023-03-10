# JS directory and workers

## Needed files for running dev and prod:
* quantumEngine.main.js - mostly from raw.wasmworker.js and raw.singlethread.js
* quantumEngine.thread.js - parts from raw.wasmworker.ww.js
* quantumEngine.lib.js

Currently we don't minimize them; they are publicly accessible from website.

## raw files

### most stable, but no workers.  Use for reference.
raw.singlethread.js

### most appropriate, but lame worker support.
raw.wasmworker.js
raw.wasmworker.ww.js

### --proxy-to-worker ONLY compile - lots of GL code, no C++ in main
raw.p2w.js
raw.p2w.worker.js

## associated files
quantumEngine
* build/buildDev, buildProd, exports.json, runMethods.json
* js/*.js
* wasm/*

## upgrades

How to make proper quantumEngine.main.js and .thread.js files:

Must do this after emscripten is revved, or after the build scripts are changed enough to make a difference.

From the quantumEngine directory, hack the buildDev file and run:

- Build withOUT --proxy-to-worker or -sWASM_WORKERS
* mv wasm/quantumEngine.js wasm/raw.single.js

- Build with --proxy-to-worker but not  -sWASM_WORKERS
* mv wasm/quantumEngine.js wasm/raw.p2w.js
* mv wasm/quantumEngine.worker.js wasm/raw.p2w.worker.js

- Build without --proxy-to-worker but with  -sWASM_WORKERS
* mv wasm/quantumEngine.js wasm/raw.wasmworker.js
* mv wasm/quantumEngine.ww.js wasm/raw.wasmworker.ww.js

- Compare them to the same 5 files in js directory
- migrate changes to workers/quantumEngine.main.js, .lib.js, and .thread.js
- then copy the raw files from wasm/ to js/, for next upgrades


## public/qEng

Directory has symlinks into quantumEngine/wasm and /js directories, needed for running.  For production, npm build will convert the symlinks into the targeted files for inclusion.

Also has some symlinks for testing various worker strategies.
