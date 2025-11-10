#!/bin/bash

# runs ON SERVER to decompress and install latest version of squish
# must run productionBuild.sh and deploy.sh first, on local machine

echo "🎁 🎁 🛫 🛫 Install Squishy Electron on Server"

alarmError ( )
{
	msg="$1"
	echo $'\a 🎁 🛫 🤢 🤮 🤧 😱 😞  activation failed! $msg \a 🤢 🤮 '
	echo $'\awhacha gonna do about it?  $msg\a'
	for n in 1 2 3 4 5 6 7 8 9 10
	do
		echo $'\7  🤦‍♀️ 🙀 👿 😵 🧯 🔥 🌪 ⛈ error allan!\a  wakeup!\a $msg \a'
		echo
		sleep $n
	done
}


echo "                                     🎁 🛫 🔨 Install squish on nakoda, this: " `pwd`  `date +%c`  "Now to decompress..."
ls -lh
rm -rf build
unzip -oq build.zip || exit 3
ls -lh *
echo

timestamp=`date -u +%F,%H.%M`
echo "                                     🎁 🛫 🔨 rename, this build is $timestamp"
mv -fv build $timestamp || alarmError
mv -fv build.zip $timestamp.zip || alarmError
ls -l
echo

echo "                                     🎁 🛫 🔨 now the switchover: point 'active' to it"
ln -sfv $timestamp active || alarmError
ls -l
ls -l active

date
