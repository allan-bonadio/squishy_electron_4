#!/bin/bash
# Deploys built Squish to server.  You must build with productionBuild.sh first.
# Runs on local side (panama/dnipro)

echo "                                     🎁 🎁 🛫 Deploy Production Squishy Electron" `date +%c`
echo "                                               run this only After npm run build"
cd $SQUISH_ROOT
if [ ! -d 'quantumEngine' ]
then
	echo "Error: SQUISH_ROOT isn't defined right, '$SQUISH_ROOT'"
	echo "   ... or you need to cd there."
	exit 41
fi

echo you can do either make deploy or npm deploy, same

# make sure it's there & compiled
echo "                                     🎁 🎁 🛫 make sure the build is there"
WASMFILES="qEng/quantumEngine.js qEng/quantumEngine.wasm "
IMAGES="images/eclipseOnTransparent.gif images/splat.png logos/logoKetE.png"
DOCFILES="doc/index.html doc/intro/intro1.html"
OTHERFILES="index.html manifest.json "
for fn in index.html  $OTHERFILES $WASMFILES $IMAGES $DOCFILES
do
	if ! [ -f build/$fn ]
	then
		echo "build/$fn not there"
		ls -lF build/$fn
		echo "try    npm run build"
		exit 77
	fi
done


echo "                                     🎁 🎁 🛫 a bit of cleanup:"
xattr -cr build
rm -f build/.DS_Store build/*/.DS_Store build/*/*/.DS_Store

echo "                                     🎁 🎁 🛫 Contents of build dir:"
ls -lFa build/
echo
du -sh build
du -sh build/*
echo

echo "                                     🎁 🎁 🛫 starting zip compression"
rm -f build.zip
zip -rq build.zip build
echo "                                     🎁 🎁 🛫 done with zipping, here it is:"
ls -lhF build.zip
echo


# u must be Allan for this to work
# https://man.openbsd.org/sftp
# dest url must always be last
echo "                                     🎁 🎁 🛫 About to upload zip"
# "-b - -N" is batch mode; any failure ends session
sftp -p $NAKODA_SKEY  -b - -N  allan@nakoda <<PETULANT_OLIGARCHS
	cd /var/www/squish
	ls

	put build.zip
	pwd

	put maint/install.sh
	put maint/useBuild
	chmod 755 useBuild
	ls -l

	bye
PETULANT_OLIGARCHS
if [ "$?" != "0" ]
then
	echo "error in sftp, see above"
	exit 71
fi


# now decompress and activate
echo "                                     🎁 🎁 🛫 About to decompress and activate ================= nakoda login stuff..."
ssh  $NAKODA_SKEY  allan@nakoda <<WALKING_SPEED
	echo "                                     🎁 🎁 🛫  ================= ...end of nakoda login stuff"
	cd /var/www/squish || exit 1
	./install.sh

WALKING_SPEED
echo "                                     🎁 🎁 🛫 should now be activated"


echo "                                     🎁 🎁 🛫 test to see if files are up there - do a Diff"
sleep 5  # give it time to soak in.  So the diff doesn't screw up.
curl https://squish.tactileint.org > /tmp/squish.html
if diff build/index.html /tmp/squish.html
then echo "                                       🎁 😅 🛫  Deploy Completed, looks good!"  `date +%c`
	exit 0
else echo "the diff didn't compare - hashes are different and that's ok"
	exit 61
fi
