#!/bin/bash

# runs on Nakoda to decompress and install latest version of squish

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


echo "🎁 🛫 Install squish on nakoda, currently " `pwd`  `date +%c`
ls -l
du -sh *
echo

echo "🎁 🛫 Now to decompress..."
rm -rf build
unzip -oq build.zip || exit 3
echo

echo "🎁 🛫 decompressed:"
ls -l
du -sh *
echo

echo "🎁 🛫 now the quick switchover"
rm -rf old
mv -fv active old
mv -fv build active || alarmError
ls -l
echo

echo "🎁 🛫 result in active dir:"  `date +%c`
ls -l active
