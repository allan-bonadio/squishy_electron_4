#!/usr/bin/env python3
import sys, os

print('''We need these symlinks for the CHrome debugger to work in C++
	so the debugger can reach through these directory names to get to the corresponding files.
	Must re-run this after doing a production build.''')

os.chdir(os.environ['SQUISH_ROOT'] + '/public')

dirNames = 'building', 'debroglie', 'fourier', 'greiman', 'hilbert', 'schrodinger', 'testing', 'wasm'

def usage():
	print("Usage:")
	print(f"   {sys.argv[0]} +   # install symlinks to debug");
	print(f"   {sys.argv[0]} -   # remove symlinks to build");
	sys.exit(1)


if len(sys.argv) <= 1:
	usage()
	print("missing arguments")
	sys.exit(1)

if sys.argv[1] == '+':
	if os.access('schrodinger', os.F_OK, follow_symlinks=False):
		print('Symlinks already in place.')
		sys.exit(0)

	for fn in dirNames:
		print(f'creating symlink {fn}')
		os.symlink(f'../quantumEngine/{fn}', fn)

	#print(dirNames)
elif sys.argv[1] == '-':
	if not os.access('schrodinger', os.F_OK, follow_symlinks=False):
		print('Symlinks already removed.')
		sys.exit(0)

	for fn in dirNames:
		print(f'removing {fn}')
		os.remove(fn)
else:
	usage


