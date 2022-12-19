#!/bin/bash

echo "Scan sources for traces i left on..."
echo "🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 first C++"
cd $SQUISH_ROOT/quantumEngine
grep   -ERn 'bool trace.* = true;' *

echo
echo "🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 now JavaScript"

cd $SQUISH_ROOT/src
grep  -ERn 'let trace.* = true;' *
echo "🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 done scaning sources"


# search and replace with these, makes it easier
# = true;
# = false;
