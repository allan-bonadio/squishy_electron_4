/*
** curiosity -- code to retrieve interesting info from WebGL
** Copyright (C) 2021-2026 Tactile Interactive, all rights reserved
*/

//const URL_PREFIX = 'https://developer.mozilla.org';

// I think you have to run this from some HTML context

function raceThruAll(gl, funcName, arg, kList) {
	const wgl2 = !(gl.VERSION == 7938);  // for now

	kList.forEach(k => {
		if ('WebGL2' != k.only || wgl2) {
			let desc = (k.desc || '').trim();
			if (k.desc2) desc += ' '+ k.desc2.trim();
			if (k.desc3) desc += ' '+ k.desc3.trim();
			if (k.type) desc += k.type.trim();
			if (k.url) desc += k.url.trim();

			let result = null;
			try {
				result = gl[funcName](arg, gl[k.code]);
			} catch (ex) {
				result = 'error '+ ex.toString();
			}

			console.log(`gl.${funcName}(${k.code}) = `+
				result + '\n %c 🤷🏽‍♀️ %c' + desc,
				'font-size: 2em; backgroundColor: white; padding: 2px;', '');
		}
	});
}

export function curioShader(gl, shader) {

	const shaderLabel = gl.getShaderParameter(shader, gl.SHADER_TYPE) > 35632
		? 'vertex shader 35633'
		: 'frag shader 35632';

	const keywords = [
	{code: 'DELETE_STATUS',
		desc: "Returns a GLboolean indicating whether or not the shader is flagged for deletion."},
	{code: 'COMPILE_STATUS',
		desc: "Returns a GLboolean indicating whether or not the last shader compilation was successful."},
	{code: 'SHADER_TYPE',
		desc: "Returns a GLenum indicating whether the shader is a vertex shader (gl.VERTEX_SHADER) or fragment shader (gl.FRAGMENT_SHADER) object."},
	];

	console.log(`≡≡≡≡≡≡≡≡≡≡≡≡ getShaderParameter for ${shaderLabel}`);
	raceThruAll(gl, 'getShaderParameter', shader, keywords);
}

export function curioProgram(gl, program) {

	const keywords = [
	{code: 'DELETE_STATUS',
		desc: "Returns a GLboolean indicating whether or not the program is flagged for deletion."},
	{code: 'LINK_STATUS',
		desc: "Returns a GLboolean indicating whether or not the last link operation was successful."},
	{code: 'VALIDATE_STATUS',
		desc: "Returns a GLboolean indicating whether or not the last validation operation was successful."},
	{code: 'ATTACHED_SHADERS',
		desc: "Returns a GLint indicating the number of attached shaders to a program."},
	{code: 'ACTIVE_ATTRIBUTES',
		desc: "Returns a GLint indicating the number of active attribute variables to a program."},
	{code: 'ACTIVE_UNIFORMS',
		desc: "Returns a GLint indicating the number of active uniform variables to a program."},

	// When using a WebGL 2 context, the following values are available additionally:
{code: 'TRANSFORM_FEEDBACK_BUFFER_MODE', only: 'WebGL2',
	desc: "Returns a GLenum indicating the buffer mode when transform feedback is active. May be gl.SEPARATE_ATTRIBS or gl.INTERLEAVED_ATTRIBS."},
{code: 'TRANSFORM_FEEDBACK_VARYINGS', only: 'WebGL2',
	desc: "Returns a GLint indicating the number of varying variables to capture in transform feedback mode."},
{code: 'ACTIVE_UNIFORM_BLOCKS', only: 'WebGL2',
	desc: "Returns a GLint indicating the number of uniform blocks containing active uniforms."},
	];

	console.log(`≡≡≡≡≡≡≡≡≡≡≡≡ getProgramParameter`);
	raceThruAll(gl, 'getProgramParameter', program, keywords);

}

export function curioParameter(gl) {

const keywords = [

	/* ************************************************* webgl 1 */

	{code: 'ACTIVE_TEXTURE',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum'},
	{code: 'ALIASED_LINE_WIDTH_RANGE',
		url: '/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array', type: 'Float32Array  (with 2 elements)'},
	{code: 'ALIASED_POINT_SIZE_RANGE',
		url: '/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array', type: 'Float32Array  (with 2 elements)',},
	{code: 'ALPHA_BITS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',},
	{code: 'ARRAY_BUFFER_BINDING',
		url: '/en-US/docs/Web/API/WebGLBuffer', type: 'WebGLBuffer',},
	{code: 'BLEND',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLboolean',},
	{code: 'BLEND_COLOR',
		url: '/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array', type: 'Float32Array  (with 4 values)',},
	{code: 'BLEND_DST_ALPHA',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum',},
	{code: 'BLEND_DST_RGB',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum',},
	{code: 'BLEND_EQUATION',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum',},
	{code: 'BLEND_EQUATION_ALPHA',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum',},
	{code: 'BLEND_EQUATION_RGB',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum',},
	{code: 'BLEND_SRC_ALPHA',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum',},
	{code: 'BLEND_SRC_RGB',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum',},
	{code: 'BLUE_BITS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',},
	{code: 'COLOR_CLEAR_VALUE',
		url: '/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array', type: 'Float32Array (with 4 values)',},
	{code: 'COLOR_WRITEMASK',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLboolean (with 4 values)',},
	{code: 'COMPRESSED_TEXTURE_FORMATS',
		url: '/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array', type: 'Uint32Array',
		desc: 'Returns the compressed texture formats.'},


	{code: 'CULL_FACE',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLboolean',},
	{code: 'CULL_FACE_MODE',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum',
		desc: 'gl.FRONT, gl.BACK or gl.FRONT_AND_BACK',
			desc2: 'see also /en-US/docs/Web/API/WebGLRenderingContext/cullFace',},
	{code: 'CURRENT_PROGRAM',
		url: '/en-US/docs/Web/API/WebGLProgram', type: 'WebGLProgram',
			desc3: 'See /en-US/docs/Web/API/WebGLRenderingContext/useProgram' },
	{code: 'DEPTH_BITS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',},
	{code: 'DEPTH_CLEAR_VALUE',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLfloat',},
	{code: 'DEPTH_FUNC',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum',},
	{code: 'DEPTH_RANGE',
		url: '/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array', type: 'Float32Array  (with 2 elements)',},
	{code: 'DEPTH_TEST',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLboolean',},
	{code: 'DEPTH_WRITEMASK',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLboolean',},
	{code: 'DITHER',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLboolean',},
	{code: 'ELEMENT_ARRAY_BUFFER_BINDING',
		url: '/en-US/docs/Web/API/WebGLBuffer', type: 'WebGLBuffer',},
	{code: 'FRAMEBUFFER_BINDING',
		url: '/en-US/docs/Web/API/WebGLFramebuffer', type: 'WebGLFramebuffer or null',
			desc: ' corresponds to a binding to the default framebuffer. See also '+
				'/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer'},
	{code: 'FRONT_FACE',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum',
		desc: 'gl.CW or gl.CCW. See also /en-US/docs/Web/API/WebGLRenderingContext/frontFace'},
	{code: 'GENERATE_MIPMAP_HINT',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum',
		desc: 'gl.FASTEST, gl.NICEST or gl.DONT_CARE.',
		desc3: 'See also /en-US/docs/Web/API/WebGLRenderingContext/hint',},
	{code: 'GREEN_BITS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',},
	{code: 'IMPLEMENTATION_COLOR_READ_FORMAT',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum',},
	{code: 'IMPLEMENTATION_COLOR_READ_TYPE',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum',},
	{code: 'LINE_WIDTH',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLfloat',},
	{code: 'MAX_COMBINED_TEXTURE_IMAGE_UNITS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',},
	{code: 'MAX_CUBE_MAP_TEXTURE_SIZE',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',},
	{code: 'MAX_FRAGMENT_UNIFORM_VECTORS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',},
	{code: 'MAX_RENDERBUFFER_SIZE',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',},
	{code: 'MAX_TEXTURE_IMAGE_UNITS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',},
	{code: 'MAX_TEXTURE_SIZE',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',},
	{code: 'MAX_VARYING_VECTORS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',},
	{code: 'MAX_VERTEX_ATTRIBS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',},
	{code: 'MAX_VERTEX_TEXTURE_IMAGE_UNITS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',},
	{code: 'MAX_VERTEX_UNIFORM_VECTORS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',},
	{code: 'MAX_VIEWPORT_DIMS',
		url: '/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int32Array',
		type: 'Int32Array (with 2 elements)',},
	{code: 'PACK_ALIGNMENT',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',},
	{code: 'POLYGON_OFFSET_FACTOR',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLfloat',},
	{code: 'POLYGON_OFFSET_FILL',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLboolean',},
	{code: 'POLYGON_OFFSET_UNITS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLfloat',},
	{code: 'RED_BITS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',},
	{code: 'RENDERBUFFER_BINDING',
		url: '/en-US/docs/Web/API/WebGLRenderbuffer',
		type: 'WebGLRenderbuffer bindRenderbuffer',
		desc: 'See /en-US/docs/Web/API/WebGLRenderingContext/bindRenderbuffer',},
	{code: 'RENDERER',
		url: '/en-US/docs/Web/API/DOMString', type: 'DOMString',},
	{code: 'SAMPLE_BUFFERS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',},
	{code: 'SAMPLE_COVERAGE_INVERT',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLboolean',},
	{code: 'SAMPLE_COVERAGE_VALUE',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLfloat',},
	{code: 'SAMPLES',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'SCISSOR_BOX',
		url: '/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int32Array',
		type: 'Int32Array (with 4 elements)'},
	{code: 'SCISSOR_TEST',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLboolean'},
	{code: 'SHADING_LANGUAGE_VERSION',
		url: '/en-US/docs/Web/API/DOMString', type: 'DOMString'},
	{code: 'STENCIL_BACK_FAIL',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum'},
	{code: 'STENCIL_BACK_FUNC',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum'},
	{code: 'STENCIL_BACK_PASS_DEPTH_FAIL',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum'},
	{code: 'STENCIL_BACK_PASS_DEPTH_PASS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum'},
	{code: 'STENCIL_BACK_REF',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'STENCIL_BACK_VALUE_MASK',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLuint'},
	{code: 'STENCIL_BACK_WRITEMASK',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLuint'},
	{code: 'STENCIL_BITS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'STENCIL_CLEAR_VALUE',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'STENCIL_FAIL',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum'},
	{code: 'STENCIL_FUNC',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum'},
	{code: 'STENCIL_PASS_DEPTH_FAIL',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum'},
	{code: 'STENCIL_PASS_DEPTH_PASS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum'},
	{code: 'STENCIL_REF',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'STENCIL_TEST',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLboolean'},
	{code: 'STENCIL_VALUE_MASK',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLuint'},
	{code: 'STENCIL_WRITEMASK',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLuint'},
	{code: 'SUBPIXEL_BITS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'TEXTURE_BINDING_2D',
		url: '/en-US/docs/Web/API/WebGLTexture', type: 'WebGLTexture or null'},
	{code: 'TEXTURE_BINDING_CUBE_MAP',
		url: '/en-US/docs/Web/API/WebGLTexture', type: 'WebGLTexture or null'},
	{code: 'UNPACK_ALIGNMENT',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'UNPACK_COLORSPACE_CONVERSION_WEBGL',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum'},
	{code: 'UNPACK_FLIP_Y_WEBGL',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLboolean'},
	{code: 'UNPACK_PREMULTIPLY_ALPHA_WEBGL',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLboolean'},
	{code: 'VENDOR',
		url: '/en-US/docs/Web/API/DOMString', type: 'DOMString'},
	{code: 'VERSION',
		url: '/en-US/docs/Web/API/DOMString', type: 'DOMString'},
	{code: 'VIEWPORT',
		url: '/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int32Array',
		type: 'Int32Array (with 4 elements)'},

	// no!  this isn't then end!  see shortly below];  // end of keywords


	/* *************************************************************************** webgl 2 */


	// only: 'WebGL2'

	{code: 'COPY_READ_BUFFER_BINDING',
		url: '/en-US/docs/Web/API/WebGLBuffer', type: 'WebGLBuffer',
		desc: 'null See /en-US/docs/Web/API/WebGLRenderingContext/bindBuffer'},
	{code: 'COPY_WRITE_BUFFER_BINDING',
		url: '/en-US/docs/Web/API/WebGLBuffer', type: 'WebGLBuffer',
		desc: 'See /en-US/docs/Web/API/WebGLRenderingContext/bindBuffer'},
	{code: 'DRAW_BUFFER<em>i</em>',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum',
		desc: `gl.BACK, gl.NONE or,  gl.COLOR_ATTACHMENT{0-15}. See also`
			+ ` /en-US/docs/Web/API/WebGL2RenderingContext/drawBuffers`},
	{code: 'DRAW_FRAMEBUFFER_BINDING',
		url: '/en-US/docs/Web/API/WebGLFramebuffer', type: 'WebGLFramebuffer',
		desc: 'or null null corresponds to a binding to the default framebuffer. See also  /en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer'},
	{code: 'FRAGMENT_SHADER_DERIVATIVE_HINT',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum',
		desc: 'gl.FASTEST, gl.NICEST or gl.DONT_CARE. See also /en-US/docs/Web/API/WebGLRenderingContext/hint'},
	{code: 'MAX_3D_TEXTURE_SIZE',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MAX_ARRAY_TEXTURE_LAYERS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MAX_CLIENT_WAIT_TIMEOUT_WEBGL',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint64'},
	{code: 'MAX_COLOR_ATTACHMENTS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint64'},
	{code: 'MAX_COMBINED_UNIFORM_BLOCKS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint64'},
	{code: 'MAX_DRAW_BUFFERS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MAX_ELEMENT_INDEX',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint64'},
	{code: 'MAX_ELEMENTS_INDICES',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MAX_ELEMENTS_VERTICES',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MAX_FRAGMENT_INPUT_COMPONENTS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MAX_FRAGMENT_UNIFORM_BLOCKS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MAX_FRAGMENT_UNIFORM_COMPONENTS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MAX_PROGRAM_TEXEL_OFFSET',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MAX_SAMPLES',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MAX_SERVER_WAIT_TIMEOUT',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint64'},
	{code: 'MAX_TEXTURE_LOD_BIAS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLfloat'},
	{code: 'MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MAX_UNIFORM_BLOCK_SIZE',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint64'},
	{code: 'MAX_UNIFORM_BUFFER_BINDINGS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MAX_VARYING_COMPONENTS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MAX_VERTEX_OUTPUT_COMPONENTS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MAX_VERTEX_UNIFORM_BLOCKS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MAX_VERTEX_UNIFORM_COMPONENTS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'MIN_PROGRAM_TEXEL_OFFSET',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint'},
	{code: 'PACK_ROW_LENGTH',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',
		desc: 'See /en-US/docs/Web/API/WebGLRenderingContext/pixelStorei'},
	{code: 'PACK_SKIP_PIXELS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',
		desc: 'See /en-US/docs/Web/API/WebGLRenderingContext/pixelStorei'},
	{code: 'PACK_SKIP_ROWS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',
		desc: 'See /en-US/docs/Web/API/WebGLRenderingContext/pixelStorei'},
	{code: 'PIXEL_PACK_BUFFER_BINDING',
		url: '/en-US/docs/Web/API/WebGLBuffer', type: 'WebGLBuffer',
		desc: 'See /en-US/docs/Web/API/WebGLRenderingContext/bindBuffer'},
	{code: 'PIXEL_UNPACK_BUFFER_BINDING',
		url: '/en-US/docs/Web/API/WebGLBuffer', type: 'WebGLBuffer',
		desc: 'See /en-US/docs/Web/API/WebGLRenderingContext/bindBuffer'},
	{code: 'RASTERIZER_DISCARD',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLboolean'},
	{code: 'READ_BUFFER',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLenum'},
	{code: 'READ_FRAMEBUFFER_BINDING',
		url: '/en-US/docs/Web/API/WebGLFramebuffer',
		type: 'WebGLFramebuffer  or null null corresponds to a binding to the default framebuffer. '+
			'See also /en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer'},
	{code: 'SAMPLE_ALPHA_TO_COVERAGE',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLboolean'},
	{code: 'SAMPLE_COVERAGE',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLboolean'},
	{code: 'SAMPLER_BINDING',
		url: '/en-US/docs/Web/API/WebGLSampler', type: 'WebGLSampler',
		desc: 'See /en-US/docs/Web/API/WebGL2RenderingContext/bindSampler'},
	{code: 'TEXTURE_BINDING_2D_ARRAY',
		url: '/en-US/docs/Web/API/WebGLTexture', type: 'WebGLTexture',
		desc: 'See /en-US/docs/Web/API/WebGLRenderingContext/bindTexture'},
	{code: 'TEXTURE_BINDING_3D',
		url: '/en-US/docs/Web/API/WebGLTexture', type: 'WebGLTexture',
		desc: 'See /en-US/docs/Web/API/WebGLRenderingContext/bindTexture'},
	{code: 'TRANSFORM_FEEDBACK_ACTIVE',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLboolean'},
	{code: 'TRANSFORM_FEEDBACK_BINDING',
		url: '/en-US/docs/Web/API/WebGLTransformFeedback', type: 'WebGLTransformFeedback',
		desc: 'See /en-US/docs/Web/API/WebGL2RenderingContext/bindTransformFeedback'},
	{code: 'TRANSFORM_FEEDBACK_BUFFER_BINDING',
		url: '/en-US/docs/Web/API/WebGLBuffer', type: 'WebGLBuffer',
		desc: 'See /en-US/docs/Web/API/WebGLRenderingContext/bindBuffer'},
	{code: 'TRANSFORM_FEEDBACK_PAUSED',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLboolean'},
	{code: 'UNIFORM_BUFFER_BINDING',
		url: '/en-US/docs/Web/API/WebGLBuffer', type: 'WebGLBuffer',
		desc: 'See /en-US/docs/Web/API/WebGLRenderingContext/bindBuffer'},
	{code: 'UNIFORM_BUFFER_OFFSET_ALIGNMENT',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',
		desc: 'See /en-US/docs/Web/API/WebGLRenderingContext/pixelStorei'},
	{code: 'UNPACK_IMAGE_HEIGHT',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',
		desc: 'See /en-US/docs/Web/API/WebGLRenderingContext/pixelStorei'},
	{code: 'UNPACK_ROW_LENGTH',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',
		desc: 'See /en-US/docs/Web/API/WebGLRenderingContext/pixelStorei'},
	{code: 'UNPACK_SKIP_IMAGES',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',
		desc: 'See /en-US/docs/Web/API/WebGLRenderingContext/pixelStorei'},
	{code: 'UNPACK_SKIP_PIXELS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',
		desc: 'See /en-US/docs/Web/API/WebGLRenderingContext/pixelStorei'},
	{code: 'UNPACK_SKIP_ROWS',
		url: '/en-US/docs/Web/API/WebGL_API/Types', type: 'GLint',
		desc: 'See /en-US/docs/Web/API/WebGLRenderingContext/pixelStorei'},
	{code: 'VERTEX_ARRAY_BINDING',
		url: '/en-US/docs/Web/API/WebGLVertexArrayObject', type: 'WebGLVertexArrayObject',
		desc: 'See /en-US/docs/Web/API/WebGL2RenderingContext/bindVertexArray'},
	];

	console.log(`≡≡≡≡≡≡≡≡≡≡≡≡ getParameter`);
	raceThruAll(gl, 'getParameter', null, keywords);

}

export function curioAUB(gl, vShader, fShader, program, ) {
	throw 'not implemented yet';

//	const keywords = [
//	{code: 'UNIFORM_BLOCK_BINDING',
//		desc: "Returns a GLuint indicating the uniform buffer binding point."},
//	{code: 'UNIFORM_BLOCK_DATA_SIZE',
//		desc: "Returns a GLuint indicating the minimum total buffer object size."},
//	{code: 'UNIFORM_BLOCK_ACTIVE_UNIFORMS',
//		desc: "Returns a GLuint indicating the number of active uniforms in the uniform block."},
//	{code: 'UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES',
//		desc: "Returns a Uint32Array indicating the list of active uniforms in the uniform block."},
//	{code: 'UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER',
//		desc: "Returns a GLboolean indicating whether the uniform block is referenced by the vertex shader."},
//	{code: 'UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER',
//		desc: "Returns a GLboolean indicating whether the uniform block is referenced by the fragment shader."},
//	];
//
//	console.log(`≡≡≡≡≡≡≡≡≡≡≡≡ getParameter`);
//	raceThruAll(gl, 'getAUBParameter', null, keywords);
}




/*
"getBufferParameter",
		"getFramebufferAttachmentParameter",
		"getParameter",
		"getProgramParameter",
		"getRenderbufferParameter",
		"getShaderParameter",
		"getTexParameter",

any gl.getActiveUniformBlockParameter(program, uniformBlockIndex, pname);
Copy to Clipboard
Parameters
program
A WebGLProgram containing the active uniform block.
uniformBlockIndex
A GLuint specifying the index of the active uniform block within the program.
pname
A GLenum specifying which information to query. Possible values:


const keywords = [
{code: 'UNIFORM_BLOCK_BINDING',
	desc: "Returns a GLuint indicating the uniform buffer binding point."},
{code: 'UNIFORM_BLOCK_DATA_SIZE',
	desc: "Returns a GLuint indicating the minimum total buffer object size."},
{code: 'UNIFORM_BLOCK_ACTIVE_UNIFORMS',
	desc: "Returns a GLuint indicating the number of active uniforms in the uniform block."},
{code: 'UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES',
	desc: "Returns a Uint32Array indicating the list of active uniforms in the uniform block."},
{code: 'UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER',
	desc: "Returns a GLboolean indicating whether the uniform block is referenced by the vertex shader."},
{code: 'UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER',
	desc: "Returns a GLboolean indicating whether the uniform block is referenced by the fragment shader."},
];

any gl.getParameter(pname);
Copy to Clipboard
Parameters
pname
A GLenum specifying which parameter value to return. See below for possible values.
https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

any gl.getProgramParameter(program, pname);
Copy to Clipboard
Parameters
program
A WebGLProgram to get parameter information from.
pname
A Glenum specifying the information to query. Possible values:

const keywords = [
{code: 'DELETE_STATUS',
	desc: "Returns a GLboolean indicating whether or not the program is flagged for deletion."},
{code: 'LINK_STATUS',
	desc: "Returns a GLboolean indicating whether or not the last link operation was successful."},
{code: 'VALIDATE_STATUS',
	desc: "Returns a GLboolean indicating whether or not the last validation operation was successful."},
{code: 'ATTACHED_SHADERS',
	desc: "Returns a GLint indicating the number of attached shaders to a program."},
{code: 'ACTIVE_ATTRIBUTES',
	desc: "Returns a GLint indicating the number of active attribute variables to a program."},
{code: 'ACTIVE_UNIFORMS',
	desc: "Returns a GLint indicating the number of active uniform variables to a program."},
When using a WebGL 2 context, the following values are available additionally:
{code: 'TRANSFORM_FEEDBACK_BUFFER_MODE',
	desc: "Returns a GLenum indicating the buffer mode when transform feedback is active. May be gl.SEPARATE_ATTRIBS or gl.INTERLEAVED_ATTRIBS."},
{code: 'TRANSFORM_FEEDBACK_VARYINGS',
	desc: "Returns a GLint indicating the number of varying variables to capture in transform feedback mode."},
{code: 'ACTIVE_UNIFORM_BLOCKS',
	desc: "Returns a GLint indicating the number of uniform blocks containing active uniforms."},
];

any gl.getShaderParameter(shader, pname);
Copy to Clipboard
Parameters
shader
A WebGLShader to get parameter information from.
pname
A GLenum specifying the information to query. Possible values:

const keywords = [
{code: 'DELETE_STATUS',
	desc: "Returns a GLboolean indicating whether or not the shader is flagged for deletion."},
{code: 'COMPILE_STATUS',
	desc: "Returns a GLboolean indicating whether or not the last shader compilation was successful."},
{code: 'SHADER_TYPE',
	desc: "Returns a GLenum indicating whether the shader is a vertex shader (gl.VERTEX_SHADER) or fragment shader (gl.FRAGMENT_SHADER) object."},
];

gl.getShaderInfoLog(shader);
Copy to Clipboard
Parameters
shader
A WebGLShader to query.
Return value
A DOMString that contains diagnostic messages, warning messages, and other information about the last compile operation. When a WebGLShader object is initially created, its information log will be a string of length 0.


*/

	/* ************************************************** debugging */

export function curioDebug1(gl) {
	// prints mfg and model of GPU.  yawn.
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

	// also try this URL in chrome...    chrome://internals/web-app
	// after enabling it here: chrome://flags/#enable-webgl-draft-extensions
	// or is it heree??!?!    chrome://flags/#record-web-app-debug-info
	// firefox: webgl.enable-draft-extensions in Firefox

	// try this on flores after restarting chrome since Jun 12: chrome://memories/
	// enabled here in chrome:      chrome://flags/#memories-debug

	// cool, list all exts:
	const available_extensions = gl.getSupportedExtensions();
	console.log(`--- available GL extensions:\n${available_extensions.join('\n')}`);
}


/* ************************************************ GL Enums */

// WebGLRenderingContext Prototype, in case we need to look something up
// this was taken from a webgl 1 gl object.
const WebGLConstants = {
ACTIVE_ATTRIBUTES: 35721,
ACTIVE_TEXTURE: 34016,
ACTIVE_UNIFORMS: 35718,
ALIASED_LINE_WIDTH_RANGE: 33902,
ALIASED_POINT_SIZE_RANGE: 33901,
ALPHA: 6406,
ALPHA_BITS: 3413,
ALWAYS: 519,
ARRAY_BUFFER: 34962,
ARRAY_BUFFER_BINDING: 34964,
ATTACHED_SHADERS: 35717,
BACK: 1029,
BLEND: 3042,
BLEND_COLOR: 32773,
BLEND_DST_ALPHA: 32970,
BLEND_DST_RGB: 32968,
BLEND_EQUATION: 32777,
BLEND_EQUATION_ALPHA: 34877,
BLEND_EQUATION_RGB: 32777,
BLEND_SRC_ALPHA: 32971,
BLEND_SRC_RGB: 32969,
BLUE_BITS: 3412,
BOOL: 35670,
BOOL_VEC2: 35671,
BOOL_VEC3: 35672,
BOOL_VEC4: 35673,
BROWSER_DEFAULT_WEBGL: 37444,
BUFFER_SIZE: 34660,
BUFFER_USAGE: 34661,
BYTE: 5120,
CCW: 2305,
CLAMP_TO_EDGE: 33071,
COLOR_ATTACHMENT0: 36064,
COLOR_BUFFER_BIT: 16384,
COLOR_CLEAR_VALUE: 3106,
COLOR_WRITEMASK: 3107,
COMPILE_STATUS: 35713,
COMPRESSED_TEXTURE_FORMATS: 34467,
CONSTANT_ALPHA: 32771,
CONSTANT_COLOR: 32769,
CONTEXT_LOST_WEBGL: 37442,
CULL_FACE: 2884,
CULL_FACE_MODE: 2885,
CURRENT_PROGRAM: 35725,
CURRENT_VERTEX_ATTRIB: 34342,
CW: 2304,
DECR: 7683,
DECR_WRAP: 34056,
DELETE_STATUS: 35712,
DEPTH_ATTACHMENT: 36096,
DEPTH_BITS: 3414,
DEPTH_BUFFER_BIT: 256,
DEPTH_CLEAR_VALUE: 2931,
DEPTH_COMPONENT: 6402,
DEPTH_COMPONENT16: 33189,
DEPTH_FUNC: 2932,
DEPTH_RANGE: 2928,
DEPTH_STENCIL: 34041,
DEPTH_STENCIL_ATTACHMENT: 33306,
DEPTH_TEST: 2929,
DEPTH_WRITEMASK: 2930,
DITHER: 3024,
DONT_CARE: 4352,
DST_ALPHA: 772,
DST_COLOR: 774,
DYNAMIC_DRAW: 35048,
ELEMENT_ARRAY_BUFFER: 34963,
ELEMENT_ARRAY_BUFFER_BINDING: 34965,
EQUAL: 514,
FASTEST: 4353,
FLOAT: 5126,
FLOAT_MAT2: 35674,
FLOAT_MAT3: 35675,
FLOAT_MAT4: 35676,
FLOAT_VEC2: 35664,
FLOAT_VEC3: 35665,
FLOAT_VEC4: 35666,
FRAGMENT_SHADER: 35632,
FRAMEBUFFER: 36160,
FRAMEBUFFER_ATTACHMENT_OBJECT_NAME: 36049,
FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE: 36048,
FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE: 36051,
FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL: 36050,
FRAMEBUFFER_BINDING: 36006,
FRAMEBUFFER_COMPLETE: 36053,
FRAMEBUFFER_INCOMPLETE_ATTACHMENT: 36054,
FRAMEBUFFER_INCOMPLETE_DIMENSIONS: 36057,
FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: 36055,
FRAMEBUFFER_UNSUPPORTED: 36061,
FRONT: 1028,
FRONT_AND_BACK: 1032,
FRONT_FACE: 2886,
FUNC_ADD: 32774,
FUNC_REVERSE_SUBTRACT: 32779,
FUNC_SUBTRACT: 32778,
GENERATE_MIPMAP_HINT: 33170,
GEQUAL: 518,
GREATER: 516,
GREEN_BITS: 3411,
HIGH_FLOAT: 36338,
HIGH_INT: 36341,
IMPLEMENTATION_COLOR_READ_FORMAT: 35739,
IMPLEMENTATION_COLOR_READ_TYPE: 35738,
INCR: 7682,
INCR_WRAP: 34055,
INT: 5124,
INT_VEC2: 35667,
INT_VEC3: 35668,
INT_VEC4: 35669,
INVALID_ENUM: 1280,
INVALID_FRAMEBUFFER_OPERATION: 1286,
INVALID_OPERATION: 1282,
INVALID_VALUE: 1281,
INVERT: 5386,
KEEP: 7680,
LEQUAL: 515,
LESS: 513,
LINEAR: 9729,
LINEAR_MIPMAP_LINEAR: 9987,
LINEAR_MIPMAP_NEAREST: 9985,
LINES: 1,
LINE_LOOP: 2,
LINE_STRIP: 3,
LINE_WIDTH: 2849,
LINK_STATUS: 35714,
LOW_FLOAT: 36336,
LOW_INT: 36339,
LUMINANCE: 6409,
LUMINANCE_ALPHA: 6410,
MAX_COMBINED_TEXTURE_IMAGE_UNITS: 35661,
MAX_CUBE_MAP_TEXTURE_SIZE: 34076,
MAX_FRAGMENT_UNIFORM_VECTORS: 36349,
MAX_RENDERBUFFER_SIZE: 34024,
MAX_TEXTURE_IMAGE_UNITS: 34930,
MAX_TEXTURE_SIZE: 3379,
MAX_VARYING_VECTORS: 36348,
MAX_VERTEX_ATTRIBS: 34921,
MAX_VERTEX_TEXTURE_IMAGE_UNITS: 35660,
MAX_VERTEX_UNIFORM_VECTORS: 36347,
MAX_VIEWPORT_DIMS: 3386,
MEDIUM_FLOAT: 36337,
MEDIUM_INT: 36340,
MIRRORED_REPEAT: 33648,
NEAREST: 9728,
NEAREST_MIPMAP_LINEAR: 9986,
NEAREST_MIPMAP_NEAREST: 9984,
NEVER: 512,
NICEST: 4354,
NONE: 0,
NOTEQUAL: 517,
NO_ERROR: 0,
ONE: 1,
ONE_MINUS_CONSTANT_ALPHA: 32772,
ONE_MINUS_CONSTANT_COLOR: 32770,
ONE_MINUS_DST_ALPHA: 773,
ONE_MINUS_DST_COLOR: 775,
ONE_MINUS_SRC_ALPHA: 771,
ONE_MINUS_SRC_COLOR: 769,
OUT_OF_MEMORY: 1285,
PACK_ALIGNMENT: 3333,
POINTS: 0,
POLYGON_OFFSET_FACTOR: 32824,
POLYGON_OFFSET_FILL: 32823,
POLYGON_OFFSET_UNITS: 10752,
RED_BITS: 3410,
RENDERBUFFER: 36161,
RENDERBUFFER_ALPHA_SIZE: 36179,
RENDERBUFFER_BINDING: 36007,
RENDERBUFFER_BLUE_SIZE: 36178,
RENDERBUFFER_DEPTH_SIZE: 36180,
RENDERBUFFER_GREEN_SIZE: 36177,
RENDERBUFFER_HEIGHT: 36163,
RENDERBUFFER_INTERNAL_FORMAT: 36164,
RENDERBUFFER_RED_SIZE: 36176,
RENDERBUFFER_STENCIL_SIZE: 36181,
RENDERBUFFER_WIDTH: 36162,
RENDERER: 7937,
REPEAT: 10497,
REPLACE: 7681,
RGB: 6407,
RGB5_A1: 32855,
RGB565: 36194,
RGBA: 6408,
RGBA4: 32854,
SAMPLER_2D: 35678,
SAMPLER_CUBE: 35680,
SAMPLES: 32937,
SAMPLE_ALPHA_TO_COVERAGE: 32926,
SAMPLE_BUFFERS: 32936,
SAMPLE_COVERAGE: 32928,
SAMPLE_COVERAGE_INVERT: 32939,
SAMPLE_COVERAGE_VALUE: 32938,
SCISSOR_BOX: 3088,
SCISSOR_TEST: 3089,
SHADER_TYPE: 35663,
SHADING_LANGUAGE_VERSION: 35724,
SHORT: 5122,
SRC_ALPHA: 770,
SRC_ALPHA_SATURATE: 776,
SRC_COLOR: 768,
STATIC_DRAW: 35044,
STENCIL_ATTACHMENT: 36128,
STENCIL_BACK_FAIL: 34817,
STENCIL_BACK_FUNC: 34816,
STENCIL_BACK_PASS_DEPTH_FAIL: 34818,
STENCIL_BACK_PASS_DEPTH_PASS: 34819,
STENCIL_BACK_REF: 36003,
STENCIL_BACK_VALUE_MASK: 36004,
STENCIL_BACK_WRITEMASK: 36005,
STENCIL_BITS: 3415,
STENCIL_BUFFER_BIT: 1024,
STENCIL_CLEAR_VALUE: 2961,
STENCIL_FAIL: 2964,
STENCIL_FUNC: 2962,
STENCIL_INDEX: 6401,
STENCIL_INDEX8: 36168,
STENCIL_PASS_DEPTH_FAIL: 2965,
STENCIL_PASS_DEPTH_PASS: 2966,
STENCIL_REF: 2967,
STENCIL_TEST: 2960,
STENCIL_VALUE_MASK: 2963,
STENCIL_WRITEMASK: 2968,
STREAM_DRAW: 35040,
SUBPIXEL_BITS: 3408,
TEXTURE: 5890,
TEXTURE0: 33984,
TEXTURE1: 33985,
TEXTURE2: 33986,
TEXTURE3: 33987,
TEXTURE4: 33988,
TEXTURE5: 33989,
TEXTURE6: 33990,
TEXTURE7: 33991,
TEXTURE8: 33992,
TEXTURE9: 33993,
TEXTURE10: 33994,
TEXTURE11: 33995,
TEXTURE12: 33996,
TEXTURE13: 33997,
TEXTURE14: 33998,
TEXTURE15: 33999,
TEXTURE16: 34000,
TEXTURE17: 34001,
TEXTURE18: 34002,
TEXTURE19: 34003,
TEXTURE20: 34004,
TEXTURE21: 34005,
TEXTURE22: 34006,
TEXTURE23: 34007,
TEXTURE24: 34008,
TEXTURE25: 34009,
TEXTURE26: 34010,
TEXTURE27: 34011,
TEXTURE28: 34012,
TEXTURE29: 34013,
TEXTURE30: 34014,
TEXTURE31: 34015,
TEXTURE_2D: 3553,
TEXTURE_BINDING_2D: 32873,
TEXTURE_BINDING_CUBE_MAP: 34068,
TEXTURE_CUBE_MAP: 34067,
TEXTURE_CUBE_MAP_NEGATIVE_X: 34070,
TEXTURE_CUBE_MAP_NEGATIVE_Y: 34072,
TEXTURE_CUBE_MAP_NEGATIVE_Z: 34074,
TEXTURE_CUBE_MAP_POSITIVE_X: 34069,
TEXTURE_CUBE_MAP_POSITIVE_Y: 34071,
TEXTURE_CUBE_MAP_POSITIVE_Z: 34073,
TEXTURE_MAG_FILTER: 10240,
TEXTURE_MIN_FILTER: 10241,
TEXTURE_WRAP_S: 10242,
TEXTURE_WRAP_T: 10243,
TRIANGLES: 4,
TRIANGLE_FAN: 6,
TRIANGLE_STRIP: 5,
UNPACK_ALIGNMENT: 3317,
UNPACK_COLORSPACE_CONVERSION_WEBGL: 37443,
UNPACK_FLIP_Y_WEBGL: 37440,
UNPACK_PREMULTIPLY_ALPHA_WEBGL: 37441,
UNSIGNED_BYTE: 5121,
UNSIGNED_INT: 5125,
UNSIGNED_SHORT: 5123,
UNSIGNED_SHORT_4_4_4_4: 32819,
UNSIGNED_SHORT_5_5_5_1: 32820,
UNSIGNED_SHORT_5_6_5: 33635,
VALIDATE_STATUS: 35715,
VENDOR: 7936,
VERSION: 7938,
VERTEX_ATTRIB_ARRAY_BUFFER_BINDING: 34975,
VERTEX_ATTRIB_ARRAY_ENABLED: 34338,
VERTEX_ATTRIB_ARRAY_NORMALIZED: 34922,
VERTEX_ATTRIB_ARRAY_POINTER: 34373,
VERTEX_ATTRIB_ARRAY_SIZE: 34339,
VERTEX_ATTRIB_ARRAY_STRIDE: 34340,
VERTEX_ATTRIB_ARRAY_TYPE: 34341,
VERTEX_SHADER: 35633,
VIEWPORT: 2978,
ZERO: 0,
}

export function shuddupESLint() {

	// not really
	console.log(WebGLConstants)
}

