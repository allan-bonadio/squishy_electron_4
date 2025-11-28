#!/usr/bin/env python3

import sys
import os
import subprocess

SQUISH_ROOT = os.environ['SQUISH_ROOT']
retCode = 0

print('''Scan sources for trace flags that I unintentionally left on... prints
and returns failure if there's some.  You just copy and paste 'false' over
'true' Prints filenames and line numbers.''')

print("🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦  C++")

#cd $SQUISH_ROOT/quantumEngine
os.chdir(SQUISH_ROOT + '/quantumEngine')

cpl = subprocess.run(['grep', '-ERnI', 'bool trace.* = true;', '.'])
if 0 == cpl.returncode:
	print("🔧 🔧 if needed, try global E regex search     bool trace.* = true;  ")
	print("     and P replace  s/bool trace(\w*) = true;/bool trace\1 = false;/g")
	retCode = 57

print()
print("🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦  JavaScript")
#print("Sorry but searching in JavaScriippt might not work I think")
os.chdir(SQUISH_ROOT + '/src')

cpl = subprocess.run(['grep', '-ERnI', '^(let|const) trace.* = true;', '.'])
if 0 == cpl.returncode:
	print("     ... 🔧 🔧 if needed, try global E regex search     let trace.* = true;  ")
	print("     and P replace  s/let trace(\w*) = true;/let trace\1 = false;/g")
	retCode = 33

print()
print("🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 done scaning sources")

sys.exit(retCode)
