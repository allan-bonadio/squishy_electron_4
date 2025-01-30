#!/bin/bash

# use this to set the current build to the one given in $1
# run on the server in the /var/www/squish directory

if [ -n "$1" ]
then
	echo "activate build $1"
	ln -sfv $timestamp active
	ls -l active
	exit 0
else
	echo "No build name.  Try again like this:"
	echo "$0 2025-01-28,162821_PST_Tue"
	exit 5
fi
