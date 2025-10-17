#!/bin/bash
##
## Build Production -- build script for quantum engine Production production
## Copyright (C) 2022-2025 Tactile Interactive, all rights reserved
##

# script to compile emscripten/C++ sources into WebAssembly
cd `dirname $0`
cd ..

# in the short term, keep some tracing stuff in; we'll be debugging the production version!
export DEBUG='-gsource-map --source-map-base /qEng/  -DsqDEVEL=0'
export OPTIMIZE='-O3 -flto --closure 1 '

# see in dev version
export MALLOC=emmalloc


echo 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁  compile
building/buildCommon.sh || exit 91
echo 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁 🎁  done

exit 0


# getting closer to production:
# https://emscripten.org/docs/compiling/Deploying-Pages.html

# see also buildDev.sh; these files are analogous.  Also look in testing dir.
# and more notes at the bottom
# -O3 to NOT do size optimizations at the expense of speed optimizations
# "Emscripten-compiled code can currently achieve approximately half the speed
# of a native build."
