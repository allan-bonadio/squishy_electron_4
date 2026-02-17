#!/bin/bash
# Deploys built Squish to server.  RUNS ON LOCAL.
# You must build with productionBuild.sh first.
# Runs on local side (panama/dnipro)

timestamp=`date -u +%F,%H.%M`
echo "              🛫 🛫 🛫 Deploy Production $timestamp Squishy Electron" `date +'%c %Z' `
echo "                                               run this only After build"

if [ `uname` != 'Darwin' ]
then
	echo $'\e[1;31m !! Error: must only run on MacOS \e[0m'
	exit 49
fi

if [ ! "$SQUISH_ROOT" ]
then
	echo $'\e[1;31m !! Error: SQUISH_ROOT isn\'t defined,\e[0m' "'$SQUISH_ROOT'"
	exit 43
fi

if [ ! -d 'quantumEngine' ]
then
	echo $'\e[1;31m !! Error: quantumEngine/ is not there\e[0m'
	echo $'\e[1;31m   ... or you need to cd to $SQUISH_ROOT .\e[0m'
	exit 41
fi

echo you can do either make deploy or npm deploy, same

# make sure it's there & compiled
echo "                             🛫 🛫 🛫  make sure crucial build files are there"
WASMFILES="qEng/quantumEngine.js qEng/quantumEngine.wasm "
IMAGES="images/eclipseOnTransparent.gif images/splat.png logos/logoKetE.png"
DOCFILES="doc/gettingStarted/gettingStarted.html  doc/digitalWaves/digitalWaves.html \
doc/naturalWaves/naturalWaves.html"
OTHERFILES="index.html manifest.json "
for fn in index.html  $OTHERFILES $WASMFILES $IMAGES $DOCFILES
do
	if ! [ -f build/$fn ]
	then
		echo $'\e[1;31m !! file missing.  build/$fn not there\e[0m'
		ls -lF build/$fn
		echo $'\e[1;31m try    npm run build\e[0m'
		exit 77
	fi
done


echo "                             🛫 🛫 🛫  a bit of cleanup:"
xattr -cr build
rm -f build/.DS_Store build/*/.DS_Store build/*/*/.DS_Store

echo "                             🛫 🛫 🛫  Contents of build dir:"
ls build
# ls -lFa build/
# echo
# du -sh build
# du -sh build/*
echo

echo "                             🛫 🛫 🛫  starting zip compression"
rm -f build.zip
zip -rq build.zip build
echo "                             🛫 🛫 🛫  done with zipping, here it is:"
ls -lhF build.zip
echo


# u must be Allan for this to work
# https://man.openbsd.org/sftp
# dest url must always be last
echo "                             🛫 🛫 🛫  About to upload zip"

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
	echo $'\e[1;31m error in sftp, see above\e[0m'
	exit 71
fi


# now decompress, on the server
echo "                             🛫 🛫 🛫  About to decompress and activate ➤ ➤ ➤ ➤ ➤ == nakoda login stuff..."
ssh  $NAKODA_SKEY  allan@nakoda <<-WALKING_SPEED
	set -x
	echo "                             🛫 🛫 🛫   ➤ ➤ ➤ ➤ = =➤  ...logged into nakoda $timestamp"
	cd /var/www/squish || exit 1
	./install.sh "$timestamp"

WALKING_SPEED
echo "                             🛫 🛫 🛫  should now be activated"


echo "                             🛫 🛫 🛫  test to see if files are up there - do a Diff"
curl https://squish.tactileint.org > /tmp/actualSquishIndexOnline.html
sleep 5  # give it time to soak in.  So the diff doesn't screw up.
if diff build/index.html /tmp/actualSquishIndexOnline.html
then echo "                               🛫 🛫  😅 😅 😅 Deploy Completed, looks good so far!"  `date +%c`
	echo "To activate the symlink to $timestamp, login to nakoda and   ./useBuild $timestamp"
	echo "Remember to tag it,    git tag -a deploy$timestamp   and enter descr "
	exit 0
else echo  $'\e[1;31m !! the diff didn,t compare - index.html are different\e[0m'
	exit 61
fi
