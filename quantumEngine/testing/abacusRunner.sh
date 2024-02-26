#!/bin/bash

########################################################
# abacus Runner -- run abacusLab experiments
# Copyright (C) 2023-2024 Tactile Interactive, all rights reserved

# this runs from the main quantumEngine directory
cd `dirname $0`
cd ..

echo "Abacus Lab Test runner args: db=debugger"

# no enscriptm here!  just native C++.

# create a space-sep list of ALL the runtime cpp files (almost all)
allCpp=`cat building/allCpp.list`

# keep (MAX_LABEL_LEN+1) a multiple of 4, 8, 16, 32 or 8 for alignment, eg 7, 15 or 31
MAX_LABEL_LEN=7
MAX_DIMENSIONS=2


# mildly analogous to emcc builds in buildDev.sh and buildProd.sh
# note that main.cpp is NOT included in the .cpp files
# abacusLab.cpp is the main instead.
# Update list of test srcs as needed.
# some of these options - dunno if I need them.  Stick with GNU.
set -x
g++ -o wasm/abacusLab -Wno-tautological-undefined-compare  \
	-g -O0 \
	-std=c++11 -fexceptions  \
	-DqDEV_VERSION -DMAX_LABEL_LEN=$MAX_LABEL_LEN -DMAX_DIMENSIONS=$MAX_DIMENSIONS \
	-include squish.h \
	schrodinger/abacusLab.cpp schrodinger/abacus.cpp testing/testingHelpers.cpp \
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
	echo "gonna run: abacusLab "
	# it's a real C++ program and I can use gdb!
	#  well, lldb at least.
	gdb  -f $SQUISH_ROOT/quantumEngine/wasm/abacusLab $moreArgs
else
	wasm/abacusLab $moreArgs
fi

# see https://emscripten.org/docs/compiling/Running-html-files-with-emrun.html
# to test under more-real browser conditions
# also you can test under Node.js
