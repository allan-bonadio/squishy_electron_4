#!/bin/bash

echo "🎁 🔨 Build Production Squishy Electron"  `date +%c`
cd `dirname $0`
cd ..

# must create the C++ wasm binary first
quantumEngine/building/buildProd.sh || exit 11
echo "🎁 🔨  Emscripten Build Completed"

# normal CRA build command
react-scripts build
echo
echo "🎁 🔨  NPM Build Completed"
ls -lR build


# now what...


echo "🎁 🔨  Build Completed"  `date +%c`
