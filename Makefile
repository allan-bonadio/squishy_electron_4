#
# Makefile -- makefile that just delegates to compiling the C++
# Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
#

quantumEngine/quantumEngine.js : quantumEngine/*.*  quantumEngine/*/*.*
	cd quantumEngine; make

clean :
	cd quantumEngine; make clean; cd ..
	rm -rf build build.zip

cleanAll : clean
	rm -rf node_modules
	rm -f package-lock.json
	npm install

test :
	cd quantumEngine; make clean; cd ..
	npm run test

build :
	maint/build.sh


