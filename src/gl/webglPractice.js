import { mat4 } from "gl-matrix";

var cubeRotation = 0.0;

main();

//
// Dynamically resize canvas based on viewport size
//

function resize(canvas) {
  let realToCSSPixels = window.devicePixelRatio;

  // look up size browser is displaying the canvas in CSS pixels and compute a size needed to make drawingBuffer match in device pixels to support HD-DPI

  let displayWidth = Math.floor(canvas.clientWidth * realToCSSPixels);

  let displayHeight = Math.floor(canvas.clientHeight * realToCSSPixels);

  //  check to see if canvas is not the same size
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
}

//
// Start here
//

function main() {
  //   grab a reference to glCanvas

  const canvas = document.querySelector("#glCanvas");
  const gl = canvas.getContext("webgl");

  console.log("canvas element in main function: ", canvas);

  //
  //   check to see if we have a GL context, if not, show an error
  //

  if (!gl) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  //
  // Vertex shader program - stored as a strinf on a variable called vsSource
  // Written in GLSL - GL Shader Language
  // Vertex shader's job is to compute vertex positions. Based on the positions the function outputs, WebGL can rasterize various kinds of primitives including points, lines, or triangles. When rasterizing these primitves, it calls second function - fragment shader
  //

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

void main(void) {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  vColor = aVertexColor;
}
`;

  //
  // Fragment shader program - Job is to compute a color for each pixel of the primitibve currently being drawn.
  //

  const fsSource = `
  varying lowp vec4 vColor;

   void main(void) {
     gl_FragColor = vColor;
   }
`;

  //
  // Initializing a shader program so that WebGL knows how to draw the data
  //   This is where all thge lighting for vertices and so forth is established
  //

  // creates a new instance of the compiled shader program
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // store attribute and uniform location for shader program

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor")
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix")
    }
  };

  //
  //    call the routine that builds all the objects to be drawn
  //

  const buffers = initBuffers(gl);

  // Load texture
  const texture = loadTexture(gl, "cubetexture.png");

  var then = 0;

  // draw the scene repeatedly
  function render(now) {
    now *= 0.001;
    const deltaTime = now - then;
    then = now;

    drawScene(gl, programInfo, buffers, deltaTime);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

//
// initBuffers
//
// Initialize the needed buffers. In this case, there will be one object - a 2d `square`.
//

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be downloaded over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel
  );

  const image = new Image();
  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image
    );

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // Yes, it's a power of 2. Generate mips.
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // No, it's not a power of 2. Turn off mips and set
      // wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

function initBuffers(gl) {
  //   create the buffer for a square's positions

  const positionBuffer = gl.createBuffer();

  //   select the poisitionBuffer as the one to apply buffer operations to

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  //   create an array of positions for the square

  const positions = [
    // Front face
    -1.0,
    -1.0,
    1.0,
    1.0,
    -1.0,
    1.0,
    1.0,
    1.0,
    1.0,
    -1.0,
    1.0,
    1.0,

    // Back face
    -1.0,
    -1.0,
    -1.0,
    -1.0,
    1.0,
    -1.0,
    1.0,
    1.0,
    -1.0,
    1.0,
    -1.0,
    -1.0,

    // Top face
    -1.0,
    1.0,
    -1.0,
    -1.0,
    1.0,
    1.0,
    1.0,
    1.0,
    1.0,
    1.0,
    1.0,
    -1.0,

    // Bottom face
    -1.0,
    -1.0,
    -1.0,
    1.0,
    -1.0,
    -1.0,
    1.0,
    -1.0,
    1.0,
    -1.0,
    -1.0,
    1.0,

    // Right face
    1.0,
    -1.0,
    -1.0,
    1.0,
    1.0,
    -1.0,
    1.0,
    1.0,
    1.0,
    1.0,
    -1.0,
    1.0,

    // Left face
    -1.0,
    -1.0,
    -1.0,
    -1.0,
    -1.0,
    1.0,
    -1.0,
    1.0,
    1.0,
    -1.0,
    1.0,
    -1.0
  ];

  //   pass the list of positions into WebGL to build the shape.
  //   do thisby creating a Float32Array from the JavaScript array,
  //   then use it to fill the current buffer

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  //
  // create an array of colors for each of the 24 vertices
  //

  // define a color for each face

  const faceColors = [
    [1.0, 1.0, 1.0, 1.0], // Front face: white
    [1.0, 0.0, 0.0, 1.0], // Back face: red
    [0.0, 1.0, 0.0, 1.0], // Top face: green
    [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
    [1.0, 1.0, 0.0, 1.0], // Right face: yellow
    [1.0, 0.0, 1.0, 1.0] // Left face: purple
  ];

  //  convert array of colors into a table for all vertices

  let colors = [];

  for (let j = 0; j < faceColors.length; ++j) {
    const c = faceColors[j];

    //  Repeat each color four times for the four vertices of the face
    colors = colors.concat(c, c, c, c);
  }

  // set up colors for the vertices

  // const colors = [
  //   1.0,
  //   1.0,
  //   1.0,
  //   1.0, // white
  //   1.0,
  //   0.0,
  //   0.0,
  //   1.0, // red
  //   0.0,
  //   1.0,
  //   0.0,
  //   1.0, // green
  //   0.0,
  //   0.0,
  //   1.0,
  //   1.0 // blue
  // ];

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  // build the element array
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // array defining each face as two triangles, using the indeces into the vertex array to specify each triangle's position

  const indices = [
    0,
    1,
    2,
    0,
    2,
    3, // front
    4,
    5,
    6,
    4,
    6,
    7, // back
    8,
    9,
    10,
    8,
    10,
    11, // top
    12,
    13,
    14,
    12,
    14,
    15, // bottom
    16,
    17,
    18,
    16,
    18,
    19, // right
    20,
    21,
    22,
    20,
    22,
    23 // left
  ];

  //  send element array to GL

  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer
  };
}

//
// Draw the scene.
//

function drawScene(gl, programInfo, buffers, deltaTime) {
  // set clear to black, fully opqque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  //   clear everything
  gl.clearDepth(1.0);
  //   enable depth testing
  gl.enable(gl.DEPTH_TEST);
  //   near things obscure far things
  gl.depthFunc(gl.LEQUAL);

  // Call the resize function
  resize(gl.canvas);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  //
  //   Clear the canvas before drawing on it.
  //
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //  Create a perspective matrix, a special matrix
  // that is used to simulate the distortion of perspective in a camera.
  // our field of view is 45 degre4s, with a width/height ratio
  // that matches the display size of the canvas.
  // also, we only wnat to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = (45 * Math.PI) / 180; // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  //   note: glmatrix.js always has the first argument as teh destination to recieve result.
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  // set drawing position to 'identity' point, the center of the scene
  const modelViewMatrix = mat4.create();

  //   Move the drawing position a bit to where I want to start the square

  mat4.translate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to translate
    [-0.0, 0.0, -6.0]
  ); // amout to translate

  mat4.rotate(
    modelViewMatrix, //destination matrix
    modelViewMatrix, //matrix to rotate
    cubeRotation, //amount to rotate in radians
    [0, 0, 1]
  ); //axis to rotate around (z)

  mat4.rotate(
    modelViewMatrix, //destination matrix
    modelViewMatrix, //matrix to rotate
    cubeRotation * 0.7, //amount to rotate in radians
    [0, 1, 0]
  ); //axis to rotate around (x)

  //   Tell WebGL how to pull out the position from the position buffer into the vertexPosition attribute.

  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  //   Tell WebGL how to pull out the colors from the color buffer into the vertexColor attribute.
  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexColor,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
  }

  // Tell WebGL which indeices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  //   tell WebGL what program to use when drawing

  gl.useProgram(programInfo.program);

  //   Set the shader uniforms

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );

  {
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

  //  Update rotation for next draw

  cubeRotation += deltaTime;
}

//
// Initialize a shader program to tell WebGL how to draw data
//

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  //   Create shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  //   If creating shader program fails, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      "Unable to initialize shader program: " +
        gl.getProgramInfoLog(shaderProgram)
    );
    return null;
  }

  return shaderProgram;
}

//
//  create a shader of the given type, upoad the source and compile.
//

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  //   send the source to the shader object

  gl.shaderSource(shader, source);

  //   compile the shader program

  gl.compileShader(shader);

  //   see if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      "An error occurred compiling the shaders: ",
      +gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

window.onload = main;
