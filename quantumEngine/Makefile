##
## Makefile -- makefile for quantum engine, for compiling the C++
## Copyright (C) 2021-2023 Tactile Interactive, all rights reserved
##

quantumEngine.js quantumEngine.wasm : *.cpp *.h */*.h */*.cpp building/exports.json building/buildDev.sh building/allCpp.list
	building/buildDev.sh

building/exports.json commonConstants.h ../src/engine/qe.js : building/genExports.js
	building/genExports.js

# just in the quantumEngine dir
clean :
	rm -fv quantumEngine.js quantumEngine.wasm quantumEngine.wasm.map
	rm -frv cppuTestBin cppuTestBin.dSYM
	rm -fv commonConstants.h building/exports.json ../src/engine/qe.js
	echo 'byte size and file count:' `du -sh .; ls -lR | grep -E '^-' | wc -l`


test :
	testing/cppuRunner.sh
