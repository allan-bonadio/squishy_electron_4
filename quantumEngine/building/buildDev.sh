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

# -sEXCEPTION_DEBUG   Print out exceptions in emscriptened code.
# LIBRARY_DEBUG = Print out when we enter a library call (library*.js)
# also SYSCALL_DEBUG

# LOAD_SOURCE_MAP=1
# WASM2C_SANDBOXING = 'none';

# -sRUNTIME_DEBUG = add tracing to core runtime functions
# turn this off: -sNO_DISABLE_EXCEPTION_CATCHING


echo ℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏ compile
building/buildCommon.sh || exit 93
echo ℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏℏ done

ls -l@ quantumEngine/wasm

exit 0


# some of the debug options in buildDev are explained here:
# https://emscripten.org/docs/porting/Debugging.html?highlight=assertions#compiler-settings
# and that page in general has a lot of stuff

# in order for this to work I have to mess with the wasm mem blob
# 	-s WASM_ASYNC_COMPILATION=0 \

