#!/usr/bin/env node

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import {exec, execSync} from 'node:child_process';
import readline from 'node:readline';

import YAML from 'yaml';

import {marked} from 'marked';
import markedKatex from 'marked-katex-extension';

let traceControlFlow = false;
let traceWhatTime = false;
let traceFinalDocDir = false;
let traceFinalPromiseResult = false;
let traceMetadata = false;

/*
** The documentation is served from the public/doc directory, which contains mostly .html, image and video files.
** during writing (development), the docGen directory serves as a proxy.  Both have symlinks into the
** katex directory for the katex.css file and its fonts.
*/

const whatTime =
(where) => traceWhatTime && console.log(`⏱  ${where} ${performance.now()}`);
whatTime('start of app running');

const markdOptions = {
	gfm: true,
	headerIds: true,
	headerPrefix: 'doc,',
	smartypants: true,  // i may be asking for trouble
};

// see also https://katex.org/docs/options.html
const katexOptions = {
	output: 'mathml',
	throwOnError: false,
	strict: 'ignore',
};
marked.use(markedKatex(katexOptions));


// this will wrap each compiled MD piece
let template;
let nDirsWalked, nFilesTried, nFilesPassedThru, nFilesSymlinked, nMDFilesCompiled;

function usage() {
	console.log(`•••••••••• compile docs with Markd + katex ••••••••••
		usage:
		compileDocs # prompts to delete the public/doc contents, then does all
		compileDocs --batch # no prompt, no delete, does all
		compileDocs colophon.md intro/intro1.md  # just does those two files
	`);
}

if (!process.env.SQUISH_ROOT) {
	console.error(`Must define env var SQUISH_ROOT!`);
	usage();
	process.exit(1);
}
process.chdir(process.env.SQUISH_ROOT +`/docGen`);


// figure out where this compiled file should go.
// suffix should NOT have a dot; we'll add one
function makeOutputPath(inputPath, suffix = '') {
	let out = inputPath.replace(/docSrc/, '../public/doc');
	if (suffix)
		out = out.replace(/\.\w+$/, `.${suffix}`);
	//console.log(`makeOutputPath(${inputPath}) --> '${out}'`);
	return out;
}

// standard, start to read a file and return promise
const readTextFile =
(filePath) => fsp.readFile(filePath, {encoding: 'utf8'});

// for promise catchers
const catchException =
(ex, where) => {
	console.error(`Error ${where}:`, ex.stack ?? ex.message ?? ex);
	usage();
	debugger;
}

/*
**  Most of these functions from here on return Promises.  They settle
**  when it's task is done.  It's all asynchronous and very fast.
**
**  Don't break the chain by returning nothing!  .then() will turn it into
**  an immediately-resolved promise resolving in undefined.
**  Then, your function might not get a chance to run!
*/

/* ************************************************************* Markdown Files */

// take the contents of an md file, and other info, and plug stuff into the
// template, to get the resulting .html file contents.
function populateMDTemplate(contents, mdPath) {
	let variables = {
		// the Actual MD  converted to HTML
		body : marked.parse(contents, markdOptions),

		// default title comes from filename - \w chars before the suffix
		title: mdPath.replace(/^docSrc.+?(\w+)\.md$/, '')
			.replace(/_/, ' '),

		fromFile: mdPath,

		buildTime: (new Date()).toLocaleString(),
	};

	// the metadata.  Opening and closing HTML comment syntax must each be
	// on a line on its own.  Must start at start of file.  Lines in between
	// are YAML.  (To match all chars, use [^] or else use . with the /s flag)
	let yaml = contents.replace(/^<!--\n(.*)\n-->\n.*$/s, '$1');

	// but that doesn't mean the yaml is correct syntax
	let js = {};
	if (traceMetadata)
		console.info(`the yaml: ''${yaml}''`);
	if (yaml) {
		try {
			// if present, that yaml block can override any other variables
			let js = YAML.parse(yaml);
			if (traceMetadata)
				console.info(`the resulting object: `, js);
		} catch (ex) {
			js = {description: ex.message};
			console.error(`parsing yaml, ${ex.message}, but parsing will continue`);
		}
		Object.assign(variables, js);
	}

	// final templating plugins.  Any var that's not in the template never shows up.
	//for (let key in variables) {
	//	html = html.replace(`〖${key}〗`, variables[key]);
	//}
	let html = template
		.replace('〖body〗', variables.body)
		.replace('〖title〗', variables.title)
		.replace('〖fromFile〗', variables.mdPath)
		.replace('〖description〗', variables.description)
		.replace('〖buildTime〗', (new Date()).toLocaleString());
	if (traceControlFlow)
		console.log(`txlated the md file ${mdPath}! for html ${html.length} bytes.`);
	return html;
}


// a .md file
function compileAnMDFile(mdPath) {
	let htmlPath = makeOutputPath(mdPath, 'html');
	if (traceControlFlow)
		console.log(`about to compile md file ${mdPath} to html file ${htmlPath}`);

	return readTextFile(mdPath, {encoding: 'utf8'})
	.then(contents => {
		if (traceControlFlow)
			console.log(`read the md file ${mdPath}!  ${contents.length} bytes.`);

		let html = populateMDTemplate(contents, mdPath);

		return fsp.writeFile(htmlPath, html, {encoding: 'utf8'})
		.then(rv => {
			if (traceControlFlow)
				console.log(`wrote the HTML file ${htmlPath}`);
		});
	})
	.then(contents => {
		if (traceControlFlow)
			console.log(`read ${mdPath} to ${htmlPath}`);
		nMDFilesCompiled++;

		// return value is what these promises resolve to, for trace msg
		return `${mdPath.replace('docSrc/', '')} → ${htmlPath.replace('../public/doc/', '')}`;
	})
	.catch(ex => catchException(ex, `compiling  ${mdPath} to ${htmlPath}`));
}


/* ******************************************************************* files */

// something else, passthru.  actually not used.
function copyOverFile(filePath) {
	let outputPath = makeOutputPath(filePath);
	if (traceControlFlow)
		console.log(`about to copy file ${filePath} to file ${outputPath}`);

	// read it in binary, a Buffer
	//return readTextFile(filePath, {encoding: null})// no turns into utf8
	return fsp.readFile(filePath)
	.then(contents  => {
		if (traceControlFlow) {
			let type = typeof contents;
			if (contents == 'object')
				type = contents.constructor.name;
			console.log(`read the file ${filePath} which yields a ${type} of  ${contents.length} bytes.`);
		}

		return fsp.writeFile(outputPath, contents, {encoding: null})
		.then(rv => {
			nFilesPassedThru++;
			if (traceControlFlow)
				console.log(`wrote the file ${outputPath}`);
			return `${filePath.replace('docSrc/', '')} → ${outputPath.replace('../public/doc/', '')}`;
		});
	});
}


// Actually some of these are like megabyte videos; do it with a symlink.  npm
// build will copy over to the build directory either way.  returns a promise
// like all other functions around here.
function symlinkFile(filePath) {
	let outputPath = makeOutputPath(filePath);

	// what goes into the symlink, which is at the outputPath.
	// Must start with how many directories deep the symlink is.
	let targetPath = `../docGen/${filePath}`
	let m = filePath.matchAll(/\//g);
	for (let stuff of m) targetPath = '../' + targetPath;

	if (traceControlFlow)
		console.log(`about to symlink file ${filePath} to file ${outputPath}`);

	nFilesSymlinked++;
	return fsp.symlink(targetPath, outputPath);
}


// it's a file, but what kind?  trust the suffix.
function compileAFile(filePath) {
	console.log(`compileDocs: compileAFile: ${filePath}`);
	if (filePath.endsWith('.DS_Store'))
		return `${filePath} avoided`;
	let dot = filePath.lastIndexOf('.');
	if (dot < 0)
		return Promise.reject(`file ${filePath} has no dot in name`);

	nFilesTried++;
	switch (filePath.substr(dot+1)) {
	case 'md':
		return compileAnMDFile(filePath);

	// maybe someday there will be more file types?

	// copy over image files, video files, ...
	default:
		return symlinkFile(filePath);
	}
}

/* ************************************************************* directories */

// without a slash on the front or end of path
function compileADir(dirPath) {
	let docPath = makeOutputPath(dirPath);
	console.log(`compileDocs: compileADir: ${dirPath}`);

	// don't forget to actually CREATE the directory!
	// "Calling .mkdir() when path exists doesn't error when recursive is true."
	return fsp.mkdir(docPath, {recursive: true})
	.then(() => fsp.readdir(dirPath, {withFileTypes: true}))
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
			// you'll need fsPromises.realpath(path[, options]) to do this right
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
	const fsc = fs.constants;
	if ((info.mode & fsc.S_IFMT) == fsc.S_IFREG)
		return compileAFile(path);
	else if ((info.mode & fsc.S_IFMT) == fsc.S_IFDIR)
		return compileADir(path);
	else
		console.error(`${path} is not a file or dir, punting on this one`);
}

/* ************************************************************* main */

// prompt so I don't delete a bunch of files by accident.
// these things don't do promises so we have to make our own.
function promptAndDelete() {
	return new Promise((succeed, fail) => {
		exec('ls -mFA .',
			{cwd: `${process.env.SQUISH_ROOT}/public/doc`, encoding: 'utf8'},
			(err, lsResult, stderr) => {
				if (err) {
					console.error(stderr);
					throw err;
				}
				console.log(lsResult);

				// ask user if that's ok to delete.  prompt: doesn't seem to work
				console.log(`We're going to delete those ⬆︎ files in public/doc.
				Return to continue? or ^C to avoid the whole thing  `);
				const rl = readline.createInterface({input: process.stdin, output: process.stdout});
				rl.on('SIGINT', () => process.exit(0));
				rl.on('line', line => {
					// user has assented
					// I sure hope I don't shoot myself in the foot with this.
					console.log(execSync('rm -rfv *',
						{cwd: `${process.env.SQUISH_ROOT}/public/doc`, encoding: 'utf8'}));

					succeed();
				});
			}
		);

	});
}


// main, runs only after the frags have been loaded
function processArgv() {
	whatTime('start of processArgv');

	// futz with argv cuz sometimes node is argv[0] and other times this script is
	let argv = [...process.argv];
	argv.shift()
	let second = argv.shift();
	if (second && !second.includes('docGen/compileDocs.js'))
		argv.unshift(second);

	nFilesTried = nFilesPassedThru = nFilesSymlinked =
		nMDFilesCompiled = nDirsWalked = 0;
	if ('--batch' == argv[0]) {
		// during production build
		console.log(`build docs for production`);
		return compileADir('docSrc');
	}
	else if (argv.length <= 0) {
		// do it all, interactively
		return promptAndDelete()
		.then(() => compileADir('docSrc'));
	}
	else {
		// process just the listed files
		return Promise.allSettled(
			argv.map(arg => compileFileOrDir(arg))
		);
	}
}

function readInitFiles() {
	// read ALL of the general files (other than sources) we'll need to do this
	let proms = [
		// i guess there's only one right now
		readTextFile('template.html'),
	];

	return Promise.all(proms)
	.then(contentz => {
		[template] = contentz;
		return processArgv();
	})
	.catch(ex => catchException(ex, `loading something in compileDocs`));
}


function generate() {
	readInitFiles()
	.then(processArgvResults => {
		whatTime('finished promises');

		console.log(`${nDirsWalked} directories scanned`);
		console.log(`${nFilesTried} files read`);
		console.log(`${nFilesPassedThru} files copied verbatim to the doc directory`);
		console.log(`${nFilesSymlinked} files symlinked into the doc directory`);

		console.log(`${nMDFilesCompiled} MarkDown files compiled to HTML`);

		if (traceFinalPromiseResult)
			console.log(`main results:`, mainResults);

		if (traceFinalDocDir) {
			const opts = {cwd: '../public/doc'};
			exec(`ls -lR`, opts, (error, stdout, stderr) => {
				console.log('resulting doc dir:\n' + stdout);
				if (error || stderr) {
					console.error(stderr, error);
					process.exit(7);
				}
				else {
					whatTime('done with exec ls');
					process.exit(0);
				}
			});
		}
		else {
			process.exit(0);
		}
	})
	.catch(ex => catchException(ex, 'compileDocs program'));
}

generate();

