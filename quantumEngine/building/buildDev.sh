#!/bin/bash
##
## Build Development -- build script for quantum engine during development
## Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
##

# script to compile emscripten/C++ sources into WebAssembly
cd `dirname $0`
cd ..

# turn this on for profiling help
#PROFILING=--profiling
# also maybe ? --cpuprofiler --memoryprofiler --threadprofiler
# see 80% down in https://emscripten.org/docs/tools_reference/emcc.html
# i think --threadprofiler is only for pthreads

# TODO: get rid of this build difiference betw prod & dev; it's for debugging anyway.  15.
# keep MAX_LABEL_LEN+1 a multiple of 4 or 8 for alignment, eg 7, 15 or 31
export MAX_LABEL_LEN=15



# -sEMIT_PRODUCERS_SECTION = put info on which compiler/linker/language was
# built.  Mostly irrelevant.  add it here if you want.
export DEBUG='-g3 -gsource-map --source-map-base /qEng/ '
export OPTIMIZE='-O0 '

# add -sPTHREADS_DEBUG for blow by blow tracing of quantumEngine.js i think
# annoying otherwise

# values: dlmalloc=good for many small allocs & internal checks
# emmalloc-memvalidate - use emmalloc with assertions+heap consistency checking
# emmalloc - a simple and compact
# see more https://emscripten.org/docs/tools_reference/settings_reference.html?highlight=pthread#malloc
export MALLOC=emmalloc-memvalidate

# the real path to emcc (it's undefined for some reason in this em rev):
#export PATH=$EMSDK/upstream/emscripten:$PATH
# sEXPORTED_FUNCTIONS are my C++ functions.
# sEXPORTED_RUNTIME_METHODS are magical Emscripten functions I can get to appear in my qE files so I can call them
# do the compile command in pieces

# OPTIMIZE='-O0 '

# others, see /opt/dvl/emscripten/emsdk/upstream/emscripten/src/settings.js
# --proxy-to-worker   NO!
# √ INVOKE_RUN=0 and IGNORE_MISSING_MAIN avoids main.cpp main()
# MALLOC = "dlmalloc"=good for small allocs; emmalloc=good general,
#		emmalloc-memvalidate=lots of checking
# LIBRARY_DEBUG = Print out when we enter a library call (library*.js)
# -sSYSCALL_DEBUG to log system calls

# echo ℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏ compile
# # https://emscripten.org/docs/tools_reference/emcc.html
# set -x
# emcc -o wasm/quantumEngine.js \
# 	$DEBUG $OPTIMIZE $SAFETY $FEATURES $PROFILING  \
# 	$EXPORTS $DEFINES  $INCLUDES $WORKERS $MISC $DISABLE_GL \
# 	main.cpp $allCpp || exit $?
# set +x

echo ℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏ compile
building/buildCommon.sh || exit 93
echo ℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏ done

exit 0


