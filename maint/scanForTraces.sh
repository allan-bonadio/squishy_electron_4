#!/bin/bash

echo "Scan sources for traces i left on... returns failure if there's some"
echo "🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦  C++"
cd $SQUISH_ROOT/quantumEngine
if grep   -ERnI 'bool trace.* = true;' *
then
	echo "🔧 🔧 Try global regex search     bool trace.* = true;  "
	exit 57
fi

echo
echo "🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦  JavaScript"

cd $SQUISH_ROOT/src
if grep  -ERnI '^(let|const) trace.* = true;' *
then
	echo "🔧 🔧 Try global regex search     ^(let|const) trace.* = true;  "
	exit 33
fi

echo
echo "🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 done scaning sources"


# echo " search and replace with these, makes it easier"
# echo " = true;"
# echo " = false;"
