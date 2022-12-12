#!/bin/bash
# build for Production -- script to compile emscripten/C++ sources into WebAssembly
# Copyright (C) 2021-2021 Tactile Interactive, all rights reserved

# I haven't looked at this since early in the project; it's nowhere near production quality

# according to informal benchmarks run June 5, 2021, the C++
# version of RK2 is 5x or 6x faster than the JS version.  ha.
# not even using rk2 anymore

cd `dirname $0`

if [ -z "$qEMSCRIPTEN" ]
then
	echo 'You have to define qEMSCRIPTEN in your login stuff like .profile or .bashrc'
	echo 'for this whole project'
	exit 5
fi


. $qEMSCRIPTEN/emsdk/emsdk_env.sh

# this has all c++ & h files, except main.cpp and the testing files.
# omit those, so testing can also use this and compile & run itself (see testing/cppu*).
allCpp=`cat allCpp.list`

# keep MAX_LABEL_LEN+1 a multiple of 4 or 8 for alignment, eg 7, 15 or 31
MAX_LABEL_LEN=31
MAX_DIMENSIONS=2

cd ..

echo 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁  compile
# https://emscripten.org/docs/tools_reference/emcc.html
emcc -o quantumEngine.js -sLLD_REPORT_UNDEFINED \
	-gsource-map --source-map-base /qEng/ \
	-sASSERTIONS=2 -sSAFE_HEAP=1 -sSTACK_OVERFLOW_CHECK=2 \
	-sDEMANGLE_SUPPORT=1 -sNO_DISABLE_EXCEPTION_CATCHING \
	-sEXPORTED_FUNCTIONS=@building/exports.json \
	-sEXPORTED_RUNTIME_METHODS='["ccall","cwrap","UTF8ArrayToString", "AsciiToString"]' \
	$PROFILING  \
	-DMAX_LABEL_LEN=$MAX_LABEL_LEN -DMAX_DIMENSIONS=$MAX_DIMENSIONS \
	-I$qEMSCRIPTEN/emsdk/upstream/emscripten/cache/sysroot/include \
	-include emscripten.h \
	-ffast-math  -lembind \
	main.cpp $allCpp || exit $?
# changed -g to -g4 to -gsource-map --source-map-base / ; debugger can see into c++

echo 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁  done
#cp quantumEngine.wasm quantumEngine.js quantumEngine.wasm.map ../public

exit 0
