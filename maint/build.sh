#!/bin/bash

echo "🔨 Build Production Squishy Electron"
cd `dirname $0`
cd ..

# must create the C++ wasm binary first
quantumEngine/building/buildProd.sh || exit 11

# normal CRA build command
react-scripts build

# now what...


echo "🔨  Build Completed"
