#!/bin/bash

# this is 'npm run build'
# Start with this script to make a new version for the server,
# or just a prod version on this local machine.

# set this to non-empty to generate the wasm files for Dev instead of Prod; better for debugging but inapproppriate for production
buildWithDev=yes

# turn this off to get rid of listing at end
dirListBuild=true
cd $SQUISH_ROOT

# To start this prod build , you can do either "make build" or "npm run build", same

# make sure there's no traces left on
maint/scanForTraces.py || exit $?
#maint/scanForTraces.sh || exit $?

# remove these debugging symlinks
maint/cppSymlinks.py -

echo "                                     🎁  🧽 begin  Clean and Build Production Squishy Electron"  `date +%c`

# must create the C++ wasm binary first

echo "                                     🎁  🍊  starting initial  C++ clean"
cd quantumEngine
make clean
cd ..
rm -rf build build.zip
cd $SQUISH_ROOT
echo "                                     🎁  🍊  initial C++ clean Completed"

echo "                                     🎁  🍊  genExports "
$SQUISH_ROOT/quantumEngine/building/genExports.js || exit 35

echo "                                     🎁  🍊  Emscripten Build"
# which one to use - should use prod but...
if [ -n "$buildWithDev" ]
then
	quantumEngine/building/buildDev.sh || exit 11
else
	quantumEngine/building/buildProd.sh || exit 11
fi
echo "                                     🎁  🍊  Emscripten Build Completed"



echo "                                     🎁  📄    starting Docs build"
xattr -cr docGen
rm -rf public/doc
docGen/compileDocs.js --batch || exit 45
xattr -rc public/doc
echo
echo "                                     🎁  📄  Docs Build Completed"


echo "                                     🎁  🦜 starting minified JS/CSS Build"

# complains if any symlink points to a nonexistent file.  sigh.
# just move the symlink
#mv public/qEng/quantumEngine.wasm.map /tmp

if [ -z "$buildWithDev" ]
then
	echo "                                     🎁  🦜 building production site as normal production"
	npx craco build || exit 39
else
	echo "                                     🎁  🦜 building production site with C++ debugging"
	export SQUISH_PROD_DEBUG=1
	npx craco build || exit 49
	echo did craco build
fi

#mv /tmp/quantumEngine.wasm.map public/qEng/
echo
echo "                                     🎁  🦜  NPM Build Completed"


echo "                                     🎁  🧽  starting final cleanup"
# move these out of the way so they don't get confused with dev versions
# but don't delete them in case I have to examine them later
echo "                                     🎁  🧽  Moving production binaries to /tmp in case needed for post mortem"
mv -fv quantumEngine/wasm/* /tmp

if $dirListBuild
then
	echo "                                     🎁  🧽  final cleanup Completed, here's all the files:"
	ls -lR build
fi




echo "                                     🎁  ✅  Build Completed"  `date +%c`
echo "                                     🎁  ✅  Next Step is to run deploy.sh:   maint/deploy.sh"

