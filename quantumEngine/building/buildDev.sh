#!/bin/bash
##
## Makefile -- makefile for quantum engine, for compiling the C++
## Copyright (C) 2021-2022 Tactile Interactive, all rights reserved
##


# build for development -- script to compile emscripten/C++ sources into WebAssembly
# Copyright (C) 2021-2023 Tactile Interactive, all rights reserved

# turn this on for profiling help
#PROFILING=--profiling
# also maybe ? --cpuprofiler --memoryprofiler --threadprofiler
# see 80% down in https://emscripten.org/docs/tools_reference/emcc.html
# i think --threadprofiler is only for pthreads


cd `dirname $0`
cd ..

if [ -z "$qEMSCRIPTEN" ]
then
	echo 'You have to define qEMSCRIPTEN and SQUISH_ROOT in your '
	echo 'login stuff like .profile (or .bashrc) for this whole project'
	exit 55
fi

export EMSDK_QUIET=1
. $qEMSCRIPTEN/emsdk/emsdk_env.sh

# this lists all c++ files, except main.cpp and the testing files.
# omit those, so testing can also use this and compile & run itself (see testing/cppu*).
allCpp=`cat building/allCpp.list`

# keep MAX_LABEL_LEN+1 a multiple of 4 or 8 for alignment, eg 7, 15 or 32
MAX_LABEL_LEN=15
MAX_DIMENSIONS=2


echo ℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏ compile
# https://emscripten.org/docs/tools_reference/emcc.html
emcc -o wasm/quantumEngine.js -sLLD_REPORT_UNDEFINED \
	-gsource-map --source-map-base /qEng/ \
	-sASSERTIONS=2 -sSAFE_HEAP=1 -sSTACK_OVERFLOW_CHECK=2 \
	-sDEMANGLE_SUPPORT=1 -sNO_DISABLE_EXCEPTION_CATCHING \
	-sEXPORTED_FUNCTIONS=@building/exports.json \
	-sEXPORTED_RUNTIME_METHODS='["ccall","cwrap","UTF8ArrayToString","AsciiToString"]' \
	$PROFILING  \
	-DqDEV_VERSION -DMAX_LABEL_LEN=$MAX_LABEL_LEN -DMAX_DIMENSIONS=$MAX_DIMENSIONS \
	-I$qEMSCRIPTEN/emsdk/upstream/emscripten/cache/sysroot/include \
	-include emscripten.h -include squish.h \
	-ffast-math  -lembind \
	main.cpp $allCpp || exit $?
# changed -g to -g4 to -gsource-map --source-map-base / ; debugger can see into c++

echo ℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏ done

exit 0

# compiler hints and links:
# https://emscripten.org/docs/tools_reference/emcc.html
# https://emscripten.org/docs/compiling/Building-Projects.html

# -ffast-math: lets the compiler make aggressive, potentially-lossy assumptions about floating-point math
# https://clang.llvm.org/docs/UsersManual.html#controlling-floating-point-behavior

# pthreads:
#  -s USE_PTHREADS=navigator.hardwareConcurrency
# https://emscripten.org/docs/porting/asyncify.html
# NO!  use webworkers.

# I think I really need this:
# -mnontrapping-fptoint
# see https://emscripten.org/docs/compiling/WebAssembly.html#trapping
# more speed, less safety, for float->int operations

# poorly documented options:
# -s WASM=0 or NO_WASM will switch over to asm.js, which is slower
# but -s WASM=1 is the default.

# some of the debug options in buildDev are explained here:
# https://emscripten.org/docs/porting/Debugging.html?highlight=assertions#compiler-settings
# and that page in general has a lot of stuff

# getting closer to production:
# https://emscripten.org/docs/compiling/Deploying-Pages.html

# in order for this to work I have to mess with the wasm mem blob
# 	-s WASM_ASYNC_COMPILATION=0 \

#aug '21:
# EXCEPTION_CATCHING_ALLOWED and NO_DISABLE_EXCEPTION_CATCHING can apparently
# allow exception catching but there's overhead each throw.
# in the short term i'm using -fexceptions
# maybe i should turn this off?  exceptions are caught in JS anyway.
# search for 'try {' in quantumEngine.js for more clues

# Hey!  Should try out the sanitizers for more debug checks!
# tried this in testing but I got all these alignment problems (or maybe just messages)
# -fsanitize=undefined  \
