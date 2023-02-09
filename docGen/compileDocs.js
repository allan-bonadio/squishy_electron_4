#!/usr/bin/env node

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import {exec, execSync} from 'node:child_process';
import readline from 'node:readline';

import YAML from 'yaml';

import {marked} from 'marked';
import markedKatex from 'marked-katex-extension';

let traceDetails = false;
let traceWhatTime = false;
let traceFinalDocDir = true;
let traceFinalPromiseResult = false;

/*
** The documentation is served from the public/doc directory, which contains mostly .html files.
** during writing, the docGen directory serves as a proxy.  Both have symlinks into the
** katex directory for the katex.css file and the fonts.
*/

const whatTime =
(where) => traceWhatTime && console.log(`⏱  ${where} ${performance.now()}`);
whatTime('start of app running');

const markdOptions = {
	gfm: true,
	headerIds: true,
	headerPrefix: 'doc',
	smartypants: true,  // i may be asking for trouble
};

const katexOptions = {output: 'mathml'};
marked.use(markedKatex(katexOptions));


// this will wrap each compiled MD piece
let template;
let nDirsWalked, nFilesTried, nFilesPassedThru, nFilesSymlinked, nMDFilesCompiled;

console.log(`•••••••••• compile docs with Markd + katex`);

if (!process.env.SQUISH_ROOT) {
	console.error(`Must define env var SQUISH_ROOT!`);
	process.exit(1);
}
process.chdir(process.env.SQUISH_ROOT +`/docGen`);

/*
**  Most of these functions return Promises.  They settle when it's task is done.
**  It's all asynchronous and very fast.
**
**  Don't break the chain by returning nothing!  .then() will turn it into
**  an immediately-resolved promise resolving in undefined.
**  Then, your function probably won't get a chance to run!
*/

/* ************************************************************* traversing and compiling */

// figure out where this compiled file should go.
// suffix should NOT have a dot; we'll add one
function makeOutputPath(inputPath, suffix = '') {
	let out = inputPath.replace(/docSrc/, '../public/doc')
	if (suffix)
		out = out.replace(/\.\w+$/, `.${suffix}`);
	return out;
}

// standard, start to read a file and return promise
const readTextFile =
(filePath) => fsp.readFile(filePath, {encoding: 'utf8'});

// for promise catchers
const catchException =
(ex, where) => {
	console.error(`Error ${where}:`, ex.stack ?? ex.message ?? ex);
	debugger;
}

// take the conte3nts of an md file, and other info, and plug stuff into the
// template, to get the resulting .html file contents.
function populateMDTemplate(contents, mdPath) {
	debugger;
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
	console.info(`the yaml: ''${yaml}''`);
	if (yaml) {
		try {
			// if present, that yaml block can override any other variables
			let js = YAML.parse(yaml);
			console.info(`the resulting object: `, js);
		} catch (ex) {
			js = {description: ex.message};
			console.error(`parsing yaml, ${ex.message}, but parsing will continue`);
		}
		Object.assign(variables, js);
	}

	// final templating plugins.  Any var that's not in the template never shows up.
	let html = template;
	for (let key in variables) {
		html = html.replace(`〖${key}〗`, variables[key]);
	}
	//html = template
	//	.replace('〖body〗', html)
	//	.replace('〖title〗', title)
	//	.replace('〖fromFile〗', mdPath)
	//	.replace('〖description〗', 'info for squishy electron')
	//	.replace('〖buildTime〗', (new Date()).toLocaleString());
	if (traceDetails)
		console.log(`txlated the md file ${mdPath}! for html ${html.length} bytes.`);
	return html;
}


// a .md file
function compileAnMDFile(mdPath) {
	let htmlPath = makeOutputPath(mdPath, 'html');
	if (traceDetails)
		console.log(`about to compile md file ${mdPath} to html file ${htmlPath}`);

	return readTextFile(mdPath, {encoding: 'utf8'})
	.then(contents => {
		if (traceDetails)
			console.log(`read the md file ${mdPath}!  ${contents.length} bytes.`);

		let html = populateMDTemplate(contents, mdPath);

		return fsp.writeFile(htmlPath, html, {encoding: 'utf8'})
		.then(rv => {
			if (traceDetails)
				console.log(`wrote the HTML file ${htmlPath}`);
		});
	})
	.then(contents => {
		if (traceDetails)
			console.log(`read ${mdPath} to ${htmlPath}`);
		nMDFilesCompiled++;
		return `${mdPath.replace('docSrc/', '')} → ${htmlPath.replace('../public/doc/', '')}`;
	})
	.catch(ex => catchException(ex, `compiling  ${mdPath} to ${htmlPath}`));
}


// something else, passthru.  actually not used.
function copyOverFile(filePath) {
	let outputPath = makeOutputPath(filePath);
	if (traceDetails)
		console.log(`about to copy file ${filePath} to file ${outputPath}`);

	// read it in binary, a Buffer
	//return readTextFile(filePath, {encoding: null})// no turns into utf8
	return fsp.readFile(filePath)
	.then(contents  => {
		if (traceDetails) {
			let type = typeof contents;
			if (contents == 'object')
				type = contents.constructor.name;
			console.log(`read the file ${filePath} which yields a ${type} of  ${contents.length} bytes.`);
		}

		return fsp.writeFile(outputPath, contents, {encoding: null})
		.then(rv => {
			nFilesPassedThru++;
			if (traceDetails)
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
	if (traceDetails)
		console.log(`about to symlink file ${filePath} to file ${outputPath}`);

	nFilesSymlinked++;

	// so the symlink path needs to be relative to the output symlink file.
	// up 2 public/doc, to the repo root, then across into the docSrc dir
	// boy so much simpler.
	return fsp.symlink(`../../docGen/${filePath}`, outputPath);
}


// it's a file, but what kind?  trust the suffix.
function compileAFile(filePath) {
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

// without a slash on the front or end of path
function compileADir(dirPath) {
	let docPath = makeOutputPath(dirPath);

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

// main, runs only after the frags have been loaded
function main() {
	whatTime('start of main');

	// futz with argv cuz sometimes node is argv[0] and other times this script is
	let argv = [...process.argv];
	argv.shift()
	let second = argv.shift();
	if (second && !second.includes('compileDocs'))
		argv.unshift(second);

	nFilesTried = nFilesPassedThru = nFilesSymlinked =
		nMDFilesCompiled = nDirsWalked = 0;
	if (argv.length > 0) {
		// process just the listed files
		return Promise.allSettled(
			argv.map(arg => compileFileOrDir(arg))
		);
	}

	else {
		// do it all
		return compileFileOrDir('docSrc');
	}
}

function readInitFiles() {
	let proms = [
		readTextFile('template.html'),
	];

	return Promise.all(proms)
	.then(contentz => {
		[template] = contentz;
		return main();
	})
	.catch(ex => catchException(ex, `loading something in compileDocs`));
}


function generate() {
	readInitFiles()
	.then(mainResults => {
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
			exec(`ls -l`, opts, (error, stdout, stderr) => {
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
	})
	.catch(ex => catchException(ex, 'compileDocs program'));
}

/* ************************************************************* startup */
// this runs first.  prompt so I don't delete a bunch of files by accident.
console.log(execSync('ls -m *',
	{cwd: `${process.env.SQUISH_ROOT}/public/doc`, encoding: 'utf8'}));

// prompt: doesn't seem to work
console.log(`We're going to delete those ⬆︎ files in public/doc.  continue? or ^C  `);
const rl = readline.createInterface({input: process.stdin, output: process.stdout});
rl.on('SIGINT', () => process.exit(0));

rl.on('line', line => {
	// I sure hope I don't shoot myself in the foot with this.
	console.log(execSync('rm -rfv *',
		{cwd: `${process.env.SQUISH_ROOT}/public/doc`, encoding: 'utf8'}));

	generate();
})

