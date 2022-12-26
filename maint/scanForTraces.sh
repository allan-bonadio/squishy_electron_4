#!/bin/bash

echo "Scan sources for traces i left on... returns failure if there's some"
echo "🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦  C++"
cd $SQUISH_ROOT/quantumEngine
grep   -ERn 'bool trace.* = true;' * && exit 41

echo
echo "🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦  JavaScript"

cd $SQUISH_ROOT/src
grep  -ERn '^(let|const) trace.* = true;' * && exit 43
echo "🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 done scaning sources"


# search and replace with these, makes it easier
# = true;
# = false;
