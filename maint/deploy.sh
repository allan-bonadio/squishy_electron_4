#!/bin/bash
# Runs on local side (panama)

echo "🎁 🛫 Deploy Production Squishy Electron" `date +%c`
cd $SQUISH_ROOT
if [ ! -d 'quantumEngine' ]
then
	echo "Error: SQUISH_ROOT isn't defined right, '$SQUISH_ROOT'"
	exit 41
fi

echo you can do either make deploy or npm deploy, same

# make sure it's there & compiled
echo "🎁 🛫 make sure at least most of the build is there"
WASMFILES="qEng/quantumEngine.main.js qEng/quantumEngine.wasm "
IMAGES="images/eclipseOnTransparent.gif images/splat.png logos/logoKetE.png"
DOCFILES="doc/index.html doc/intro/intro1.html"
OTHERFILES="index.html manifest.json "
for fn in index.html  $OTHERFILES $WASMFILES $IMAGES $DOCFILES
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
echo
du -sh build
echo

echo "🎁 🛫 starting zip compression"
rm -f build.zip
zip -rq build.zip build
echo "🎁 🛫 done with zipping, here it is:"
ls -lhF build.zip
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


echo "🎁 🛫 test to see if files are up there - do a Diff"
curl https://squish.tactileint.org > /tmp/squish.html
if diff build/index.html /tmp/squish.html
then echo "🛫  Deploy Completed, looks good!  😅"  `date +%c`
	exit 0
else echo "something's wrong, the diff didn't compare 🧐😒🙄😲🤕🫣"
	exit 1
fi
