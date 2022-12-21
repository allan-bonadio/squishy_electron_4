#!/bin/bash
# build for Production -- script to compile emscripten/C++ sources into WebAssembly
# Copyright (C) 2023-2021 Tactile Interactive, all rights reserved

CHECK_EMCC_CMD=--check


cd `dirname $0`
cd ..

if [ -z "$qEMSCRIPTEN" ]
then
	echo 'You have to define qEMSCRIPTEN and SSQUISH_ROOT in your '
	echo 'login stuff like .profile (or .bashrc) for this whole project'
	exit 55
fi

. $qEMSCRIPTEN/emsdk/emsdk_env.sh

# this has all c++ & h files, except main.cpp and the testing files.
# omit those, so testing can also use this and compile & run itself (see testing/cppu*).
allCpp=`cat building/allCpp.list`

# keep MAX_LABEL_LEN+1 a multiple of 4 or 8 for alignment, eg 7, 15 or 31
MAX_LABEL_LEN=31
MAX_DIMENSIONS=2


echo 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁  compile
# https://emscripten.org/docs/tools_reference/emcc.html
# https://emscripten.org/docs/optimizing/Optimizing-Code.html
emcc -o quantumEngine.js -sLLD_REPORT_UNDEFINED \
	-O3 -flto --closure 2 \
	-sASSERTIONS=2 -sSAFE_HEAP=1 -sSTACK_OVERFLOW_CHECK=2 \
	-sDEMANGLE_SUPPORT=1 -sNO_DISABLE_EXCEPTION_CATCHING \
	-sEXPORTED_FUNCTIONS=@building/exports.json \
	-sEXPORTED_RUNTIME_METHODS='["ccall","cwrap","UTF8ArrayToString","AsciiToString"]' \
	$PROFILING $CHECK_EMCC_CMD \
	-DMAX_LABEL_LEN=$MAX_LABEL_LEN -DMAX_DIMENSIONS=$MAX_DIMENSIONS \
	-I$qEMSCRIPTEN/emsdk/upstream/emscripten/cache/sysroot/include \
	-include emscripten.h \
	-ffast-math  -lembind \
	main.cpp $allCpp || exit $?
# changed -g to -g4 to -gsource-map --source-map-base / ; debugger can see into c++

echo 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁  done

exit 0

# see also buildDev.sh; these files are analogous.  Also look in testing dir.
# and more notes at the bottom
# -O3 to NOT do size optimizations at the expense of speed optimizations
# "Emscripten-compiled code can currently achieve approximately half the speed
# of a native build."
