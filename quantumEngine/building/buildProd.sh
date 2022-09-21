#!/bin/bash
# build for Production -- script to compile emscripten/C++ sources into WebAssembly
# Copyright (C) 2021-2021 Tactile Interactive, all rights reserved

# I haven't looked at this since early in the project; it's nowhere near production quality

# according to informal benchmarks run June 5, 2021, the C++
# version of RK2 is 5x or 6x faster than the JS version.  ha.

cd `dirname $0`

. $qEMSCRIPTEN/emsdk-main/emsdk_env.sh
# also try emsdk without the -main or make a symlink

allCpp=`cat allCpp.list`

cd ..

# see also comments at the end of buildDev.sh
emcc -o quantumEngine.js -sLLD_REPORT_UNDEFINED \
	-O3 -s ASSERTIONS=0 \
	-s EXPORTED_FUNCTIONS=@building/exports.json \
	-s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
	main.cpp $allCpp

cp quantumEngine.wasm quantumEngine.js ../public

