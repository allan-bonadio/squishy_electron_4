#!/bin/bash

echo "🎁 🔨 Clean and Build Production Squishy Electron"  `date +%c`
cd $SQUISH_ROOT
#cd `dirname $0`
#cd ..

# must create the C++ wasm binary first

echo "🎁 🔨  starting initial clean"
cd quantumEngine
make clean
rm -rf build build.zip
cd $SQUISH_ROOT
echo "🎁 🔨  initial clean Completed"

echo "🎁 🔨  starting Emscripten Build"
$SQUISH_ROOT/quantumEngine/building/genExports.js || exit 35

# which one to use - should use prod but...
#quantumEngine/building/buildDev.sh || exit 11
quantumEngine/building/buildProd.sh || exit 11
echo "🎁 🔨  Emscripten Build Completed"



echo "🎁 🔨  starting NPM Build"
react-scripts build || exit 37
echo
echo "🎁 🔨  NPM Build Completed - here is all files:"


echo "🎁 🔨  starting final cleanup"
# move these out of the way so they don't get confused with dev versions
# but don't delete them in case I have to examine them later
cd quantumEngine
mv quantumEngine.js quantumEngine.wasm quantumEngine.wasm.map /tmp
cd $SQUISH_ROOT
echo "🎁 🔨  final cleanup Completed, here's all the files:"

ls -lR build


echo "🎁 🔨  Build Completed"  `date +%c`
