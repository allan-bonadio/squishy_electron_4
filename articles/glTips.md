
	/* ******************************************************* webgl debugging tips  */

//	 prints mfg and model of GPU.  yawn.
	const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
	const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
	const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
	console.log(`--- debug_renderer_info: vendor='${vendor}' renderer='${renderer}'`);

// prints src of shaders, decompiled after compilation.  Fairly interesting; not all that useful.
	const ds = gl.getExtension('WEBGL_debug_shaders');
	var vSrc = ds.getTranslatedShaderSource(this.vertexShader);
	var fSrc = ds.getTranslatedShaderSource(this.fragmentShader);
	console.log(`--- vertexShader:
${vSrc}
--- fragmentShader:
${fSrc}
`);


also try this URL in chrome...    chrome://web-app-internals/
---------- not that useful; nothing to do with WebGL
after enabling it here: chrome://flags/#enable-webgl-draft-extensions
or is it heree??!?!    chrome://flags/#record-web-app-debug-info
firefox: webgl.enable-draft-extensions in Firefox

try this on flores after restarting chrome since Jun 12: chrome://memories/
enabled here in chrome:      chrome://flags/#memories-debug

cool, list all exts:
	const available_extensions = gl.getSupportedExtensions();
	console.log(`--- available GL extensions:\n${available_extensions.join('\n')}`);

