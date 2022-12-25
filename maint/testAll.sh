#!/bin/bash
# this does ALL the tests.  Use other npm subcommands for specific purposes.
cd `dirname $0`
cd ..
# our working directory is the project root
echo "$@"

# couldn't figure out how to generate this within the test
src/gl/cxToColor/glTranslate.js

# now for the c++ tests
quantumEngine/testing/cppuRunner.sh

# jest testing JS
node --experimental-vm-modules node_modules/.bin/jest --runInBand

