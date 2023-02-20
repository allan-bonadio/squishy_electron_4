#!/bin/bash

echo "Scan sources for traces i left on... returns failure if there's some"
echo "🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦  C++"
cd $SQUISH_ROOT/quantumEngine
grep   -ERnI 'bool trace.* = true;' * && \
	echo "Try global regex search     bool trace.* = true;  "

echo
echo "🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦  JavaScript"

cd $SQUISH_ROOT/src
grep  -ERnI '^(let|const) trace.* = true;' * && \
	echo "Try global regex search     ^(let|const) trace.* = true;  "

echo "🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦  GL line numbers"

cd $SQUISH_ROOT/src/gl
grep  -ERnIA2 '^#line \d+' *

echo "🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 done scaning sources"


# search and replace with these, makes it easier
# = true;
# = false;
