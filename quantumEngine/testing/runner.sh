#!/bin/bash

cd `dirname $0`
cd ..


this is not used anymore
exit 1


echo "q test runner. Just run it from any directory, no args needed"
echo "Read src to verify.  (must add new test srcs to this file)"
echo "Add in argument of --inspect or --inspect-brk or any other "
echo "node args; they will be passed through."

# source this to run MscriptN stuff:
. $qEMSCRIPTEN/emsdk-main/emsdk_env.sh

# create a space-sep list of ALL the cpp files (almost all)
allCpp=`cat building/allCpp.list`

mt=" testing/main.test.cpp testing/spaceWave/qCx.test.cpp "
et=" testing/rk2.test.cpp testing/spaceWave/vissFlicks.test.cpp "
swt="testing/spaceWave/space.test.cpp  testing/spaceWave/wave.test.cpp "
allTesters=" $mt $et $swt "

# note that main.cpp is NOT included in the .cpp files; that's for web use only
# and makes all the diff.  Update list of test srcs as needed.
emcc -o quantumTest.js -sLLD_REPORT_UNDEFINED -g \
	-g -sASSERTIONS=2 -sSAFE_HEAP=1 -sSTACK_OVERFLOW_CHECK=2 \
	-sNO_DISABLE_EXCEPTION_CATCHING \
	$allTesters \
	$allCpp \
	|| exit $?

# added/removed mid sept: 	-fsanitize=undefined


# now run the tests
echo
echo ====================== done compiling ==================================
echo

# it's generated from the emcc compile above
node $* quantumTest.js


