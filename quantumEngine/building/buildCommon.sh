#!/bin/bash
##
## Build Common code for Development & Production quantum engine
## Copyright (C) 2023-2024 Tactile Interactive, all rights reserved
##

# script to compile emscripten/C++ sources into WebAssembly

cd `dirname $0`
cd ..

if [ -z "$EMSDK" -o -z "$SQUISH_ROOT" ]
then
	echo 'You have to define EMSDK and SQUISH_ROOT in your '
	echo 'login stuff like .profile (or .bashrc) for this whole project'
	echo 'insert these lines like this (for bash): '
	echo '   export EMSDK=/opt/dvl/emscripten/emsdk'
	echo '   export SQUISH_ROOT=/opt/dvl/squishyElectron/squishy_electron_4'
	echo 'or wherever you downloaded them to.  note no slashes on the ends.'
	exit 55
fi

# MAX_DIMENSIONS might stay at 2 forever although I'm optimistic
MAX_DIMENSIONS=2
# add any other config variables that need to be handed into the C++ and JS

# sEXPORTED_FUNCTIONS are my C++ functions. sEXPORTED_RUNTIME_METHODS are
# magical Emscripten functions I can get to appear in my qE files so I can call
# them. Do the compile command in pieces - so many params

export EMSDK_QUIET=1
. $EMSDK/emsdk_env.sh


# same for production/dev
SAFETY="-sASSERTIONS=2 -sSAFE_HEAP=1 -sSTACK_OVERFLOW_CHECK=2  -sLLD_REPORT_UNDEFINED"

# This sabotages exception throwing in C++
D_E_C="-sNO_DISABLE_EXCEPTION_CATCHING"
#D_E_C="-sDISABLE_EXCEPTION_CATCHING"

FEATURES="-ffast-math  -lembind  $D_E_C"

EXPORTS="-sEXPORTED_FUNCTIONS=@building/exports.json -sEXPORTED_RUNTIME_METHODS=@building/runMethods.json"
DEFINES=" -DqDEV_VERSION -DMAX_LABEL_LEN=$MAX_LABEL_LEN -DMAX_DIMENSIONS=$MAX_DIMENSIONS "
INCLUDES=" -I$EMSDK/upstream/emscripten/cache/sysroot/include -include emscripten.h -include squish.h "

# INVOKE_RUN=0 and IGNORE_MISSING_MAIN avoids main.cpp main()
MISC="-sFILESYSTEM=0 -sINVOKE_RUN=1 -Wno-limited-postlink-optimizations "


# N_THREADS can be small integer 1 or above.  That's workers, the js event loop isn't counted.
# Ends up being a global in C++ and in JS
N_THREADS=1

# we want wasm_workers, but for now, all we can use is pthreads and all its enormous overhead.
# --proxy-to-worker   NO!
export WORKERS=" -pthread   -sENVIRONMENT=web,worker -sPTHREAD_POOL_SIZE=$N_THREADS  -DN_THREADS=$N_THREADS "



# tried to omit GL stuff, but didn't seem to make much difference.
# Gotta get rid of gobs of unneeded code.
DISABLE_GL="-sGL_MAX_TEMP_BUFFER_SIZE=0 -sGL_EMULATE_GLES_VERSION_STRING_FORMAT=0 -sGL_EXTENSIONS_IN_PREFIXED_FORMAT=0 -sGL_SUPPORT_AUTOMATIC_ENABLE_EXTENSIONS=0 -sGL_SUPPORT_SIMPLE_ENABLE_EXTENSIONS=0 -sGL_TRACK_ERRORS=0 -sGL_POOL_TEMP_BUFFERS=0 -sOFFSCREENCANVAS_SUPPORT=0 -sOFFSCREENCANVASES_TO_PTHREAD='' -sOFFSCREEN_FRAMEBUFFER=0 -sGL_ASSERTIONS=0 -sGL_DEBUG=0 -sGL_TESTING=0 -sTRACE_WEBGL_CALLS=0 -sFULL_ES2=0 -sGL_SUPPORT_EXPLICIT_SWAP_CONTROL=0 -sGL_WORKAROUND_SAFARI_GETCONTEXT_BUG=0"

DISABLE_FS="-sFILESYSTEM=0 -sFETCH_SUPPORT_INDEXEDDB=0  "

# most c++ files, except main.cpp, testing files, worker files.
# omit those, so testing can also use this and compile & run itself (see testing/cppu*).
allCpp=`cat building/allCpp.list`

rm -rf wasm/*

# show optios while compiling and linking
set -x
$EMSDK/upstream/emscripten/emcc -o wasm/quantumEngine.js \
	$DEBUG $OPTIMIZE  $SAFETY  $FEATURES  $PROFILING  \
	$EXPORTS  $DEFINES   $INCLUDES  $WORKERS  \
	$MISC  \
	$DISABLE_GL $DISABLE_FS \
	main.cpp $allCpp || exit $?
set +x

ls -lt wasm

# -ffast-math: lets the compiler make aggressive, potentially-lossy assumptions
# about floating-point math.  probably good to have.
# https://clang.llvm.org/docs/UsersManual.html#controlling-floating-point-behavior

# some of the debug options here and in buildDev are explained here:
# https://emscripten.org/docs/porting/Debugging.html?highlight=assertions#compiler-settings
# and that page in general has a lot of stuff

# Hey!  Should try out the sanitizers for more debug checks!
# tried this in testing but I got all these alignment problems (or maybe just messages)
# -fsanitize=undefined  \

# we're not done yet!  Make the JS files better.
#cat js/pre-js.js wasm/quantumEngine.js js/post-js.js > wasm/quantumEngine.main.js
#echo "window.N_THREADS = $N_THREADS" > wasm/quantumEngine.thread.js
#cat js/pre-thread.js wasm/quantumEngine.worker.js js/post-thread.js >> wasm/quantumEngine.thread.js

# compiler hints and links:
# https://emscripten.org/docs/tools_reference/emcc.html
# https://emscripten.org/docs/compiling/Building-Projects.html
# other options, see /opt/dvl/emscripten/emsdk/upstream/emscripten/src/settings.js
# should put in MALLOC="dlmalloc"=good for small allocs; emmalloc=good general,
#		emmalloc-memvalidate=lots of checking
# already implied EXPORT_EXCEPTION_HANDLING_HELPERS
# take a look at var INCOMING_MODULE_JS_API=[...]
# -sSHARED_MEMORY already implied
# -sALLOW_BLOCKING_ON_MAIN_THREAD never never

# do I need this?
# -mnontrapping-fptoint
# see https://emscripten.org/docs/compiling/WebAssembly.html#trapping
# more speed, less safety, for float->int operations

