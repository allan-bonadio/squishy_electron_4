#!/bin/bash

########################################################
# cppu Unit Test Runner -- for Squishy Electron
# Copyright (C) 2022-2022 Tactile Interactive, all rights reserved

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

# this runs from the main quantumEngine directory
cd `dirname $0`
cd ..

echo "CppUTest Test runner args: db=debugger; all others are assumed to be test name segments"
echo "Use -g groupname to test a whole group"

# https://cpputest.github.io
export CPPUTEST_HOME=/opt/dvl/cpputest/cpputest-3.8

# no enscriptm here!  just native C++.
#. $qEMSCRIPTEN/emsdk/emsdk_env.sh

# create a space-sep list of ALL the runtime cpp files (almost all)
allCpp=`cat building/allCpp.list`

# keep (LABEL_LEN+1) a multiple of 4, 8, 16, 32 or 8 for alignment, eg 7, 15 or 31
LABEL_LEN=7

# note that main.cpp is NOT included in the .cpp files; that's for web use only
# and makes all the diff.  cppuMain.cpp is the main instead.
# Update list of test srcs as needed.
# some of these options - dunno if I need them
set -x
g++ -o cppuTestBin -Wno-tautological-undefined-compare  \
	-std=c++11 -fexceptions -g  -O0 \
	-DLABEL_LEN=$LABEL_LEN \
	-I$CPPUTEST_HOME/include \
	-include $CPPUTEST_HOME/include/CppUTest/MemoryLeakDetectorNewMacros.h \
	-L$CPPUTEST_HOME/lib -lCppUTest -lCppUTestExt \
	testing/cppuMain.cpp */*.spec.cpp \
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
	# it's a real C++ program and I can use gdb!
	#  well, lldb at least.
	lldb  -f /opt/dvl/squishyElectron/SquishyElectron/quantumEngine/cppuTestBin -- -v -c $moreArgs
else
	./cppuTestBin -v -c  $moreArgs
fi


