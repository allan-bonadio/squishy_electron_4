#!/bin/bash

# set this to non-empty to generate the Dev wasm files instead of Prod; better for debugging
buildWithDev=yes
cd $SQUISH_ROOT

# make sure there's no traces left on
maint/scanForTraces.sh || exit $?

echo "🎁 🔨 Clean and Build Production Squishy Electron"  `date +%c`
echo you can do either make build or npm build, same

# must create the C++ wasm binary first

echo "🎁 🔨  starting initial clean"
cd quantumEngine
make clean
cd ..
rm -rf build build.zip
cd $SQUISH_ROOT
echo "🎁 🔨  initial clean Completed"

echo "🎁 🔨  starting Emscripten Build"
$SQUISH_ROOT/quantumEngine/building/genExports.js || exit 35

# which one to use - should use prod but...
if [ -n "$buildWithDev" ]
then
	quantumEngine/building/buildDev.sh || exit 11
else
	quantumEngine/building/buildProd.sh || exit 11
fi
echo "🎁 🔨  Emscripten Build Completed"



echo "🎁 🔨  starting NPM Build"
if [ -z "$buildWithDev" ]
then
	# complains if any symlink points to a nonexistent file.  sigh.
	mv public/qEng/quantumEngine.wasm.map /tmp
	craco build || exit 37
	mv /tmp/quantumEngine.wasm.map public/qEng/
else
	node_modules/.bin/react-scripts build || exit 39
fi
echo
echo "🎁 🔨  NPM Build Completed"


echo "🎁 🔨  starting Docs build"
docGen/compileDocs --batch
echo
echo "🎁 🔨  Docs Build Completed"


echo "🎁 🔨  starting final cleanup"
# move these out of the way so they don't get confused with dev versions
# but don't delete them in case I have to examine them later
cd quantumEngine/wasm
if [ -n "$buildWithDev" ]
then mv -f quantumEngine.js quantumEngine.wasm quantumEngine.wasm.map /tmp
else mv -f quantumEngine.js quantumEngine.wasm /tmp
fi
cd $SQUISH_ROOT
echo "🎁 🔨  final cleanup Completed, here's all the files:"
ls -lR build


echo "🎁 🔨  Build Completed"  `date +%c`
