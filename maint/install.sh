#!/bin/bash

if [ `uname` = 'Darwin' ]
then
	echo $'\e[1;31m !! Error: must only run on MacOS \e[0m'
	exit 49
fi

# runs ON SERVER to decompress and install latest version of squish
# must run productionBuild.sh and deploy.sh first, on local machine
timestamp="$1"
if [  ! "$timestamp" ]
then
	echo $'\e[1;31m !! You need a timestamp as argument!\e[0m'
	exit 67
fi

echo "🎁 🎁 🛫 🛫 Install Squishy Electron $timestamp on Server"

alarmError ( )
{
	msg="$1"
	echo $'\e[1;31m \a 🎁 🛫 🤢 🤮 🤧 😱 😞  install failed! \a 🤢 🤮\e[0m '
	echo $'\awhacha gonna do about it?  $msg\a'
	for n in 1 2 3 4 5 6 7 8 9 10
	do
		echo $'\e[1;31m \a 🎁 🛫 🤢 🤮 🤧 😱 😞  install failed! \a 🤢 🤮\e[0m '
		echo $msg
		sleep $n
	done
	exit 65
}


echo "                                     🎁 🛫 🔨 Install squish on nakoda " `pwd`  `date +%c %Z`
ls -lh
rm -rf build

echo "                                     🎁 🛫 🔨 Now to decompress" `pwd`  `date +%c`
unzip -oq build.zip || exit 3
echo "build contents:"
ls -lh build
echo

echo "                                     🎁 🛫 🔨 rename, build => $timestamp"
mv -fv build $timestamp || alarmError
mv -fv build.zip $timestamp.zip || alarmError
echo "emplaced directory $timestamp:"
ls -lh $timestamp
echo

echo "                                     🎁 🛫 🔨 now the switchover: point 'active' to $timestamp"
./useBuild $timestamp || alarmError
echo "active points to, and contents:"
ls -l active active/

echo "install and useBuild on server done: " `date`
