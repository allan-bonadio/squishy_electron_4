#!/bin/bash

echo "🎁 🛫 Deploy Production Squishy Electron" `date +%c`
cd `dirname $0`
cd ..

echo you can do either make deploy or npm deploy, same

# make sure it's there & compiled
echo "🎁 🛫 make sure the build is there"
for fn in index.html 'logos/logo|𝒆⟩3.png' qEng/quantumEngine.js qEng/quantumEngine.wasm qEng/quantumEngine.wasm.map
do
	if ! [ -f build/$fn ]
	then
		echo "build/$fn not there"
		ls -lF build/$fn
		exit 77
	fi
done

echo "🎁 🛫 a bit of cleanup:"
xattr -cr build
rm -f build/.DS_Store build/*/.DS_Store build/*/*/.DS_Store

echo "🎁 🛫 Contents of build dir:"
ls -lF build/
du -sh build
echo

echo "🎁 🛫 starting zip compression"
rm -f build.zip
zip -rq build.zip build
echo "🎁 🛫 done with zipping"
ls -lF build.zip
echo


# u must be Allan for this to work
# https://man.openbsd.org/sftp
echo "🎁 🛫 About to upload zip"
sftp -p $NAKODA_SKEY  allan@nakoda <<PETULANT_OLIGARCHS
	cd /var/www/squish

	# get rid of any previous failures
	rm build.zip
	rm -R build
	ls

	put build.zip
	pwd
	ls -l

	put maint/install.sh
	bye
PETULANT_OLIGARCHS


# now decompress and activate
echo "🎁 🛫 About to decompress and activate ================= nakoda login stuff..."
ssh  $NAKODA_SKEY  allan@nakoda <<WALKING_SPEED
	echo "🎁 🛫  ================= ...end of nakoda login stuff"
	cd /var/www/squish || exit 1
	./install.sh

WALKING_SPEED
echo "🎁 🛫 should now be activated"


echo "🎁 🛫 test to see if files are up there"
curl http://squish.tactileint.org > /tmp/squish.html
diff build/index.html /tmp/squish.html

echo "🛫  Deploy Completed"  `date +%c`

