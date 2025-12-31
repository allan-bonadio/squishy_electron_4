#
# Makefile -- makefile that compiles the C++ and makes all the other parts
# Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
#

quantumEngine/quantumEngine.js : quantumEngine/*.h quantumEngine/*.cpp  quantumEngine/*/*.*
	cd quantumEngine; make; cd ..
	src/gl/cx2rygb/glTranslate.js

clean :
	cd quantumEngine; make clean; cd ..
	rm -rf build build.zip

cleanAll : clean
	# same as npm cleanAll
	rm -rf node_modules
	rm -f package-lock.json
	npm install

test :
	cd quantumEngine; make clean; cd ..
	npm run test

build :
	maint/productionBuild.sh

docs :
	docGen/compileDocs.js --batch || exit 45


deploy :
	maint/deploy.sh


