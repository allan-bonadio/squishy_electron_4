#
# Makefile -- makefile that just delegates to compiling the C++
# Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
#

quantumEngine/quantumEngine.js : quantumEngine/*.cpp
	cd quantumEngine; make
