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



echo "🎁 🔨  starting Docs build"
docGen/compileDocs.js --batch || exit 45
echo
echo "🎁 🔨  Docs Build Completed"


echo "🎁 🔨  starting Final Complete NPM Build"
if [ -z "$buildWithDev" ]
then
	echo build real production

	# complains if any symlink points to a nonexistent file.  sigh.
	# just move the symlink
	mv public/qEng/quantumEngine.wasm.map /tmp
	npx craco build || exit 39
	mv /tmp/quantumEngine.wasm.map public/qEng/
else
	echo build production with debugging C++

	export SQUISH_PROD_DEBUG=1
	# npx react-scripts build || exit 47
	npx craco build || exit 49
	echo did craco build
fi
echo
echo "🎁 🔨  NPM Build Completed"


echo "🎁 🔨  starting final cleanup"
# move these out of the way so they don't get confused with dev versions
# but don't delete them in case I have to examine them later
mv -fv quantumEngine/wasm/* /tmp

echo "🎁 🔨  final cleanup Completed, here's all the files:"
ls -lR build


echo "🎁 🔨  Build Completed"  `date +%c`
