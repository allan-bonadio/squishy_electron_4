#!/usr/bin/env node

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { exec } from 'node:child_process';

import {marked} from 'marked';
import markedKatex from 'marked-katex-extension';

const markdOptions = {
	gfm: true,
	headerIds: true,
	headerPrefix: 'doc',
};

const katexOptions = {output: 'mathml'};
marked.use(markedKatex(katexOptions));


// this will wrap each compiled MD piece
let template;
let nDirsWalked, nFilesTried, nMDFilesCompiled;

console.log(`•••••••••• compile docs with Markd + katex`);

if (!process.env.SQUISH_ROOT) {
	console.error(`Must define env var SQUISH_ROOT!`);
	process.exit(1);
}
process.chdir(process.env.SQUISH_ROOT +`/docGen`);


/* ************************************************************* traversing and compiling */

// figure out where this compiled file should go.
// suffix should NOT have a dot
function makeOutputPath(inputPath, suffix = '') {
	let out = inputPath.replace(/docSrc/, '../public/doc')
	if (suffix)
		out = out.replace(/\.\w+$/, `.${suffix}`);
	return out;
}

// standard, start to read a file and return promise
const readAFile =
(filePath) => fsp.readFile(filePath, {encoding: 'utf8'});

// for promise catchers
const catchException =
(ex, where) => {
	console.error(`Error ${where}:`, ex.stack ?? ex.message ?? ex);
	debugger;
}

// a .md file
function compileAnMDFile(mdPath) {
	let htmlPath = makeOutputPath(mdPath, 'html');
	console.log(`about to compile md file ${mdPath} to html file ${htmlPath}`);

	return readAFile(mdPath)
	.then(contents => {
		console.log(`read the md file ${mdPath}!  ${contents.length} bytes.`);
		let html = marked.parse(contents, markdOptions);

		html = template
			.replace('〖body〗', html)
			.replace('〖title〗', 'info')
			.replace('〖fromFile〗', mdPath)
			.replace('〖description〗', 'info for squishy electron')
			.replace('〖buildTime〗', (new Date()).toLocaleString());
		console.log(`txlated the md file ${mdPath}! for html ${html.length} bytes.`);

		return fsp.writeFile(htmlPath, html)
		.then(rv => console.log(`wrote the HTML file ${htmlPath}!  returning ${rv}`));
	})
	.then(res => {
		console.log(`compiled ${mdPath} to ${htmlPath}`);
		nMDFilesCompiled++;
	})
	.catch(ex => catchException(ex, `compiling  ${mdPath} to ${htmlPath}`));
}


// something else, passthru.  not really implemented
function compileATextFile(textPath) {
	let outputPath = makeOutputPath(textPath);
	console.warn(`about to compile non-MD file ${textPath}[ to ${outputPath} ??]`);

	// just return a promise, i dunno...
	return readAFile(textPath)
}


// it's a file, but what kind?  trust the suffix.
function compileAFile(filePath) {
	let dot = filePath.lastIndexOf('.');
	if (dot < 0)
		return Promise.reject(`file ${filePath} has no dot in name`);

	nFilesTried++;
	switch (filePath.substr(dot+1)) {
	case 'md':
		return compileAnMDFile(filePath);

	// maybe someday there will be more file types?
	default:
		return compileATextFile(filePath);
	}
}

// without a slash on the front or end of path
function compileADir(dirPath) {
	let docPath = makeOutputPath(dirPath);

	return fsp.readdir(dirPath, {withFileTypes: true})
	.then(list => {
		let promz = [];
		for (let dirent of list) {
			if (dirent.isDirectory())
				promz.push(compileADir(`${dirPath}/${dirent.name}`));
			else if (dirent.isFile())
				promz.push(compileAFile(`${dirPath}/${dirent.name}`));
			else //if (dirent.isSymbolicLink())
				promz.push(Promise.reject(`Sorry, can't deal with a symlink or other
					kind of file besides a dir or regular file, yet`));
		}
		nDirsWalked++;

		// might be some errors in here, but keep going
		return Promise.allSettled(promz);
	})
	.catch(ex => catchException(ex, `walking Directory ${dirPath} to compile to ${docPath}:`));
}

// used for files passed as cmd line arguments.
// Understands paths relative to proj root,  docGen, or docSrc
// if relative to root, must be in docGen!
function compileFileOrDir(path) {
	// for convenience of user, feel around for where it is
	let info;
	let op = {throwIfNoEntry: false};

	if (info = fs.statSync('docSrc/'+ path, op))  // if relative to docSrc
		path = 'docSrc/'+ path;
	else if (info = fs.statSync('../'+ path, op))// if relative to root
		path = path.replace(/docGen\//, '');
	else  if (!(info = fs.statSync(path, op)))  // if NOT relative to docGen
		throw `Cannot find file ${path} in docGen`;

	// from man 7 inode
	// this is (mode & S_IFMT) == S_IFREG or S_IFDIR
	if ((info.mode & 0o0170000) == 0o100000)
		return compileAFile(path);
	else if ((info.mode & 0o0170000) == 0o40000)
		return compileADir(path);
	else
		console.error(`${path} is not a file or dir, punting on this one`);
}

/* ************************************************************* main */

// main, runs only after the frags have been loaded
function main() {
	// futz with argv cuz sometimes node is argv[0] and other times this script is
	let argv = [...process.argv];
	argv.shift()
	let second = argv.shift();
	if (second && !second.includes('compileDocs'))
		argv.unshift(second);

	nFilesTried = nMDFilesCompiled = nDirsWalked = 0;
	if (argv.length > 0) {
		// process just the listed files
		for (arg of argv)
			compileFileOrDir(arg);
	}
	else {
		// do it all
		compileFileOrDir('docSrc');
	}
	console.log(`${nDirsWalked} directories scanned, ${nFilesTried} files examined,
		${nMDFilesCompiled} MarkDown files compiled`);
}

function readInitFiles() {
	let proms = [
		readAFile('template.html'),
	];

	return Promise.all(proms)
	.then(contentz => {
		[template] = contentz;
		main();
	})
	.catch(ex => catchException(ex, `loading something in compileDocs`));
}

// this runs first
readInitFiles()
.then(() => {
	setTimeout(() => {
		const opts = {cwd: '../public/doc'}
		exec(`ls -l`, opts, (error, stdout, stderr) => {
			console.log('resulting doc dir:\n' + stdout);
			if (error || stderr) {
				console.error(stderr, error);
				process.exit(7);
			}
			else
				process.exit(0);
		});
	}, 50_000);
});

