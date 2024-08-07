/*
** vao Dump -- show me what's in a vao
** Copyright (C) 2023-2024 Tactile Interactive, all rights reserved
*/

// this sure doesn't enlighten any.  I was hoping to get info about the current VAO.
// maybe i'm not doing it right

/* ********************************************************************* dump VAO info */
let attrInfos = ['ARRAY_BUFFER_BINDING', 'ARRAY_ENABLED', 'ARRAY_SIZE', 'ARRAY_STRIDE',
	'ARRAY_TYPE', 'ARRAY_NORMALIZED', ];
let attrTypes = {
	[gl.BYTE]: 'Byte',
	[gl.UNSIGNED_BYTE]: 'Unsigned_Byte',
	[gl.SHORT]: 'Short',
	[gl.UNSIGNED_SHORT]: 'Unsigned_Short',
	[gl.FLOAT]: 'Float',
};

// dump one attribute  buffer, to console
dumpOneAttr(gl, id, name = '') {
	const gl = this.gl;
	console.log(`    𒑐attr ${id} ${name}`);
	abstractDrawing.attrInfos.forEach(ai => {
		let res = gl.getVertexAttrib(id, gl[`VERTEX_ATTRIB_${ai}`]);
		if ('ARRAY_TYPE' == ai)
			res = abstractDrawing.attrTypes[res] ?? res;
		console.log(`        𒑐${ai} = `, res);
	});

	console.log(`        𒑐CURRENT_VERTEX_ATTRIB = `,
		gl.getVertexAttrib(id, gl.CURRENT_VERTEX_ATTRIB));
}

// this works on the current vao, or the static thing if none
dumpAttrNames(gl, title) {
	//console.log(`abstractDrawing.attrTypes=`, abstractDrawing.attrTypes);

	//console.log(`𒑐 dumpAttrNames for viewdef ${this.viewName} drawing ${this.drawingName}: ${title}`);
	//this.viewDef.attrVariableNames
	//this.this.gl.getAttribLocation(drawing.program, varName);

	// go thru all the names that should be there
//		this.viewDef.attrVariableNames.forEach(name => {
//			let id = gl.getAttribLocation(this.program, name);
//			if (id < 0)
//				console.log(`    𒑐dumpAttrNames: sorry, attr '${name}' not found`);
//			else
//				this.dumpOneAttr(id, name);
//		});

	console.log(`    𒑐 dumpAttrNames each id:`);
	// try the first several ids that should be there
	for (let id = 0; id < 5; id++) {
		this.dumpOneAttr(gl, id);
		// gl.CURRENT_VERTEX_ATTRIB
		// Returns a Float32Array (with 4 elements) representing the current
		// value of the vertex attribute at the given index.
	}
}

/* ********************************************************************** jjjjj */


	/* ******************************************************* debugging tips  */

//	debug1() {
//		const gl = this.gl
//
//		// prints mfg and model of GPU.  yawn.
//		const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
//		const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
//		const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
//		console.log(`--- debug_renderer_info: vendor='${vendor}' renderer='${renderer}'`);
//
//		// prints src of shaders, decompiled after compilation.  Fairly interesting; not all that useful.
//		const ds = gl.getExtension('WEBGL_debug_shaders');
//		var vSrc = ds.getTranslatedShaderSource(this.vertexShader);
//		var fSrc = ds.getTranslatedShaderSource(this.fragmentShader);
//		console.log(`--- vertexShader:
//${vSrc}
//--- fragmentShader:
//${fSrc}
//`);

		// also try this URL in chrome...    chrome://web-app-internals/
		// ---------- not that useful; nothing to do with WebGL
		// after enabling it here: chrome://flags/#enable-webgl-draft-extensions
		// or is it heree??!?!    chrome://flags/#record-web-app-debug-info
		// firefox: webgl.enable-draft-extensions in Firefox

		// try this on flores after restarting chrome since Jun 12: chrome://memories/
		// enabled here in chrome:      chrome://flags/#memories-debug

		// cool, list all exts:
//		const available_extensions = gl.getSupportedExtensions();
//		console.log(`--- available GL extensions:\n${available_extensions.join('\n')}`);
//	}

	//static viewClassName: 'abstractScene';

}
/* *********************************************************** end of CFTW */

