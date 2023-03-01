#!/bin/bash

########################################################
# cppu Unit Test Runner -- for Squishy Electron
# Copyright (C) 2022-2023 Tactile Interactive, all rights reserved

# To run all the tests, run it like this:
#    quantumEngine> make test
# or
#    quantumEngine> testing/cppuRunner.sh
#
# To run under debugger:
#    quantumEngine> testing/cppuRunner.sh db
# or
#    quantumEngine> testing/cppuRunner.sh db foo bar
#
# To run all tests whose Names include the string 'foo' and those including 'bar':
#    quantumEngine> testing/cppuRunner.sh foo bar
#
# To run all tests under Group(s), use this:
#    quantumEngine> testing/cppuRunner.sh -g foo -g bar
#
# to use any other cppuTest switches, do it like this
#    quantumEngine> testing/cppuRunner.sh -sn foo -xg bar
# see other switches https://cpputest.github.io/manual.html#command-line-switches
#

# emrun is another option for testing:
# https://emscripten.org/docs/compiling/Running-html-files-with-emrun.html

# this runs from the main quantumEngine directory
cd `dirname $0`
cd ..

echo "CppUTest Test runner args: db=debugger; all others are assumed to be test name segments"
echo "Use -g groupname to test a whole group"

# https://cpputest.github.io
export CPPUTEST_HOME=/opt/dvl/cpputest/cpputest-3.8

# no enscriptm here!  just native C++.
#. $EMSDK/emsdk_env.sh

# create a space-sep list of ALL the runtime cpp files (almost all)
allCpp=`cat building/allCpp.list`

# keep (MAX_LABEL_LEN+1) a multiple of 4, 8, 16, 32 or 8 for alignment, eg 7, 15 or 31
MAX_LABEL_LEN=7
MAX_DIMENSIONS=2


# mildly analogous to emcc builds in buildDev.sh and buildProd.sh
# note that main.cpp is NOT included in the .cpp files; that's for web use only
# and makes all the diff.  cppuMain.cpp is the main instead.
# Update list of test srcs as needed.
# some of these options - dunno if I need them
# I tried the clang compiler, what emscripten uses;couldn't get it to link.
# even tried Xcode.  That was a worse disaster.  Stick with GNU.
set -x
#clang -o cppuTestBin -Wno-tautological-undefined-compare  \
g++ -o wasm/cppuTestBin -Wno-tautological-undefined-compare  \
	-g -O0 \
	-std=c++11 -fexceptions  \
	-DqDEV_VERSION -DMAX_LABEL_LEN=$MAX_LABEL_LEN -DMAX_DIMENSIONS=$MAX_DIMENSIONS \
	-I$CPPUTEST_HOME/include \
	-include $CPPUTEST_HOME/include/CppUTest/MemoryLeakDetectorNewMacros.h \
	-L$CPPUTEST_HOME/lib -lCppUTest -lCppUTestExt \
	-include squish.h schrodinger/abacus.cpp \
	testing/cppuMain.cpp testing/testingHelpers.cpp */*.spec.cpp \
	$allCpp \
	|| exit $?
set +x

echo ====================== done compiling... start testing ==================================
echo

debug=false
mode=-n
while [ "$1" ]
do
	case $1 in
	db)
		debug=true
		;;

	-*) # anything starting with a hyphen will be passed through and -n will be inhibited for one arg
		moreArgs="$moreArgs $1"
		mode=''
		;;

	*)
		moreArgs="$moreArgs $mode $1"
		mode=-n;;
	esac
	shift
done

if $debug
then
	echo "gonna run: cppuTestBin -v -c $moreArgs"
	echo "Really this should be a relative path!!"
	# it's a real C++ program and I can use gdb!
	#  well, lldb at least.
	lldb  -f $SQUISH_ROOT/quantumEngine/wasm/cppuTestBin -- -v -c $moreArgs
else
	wasm/cppuTestBin -v -c  $moreArgs
fi


# see https://emscripten.org/docs/compiling/Running-html-files-with-emrun.html
# to test under more-real browser conditions
# also you can test under Node.js
