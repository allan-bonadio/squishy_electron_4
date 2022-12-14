#!/bin/bash

# runs on Nakoda to decompress and install latest version of squish

alarmError ( )
{
	msg="$1"
	echo $'\ağ ğ« ğ ğ« ğ ğ« ğ ğ« ğ ğ«  activation failed! $msg ğ ğ« ğ ğ« ğ ğ« \a'
	echo $'\awhacha gonna do about it?  $msg\a'
	for n in 1 2 3 4 5
	do
		echo $'\7error allan!\a  wakeup!\a $msg \a'
		sleep 1
	done
}


echo "ğ ğ« Install squish on nakoda, currently " `pwd`  `date +%c`
ls -l
du -sh *
echo

echo "ğ ğ« Now to decompress..."
rm -rf build
unzip -oq build.zip || exit 3
echo

echo "ğ ğ« decompressed:"
ls -l
du -sh *
echo

echo "ğ ğ« now the quick switchover"
rm -rfq old
mv -fv active old
mv -fv build active || alarmError
ls -l
echo

echo "ğ ğ« result in active dir:"  `date +%c`
ls -l active
