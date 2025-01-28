#!/usr/bin/env python3

import sys
import os
import subprocess

SQUISH_ROOT = os.environ['SQUISH_ROOT']
retCode = 0

print("Scan sources for traces that I unintentionally left on... prints and returns failure if there's some")

print("🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦  C++")

#cd $SQUISH_ROOT/quantumEngine
os.chdir(SQUISH_ROOT + '/quantumEngine')

cpl = subprocess.run(['grep', '-ERnI', 'bool trace.* = true;', '.'])
if 0 == cpl.returncode:
	print("🔧 🔧 Try global regex search     bool trace.* = true;  ")
	retCode = 57

print()
print("🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦  JavaScript")
print("Sorry but searching in JavaScriippt might not work I think")
os.chdir(SQUISH_ROOT + '/src')

cpl = subprocess.run(['grep', '-ERnI', '^(let|const) trace.* = true;', '.'])
if 0 == cpl.returncode:
	print("     ... 🔧 🔧 Try global regex search     let trace.* = true;  ")
	retCode = 33

print()
print("🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 🟦 done scaning sources")

sys.exit(retCode)
