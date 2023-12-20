#!/bin/bash
##
## Build Development -- build script for quantum engine during development
## Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
##

# script to compile emscripten/C++ sources into WebAssembly
cd `dirname $0`
cd ..

# turn this on for profiling help
#PROFILING=--profiling
# also maybe ? --cpuprofiler --memoryprofiler --threadprofiler
# see 80% down in https://emscripten.org/docs/tools_reference/emcc.html
# i think --threadprofiler is only for pthreads

# keep MAX_LABEL_LEN+1 a multiple of 4 or 8 for alignment, eg 7, 15 or 31
export MAX_LABEL_LEN=15



# EMIT_PRODUCERS_SECTION = leave more comments in generated JS
export DEBUG='-g3 -gsource-map --source-map-base /qEng/ -sEMIT_PRODUCERS_SECTION -sDEMANGLE_SUPPORT=1 '
export OPTIMIZE='-O0 '


# the real path to emcc (it's undefined for some reason in this em rev):
#export PATH=$EMSDK/upstream/emscripten:$PATH
# sEXPORTED_FUNCTIONS are my C++ functions.
# sEXPORTED_RUNTIME_METHODS are magical Emscripten functions I can get to appear in my qE files so I can call them
# do the compile command in pieces

# DEBUG='-g3 -gsource-map --source-map-base /qEng/ -sEMIT_PRODUCERS_SECTION'
# OPTIMIZE='-O0 '

# these are now in buildCommon.sh (or just above), not always in same var
# SAFETY="-sASSERTIONS=2 -sSAFE_HEAP=1 -sSTACK_OVERFLOW_CHECK=2  -sLLD_REPORT_UNDEFINED"
# FEATURES="-ffast-math  -lembind -sDEMANGLE_SUPPORT=1 -sNO_DISABLE_EXCEPTION_CATCHING"
# EXPORTS="-sEXPORTED_FUNCTIONS=@building/exports.json -sEXPORTED_RUNTIME_METHODS=@building/runMethods.json"
# DEFINES=" -DqDEV_VERSION -DMAX_LABEL_LEN=$MAX_LABEL_LEN -DMAX_DIMENSIONS=$MAX_DIMENSIONS "
# INCLUDES=" -I$EMSDK/upstream/emscripten/cache/sysroot/include -include emscripten.h -include squish.h "
# MISC="-sENVIRONMENT=web,worker -sFILESYSTEM=0 -sINVOKE_RUN=1 -Wno-limited-postlink-optimizations "

# we want wasm_workers, but it just does't work.  So we use pthreads.
# if you change this, also change index.html to load the file(s) you want
#WORKERS=" -sWASM_WORKERS    --pre-js=js/prejs.js  --post-js=js/postjs.js"
#WORKERS=" --proxy-to-worker  --extern-pre-js=js/prejs.js  --post-js=js/postjs.js"
WORKERS=" -pthread  -sPTHREAD_POOL_SIZE=3 "

# tried to sabotage GL, but didn't seem to make much difference.
# we call gl from JS
DISABLE_GL="-sGL_MAX_TEMP_BUFFER_SIZE=0 -sGL_EMULATE_GLES_VERSION_STRING_FORMAT=0 -sGL_EXTENSIONS_IN_PREFIXED_FORMAT=0 -sGL_SUPPORT_AUTOMATIC_ENABLE_EXTENSIONS=0 -sGL_SUPPORT_SIMPLE_ENABLE_EXTENSIONS=0 -sGL_TRACK_ERRORS=0 -sGL_POOL_TEMP_BUFFERS=0"

# others, see /opt/dvl/emscripten/emsdk/upstream/emscripten/src/settings.js
# --proxy-to-worker   NO!
# √ INVOKE_RUN=0 and IGNORE_MISSING_MAIN avoids main.cpp main()
# MALLOC = "dlmalloc"=good for small allocs; emmalloc=good general,
#		emmalloc-memvalidate=lots of checking
# -sEXCEPTION_DEBUG   Print out exceptions in emscriptened code.
# LIBRARY_DEBUG = Print out when we enter a library call (library*.js)
# also SYSCALL_DEBUG
# already done EXPORT_EXCEPTION_HANDLING_HELPERS
# take a look at var INCOMING_MODULE_JS_API = [...]
# √ EMIT_PRODUCERS_SECTION = leave more comments in generated JS
# -sSHARED_MEMORY should be on?  no, somehow the Memory class object qualifies as SharedMemory
# -sALLOW_BLOCKING_ON_MAIN_THREAD should be on?
# -sFETCH_SUPPORT_INDEXEDDB should be zero

# -sSUPPORT_LONGJMP=0
# LOAD_SOURCE_MAP=1
# WASM2C_SANDBOXING = 'none';

# -sRUNTIME_DEBUG = add tracing to core runtime functions
# turn this off: -sNO_DISABLE_EXCEPTION_CATCHING


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

ls -l@ wasm

exit 0


# some of the debug options in buildDev are explained here:
# https://emscripten.org/docs/porting/Debugging.html?highlight=assertions#compiler-settings
# and that page in general has a lot of stuff

# in order for this to work I have to mess with the wasm mem blob
# 	-s WASM_ASYNC_COMPILATION=0 \

