#!/bin/bash

echo "🛫 Deploy Production Squishy Electron"
cd `dirname $0`
cd ..

# make sure it's there & compiled
for fn in index.html 'logos/logo|𝒆⟩3.png' qEng/quantumEngine.js qEng/quantumEngine.wasm qEng/quantumEngine.wasm.map
do
	if ! [ -f build/$fn ]
	then
		echo "build/$fn not there"
		ls -l build/$fn
		exit 77
	fi
done

echo "Contents of build dir:"
ls -l build/
echo

echo "starting zip compression"
zip build.zip build
echo "done with zipping"
echo


# u must be Allan for this to work
echo "About to upload zip"
sftp  $NAKODA_SKEY  allan@nakoda <<PETULANT_OLIGARCHS
	cd /var/www/squish
	put build.zip
PETULANT_OLIGARCHS

# now decompress and activate
ssh  $NAKODA_SKEY  allan@nakoda <<WALKING_SPEED
	cd /var/www/squish || exit 1
	echo "Current squish directory:"
	ls
	echo

	echo "Now to decompress..."
	unzip build.zip || exit 3
	echo

	echo "decompressed:"
	ls -l
	echo

	echo "now the quick switchover"
	rm -rf old || exit 5
	mv -f active old || exit 7
	mv build active || exit 9
	echo

	echo "result in active dir:"
	ls -l active
WALKING_SPEED

# now what...


echo "🛫  Deploy Completed"

