##
## Makefile -- makefile for quantum engine, for compiling the C++
## Copyright (C) 2021-2025 Tactile Interactive, all rights reserved
##

wasm/quantumEngine.wasm wasm/quantumEngine.js : *.cpp *.h */*.h */*.cpp building/exports.json building/build*.sh building/allCpp.list
	building/buildDev.sh

building/exports.json commonConstants.h ../src/engine/qeConsts.js ../src/engine/qeFuncs.js : building/genExports.js
	building/genExports.js

# just in the quantumEngine dir
clean :
	if [ ! "${SQUISH_ROOT}" ] ; then echo must have SQUISH_ROOT defined; exit 27; fi
	rm -frv wasm/*
	rm -fv commonConstants.h building/exports.json ${SQUISH_ROOT}/src/engine/qe{Consts,Funcs}.js
	echo "total C++ code:"  `du -sh | sed -E 's@\t.@@'` ' bytes     '  ` ls -lR | grep -E '^-' | wc -l` files


test :
	testing/cppuRunner.sh
