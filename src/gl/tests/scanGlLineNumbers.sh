#!/bin/bash


# echo "🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦  Scan all GL line numbers"

cd $SQUISH_ROOT/src/gl
if grep  -ErnIA1 '^#line \d+' *
then
	echo
	echo "🔧 🔧 Try global regex search     ^#line \d+"
	exit 37
fi

echo "🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 done scaning sources"


