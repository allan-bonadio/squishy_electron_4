function GROWABLE_HEAP_I8() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews()
  }
  return HEAP8
}
function GROWABLE_HEAP_U8() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews()
  }
  return HEAPU8
}
function GROWABLE_HEAP_I16() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews()
  }
  return HEAP16
}
function GROWABLE_HEAP_U16() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews()
  }
  return HEAPU16
}
function GROWABLE_HEAP_I32() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews()
  }
  return HEAP32
}
function GROWABLE_HEAP_U32() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews()
  }
  return HEAPU32
}
function GROWABLE_HEAP_F32() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews()
  }
  return HEAPF32
}
function GROWABLE_HEAP_F64() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews()
  }
  return HEAPF64
}
var Module = typeof Module != "undefined" ? Module : {};
var moduleOverrides = Object.assign({}, Module);
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = (status,toThrow)=>{
  throw toThrow
}
;
var ENVIRONMENT_IS_WEB = typeof window == "object";
var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";
var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";
var ENVIRONMENT_IS_PTHREAD = Module["ENVIRONMENT_IS_PTHREAD"] || false;
var _scriptDir = typeof document != "undefined" && document.currentScript ? document.currentScript.src : undefined;
if (ENVIRONMENT_IS_WORKER) {
  _scriptDir = self.location.href
} else if (ENVIRONMENT_IS_NODE) {
  _scriptDir = __filename
}
var scriptDirectory = "";
function locateFile(path) {
  if (Module["locateFile"]) {
    return Module["locateFile"](path, scriptDirectory)
  }
  return scriptDirectory + path
}
var read_, readAsync, readBinary, setWindowTitle;
if (ENVIRONMENT_IS_NODE) {
  var fs = require("fs");
  var nodePath = require("path");
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = nodePath.dirname(scriptDirectory) + "/"
  } else {
    scriptDirectory = __dirname + "/"
  }
  read_ = (filename,binary)=>{
    filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
    return fs.readFileSync(filename, binary ? undefined : "utf8")
  }
  ;
  readBinary = filename=>{
    var ret = read_(filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret)
    }
    return ret
  }
  ;
  readAsync = (filename,onload,onerror)=>{
    filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
    fs.readFile(filename, function(err, data) {
      if (err)
        onerror(err);
      else
        onload(data.buffer)
    })
  }
  ;
  if (!Module["thisProgram"] && process.argv.length > 1) {
    thisProgram = process.argv[1].replace(/\\/g, "/")
  }
  arguments_ = process.argv.slice(2);
  if (typeof module != "undefined") {
    module["exports"] = Module
  }
  process.on("uncaughtException", function(ex) {
    if (ex !== "unwind" && !(ex instanceof ExitStatus) && !(ex.context instanceof ExitStatus)) {
      throw ex
    }
  });
  var nodeMajor = process.versions.node.split(".")[0];
  if (nodeMajor < 15) {
    process.on("unhandledRejection", function(reason) {
      throw reason
    })
  }
  quit_ = (status,toThrow)=>{
    process.exitCode = status;
    throw toThrow
  }
  ;
  Module["inspect"] = function() {
    return "[Emscripten Module object]"
  }
  ;
  let nodeWorkerThreads;
  try {
    nodeWorkerThreads = require("worker_threads")
  } catch (e) {
    console.error('The "worker_threads" module is not supported in this node.js build - perhaps a newer version is needed?');
    throw e
  }
  global.Worker = nodeWorkerThreads.Worker
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = self.location.href
  } else if (typeof document != "undefined" && document.currentScript) {
    scriptDirectory = document.currentScript.src
  }
  if (scriptDirectory.indexOf("blob:") !== 0) {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1)
  } else {
    scriptDirectory = ""
  }
  if (!ENVIRONMENT_IS_NODE) {
    read_ = url=>{
      var xhr = new XMLHttpRequest;
      xhr.open("GET", url, false);
      xhr.send(null);
      return xhr.responseText
    }
    ;
    if (ENVIRONMENT_IS_WORKER) {
      readBinary = url=>{
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, false);
        xhr.responseType = "arraybuffer";
        xhr.send(null);
        return new Uint8Array(xhr.response)
      }
    }
    readAsync = (url,onload,onerror)=>{
      var xhr = new XMLHttpRequest;
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.onload = ()=>{
        if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
          onload(xhr.response);
          return
        }
        onerror()
      }
      ;
      xhr.onerror = onerror;
      xhr.send(null)
    }
  }
  setWindowTitle = title=>document.title = title
} else {}
if (ENVIRONMENT_IS_NODE) {
  if (typeof performance == "undefined") {
    global.performance = require("perf_hooks").performance
  }
}
var defaultPrint = console.log.bind(console);
var defaultPrintErr = console.warn.bind(console);
if (ENVIRONMENT_IS_NODE) {
  defaultPrint = str=>fs.writeSync(1, str + "\n");
  defaultPrintErr = str=>fs.writeSync(2, str + "\n")
}
var out = Module["print"] || defaultPrint;
var err = Module["printErr"] || defaultPrintErr;
Object.assign(Module, moduleOverrides);
moduleOverrides = null;
if (Module["arguments"])
  arguments_ = Module["arguments"];
if (Module["thisProgram"])
  thisProgram = Module["thisProgram"];
if (Module["quit"])
  quit_ = Module["quit"];
var wasmBinary;
if (Module["wasmBinary"])
  wasmBinary = Module["wasmBinary"];
var noExitRuntime = Module["noExitRuntime"] || false;
if (typeof WebAssembly != "object") {
  abort("no native wasm support detected")
}
var wasmMemory;
var wasmModule;
var ABORT = false;
var EXITSTATUS;
function assert(condition, text) {
  if (!condition) {
    abort(text)
  }
}
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateMemoryViews() {
  var b = wasmMemory.buffer;
  Module["HEAP8"] = HEAP8 = new Int8Array(b);
  Module["HEAP16"] = HEAP16 = new Int16Array(b);
  Module["HEAP32"] = HEAP32 = new Int32Array(b);
  Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
  Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
  Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
  Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
  Module["HEAPF64"] = HEAPF64 = new Float64Array(b)
}
var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 536870912;
assert(INITIAL_MEMORY >= 5242880, "INITIAL_MEMORY should be larger than STACK_SIZE, was " + INITIAL_MEMORY + "! (STACK_SIZE=" + 5242880 + ")");
if (ENVIRONMENT_IS_PTHREAD) {
  wasmMemory = Module["wasmMemory"]
} else {
  if (Module["wasmMemory"]) {
    wasmMemory = Module["wasmMemory"]
  } else {
    wasmMemory = new WebAssembly.Memory({
      "initial": INITIAL_MEMORY / 65536,
      "maximum": 2147483648 / 65536,
      "shared": true
    });
    if (!(wasmMemory.buffer instanceof SharedArrayBuffer)) {
      err("requested a shared WebAssembly.Memory but the returned buffer is not a SharedArrayBuffer, indicating that while the browser has SharedArrayBuffer it does not have WebAssembly threads support - you may need to set a flag");
      if (ENVIRONMENT_IS_NODE) {
        err("(on node you may need: --experimental-wasm-threads --experimental-wasm-bulk-memory and/or recent version)")
      }
      throw Error("bad memory")
    }
  }
}
updateMemoryViews();
INITIAL_MEMORY = wasmMemory.buffer.byteLength;
var wasmTable;
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;
var runtimeKeepaliveCounter = 0;
function keepRuntimeAlive() {
  return noExitRuntime || runtimeKeepaliveCounter > 0
}
function preRun() {
  if (Module["preRun"]) {
    if (typeof Module["preRun"] == "function")
      Module["preRun"] = [Module["preRun"]];
    while (Module["preRun"].length) {
      addOnPreRun(Module["preRun"].shift())
    }
  }
  callRuntimeCallbacks(__ATPRERUN__)
}
function initRuntime() {
  runtimeInitialized = true;
  if (ENVIRONMENT_IS_PTHREAD)
    return;
  if (!Module["noFSInit"] && !FS.init.initialized)
    FS.init();
  FS.ignorePermissions = false;
  TTY.init();
  callRuntimeCallbacks(__ATINIT__)
}
function preMain() {
  if (ENVIRONMENT_IS_PTHREAD)
    return;
  callRuntimeCallbacks(__ATMAIN__)
}
function exitRuntime() {
  if (ENVIRONMENT_IS_PTHREAD)
    return;
  ___funcs_on_exit();
  callRuntimeCallbacks(__ATEXIT__);
  FS.quit();
  TTY.shutdown();
  PThread.terminateAllThreads();
  runtimeExited = true
}
function postRun() {
  if (ENVIRONMENT_IS_PTHREAD)
    return;
  if (Module["postRun"]) {
    if (typeof Module["postRun"] == "function")
      Module["postRun"] = [Module["postRun"]];
    while (Module["postRun"].length) {
      addOnPostRun(Module["postRun"].shift())
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__)
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb)
}
function addOnInit(cb) {
  __ATINIT__.unshift(cb)
}
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb)
}
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function getUniqueRunDependency(id) {
  return id
}
function addRunDependency(id) {
  runDependencies++;
  if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies)
  }
}
function removeRunDependency(id) {
  runDependencies--;
  if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies)
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback()
    }
  }
}
function abort(what) {
  if (Module["onAbort"]) {
    Module["onAbort"](what)
  }
  what = "Aborted(" + what + ")";
  err(what);
  ABORT = true;
  EXITSTATUS = 1;
  what += ". Build with -sASSERTIONS for more info.";
  var e = new WebAssembly.RuntimeError(what);
  throw e
}
var dataURIPrefix = "data:application/octet-stream;base64,";
function isDataURI(filename) {
  return filename.startsWith(dataURIPrefix)
}
function isFileURI(filename) {
  return filename.startsWith("file://")
}
var wasmBinaryFile;
wasmBinaryFile = "earthwasm.wasm";
if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile)
}
function getBinary(file) {
  try {
    if (file == wasmBinaryFile && wasmBinary) {
      return new Uint8Array(wasmBinary)
    }
    if (readBinary) {
      return readBinary(file)
    }
    throw "both async and sync fetching of the wasm failed"
  } catch (err) {
    abort(err)
  }
}
function getBinaryPromise(binaryFile) {
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
    if (typeof fetch == "function" && !isFileURI(binaryFile)) {
      return fetch(binaryFile, {
        credentials: "same-origin"
      }).then(function(response) {
        if (!response["ok"]) {
          throw "failed to load wasm binary file at '" + binaryFile + "'"
        }
        return response["arrayBuffer"]()
      }).catch(function() {
        return getBinary(binaryFile)
      })
    } else {
      if (readAsync) {
        return new Promise(function(resolve, reject) {
          readAsync(binaryFile, function(response) {
            resolve(new Uint8Array(response))
          }, reject)
        }
        )
      }
    }
  }
  return Promise.resolve().then(function() {
    return getBinary(binaryFile)
  })
}
function instantiateArrayBuffer(binaryFile, imports, receiver) {
  return getBinaryPromise(binaryFile).then(function(binary) {
    return WebAssembly.instantiate(binary, imports)
  }).then(function(instance) {
    return instance
  }).then(receiver, function(reason) {
    err("failed to asynchronously prepare wasm: " + reason);
    abort(reason)
  })
}
function instantiateAsync(binary, binaryFile, imports, callback) {
  if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && !isFileURI(binaryFile) && !ENVIRONMENT_IS_NODE && typeof fetch == "function") {
    return fetch(binaryFile, {
      credentials: "same-origin"
    }).then(function(response) {
      var result = WebAssembly.instantiateStreaming(response, imports);
      return result.then(callback, function(reason) {
        err("wasm streaming compile failed: " + reason);
        err("falling back to ArrayBuffer instantiation");
        return instantiateArrayBuffer(binaryFile, imports, callback)
      })
    })
  } else {
    return instantiateArrayBuffer(binaryFile, imports, callback)
  }
}
function createWasm() {
  var info = {
    "a": wasmImports
  };
  function receiveInstance(instance, module) {
    var exports = instance.exports;
    Module["asm"] = exports;
    registerTLSInit(Module["asm"]["Rg"]);
    wasmTable = Module["asm"]["Gg"];
    addOnInit(Module["asm"]["Fg"]);
    wasmModule = module;
    PThread.loadWasmModuleToAllWorkers(()=>removeRunDependency("wasm-instantiate"));
    return exports
  }
  addRunDependency("wasm-instantiate");
  function receiveInstantiationResult(result) {
    receiveInstance(result["instance"], result["module"])
  }
  if (Module["instantiateWasm"]) {
    try {
      return Module["instantiateWasm"](info, receiveInstance)
    } catch (e) {
      err("Module.instantiateWasm callback failed with error: " + e);
      return false
    }
  }
  instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult);
  return {}
}
var tempDouble;
var tempI64;
var ASM_CONSTS = {
  5814236: ()=>{
    debugger
  }
  ,
  5814249: ()=>{
    return typeof wasmOffsetConverter !== "undefined"
  }
  ,
  5814306: ()=>{
    return !!Module.ctx
  }
  ,
  5814328: ()=>{
    const MAX_LABEL_RENDERS = 32;
    class RenderThrottle {
      constructor(action) {
        this.action_ = action;
        this.requestId_ = null
      }
      fire(...args) {
        if (this.requestId_) {
          if (args.length) {
            window.cancelAnimationFrame(this.requestId_);
            this.requestId_ = null
          } else {
            return
          }
        }
        this.requestId_ = window.requestAnimationFrame(()=>{
          this.requestId_ = null;
          this.action_(...args)
        }
        )
      }
    }
    class LabelRenderer {
      constructor() {
        this.renderQueue_ = [];
        this.measurementCanvas = null;
        this.canvasPoolSize = 0;
        this.canvasPoolCapacity = 512 * 512;
        this.canvasReused = 0;
        this.canvasQueried = 0;
        this.canvasPool = [];
        this.canvasToUpload = {};
        this.processRenderOperations_ = new RenderThrottle(()=>{
          if (this.renderQueue_.length == 0) {
            return
          }
          let n = MAX_LABEL_RENDERS - Object.keys(this.canvasToUpload).length;
          n = Math.min(this.renderQueue_.length, n);
          for (let i = 0; i < n; ++i) {
            const renderOperation = this.renderQueue_.shift();
            renderOperation()
          }
          if (this.renderQueue_.length > 0) {
            this.processRenderOperations_.fire()
          }
        }
        )
      }
      getCanvasFromPool(width, height) {
        ++this.canvasQueried;
        const n = this.canvasPool.length;
        if (n == 0) {
          return null
        }
        for (let i = 0; i < n; ++i) {
          const canvas = this.canvasPool[i];
          if (canvas.width == width && canvas.height == height) {
            this.canvasPool.splice(i, 1);
            this.canvasPoolSize -= width * height;
            ++this.canvasReused;
            return canvas
          }
        }
        if (this.canvasPoolSize < this.canvasPoolCapacity) {
          return null
        }
        let i = Math.floor(Math.random() * n);
        const canvas = this.canvasPool[i];
        this.canvasPool.splice(i, 1);
        this.canvasPoolSize -= canvas.width * canvas.height;
        return canvas
      }
      canvasSubImage(texid, level, xoffset, yoffset, canvasid) {
        let canvas = this.canvasToUpload[canvasid];
        if (canvas) {
          let mgl = Module["GL"];
          let webgl_texture = mgl.textures[texid];
          let glwrapper = mgl.currentContext;
          if (webgl_texture && glwrapper) {
            let gl = glwrapper.GLctx;
            let previousActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
            gl.activeTexture(gl.TEXTURE7);
            gl.bindTexture(gl.TEXTURE_2D, webgl_texture);
            gl.texSubImage2D(gl.TEXTURE_2D, level, xoffset, yoffset, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
            gl.activeTexture(previousActiveTexture)
          } else {
            console.error("Unable to perform OpenGL subimage from <canvas>: " + canvasid)
          }
        } else {
          console.error("Invalid <canvas> for OpenGL subimage: " + canvasid)
        }
      }
      canvasReadPixels(canvasid, pixels) {
        const canvas = this.canvasToUpload[canvasid];
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < image_data.data.length; ++i) {
              pixels[i] = image_data.data[i]
            }
          } else {
            console.error("Could not acquire context for canvas: " + canvasid)
          }
        } else {
          console.error("Invalid <canvas> for canvasReadPixels: " + canvasid)
        }
      }
      deleteCanvasSubImage(canvasid) {
        let canvas = this.canvasToUpload[canvasid];
        delete this.canvasToUpload[canvasid];
        if (canvas && this.canvasPoolSize < this.canvasPoolCapacity) {
          this.canvasPoolSize += canvas.width * canvas.height;
          this.canvasPool.push(canvas)
        }
      }
      getOrCreateCanvas(width, height) {
        let canvas = this.getCanvasFromPool(width, height);
        if (canvas) {
          if (canvas.width != width || canvas.height != height) {
            canvas.width = width;
            canvas.height = height
          }
          return canvas
        }
        canvas = document.createElement("canvas");
        canvas.style.display = "block";
        canvas.style.left = "-32768px";
        canvas.style.position = "absolute";
        canvas.style.visibility = "hidden";
        canvas.width = width;
        canvas.height = height;
        canvas.setAttribute("dir", "ltr");
        let ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.miterLimit = 3;
          ctx.textBaseline = "bottom"
        }
        return canvas
      }
      generateCanvasId() {
        let id = "canvas-image: ";
        for (let i = 0; i < 10; ++i) {
          id += Math.floor(Math.random() * 10).toString()
        }
        return id
      }
      renderLabel(requestid, string, pointSize, bold, italic, leadingRatio, tracking, outlineWidth) {
        const defaultLineHeight = 1.2;
        const outlineUnitsPerPixel = 16;
        const pointsToPx = 16 / 12;
        const strokeWidth = outlineWidth / outlineUnitsPerPixel * window.devicePixelRatio;
        const textSizePpt = pointSize * window.devicePixelRatio;
        const textSizePpx = Math.ceil(textSizePpt * pointsToPx);
        const inset = strokeWidth;
        const styleString = (italic ? "italic" : "normal") + " " + (bold ? "bold" : "normal") + " " + textSizePpx + "px/" + defaultLineHeight * leadingRatio + '"Google Sans", Arial, sans-serif';
        const letterSpacing = textSizePpt * tracking + "px";
        if (!this.measurementCanvas) {
          this.measurementCanvas = this.getOrCreateCanvas(1, 1)
        }
        this.measurementCanvas.style.letterSpacing = letterSpacing;
        let width = 0;
        let height = 0;
        let xoffset = 0;
        let yoffset = 0;
        const lines = string.split("\n");
        let ctx = this.measurementCanvas.getContext("2d");
        if (ctx) {
          ctx.lineWidth = strokeWidth * 2;
          ctx.font = styleString;
          for (let i = 0, n = lines.length; i < n; ++i) {
            const line = lines[i];
            const metrics = ctx.measureText(line);
            let lineWidth = Math.ceil((metrics.actualBoundingBoxRight | 0) + (metrics.actualBoundingBoxLeft | 0) + 2 * strokeWidth + 2 * inset);
            width = Math.max(lineWidth, width)
          }
          height = Math.ceil(textSizePpx + (lines.length - 1) * textSizePpx * defaultLineHeight * leadingRatio + 2 * strokeWidth + 2 * inset);
          width = Math.max(width, 3);
          height = Math.max(height, 2);
          const rounding = 10;
          const roundedWidth = Math.round(width / rounding + .5) * rounding;
          const roundedHeight = Math.round(height / rounding + .5) * rounding;
          xoffset = (roundedWidth - width) * .5;
          yoffset = (roundedHeight - height) * .5;
          width = roundedWidth;
          height = roundedHeight
        }
        if (width > 4096) {
          console.error("Width for string '" + string + "' calculated as " + width + "px. Clamping to 4096px.");
          width = 4096
        }
        if (height > 4096) {
          console.error("Height for string '" + string + "' calculated as " + height + "px. Clamping to 4096px.");
          height = 4096
        }
        let imageData = null;
        let canvas = this.getOrCreateCanvas(width, height);
        canvas.style.letterSpacing = letterSpacing;
        ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.lineWidth = strokeWidth * 2;
          ctx.font = styleString;
          ctx.fillStyle = "#FF0000";
          ctx.strokeStyle = "#00FF00";
          ctx.clearRect(0, 0, width, height);
          for (let i = 0, n = lines.length; i < n; ++i) {
            const line = lines[i];
            let x = Math.round(inset + strokeWidth) + xoffset;
            let y = textSizePpx + inset + strokeWidth + yoffset;
            if (i > 0) {
              y += textSizePpx * i * defaultLineHeight * leadingRatio
            }
            if (strokeWidth) {
              ctx.strokeText(line, x, y)
            }
            ctx.fillText(line, x, y)
          }
          let id = this.generateCanvasId();
          while (this.canvasToUpload.hasOwnProperty(id)) {
            id = this.generateCanvasId()
          }
          this.canvasToUpload[id] = canvas;
          imageData = id
        }
        let lineAdvanceHeight = textSizePpx * defaultLineHeight * leadingRatio;
        Module["SetRenderedString"](imageData, width, height, lineAdvanceHeight, requestid)
      }
      renderAsync(requestid, string, pointSize, bold, italic, leadingRatio, tracking, outlineWidth) {
        const boundRender = this.renderLabel.bind(this, requestid, string, pointSize, bold, italic, leadingRatio, tracking, outlineWidth);
        this.pushRenderOperation_(boundRender)
      }
      pushRenderOperation_(renderOperation) {
        this.renderQueue_.push(renderOperation);
        this.processRenderOperations_.fire()
      }
    }
    Module.labelRenderer = new LabelRenderer
  }
  ,
  5821630: ($0,$1,$2,$3,$4,$5,$6,$7)=>{
    var string = UTF8ToString($1);
    Module.labelRenderer.renderAsync($0, string, $2, $3, $4, $5, $6, $7)
  }
  ,
  5821735: ($0,$1,$2)=>{
    if (Module.canvas) {
      const gl = Module.canvas.getContext("webgl");
      if (gl) {
        const di = gl.getExtension("WEBGL_debug_renderer_info");
        if (di) {
          stringToUTF8(gl.getParameter(di.UNMASKED_RENDERER_WEBGL), $0, $2);
          stringToUTF8(gl.getParameter(di.UNMASKED_VENDOR_WEBGL), $1, $2)
        }
      }
    }
  }
  ,
  5822021: ($0,$1,$2,$3,$4)=>{
    var canvasid = UTF8ToString($4);
    Module.labelRenderer.canvasSubImage($0, $1, $2, $3, canvasid)
  }
  ,
  5822121: $0=>{
    var canvasid = UTF8ToString($0);
    window.setTimeout(function() {
      Module.labelRenderer.deleteCanvasSubImage(canvasid)
    }, 100)
  }
  ,
  5822254: ()=>{
    performance.mark("mark_startup_completed")
  }
  ,
  5822298: ()=>{
    performance.mark("mark_first_scene_ready")
  }
  ,
  5822342: ()=>{
    Module.canvas.focus({
      preventScroll: true
    })
  }
  ,
  5822387: ()=>{
    Module.canvas.style.cursor = "crosshair"
  }
  ,
  5822429: ()=>{
    Module.canvas.style.cursor = "grabbing"
  }
  ,
  5822470: ()=>{
    Module.canvas.style.cursor = "pointer"
  }
  ,
  5822510: ()=>{
    Module.canvas.style.cursor = "default"
  }
  ,
  5822550: ()=>{
    performance.mark("mark_main_started")
  }
  ,
  5822589: ()=>{
    var event = new CustomEvent("mapready");
    window.dispatchEvent(event)
  }
};
function em_severity_log(severity, severityName, message) {
  if (typeof globalThis === "object" && typeof globalThis["Module"] === "object" && typeof globalThis["Module"]["log"] === "function") {
    globalThis["Module"]["log"](severity, UTF8ToString(severityName), UTF8ToString(message))
  } else {
    var loggers = [console.log, console.warn, console.error];
    loggers[severity].call(console, UTF8ToString(severityName) + " " + UTF8ToString(message) + "\n")
  }
}
function HaveOffsetConverter() {
  return typeof wasmOffsetConverter !== "undefined"
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status
}
function terminateWorker(worker) {
  worker.terminate();
  worker.onmessage = e=>{}
}
function killThread(pthread_ptr) {
  var worker = PThread.pthreads[pthread_ptr];
  delete PThread.pthreads[pthread_ptr];
  terminateWorker(worker);
  __emscripten_thread_free_data(pthread_ptr);
  PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
  worker.pthread_ptr = 0
}
function cancelThread(pthread_ptr) {
  var worker = PThread.pthreads[pthread_ptr];
  worker.postMessage({
    "cmd": "cancel"
  })
}
function cleanupThread(pthread_ptr) {
  var worker = PThread.pthreads[pthread_ptr];
  assert(worker);
  PThread.returnWorkerToPool(worker)
}
function zeroMemory(address, size) {
  GROWABLE_HEAP_U8().fill(0, address, address + size);
  return address
}
function spawnThread(threadParams) {
  var worker = PThread.getNewWorker();
  if (!worker) {
    return 6
  }
  PThread.runningWorkers.push(worker);
  PThread.pthreads[threadParams.pthread_ptr] = worker;
  worker.pthread_ptr = threadParams.pthread_ptr;
  var msg = {
    "cmd": "run",
    "start_routine": threadParams.startRoutine,
    "arg": threadParams.arg,
    "pthread_ptr": threadParams.pthread_ptr
  };
  if (ENVIRONMENT_IS_NODE) {
    worker.ref()
  }
  worker.postMessage(msg, threadParams.transferList);
  return 0
}
var PATH = {
  isAbs: path=>path.charAt(0) === "/",
  splitPath: filename=>{
    var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
    return splitPathRe.exec(filename).slice(1)
  }
  ,
  normalizeArray: (parts,allowAboveRoot)=>{
    var up = 0;
    for (var i = parts.length - 1; i >= 0; i--) {
      var last = parts[i];
      if (last === ".") {
        parts.splice(i, 1)
      } else if (last === "..") {
        parts.splice(i, 1);
        up++
      } else if (up) {
        parts.splice(i, 1);
        up--
      }
    }
    if (allowAboveRoot) {
      for (; up; up--) {
        parts.unshift("..")
      }
    }
    return parts
  }
  ,
  normalize: path=>{
    var isAbsolute = PATH.isAbs(path)
      , trailingSlash = path.substr(-1) === "/";
    path = PATH.normalizeArray(path.split("/").filter(p=>!!p), !isAbsolute).join("/");
    if (!path && !isAbsolute) {
      path = "."
    }
    if (path && trailingSlash) {
      path += "/"
    }
    return (isAbsolute ? "/" : "") + path
  }
  ,
  dirname: path=>{
    var result = PATH.splitPath(path)
      , root = result[0]
      , dir = result[1];
    if (!root && !dir) {
      return "."
    }
    if (dir) {
      dir = dir.substr(0, dir.length - 1)
    }
    return root + dir
  }
  ,
  basename: path=>{
    if (path === "/")
      return "/";
    path = PATH.normalize(path);
    path = path.replace(/\/$/, "");
    var lastSlash = path.lastIndexOf("/");
    if (lastSlash === -1)
      return path;
    return path.substr(lastSlash + 1)
  }
  ,
  join: function() {
    var paths = Array.prototype.slice.call(arguments);
    return PATH.normalize(paths.join("/"))
  },
  join2: (l,r)=>{
    return PATH.normalize(l + "/" + r)
  }
};
function initRandomFill() {
  if (typeof crypto == "object" && typeof crypto["getRandomValues"] == "function") {
    return view=>(view.set(crypto.getRandomValues(new Uint8Array(view.byteLength))),
    view)
  } else if (ENVIRONMENT_IS_NODE) {
    try {
      var crypto_module = require("crypto");
      var randomFillSync = crypto_module["randomFillSync"];
      if (randomFillSync) {
        return view=>crypto_module["randomFillSync"](view)
      }
      var randomBytes = crypto_module["randomBytes"];
      return view=>(view.set(randomBytes(view.byteLength)),
      view)
    } catch (e) {}
  }
  abort("initRandomDevice")
}
function randomFill(view) {
  return (randomFill = initRandomFill())(view)
}
var PATH_FS = {
  resolve: function() {
    var resolvedPath = ""
      , resolvedAbsolute = false;
    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path = i >= 0 ? arguments[i] : FS.cwd();
      if (typeof path != "string") {
        throw new TypeError("Arguments to path.resolve must be strings")
      } else if (!path) {
        return ""
      }
      resolvedPath = path + "/" + resolvedPath;
      resolvedAbsolute = PATH.isAbs(path)
    }
    resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(p=>!!p), !resolvedAbsolute).join("/");
    return (resolvedAbsolute ? "/" : "") + resolvedPath || "."
  },
  relative: (from,to)=>{
    from = PATH_FS.resolve(from).substr(1);
    to = PATH_FS.resolve(to).substr(1);
    function trim(arr) {
      var start = 0;
      for (; start < arr.length; start++) {
        if (arr[start] !== "")
          break
      }
      var end = arr.length - 1;
      for (; end >= 0; end--) {
        if (arr[end] !== "")
          break
      }
      if (start > end)
        return [];
      return arr.slice(start, end - start + 1)
    }
    var fromParts = trim(from.split("/"));
    var toParts = trim(to.split("/"));
    var length = Math.min(fromParts.length, toParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i;
        break
      }
    }
    var outputParts = [];
    for (var i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push("..")
    }
    outputParts = outputParts.concat(toParts.slice(samePartsLength));
    return outputParts.join("/")
  }
};
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var c = str.charCodeAt(i);
    if (c <= 127) {
      len++
    } else if (c <= 2047) {
      len += 2
    } else if (c >= 55296 && c <= 57343) {
      len += 4;
      ++i
    } else {
      len += 3
    }
  }
  return len
}
function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0))
    return 0;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343) {
      var u1 = str.charCodeAt(++i);
      u = 65536 + ((u & 1023) << 10) | u1 & 1023
    }
    if (u <= 127) {
      if (outIdx >= endIdx)
        break;
      heap[outIdx++] = u
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx)
        break;
      heap[outIdx++] = 192 | u >> 6;
      heap[outIdx++] = 128 | u & 63
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx)
        break;
      heap[outIdx++] = 224 | u >> 12;
      heap[outIdx++] = 128 | u >> 6 & 63;
      heap[outIdx++] = 128 | u & 63
    } else {
      if (outIdx + 3 >= endIdx)
        break;
      heap[outIdx++] = 240 | u >> 18;
      heap[outIdx++] = 128 | u >> 12 & 63;
      heap[outIdx++] = 128 | u >> 6 & 63;
      heap[outIdx++] = 128 | u & 63
    }
  }
  heap[outIdx] = 0;
  return outIdx - startIdx
}
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull)
    u8array.length = numBytesWritten;
  return u8array
}
var TTY = {
  ttys: [],
  init: function() {},
  shutdown: function() {},
  register: function(dev, ops) {
    TTY.ttys[dev] = {
      input: [],
      output: [],
      ops: ops
    };
    FS.registerDevice(dev, TTY.stream_ops)
  },
  stream_ops: {
    open: function(stream) {
      var tty = TTY.ttys[stream.node.rdev];
      if (!tty) {
        throw new FS.ErrnoError(43)
      }
      stream.tty = tty;
      stream.seekable = false
    },
    close: function(stream) {
      stream.tty.ops.fsync(stream.tty)
    },
    fsync: function(stream) {
      stream.tty.ops.fsync(stream.tty)
    },
    read: function(stream, buffer, offset, length, pos) {
      if (!stream.tty || !stream.tty.ops.get_char) {
        throw new FS.ErrnoError(60)
      }
      var bytesRead = 0;
      for (var i = 0; i < length; i++) {
        var result;
        try {
          result = stream.tty.ops.get_char(stream.tty)
        } catch (e) {
          throw new FS.ErrnoError(29)
        }
        if (result === undefined && bytesRead === 0) {
          throw new FS.ErrnoError(6)
        }
        if (result === null || result === undefined)
          break;
        bytesRead++;
        buffer[offset + i] = result
      }
      if (bytesRead) {
        stream.node.timestamp = Date.now()
      }
      return bytesRead
    },
    write: function(stream, buffer, offset, length, pos) {
      if (!stream.tty || !stream.tty.ops.put_char) {
        throw new FS.ErrnoError(60)
      }
      try {
        for (var i = 0; i < length; i++) {
          stream.tty.ops.put_char(stream.tty, buffer[offset + i])
        }
      } catch (e) {
        throw new FS.ErrnoError(29)
      }
      if (length) {
        stream.node.timestamp = Date.now()
      }
      return i
    }
  },
  default_tty_ops: {
    get_char: function(tty) {
      if (!tty.input.length) {
        var result = null;
        if (ENVIRONMENT_IS_NODE) {
          var BUFSIZE = 256;
          var buf = Buffer.alloc(BUFSIZE);
          var bytesRead = 0;
          try {
            bytesRead = fs.readSync(process.stdin.fd, buf, 0, BUFSIZE, -1)
          } catch (e) {
            if (e.toString().includes("EOF"))
              bytesRead = 0;
            else
              throw e
          }
          if (bytesRead > 0) {
            result = buf.slice(0, bytesRead).toString("utf-8")
          } else {
            result = null
          }
        } else if (typeof window != "undefined" && typeof window.prompt == "function") {
          result = window.prompt("Input: ");
          if (result !== null) {
            result += "\n"
          }
        } else if (typeof readline == "function") {
          result = readline();
          if (result !== null) {
            result += "\n"
          }
        }
        if (!result) {
          return null
        }
        tty.input = intArrayFromString(result, true)
      }
      return tty.input.shift()
    },
    put_char: function(tty, val) {
      if (val === null || val === 10) {
        out(UTF8ArrayToString(tty.output, 0));
        tty.output = []
      } else {
        if (val != 0)
          tty.output.push(val)
      }
    },
    fsync: function(tty) {
      if (tty.output && tty.output.length > 0) {
        out(UTF8ArrayToString(tty.output, 0));
        tty.output = []
      }
    }
  },
  default_tty1_ops: {
    put_char: function(tty, val) {
      if (val === null || val === 10) {
        err(UTF8ArrayToString(tty.output, 0));
        tty.output = []
      } else {
        if (val != 0)
          tty.output.push(val)
      }
    },
    fsync: function(tty) {
      if (tty.output && tty.output.length > 0) {
        err(UTF8ArrayToString(tty.output, 0));
        tty.output = []
      }
    }
  }
};
function alignMemory(size, alignment) {
  return Math.ceil(size / alignment) * alignment
}
function mmapAlloc(size) {
  size = alignMemory(size, 65536);
  var ptr = _emscripten_builtin_memalign(65536, size);
  if (!ptr)
    return 0;
  return zeroMemory(ptr, size)
}
var MEMFS = {
  ops_table: null,
  mount: function(mount) {
    return MEMFS.createNode(null, "/", 16384 | 511, 0)
  },
  createNode: function(parent, name, mode, dev) {
    if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
      throw new FS.ErrnoError(63)
    }
    if (!MEMFS.ops_table) {
      MEMFS.ops_table = {
        dir: {
          node: {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            lookup: MEMFS.node_ops.lookup,
            mknod: MEMFS.node_ops.mknod,
            rename: MEMFS.node_ops.rename,
            unlink: MEMFS.node_ops.unlink,
            rmdir: MEMFS.node_ops.rmdir,
            readdir: MEMFS.node_ops.readdir,
            symlink: MEMFS.node_ops.symlink
          },
          stream: {
            llseek: MEMFS.stream_ops.llseek
          }
        },
        file: {
          node: {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          },
          stream: {
            llseek: MEMFS.stream_ops.llseek,
            read: MEMFS.stream_ops.read,
            write: MEMFS.stream_ops.write,
            allocate: MEMFS.stream_ops.allocate,
            mmap: MEMFS.stream_ops.mmap,
            msync: MEMFS.stream_ops.msync
          }
        },
        link: {
          node: {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            readlink: MEMFS.node_ops.readlink
          },
          stream: {}
        },
        chrdev: {
          node: {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          },
          stream: FS.chrdev_stream_ops
        }
      }
    }
    var node = FS.createNode(parent, name, mode, dev);
    if (FS.isDir(node.mode)) {
      node.node_ops = MEMFS.ops_table.dir.node;
      node.stream_ops = MEMFS.ops_table.dir.stream;
      node.contents = {}
    } else if (FS.isFile(node.mode)) {
      node.node_ops = MEMFS.ops_table.file.node;
      node.stream_ops = MEMFS.ops_table.file.stream;
      node.usedBytes = 0;
      node.contents = null
    } else if (FS.isLink(node.mode)) {
      node.node_ops = MEMFS.ops_table.link.node;
      node.stream_ops = MEMFS.ops_table.link.stream
    } else if (FS.isChrdev(node.mode)) {
      node.node_ops = MEMFS.ops_table.chrdev.node;
      node.stream_ops = MEMFS.ops_table.chrdev.stream
    }
    node.timestamp = Date.now();
    if (parent) {
      parent.contents[name] = node;
      parent.timestamp = node.timestamp
    }
    return node
  },
  getFileDataAsTypedArray: function(node) {
    if (!node.contents)
      return new Uint8Array(0);
    if (node.contents.subarray)
      return node.contents.subarray(0, node.usedBytes);
    return new Uint8Array(node.contents)
  },
  expandFileStorage: function(node, newCapacity) {
    var prevCapacity = node.contents ? node.contents.length : 0;
    if (prevCapacity >= newCapacity)
      return;
    var CAPACITY_DOUBLING_MAX = 1024 * 1024;
    newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
    if (prevCapacity != 0)
      newCapacity = Math.max(newCapacity, 256);
    var oldContents = node.contents;
    node.contents = new Uint8Array(newCapacity);
    if (node.usedBytes > 0)
      node.contents.set(oldContents.subarray(0, node.usedBytes), 0)
  },
  resizeFileStorage: function(node, newSize) {
    if (node.usedBytes == newSize)
      return;
    if (newSize == 0) {
      node.contents = null;
      node.usedBytes = 0
    } else {
      var oldContents = node.contents;
      node.contents = new Uint8Array(newSize);
      if (oldContents) {
        node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)))
      }
      node.usedBytes = newSize
    }
  },
  node_ops: {
    getattr: function(node) {
      var attr = {};
      attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
      attr.ino = node.id;
      attr.mode = node.mode;
      attr.nlink = 1;
      attr.uid = 0;
      attr.gid = 0;
      attr.rdev = node.rdev;
      if (FS.isDir(node.mode)) {
        attr.size = 4096
      } else if (FS.isFile(node.mode)) {
        attr.size = node.usedBytes
      } else if (FS.isLink(node.mode)) {
        attr.size = node.link.length
      } else {
        attr.size = 0
      }
      attr.atime = new Date(node.timestamp);
      attr.mtime = new Date(node.timestamp);
      attr.ctime = new Date(node.timestamp);
      attr.blksize = 4096;
      attr.blocks = Math.ceil(attr.size / attr.blksize);
      return attr
    },
    setattr: function(node, attr) {
      if (attr.mode !== undefined) {
        node.mode = attr.mode
      }
      if (attr.timestamp !== undefined) {
        node.timestamp = attr.timestamp
      }
      if (attr.size !== undefined) {
        MEMFS.resizeFileStorage(node, attr.size)
      }
    },
    lookup: function(parent, name) {
      throw FS.genericErrors[44]
    },
    mknod: function(parent, name, mode, dev) {
      return MEMFS.createNode(parent, name, mode, dev)
    },
    rename: function(old_node, new_dir, new_name) {
      if (FS.isDir(old_node.mode)) {
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name)
        } catch (e) {}
        if (new_node) {
          for (var i in new_node.contents) {
            throw new FS.ErrnoError(55)
          }
        }
      }
      delete old_node.parent.contents[old_node.name];
      old_node.parent.timestamp = Date.now();
      old_node.name = new_name;
      new_dir.contents[new_name] = old_node;
      new_dir.timestamp = old_node.parent.timestamp;
      old_node.parent = new_dir
    },
    unlink: function(parent, name) {
      delete parent.contents[name];
      parent.timestamp = Date.now()
    },
    rmdir: function(parent, name) {
      var node = FS.lookupNode(parent, name);
      for (var i in node.contents) {
        throw new FS.ErrnoError(55)
      }
      delete parent.contents[name];
      parent.timestamp = Date.now()
    },
    readdir: function(node) {
      var entries = [".", ".."];
      for (var key in node.contents) {
        if (!node.contents.hasOwnProperty(key)) {
          continue
        }
        entries.push(key)
      }
      return entries
    },
    symlink: function(parent, newname, oldpath) {
      var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
      node.link = oldpath;
      return node
    },
    readlink: function(node) {
      if (!FS.isLink(node.mode)) {
        throw new FS.ErrnoError(28)
      }
      return node.link
    }
  },
  stream_ops: {
    read: function(stream, buffer, offset, length, position) {
      var contents = stream.node.contents;
      if (position >= stream.node.usedBytes)
        return 0;
      var size = Math.min(stream.node.usedBytes - position, length);
      if (size > 8 && contents.subarray) {
        buffer.set(contents.subarray(position, position + size), offset)
      } else {
        for (var i = 0; i < size; i++)
          buffer[offset + i] = contents[position + i]
      }
      return size
    },
    write: function(stream, buffer, offset, length, position, canOwn) {
      if (buffer.buffer === GROWABLE_HEAP_I8().buffer) {
        canOwn = false
      }
      if (!length)
        return 0;
      var node = stream.node;
      node.timestamp = Date.now();
      if (buffer.subarray && (!node.contents || node.contents.subarray)) {
        if (canOwn) {
          node.contents = buffer.subarray(offset, offset + length);
          node.usedBytes = length;
          return length
        } else if (node.usedBytes === 0 && position === 0) {
          node.contents = buffer.slice(offset, offset + length);
          node.usedBytes = length;
          return length
        } else if (position + length <= node.usedBytes) {
          node.contents.set(buffer.subarray(offset, offset + length), position);
          return length
        }
      }
      MEMFS.expandFileStorage(node, position + length);
      if (node.contents.subarray && buffer.subarray) {
        node.contents.set(buffer.subarray(offset, offset + length), position)
      } else {
        for (var i = 0; i < length; i++) {
          node.contents[position + i] = buffer[offset + i]
        }
      }
      node.usedBytes = Math.max(node.usedBytes, position + length);
      return length
    },
    llseek: function(stream, offset, whence) {
      var position = offset;
      if (whence === 1) {
        position += stream.position
      } else if (whence === 2) {
        if (FS.isFile(stream.node.mode)) {
          position += stream.node.usedBytes
        }
      }
      if (position < 0) {
        throw new FS.ErrnoError(28)
      }
      return position
    },
    allocate: function(stream, offset, length) {
      MEMFS.expandFileStorage(stream.node, offset + length);
      stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length)
    },
    mmap: function(stream, length, position, prot, flags) {
      if (!FS.isFile(stream.node.mode)) {
        throw new FS.ErrnoError(43)
      }
      var ptr;
      var allocated;
      var contents = stream.node.contents;
      if (!(flags & 2) && contents.buffer === GROWABLE_HEAP_I8().buffer) {
        allocated = false;
        ptr = contents.byteOffset
      } else {
        if (position > 0 || position + length < contents.length) {
          if (contents.subarray) {
            contents = contents.subarray(position, position + length)
          } else {
            contents = Array.prototype.slice.call(contents, position, position + length)
          }
        }
        allocated = true;
        ptr = mmapAlloc(length);
        if (!ptr) {
          throw new FS.ErrnoError(48)
        }
        GROWABLE_HEAP_I8().set(contents, ptr)
      }
      return {
        ptr: ptr,
        allocated: allocated
      }
    },
    msync: function(stream, buffer, offset, length, mmapFlags) {
      MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
      return 0
    }
  }
};
function asyncLoad(url, onload, onerror, noRunDep) {
  var dep = !noRunDep ? getUniqueRunDependency("al " + url) : "";
  readAsync(url, arrayBuffer=>{
    assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
    onload(new Uint8Array(arrayBuffer));
    if (dep)
      removeRunDependency(dep)
  }
  , event=>{
    if (onerror) {
      onerror()
    } else {
      throw 'Loading data file "' + url + '" failed.'
    }
  }
  );
  if (dep)
    addRunDependency(dep)
}
var FS = {
  root: null,
  mounts: [],
  devices: {},
  streams: [],
  nextInode: 1,
  nameTable: null,
  currentPath: "/",
  initialized: false,
  ignorePermissions: true,
  ErrnoError: null,
  genericErrors: {},
  filesystems: null,
  syncFSRequests: 0,
  lookupPath: (path,opts={})=>{
    path = PATH_FS.resolve(path);
    if (!path)
      return {
        path: "",
        node: null
      };
    var defaults = {
      follow_mount: true,
      recurse_count: 0
    };
    opts = Object.assign(defaults, opts);
    if (opts.recurse_count > 8) {
      throw new FS.ErrnoError(32)
    }
    var parts = path.split("/").filter(p=>!!p);
    var current = FS.root;
    var current_path = "/";
    for (var i = 0; i < parts.length; i++) {
      var islast = i === parts.length - 1;
      if (islast && opts.parent) {
        break
      }
      current = FS.lookupNode(current, parts[i]);
      current_path = PATH.join2(current_path, parts[i]);
      if (FS.isMountpoint(current)) {
        if (!islast || islast && opts.follow_mount) {
          current = current.mounted.root
        }
      }
      if (!islast || opts.follow) {
        var count = 0;
        while (FS.isLink(current.mode)) {
          var link = FS.readlink(current_path);
          current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
          var lookup = FS.lookupPath(current_path, {
            recurse_count: opts.recurse_count + 1
          });
          current = lookup.node;
          if (count++ > 40) {
            throw new FS.ErrnoError(32)
          }
        }
      }
    }
    return {
      path: current_path,
      node: current
    }
  }
  ,
  getPath: node=>{
    var path;
    while (true) {
      if (FS.isRoot(node)) {
        var mount = node.mount.mountpoint;
        if (!path)
          return mount;
        return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path
      }
      path = path ? node.name + "/" + path : node.name;
      node = node.parent
    }
  }
  ,
  hashName: (parentid,name)=>{
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i) | 0
    }
    return (parentid + hash >>> 0) % FS.nameTable.length
  }
  ,
  hashAddNode: node=>{
    var hash = FS.hashName(node.parent.id, node.name);
    node.name_next = FS.nameTable[hash];
    FS.nameTable[hash] = node
  }
  ,
  hashRemoveNode: node=>{
    var hash = FS.hashName(node.parent.id, node.name);
    if (FS.nameTable[hash] === node) {
      FS.nameTable[hash] = node.name_next
    } else {
      var current = FS.nameTable[hash];
      while (current) {
        if (current.name_next === node) {
          current.name_next = node.name_next;
          break
        }
        current = current.name_next
      }
    }
  }
  ,
  lookupNode: (parent,name)=>{
    var errCode = FS.mayLookup(parent);
    if (errCode) {
      throw new FS.ErrnoError(errCode,parent)
    }
    var hash = FS.hashName(parent.id, name);
    for (var node = FS.nameTable[hash]; node; node = node.name_next) {
      var nodeName = node.name;
      if (node.parent.id === parent.id && nodeName === name) {
        return node
      }
    }
    return FS.lookup(parent, name)
  }
  ,
  createNode: (parent,name,mode,rdev)=>{
    var node = new FS.FSNode(parent,name,mode,rdev);
    FS.hashAddNode(node);
    return node
  }
  ,
  destroyNode: node=>{
    FS.hashRemoveNode(node)
  }
  ,
  isRoot: node=>{
    return node === node.parent
  }
  ,
  isMountpoint: node=>{
    return !!node.mounted
  }
  ,
  isFile: mode=>{
    return (mode & 61440) === 32768
  }
  ,
  isDir: mode=>{
    return (mode & 61440) === 16384
  }
  ,
  isLink: mode=>{
    return (mode & 61440) === 40960
  }
  ,
  isChrdev: mode=>{
    return (mode & 61440) === 8192
  }
  ,
  isBlkdev: mode=>{
    return (mode & 61440) === 24576
  }
  ,
  isFIFO: mode=>{
    return (mode & 61440) === 4096
  }
  ,
  isSocket: mode=>{
    return (mode & 49152) === 49152
  }
  ,
  flagModes: {
    "r": 0,
    "r+": 2,
    "w": 577,
    "w+": 578,
    "a": 1089,
    "a+": 1090
  },
  modeStringToFlags: str=>{
    var flags = FS.flagModes[str];
    if (typeof flags == "undefined") {
      throw new Error("Unknown file open mode: " + str)
    }
    return flags
  }
  ,
  flagsToPermissionString: flag=>{
    var perms = ["r", "w", "rw"][flag & 3];
    if (flag & 512) {
      perms += "w"
    }
    return perms
  }
  ,
  nodePermissions: (node,perms)=>{
    if (FS.ignorePermissions) {
      return 0
    }
    if (perms.includes("r") && !(node.mode & 292)) {
      return 2
    } else if (perms.includes("w") && !(node.mode & 146)) {
      return 2
    } else if (perms.includes("x") && !(node.mode & 73)) {
      return 2
    }
    return 0
  }
  ,
  mayLookup: dir=>{
    var errCode = FS.nodePermissions(dir, "x");
    if (errCode)
      return errCode;
    if (!dir.node_ops.lookup)
      return 2;
    return 0
  }
  ,
  mayCreate: (dir,name)=>{
    try {
      var node = FS.lookupNode(dir, name);
      return 20
    } catch (e) {}
    return FS.nodePermissions(dir, "wx")
  }
  ,
  mayDelete: (dir,name,isdir)=>{
    var node;
    try {
      node = FS.lookupNode(dir, name)
    } catch (e) {
      return e.errno
    }
    var errCode = FS.nodePermissions(dir, "wx");
    if (errCode) {
      return errCode
    }
    if (isdir) {
      if (!FS.isDir(node.mode)) {
        return 54
      }
      if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
        return 10
      }
    } else {
      if (FS.isDir(node.mode)) {
        return 31
      }
    }
    return 0
  }
  ,
  mayOpen: (node,flags)=>{
    if (!node) {
      return 44
    }
    if (FS.isLink(node.mode)) {
      return 32
    } else if (FS.isDir(node.mode)) {
      if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
        return 31
      }
    }
    return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
  }
  ,
  MAX_OPEN_FDS: 4096,
  nextfd: (fd_start=0,fd_end=FS.MAX_OPEN_FDS)=>{
    for (var fd = fd_start; fd <= fd_end; fd++) {
      if (!FS.streams[fd]) {
        return fd
      }
    }
    throw new FS.ErrnoError(33)
  }
  ,
  getStream: fd=>FS.streams[fd],
  createStream: (stream,fd_start,fd_end)=>{
    if (!FS.FSStream) {
      FS.FSStream = function() {
        this.shared = {}
      }
      ;
      FS.FSStream.prototype = {};
      Object.defineProperties(FS.FSStream.prototype, {
        object: {
          get: function() {
            return this.node
          },
          set: function(val) {
            this.node = val
          }
        },
        isRead: {
          get: function() {
            return (this.flags & 2097155) !== 1
          }
        },
        isWrite: {
          get: function() {
            return (this.flags & 2097155) !== 0
          }
        },
        isAppend: {
          get: function() {
            return this.flags & 1024
          }
        },
        flags: {
          get: function() {
            return this.shared.flags
          },
          set: function(val) {
            this.shared.flags = val
          }
        },
        position: {
          get: function() {
            return this.shared.position
          },
          set: function(val) {
            this.shared.position = val
          }
        }
      })
    }
    stream = Object.assign(new FS.FSStream, stream);
    var fd = FS.nextfd(fd_start, fd_end);
    stream.fd = fd;
    FS.streams[fd] = stream;
    return stream
  }
  ,
  closeStream: fd=>{
    FS.streams[fd] = null
  }
  ,
  chrdev_stream_ops: {
    open: stream=>{
      var device = FS.getDevice(stream.node.rdev);
      stream.stream_ops = device.stream_ops;
      if (stream.stream_ops.open) {
        stream.stream_ops.open(stream)
      }
    }
    ,
    llseek: ()=>{
      throw new FS.ErrnoError(70)
    }
  },
  major: dev=>dev >> 8,
  minor: dev=>dev & 255,
  makedev: (ma,mi)=>ma << 8 | mi,
  registerDevice: (dev,ops)=>{
    FS.devices[dev] = {
      stream_ops: ops
    }
  }
  ,
  getDevice: dev=>FS.devices[dev],
  getMounts: mount=>{
    var mounts = [];
    var check = [mount];
    while (check.length) {
      var m = check.pop();
      mounts.push(m);
      check.push.apply(check, m.mounts)
    }
    return mounts
  }
  ,
  syncfs: (populate,callback)=>{
    if (typeof populate == "function") {
      callback = populate;
      populate = false
    }
    FS.syncFSRequests++;
    if (FS.syncFSRequests > 1) {
      err("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work")
    }
    var mounts = FS.getMounts(FS.root.mount);
    var completed = 0;
    function doCallback(errCode) {
      FS.syncFSRequests--;
      return callback(errCode)
    }
    function done(errCode) {
      if (errCode) {
        if (!done.errored) {
          done.errored = true;
          return doCallback(errCode)
        }
        return
      }
      if (++completed >= mounts.length) {
        doCallback(null)
      }
    }
    mounts.forEach(mount=>{
      if (!mount.type.syncfs) {
        return done(null)
      }
      mount.type.syncfs(mount, populate, done)
    }
    )
  }
  ,
  mount: (type,opts,mountpoint)=>{
    var root = mountpoint === "/";
    var pseudo = !mountpoint;
    var node;
    if (root && FS.root) {
      throw new FS.ErrnoError(10)
    } else if (!root && !pseudo) {
      var lookup = FS.lookupPath(mountpoint, {
        follow_mount: false
      });
      mountpoint = lookup.path;
      node = lookup.node;
      if (FS.isMountpoint(node)) {
        throw new FS.ErrnoError(10)
      }
      if (!FS.isDir(node.mode)) {
        throw new FS.ErrnoError(54)
      }
    }
    var mount = {
      type: type,
      opts: opts,
      mountpoint: mountpoint,
      mounts: []
    };
    var mountRoot = type.mount(mount);
    mountRoot.mount = mount;
    mount.root = mountRoot;
    if (root) {
      FS.root = mountRoot
    } else if (node) {
      node.mounted = mount;
      if (node.mount) {
        node.mount.mounts.push(mount)
      }
    }
    return mountRoot
  }
  ,
  unmount: mountpoint=>{
    var lookup = FS.lookupPath(mountpoint, {
      follow_mount: false
    });
    if (!FS.isMountpoint(lookup.node)) {
      throw new FS.ErrnoError(28)
    }
    var node = lookup.node;
    var mount = node.mounted;
    var mounts = FS.getMounts(mount);
    Object.keys(FS.nameTable).forEach(hash=>{
      var current = FS.nameTable[hash];
      while (current) {
        var next = current.name_next;
        if (mounts.includes(current.mount)) {
          FS.destroyNode(current)
        }
        current = next
      }
    }
    );
    node.mounted = null;
    var idx = node.mount.mounts.indexOf(mount);
    node.mount.mounts.splice(idx, 1)
  }
  ,
  lookup: (parent,name)=>{
    return parent.node_ops.lookup(parent, name)
  }
  ,
  mknod: (path,mode,dev)=>{
    var lookup = FS.lookupPath(path, {
      parent: true
    });
    var parent = lookup.node;
    var name = PATH.basename(path);
    if (!name || name === "." || name === "..") {
      throw new FS.ErrnoError(28)
    }
    var errCode = FS.mayCreate(parent, name);
    if (errCode) {
      throw new FS.ErrnoError(errCode)
    }
    if (!parent.node_ops.mknod) {
      throw new FS.ErrnoError(63)
    }
    return parent.node_ops.mknod(parent, name, mode, dev)
  }
  ,
  create: (path,mode)=>{
    mode = mode !== undefined ? mode : 438;
    mode &= 4095;
    mode |= 32768;
    return FS.mknod(path, mode, 0)
  }
  ,
  mkdir: (path,mode)=>{
    mode = mode !== undefined ? mode : 511;
    mode &= 511 | 512;
    mode |= 16384;
    return FS.mknod(path, mode, 0)
  }
  ,
  mkdirTree: (path,mode)=>{
    var dirs = path.split("/");
    var d = "";
    for (var i = 0; i < dirs.length; ++i) {
      if (!dirs[i])
        continue;
      d += "/" + dirs[i];
      try {
        FS.mkdir(d, mode)
      } catch (e) {
        if (e.errno != 20)
          throw e
      }
    }
  }
  ,
  mkdev: (path,mode,dev)=>{
    if (typeof dev == "undefined") {
      dev = mode;
      mode = 438
    }
    mode |= 8192;
    return FS.mknod(path, mode, dev)
  }
  ,
  symlink: (oldpath,newpath)=>{
    if (!PATH_FS.resolve(oldpath)) {
      throw new FS.ErrnoError(44)
    }
    var lookup = FS.lookupPath(newpath, {
      parent: true
    });
    var parent = lookup.node;
    if (!parent) {
      throw new FS.ErrnoError(44)
    }
    var newname = PATH.basename(newpath);
    var errCode = FS.mayCreate(parent, newname);
    if (errCode) {
      throw new FS.ErrnoError(errCode)
    }
    if (!parent.node_ops.symlink) {
      throw new FS.ErrnoError(63)
    }
    return parent.node_ops.symlink(parent, newname, oldpath)
  }
  ,
  rename: (old_path,new_path)=>{
    var old_dirname = PATH.dirname(old_path);
    var new_dirname = PATH.dirname(new_path);
    var old_name = PATH.basename(old_path);
    var new_name = PATH.basename(new_path);
    var lookup, old_dir, new_dir;
    lookup = FS.lookupPath(old_path, {
      parent: true
    });
    old_dir = lookup.node;
    lookup = FS.lookupPath(new_path, {
      parent: true
    });
    new_dir = lookup.node;
    if (!old_dir || !new_dir)
      throw new FS.ErrnoError(44);
    if (old_dir.mount !== new_dir.mount) {
      throw new FS.ErrnoError(75)
    }
    var old_node = FS.lookupNode(old_dir, old_name);
    var relative = PATH_FS.relative(old_path, new_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(28)
    }
    relative = PATH_FS.relative(new_path, old_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(55)
    }
    var new_node;
    try {
      new_node = FS.lookupNode(new_dir, new_name)
    } catch (e) {}
    if (old_node === new_node) {
      return
    }
    var isdir = FS.isDir(old_node.mode);
    var errCode = FS.mayDelete(old_dir, old_name, isdir);
    if (errCode) {
      throw new FS.ErrnoError(errCode)
    }
    errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
    if (errCode) {
      throw new FS.ErrnoError(errCode)
    }
    if (!old_dir.node_ops.rename) {
      throw new FS.ErrnoError(63)
    }
    if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
      throw new FS.ErrnoError(10)
    }
    if (new_dir !== old_dir) {
      errCode = FS.nodePermissions(old_dir, "w");
      if (errCode) {
        throw new FS.ErrnoError(errCode)
      }
    }
    FS.hashRemoveNode(old_node);
    try {
      old_dir.node_ops.rename(old_node, new_dir, new_name)
    } catch (e) {
      throw e
    } finally {
      FS.hashAddNode(old_node)
    }
  }
  ,
  rmdir: path=>{
    var lookup = FS.lookupPath(path, {
      parent: true
    });
    var parent = lookup.node;
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, true);
    if (errCode) {
      throw new FS.ErrnoError(errCode)
    }
    if (!parent.node_ops.rmdir) {
      throw new FS.ErrnoError(63)
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10)
    }
    parent.node_ops.rmdir(parent, name);
    FS.destroyNode(node)
  }
  ,
  readdir: path=>{
    var lookup = FS.lookupPath(path, {
      follow: true
    });
    var node = lookup.node;
    if (!node.node_ops.readdir) {
      throw new FS.ErrnoError(54)
    }
    return node.node_ops.readdir(node)
  }
  ,
  unlink: path=>{
    var lookup = FS.lookupPath(path, {
      parent: true
    });
    var parent = lookup.node;
    if (!parent) {
      throw new FS.ErrnoError(44)
    }
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, false);
    if (errCode) {
      throw new FS.ErrnoError(errCode)
    }
    if (!parent.node_ops.unlink) {
      throw new FS.ErrnoError(63)
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10)
    }
    parent.node_ops.unlink(parent, name);
    FS.destroyNode(node)
  }
  ,
  readlink: path=>{
    var lookup = FS.lookupPath(path);
    var link = lookup.node;
    if (!link) {
      throw new FS.ErrnoError(44)
    }
    if (!link.node_ops.readlink) {
      throw new FS.ErrnoError(28)
    }
    return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link))
  }
  ,
  stat: (path,dontFollow)=>{
    var lookup = FS.lookupPath(path, {
      follow: !dontFollow
    });
    var node = lookup.node;
    if (!node) {
      throw new FS.ErrnoError(44)
    }
    if (!node.node_ops.getattr) {
      throw new FS.ErrnoError(63)
    }
    return node.node_ops.getattr(node)
  }
  ,
  lstat: path=>{
    return FS.stat(path, true)
  }
  ,
  chmod: (path,mode,dontFollow)=>{
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, {
        follow: !dontFollow
      });
      node = lookup.node
    } else {
      node = path
    }
    if (!node.node_ops.setattr) {
      throw new FS.ErrnoError(63)
    }
    node.node_ops.setattr(node, {
      mode: mode & 4095 | node.mode & ~4095,
      timestamp: Date.now()
    })
  }
  ,
  lchmod: (path,mode)=>{
    FS.chmod(path, mode, true)
  }
  ,
  fchmod: (fd,mode)=>{
    var stream = FS.getStream(fd);
    if (!stream) {
      throw new FS.ErrnoError(8)
    }
    FS.chmod(stream.node, mode)
  }
  ,
  chown: (path,uid,gid,dontFollow)=>{
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, {
        follow: !dontFollow
      });
      node = lookup.node
    } else {
      node = path
    }
    if (!node.node_ops.setattr) {
      throw new FS.ErrnoError(63)
    }
    node.node_ops.setattr(node, {
      timestamp: Date.now()
    })
  }
  ,
  lchown: (path,uid,gid)=>{
    FS.chown(path, uid, gid, true)
  }
  ,
  fchown: (fd,uid,gid)=>{
    var stream = FS.getStream(fd);
    if (!stream) {
      throw new FS.ErrnoError(8)
    }
    FS.chown(stream.node, uid, gid)
  }
  ,
  truncate: (path,len)=>{
    if (len < 0) {
      throw new FS.ErrnoError(28)
    }
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, {
        follow: true
      });
      node = lookup.node
    } else {
      node = path
    }
    if (!node.node_ops.setattr) {
      throw new FS.ErrnoError(63)
    }
    if (FS.isDir(node.mode)) {
      throw new FS.ErrnoError(31)
    }
    if (!FS.isFile(node.mode)) {
      throw new FS.ErrnoError(28)
    }
    var errCode = FS.nodePermissions(node, "w");
    if (errCode) {
      throw new FS.ErrnoError(errCode)
    }
    node.node_ops.setattr(node, {
      size: len,
      timestamp: Date.now()
    })
  }
  ,
  ftruncate: (fd,len)=>{
    var stream = FS.getStream(fd);
    if (!stream) {
      throw new FS.ErrnoError(8)
    }
    if ((stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(28)
    }
    FS.truncate(stream.node, len)
  }
  ,
  utime: (path,atime,mtime)=>{
    var lookup = FS.lookupPath(path, {
      follow: true
    });
    var node = lookup.node;
    node.node_ops.setattr(node, {
      timestamp: Math.max(atime, mtime)
    })
  }
  ,
  open: (path,flags,mode)=>{
    if (path === "") {
      throw new FS.ErrnoError(44)
    }
    flags = typeof flags == "string" ? FS.modeStringToFlags(flags) : flags;
    mode = typeof mode == "undefined" ? 438 : mode;
    if (flags & 64) {
      mode = mode & 4095 | 32768
    } else {
      mode = 0
    }
    var node;
    if (typeof path == "object") {
      node = path
    } else {
      path = PATH.normalize(path);
      try {
        var lookup = FS.lookupPath(path, {
          follow: !(flags & 131072)
        });
        node = lookup.node
      } catch (e) {}
    }
    var created = false;
    if (flags & 64) {
      if (node) {
        if (flags & 128) {
          throw new FS.ErrnoError(20)
        }
      } else {
        node = FS.mknod(path, mode, 0);
        created = true
      }
    }
    if (!node) {
      throw new FS.ErrnoError(44)
    }
    if (FS.isChrdev(node.mode)) {
      flags &= ~512
    }
    if (flags & 65536 && !FS.isDir(node.mode)) {
      throw new FS.ErrnoError(54)
    }
    if (!created) {
      var errCode = FS.mayOpen(node, flags);
      if (errCode) {
        throw new FS.ErrnoError(errCode)
      }
    }
    if (flags & 512 && !created) {
      FS.truncate(node, 0)
    }
    flags &= ~(128 | 512 | 131072);
    var stream = FS.createStream({
      node: node,
      path: FS.getPath(node),
      flags: flags,
      seekable: true,
      position: 0,
      stream_ops: node.stream_ops,
      ungotten: [],
      error: false
    });
    if (stream.stream_ops.open) {
      stream.stream_ops.open(stream)
    }
    if (Module["logReadFiles"] && !(flags & 1)) {
      if (!FS.readFiles)
        FS.readFiles = {};
      if (!(path in FS.readFiles)) {
        FS.readFiles[path] = 1
      }
    }
    return stream
  }
  ,
  close: stream=>{
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8)
    }
    if (stream.getdents)
      stream.getdents = null;
    try {
      if (stream.stream_ops.close) {
        stream.stream_ops.close(stream)
      }
    } catch (e) {
      throw e
    } finally {
      FS.closeStream(stream.fd)
    }
    stream.fd = null
  }
  ,
  isClosed: stream=>{
    return stream.fd === null
  }
  ,
  llseek: (stream,offset,whence)=>{
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8)
    }
    if (!stream.seekable || !stream.stream_ops.llseek) {
      throw new FS.ErrnoError(70)
    }
    if (whence != 0 && whence != 1 && whence != 2) {
      throw new FS.ErrnoError(28)
    }
    stream.position = stream.stream_ops.llseek(stream, offset, whence);
    stream.ungotten = [];
    return stream.position
  }
  ,
  read: (stream,buffer,offset,length,position)=>{
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28)
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8)
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(8)
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31)
    }
    if (!stream.stream_ops.read) {
      throw new FS.ErrnoError(28)
    }
    var seeking = typeof position != "undefined";
    if (!seeking) {
      position = stream.position
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70)
    }
    var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
    if (!seeking)
      stream.position += bytesRead;
    return bytesRead
  }
  ,
  write: (stream,buffer,offset,length,position,canOwn)=>{
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28)
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8)
    }
    if ((stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(8)
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31)
    }
    if (!stream.stream_ops.write) {
      throw new FS.ErrnoError(28)
    }
    if (stream.seekable && stream.flags & 1024) {
      FS.llseek(stream, 0, 2)
    }
    var seeking = typeof position != "undefined";
    if (!seeking) {
      position = stream.position
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70)
    }
    var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
    if (!seeking)
      stream.position += bytesWritten;
    return bytesWritten
  }
  ,
  allocate: (stream,offset,length)=>{
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8)
    }
    if (offset < 0 || length <= 0) {
      throw new FS.ErrnoError(28)
    }
    if ((stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(8)
    }
    if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(43)
    }
    if (!stream.stream_ops.allocate) {
      throw new FS.ErrnoError(138)
    }
    stream.stream_ops.allocate(stream, offset, length)
  }
  ,
  mmap: (stream,length,position,prot,flags)=>{
    if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
      throw new FS.ErrnoError(2)
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(2)
    }
    if (!stream.stream_ops.mmap) {
      throw new FS.ErrnoError(43)
    }
    return stream.stream_ops.mmap(stream, length, position, prot, flags)
  }
  ,
  msync: (stream,buffer,offset,length,mmapFlags)=>{
    if (!stream.stream_ops.msync) {
      return 0
    }
    return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
  }
  ,
  munmap: stream=>0,
  ioctl: (stream,cmd,arg)=>{
    if (!stream.stream_ops.ioctl) {
      throw new FS.ErrnoError(59)
    }
    return stream.stream_ops.ioctl(stream, cmd, arg)
  }
  ,
  readFile: (path,opts={})=>{
    opts.flags = opts.flags || 0;
    opts.encoding = opts.encoding || "binary";
    if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
      throw new Error('Invalid encoding type "' + opts.encoding + '"')
    }
    var ret;
    var stream = FS.open(path, opts.flags);
    var stat = FS.stat(path);
    var length = stat.size;
    var buf = new Uint8Array(length);
    FS.read(stream, buf, 0, length, 0);
    if (opts.encoding === "utf8") {
      ret = UTF8ArrayToString(buf, 0)
    } else if (opts.encoding === "binary") {
      ret = buf
    }
    FS.close(stream);
    return ret
  }
  ,
  writeFile: (path,data,opts={})=>{
    opts.flags = opts.flags || 577;
    var stream = FS.open(path, opts.flags, opts.mode);
    if (typeof data == "string") {
      var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
      var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
      FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn)
    } else if (ArrayBuffer.isView(data)) {
      FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn)
    } else {
      throw new Error("Unsupported data type")
    }
    FS.close(stream)
  }
  ,
  cwd: ()=>FS.currentPath,
  chdir: path=>{
    var lookup = FS.lookupPath(path, {
      follow: true
    });
    if (lookup.node === null) {
      throw new FS.ErrnoError(44)
    }
    if (!FS.isDir(lookup.node.mode)) {
      throw new FS.ErrnoError(54)
    }
    var errCode = FS.nodePermissions(lookup.node, "x");
    if (errCode) {
      throw new FS.ErrnoError(errCode)
    }
    FS.currentPath = lookup.path
  }
  ,
  createDefaultDirectories: ()=>{
    FS.mkdir("/tmp");
    FS.mkdir("/home");
    FS.mkdir("/home/web_user")
  }
  ,
  createDefaultDevices: ()=>{
    FS.mkdir("/dev");
    FS.registerDevice(FS.makedev(1, 3), {
      read: ()=>0,
      write: (stream,buffer,offset,length,pos)=>length
    });
    FS.mkdev("/dev/null", FS.makedev(1, 3));
    TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
    TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
    FS.mkdev("/dev/tty", FS.makedev(5, 0));
    FS.mkdev("/dev/tty1", FS.makedev(6, 0));
    var randomBuffer = new Uint8Array(1024)
      , randomLeft = 0;
    var randomByte = ()=>{
      if (randomLeft === 0) {
        randomLeft = randomFill(randomBuffer).byteLength
      }
      return randomBuffer[--randomLeft]
    }
    ;
    FS.createDevice("/dev", "random", randomByte);
    FS.createDevice("/dev", "urandom", randomByte);
    FS.mkdir("/dev/shm");
    FS.mkdir("/dev/shm/tmp")
  }
  ,
  createSpecialDirectories: ()=>{
    FS.mkdir("/proc");
    var proc_self = FS.mkdir("/proc/self");
    FS.mkdir("/proc/self/fd");
    FS.mount({
      mount: ()=>{
        var node = FS.createNode(proc_self, "fd", 16384 | 511, 73);
        node.node_ops = {
          lookup: (parent,name)=>{
            var fd = +name;
            var stream = FS.getStream(fd);
            if (!stream)
              throw new FS.ErrnoError(8);
            var ret = {
              parent: null,
              mount: {
                mountpoint: "fake"
              },
              node_ops: {
                readlink: ()=>stream.path
              }
            };
            ret.parent = ret;
            return ret
          }
        };
        return node
      }
    }, {}, "/proc/self/fd")
  }
  ,
  createStandardStreams: ()=>{
    if (Module["stdin"]) {
      FS.createDevice("/dev", "stdin", Module["stdin"])
    } else {
      FS.symlink("/dev/tty", "/dev/stdin")
    }
    if (Module["stdout"]) {
      FS.createDevice("/dev", "stdout", null, Module["stdout"])
    } else {
      FS.symlink("/dev/tty", "/dev/stdout")
    }
    if (Module["stderr"]) {
      FS.createDevice("/dev", "stderr", null, Module["stderr"])
    } else {
      FS.symlink("/dev/tty1", "/dev/stderr")
    }
    var stdin = FS.open("/dev/stdin", 0);
    var stdout = FS.open("/dev/stdout", 1);
    var stderr = FS.open("/dev/stderr", 1)
  }
  ,
  ensureErrnoError: ()=>{
    if (FS.ErrnoError)
      return;
    FS.ErrnoError = function ErrnoError(errno, node) {
      this.name = "ErrnoError";
      this.node = node;
      this.setErrno = function(errno) {
        this.errno = errno
      }
      ;
      this.setErrno(errno);
      this.message = "FS error"
    }
    ;
    FS.ErrnoError.prototype = new Error;
    FS.ErrnoError.prototype.constructor = FS.ErrnoError;
    [44].forEach(code=>{
      FS.genericErrors[code] = new FS.ErrnoError(code);
      FS.genericErrors[code].stack = "<generic error, no stack>"
    }
    )
  }
  ,
  staticInit: ()=>{
    FS.ensureErrnoError();
    FS.nameTable = new Array(4096);
    FS.mount(MEMFS, {}, "/");
    FS.createDefaultDirectories();
    FS.createDefaultDevices();
    FS.createSpecialDirectories();
    FS.filesystems = {
      "MEMFS": MEMFS
    }
  }
  ,
  init: (input,output,error)=>{
    FS.init.initialized = true;
    FS.ensureErrnoError();
    Module["stdin"] = input || Module["stdin"];
    Module["stdout"] = output || Module["stdout"];
    Module["stderr"] = error || Module["stderr"];
    FS.createStandardStreams()
  }
  ,
  quit: ()=>{
    FS.init.initialized = false;
    _fflush(0);
    for (var i = 0; i < FS.streams.length; i++) {
      var stream = FS.streams[i];
      if (!stream) {
        continue
      }
      FS.close(stream)
    }
  }
  ,
  getMode: (canRead,canWrite)=>{
    var mode = 0;
    if (canRead)
      mode |= 292 | 73;
    if (canWrite)
      mode |= 146;
    return mode
  }
  ,
  findObject: (path,dontResolveLastLink)=>{
    var ret = FS.analyzePath(path, dontResolveLastLink);
    if (!ret.exists) {
      return null
    }
    return ret.object
  }
  ,
  analyzePath: (path,dontResolveLastLink)=>{
    try {
      var lookup = FS.lookupPath(path, {
        follow: !dontResolveLastLink
      });
      path = lookup.path
    } catch (e) {}
    var ret = {
      isRoot: false,
      exists: false,
      error: 0,
      name: null,
      path: null,
      object: null,
      parentExists: false,
      parentPath: null,
      parentObject: null
    };
    try {
      var lookup = FS.lookupPath(path, {
        parent: true
      });
      ret.parentExists = true;
      ret.parentPath = lookup.path;
      ret.parentObject = lookup.node;
      ret.name = PATH.basename(path);
      lookup = FS.lookupPath(path, {
        follow: !dontResolveLastLink
      });
      ret.exists = true;
      ret.path = lookup.path;
      ret.object = lookup.node;
      ret.name = lookup.node.name;
      ret.isRoot = lookup.path === "/"
    } catch (e) {
      ret.error = e.errno
    }
    return ret
  }
  ,
  createPath: (parent,path,canRead,canWrite)=>{
    parent = typeof parent == "string" ? parent : FS.getPath(parent);
    var parts = path.split("/").reverse();
    while (parts.length) {
      var part = parts.pop();
      if (!part)
        continue;
      var current = PATH.join2(parent, part);
      try {
        FS.mkdir(current)
      } catch (e) {}
      parent = current
    }
    return current
  }
  ,
  createFile: (parent,name,properties,canRead,canWrite)=>{
    var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
    var mode = FS.getMode(canRead, canWrite);
    return FS.create(path, mode)
  }
  ,
  createDataFile: (parent,name,data,canRead,canWrite,canOwn)=>{
    var path = name;
    if (parent) {
      parent = typeof parent == "string" ? parent : FS.getPath(parent);
      path = name ? PATH.join2(parent, name) : parent
    }
    var mode = FS.getMode(canRead, canWrite);
    var node = FS.create(path, mode);
    if (data) {
      if (typeof data == "string") {
        var arr = new Array(data.length);
        for (var i = 0, len = data.length; i < len; ++i)
          arr[i] = data.charCodeAt(i);
        data = arr
      }
      FS.chmod(node, mode | 146);
      var stream = FS.open(node, 577);
      FS.write(stream, data, 0, data.length, 0, canOwn);
      FS.close(stream);
      FS.chmod(node, mode)
    }
    return node
  }
  ,
  createDevice: (parent,name,input,output)=>{
    var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
    var mode = FS.getMode(!!input, !!output);
    if (!FS.createDevice.major)
      FS.createDevice.major = 64;
    var dev = FS.makedev(FS.createDevice.major++, 0);
    FS.registerDevice(dev, {
      open: stream=>{
        stream.seekable = false
      }
      ,
      close: stream=>{
        if (output && output.buffer && output.buffer.length) {
          output(10)
        }
      }
      ,
      read: (stream,buffer,offset,length,pos)=>{
        var bytesRead = 0;
        for (var i = 0; i < length; i++) {
          var result;
          try {
            result = input()
          } catch (e) {
            throw new FS.ErrnoError(29)
          }
          if (result === undefined && bytesRead === 0) {
            throw new FS.ErrnoError(6)
          }
          if (result === null || result === undefined)
            break;
          bytesRead++;
          buffer[offset + i] = result
        }
        if (bytesRead) {
          stream.node.timestamp = Date.now()
        }
        return bytesRead
      }
      ,
      write: (stream,buffer,offset,length,pos)=>{
        for (var i = 0; i < length; i++) {
          try {
            output(buffer[offset + i])
          } catch (e) {
            throw new FS.ErrnoError(29)
          }
        }
        if (length) {
          stream.node.timestamp = Date.now()
        }
        return i
      }
    });
    return FS.mkdev(path, mode, dev)
  }
  ,
  forceLoadFile: obj=>{
    if (obj.isDevice || obj.isFolder || obj.link || obj.contents)
      return true;
    if (typeof XMLHttpRequest != "undefined") {
      throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")
    } else if (read_) {
      try {
        obj.contents = intArrayFromString(read_(obj.url), true);
        obj.usedBytes = obj.contents.length
      } catch (e) {
        throw new FS.ErrnoError(29)
      }
    } else {
      throw new Error("Cannot load without read() or XMLHttpRequest.")
    }
  }
  ,
  createLazyFile: (parent,name,url,canRead,canWrite)=>{
    function LazyUint8Array() {
      this.lengthKnown = false;
      this.chunks = []
    }
    LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
      if (idx > this.length - 1 || idx < 0) {
        return undefined
      }
      var chunkOffset = idx % this.chunkSize;
      var chunkNum = idx / this.chunkSize | 0;
      return this.getter(chunkNum)[chunkOffset]
    }
    ;
    LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
      this.getter = getter
    }
    ;
    LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
      var xhr = new XMLHttpRequest;
      xhr.open("HEAD", url, false);
      xhr.send(null);
      if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304))
        throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
      var datalength = Number(xhr.getResponseHeader("Content-length"));
      var header;
      var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
      var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
      var chunkSize = 1024 * 1024;
      if (!hasByteServing)
        chunkSize = datalength;
      var doXHR = (from,to)=>{
        if (from > to)
          throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
        if (to > datalength - 1)
          throw new Error("only " + datalength + " bytes available! programmer error!");
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, false);
        if (datalength !== chunkSize)
          xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
        xhr.responseType = "arraybuffer";
        if (xhr.overrideMimeType) {
          xhr.overrideMimeType("text/plain; charset=x-user-defined")
        }
        xhr.send(null);
        if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304))
          throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
        if (xhr.response !== undefined) {
          return new Uint8Array(xhr.response || [])
        }
        return intArrayFromString(xhr.responseText || "", true)
      }
      ;
      var lazyArray = this;
      lazyArray.setDataGetter(chunkNum=>{
        var start = chunkNum * chunkSize;
        var end = (chunkNum + 1) * chunkSize - 1;
        end = Math.min(end, datalength - 1);
        if (typeof lazyArray.chunks[chunkNum] == "undefined") {
          lazyArray.chunks[chunkNum] = doXHR(start, end)
        }
        if (typeof lazyArray.chunks[chunkNum] == "undefined")
          throw new Error("doXHR failed!");
        return lazyArray.chunks[chunkNum]
      }
      );
      if (usesGzip || !datalength) {
        chunkSize = datalength = 1;
        datalength = this.getter(0).length;
        chunkSize = datalength;
        out("LazyFiles on gzip forces download of the whole file when length is accessed")
      }
      this._length = datalength;
      this._chunkSize = chunkSize;
      this.lengthKnown = true
    }
    ;
    if (typeof XMLHttpRequest != "undefined") {
      if (!ENVIRONMENT_IS_WORKER)
        throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
      var lazyArray = new LazyUint8Array;
      Object.defineProperties(lazyArray, {
        length: {
          get: function() {
            if (!this.lengthKnown) {
              this.cacheLength()
            }
            return this._length
          }
        },
        chunkSize: {
          get: function() {
            if (!this.lengthKnown) {
              this.cacheLength()
            }
            return this._chunkSize
          }
        }
      });
      var properties = {
        isDevice: false,
        contents: lazyArray
      }
    } else {
      var properties = {
        isDevice: false,
        url: url
      }
    }
    var node = FS.createFile(parent, name, properties, canRead, canWrite);
    if (properties.contents) {
      node.contents = properties.contents
    } else if (properties.url) {
      node.contents = null;
      node.url = properties.url
    }
    Object.defineProperties(node, {
      usedBytes: {
        get: function() {
          return this.contents.length
        }
      }
    });
    var stream_ops = {};
    var keys = Object.keys(node.stream_ops);
    keys.forEach(key=>{
      var fn = node.stream_ops[key];
      stream_ops[key] = function forceLoadLazyFile() {
        FS.forceLoadFile(node);
        return fn.apply(null, arguments)
      }
    }
    );
    function writeChunks(stream, buffer, offset, length, position) {
      var contents = stream.node.contents;
      if (position >= contents.length)
        return 0;
      var size = Math.min(contents.length - position, length);
      if (contents.slice) {
        for (var i = 0; i < size; i++) {
          buffer[offset + i] = contents[position + i]
        }
      } else {
        for (var i = 0; i < size; i++) {
          buffer[offset + i] = contents.get(position + i)
        }
      }
      return size
    }
    stream_ops.read = (stream,buffer,offset,length,position)=>{
      FS.forceLoadFile(node);
      return writeChunks(stream, buffer, offset, length, position)
    }
    ;
    stream_ops.mmap = (stream,length,position,prot,flags)=>{
      FS.forceLoadFile(node);
      var ptr = mmapAlloc(length);
      if (!ptr) {
        throw new FS.ErrnoError(48)
      }
      writeChunks(stream, GROWABLE_HEAP_I8(), ptr, length, position);
      return {
        ptr: ptr,
        allocated: true
      }
    }
    ;
    node.stream_ops = stream_ops;
    return node
  }
  ,
  createPreloadedFile: (parent,name,url,canRead,canWrite,onload,onerror,dontCreateFile,canOwn,preFinish)=>{
    var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
    var dep = getUniqueRunDependency("cp " + fullname);
    function processData(byteArray) {
      function finish(byteArray) {
        if (preFinish)
          preFinish();
        if (!dontCreateFile) {
          FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
        }
        if (onload)
          onload();
        removeRunDependency(dep)
      }
      if (Browser.handledByPreloadPlugin(byteArray, fullname, finish, ()=>{
        if (onerror)
          onerror();
        removeRunDependency(dep)
      }
      )) {
        return
      }
      finish(byteArray)
    }
    addRunDependency(dep);
    if (typeof url == "string") {
      asyncLoad(url, byteArray=>processData(byteArray), onerror)
    } else {
      processData(url)
    }
  }
};
function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var str = "";
  while (!(idx >= endIdx)) {
    var u0 = heapOrArray[idx++];
    if (!u0)
      return str;
    if (!(u0 & 128)) {
      str += String.fromCharCode(u0);
      continue
    }
    var u1 = heapOrArray[idx++] & 63;
    if ((u0 & 224) == 192) {
      str += String.fromCharCode((u0 & 31) << 6 | u1);
      continue
    }
    var u2 = heapOrArray[idx++] & 63;
    if ((u0 & 240) == 224) {
      u0 = (u0 & 15) << 12 | u1 << 6 | u2
    } else {
      u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63
    }
    if (u0 < 65536) {
      str += String.fromCharCode(u0)
    } else {
      var ch = u0 - 65536;
      str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
    }
  }
  return str
}
function UTF8ToString(ptr, maxBytesToRead) {
  return ptr ? UTF8ArrayToString(GROWABLE_HEAP_U8(), ptr, maxBytesToRead) : ""
}
var SYSCALLS = {
  DEFAULT_POLLMASK: 5,
  calculateAt: function(dirfd, path, allowEmpty) {
    if (PATH.isAbs(path)) {
      return path
    }
    var dir;
    if (dirfd === -100) {
      dir = FS.cwd()
    } else {
      var dirstream = SYSCALLS.getStreamFromFD(dirfd);
      dir = dirstream.path
    }
    if (path.length == 0) {
      if (!allowEmpty) {
        throw new FS.ErrnoError(44)
      }
      return dir
    }
    return PATH.join2(dir, path)
  },
  doStat: function(func, path, buf) {
    try {
      var stat = func(path)
    } catch (e) {
      if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
        return -54
      }
      throw e
    }
    GROWABLE_HEAP_I32()[buf >> 2] = stat.dev;
    GROWABLE_HEAP_I32()[buf + 8 >> 2] = stat.ino;
    GROWABLE_HEAP_I32()[buf + 12 >> 2] = stat.mode;
    GROWABLE_HEAP_U32()[buf + 16 >> 2] = stat.nlink;
    GROWABLE_HEAP_I32()[buf + 20 >> 2] = stat.uid;
    GROWABLE_HEAP_I32()[buf + 24 >> 2] = stat.gid;
    GROWABLE_HEAP_I32()[buf + 28 >> 2] = stat.rdev;
    tempI64 = [stat.size >>> 0, (tempDouble = stat.size,
    +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
    GROWABLE_HEAP_I32()[buf + 40 >> 2] = tempI64[0],
    GROWABLE_HEAP_I32()[buf + 44 >> 2] = tempI64[1];
    GROWABLE_HEAP_I32()[buf + 48 >> 2] = 4096;
    GROWABLE_HEAP_I32()[buf + 52 >> 2] = stat.blocks;
    var atime = stat.atime.getTime();
    var mtime = stat.mtime.getTime();
    var ctime = stat.ctime.getTime();
    tempI64 = [Math.floor(atime / 1e3) >>> 0, (tempDouble = Math.floor(atime / 1e3),
    +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
    GROWABLE_HEAP_I32()[buf + 56 >> 2] = tempI64[0],
    GROWABLE_HEAP_I32()[buf + 60 >> 2] = tempI64[1];
    GROWABLE_HEAP_U32()[buf + 64 >> 2] = atime % 1e3 * 1e3;
    tempI64 = [Math.floor(mtime / 1e3) >>> 0, (tempDouble = Math.floor(mtime / 1e3),
    +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
    GROWABLE_HEAP_I32()[buf + 72 >> 2] = tempI64[0],
    GROWABLE_HEAP_I32()[buf + 76 >> 2] = tempI64[1];
    GROWABLE_HEAP_U32()[buf + 80 >> 2] = mtime % 1e3 * 1e3;
    tempI64 = [Math.floor(ctime / 1e3) >>> 0, (tempDouble = Math.floor(ctime / 1e3),
    +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
    GROWABLE_HEAP_I32()[buf + 88 >> 2] = tempI64[0],
    GROWABLE_HEAP_I32()[buf + 92 >> 2] = tempI64[1];
    GROWABLE_HEAP_U32()[buf + 96 >> 2] = ctime % 1e3 * 1e3;
    tempI64 = [stat.ino >>> 0, (tempDouble = stat.ino,
    +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
    GROWABLE_HEAP_I32()[buf + 104 >> 2] = tempI64[0],
    GROWABLE_HEAP_I32()[buf + 108 >> 2] = tempI64[1];
    return 0
  },
  doMsync: function(addr, stream, len, flags, offset) {
    if (!FS.isFile(stream.node.mode)) {
      throw new FS.ErrnoError(43)
    }
    if (flags & 2) {
      return 0
    }
    var buffer = GROWABLE_HEAP_U8().slice(addr, addr + len);
    FS.msync(stream, buffer, offset, len, flags)
  },
  varargs: undefined,
  get: function() {
    SYSCALLS.varargs += 4;
    var ret = GROWABLE_HEAP_I32()[SYSCALLS.varargs - 4 >> 2];
    return ret
  },
  getStr: function(ptr) {
    var ret = UTF8ToString(ptr);
    return ret
  },
  getStreamFromFD: function(fd) {
    var stream = FS.getStream(fd);
    if (!stream)
      throw new FS.ErrnoError(8);
    return stream
  }
};
function _proc_exit(code) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(1, 1, code);
  EXITSTATUS = code;
  if (!keepRuntimeAlive()) {
    PThread.terminateAllThreads();
    if (Module["onExit"])
      Module["onExit"](code);
    ABORT = true
  }
  quit_(code, new ExitStatus(code))
}
function exitJS(status, implicit) {
  EXITSTATUS = status;
  if (ENVIRONMENT_IS_PTHREAD) {
    exitOnMainThread(status);
    throw "unwind"
  }
  if (!keepRuntimeAlive()) {
    exitRuntime()
  }
  _proc_exit(status)
}
var _exit = exitJS;
function handleException(e) {
  if (e instanceof ExitStatus || e == "unwind") {
    return EXITSTATUS
  }
  quit_(1, e)
}
var PThread = {
  unusedWorkers: [],
  runningWorkers: [],
  tlsInitFunctions: [],
  pthreads: {},
  init: function() {
    if (ENVIRONMENT_IS_PTHREAD) {
      PThread.initWorker()
    } else {
      PThread.initMainThread()
    }
  },
  initMainThread: function() {
    var pthreadPoolSize = 4;
    while (pthreadPoolSize--) {
      PThread.allocateUnusedWorker()
    }
  },
  initWorker: function() {
    noExitRuntime = false
  },
  setExitStatus: function(status) {
    EXITSTATUS = status
  },
  terminateAllThreads__deps: ["$terminateWorker"],
  terminateAllThreads: function() {
    for (var worker of PThread.runningWorkers) {
      terminateWorker(worker)
    }
    for (var worker of PThread.unusedWorkers) {
      terminateWorker(worker)
    }
    PThread.unusedWorkers = [];
    PThread.runningWorkers = [];
    PThread.pthreads = []
  },
  returnWorkerToPool: function(worker) {
    var pthread_ptr = worker.pthread_ptr;
    delete PThread.pthreads[pthread_ptr];
    PThread.unusedWorkers.push(worker);
    PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
    worker.pthread_ptr = 0;
    if (ENVIRONMENT_IS_NODE) {
      worker.unref()
    }
    __emscripten_thread_free_data(pthread_ptr)
  },
  receiveObjectTransfer: function(data) {},
  threadInitTLS: function() {
    PThread.tlsInitFunctions.forEach(f=>f())
  },
  loadWasmModuleToWorker: worker=>new Promise(onFinishedLoading=>{
    worker.onmessage = e=>{
      var d = e["data"];
      var cmd = d["cmd"];
      if (worker.pthread_ptr)
        PThread.currentProxiedOperationCallerThread = worker.pthread_ptr;
      if (d["targetThread"] && d["targetThread"] != _pthread_self()) {
        var targetWorker = PThread.pthreads[d.targetThread];
        if (targetWorker) {
          targetWorker.postMessage(d, d["transferList"])
        } else {
          err('Internal error! Worker sent a message "' + cmd + '" to target pthread ' + d["targetThread"] + ", but that thread no longer exists!")
        }
        PThread.currentProxiedOperationCallerThread = undefined;
        return
      }
      if (cmd === "checkMailbox") {
        checkMailbox()
      } else if (cmd === "spawnThread") {
        spawnThread(d)
      } else if (cmd === "cleanupThread") {
        cleanupThread(d["thread"])
      } else if (cmd === "killThread") {
        killThread(d["thread"])
      } else if (cmd === "cancelThread") {
        cancelThread(d["thread"])
      } else if (cmd === "loaded") {
        worker.loaded = true;
        if (ENVIRONMENT_IS_NODE && !worker.pthread_ptr) {
          worker.unref()
        }
        onFinishedLoading(worker)
      } else if (cmd === "print") {
        out("Thread " + d["threadId"] + ": " + d["text"])
      } else if (cmd === "printErr") {
        err("Thread " + d["threadId"] + ": " + d["text"])
      } else if (cmd === "alert") {
        alert("Thread " + d["threadId"] + ": " + d["text"])
      } else if (d.target === "setimmediate") {
        worker.postMessage(d)
      } else if (cmd === "callHandler") {
        Module[d["handler"]](...d["args"])
      } else if (cmd) {
        err("worker sent an unknown command " + cmd)
      }
      PThread.currentProxiedOperationCallerThread = undefined
    }
    ;
    worker.onerror = e=>{
      var message = "worker sent an error!";
      err(message + " " + e.filename + ":" + e.lineno + ": " + e.message);
      throw e
    }
    ;
    if (ENVIRONMENT_IS_NODE) {
      worker.on("message", function(data) {
        worker.onmessage({
          data: data
        })
      });
      worker.on("error", function(e) {
        worker.onerror(e)
      });
      worker.on("detachedExit", function() {})
    }
    var handlers = [];
    var knownHandlers = ["onExit", "onAbort", "print", "printErr"];
    for (var handler of knownHandlers) {
      if (Module.hasOwnProperty(handler)) {
        handlers.push(handler)
      }
    }
    worker.postMessage({
      "cmd": "load",
      "handlers": handlers,
      "urlOrBlob": Module["mainScriptUrlOrBlob"] || _scriptDir,
      "wasmMemory": wasmMemory,
      "wasmModule": wasmModule
    })
  }
  ),
  loadWasmModuleToAllWorkers: function(onMaybeReady) {
    if (ENVIRONMENT_IS_PTHREAD) {
      return onMaybeReady()
    }
    let pthreadPoolReady = Promise.all(PThread.unusedWorkers.map(PThread.loadWasmModuleToWorker));
    pthreadPoolReady.then(onMaybeReady)
  },
  allocateUnusedWorker: function() {
    var worker;
    var pthreadMainJs = locateFile("earthwasm.worker.js");
    worker = new Worker(pthreadMainJs);
    PThread.unusedWorkers.push(worker)
  },
  getNewWorker: function() {
    if (PThread.unusedWorkers.length == 0) {
      PThread.allocateUnusedWorker();
      PThread.loadWasmModuleToWorker(PThread.unusedWorkers[0])
    }
    return PThread.unusedWorkers.pop()
  }
};
Module["PThread"] = PThread;
function callRuntimeCallbacks(callbacks) {
  while (callbacks.length > 0) {
    callbacks.shift()(Module)
  }
}
function establishStackSpace() {
  var pthread_ptr = _pthread_self();
  var stackTop = GROWABLE_HEAP_I32()[pthread_ptr + 52 >> 2];
  var stackSize = GROWABLE_HEAP_I32()[pthread_ptr + 56 >> 2];
  var stackMax = stackTop - stackSize;
  _emscripten_stack_set_limits(stackTop, stackMax);
  stackRestore(stackTop)
}
Module["establishStackSpace"] = establishStackSpace;
function exitOnMainThread(returnCode) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(2, 0, returnCode);
  _exit(returnCode)
}
var wasmTableMirror = [];
function getWasmTableEntry(funcPtr) {
  var func = wasmTableMirror[funcPtr];
  if (!func) {
    if (funcPtr >= wasmTableMirror.length)
      wasmTableMirror.length = funcPtr + 1;
    wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr)
  }
  return func
}
function invokeEntryPoint(ptr, arg) {
  runtimeKeepaliveCounter = 0;
  var result = getWasmTableEntry(ptr)(arg);
  if (keepRuntimeAlive()) {
    PThread.setExitStatus(result)
  } else {
    __emscripten_thread_exit(result)
  }
}
Module["invokeEntryPoint"] = invokeEntryPoint;
function registerTLSInit(tlsInitFunc) {
  PThread.tlsInitFunctions.push(tlsInitFunc)
}
function ___call_sighandler(fp, sig) {
  getWasmTableEntry(fp)(sig)
}
function ExceptionInfo(excPtr) {
  this.excPtr = excPtr;
  this.ptr = excPtr - 24;
  this.set_type = function(type) {
    GROWABLE_HEAP_U32()[this.ptr + 4 >> 2] = type
  }
  ;
  this.get_type = function() {
    return GROWABLE_HEAP_U32()[this.ptr + 4 >> 2]
  }
  ;
  this.set_destructor = function(destructor) {
    GROWABLE_HEAP_U32()[this.ptr + 8 >> 2] = destructor
  }
  ;
  this.get_destructor = function() {
    return GROWABLE_HEAP_U32()[this.ptr + 8 >> 2]
  }
  ;
  this.set_refcount = function(refcount) {
    GROWABLE_HEAP_I32()[this.ptr >> 2] = refcount
  }
  ;
  this.set_caught = function(caught) {
    caught = caught ? 1 : 0;
    GROWABLE_HEAP_I8()[this.ptr + 12 >> 0] = caught
  }
  ;
  this.get_caught = function() {
    return GROWABLE_HEAP_I8()[this.ptr + 12 >> 0] != 0
  }
  ;
  this.set_rethrown = function(rethrown) {
    rethrown = rethrown ? 1 : 0;
    GROWABLE_HEAP_I8()[this.ptr + 13 >> 0] = rethrown
  }
  ;
  this.get_rethrown = function() {
    return GROWABLE_HEAP_I8()[this.ptr + 13 >> 0] != 0
  }
  ;
  this.init = function(type, destructor) {
    this.set_adjusted_ptr(0);
    this.set_type(type);
    this.set_destructor(destructor);
    this.set_refcount(0);
    this.set_caught(false);
    this.set_rethrown(false)
  }
  ;
  this.add_ref = function() {
    Atomics.add(GROWABLE_HEAP_I32(), this.ptr + 0 >> 2, 1)
  }
  ;
  this.release_ref = function() {
    var prev = Atomics.sub(GROWABLE_HEAP_I32(), this.ptr + 0 >> 2, 1);
    return prev === 1
  }
  ;
  this.set_adjusted_ptr = function(adjustedPtr) {
    GROWABLE_HEAP_U32()[this.ptr + 16 >> 2] = adjustedPtr
  }
  ;
  this.get_adjusted_ptr = function() {
    return GROWABLE_HEAP_U32()[this.ptr + 16 >> 2]
  }
  ;
  this.get_exception_ptr = function() {
    var isPointer = ___cxa_is_pointer_type(this.get_type());
    if (isPointer) {
      return GROWABLE_HEAP_U32()[this.excPtr >> 2]
    }
    var adjusted = this.get_adjusted_ptr();
    if (adjusted !== 0)
      return adjusted;
    return this.excPtr
  }
}
var exceptionLast = 0;
var uncaughtExceptionCount = 0;
function ___cxa_throw(ptr, type, destructor) {
  var info = new ExceptionInfo(ptr);
  info.init(type, destructor);
  exceptionLast = ptr;
  uncaughtExceptionCount++;
  throw exceptionLast
}
function ___emscripten_init_main_thread_js(tb) {
  __emscripten_thread_init(tb, !ENVIRONMENT_IS_WORKER, 1, !ENVIRONMENT_IS_WEB);
  PThread.threadInitTLS()
}
function ___emscripten_thread_cleanup(thread) {
  if (!ENVIRONMENT_IS_PTHREAD)
    cleanupThread(thread);
  else
    postMessage({
      "cmd": "cleanupThread",
      "thread": thread
    })
}
function pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(3, 1, pthread_ptr, attr, startRoutine, arg);
  return ___pthread_create_js(pthread_ptr, attr, startRoutine, arg)
}
function ___pthread_create_js(pthread_ptr, attr, startRoutine, arg) {
  if (typeof SharedArrayBuffer == "undefined") {
    err("Current environment does not support SharedArrayBuffer, pthreads are not available!");
    return 6
  }
  var transferList = [];
  var error = 0;
  if (ENVIRONMENT_IS_PTHREAD && (transferList.length === 0 || error)) {
    return pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg)
  }
  if (error)
    return error;
  var threadParams = {
    startRoutine: startRoutine,
    pthread_ptr: pthread_ptr,
    arg: arg,
    transferList: transferList
  };
  if (ENVIRONMENT_IS_PTHREAD) {
    threadParams.cmd = "spawnThread";
    postMessage(threadParams, transferList);
    return 0
  }
  return spawnThread(threadParams)
}
function ___syscall_faccessat(dirfd, path, amode, flags) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(4, 1, dirfd, path, amode, flags);
  try {
    path = SYSCALLS.getStr(path);
    path = SYSCALLS.calculateAt(dirfd, path);
    if (amode & ~7) {
      return -28
    }
    var lookup = FS.lookupPath(path, {
      follow: true
    });
    var node = lookup.node;
    if (!node) {
      return -44
    }
    var perms = "";
    if (amode & 4)
      perms += "r";
    if (amode & 2)
      perms += "w";
    if (amode & 1)
      perms += "x";
    if (perms && FS.nodePermissions(node, perms)) {
      return -2
    }
    return 0
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
      throw e;
    return -e.errno
  }
}
function setErrNo(value) {
  GROWABLE_HEAP_I32()[___errno_location() >> 2] = value;
  return value
}
function ___syscall_fcntl64(fd, cmd, varargs) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(5, 1, fd, cmd, varargs);
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    switch (cmd) {
    case 0:
      {
        var arg = SYSCALLS.get();
        if (arg < 0) {
          return -28
        }
        var newStream;
        newStream = FS.createStream(stream, arg);
        return newStream.fd
      }
    case 1:
    case 2:
      return 0;
    case 3:
      return stream.flags;
    case 4:
      {
        var arg = SYSCALLS.get();
        stream.flags |= arg;
        return 0
      }
    case 5:
      {
        var arg = SYSCALLS.get();
        var offset = 0;
        GROWABLE_HEAP_I16()[arg + offset >> 1] = 2;
        return 0
      }
    case 6:
    case 7:
      return 0;
    case 16:
    case 8:
      return -28;
    case 9:
      setErrNo(28);
      return -1;
    default:
      {
        return -28
      }
    }
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
      throw e;
    return -e.errno
  }
}
function ___syscall_fstat64(fd, buf) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(6, 1, fd, buf);
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    return SYSCALLS.doStat(FS.stat, stream.path, buf)
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
      throw e;
    return -e.errno
  }
}
function stringToUTF8(str, outPtr, maxBytesToWrite) {
  return stringToUTF8Array(str, GROWABLE_HEAP_U8(), outPtr, maxBytesToWrite)
}
function ___syscall_getcwd(buf, size) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(7, 1, buf, size);
  try {
    if (size === 0)
      return -28;
    var cwd = FS.cwd();
    var cwdLengthInBytes = lengthBytesUTF8(cwd) + 1;
    if (size < cwdLengthInBytes)
      return -68;
    stringToUTF8(cwd, buf, size);
    return cwdLengthInBytes
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
      throw e;
    return -e.errno
  }
}
function ___syscall_ioctl(fd, op, varargs) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(8, 1, fd, op, varargs);
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    switch (op) {
    case 21509:
    case 21505:
      {
        if (!stream.tty)
          return -59;
        return 0
      }
    case 21510:
    case 21511:
    case 21512:
    case 21506:
    case 21507:
    case 21508:
      {
        if (!stream.tty)
          return -59;
        return 0
      }
    case 21519:
      {
        if (!stream.tty)
          return -59;
        var argp = SYSCALLS.get();
        GROWABLE_HEAP_I32()[argp >> 2] = 0;
        return 0
      }
    case 21520:
      {
        if (!stream.tty)
          return -59;
        return -28
      }
    case 21531:
      {
        var argp = SYSCALLS.get();
        return FS.ioctl(stream, op, argp)
      }
    case 21523:
      {
        if (!stream.tty)
          return -59;
        return 0
      }
    case 21524:
      {
        if (!stream.tty)
          return -59;
        return 0
      }
    default:
      return -28
    }
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
      throw e;
    return -e.errno
  }
}
function ___syscall_lstat64(path, buf) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(9, 1, path, buf);
  try {
    path = SYSCALLS.getStr(path);
    return SYSCALLS.doStat(FS.lstat, path, buf)
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
      throw e;
    return -e.errno
  }
}
function ___syscall_newfstatat(dirfd, path, buf, flags) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(10, 1, dirfd, path, buf, flags);
  try {
    path = SYSCALLS.getStr(path);
    var nofollow = flags & 256;
    var allowEmpty = flags & 4096;
    flags = flags & ~6400;
    path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
    return SYSCALLS.doStat(nofollow ? FS.lstat : FS.stat, path, buf)
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
      throw e;
    return -e.errno
  }
}
function ___syscall_openat(dirfd, path, flags, varargs) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(11, 1, dirfd, path, flags, varargs);
  SYSCALLS.varargs = varargs;
  try {
    path = SYSCALLS.getStr(path);
    path = SYSCALLS.calculateAt(dirfd, path);
    var mode = varargs ? SYSCALLS.get() : 0;
    return FS.open(path, flags, mode).fd
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
      throw e;
    return -e.errno
  }
}
function ___syscall_stat64(path, buf) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(12, 1, path, buf);
  try {
    path = SYSCALLS.getStr(path);
    return SYSCALLS.doStat(FS.stat, path, buf)
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
      throw e;
    return -e.errno
  }
}
function __embind_register_bigint(primitiveType, name, size, minRange, maxRange) {}
function getShiftFromSize(size) {
  switch (size) {
  case 1:
    return 0;
  case 2:
    return 1;
  case 4:
    return 2;
  case 8:
    return 3;
  default:
    throw new TypeError("Unknown type size: " + size)
  }
}
function embind_init_charCodes() {
  var codes = new Array(256);
  for (var i = 0; i < 256; ++i) {
    codes[i] = String.fromCharCode(i)
  }
  embind_charCodes = codes
}
var embind_charCodes = undefined;
function readLatin1String(ptr) {
  var ret = "";
  var c = ptr;
  while (GROWABLE_HEAP_U8()[c]) {
    ret += embind_charCodes[GROWABLE_HEAP_U8()[c++]]
  }
  return ret
}
var awaitingDependencies = {};
var registeredTypes = {};
var typeDependencies = {};
var char_0 = 48;
var char_9 = 57;
function makeLegalFunctionName(name) {
  if (undefined === name) {
    return "_unknown"
  }
  name = name.replace(/[^a-zA-Z0-9_]/g, "$");
  var f = name.charCodeAt(0);
  if (f >= char_0 && f <= char_9) {
    return "_" + name
  }
  return name
}
function createNamedFunction(name, body) {
  name = makeLegalFunctionName(name);
  return {
    [name]: function() {
      return body.apply(this, arguments)
    }
  }[name]
}
function extendError(baseErrorType, errorName) {
  var errorClass = createNamedFunction(errorName, function(message) {
    this.name = errorName;
    this.message = message;
    var stack = new Error(message).stack;
    if (stack !== undefined) {
      this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "")
    }
  });
  errorClass.prototype = Object.create(baseErrorType.prototype);
  errorClass.prototype.constructor = errorClass;
  errorClass.prototype.toString = function() {
    if (this.message === undefined) {
      return this.name
    } else {
      return this.name + ": " + this.message
    }
  }
  ;
  return errorClass
}
var BindingError = undefined;
function throwBindingError(message) {
  throw new BindingError(message)
}
var InternalError = undefined;
function throwInternalError(message) {
  throw new InternalError(message)
}
function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
  myTypes.forEach(function(type) {
    typeDependencies[type] = dependentTypes
  });
  function onComplete(typeConverters) {
    var myTypeConverters = getTypeConverters(typeConverters);
    if (myTypeConverters.length !== myTypes.length) {
      throwInternalError("Mismatched type converter count")
    }
    for (var i = 0; i < myTypes.length; ++i) {
      registerType(myTypes[i], myTypeConverters[i])
    }
  }
  var typeConverters = new Array(dependentTypes.length);
  var unregisteredTypes = [];
  var registered = 0;
  dependentTypes.forEach((dt,i)=>{
    if (registeredTypes.hasOwnProperty(dt)) {
      typeConverters[i] = registeredTypes[dt]
    } else {
      unregisteredTypes.push(dt);
      if (!awaitingDependencies.hasOwnProperty(dt)) {
        awaitingDependencies[dt] = []
      }
      awaitingDependencies[dt].push(()=>{
        typeConverters[i] = registeredTypes[dt];
        ++registered;
        if (registered === unregisteredTypes.length) {
          onComplete(typeConverters)
        }
      }
      )
    }
  }
  );
  if (0 === unregisteredTypes.length) {
    onComplete(typeConverters)
  }
}
function registerType(rawType, registeredInstance, options={}) {
  if (!("argPackAdvance"in registeredInstance)) {
    throw new TypeError("registerType registeredInstance requires argPackAdvance")
  }
  var name = registeredInstance.name;
  if (!rawType) {
    throwBindingError('type "' + name + '" must have a positive integer typeid pointer')
  }
  if (registeredTypes.hasOwnProperty(rawType)) {
    if (options.ignoreDuplicateRegistrations) {
      return
    } else {
      throwBindingError("Cannot register type '" + name + "' twice")
    }
  }
  registeredTypes[rawType] = registeredInstance;
  delete typeDependencies[rawType];
  if (awaitingDependencies.hasOwnProperty(rawType)) {
    var callbacks = awaitingDependencies[rawType];
    delete awaitingDependencies[rawType];
    callbacks.forEach(cb=>cb())
  }
}
function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
  var shift = getShiftFromSize(size);
  name = readLatin1String(name);
  registerType(rawType, {
    name: name,
    "fromWireType": function(wt) {
      return !!wt
    },
    "toWireType": function(destructors, o) {
      return o ? trueValue : falseValue
    },
    "argPackAdvance": 8,
    "readValueFromPointer": function(pointer) {
      var heap;
      if (size === 1) {
        heap = GROWABLE_HEAP_I8()
      } else if (size === 2) {
        heap = GROWABLE_HEAP_I16()
      } else if (size === 4) {
        heap = GROWABLE_HEAP_I32()
      } else {
        throw new TypeError("Unknown boolean type size: " + name)
      }
      return this["fromWireType"](heap[pointer >> shift])
    },
    destructorFunction: null
  })
}
function HandleAllocator() {
  this.allocated = [undefined];
  this.freelist = [];
  this.get = function(id) {
    return this.allocated[id]
  }
  ;
  this.allocate = function(handle) {
    let id = this.freelist.pop() || this.allocated.length;
    this.allocated[id] = handle;
    return id
  }
  ;
  this.free = function(id) {
    this.allocated[id] = undefined;
    this.freelist.push(id)
  }
}
var emval_handles = new HandleAllocator;
function __emval_decref(handle) {
  if (handle >= emval_handles.reserved && 0 === --emval_handles.get(handle).refcount) {
    emval_handles.free(handle)
  }
}
function count_emval_handles() {
  var count = 0;
  for (var i = emval_handles.reserved; i < emval_handles.allocated.length; ++i) {
    if (emval_handles.allocated[i] !== undefined) {
      ++count
    }
  }
  return count
}
function init_emval() {
  emval_handles.allocated.push({
    value: undefined
  }, {
    value: null
  }, {
    value: true
  }, {
    value: false
  });
  emval_handles.reserved = emval_handles.allocated.length;
  Module["count_emval_handles"] = count_emval_handles
}
var Emval = {
  toValue: handle=>{
    if (!handle) {
      throwBindingError("Cannot use deleted val. handle = " + handle)
    }
    return emval_handles.get(handle).value
  }
  ,
  toHandle: value=>{
    switch (value) {
    case undefined:
      return 1;
    case null:
      return 2;
    case true:
      return 3;
    case false:
      return 4;
    default:
      {
        return emval_handles.allocate({
          refcount: 1,
          value: value
        })
      }
    }
  }
};
function simpleReadValueFromPointer(pointer) {
  return this["fromWireType"](GROWABLE_HEAP_I32()[pointer >> 2])
}
function __embind_register_emval(rawType, name) {
  name = readLatin1String(name);
  registerType(rawType, {
    name: name,
    "fromWireType": function(handle) {
      var rv = Emval.toValue(handle);
      __emval_decref(handle);
      return rv
    },
    "toWireType": function(destructors, value) {
      return Emval.toHandle(value)
    },
    "argPackAdvance": 8,
    "readValueFromPointer": simpleReadValueFromPointer,
    destructorFunction: null
  })
}
function floatReadValueFromPointer(name, shift) {
  switch (shift) {
  case 2:
    return function(pointer) {
      return this["fromWireType"](GROWABLE_HEAP_F32()[pointer >> 2])
    }
    ;
  case 3:
    return function(pointer) {
      return this["fromWireType"](GROWABLE_HEAP_F64()[pointer >> 3])
    }
    ;
  default:
    throw new TypeError("Unknown float type: " + name)
  }
}
function __embind_register_float(rawType, name, size) {
  var shift = getShiftFromSize(size);
  name = readLatin1String(name);
  registerType(rawType, {
    name: name,
    "fromWireType": function(value) {
      return value
    },
    "toWireType": function(destructors, value) {
      return value
    },
    "argPackAdvance": 8,
    "readValueFromPointer": floatReadValueFromPointer(name, shift),
    destructorFunction: null
  })
}
function runDestructors(destructors) {
  while (destructors.length) {
    var ptr = destructors.pop();
    var del = destructors.pop();
    del(ptr)
  }
}
function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc, isAsync) {
  var argCount = argTypes.length;
  if (argCount < 2) {
    throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!")
  }
  var isClassMethodFunc = argTypes[1] !== null && classType !== null;
  var needsDestructorStack = false;
  for (var i = 1; i < argTypes.length; ++i) {
    if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
      needsDestructorStack = true;
      break
    }
  }
  var returns = argTypes[0].name !== "void";
  var expectedArgCount = argCount - 2;
  var argsWired = new Array(expectedArgCount);
  var invokerFuncArgs = [];
  var destructors = [];
  return function() {
    if (arguments.length !== expectedArgCount) {
      throwBindingError("function " + humanName + " called with " + arguments.length + " arguments, expected " + expectedArgCount + " args!")
    }
    destructors.length = 0;
    var thisWired;
    invokerFuncArgs.length = isClassMethodFunc ? 2 : 1;
    invokerFuncArgs[0] = cppTargetFunc;
    if (isClassMethodFunc) {
      thisWired = argTypes[1]["toWireType"](destructors, this);
      invokerFuncArgs[1] = thisWired
    }
    for (var i = 0; i < expectedArgCount; ++i) {
      argsWired[i] = argTypes[i + 2]["toWireType"](destructors, arguments[i]);
      invokerFuncArgs.push(argsWired[i])
    }
    var rv = cppInvokerFunc.apply(null, invokerFuncArgs);
    function onDone(rv) {
      if (needsDestructorStack) {
        runDestructors(destructors)
      } else {
        for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; i++) {
          var param = i === 1 ? thisWired : argsWired[i - 2];
          if (argTypes[i].destructorFunction !== null) {
            argTypes[i].destructorFunction(param)
          }
        }
      }
      if (returns) {
        return argTypes[0]["fromWireType"](rv)
      }
    }
    return onDone(rv)
  }
}
function ensureOverloadTable(proto, methodName, humanName) {
  if (undefined === proto[methodName].overloadTable) {
    var prevFunc = proto[methodName];
    proto[methodName] = function() {
      if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
        throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!")
      }
      return proto[methodName].overloadTable[arguments.length].apply(this, arguments)
    }
    ;
    proto[methodName].overloadTable = [];
    proto[methodName].overloadTable[prevFunc.argCount] = prevFunc
  }
}
function exposePublicSymbol(name, value, numArguments) {
  if (Module.hasOwnProperty(name)) {
    if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
      throwBindingError("Cannot register public name '" + name + "' twice")
    }
    ensureOverloadTable(Module, name, name);
    if (Module.hasOwnProperty(numArguments)) {
      throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!")
    }
    Module[name].overloadTable[numArguments] = value
  } else {
    Module[name] = value;
    if (undefined !== numArguments) {
      Module[name].numArguments = numArguments
    }
  }
}
function heap32VectorToArray(count, firstElement) {
  var array = [];
  for (var i = 0; i < count; i++) {
    array.push(GROWABLE_HEAP_U32()[firstElement + i * 4 >> 2])
  }
  return array
}
function replacePublicSymbol(name, value, numArguments) {
  if (!Module.hasOwnProperty(name)) {
    throwInternalError("Replacing nonexistant public symbol")
  }
  if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
    Module[name].overloadTable[numArguments] = value
  } else {
    Module[name] = value;
    Module[name].argCount = numArguments
  }
}
function dynCallLegacy(sig, ptr, args) {
  var f = Module["dynCall_" + sig];
  return args && args.length ? f.apply(null, [ptr].concat(args)) : f.call(null, ptr)
}
function dynCall(sig, ptr, args) {
  if (sig.includes("j")) {
    return dynCallLegacy(sig, ptr, args)
  }
  var rtn = getWasmTableEntry(ptr).apply(null, args);
  return rtn
}
function getDynCaller(sig, ptr) {
  var argCache = [];
  return function() {
    argCache.length = 0;
    Object.assign(argCache, arguments);
    return dynCall(sig, ptr, argCache)
  }
}
function embind__requireFunction(signature, rawFunction) {
  signature = readLatin1String(signature);
  function makeDynCaller() {
    if (signature.includes("j")) {
      return getDynCaller(signature, rawFunction)
    }
    return getWasmTableEntry(rawFunction)
  }
  var fp = makeDynCaller();
  if (typeof fp != "function") {
    throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction)
  }
  return fp
}
var UnboundTypeError = undefined;
function getTypeName(type) {
  var ptr = ___getTypeName(type);
  var rv = readLatin1String(ptr);
  _free(ptr);
  return rv
}
function throwUnboundTypeError(message, types) {
  var unboundTypes = [];
  var seen = {};
  function visit(type) {
    if (seen[type]) {
      return
    }
    if (registeredTypes[type]) {
      return
    }
    if (typeDependencies[type]) {
      typeDependencies[type].forEach(visit);
      return
    }
    unboundTypes.push(type);
    seen[type] = true
  }
  types.forEach(visit);
  throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([", "]))
}
function __embind_register_function(name, argCount, rawArgTypesAddr, signature, rawInvoker, fn, isAsync) {
  var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
  name = readLatin1String(name);
  rawInvoker = embind__requireFunction(signature, rawInvoker);
  exposePublicSymbol(name, function() {
    throwUnboundTypeError("Cannot call " + name + " due to unbound types", argTypes)
  }, argCount - 1);
  whenDependentTypesAreResolved([], argTypes, function(argTypes) {
    var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1));
    replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null, rawInvoker, fn, isAsync), argCount - 1);
    return []
  })
}
function integerReadValueFromPointer(name, shift, signed) {
  switch (shift) {
  case 0:
    return signed ? function readS8FromPointer(pointer) {
      return GROWABLE_HEAP_I8()[pointer]
    }
    : function readU8FromPointer(pointer) {
      return GROWABLE_HEAP_U8()[pointer]
    }
    ;
  case 1:
    return signed ? function readS16FromPointer(pointer) {
      return GROWABLE_HEAP_I16()[pointer >> 1]
    }
    : function readU16FromPointer(pointer) {
      return GROWABLE_HEAP_U16()[pointer >> 1]
    }
    ;
  case 2:
    return signed ? function readS32FromPointer(pointer) {
      return GROWABLE_HEAP_I32()[pointer >> 2]
    }
    : function readU32FromPointer(pointer) {
      return GROWABLE_HEAP_U32()[pointer >> 2]
    }
    ;
  default:
    throw new TypeError("Unknown integer type: " + name)
  }
}
function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
  name = readLatin1String(name);
  if (maxRange === -1) {
    maxRange = 4294967295
  }
  var shift = getShiftFromSize(size);
  var fromWireType = value=>value;
  if (minRange === 0) {
    var bitshift = 32 - 8 * size;
    fromWireType = value=>value << bitshift >>> bitshift
  }
  var isUnsignedType = name.includes("unsigned");
  var checkAssertions = (value,toTypeName)=>{}
  ;
  var toWireType;
  if (isUnsignedType) {
    toWireType = function(destructors, value) {
      checkAssertions(value, this.name);
      return value >>> 0
    }
  } else {
    toWireType = function(destructors, value) {
      checkAssertions(value, this.name);
      return value
    }
  }
  registerType(primitiveType, {
    name: name,
    "fromWireType": fromWireType,
    "toWireType": toWireType,
    "argPackAdvance": 8,
    "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0),
    destructorFunction: null
  })
}
function __embind_register_memory_view(rawType, dataTypeIndex, name) {
  var typeMapping = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
  var TA = typeMapping[dataTypeIndex];
  function decodeMemoryView(handle) {
    handle = handle >> 2;
    var heap = GROWABLE_HEAP_U32();
    var size = heap[handle];
    var data = heap[handle + 1];
    return new TA(heap.buffer,data,size)
  }
  name = readLatin1String(name);
  registerType(rawType, {
    name: name,
    "fromWireType": decodeMemoryView,
    "argPackAdvance": 8,
    "readValueFromPointer": decodeMemoryView
  }, {
    ignoreDuplicateRegistrations: true
  })
}
function __embind_register_std_string(rawType, name) {
  name = readLatin1String(name);
  var stdStringIsUTF8 = name === "std::string";
  registerType(rawType, {
    name: name,
    "fromWireType": function(value) {
      var length = GROWABLE_HEAP_U32()[value >> 2];
      var payload = value + 4;
      var str;
      if (stdStringIsUTF8) {
        var decodeStartPtr = payload;
        for (var i = 0; i <= length; ++i) {
          var currentBytePtr = payload + i;
          if (i == length || GROWABLE_HEAP_U8()[currentBytePtr] == 0) {
            var maxRead = currentBytePtr - decodeStartPtr;
            var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
            if (str === undefined) {
              str = stringSegment
            } else {
              str += String.fromCharCode(0);
              str += stringSegment
            }
            decodeStartPtr = currentBytePtr + 1
          }
        }
      } else {
        var a = new Array(length);
        for (var i = 0; i < length; ++i) {
          a[i] = String.fromCharCode(GROWABLE_HEAP_U8()[payload + i])
        }
        str = a.join("")
      }
      _free(value);
      return str
    },
    "toWireType": function(destructors, value) {
      if (value instanceof ArrayBuffer) {
        value = new Uint8Array(value)
      }
      var length;
      var valueIsOfTypeString = typeof value == "string";
      if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
        throwBindingError("Cannot pass non-string to std::string")
      }
      if (stdStringIsUTF8 && valueIsOfTypeString) {
        length = lengthBytesUTF8(value)
      } else {
        length = value.length
      }
      var base = _malloc(4 + length + 1);
      var ptr = base + 4;
      GROWABLE_HEAP_U32()[base >> 2] = length;
      if (stdStringIsUTF8 && valueIsOfTypeString) {
        stringToUTF8(value, ptr, length + 1)
      } else {
        if (valueIsOfTypeString) {
          for (var i = 0; i < length; ++i) {
            var charCode = value.charCodeAt(i);
            if (charCode > 255) {
              _free(ptr);
              throwBindingError("String has UTF-16 code units that do not fit in 8 bits")
            }
            GROWABLE_HEAP_U8()[ptr + i] = charCode
          }
        } else {
          for (var i = 0; i < length; ++i) {
            GROWABLE_HEAP_U8()[ptr + i] = value[i]
          }
        }
      }
      if (destructors !== null) {
        destructors.push(_free, base)
      }
      return base
    },
    "argPackAdvance": 8,
    "readValueFromPointer": simpleReadValueFromPointer,
    destructorFunction: function(ptr) {
      _free(ptr)
    }
  })
}
function UTF16ToString(ptr, maxBytesToRead) {
  var str = "";
  for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
    var codeUnit = GROWABLE_HEAP_I16()[ptr + i * 2 >> 1];
    if (codeUnit == 0)
      break;
    str += String.fromCharCode(codeUnit)
  }
  return str
}
function stringToUTF16(str, outPtr, maxBytesToWrite) {
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 2147483647
  }
  if (maxBytesToWrite < 2)
    return 0;
  maxBytesToWrite -= 2;
  var startPtr = outPtr;
  var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    var codeUnit = str.charCodeAt(i);
    GROWABLE_HEAP_I16()[outPtr >> 1] = codeUnit;
    outPtr += 2
  }
  GROWABLE_HEAP_I16()[outPtr >> 1] = 0;
  return outPtr - startPtr
}
function lengthBytesUTF16(str) {
  return str.length * 2
}
function UTF32ToString(ptr, maxBytesToRead) {
  var i = 0;
  var str = "";
  while (!(i >= maxBytesToRead / 4)) {
    var utf32 = GROWABLE_HEAP_I32()[ptr + i * 4 >> 2];
    if (utf32 == 0)
      break;
    ++i;
    if (utf32 >= 65536) {
      var ch = utf32 - 65536;
      str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
    } else {
      str += String.fromCharCode(utf32)
    }
  }
  return str
}
function stringToUTF32(str, outPtr, maxBytesToWrite) {
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 2147483647
  }
  if (maxBytesToWrite < 4)
    return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 55296 && codeUnit <= 57343) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023
    }
    GROWABLE_HEAP_I32()[outPtr >> 2] = codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr)
      break
  }
  GROWABLE_HEAP_I32()[outPtr >> 2] = 0;
  return outPtr - startPtr
}
function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 55296 && codeUnit <= 57343)
      ++i;
    len += 4
  }
  return len
}
function __embind_register_std_wstring(rawType, charSize, name) {
  name = readLatin1String(name);
  var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
  if (charSize === 2) {
    decodeString = UTF16ToString;
    encodeString = stringToUTF16;
    lengthBytesUTF = lengthBytesUTF16;
    getHeap = ()=>GROWABLE_HEAP_U16();
    shift = 1
  } else if (charSize === 4) {
    decodeString = UTF32ToString;
    encodeString = stringToUTF32;
    lengthBytesUTF = lengthBytesUTF32;
    getHeap = ()=>GROWABLE_HEAP_U32();
    shift = 2
  }
  registerType(rawType, {
    name: name,
    "fromWireType": function(value) {
      var length = GROWABLE_HEAP_U32()[value >> 2];
      var HEAP = getHeap();
      var str;
      var decodeStartPtr = value + 4;
      for (var i = 0; i <= length; ++i) {
        var currentBytePtr = value + 4 + i * charSize;
        if (i == length || HEAP[currentBytePtr >> shift] == 0) {
          var maxReadBytes = currentBytePtr - decodeStartPtr;
          var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
          if (str === undefined) {
            str = stringSegment
          } else {
            str += String.fromCharCode(0);
            str += stringSegment
          }
          decodeStartPtr = currentBytePtr + charSize
        }
      }
      _free(value);
      return str
    },
    "toWireType": function(destructors, value) {
      if (!(typeof value == "string")) {
        throwBindingError("Cannot pass non-string to C++ string type " + name)
      }
      var length = lengthBytesUTF(value);
      var ptr = _malloc(4 + length + charSize);
      GROWABLE_HEAP_U32()[ptr >> 2] = length >> shift;
      encodeString(value, ptr + 4, length + charSize);
      if (destructors !== null) {
        destructors.push(_free, ptr)
      }
      return ptr
    },
    "argPackAdvance": 8,
    "readValueFromPointer": simpleReadValueFromPointer,
    destructorFunction: function(ptr) {
      _free(ptr)
    }
  })
}
function __embind_register_void(rawType, name) {
  name = readLatin1String(name);
  registerType(rawType, {
    isVoid: true,
    name: name,
    "argPackAdvance": 0,
    "fromWireType": function() {
      return undefined
    },
    "toWireType": function(destructors, o) {
      return undefined
    }
  })
}
function __emscripten_default_pthread_stack_size() {
  return 5242880
}
function __emscripten_err(str) {
  err(UTF8ToString(str))
}
function __emscripten_fetch_free(id) {
  var xhr = Fetch.xhrs[id];
  if (xhr) {
    delete Fetch.xhrs[id];
    if (xhr.readyState > 0 && xhr.readyState < 4) {
      xhr.abort()
    }
  }
}
function __emscripten_fetch_get_response_headers(id, dst, dstSizeBytes) {
  var responseHeaders = Fetch.xhrs[id].getAllResponseHeaders();
  var lengthBytes = lengthBytesUTF8(responseHeaders) + 1;
  stringToUTF8(responseHeaders, dst, dstSizeBytes);
  return Math.min(lengthBytes, dstSizeBytes)
}
function __emscripten_fetch_get_response_headers_length(id) {
  return lengthBytesUTF8(Fetch.xhrs[id].getAllResponseHeaders()) + 1
}
var nowIsMonotonic = true;
function __emscripten_get_now_is_monotonic() {
  return nowIsMonotonic
}
function maybeExit() {
  if (runtimeExited) {
    return
  }
  if (!keepRuntimeAlive()) {
    try {
      if (ENVIRONMENT_IS_PTHREAD)
        __emscripten_thread_exit(EXITSTATUS);
      else
        _exit(EXITSTATUS)
    } catch (e) {
      handleException(e)
    }
  }
}
function callUserCallback(func) {
  if (runtimeExited || ABORT) {
    return
  }
  try {
    func();
    maybeExit()
  } catch (e) {
    handleException(e)
  }
}
function __emscripten_thread_mailbox_await(pthread_ptr) {
  if (typeof Atomics.waitAsync === "function") {
    var wait = Atomics.waitAsync(GROWABLE_HEAP_I32(), pthread_ptr >> 2, pthread_ptr);
    wait.value.then(checkMailbox);
    var waitingAsync = pthread_ptr + 128;
    Atomics.store(GROWABLE_HEAP_I32(), waitingAsync >> 2, 1)
  }
}
Module["__emscripten_thread_mailbox_await"] = __emscripten_thread_mailbox_await;
function checkMailbox() {
  var pthread_ptr = _pthread_self();
  if (pthread_ptr) {
    __emscripten_thread_mailbox_await(pthread_ptr);
    callUserCallback(()=>__emscripten_check_mailbox())
  }
}
Module["checkMailbox"] = checkMailbox;
function __emscripten_notify_mailbox_postmessage(targetThreadId, currThreadId, mainThreadId) {
  if (targetThreadId == currThreadId) {
    setTimeout(()=>checkMailbox())
  } else if (ENVIRONMENT_IS_PTHREAD) {
    postMessage({
      "targetThread": targetThreadId,
      "cmd": "checkMailbox"
    })
  } else {
    var worker = PThread.pthreads[targetThreadId];
    if (!worker) {
      return
    }
    worker.postMessage({
      "cmd": "checkMailbox"
    })
  }
}
function __emscripten_set_offscreencanvas_size(target, width, height) {
  return -1
}
function __emscripten_throw_longjmp() {
  throw Infinity
}
function requireRegisteredType(rawType, humanName) {
  var impl = registeredTypes[rawType];
  if (undefined === impl) {
    throwBindingError(humanName + " has unknown type " + getTypeName(rawType))
  }
  return impl
}
function __emval_as(handle, returnType, destructorsRef) {
  handle = Emval.toValue(handle);
  returnType = requireRegisteredType(returnType, "emval::as");
  var destructors = [];
  var rd = Emval.toHandle(destructors);
  GROWABLE_HEAP_U32()[destructorsRef >> 2] = rd;
  return returnType["toWireType"](destructors, handle)
}
function emval_allocateDestructors(destructorsRef) {
  var destructors = [];
  GROWABLE_HEAP_U32()[destructorsRef >> 2] = Emval.toHandle(destructors);
  return destructors
}
var emval_symbols = {};
function getStringOrSymbol(address) {
  var symbol = emval_symbols[address];
  if (symbol === undefined) {
    return readLatin1String(address)
  }
  return symbol
}
var emval_methodCallers = [];
function __emval_call_method(caller, handle, methodName, destructorsRef, args) {
  caller = emval_methodCallers[caller];
  handle = Emval.toValue(handle);
  methodName = getStringOrSymbol(methodName);
  return caller(handle, methodName, emval_allocateDestructors(destructorsRef), args)
}
function __emval_call_void_method(caller, handle, methodName, args) {
  caller = emval_methodCallers[caller];
  handle = Emval.toValue(handle);
  methodName = getStringOrSymbol(methodName);
  caller(handle, methodName, null, args)
}
function __emval_equals(first, second) {
  first = Emval.toValue(first);
  second = Emval.toValue(second);
  return first == second
}
function emval_get_global() {
  if (typeof globalThis == "object") {
    return globalThis
  }
  function testGlobal(obj) {
    obj["$$$embind_global$$$"] = obj;
    var success = typeof $$$embind_global$$$ == "object" && obj["$$$embind_global$$$"] == obj;
    if (!success) {
      delete obj["$$$embind_global$$$"]
    }
    return success
  }
  if (typeof $$$embind_global$$$ == "object") {
    return $$$embind_global$$$
  }
  if (typeof global == "object" && testGlobal(global)) {
    $$$embind_global$$$ = global
  } else if (typeof self == "object" && testGlobal(self)) {
    $$$embind_global$$$ = self
  }
  if (typeof $$$embind_global$$$ == "object") {
    return $$$embind_global$$$
  }
  throw Error("unable to get global object.")
}
function __emval_get_global(name) {
  if (name === 0) {
    return Emval.toHandle(emval_get_global())
  } else {
    name = getStringOrSymbol(name);
    return Emval.toHandle(emval_get_global()[name])
  }
}
function emval_addMethodCaller(caller) {
  var id = emval_methodCallers.length;
  emval_methodCallers.push(caller);
  return id
}
function emval_lookupTypes(argCount, argTypes) {
  var a = new Array(argCount);
  for (var i = 0; i < argCount; ++i) {
    a[i] = requireRegisteredType(GROWABLE_HEAP_U32()[argTypes + i * 4 >> 2], "parameter " + i)
  }
  return a
}
var emval_registeredMethods = [];
function __emval_get_method_caller(argCount, argTypes) {
  var types = emval_lookupTypes(argCount, argTypes);
  var retType = types[0];
  var signatureName = retType.name + "_$" + types.slice(1).map(function(t) {
    return t.name
  }).join("_") + "$";
  var returnId = emval_registeredMethods[signatureName];
  if (returnId !== undefined) {
    return returnId
  }
  var argN = new Array(argCount - 1);
  var invokerFunction = (handle,name,destructors,args)=>{
    var offset = 0;
    for (var i = 0; i < argCount - 1; ++i) {
      argN[i] = types[i + 1]["readValueFromPointer"](args + offset);
      offset += types[i + 1]["argPackAdvance"]
    }
    var rv = handle[name].apply(handle, argN);
    for (var i = 0; i < argCount - 1; ++i) {
      if (types[i + 1].deleteObject) {
        types[i + 1].deleteObject(argN[i])
      }
    }
    if (!retType.isVoid) {
      return retType["toWireType"](destructors, rv)
    }
  }
  ;
  returnId = emval_addMethodCaller(invokerFunction);
  emval_registeredMethods[signatureName] = returnId;
  return returnId
}
function __emval_get_property(handle, key) {
  handle = Emval.toValue(handle);
  key = Emval.toValue(key);
  return Emval.toHandle(handle[key])
}
function __emval_incref(handle) {
  if (handle > 4) {
    emval_handles.get(handle).refcount += 1
  }
}
function __emval_new_array() {
  return Emval.toHandle([])
}
function __emval_new_cstring(v) {
  return Emval.toHandle(getStringOrSymbol(v))
}
function __emval_new_object() {
  return Emval.toHandle({})
}
function __emval_run_destructors(handle) {
  var destructors = Emval.toValue(handle);
  runDestructors(destructors);
  __emval_decref(handle)
}
function __emval_set_property(handle, key, value) {
  handle = Emval.toValue(handle);
  key = Emval.toValue(key);
  value = Emval.toValue(value);
  handle[key] = value
}
function __emval_take_value(type, arg) {
  type = requireRegisteredType(type, "_emval_take_value");
  var v = type["readValueFromPointer"](arg);
  return Emval.toHandle(v)
}
function __emval_typeof(handle) {
  handle = Emval.toValue(handle);
  return Emval.toHandle(typeof handle)
}
function readI53FromI64(ptr) {
  return GROWABLE_HEAP_U32()[ptr >> 2] + GROWABLE_HEAP_I32()[ptr + 4 >> 2] * 4294967296
}
function __gmtime_js(time, tmPtr) {
  var date = new Date(readI53FromI64(time) * 1e3);
  GROWABLE_HEAP_I32()[tmPtr >> 2] = date.getUTCSeconds();
  GROWABLE_HEAP_I32()[tmPtr + 4 >> 2] = date.getUTCMinutes();
  GROWABLE_HEAP_I32()[tmPtr + 8 >> 2] = date.getUTCHours();
  GROWABLE_HEAP_I32()[tmPtr + 12 >> 2] = date.getUTCDate();
  GROWABLE_HEAP_I32()[tmPtr + 16 >> 2] = date.getUTCMonth();
  GROWABLE_HEAP_I32()[tmPtr + 20 >> 2] = date.getUTCFullYear() - 1900;
  GROWABLE_HEAP_I32()[tmPtr + 24 >> 2] = date.getUTCDay();
  var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
  var yday = (date.getTime() - start) / (1e3 * 60 * 60 * 24) | 0;
  GROWABLE_HEAP_I32()[tmPtr + 28 >> 2] = yday
}
function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}
var MONTH_DAYS_LEAP_CUMULATIVE = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
var MONTH_DAYS_REGULAR_CUMULATIVE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
function ydayFromDate(date) {
  var leap = isLeapYear(date.getFullYear());
  var monthDaysCumulative = leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE;
  var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1;
  return yday
}
function __localtime_js(time, tmPtr) {
  var date = new Date(readI53FromI64(time) * 1e3);
  GROWABLE_HEAP_I32()[tmPtr >> 2] = date.getSeconds();
  GROWABLE_HEAP_I32()[tmPtr + 4 >> 2] = date.getMinutes();
  GROWABLE_HEAP_I32()[tmPtr + 8 >> 2] = date.getHours();
  GROWABLE_HEAP_I32()[tmPtr + 12 >> 2] = date.getDate();
  GROWABLE_HEAP_I32()[tmPtr + 16 >> 2] = date.getMonth();
  GROWABLE_HEAP_I32()[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
  GROWABLE_HEAP_I32()[tmPtr + 24 >> 2] = date.getDay();
  var yday = ydayFromDate(date) | 0;
  GROWABLE_HEAP_I32()[tmPtr + 28 >> 2] = yday;
  GROWABLE_HEAP_I32()[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
  var start = new Date(date.getFullYear(),0,1);
  var summerOffset = new Date(date.getFullYear(),6,1).getTimezoneOffset();
  var winterOffset = start.getTimezoneOffset();
  var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
  GROWABLE_HEAP_I32()[tmPtr + 32 >> 2] = dst
}
function __mktime_js(tmPtr) {
  var date = new Date(GROWABLE_HEAP_I32()[tmPtr + 20 >> 2] + 1900,GROWABLE_HEAP_I32()[tmPtr + 16 >> 2],GROWABLE_HEAP_I32()[tmPtr + 12 >> 2],GROWABLE_HEAP_I32()[tmPtr + 8 >> 2],GROWABLE_HEAP_I32()[tmPtr + 4 >> 2],GROWABLE_HEAP_I32()[tmPtr >> 2],0);
  var dst = GROWABLE_HEAP_I32()[tmPtr + 32 >> 2];
  var guessedOffset = date.getTimezoneOffset();
  var start = new Date(date.getFullYear(),0,1);
  var summerOffset = new Date(date.getFullYear(),6,1).getTimezoneOffset();
  var winterOffset = start.getTimezoneOffset();
  var dstOffset = Math.min(winterOffset, summerOffset);
  if (dst < 0) {
    GROWABLE_HEAP_I32()[tmPtr + 32 >> 2] = Number(summerOffset != winterOffset && dstOffset == guessedOffset)
  } else if (dst > 0 != (dstOffset == guessedOffset)) {
    var nonDstOffset = Math.max(winterOffset, summerOffset);
    var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
    date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4)
  }
  GROWABLE_HEAP_I32()[tmPtr + 24 >> 2] = date.getDay();
  var yday = ydayFromDate(date) | 0;
  GROWABLE_HEAP_I32()[tmPtr + 28 >> 2] = yday;
  GROWABLE_HEAP_I32()[tmPtr >> 2] = date.getSeconds();
  GROWABLE_HEAP_I32()[tmPtr + 4 >> 2] = date.getMinutes();
  GROWABLE_HEAP_I32()[tmPtr + 8 >> 2] = date.getHours();
  GROWABLE_HEAP_I32()[tmPtr + 12 >> 2] = date.getDate();
  GROWABLE_HEAP_I32()[tmPtr + 16 >> 2] = date.getMonth();
  GROWABLE_HEAP_I32()[tmPtr + 20 >> 2] = date.getYear();
  return date.getTime() / 1e3 | 0
}
function __mmap_js(len, prot, flags, fd, off, allocated, addr) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(13, 1, len, prot, flags, fd, off, allocated, addr);
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var res = FS.mmap(stream, len, off, prot, flags);
    var ptr = res.ptr;
    GROWABLE_HEAP_I32()[allocated >> 2] = res.allocated;
    GROWABLE_HEAP_U32()[addr >> 2] = ptr;
    return 0
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
      throw e;
    return -e.errno
  }
}
function __munmap_js(addr, len, prot, flags, fd, offset) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(14, 1, addr, len, prot, flags, fd, offset);
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    if (prot & 2) {
      SYSCALLS.doMsync(addr, stream, len, flags, offset)
    }
    FS.munmap(stream)
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
      throw e;
    return -e.errno
  }
}
var timers = {};
var _emscripten_get_now;
if (ENVIRONMENT_IS_NODE) {
  _emscripten_get_now = ()=>{
    var t = process.hrtime();
    return t[0] * 1e3 + t[1] / 1e6
  }
} else
  _emscripten_get_now = ()=>performance.timeOrigin + performance.now();
function __setitimer_js(which, timeout_ms) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(15, 1, which, timeout_ms);
  if (timers[which]) {
    clearTimeout(timers[which].id);
    delete timers[which]
  }
  if (!timeout_ms)
    return 0;
  var id = setTimeout(()=>{
    delete timers[which];
    callUserCallback(()=>__emscripten_timeout(which, _emscripten_get_now()))
  }
  , timeout_ms);
  timers[which] = {
    id: id,
    timeout_ms: timeout_ms
  };
  return 0
}
function stringToNewUTF8(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret)
    stringToUTF8(str, ret, size);
  return ret
}
function __tzset_js(timezone, daylight, tzname) {
  var currentYear = (new Date).getFullYear();
  var winter = new Date(currentYear,0,1);
  var summer = new Date(currentYear,6,1);
  var winterOffset = winter.getTimezoneOffset();
  var summerOffset = summer.getTimezoneOffset();
  var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
  GROWABLE_HEAP_U32()[timezone >> 2] = stdTimezoneOffset * 60;
  GROWABLE_HEAP_I32()[daylight >> 2] = Number(winterOffset != summerOffset);
  function extractZone(date) {
    var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
    return match ? match[1] : "GMT"
  }
  var winterName = extractZone(winter);
  var summerName = extractZone(summer);
  var winterNamePtr = stringToNewUTF8(winterName);
  var summerNamePtr = stringToNewUTF8(summerName);
  if (summerOffset < winterOffset) {
    GROWABLE_HEAP_U32()[tzname >> 2] = winterNamePtr;
    GROWABLE_HEAP_U32()[tzname + 4 >> 2] = summerNamePtr
  } else {
    GROWABLE_HEAP_U32()[tzname >> 2] = summerNamePtr;
    GROWABLE_HEAP_U32()[tzname + 4 >> 2] = winterNamePtr
  }
}
function _abort() {
  abort("")
}
function runtimeKeepalivePush() {
  runtimeKeepaliveCounter += 1
}
function _emscripten_set_main_loop_timing(mode, value) {
  Browser.mainLoop.timingMode = mode;
  Browser.mainLoop.timingValue = value;
  if (!Browser.mainLoop.func) {
    return 1
  }
  if (!Browser.mainLoop.running) {
    runtimeKeepalivePush();
    Browser.mainLoop.running = true
  }
  if (mode == 0) {
    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
      var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
      setTimeout(Browser.mainLoop.runner, timeUntilNextTick)
    }
    ;
    Browser.mainLoop.method = "timeout"
  } else if (mode == 1) {
    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
      Browser.requestAnimationFrame(Browser.mainLoop.runner)
    }
    ;
    Browser.mainLoop.method = "rAF"
  } else if (mode == 2) {
    if (typeof setImmediate == "undefined") {
      var setImmediates = [];
      var emscriptenMainLoopMessageId = "setimmediate";
      var Browser_setImmediate_messageHandler = event=>{
        if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
          event.stopPropagation();
          setImmediates.shift()()
        }
      }
      ;
      addEventListener("message", Browser_setImmediate_messageHandler, true);
      setImmediate = function Browser_emulated_setImmediate(func) {
        setImmediates.push(func);
        if (ENVIRONMENT_IS_WORKER) {
          if (Module["setImmediates"] === undefined)
            Module["setImmediates"] = [];
          Module["setImmediates"].push(func);
          postMessage({
            target: emscriptenMainLoopMessageId
          })
        } else
          postMessage(emscriptenMainLoopMessageId, "*")
      }
    }
    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
      setImmediate(Browser.mainLoop.runner)
    }
    ;
    Browser.mainLoop.method = "immediate"
  }
  return 0
}
function runtimeKeepalivePop() {
  runtimeKeepaliveCounter -= 1
}
function setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop, arg, noSetTiming) {
  assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
  Browser.mainLoop.func = browserIterationFunc;
  Browser.mainLoop.arg = arg;
  var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
  function checkIsRunning() {
    if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) {
      runtimeKeepalivePop();
      maybeExit();
      return false
    }
    return true
  }
  Browser.mainLoop.running = false;
  Browser.mainLoop.runner = function Browser_mainLoop_runner() {
    if (ABORT)
      return;
    if (Browser.mainLoop.queue.length > 0) {
      var start = Date.now();
      var blocker = Browser.mainLoop.queue.shift();
      blocker.func(blocker.arg);
      if (Browser.mainLoop.remainingBlockers) {
        var remaining = Browser.mainLoop.remainingBlockers;
        var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
        if (blocker.counted) {
          Browser.mainLoop.remainingBlockers = next
        } else {
          next = next + .5;
          Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9
        }
      }
      out('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + " ms");
      Browser.mainLoop.updateStatus();
      if (!checkIsRunning())
        return;
      setTimeout(Browser.mainLoop.runner, 0);
      return
    }
    if (!checkIsRunning())
      return;
    Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
    if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
      Browser.mainLoop.scheduler();
      return
    } else if (Browser.mainLoop.timingMode == 0) {
      Browser.mainLoop.tickStartTime = _emscripten_get_now()
    }
    Browser.mainLoop.runIter(browserIterationFunc);
    if (!checkIsRunning())
      return;
    if (typeof SDL == "object" && SDL.audio && SDL.audio.queueNewAudioData)
      SDL.audio.queueNewAudioData();
    Browser.mainLoop.scheduler()
  }
  ;
  if (!noSetTiming) {
    if (fps && fps > 0)
      _emscripten_set_main_loop_timing(0, 1e3 / fps);
    else
      _emscripten_set_main_loop_timing(1, 1);
    Browser.mainLoop.scheduler()
  }
  if (simulateInfiniteLoop) {
    throw "unwind"
  }
}
function safeSetTimeout(func, timeout) {
  runtimeKeepalivePush();
  return setTimeout(function() {
    runtimeKeepalivePop();
    callUserCallback(func)
  }, timeout)
}
function warnOnce(text) {
  if (!warnOnce.shown)
    warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    if (ENVIRONMENT_IS_NODE)
      text = "warning: " + text;
    err(text)
  }
}
var Browser = {
  mainLoop: {
    running: false,
    scheduler: null,
    method: "",
    currentlyRunningMainloop: 0,
    func: null,
    arg: 0,
    timingMode: 0,
    timingValue: 0,
    currentFrameNumber: 0,
    queue: [],
    pause: function() {
      Browser.mainLoop.scheduler = null;
      Browser.mainLoop.currentlyRunningMainloop++
    },
    resume: function() {
      Browser.mainLoop.currentlyRunningMainloop++;
      var timingMode = Browser.mainLoop.timingMode;
      var timingValue = Browser.mainLoop.timingValue;
      var func = Browser.mainLoop.func;
      Browser.mainLoop.func = null;
      setMainLoop(func, 0, false, Browser.mainLoop.arg, true);
      _emscripten_set_main_loop_timing(timingMode, timingValue);
      Browser.mainLoop.scheduler()
    },
    updateStatus: function() {
      if (Module["setStatus"]) {
        var message = Module["statusMessage"] || "Please wait...";
        var remaining = Browser.mainLoop.remainingBlockers;
        var expected = Browser.mainLoop.expectedBlockers;
        if (remaining) {
          if (remaining < expected) {
            Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")")
          } else {
            Module["setStatus"](message)
          }
        } else {
          Module["setStatus"]("")
        }
      }
    },
    runIter: function(func) {
      if (ABORT)
        return;
      if (Module["preMainLoop"]) {
        var preRet = Module["preMainLoop"]();
        if (preRet === false) {
          return
        }
      }
      callUserCallback(func);
      if (Module["postMainLoop"])
        Module["postMainLoop"]()
    }
  },
  isFullscreen: false,
  pointerLock: false,
  moduleContextCreatedCallbacks: [],
  workers: [],
  init: function() {
    if (!Module["preloadPlugins"])
      Module["preloadPlugins"] = [];
    if (Browser.initted)
      return;
    Browser.initted = true;
    try {
      new Blob;
      Browser.hasBlobConstructor = true
    } catch (e) {
      Browser.hasBlobConstructor = false;
      err("warning: no blob constructor, cannot create blobs with mimetypes")
    }
    Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : !Browser.hasBlobConstructor ? err("warning: no BlobBuilder") : null;
    Browser.URLObject = typeof window != "undefined" ? window.URL ? window.URL : window.webkitURL : undefined;
    if (!Module.noImageDecoding && typeof Browser.URLObject == "undefined") {
      err("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
      Module.noImageDecoding = true
    }
    var imagePlugin = {};
    imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
      return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name)
    }
    ;
    imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
      var b = null;
      if (Browser.hasBlobConstructor) {
        try {
          b = new Blob([byteArray],{
            type: Browser.getMimetype(name)
          });
          if (b.size !== byteArray.length) {
            b = new Blob([new Uint8Array(byteArray).buffer],{
              type: Browser.getMimetype(name)
            })
          }
        } catch (e) {
          warnOnce("Blob constructor present but fails: " + e + "; falling back to blob builder")
        }
      }
      if (!b) {
        var bb = new Browser.BlobBuilder;
        bb.append(new Uint8Array(byteArray).buffer);
        b = bb.getBlob()
      }
      var url = Browser.URLObject.createObjectURL(b);
      var img = new Image;
      img.onload = ()=>{
        assert(img.complete, "Image " + name + " could not be decoded");
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        preloadedImages[name] = canvas;
        Browser.URLObject.revokeObjectURL(url);
        if (onload)
          onload(byteArray)
      }
      ;
      img.onerror = event=>{
        out("Image " + url + " could not be decoded");
        if (onerror)
          onerror()
      }
      ;
      img.src = url
    }
    ;
    Module["preloadPlugins"].push(imagePlugin);
    var audioPlugin = {};
    audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
      return !Module.noAudioDecoding && name.substr(-4)in {
        ".ogg": 1,
        ".wav": 1,
        ".mp3": 1
      }
    }
    ;
    audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
      var done = false;
      function finish(audio) {
        if (done)
          return;
        done = true;
        preloadedAudios[name] = audio;
        if (onload)
          onload(byteArray)
      }
      function fail() {
        if (done)
          return;
        done = true;
        preloadedAudios[name] = new Audio;
        if (onerror)
          onerror()
      }
      if (Browser.hasBlobConstructor) {
        try {
          var b = new Blob([byteArray],{
            type: Browser.getMimetype(name)
          })
        } catch (e) {
          return fail()
        }
        var url = Browser.URLObject.createObjectURL(b);
        var audio = new Audio;
        audio.addEventListener("canplaythrough", ()=>finish(audio), false);
        audio.onerror = function audio_onerror(event) {
          if (done)
            return;
          err("warning: browser could not fully decode audio " + name + ", trying slower base64 approach");
          function encode64(data) {
            var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
            var PAD = "=";
            var ret = "";
            var leftchar = 0;
            var leftbits = 0;
            for (var i = 0; i < data.length; i++) {
              leftchar = leftchar << 8 | data[i];
              leftbits += 8;
              while (leftbits >= 6) {
                var curr = leftchar >> leftbits - 6 & 63;
                leftbits -= 6;
                ret += BASE[curr]
              }
            }
            if (leftbits == 2) {
              ret += BASE[(leftchar & 3) << 4];
              ret += PAD + PAD
            } else if (leftbits == 4) {
              ret += BASE[(leftchar & 15) << 2];
              ret += PAD
            }
            return ret
          }
          audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
          finish(audio)
        }
        ;
        audio.src = url;
        safeSetTimeout(function() {
          finish(audio)
        }, 1e4)
      } else {
        return fail()
      }
    }
    ;
    Module["preloadPlugins"].push(audioPlugin);
    function pointerLockChange() {
      Browser.pointerLock = document["pointerLockElement"] === Module["canvas"] || document["mozPointerLockElement"] === Module["canvas"] || document["webkitPointerLockElement"] === Module["canvas"] || document["msPointerLockElement"] === Module["canvas"]
    }
    var canvas = Module["canvas"];
    if (canvas) {
      canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || (()=>{}
      );
      canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || (()=>{}
      );
      canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
      document.addEventListener("pointerlockchange", pointerLockChange, false);
      document.addEventListener("mozpointerlockchange", pointerLockChange, false);
      document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
      document.addEventListener("mspointerlockchange", pointerLockChange, false);
      if (Module["elementPointerLock"]) {
        canvas.addEventListener("click", ev=>{
          if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
            Module["canvas"].requestPointerLock();
            ev.preventDefault()
          }
        }
        , false)
      }
    }
  },
  handledByPreloadPlugin: function(byteArray, fullname, finish, onerror) {
    Browser.init();
    var handled = false;
    Module["preloadPlugins"].forEach(function(plugin) {
      if (handled)
        return;
      if (plugin["canHandle"](fullname)) {
        plugin["handle"](byteArray, fullname, finish, onerror);
        handled = true
      }
    });
    return handled
  },
  createContext: function(canvas, useWebGL, setInModule, webGLContextAttributes) {
    if (useWebGL && Module.ctx && canvas == Module.canvas)
      return Module.ctx;
    var ctx;
    var contextHandle;
    if (useWebGL) {
      var contextAttributes = {
        antialias: false,
        alpha: false,
        majorVersion: typeof WebGL2RenderingContext != "undefined" ? 2 : 1
      };
      if (webGLContextAttributes) {
        for (var attribute in webGLContextAttributes) {
          contextAttributes[attribute] = webGLContextAttributes[attribute]
        }
      }
      if (typeof GL != "undefined") {
        contextHandle = GL.createContext(canvas, contextAttributes);
        if (contextHandle) {
          ctx = GL.getContext(contextHandle).GLctx
        }
      }
    } else {
      ctx = canvas.getContext("2d")
    }
    if (!ctx)
      return null;
    if (setInModule) {
      if (!useWebGL)
        assert(typeof GLctx == "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
      Module.ctx = ctx;
      if (useWebGL)
        GL.makeContextCurrent(contextHandle);
      Module.useWebGL = useWebGL;
      Browser.moduleContextCreatedCallbacks.forEach(function(callback) {
        callback()
      });
      Browser.init()
    }
    return ctx
  },
  destroyContext: function(canvas, useWebGL, setInModule) {},
  fullscreenHandlersInstalled: false,
  lockPointer: undefined,
  resizeCanvas: undefined,
  requestFullscreen: function(lockPointer, resizeCanvas) {
    Browser.lockPointer = lockPointer;
    Browser.resizeCanvas = resizeCanvas;
    if (typeof Browser.lockPointer == "undefined")
      Browser.lockPointer = true;
    if (typeof Browser.resizeCanvas == "undefined")
      Browser.resizeCanvas = false;
    var canvas = Module["canvas"];
    function fullscreenChange() {
      Browser.isFullscreen = false;
      var canvasContainer = canvas.parentNode;
      if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
        canvas.exitFullscreen = Browser.exitFullscreen;
        if (Browser.lockPointer)
          canvas.requestPointerLock();
        Browser.isFullscreen = true;
        if (Browser.resizeCanvas) {
          Browser.setFullscreenCanvasSize()
        } else {
          Browser.updateCanvasDimensions(canvas)
        }
      } else {
        canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
        canvasContainer.parentNode.removeChild(canvasContainer);
        if (Browser.resizeCanvas) {
          Browser.setWindowedCanvasSize()
        } else {
          Browser.updateCanvasDimensions(canvas)
        }
      }
      if (Module["onFullScreen"])
        Module["onFullScreen"](Browser.isFullscreen);
      if (Module["onFullscreen"])
        Module["onFullscreen"](Browser.isFullscreen)
    }
    if (!Browser.fullscreenHandlersInstalled) {
      Browser.fullscreenHandlersInstalled = true;
      document.addEventListener("fullscreenchange", fullscreenChange, false);
      document.addEventListener("mozfullscreenchange", fullscreenChange, false);
      document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
      document.addEventListener("MSFullscreenChange", fullscreenChange, false)
    }
    var canvasContainer = document.createElement("div");
    canvas.parentNode.insertBefore(canvasContainer, canvas);
    canvasContainer.appendChild(canvas);
    canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? ()=>canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null) || (canvasContainer["webkitRequestFullScreen"] ? ()=>canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null);
    canvasContainer.requestFullscreen()
  },
  exitFullscreen: function() {
    if (!Browser.isFullscreen) {
      return false
    }
    var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || function() {}
    ;
    CFS.apply(document, []);
    return true
  },
  nextRAF: 0,
  fakeRequestAnimationFrame: function(func) {
    var now = Date.now();
    if (Browser.nextRAF === 0) {
      Browser.nextRAF = now + 1e3 / 60
    } else {
      while (now + 2 >= Browser.nextRAF) {
        Browser.nextRAF += 1e3 / 60
      }
    }
    var delay = Math.max(Browser.nextRAF - now, 0);
    setTimeout(func, delay)
  },
  requestAnimationFrame: function(func) {
    if (typeof requestAnimationFrame == "function") {
      requestAnimationFrame(func);
      return
    }
    var RAF = Browser.fakeRequestAnimationFrame;
    RAF(func)
  },
  safeSetTimeout: function(func, timeout) {
    return safeSetTimeout(func, timeout)
  },
  safeRequestAnimationFrame: function(func) {
    runtimeKeepalivePush();
    return Browser.requestAnimationFrame(function() {
      runtimeKeepalivePop();
      callUserCallback(func)
    })
  },
  getMimetype: function(name) {
    return {
      "jpg": "image/jpeg",
      "jpeg": "image/jpeg",
      "png": "image/png",
      "bmp": "image/bmp",
      "ogg": "audio/ogg",
      "wav": "audio/wav",
      "mp3": "audio/mpeg"
    }[name.substr(name.lastIndexOf(".") + 1)]
  },
  getUserMedia: function(func) {
    if (!window.getUserMedia) {
      window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"]
    }
    window.getUserMedia(func)
  },
  getMovementX: function(event) {
    return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0
  },
  getMovementY: function(event) {
    return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0
  },
  getMouseWheelDelta: function(event) {
    var delta = 0;
    switch (event.type) {
    case "DOMMouseScroll":
      delta = event.detail / 3;
      break;
    case "mousewheel":
      delta = event.wheelDelta / 120;
      break;
    case "wheel":
      delta = event.deltaY;
      switch (event.deltaMode) {
      case 0:
        delta /= 100;
        break;
      case 1:
        delta /= 3;
        break;
      case 2:
        delta *= 80;
        break;
      default:
        throw "unrecognized mouse wheel delta mode: " + event.deltaMode
      }
      break;
    default:
      throw "unrecognized mouse wheel event: " + event.type
    }
    return delta
  },
  mouseX: 0,
  mouseY: 0,
  mouseMovementX: 0,
  mouseMovementY: 0,
  touches: {},
  lastTouches: {},
  calculateMouseEvent: function(event) {
    if (Browser.pointerLock) {
      if (event.type != "mousemove" && "mozMovementX"in event) {
        Browser.mouseMovementX = Browser.mouseMovementY = 0
      } else {
        Browser.mouseMovementX = Browser.getMovementX(event);
        Browser.mouseMovementY = Browser.getMovementY(event)
      }
      if (typeof SDL != "undefined") {
        Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
        Browser.mouseY = SDL.mouseY + Browser.mouseMovementY
      } else {
        Browser.mouseX += Browser.mouseMovementX;
        Browser.mouseY += Browser.mouseMovementY
      }
    } else {
      var rect = Module["canvas"].getBoundingClientRect();
      var cw = Module["canvas"].width;
      var ch = Module["canvas"].height;
      var scrollX = typeof window.scrollX != "undefined" ? window.scrollX : window.pageXOffset;
      var scrollY = typeof window.scrollY != "undefined" ? window.scrollY : window.pageYOffset;
      if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
        var touch = event.touch;
        if (touch === undefined) {
          return
        }
        var adjustedX = touch.pageX - (scrollX + rect.left);
        var adjustedY = touch.pageY - (scrollY + rect.top);
        adjustedX = adjustedX * (cw / rect.width);
        adjustedY = adjustedY * (ch / rect.height);
        var coords = {
          x: adjustedX,
          y: adjustedY
        };
        if (event.type === "touchstart") {
          Browser.lastTouches[touch.identifier] = coords;
          Browser.touches[touch.identifier] = coords
        } else if (event.type === "touchend" || event.type === "touchmove") {
          var last = Browser.touches[touch.identifier];
          if (!last)
            last = coords;
          Browser.lastTouches[touch.identifier] = last;
          Browser.touches[touch.identifier] = coords
        }
        return
      }
      var x = event.pageX - (scrollX + rect.left);
      var y = event.pageY - (scrollY + rect.top);
      x = x * (cw / rect.width);
      y = y * (ch / rect.height);
      Browser.mouseMovementX = x - Browser.mouseX;
      Browser.mouseMovementY = y - Browser.mouseY;
      Browser.mouseX = x;
      Browser.mouseY = y
    }
  },
  resizeListeners: [],
  updateResizeListeners: function() {
    var canvas = Module["canvas"];
    Browser.resizeListeners.forEach(function(listener) {
      listener(canvas.width, canvas.height)
    })
  },
  setCanvasSize: function(width, height, noUpdates) {
    var canvas = Module["canvas"];
    Browser.updateCanvasDimensions(canvas, width, height);
    if (!noUpdates)
      Browser.updateResizeListeners()
  },
  windowedWidth: 0,
  windowedHeight: 0,
  setFullscreenCanvasSize: function() {
    if (typeof SDL != "undefined") {
      var flags = GROWABLE_HEAP_U32()[SDL.screen >> 2];
      flags = flags | 8388608;
      GROWABLE_HEAP_I32()[SDL.screen >> 2] = flags
    }
    Browser.updateCanvasDimensions(Module["canvas"]);
    Browser.updateResizeListeners()
  },
  setWindowedCanvasSize: function() {
    if (typeof SDL != "undefined") {
      var flags = GROWABLE_HEAP_U32()[SDL.screen >> 2];
      flags = flags & ~8388608;
      GROWABLE_HEAP_I32()[SDL.screen >> 2] = flags
    }
    Browser.updateCanvasDimensions(Module["canvas"]);
    Browser.updateResizeListeners()
  },
  updateCanvasDimensions: function(canvas, wNative, hNative) {
    if (wNative && hNative) {
      canvas.widthNative = wNative;
      canvas.heightNative = hNative
    } else {
      wNative = canvas.widthNative;
      hNative = canvas.heightNative
    }
    var w = wNative;
    var h = hNative;
    if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
      if (w / h < Module["forcedAspectRatio"]) {
        w = Math.round(h * Module["forcedAspectRatio"])
      } else {
        h = Math.round(w / Module["forcedAspectRatio"])
      }
    }
    if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
      var factor = Math.min(screen.width / w, screen.height / h);
      w = Math.round(w * factor);
      h = Math.round(h * factor)
    }
    if (Browser.resizeCanvas) {
      if (canvas.width != w)
        canvas.width = w;
      if (canvas.height != h)
        canvas.height = h;
      if (typeof canvas.style != "undefined") {
        canvas.style.removeProperty("width");
        canvas.style.removeProperty("height")
      }
    } else {
      if (canvas.width != wNative)
        canvas.width = wNative;
      if (canvas.height != hNative)
        canvas.height = hNative;
      if (typeof canvas.style != "undefined") {
        if (w != wNative || h != hNative) {
          canvas.style.setProperty("width", w + "px", "important");
          canvas.style.setProperty("height", h + "px", "important")
        } else {
          canvas.style.removeProperty("width");
          canvas.style.removeProperty("height")
        }
      }
    }
  }
};
var EGL = {
  errorCode: 12288,
  defaultDisplayInitialized: false,
  currentContext: 0,
  currentReadSurface: 0,
  currentDrawSurface: 0,
  contextAttributes: {
    alpha: false,
    depth: false,
    stencil: false,
    antialias: false
  },
  stringCache: {},
  setErrorCode: function(code) {
    EGL.errorCode = code
  },
  chooseConfig: function(display, attribList, config, config_size, numConfigs) {
    if (display != 62e3) {
      EGL.setErrorCode(12296);
      return 0
    }
    if (attribList) {
      for (; ; ) {
        var param = GROWABLE_HEAP_I32()[attribList >> 2];
        if (param == 12321) {
          var alphaSize = GROWABLE_HEAP_I32()[attribList + 4 >> 2];
          EGL.contextAttributes.alpha = alphaSize > 0
        } else if (param == 12325) {
          var depthSize = GROWABLE_HEAP_I32()[attribList + 4 >> 2];
          EGL.contextAttributes.depth = depthSize > 0
        } else if (param == 12326) {
          var stencilSize = GROWABLE_HEAP_I32()[attribList + 4 >> 2];
          EGL.contextAttributes.stencil = stencilSize > 0
        } else if (param == 12337) {
          var samples = GROWABLE_HEAP_I32()[attribList + 4 >> 2];
          EGL.contextAttributes.antialias = samples > 0
        } else if (param == 12338) {
          var samples = GROWABLE_HEAP_I32()[attribList + 4 >> 2];
          EGL.contextAttributes.antialias = samples == 1
        } else if (param == 12544) {
          var requestedPriority = GROWABLE_HEAP_I32()[attribList + 4 >> 2];
          EGL.contextAttributes.lowLatency = requestedPriority != 12547
        } else if (param == 12344) {
          break
        }
        attribList += 8
      }
    }
    if ((!config || !config_size) && !numConfigs) {
      EGL.setErrorCode(12300);
      return 0
    }
    if (numConfigs) {
      GROWABLE_HEAP_I32()[numConfigs >> 2] = 1
    }
    if (config && config_size > 0) {
      GROWABLE_HEAP_I32()[config >> 2] = 62002
    }
    EGL.setErrorCode(12288);
    return 1
  }
};
function _eglChooseConfig(display, attrib_list, configs, config_size, numConfigs) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(16, 1, display, attrib_list, configs, config_size, numConfigs);
  return EGL.chooseConfig(display, attrib_list, configs, config_size, numConfigs)
}
function webgl_enable_ANGLE_instanced_arrays(ctx) {
  var ext = ctx.getExtension("ANGLE_instanced_arrays");
  if (ext) {
    ctx["vertexAttribDivisor"] = function(index, divisor) {
      ext["vertexAttribDivisorANGLE"](index, divisor)
    }
    ;
    ctx["drawArraysInstanced"] = function(mode, first, count, primcount) {
      ext["drawArraysInstancedANGLE"](mode, first, count, primcount)
    }
    ;
    ctx["drawElementsInstanced"] = function(mode, count, type, indices, primcount) {
      ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount)
    }
    ;
    return 1
  }
}
function webgl_enable_OES_vertex_array_object(ctx) {
  var ext = ctx.getExtension("OES_vertex_array_object");
  if (ext) {
    ctx["createVertexArray"] = function() {
      return ext["createVertexArrayOES"]()
    }
    ;
    ctx["deleteVertexArray"] = function(vao) {
      ext["deleteVertexArrayOES"](vao)
    }
    ;
    ctx["bindVertexArray"] = function(vao) {
      ext["bindVertexArrayOES"](vao)
    }
    ;
    ctx["isVertexArray"] = function(vao) {
      return ext["isVertexArrayOES"](vao)
    }
    ;
    return 1
  }
}
function webgl_enable_WEBGL_draw_buffers(ctx) {
  var ext = ctx.getExtension("WEBGL_draw_buffers");
  if (ext) {
    ctx["drawBuffers"] = function(n, bufs) {
      ext["drawBuffersWEBGL"](n, bufs)
    }
    ;
    return 1
  }
}
function webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance(ctx) {
  return !!(ctx.dibvbi = ctx.getExtension("WEBGL_draw_instanced_base_vertex_base_instance"))
}
function webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance(ctx) {
  return !!(ctx.mdibvbi = ctx.getExtension("WEBGL_multi_draw_instanced_base_vertex_base_instance"))
}
function webgl_enable_WEBGL_multi_draw(ctx) {
  return !!(ctx.multiDrawWebgl = ctx.getExtension("WEBGL_multi_draw"))
}
var GL = {
  counter: 1,
  buffers: [],
  programs: [],
  framebuffers: [],
  renderbuffers: [],
  textures: [],
  shaders: [],
  vaos: [],
  contexts: {},
  offscreenCanvases: {},
  queries: [],
  samplers: [],
  transformFeedbacks: [],
  syncs: [],
  stringCache: {},
  stringiCache: {},
  unpackAlignment: 4,
  recordError: function recordError(errorCode) {
    if (!GL.lastError) {
      GL.lastError = errorCode
    }
  },
  getNewId: function(table) {
    var ret = GL.counter++;
    for (var i = table.length; i < ret; i++) {
      table[i] = null
    }
    return ret
  },
  getSource: function(shader, count, string, length) {
    var source = "";
    for (var i = 0; i < count; ++i) {
      var len = length ? GROWABLE_HEAP_I32()[length + i * 4 >> 2] : -1;
      source += UTF8ToString(GROWABLE_HEAP_I32()[string + i * 4 >> 2], len < 0 ? undefined : len)
    }
    return source
  },
  createContext: function(canvas, webGLContextAttributes) {
    if (!canvas.getContextSafariWebGL2Fixed) {
      canvas.getContextSafariWebGL2Fixed = canvas.getContext;
      function fixedGetContext(ver, attrs) {
        var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
        return ver == "webgl" == gl instanceof WebGLRenderingContext ? gl : null
      }
      canvas.getContext = fixedGetContext
    }
    var ctx = webGLContextAttributes.majorVersion > 1 ? canvas.getContext("webgl2", webGLContextAttributes) : canvas.getContext("webgl", webGLContextAttributes);
    if (!ctx)
      return 0;
    var handle = GL.registerContext(ctx, webGLContextAttributes);
    return handle
  },
  registerContext: function(ctx, webGLContextAttributes) {
    var handle = _malloc(8);
    GROWABLE_HEAP_I32()[handle + 4 >> 2] = _pthread_self();
    var context = {
      handle: handle,
      attributes: webGLContextAttributes,
      version: webGLContextAttributes.majorVersion,
      GLctx: ctx
    };
    if (ctx.canvas)
      ctx.canvas.GLctxObject = context;
    GL.contexts[handle] = context;
    if (typeof webGLContextAttributes.enableExtensionsByDefault == "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
      GL.initExtensions(context)
    }
    return handle
  },
  makeContextCurrent: function(contextHandle) {
    GL.currentContext = GL.contexts[contextHandle];
    Module.ctx = GLctx = GL.currentContext && GL.currentContext.GLctx;
    return !(contextHandle && !GLctx)
  },
  getContext: function(contextHandle) {
    return GL.contexts[contextHandle]
  },
  deleteContext: function(contextHandle) {
    if (GL.currentContext === GL.contexts[contextHandle])
      GL.currentContext = null;
    if (typeof JSEvents == "object")
      JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
    if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas)
      GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
    _free(GL.contexts[contextHandle].handle);
    GL.contexts[contextHandle] = null
  },
  initExtensions: function(context) {
    if (!context)
      context = GL.currentContext;
    if (context.initExtensionsDone)
      return;
    context.initExtensionsDone = true;
    var GLctx = context.GLctx;
    webgl_enable_ANGLE_instanced_arrays(GLctx);
    webgl_enable_OES_vertex_array_object(GLctx);
    webgl_enable_WEBGL_draw_buffers(GLctx);
    webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance(GLctx);
    webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance(GLctx);
    if (context.version >= 2) {
      GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query_webgl2")
    }
    if (context.version < 2 || !GLctx.disjointTimerQueryExt) {
      GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query")
    }
    webgl_enable_WEBGL_multi_draw(GLctx);
    var exts = GLctx.getSupportedExtensions() || [];
    exts.forEach(function(ext) {
      if (!ext.includes("lose_context") && !ext.includes("debug")) {
        GLctx.getExtension(ext)
      }
    })
  }
};
function _eglCreateContext(display, config, hmm, contextAttribs) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(17, 1, display, config, hmm, contextAttribs);
  if (display != 62e3) {
    EGL.setErrorCode(12296);
    return 0
  }
  var glesContextVersion = 1;
  for (; ; ) {
    var param = GROWABLE_HEAP_I32()[contextAttribs >> 2];
    if (param == 12440) {
      glesContextVersion = GROWABLE_HEAP_I32()[contextAttribs + 4 >> 2]
    } else if (param == 12344) {
      break
    } else {
      EGL.setErrorCode(12292);
      return 0
    }
    contextAttribs += 8
  }
  if (glesContextVersion < 2 || glesContextVersion > 3) {
    EGL.setErrorCode(12293);
    return 0
  }
  EGL.contextAttributes.majorVersion = glesContextVersion - 1;
  EGL.contextAttributes.minorVersion = 0;
  EGL.context = GL.createContext(Module["canvas"], EGL.contextAttributes);
  if (EGL.context != 0) {
    EGL.setErrorCode(12288);
    GL.makeContextCurrent(EGL.context);
    Module.useWebGL = true;
    Browser.moduleContextCreatedCallbacks.forEach(function(callback) {
      callback()
    });
    GL.makeContextCurrent(null);
    return 62004
  } else {
    EGL.setErrorCode(12297);
    return 0
  }
}
function _eglCreateWindowSurface(display, config, win, attrib_list) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(18, 1, display, config, win, attrib_list);
  if (display != 62e3) {
    EGL.setErrorCode(12296);
    return 0
  }
  if (config != 62002) {
    EGL.setErrorCode(12293);
    return 0
  }
  EGL.setErrorCode(12288);
  return 62006
}
function _eglDestroyContext(display, context) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(19, 1, display, context);
  if (display != 62e3) {
    EGL.setErrorCode(12296);
    return 0
  }
  if (context != 62004) {
    EGL.setErrorCode(12294);
    return 0
  }
  GL.deleteContext(EGL.context);
  EGL.setErrorCode(12288);
  if (EGL.currentContext == context) {
    EGL.currentContext = 0
  }
  return 1
}
function _eglDestroySurface(display, surface) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(20, 1, display, surface);
  if (display != 62e3) {
    EGL.setErrorCode(12296);
    return 0
  }
  if (surface != 62006) {
    EGL.setErrorCode(12301);
    return 1
  }
  if (EGL.currentReadSurface == surface) {
    EGL.currentReadSurface = 0
  }
  if (EGL.currentDrawSurface == surface) {
    EGL.currentDrawSurface = 0
  }
  EGL.setErrorCode(12288);
  return 1
}
function _eglGetCurrentContext() {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(21, 1);
  return EGL.currentContext
}
function _eglGetCurrentDisplay() {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(22, 1);
  return EGL.currentContext ? 62e3 : 0
}
function _eglGetCurrentSurface(readdraw) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(23, 1, readdraw);
  if (readdraw == 12378) {
    return EGL.currentReadSurface
  } else if (readdraw == 12377) {
    return EGL.currentDrawSurface
  } else {
    EGL.setErrorCode(12300);
    return 0
  }
}
function _eglGetDisplay(nativeDisplayType) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(24, 1, nativeDisplayType);
  EGL.setErrorCode(12288);
  return 62e3
}
function _eglInitialize(display, majorVersion, minorVersion) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(25, 1, display, majorVersion, minorVersion);
  if (display != 62e3) {
    EGL.setErrorCode(12296);
    return 0
  }
  if (majorVersion) {
    GROWABLE_HEAP_I32()[majorVersion >> 2] = 1
  }
  if (minorVersion) {
    GROWABLE_HEAP_I32()[minorVersion >> 2] = 4
  }
  EGL.defaultDisplayInitialized = true;
  EGL.setErrorCode(12288);
  return 1
}
function _eglMakeCurrent(display, draw, read, context) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(26, 1, display, draw, read, context);
  if (display != 62e3) {
    EGL.setErrorCode(12296);
    return 0
  }
  if (context != 0 && context != 62004) {
    EGL.setErrorCode(12294);
    return 0
  }
  if (read != 0 && read != 62006 || draw != 0 && draw != 62006) {
    EGL.setErrorCode(12301);
    return 0
  }
  GL.makeContextCurrent(context ? EGL.context : null);
  EGL.currentContext = context;
  EGL.currentDrawSurface = draw;
  EGL.currentReadSurface = read;
  EGL.setErrorCode(12288);
  return 1
}
function _eglReleaseThread() {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(27, 1);
  EGL.currentContext = 0;
  EGL.currentReadSurface = 0;
  EGL.currentDrawSurface = 0;
  EGL.setErrorCode(12288);
  return 1
}
function _eglSwapBuffers() {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(28, 1);
  if (!EGL.defaultDisplayInitialized) {
    EGL.setErrorCode(12289)
  } else if (!Module.ctx) {
    EGL.setErrorCode(12290)
  } else if (Module.ctx.isContextLost()) {
    EGL.setErrorCode(12302)
  } else {
    EGL.setErrorCode(12288);
    return 1
  }
  return 0
}
var readEmAsmArgsArray = [];
function readEmAsmArgs(sigPtr, buf) {
  readEmAsmArgsArray.length = 0;
  var ch;
  buf >>= 2;
  while (ch = GROWABLE_HEAP_U8()[sigPtr++]) {
    buf += ch != 105 & buf;
    readEmAsmArgsArray.push(ch == 105 ? GROWABLE_HEAP_I32()[buf] : GROWABLE_HEAP_F64()[buf++ >> 1]);
    ++buf
  }
  return readEmAsmArgsArray
}
function withStackSave(f) {
  var stack = stackSave();
  var ret = f();
  stackRestore(stack);
  return ret
}
function proxyToMainThread(index, sync) {
  var numCallArgs = arguments.length - 2;
  var outerArgs = arguments;
  return withStackSave(()=>{
    var serializedNumCallArgs = numCallArgs;
    var args = stackAlloc(serializedNumCallArgs * 8);
    var b = args >> 3;
    for (var i = 0; i < numCallArgs; i++) {
      var arg = outerArgs[2 + i];
      GROWABLE_HEAP_F64()[b + i] = arg
    }
    return __emscripten_run_in_main_runtime_thread_js(index, serializedNumCallArgs, args, sync)
  }
  )
}
function runMainThreadEmAsm(code, sigPtr, argbuf, sync) {
  var args = readEmAsmArgs(sigPtr, argbuf);
  if (ENVIRONMENT_IS_PTHREAD) {
    return proxyToMainThread.apply(null, [-1 - code, sync].concat(args))
  }
  return ASM_CONSTS[code].apply(null, args)
}
function _emscripten_asm_const_async_on_main_thread(code, sigPtr, argbuf) {
  return runMainThreadEmAsm(code, sigPtr, argbuf, 0)
}
function runEmAsmFunction(code, sigPtr, argbuf) {
  var args = readEmAsmArgs(sigPtr, argbuf);
  return ASM_CONSTS[code].apply(null, args)
}
function _emscripten_asm_const_int(code, sigPtr, argbuf) {
  return runEmAsmFunction(code, sigPtr, argbuf)
}
function _emscripten_asm_const_int_sync_on_main_thread(code, sigPtr, argbuf) {
  return runMainThreadEmAsm(code, sigPtr, argbuf, 1)
}
function _emscripten_async_call(func, arg, millis) {
  function wrapper() {
    getWasmTableEntry(func)(arg)
  }
  if (millis >= 0 || ENVIRONMENT_IS_NODE) {
    safeSetTimeout(wrapper, millis)
  } else {
    Browser.safeRequestAnimationFrame(wrapper)
  }
}
function _emscripten_check_blocking_allowed() {}
function _emscripten_date_now() {
  return Date.now()
}
var JSEvents = {
  inEventHandler: 0,
  removeAllEventListeners: function() {
    for (var i = JSEvents.eventHandlers.length - 1; i >= 0; --i) {
      JSEvents._removeHandler(i)
    }
    JSEvents.eventHandlers = [];
    JSEvents.deferredCalls = []
  },
  registerRemoveEventListeners: function() {
    if (!JSEvents.removeEventListenersRegistered) {
      __ATEXIT__.push(JSEvents.removeAllEventListeners);
      JSEvents.removeEventListenersRegistered = true
    }
  },
  deferredCalls: [],
  deferCall: function(targetFunction, precedence, argsList) {
    function arraysHaveEqualContent(arrA, arrB) {
      if (arrA.length != arrB.length)
        return false;
      for (var i in arrA) {
        if (arrA[i] != arrB[i])
          return false
      }
      return true
    }
    for (var i in JSEvents.deferredCalls) {
      var call = JSEvents.deferredCalls[i];
      if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
        return
      }
    }
    JSEvents.deferredCalls.push({
      targetFunction: targetFunction,
      precedence: precedence,
      argsList: argsList
    });
    JSEvents.deferredCalls.sort(function(x, y) {
      return x.precedence < y.precedence
    })
  },
  removeDeferredCalls: function(targetFunction) {
    for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
      if (JSEvents.deferredCalls[i].targetFunction == targetFunction) {
        JSEvents.deferredCalls.splice(i, 1);
        --i
      }
    }
  },
  canPerformEventHandlerRequests: function() {
    return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls
  },
  runDeferredCalls: function() {
    if (!JSEvents.canPerformEventHandlerRequests()) {
      return
    }
    for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
      var call = JSEvents.deferredCalls[i];
      JSEvents.deferredCalls.splice(i, 1);
      --i;
      call.targetFunction.apply(null, call.argsList)
    }
  },
  eventHandlers: [],
  removeAllHandlersOnTarget: function(target, eventTypeString) {
    for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
      if (JSEvents.eventHandlers[i].target == target && (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
        JSEvents._removeHandler(i--)
      }
    }
  },
  _removeHandler: function(i) {
    var h = JSEvents.eventHandlers[i];
    h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
    JSEvents.eventHandlers.splice(i, 1)
  },
  registerOrRemoveHandler: function(eventHandler) {
    var jsEventHandler = function jsEventHandler(event) {
      ++JSEvents.inEventHandler;
      JSEvents.currentEventHandler = eventHandler;
      JSEvents.runDeferredCalls();
      eventHandler.handlerFunc(event);
      JSEvents.runDeferredCalls();
      --JSEvents.inEventHandler
    };
    if (eventHandler.callbackfunc) {
      eventHandler.eventListenerFunc = jsEventHandler;
      eventHandler.target.addEventListener(eventHandler.eventTypeString, jsEventHandler, eventHandler.useCapture);
      JSEvents.eventHandlers.push(eventHandler);
      JSEvents.registerRemoveEventListeners()
    } else {
      for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
        if (JSEvents.eventHandlers[i].target == eventHandler.target && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
          JSEvents._removeHandler(i--)
        }
      }
    }
  },
  queueEventHandlerOnThread_iiii: function(targetThread, eventHandlerFunc, eventTypeId, eventData, userData) {
    withStackSave(function() {
      var varargs = stackAlloc(12);
      GROWABLE_HEAP_I32()[varargs >> 2] = eventTypeId;
      GROWABLE_HEAP_I32()[varargs + 4 >> 2] = eventData;
      GROWABLE_HEAP_I32()[varargs + 8 >> 2] = userData;
      _emscripten_dispatch_to_thread_(targetThread, 637534208, eventHandlerFunc, eventData, varargs)
    })
  },
  getTargetThreadForEventCallback: function(targetThread) {
    switch (targetThread) {
    case 1:
      return 0;
    case 2:
      return PThread.currentProxiedOperationCallerThread;
    default:
      return targetThread
    }
  },
  getNodeNameForTarget: function(target) {
    if (!target)
      return "";
    if (target == window)
      return "#window";
    if (target == screen)
      return "#screen";
    return target && target.nodeName ? target.nodeName : ""
  },
  fullscreenEnabled: function() {
    return document.fullscreenEnabled || document.webkitFullscreenEnabled
  }
};
function requestPointerLock(target) {
  if (target.requestPointerLock) {
    target.requestPointerLock()
  } else {
    if (document.body.requestPointerLock) {
      return -3
    }
    return -1
  }
  return 0
}
function _emscripten_exit_pointerlock() {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(29, 1);
  JSEvents.removeDeferredCalls(requestPointerLock);
  if (document.exitPointerLock) {
    document.exitPointerLock()
  } else {
    return -1
  }
  return 0
}
function _emscripten_exit_with_live_runtime() {
  runtimeKeepalivePush();
  throw "unwind"
}
function _emscripten_get_canvas_size(width, height, isFullscreen) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(30, 1, width, height, isFullscreen);
  var canvas = Module["canvas"];
  GROWABLE_HEAP_I32()[width >> 2] = canvas.width;
  GROWABLE_HEAP_I32()[height >> 2] = canvas.height;
  GROWABLE_HEAP_I32()[isFullscreen >> 2] = Browser.isFullscreen ? 1 : 0
}
function _emscripten_get_device_pixel_ratio() {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(31, 1);
  return typeof devicePixelRatio == "number" && devicePixelRatio || 1
}
function getHeapMax() {
  return 2147483648
}
function _emscripten_get_heap_max() {
  return getHeapMax()
}
function fillPointerlockChangeEventData(eventStruct) {
  var pointerLockElement = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement || document.msPointerLockElement;
  var isPointerlocked = !!pointerLockElement;
  GROWABLE_HEAP_I32()[eventStruct >> 2] = isPointerlocked;
  var nodeName = JSEvents.getNodeNameForTarget(pointerLockElement);
  var id = pointerLockElement && pointerLockElement.id ? pointerLockElement.id : "";
  stringToUTF8(nodeName, eventStruct + 4, 128);
  stringToUTF8(id, eventStruct + 132, 128)
}
function _emscripten_get_pointerlock_status(pointerlockStatus) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(32, 1, pointerlockStatus);
  if (pointerlockStatus)
    fillPointerlockChangeEventData(pointerlockStatus);
  if (!document.body || !document.body.requestPointerLock && !document.body.mozRequestPointerLock && !document.body.webkitRequestPointerLock && !document.body.msRequestPointerLock) {
    return -1
  }
  return 0
}
function _glActiveTexture(x0) {
  GLctx["activeTexture"](x0)
}
var _emscripten_glActiveTexture = _glActiveTexture;
function _glAttachShader(program, shader) {
  GLctx.attachShader(GL.programs[program], GL.shaders[shader])
}
var _emscripten_glAttachShader = _glAttachShader;
function _glBeginQuery(target, id) {
  GLctx["beginQuery"](target, GL.queries[id])
}
var _emscripten_glBeginQuery = _glBeginQuery;
function _glBeginQueryEXT(target, id) {
  GLctx.disjointTimerQueryExt["beginQueryEXT"](target, GL.queries[id])
}
var _emscripten_glBeginQueryEXT = _glBeginQueryEXT;
function _glBeginTransformFeedback(x0) {
  GLctx["beginTransformFeedback"](x0)
}
var _emscripten_glBeginTransformFeedback = _glBeginTransformFeedback;
function _glBindAttribLocation(program, index, name) {
  GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name))
}
var _emscripten_glBindAttribLocation = _glBindAttribLocation;
function _glBindBuffer(target, buffer) {
  if (target == 35051) {
    GLctx.currentPixelPackBufferBinding = buffer
  } else if (target == 35052) {
    GLctx.currentPixelUnpackBufferBinding = buffer
  }
  GLctx.bindBuffer(target, GL.buffers[buffer])
}
var _emscripten_glBindBuffer = _glBindBuffer;
function _glBindBufferBase(target, index, buffer) {
  GLctx["bindBufferBase"](target, index, GL.buffers[buffer])
}
var _emscripten_glBindBufferBase = _glBindBufferBase;
function _glBindBufferRange(target, index, buffer, offset, ptrsize) {
  GLctx["bindBufferRange"](target, index, GL.buffers[buffer], offset, ptrsize)
}
var _emscripten_glBindBufferRange = _glBindBufferRange;
function _glBindFramebuffer(target, framebuffer) {
  GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer])
}
var _emscripten_glBindFramebuffer = _glBindFramebuffer;
function _glBindRenderbuffer(target, renderbuffer) {
  GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer])
}
var _emscripten_glBindRenderbuffer = _glBindRenderbuffer;
function _glBindSampler(unit, sampler) {
  GLctx["bindSampler"](unit, GL.samplers[sampler])
}
var _emscripten_glBindSampler = _glBindSampler;
function _glBindTexture(target, texture) {
  GLctx.bindTexture(target, GL.textures[texture])
}
var _emscripten_glBindTexture = _glBindTexture;
function _glBindTransformFeedback(target, id) {
  GLctx["bindTransformFeedback"](target, GL.transformFeedbacks[id])
}
var _emscripten_glBindTransformFeedback = _glBindTransformFeedback;
function _glBindVertexArray(vao) {
  GLctx["bindVertexArray"](GL.vaos[vao])
}
var _emscripten_glBindVertexArray = _glBindVertexArray;
var _glBindVertexArrayOES = _glBindVertexArray;
var _emscripten_glBindVertexArrayOES = _glBindVertexArrayOES;
function _glBlendColor(x0, x1, x2, x3) {
  GLctx["blendColor"](x0, x1, x2, x3)
}
var _emscripten_glBlendColor = _glBlendColor;
function _glBlendEquation(x0) {
  GLctx["blendEquation"](x0)
}
var _emscripten_glBlendEquation = _glBlendEquation;
function _glBlendEquationSeparate(x0, x1) {
  GLctx["blendEquationSeparate"](x0, x1)
}
var _emscripten_glBlendEquationSeparate = _glBlendEquationSeparate;
function _glBlendFunc(x0, x1) {
  GLctx["blendFunc"](x0, x1)
}
var _emscripten_glBlendFunc = _glBlendFunc;
function _glBlendFuncSeparate(x0, x1, x2, x3) {
  GLctx["blendFuncSeparate"](x0, x1, x2, x3)
}
var _emscripten_glBlendFuncSeparate = _glBlendFuncSeparate;
function _glBlitFramebuffer(x0, x1, x2, x3, x4, x5, x6, x7, x8, x9) {
  GLctx["blitFramebuffer"](x0, x1, x2, x3, x4, x5, x6, x7, x8, x9)
}
var _emscripten_glBlitFramebuffer = _glBlitFramebuffer;
function _glBufferData(target, size, data, usage) {
  if (GL.currentContext.version >= 2) {
    if (data && size) {
      GLctx.bufferData(target, GROWABLE_HEAP_U8(), usage, data, size)
    } else {
      GLctx.bufferData(target, size, usage)
    }
  } else {
    GLctx.bufferData(target, data ? GROWABLE_HEAP_U8().subarray(data, data + size) : size, usage)
  }
}
var _emscripten_glBufferData = _glBufferData;
function _glBufferSubData(target, offset, size, data) {
  if (GL.currentContext.version >= 2) {
    size && GLctx.bufferSubData(target, offset, GROWABLE_HEAP_U8(), data, size);
    return
  }
  GLctx.bufferSubData(target, offset, GROWABLE_HEAP_U8().subarray(data, data + size))
}
var _emscripten_glBufferSubData = _glBufferSubData;
function _glCheckFramebufferStatus(x0) {
  return GLctx["checkFramebufferStatus"](x0)
}
var _emscripten_glCheckFramebufferStatus = _glCheckFramebufferStatus;
function _glClear(x0) {
  GLctx["clear"](x0)
}
var _emscripten_glClear = _glClear;
function _glClearBufferfi(x0, x1, x2, x3) {
  GLctx["clearBufferfi"](x0, x1, x2, x3)
}
var _emscripten_glClearBufferfi = _glClearBufferfi;
function _glClearBufferfv(buffer, drawbuffer, value) {
  GLctx["clearBufferfv"](buffer, drawbuffer, GROWABLE_HEAP_F32(), value >> 2)
}
var _emscripten_glClearBufferfv = _glClearBufferfv;
function _glClearBufferiv(buffer, drawbuffer, value) {
  GLctx["clearBufferiv"](buffer, drawbuffer, GROWABLE_HEAP_I32(), value >> 2)
}
var _emscripten_glClearBufferiv = _glClearBufferiv;
function _glClearBufferuiv(buffer, drawbuffer, value) {
  GLctx["clearBufferuiv"](buffer, drawbuffer, GROWABLE_HEAP_U32(), value >> 2)
}
var _emscripten_glClearBufferuiv = _glClearBufferuiv;
function _glClearColor(x0, x1, x2, x3) {
  GLctx["clearColor"](x0, x1, x2, x3)
}
var _emscripten_glClearColor = _glClearColor;
function _glClearDepthf(x0) {
  GLctx["clearDepth"](x0)
}
var _emscripten_glClearDepthf = _glClearDepthf;
function _glClearStencil(x0) {
  GLctx["clearStencil"](x0)
}
var _emscripten_glClearStencil = _glClearStencil;
function convertI32PairToI53(lo, hi) {
  return (lo >>> 0) + hi * 4294967296
}
function _glClientWaitSync(sync, flags, timeout_low, timeout_high) {
  var timeout = convertI32PairToI53(timeout_low, timeout_high);
  return GLctx.clientWaitSync(GL.syncs[sync], flags, timeout)
}
var _emscripten_glClientWaitSync = _glClientWaitSync;
function _glColorMask(red, green, blue, alpha) {
  GLctx.colorMask(!!red, !!green, !!blue, !!alpha)
}
var _emscripten_glColorMask = _glColorMask;
function _glCompileShader(shader) {
  GLctx.compileShader(GL.shaders[shader])
}
var _emscripten_glCompileShader = _glCompileShader;
function _glCompressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data) {
  if (GL.currentContext.version >= 2) {
    if (GLctx.currentPixelUnpackBufferBinding || !imageSize) {
      GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, imageSize, data)
    } else {
      GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, GROWABLE_HEAP_U8(), data, imageSize)
    }
    return
  }
  GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, data ? GROWABLE_HEAP_U8().subarray(data, data + imageSize) : null)
}
var _emscripten_glCompressedTexImage2D = _glCompressedTexImage2D;
function _glCompressedTexImage3D(target, level, internalFormat, width, height, depth, border, imageSize, data) {
  if (GLctx.currentPixelUnpackBufferBinding) {
    GLctx["compressedTexImage3D"](target, level, internalFormat, width, height, depth, border, imageSize, data)
  } else {
    GLctx["compressedTexImage3D"](target, level, internalFormat, width, height, depth, border, GROWABLE_HEAP_U8(), data, imageSize)
  }
}
var _emscripten_glCompressedTexImage3D = _glCompressedTexImage3D;
function _glCompressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data) {
  if (GL.currentContext.version >= 2) {
    if (GLctx.currentPixelUnpackBufferBinding || !imageSize) {
      GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, imageSize, data)
    } else {
      GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, GROWABLE_HEAP_U8(), data, imageSize)
    }
    return
  }
  GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, data ? GROWABLE_HEAP_U8().subarray(data, data + imageSize) : null)
}
var _emscripten_glCompressedTexSubImage2D = _glCompressedTexSubImage2D;
function _glCompressedTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, imageSize, data) {
  if (GLctx.currentPixelUnpackBufferBinding) {
    GLctx["compressedTexSubImage3D"](target, level, xoffset, yoffset, zoffset, width, height, depth, format, imageSize, data)
  } else {
    GLctx["compressedTexSubImage3D"](target, level, xoffset, yoffset, zoffset, width, height, depth, format, GROWABLE_HEAP_U8(), data, imageSize)
  }
}
var _emscripten_glCompressedTexSubImage3D = _glCompressedTexSubImage3D;
function _glCopyBufferSubData(x0, x1, x2, x3, x4) {
  GLctx["copyBufferSubData"](x0, x1, x2, x3, x4)
}
var _emscripten_glCopyBufferSubData = _glCopyBufferSubData;
function _glCopyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
  GLctx["copyTexImage2D"](x0, x1, x2, x3, x4, x5, x6, x7)
}
var _emscripten_glCopyTexImage2D = _glCopyTexImage2D;
function _glCopyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
  GLctx["copyTexSubImage2D"](x0, x1, x2, x3, x4, x5, x6, x7)
}
var _emscripten_glCopyTexSubImage2D = _glCopyTexSubImage2D;
function _glCopyTexSubImage3D(x0, x1, x2, x3, x4, x5, x6, x7, x8) {
  GLctx["copyTexSubImage3D"](x0, x1, x2, x3, x4, x5, x6, x7, x8)
}
var _emscripten_glCopyTexSubImage3D = _glCopyTexSubImage3D;
function _glCreateProgram() {
  var id = GL.getNewId(GL.programs);
  var program = GLctx.createProgram();
  program.name = id;
  program.maxUniformLength = program.maxAttributeLength = program.maxUniformBlockNameLength = 0;
  program.uniformIdCounter = 1;
  GL.programs[id] = program;
  return id
}
var _emscripten_glCreateProgram = _glCreateProgram;
function _glCreateShader(shaderType) {
  var id = GL.getNewId(GL.shaders);
  GL.shaders[id] = GLctx.createShader(shaderType);
  return id
}
var _emscripten_glCreateShader = _glCreateShader;
function _glCullFace(x0) {
  GLctx["cullFace"](x0)
}
var _emscripten_glCullFace = _glCullFace;
function _glDeleteBuffers(n, buffers) {
  for (var i = 0; i < n; i++) {
    var id = GROWABLE_HEAP_I32()[buffers + i * 4 >> 2];
    var buffer = GL.buffers[id];
    if (!buffer)
      continue;
    GLctx.deleteBuffer(buffer);
    buffer.name = 0;
    GL.buffers[id] = null;
    if (id == GLctx.currentPixelPackBufferBinding)
      GLctx.currentPixelPackBufferBinding = 0;
    if (id == GLctx.currentPixelUnpackBufferBinding)
      GLctx.currentPixelUnpackBufferBinding = 0
  }
}
var _emscripten_glDeleteBuffers = _glDeleteBuffers;
function _glDeleteFramebuffers(n, framebuffers) {
  for (var i = 0; i < n; ++i) {
    var id = GROWABLE_HEAP_I32()[framebuffers + i * 4 >> 2];
    var framebuffer = GL.framebuffers[id];
    if (!framebuffer)
      continue;
    GLctx.deleteFramebuffer(framebuffer);
    framebuffer.name = 0;
    GL.framebuffers[id] = null
  }
}
var _emscripten_glDeleteFramebuffers = _glDeleteFramebuffers;
function _glDeleteProgram(id) {
  if (!id)
    return;
  var program = GL.programs[id];
  if (!program) {
    GL.recordError(1281);
    return
  }
  GLctx.deleteProgram(program);
  program.name = 0;
  GL.programs[id] = null
}
var _emscripten_glDeleteProgram = _glDeleteProgram;
function _glDeleteQueries(n, ids) {
  for (var i = 0; i < n; i++) {
    var id = GROWABLE_HEAP_I32()[ids + i * 4 >> 2];
    var query = GL.queries[id];
    if (!query)
      continue;
    GLctx["deleteQuery"](query);
    GL.queries[id] = null
  }
}
var _emscripten_glDeleteQueries = _glDeleteQueries;
function _glDeleteQueriesEXT(n, ids) {
  for (var i = 0; i < n; i++) {
    var id = GROWABLE_HEAP_I32()[ids + i * 4 >> 2];
    var query = GL.queries[id];
    if (!query)
      continue;
    GLctx.disjointTimerQueryExt["deleteQueryEXT"](query);
    GL.queries[id] = null
  }
}
var _emscripten_glDeleteQueriesEXT = _glDeleteQueriesEXT;
function _glDeleteRenderbuffers(n, renderbuffers) {
  for (var i = 0; i < n; i++) {
    var id = GROWABLE_HEAP_I32()[renderbuffers + i * 4 >> 2];
    var renderbuffer = GL.renderbuffers[id];
    if (!renderbuffer)
      continue;
    GLctx.deleteRenderbuffer(renderbuffer);
    renderbuffer.name = 0;
    GL.renderbuffers[id] = null
  }
}
var _emscripten_glDeleteRenderbuffers = _glDeleteRenderbuffers;
function _glDeleteSamplers(n, samplers) {
  for (var i = 0; i < n; i++) {
    var id = GROWABLE_HEAP_I32()[samplers + i * 4 >> 2];
    var sampler = GL.samplers[id];
    if (!sampler)
      continue;
    GLctx["deleteSampler"](sampler);
    sampler.name = 0;
    GL.samplers[id] = null
  }
}
var _emscripten_glDeleteSamplers = _glDeleteSamplers;
function _glDeleteShader(id) {
  if (!id)
    return;
  var shader = GL.shaders[id];
  if (!shader) {
    GL.recordError(1281);
    return
  }
  GLctx.deleteShader(shader);
  GL.shaders[id] = null
}
var _emscripten_glDeleteShader = _glDeleteShader;
function _glDeleteSync(id) {
  if (!id)
    return;
  var sync = GL.syncs[id];
  if (!sync) {
    GL.recordError(1281);
    return
  }
  GLctx.deleteSync(sync);
  sync.name = 0;
  GL.syncs[id] = null
}
var _emscripten_glDeleteSync = _glDeleteSync;
function _glDeleteTextures(n, textures) {
  for (var i = 0; i < n; i++) {
    var id = GROWABLE_HEAP_I32()[textures + i * 4 >> 2];
    var texture = GL.textures[id];
    if (!texture)
      continue;
    GLctx.deleteTexture(texture);
    texture.name = 0;
    GL.textures[id] = null
  }
}
var _emscripten_glDeleteTextures = _glDeleteTextures;
function _glDeleteTransformFeedbacks(n, ids) {
  for (var i = 0; i < n; i++) {
    var id = GROWABLE_HEAP_I32()[ids + i * 4 >> 2];
    var transformFeedback = GL.transformFeedbacks[id];
    if (!transformFeedback)
      continue;
    GLctx["deleteTransformFeedback"](transformFeedback);
    transformFeedback.name = 0;
    GL.transformFeedbacks[id] = null
  }
}
var _emscripten_glDeleteTransformFeedbacks = _glDeleteTransformFeedbacks;
function _glDeleteVertexArrays(n, vaos) {
  for (var i = 0; i < n; i++) {
    var id = GROWABLE_HEAP_I32()[vaos + i * 4 >> 2];
    GLctx["deleteVertexArray"](GL.vaos[id]);
    GL.vaos[id] = null
  }
}
var _emscripten_glDeleteVertexArrays = _glDeleteVertexArrays;
var _glDeleteVertexArraysOES = _glDeleteVertexArrays;
var _emscripten_glDeleteVertexArraysOES = _glDeleteVertexArraysOES;
function _glDepthFunc(x0) {
  GLctx["depthFunc"](x0)
}
var _emscripten_glDepthFunc = _glDepthFunc;
function _glDepthMask(flag) {
  GLctx.depthMask(!!flag)
}
var _emscripten_glDepthMask = _glDepthMask;
function _glDepthRangef(x0, x1) {
  GLctx["depthRange"](x0, x1)
}
var _emscripten_glDepthRangef = _glDepthRangef;
function _glDetachShader(program, shader) {
  GLctx.detachShader(GL.programs[program], GL.shaders[shader])
}
var _emscripten_glDetachShader = _glDetachShader;
function _glDisable(x0) {
  GLctx["disable"](x0)
}
var _emscripten_glDisable = _glDisable;
function _glDisableVertexAttribArray(index) {
  GLctx.disableVertexAttribArray(index)
}
var _emscripten_glDisableVertexAttribArray = _glDisableVertexAttribArray;
function _glDrawArrays(mode, first, count) {
  GLctx.drawArrays(mode, first, count)
}
var _emscripten_glDrawArrays = _glDrawArrays;
function _glDrawArraysInstanced(mode, first, count, primcount) {
  GLctx["drawArraysInstanced"](mode, first, count, primcount)
}
var _emscripten_glDrawArraysInstanced = _glDrawArraysInstanced;
var _glDrawArraysInstancedANGLE = _glDrawArraysInstanced;
var _emscripten_glDrawArraysInstancedANGLE = _glDrawArraysInstancedANGLE;
var _glDrawArraysInstancedARB = _glDrawArraysInstanced;
var _emscripten_glDrawArraysInstancedARB = _glDrawArraysInstancedARB;
var _glDrawArraysInstancedEXT = _glDrawArraysInstanced;
var _emscripten_glDrawArraysInstancedEXT = _glDrawArraysInstancedEXT;
var _glDrawArraysInstancedNV = _glDrawArraysInstanced;
var _emscripten_glDrawArraysInstancedNV = _glDrawArraysInstancedNV;
var tempFixedLengthArray = [];
function _glDrawBuffers(n, bufs) {
  var bufArray = tempFixedLengthArray[n];
  for (var i = 0; i < n; i++) {
    bufArray[i] = GROWABLE_HEAP_I32()[bufs + i * 4 >> 2]
  }
  GLctx["drawBuffers"](bufArray)
}
var _emscripten_glDrawBuffers = _glDrawBuffers;
var _glDrawBuffersEXT = _glDrawBuffers;
var _emscripten_glDrawBuffersEXT = _glDrawBuffersEXT;
var _glDrawBuffersWEBGL = _glDrawBuffers;
var _emscripten_glDrawBuffersWEBGL = _glDrawBuffersWEBGL;
function _glDrawElements(mode, count, type, indices) {
  GLctx.drawElements(mode, count, type, indices)
}
var _emscripten_glDrawElements = _glDrawElements;
function _glDrawElementsInstanced(mode, count, type, indices, primcount) {
  GLctx["drawElementsInstanced"](mode, count, type, indices, primcount)
}
var _emscripten_glDrawElementsInstanced = _glDrawElementsInstanced;
var _glDrawElementsInstancedANGLE = _glDrawElementsInstanced;
var _emscripten_glDrawElementsInstancedANGLE = _glDrawElementsInstancedANGLE;
var _glDrawElementsInstancedARB = _glDrawElementsInstanced;
var _emscripten_glDrawElementsInstancedARB = _glDrawElementsInstancedARB;
var _glDrawElementsInstancedEXT = _glDrawElementsInstanced;
var _emscripten_glDrawElementsInstancedEXT = _glDrawElementsInstancedEXT;
var _glDrawElementsInstancedNV = _glDrawElementsInstanced;
var _emscripten_glDrawElementsInstancedNV = _glDrawElementsInstancedNV;
function _glDrawRangeElements(mode, start, end, count, type, indices) {
  _glDrawElements(mode, count, type, indices)
}
var _emscripten_glDrawRangeElements = _glDrawRangeElements;
function _glEnable(x0) {
  GLctx["enable"](x0)
}
var _emscripten_glEnable = _glEnable;
function _glEnableVertexAttribArray(index) {
  GLctx.enableVertexAttribArray(index)
}
var _emscripten_glEnableVertexAttribArray = _glEnableVertexAttribArray;
function _glEndQuery(x0) {
  GLctx["endQuery"](x0)
}
var _emscripten_glEndQuery = _glEndQuery;
function _glEndQueryEXT(target) {
  GLctx.disjointTimerQueryExt["endQueryEXT"](target)
}
var _emscripten_glEndQueryEXT = _glEndQueryEXT;
function _glEndTransformFeedback() {
  GLctx["endTransformFeedback"]()
}
var _emscripten_glEndTransformFeedback = _glEndTransformFeedback;
function _glFenceSync(condition, flags) {
  var sync = GLctx.fenceSync(condition, flags);
  if (sync) {
    var id = GL.getNewId(GL.syncs);
    sync.name = id;
    GL.syncs[id] = sync;
    return id
  }
  return 0
}
var _emscripten_glFenceSync = _glFenceSync;
function _glFinish() {
  GLctx["finish"]()
}
var _emscripten_glFinish = _glFinish;
function _glFlush() {
  GLctx["flush"]()
}
var _emscripten_glFlush = _glFlush;
function _glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
  GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer])
}
var _emscripten_glFramebufferRenderbuffer = _glFramebufferRenderbuffer;
function _glFramebufferTexture2D(target, attachment, textarget, texture, level) {
  GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level)
}
var _emscripten_glFramebufferTexture2D = _glFramebufferTexture2D;
function _glFramebufferTextureLayer(target, attachment, texture, level, layer) {
  GLctx.framebufferTextureLayer(target, attachment, GL.textures[texture], level, layer)
}
var _emscripten_glFramebufferTextureLayer = _glFramebufferTextureLayer;
function _glFrontFace(x0) {
  GLctx["frontFace"](x0)
}
var _emscripten_glFrontFace = _glFrontFace;
function __glGenObject(n, buffers, createFunction, objectTable) {
  for (var i = 0; i < n; i++) {
    var buffer = GLctx[createFunction]();
    var id = buffer && GL.getNewId(objectTable);
    if (buffer) {
      buffer.name = id;
      objectTable[id] = buffer
    } else {
      GL.recordError(1282)
    }
    GROWABLE_HEAP_I32()[buffers + i * 4 >> 2] = id
  }
}
function _glGenBuffers(n, buffers) {
  __glGenObject(n, buffers, "createBuffer", GL.buffers)
}
var _emscripten_glGenBuffers = _glGenBuffers;
function _glGenFramebuffers(n, ids) {
  __glGenObject(n, ids, "createFramebuffer", GL.framebuffers)
}
var _emscripten_glGenFramebuffers = _glGenFramebuffers;
function _glGenQueries(n, ids) {
  __glGenObject(n, ids, "createQuery", GL.queries)
}
var _emscripten_glGenQueries = _glGenQueries;
function _glGenQueriesEXT(n, ids) {
  for (var i = 0; i < n; i++) {
    var query = GLctx.disjointTimerQueryExt["createQueryEXT"]();
    if (!query) {
      GL.recordError(1282);
      while (i < n)
        GROWABLE_HEAP_I32()[ids + i++ * 4 >> 2] = 0;
      return
    }
    var id = GL.getNewId(GL.queries);
    query.name = id;
    GL.queries[id] = query;
    GROWABLE_HEAP_I32()[ids + i * 4 >> 2] = id
  }
}
var _emscripten_glGenQueriesEXT = _glGenQueriesEXT;
function _glGenRenderbuffers(n, renderbuffers) {
  __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers)
}
var _emscripten_glGenRenderbuffers = _glGenRenderbuffers;
function _glGenSamplers(n, samplers) {
  __glGenObject(n, samplers, "createSampler", GL.samplers)
}
var _emscripten_glGenSamplers = _glGenSamplers;
function _glGenTextures(n, textures) {
  __glGenObject(n, textures, "createTexture", GL.textures)
}
var _emscripten_glGenTextures = _glGenTextures;
function _glGenTransformFeedbacks(n, ids) {
  __glGenObject(n, ids, "createTransformFeedback", GL.transformFeedbacks)
}
var _emscripten_glGenTransformFeedbacks = _glGenTransformFeedbacks;
function _glGenVertexArrays(n, arrays) {
  __glGenObject(n, arrays, "createVertexArray", GL.vaos)
}
var _emscripten_glGenVertexArrays = _glGenVertexArrays;
var _glGenVertexArraysOES = _glGenVertexArrays;
var _emscripten_glGenVertexArraysOES = _glGenVertexArraysOES;
function _glGenerateMipmap(x0) {
  GLctx["generateMipmap"](x0)
}
var _emscripten_glGenerateMipmap = _glGenerateMipmap;
function __glGetActiveAttribOrUniform(funcName, program, index, bufSize, length, size, type, name) {
  program = GL.programs[program];
  var info = GLctx[funcName](program, index);
  if (info) {
    var numBytesWrittenExclNull = name && stringToUTF8(info.name, name, bufSize);
    if (length)
      GROWABLE_HEAP_I32()[length >> 2] = numBytesWrittenExclNull;
    if (size)
      GROWABLE_HEAP_I32()[size >> 2] = info.size;
    if (type)
      GROWABLE_HEAP_I32()[type >> 2] = info.type
  }
}
function _glGetActiveAttrib(program, index, bufSize, length, size, type, name) {
  __glGetActiveAttribOrUniform("getActiveAttrib", program, index, bufSize, length, size, type, name)
}
var _emscripten_glGetActiveAttrib = _glGetActiveAttrib;
function _glGetActiveUniform(program, index, bufSize, length, size, type, name) {
  __glGetActiveAttribOrUniform("getActiveUniform", program, index, bufSize, length, size, type, name)
}
var _emscripten_glGetActiveUniform = _glGetActiveUniform;
function _glGetActiveUniformBlockName(program, uniformBlockIndex, bufSize, length, uniformBlockName) {
  program = GL.programs[program];
  var result = GLctx["getActiveUniformBlockName"](program, uniformBlockIndex);
  if (!result)
    return;
  if (uniformBlockName && bufSize > 0) {
    var numBytesWrittenExclNull = stringToUTF8(result, uniformBlockName, bufSize);
    if (length)
      GROWABLE_HEAP_I32()[length >> 2] = numBytesWrittenExclNull
  } else {
    if (length)
      GROWABLE_HEAP_I32()[length >> 2] = 0
  }
}
var _emscripten_glGetActiveUniformBlockName = _glGetActiveUniformBlockName;
function _glGetActiveUniformBlockiv(program, uniformBlockIndex, pname, params) {
  if (!params) {
    GL.recordError(1281);
    return
  }
  program = GL.programs[program];
  if (pname == 35393) {
    var name = GLctx["getActiveUniformBlockName"](program, uniformBlockIndex);
    GROWABLE_HEAP_I32()[params >> 2] = name.length + 1;
    return
  }
  var result = GLctx["getActiveUniformBlockParameter"](program, uniformBlockIndex, pname);
  if (result === null)
    return;
  if (pname == 35395) {
    for (var i = 0; i < result.length; i++) {
      GROWABLE_HEAP_I32()[params + i * 4 >> 2] = result[i]
    }
  } else {
    GROWABLE_HEAP_I32()[params >> 2] = result
  }
}
var _emscripten_glGetActiveUniformBlockiv = _glGetActiveUniformBlockiv;
function _glGetActiveUniformsiv(program, uniformCount, uniformIndices, pname, params) {
  if (!params) {
    GL.recordError(1281);
    return
  }
  if (uniformCount > 0 && uniformIndices == 0) {
    GL.recordError(1281);
    return
  }
  program = GL.programs[program];
  var ids = [];
  for (var i = 0; i < uniformCount; i++) {
    ids.push(GROWABLE_HEAP_I32()[uniformIndices + i * 4 >> 2])
  }
  var result = GLctx["getActiveUniforms"](program, ids, pname);
  if (!result)
    return;
  var len = result.length;
  for (var i = 0; i < len; i++) {
    GROWABLE_HEAP_I32()[params + i * 4 >> 2] = result[i]
  }
}
var _emscripten_glGetActiveUniformsiv = _glGetActiveUniformsiv;
function _glGetAttachedShaders(program, maxCount, count, shaders) {
  var result = GLctx.getAttachedShaders(GL.programs[program]);
  var len = result.length;
  if (len > maxCount) {
    len = maxCount
  }
  GROWABLE_HEAP_I32()[count >> 2] = len;
  for (var i = 0; i < len; ++i) {
    var id = GL.shaders.indexOf(result[i]);
    GROWABLE_HEAP_I32()[shaders + i * 4 >> 2] = id
  }
}
var _emscripten_glGetAttachedShaders = _glGetAttachedShaders;
function _glGetAttribLocation(program, name) {
  return GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name))
}
var _emscripten_glGetAttribLocation = _glGetAttribLocation;
function writeI53ToI64(ptr, num) {
  GROWABLE_HEAP_U32()[ptr >> 2] = num;
  GROWABLE_HEAP_U32()[ptr + 4 >> 2] = (num - GROWABLE_HEAP_U32()[ptr >> 2]) / 4294967296
}
function emscriptenWebGLGet(name_, p, type) {
  if (!p) {
    GL.recordError(1281);
    return
  }
  var ret = undefined;
  switch (name_) {
  case 36346:
    ret = 1;
    break;
  case 36344:
    if (type != 0 && type != 1) {
      GL.recordError(1280)
    }
    return;
  case 34814:
  case 36345:
    ret = 0;
    break;
  case 34466:
    var formats = GLctx.getParameter(34467);
    ret = formats ? formats.length : 0;
    break;
  case 33309:
    if (GL.currentContext.version < 2) {
      GL.recordError(1282);
      return
    }
    var exts = GLctx.getSupportedExtensions() || [];
    ret = 2 * exts.length;
    break;
  case 33307:
  case 33308:
    if (GL.currentContext.version < 2) {
      GL.recordError(1280);
      return
    }
    ret = name_ == 33307 ? 3 : 0;
    break
  }
  if (ret === undefined) {
    var result = GLctx.getParameter(name_);
    switch (typeof result) {
    case "number":
      ret = result;
      break;
    case "boolean":
      ret = result ? 1 : 0;
      break;
    case "string":
      GL.recordError(1280);
      return;
    case "object":
      if (result === null) {
        switch (name_) {
        case 34964:
        case 35725:
        case 34965:
        case 36006:
        case 36007:
        case 32873:
        case 34229:
        case 36662:
        case 36663:
        case 35053:
        case 35055:
        case 36010:
        case 35097:
        case 35869:
        case 32874:
        case 36389:
        case 35983:
        case 35368:
        case 34068:
          {
            ret = 0;
            break
          }
        default:
          {
            GL.recordError(1280);
            return
          }
        }
      } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
        for (var i = 0; i < result.length; ++i) {
          switch (type) {
          case 0:
            GROWABLE_HEAP_I32()[p + i * 4 >> 2] = result[i];
            break;
          case 2:
            GROWABLE_HEAP_F32()[p + i * 4 >> 2] = result[i];
            break;
          case 4:
            GROWABLE_HEAP_I8()[p + i >> 0] = result[i] ? 1 : 0;
            break
          }
        }
        return
      } else {
        try {
          ret = result.name | 0
        } catch (e) {
          GL.recordError(1280);
          err("GL_INVALID_ENUM in glGet" + type + "v: Unknown object returned from WebGL getParameter(" + name_ + ")! (error: " + e + ")");
          return
        }
      }
      break;
    default:
      GL.recordError(1280);
      err("GL_INVALID_ENUM in glGet" + type + "v: Native code calling glGet" + type + "v(" + name_ + ") and it returns " + result + " of type " + typeof result + "!");
      return
    }
  }
  switch (type) {
  case 1:
    writeI53ToI64(p, ret);
    break;
  case 0:
    GROWABLE_HEAP_I32()[p >> 2] = ret;
    break;
  case 2:
    GROWABLE_HEAP_F32()[p >> 2] = ret;
    break;
  case 4:
    GROWABLE_HEAP_I8()[p >> 0] = ret ? 1 : 0;
    break
  }
}
function _glGetBooleanv(name_, p) {
  emscriptenWebGLGet(name_, p, 4)
}
var _emscripten_glGetBooleanv = _glGetBooleanv;
function _glGetBufferParameteri64v(target, value, data) {
  if (!data) {
    GL.recordError(1281);
    return
  }
  writeI53ToI64(data, GLctx.getBufferParameter(target, value))
}
var _emscripten_glGetBufferParameteri64v = _glGetBufferParameteri64v;
function _glGetBufferParameteriv(target, value, data) {
  if (!data) {
    GL.recordError(1281);
    return
  }
  GROWABLE_HEAP_I32()[data >> 2] = GLctx.getBufferParameter(target, value)
}
var _emscripten_glGetBufferParameteriv = _glGetBufferParameteriv;
function _glGetError() {
  var error = GLctx.getError() || GL.lastError;
  GL.lastError = 0;
  return error
}
var _emscripten_glGetError = _glGetError;
function _glGetFloatv(name_, p) {
  emscriptenWebGLGet(name_, p, 2)
}
var _emscripten_glGetFloatv = _glGetFloatv;
function _glGetFragDataLocation(program, name) {
  return GLctx["getFragDataLocation"](GL.programs[program], UTF8ToString(name))
}
var _emscripten_glGetFragDataLocation = _glGetFragDataLocation;
function _glGetFramebufferAttachmentParameteriv(target, attachment, pname, params) {
  var result = GLctx.getFramebufferAttachmentParameter(target, attachment, pname);
  if (result instanceof WebGLRenderbuffer || result instanceof WebGLTexture) {
    result = result.name | 0
  }
  GROWABLE_HEAP_I32()[params >> 2] = result
}
var _emscripten_glGetFramebufferAttachmentParameteriv = _glGetFramebufferAttachmentParameteriv;
function emscriptenWebGLGetIndexed(target, index, data, type) {
  if (!data) {
    GL.recordError(1281);
    return
  }
  var result = GLctx["getIndexedParameter"](target, index);
  var ret;
  switch (typeof result) {
  case "boolean":
    ret = result ? 1 : 0;
    break;
  case "number":
    ret = result;
    break;
  case "object":
    if (result === null) {
      switch (target) {
      case 35983:
      case 35368:
        ret = 0;
        break;
      default:
        {
          GL.recordError(1280);
          return
        }
      }
    } else if (result instanceof WebGLBuffer) {
      ret = result.name | 0
    } else {
      GL.recordError(1280);
      return
    }
    break;
  default:
    GL.recordError(1280);
    return
  }
  switch (type) {
  case 1:
    writeI53ToI64(data, ret);
    break;
  case 0:
    GROWABLE_HEAP_I32()[data >> 2] = ret;
    break;
  case 2:
    GROWABLE_HEAP_F32()[data >> 2] = ret;
    break;
  case 4:
    GROWABLE_HEAP_I8()[data >> 0] = ret ? 1 : 0;
    break;
  default:
    throw "internal emscriptenWebGLGetIndexed() error, bad type: " + type
  }
}
function _glGetInteger64i_v(target, index, data) {
  emscriptenWebGLGetIndexed(target, index, data, 1)
}
var _emscripten_glGetInteger64i_v = _glGetInteger64i_v;
function _glGetInteger64v(name_, p) {
  emscriptenWebGLGet(name_, p, 1)
}
var _emscripten_glGetInteger64v = _glGetInteger64v;
function _glGetIntegeri_v(target, index, data) {
  emscriptenWebGLGetIndexed(target, index, data, 0)
}
var _emscripten_glGetIntegeri_v = _glGetIntegeri_v;
function _glGetIntegerv(name_, p) {
  emscriptenWebGLGet(name_, p, 0)
}
var _emscripten_glGetIntegerv = _glGetIntegerv;
function _glGetInternalformativ(target, internalformat, pname, bufSize, params) {
  if (bufSize < 0) {
    GL.recordError(1281);
    return
  }
  if (!params) {
    GL.recordError(1281);
    return
  }
  var ret = GLctx["getInternalformatParameter"](target, internalformat, pname);
  if (ret === null)
    return;
  for (var i = 0; i < ret.length && i < bufSize; ++i) {
    GROWABLE_HEAP_I32()[params + i * 4 >> 2] = ret[i]
  }
}
var _emscripten_glGetInternalformativ = _glGetInternalformativ;
function _glGetProgramBinary(program, bufSize, length, binaryFormat, binary) {
  GL.recordError(1282)
}
var _emscripten_glGetProgramBinary = _glGetProgramBinary;
function _glGetProgramInfoLog(program, maxLength, length, infoLog) {
  var log = GLctx.getProgramInfoLog(GL.programs[program]);
  if (log === null)
    log = "(unknown error)";
  var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
  if (length)
    GROWABLE_HEAP_I32()[length >> 2] = numBytesWrittenExclNull
}
var _emscripten_glGetProgramInfoLog = _glGetProgramInfoLog;
function _glGetProgramiv(program, pname, p) {
  if (!p) {
    GL.recordError(1281);
    return
  }
  if (program >= GL.counter) {
    GL.recordError(1281);
    return
  }
  program = GL.programs[program];
  if (pname == 35716) {
    var log = GLctx.getProgramInfoLog(program);
    if (log === null)
      log = "(unknown error)";
    GROWABLE_HEAP_I32()[p >> 2] = log.length + 1
  } else if (pname == 35719) {
    if (!program.maxUniformLength) {
      for (var i = 0; i < GLctx.getProgramParameter(program, 35718); ++i) {
        program.maxUniformLength = Math.max(program.maxUniformLength, GLctx.getActiveUniform(program, i).name.length + 1)
      }
    }
    GROWABLE_HEAP_I32()[p >> 2] = program.maxUniformLength
  } else if (pname == 35722) {
    if (!program.maxAttributeLength) {
      for (var i = 0; i < GLctx.getProgramParameter(program, 35721); ++i) {
        program.maxAttributeLength = Math.max(program.maxAttributeLength, GLctx.getActiveAttrib(program, i).name.length + 1)
      }
    }
    GROWABLE_HEAP_I32()[p >> 2] = program.maxAttributeLength
  } else if (pname == 35381) {
    if (!program.maxUniformBlockNameLength) {
      for (var i = 0; i < GLctx.getProgramParameter(program, 35382); ++i) {
        program.maxUniformBlockNameLength = Math.max(program.maxUniformBlockNameLength, GLctx.getActiveUniformBlockName(program, i).length + 1)
      }
    }
    GROWABLE_HEAP_I32()[p >> 2] = program.maxUniformBlockNameLength
  } else {
    GROWABLE_HEAP_I32()[p >> 2] = GLctx.getProgramParameter(program, pname)
  }
}
var _emscripten_glGetProgramiv = _glGetProgramiv;
function _glGetQueryObjecti64vEXT(id, pname, params) {
  if (!params) {
    GL.recordError(1281);
    return
  }
  var query = GL.queries[id];
  var param;
  if (GL.currentContext.version < 2) {
    param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname)
  } else {
    param = GLctx["getQueryParameter"](query, pname)
  }
  var ret;
  if (typeof param == "boolean") {
    ret = param ? 1 : 0
  } else {
    ret = param
  }
  writeI53ToI64(params, ret)
}
var _emscripten_glGetQueryObjecti64vEXT = _glGetQueryObjecti64vEXT;
function _glGetQueryObjectivEXT(id, pname, params) {
  if (!params) {
    GL.recordError(1281);
    return
  }
  var query = GL.queries[id];
  var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
  var ret;
  if (typeof param == "boolean") {
    ret = param ? 1 : 0
  } else {
    ret = param
  }
  GROWABLE_HEAP_I32()[params >> 2] = ret
}
var _emscripten_glGetQueryObjectivEXT = _glGetQueryObjectivEXT;
var _glGetQueryObjectui64vEXT = _glGetQueryObjecti64vEXT;
var _emscripten_glGetQueryObjectui64vEXT = _glGetQueryObjectui64vEXT;
function _glGetQueryObjectuiv(id, pname, params) {
  if (!params) {
    GL.recordError(1281);
    return
  }
  var query = GL.queries[id];
  var param = GLctx["getQueryParameter"](query, pname);
  var ret;
  if (typeof param == "boolean") {
    ret = param ? 1 : 0
  } else {
    ret = param
  }
  GROWABLE_HEAP_I32()[params >> 2] = ret
}
var _emscripten_glGetQueryObjectuiv = _glGetQueryObjectuiv;
var _glGetQueryObjectuivEXT = _glGetQueryObjectivEXT;
var _emscripten_glGetQueryObjectuivEXT = _glGetQueryObjectuivEXT;
function _glGetQueryiv(target, pname, params) {
  if (!params) {
    GL.recordError(1281);
    return
  }
  GROWABLE_HEAP_I32()[params >> 2] = GLctx["getQuery"](target, pname)
}
var _emscripten_glGetQueryiv = _glGetQueryiv;
function _glGetQueryivEXT(target, pname, params) {
  if (!params) {
    GL.recordError(1281);
    return
  }
  GROWABLE_HEAP_I32()[params >> 2] = GLctx.disjointTimerQueryExt["getQueryEXT"](target, pname)
}
var _emscripten_glGetQueryivEXT = _glGetQueryivEXT;
function _glGetRenderbufferParameteriv(target, pname, params) {
  if (!params) {
    GL.recordError(1281);
    return
  }
  GROWABLE_HEAP_I32()[params >> 2] = GLctx.getRenderbufferParameter(target, pname)
}
var _emscripten_glGetRenderbufferParameteriv = _glGetRenderbufferParameteriv;
function _glGetSamplerParameterfv(sampler, pname, params) {
  if (!params) {
    GL.recordError(1281);
    return
  }
  GROWABLE_HEAP_F32()[params >> 2] = GLctx["getSamplerParameter"](GL.samplers[sampler], pname)
}
var _emscripten_glGetSamplerParameterfv = _glGetSamplerParameterfv;
function _glGetSamplerParameteriv(sampler, pname, params) {
  if (!params) {
    GL.recordError(1281);
    return
  }
  GROWABLE_HEAP_I32()[params >> 2] = GLctx["getSamplerParameter"](GL.samplers[sampler], pname)
}
var _emscripten_glGetSamplerParameteriv = _glGetSamplerParameteriv;
function _glGetShaderInfoLog(shader, maxLength, length, infoLog) {
  var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
  if (log === null)
    log = "(unknown error)";
  var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
  if (length)
    GROWABLE_HEAP_I32()[length >> 2] = numBytesWrittenExclNull
}
var _emscripten_glGetShaderInfoLog = _glGetShaderInfoLog;
function _glGetShaderPrecisionFormat(shaderType, precisionType, range, precision) {
  var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
  GROWABLE_HEAP_I32()[range >> 2] = result.rangeMin;
  GROWABLE_HEAP_I32()[range + 4 >> 2] = result.rangeMax;
  GROWABLE_HEAP_I32()[precision >> 2] = result.precision
}
var _emscripten_glGetShaderPrecisionFormat = _glGetShaderPrecisionFormat;
function _glGetShaderSource(shader, bufSize, length, source) {
  var result = GLctx.getShaderSource(GL.shaders[shader]);
  if (!result)
    return;
  var numBytesWrittenExclNull = bufSize > 0 && source ? stringToUTF8(result, source, bufSize) : 0;
  if (length)
    GROWABLE_HEAP_I32()[length >> 2] = numBytesWrittenExclNull
}
var _emscripten_glGetShaderSource = _glGetShaderSource;
function _glGetShaderiv(shader, pname, p) {
  if (!p) {
    GL.recordError(1281);
    return
  }
  if (pname == 35716) {
    var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
    if (log === null)
      log = "(unknown error)";
    var logLength = log ? log.length + 1 : 0;
    GROWABLE_HEAP_I32()[p >> 2] = logLength
  } else if (pname == 35720) {
    var source = GLctx.getShaderSource(GL.shaders[shader]);
    var sourceLength = source ? source.length + 1 : 0;
    GROWABLE_HEAP_I32()[p >> 2] = sourceLength
  } else {
    GROWABLE_HEAP_I32()[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname)
  }
}
var _emscripten_glGetShaderiv = _glGetShaderiv;
function _glGetString(name_) {
  var ret = GL.stringCache[name_];
  if (!ret) {
    switch (name_) {
    case 7939:
      var exts = GLctx.getSupportedExtensions() || [];
      exts = exts.concat(exts.map(function(e) {
        return "GL_" + e
      }));
      ret = stringToNewUTF8(exts.join(" "));
      break;
    case 7936:
    case 7937:
    case 37445:
    case 37446:
      var s = GLctx.getParameter(name_);
      if (!s) {
        GL.recordError(1280)
      }
      ret = s && stringToNewUTF8(s);
      break;
    case 7938:
      var glVersion = GLctx.getParameter(7938);
      if (GL.currentContext.version >= 2)
        glVersion = "OpenGL ES 3.0 (" + glVersion + ")";
      else {
        glVersion = "OpenGL ES 2.0 (" + glVersion + ")"
      }
      ret = stringToNewUTF8(glVersion);
      break;
    case 35724:
      var glslVersion = GLctx.getParameter(35724);
      var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
      var ver_num = glslVersion.match(ver_re);
      if (ver_num !== null) {
        if (ver_num[1].length == 3)
          ver_num[1] = ver_num[1] + "0";
        glslVersion = "OpenGL ES GLSL ES " + ver_num[1] + " (" + glslVersion + ")"
      }
      ret = stringToNewUTF8(glslVersion);
      break;
    default:
      GL.recordError(1280)
    }
    GL.stringCache[name_] = ret
  }
  return ret
}
var _emscripten_glGetString = _glGetString;
function _glGetStringi(name, index) {
  if (GL.currentContext.version < 2) {
    GL.recordError(1282);
    return 0
  }
  var stringiCache = GL.stringiCache[name];
  if (stringiCache) {
    if (index < 0 || index >= stringiCache.length) {
      GL.recordError(1281);
      return 0
    }
    return stringiCache[index]
  }
  switch (name) {
  case 7939:
    var exts = GLctx.getSupportedExtensions() || [];
    exts = exts.concat(exts.map(function(e) {
      return "GL_" + e
    }));
    exts = exts.map(function(e) {
      return stringToNewUTF8(e)
    });
    stringiCache = GL.stringiCache[name] = exts;
    if (index < 0 || index >= stringiCache.length) {
      GL.recordError(1281);
      return 0
    }
    return stringiCache[index];
  default:
    GL.recordError(1280);
    return 0
  }
}
var _emscripten_glGetStringi = _glGetStringi;
function _glGetSynciv(sync, pname, bufSize, length, values) {
  if (bufSize < 0) {
    GL.recordError(1281);
    return
  }
  if (!values) {
    GL.recordError(1281);
    return
  }
  var ret = GLctx.getSyncParameter(GL.syncs[sync], pname);
  if (ret !== null) {
    GROWABLE_HEAP_I32()[values >> 2] = ret;
    if (length)
      GROWABLE_HEAP_I32()[length >> 2] = 1
  }
}
var _emscripten_glGetSynciv = _glGetSynciv;
function _glGetTexParameterfv(target, pname, params) {
  if (!params) {
    GL.recordError(1281);
    return
  }
  GROWABLE_HEAP_F32()[params >> 2] = GLctx.getTexParameter(target, pname)
}
var _emscripten_glGetTexParameterfv = _glGetTexParameterfv;
function _glGetTexParameteriv(target, pname, params) {
  if (!params) {
    GL.recordError(1281);
    return
  }
  GROWABLE_HEAP_I32()[params >> 2] = GLctx.getTexParameter(target, pname)
}
var _emscripten_glGetTexParameteriv = _glGetTexParameteriv;
function _glGetTransformFeedbackVarying(program, index, bufSize, length, size, type, name) {
  program = GL.programs[program];
  var info = GLctx["getTransformFeedbackVarying"](program, index);
  if (!info)
    return;
  if (name && bufSize > 0) {
    var numBytesWrittenExclNull = stringToUTF8(info.name, name, bufSize);
    if (length)
      GROWABLE_HEAP_I32()[length >> 2] = numBytesWrittenExclNull
  } else {
    if (length)
      GROWABLE_HEAP_I32()[length >> 2] = 0
  }
  if (size)
    GROWABLE_HEAP_I32()[size >> 2] = info.size;
  if (type)
    GROWABLE_HEAP_I32()[type >> 2] = info.type
}
var _emscripten_glGetTransformFeedbackVarying = _glGetTransformFeedbackVarying;
function _glGetUniformBlockIndex(program, uniformBlockName) {
  return GLctx["getUniformBlockIndex"](GL.programs[program], UTF8ToString(uniformBlockName))
}
var _emscripten_glGetUniformBlockIndex = _glGetUniformBlockIndex;
function _glGetUniformIndices(program, uniformCount, uniformNames, uniformIndices) {
  if (!uniformIndices) {
    GL.recordError(1281);
    return
  }
  if (uniformCount > 0 && (uniformNames == 0 || uniformIndices == 0)) {
    GL.recordError(1281);
    return
  }
  program = GL.programs[program];
  var names = [];
  for (var i = 0; i < uniformCount; i++)
    names.push(UTF8ToString(GROWABLE_HEAP_I32()[uniformNames + i * 4 >> 2]));
  var result = GLctx["getUniformIndices"](program, names);
  if (!result)
    return;
  var len = result.length;
  for (var i = 0; i < len; i++) {
    GROWABLE_HEAP_I32()[uniformIndices + i * 4 >> 2] = result[i]
  }
}
var _emscripten_glGetUniformIndices = _glGetUniformIndices;
function jstoi_q(str) {
  return parseInt(str)
}
function webglGetLeftBracePos(name) {
  return name.slice(-1) == "]" && name.lastIndexOf("[")
}
function webglPrepareUniformLocationsBeforeFirstUse(program) {
  var uniformLocsById = program.uniformLocsById, uniformSizeAndIdsByName = program.uniformSizeAndIdsByName, i, j;
  if (!uniformLocsById) {
    program.uniformLocsById = uniformLocsById = {};
    program.uniformArrayNamesById = {};
    for (i = 0; i < GLctx.getProgramParameter(program, 35718); ++i) {
      var u = GLctx.getActiveUniform(program, i);
      var nm = u.name;
      var sz = u.size;
      var lb = webglGetLeftBracePos(nm);
      var arrayName = lb > 0 ? nm.slice(0, lb) : nm;
      var id = program.uniformIdCounter;
      program.uniformIdCounter += sz;
      uniformSizeAndIdsByName[arrayName] = [sz, id];
      for (j = 0; j < sz; ++j) {
        uniformLocsById[id] = j;
        program.uniformArrayNamesById[id++] = arrayName
      }
    }
  }
}
function _glGetUniformLocation(program, name) {
  name = UTF8ToString(name);
  if (program = GL.programs[program]) {
    webglPrepareUniformLocationsBeforeFirstUse(program);
    var uniformLocsById = program.uniformLocsById;
    var arrayIndex = 0;
    var uniformBaseName = name;
    var leftBrace = webglGetLeftBracePos(name);
    if (leftBrace > 0) {
      arrayIndex = jstoi_q(name.slice(leftBrace + 1)) >>> 0;
      uniformBaseName = name.slice(0, leftBrace)
    }
    var sizeAndId = program.uniformSizeAndIdsByName[uniformBaseName];
    if (sizeAndId && arrayIndex < sizeAndId[0]) {
      arrayIndex += sizeAndId[1];
      if (uniformLocsById[arrayIndex] = uniformLocsById[arrayIndex] || GLctx.getUniformLocation(program, name)) {
        return arrayIndex
      }
    }
  } else {
    GL.recordError(1281)
  }
  return -1
}
var _emscripten_glGetUniformLocation = _glGetUniformLocation;
function webglGetUniformLocation(location) {
  var p = GLctx.currentProgram;
  if (p) {
    var webglLoc = p.uniformLocsById[location];
    if (typeof webglLoc == "number") {
      p.uniformLocsById[location] = webglLoc = GLctx.getUniformLocation(p, p.uniformArrayNamesById[location] + (webglLoc > 0 ? "[" + webglLoc + "]" : ""))
    }
    return webglLoc
  } else {
    GL.recordError(1282)
  }
}
function emscriptenWebGLGetUniform(program, location, params, type) {
  if (!params) {
    GL.recordError(1281);
    return
  }
  program = GL.programs[program];
  webglPrepareUniformLocationsBeforeFirstUse(program);
  var data = GLctx.getUniform(program, webglGetUniformLocation(location));
  if (typeof data == "number" || typeof data == "boolean") {
    switch (type) {
    case 0:
      GROWABLE_HEAP_I32()[params >> 2] = data;
      break;
    case 2:
      GROWABLE_HEAP_F32()[params >> 2] = data;
      break
    }
  } else {
    for (var i = 0; i < data.length; i++) {
      switch (type) {
      case 0:
        GROWABLE_HEAP_I32()[params + i * 4 >> 2] = data[i];
        break;
      case 2:
        GROWABLE_HEAP_F32()[params + i * 4 >> 2] = data[i];
        break
      }
    }
  }
}
function _glGetUniformfv(program, location, params) {
  emscriptenWebGLGetUniform(program, location, params, 2)
}
var _emscripten_glGetUniformfv = _glGetUniformfv;
function _glGetUniformiv(program, location, params) {
  emscriptenWebGLGetUniform(program, location, params, 0)
}
var _emscripten_glGetUniformiv = _glGetUniformiv;
function _glGetUniformuiv(program, location, params) {
  emscriptenWebGLGetUniform(program, location, params, 0)
}
var _emscripten_glGetUniformuiv = _glGetUniformuiv;
function emscriptenWebGLGetVertexAttrib(index, pname, params, type) {
  if (!params) {
    GL.recordError(1281);
    return
  }
  var data = GLctx.getVertexAttrib(index, pname);
  if (pname == 34975) {
    GROWABLE_HEAP_I32()[params >> 2] = data && data["name"]
  } else if (typeof data == "number" || typeof data == "boolean") {
    switch (type) {
    case 0:
      GROWABLE_HEAP_I32()[params >> 2] = data;
      break;
    case 2:
      GROWABLE_HEAP_F32()[params >> 2] = data;
      break;
    case 5:
      GROWABLE_HEAP_I32()[params >> 2] = Math.fround(data);
      break
    }
  } else {
    for (var i = 0; i < data.length; i++) {
      switch (type) {
      case 0:
        GROWABLE_HEAP_I32()[params + i * 4 >> 2] = data[i];
        break;
      case 2:
        GROWABLE_HEAP_F32()[params + i * 4 >> 2] = data[i];
        break;
      case 5:
        GROWABLE_HEAP_I32()[params + i * 4 >> 2] = Math.fround(data[i]);
        break
      }
    }
  }
}
function _glGetVertexAttribIiv(index, pname, params) {
  emscriptenWebGLGetVertexAttrib(index, pname, params, 0)
}
var _emscripten_glGetVertexAttribIiv = _glGetVertexAttribIiv;
var _glGetVertexAttribIuiv = _glGetVertexAttribIiv;
var _emscripten_glGetVertexAttribIuiv = _glGetVertexAttribIuiv;
function _glGetVertexAttribPointerv(index, pname, pointer) {
  if (!pointer) {
    GL.recordError(1281);
    return
  }
  GROWABLE_HEAP_I32()[pointer >> 2] = GLctx.getVertexAttribOffset(index, pname)
}
var _emscripten_glGetVertexAttribPointerv = _glGetVertexAttribPointerv;
function _glGetVertexAttribfv(index, pname, params) {
  emscriptenWebGLGetVertexAttrib(index, pname, params, 2)
}
var _emscripten_glGetVertexAttribfv = _glGetVertexAttribfv;
function _glGetVertexAttribiv(index, pname, params) {
  emscriptenWebGLGetVertexAttrib(index, pname, params, 5)
}
var _emscripten_glGetVertexAttribiv = _glGetVertexAttribiv;
function _glHint(x0, x1) {
  GLctx["hint"](x0, x1)
}
var _emscripten_glHint = _glHint;
function _glInvalidateFramebuffer(target, numAttachments, attachments) {
  var list = tempFixedLengthArray[numAttachments];
  for (var i = 0; i < numAttachments; i++) {
    list[i] = GROWABLE_HEAP_I32()[attachments + i * 4 >> 2]
  }
  GLctx["invalidateFramebuffer"](target, list)
}
var _emscripten_glInvalidateFramebuffer = _glInvalidateFramebuffer;
function _glInvalidateSubFramebuffer(target, numAttachments, attachments, x, y, width, height) {
  var list = tempFixedLengthArray[numAttachments];
  for (var i = 0; i < numAttachments; i++) {
    list[i] = GROWABLE_HEAP_I32()[attachments + i * 4 >> 2]
  }
  GLctx["invalidateSubFramebuffer"](target, list, x, y, width, height)
}
var _emscripten_glInvalidateSubFramebuffer = _glInvalidateSubFramebuffer;
function _glIsBuffer(buffer) {
  var b = GL.buffers[buffer];
  if (!b)
    return 0;
  return GLctx.isBuffer(b)
}
var _emscripten_glIsBuffer = _glIsBuffer;
function _glIsEnabled(x0) {
  return GLctx["isEnabled"](x0)
}
var _emscripten_glIsEnabled = _glIsEnabled;
function _glIsFramebuffer(framebuffer) {
  var fb = GL.framebuffers[framebuffer];
  if (!fb)
    return 0;
  return GLctx.isFramebuffer(fb)
}
var _emscripten_glIsFramebuffer = _glIsFramebuffer;
function _glIsProgram(program) {
  program = GL.programs[program];
  if (!program)
    return 0;
  return GLctx.isProgram(program)
}
var _emscripten_glIsProgram = _glIsProgram;
function _glIsQuery(id) {
  var query = GL.queries[id];
  if (!query)
    return 0;
  return GLctx["isQuery"](query)
}
var _emscripten_glIsQuery = _glIsQuery;
function _glIsQueryEXT(id) {
  var query = GL.queries[id];
  if (!query)
    return 0;
  return GLctx.disjointTimerQueryExt["isQueryEXT"](query)
}
var _emscripten_glIsQueryEXT = _glIsQueryEXT;
function _glIsRenderbuffer(renderbuffer) {
  var rb = GL.renderbuffers[renderbuffer];
  if (!rb)
    return 0;
  return GLctx.isRenderbuffer(rb)
}
var _emscripten_glIsRenderbuffer = _glIsRenderbuffer;
function _glIsSampler(id) {
  var sampler = GL.samplers[id];
  if (!sampler)
    return 0;
  return GLctx["isSampler"](sampler)
}
var _emscripten_glIsSampler = _glIsSampler;
function _glIsShader(shader) {
  var s = GL.shaders[shader];
  if (!s)
    return 0;
  return GLctx.isShader(s)
}
var _emscripten_glIsShader = _glIsShader;
function _glIsSync(sync) {
  return GLctx.isSync(GL.syncs[sync])
}
var _emscripten_glIsSync = _glIsSync;
function _glIsTexture(id) {
  var texture = GL.textures[id];
  if (!texture)
    return 0;
  return GLctx.isTexture(texture)
}
var _emscripten_glIsTexture = _glIsTexture;
function _glIsTransformFeedback(id) {
  return GLctx["isTransformFeedback"](GL.transformFeedbacks[id])
}
var _emscripten_glIsTransformFeedback = _glIsTransformFeedback;
function _glIsVertexArray(array) {
  var vao = GL.vaos[array];
  if (!vao)
    return 0;
  return GLctx["isVertexArray"](vao)
}
var _emscripten_glIsVertexArray = _glIsVertexArray;
var _glIsVertexArrayOES = _glIsVertexArray;
var _emscripten_glIsVertexArrayOES = _glIsVertexArrayOES;
function _glLineWidth(x0) {
  GLctx["lineWidth"](x0)
}
var _emscripten_glLineWidth = _glLineWidth;
function _glLinkProgram(program) {
  program = GL.programs[program];
  GLctx.linkProgram(program);
  program.uniformLocsById = 0;
  program.uniformSizeAndIdsByName = {}
}
var _emscripten_glLinkProgram = _glLinkProgram;
function _glPauseTransformFeedback() {
  GLctx["pauseTransformFeedback"]()
}
var _emscripten_glPauseTransformFeedback = _glPauseTransformFeedback;
function _glPixelStorei(pname, param) {
  if (pname == 3317) {
    GL.unpackAlignment = param
  }
  GLctx.pixelStorei(pname, param)
}
var _emscripten_glPixelStorei = _glPixelStorei;
function _glPolygonOffset(x0, x1) {
  GLctx["polygonOffset"](x0, x1)
}
var _emscripten_glPolygonOffset = _glPolygonOffset;
function _glProgramBinary(program, binaryFormat, binary, length) {
  GL.recordError(1280)
}
var _emscripten_glProgramBinary = _glProgramBinary;
function _glProgramParameteri(program, pname, value) {
  GL.recordError(1280)
}
var _emscripten_glProgramParameteri = _glProgramParameteri;
function _glQueryCounterEXT(id, target) {
  GLctx.disjointTimerQueryExt["queryCounterEXT"](GL.queries[id], target)
}
var _emscripten_glQueryCounterEXT = _glQueryCounterEXT;
function _glReadBuffer(x0) {
  GLctx["readBuffer"](x0)
}
var _emscripten_glReadBuffer = _glReadBuffer;
function computeUnpackAlignedImageSize(width, height, sizePerPixel, alignment) {
  function roundedToNextMultipleOf(x, y) {
    return x + y - 1 & -y
  }
  var plainRowSize = width * sizePerPixel;
  var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
  return height * alignedRowSize
}
function colorChannelsInGlTextureFormat(format) {
  var colorChannels = {
    5: 3,
    6: 4,
    8: 2,
    29502: 3,
    29504: 4,
    26917: 2,
    26918: 2,
    29846: 3,
    29847: 4
  };
  return colorChannels[format - 6402] || 1
}
function heapObjectForWebGLType(type) {
  type -= 5120;
  if (type == 0)
    return GROWABLE_HEAP_I8();
  if (type == 1)
    return GROWABLE_HEAP_U8();
  if (type == 2)
    return GROWABLE_HEAP_I16();
  if (type == 4)
    return GROWABLE_HEAP_I32();
  if (type == 6)
    return GROWABLE_HEAP_F32();
  if (type == 5 || type == 28922 || type == 28520 || type == 30779 || type == 30782)
    return GROWABLE_HEAP_U32();
  return GROWABLE_HEAP_U16()
}
function heapAccessShiftForWebGLHeap(heap) {
  return 31 - Math.clz32(heap.BYTES_PER_ELEMENT)
}
function emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) {
  var heap = heapObjectForWebGLType(type);
  var shift = heapAccessShiftForWebGLHeap(heap);
  var byteSize = 1 << shift;
  var sizePerPixel = colorChannelsInGlTextureFormat(format) * byteSize;
  var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel, GL.unpackAlignment);
  return heap.subarray(pixels >> shift, pixels + bytes >> shift)
}
function _glReadPixels(x, y, width, height, format, type, pixels) {
  if (GL.currentContext.version >= 2) {
    if (GLctx.currentPixelPackBufferBinding) {
      GLctx.readPixels(x, y, width, height, format, type, pixels)
    } else {
      var heap = heapObjectForWebGLType(type);
      GLctx.readPixels(x, y, width, height, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap))
    }
    return
  }
  var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
  if (!pixelData) {
    GL.recordError(1280);
    return
  }
  GLctx.readPixels(x, y, width, height, format, type, pixelData)
}
var _emscripten_glReadPixels = _glReadPixels;
function _glReleaseShaderCompiler() {}
var _emscripten_glReleaseShaderCompiler = _glReleaseShaderCompiler;
function _glRenderbufferStorage(x0, x1, x2, x3) {
  GLctx["renderbufferStorage"](x0, x1, x2, x3)
}
var _emscripten_glRenderbufferStorage = _glRenderbufferStorage;
function _glRenderbufferStorageMultisample(x0, x1, x2, x3, x4) {
  GLctx["renderbufferStorageMultisample"](x0, x1, x2, x3, x4)
}
var _emscripten_glRenderbufferStorageMultisample = _glRenderbufferStorageMultisample;
function _glResumeTransformFeedback() {
  GLctx["resumeTransformFeedback"]()
}
var _emscripten_glResumeTransformFeedback = _glResumeTransformFeedback;
function _glSampleCoverage(value, invert) {
  GLctx.sampleCoverage(value, !!invert)
}
var _emscripten_glSampleCoverage = _glSampleCoverage;
function _glSamplerParameterf(sampler, pname, param) {
  GLctx["samplerParameterf"](GL.samplers[sampler], pname, param)
}
var _emscripten_glSamplerParameterf = _glSamplerParameterf;
function _glSamplerParameterfv(sampler, pname, params) {
  var param = GROWABLE_HEAP_F32()[params >> 2];
  GLctx["samplerParameterf"](GL.samplers[sampler], pname, param)
}
var _emscripten_glSamplerParameterfv = _glSamplerParameterfv;
function _glSamplerParameteri(sampler, pname, param) {
  GLctx["samplerParameteri"](GL.samplers[sampler], pname, param)
}
var _emscripten_glSamplerParameteri = _glSamplerParameteri;
function _glSamplerParameteriv(sampler, pname, params) {
  var param = GROWABLE_HEAP_I32()[params >> 2];
  GLctx["samplerParameteri"](GL.samplers[sampler], pname, param)
}
var _emscripten_glSamplerParameteriv = _glSamplerParameteriv;
function _glScissor(x0, x1, x2, x3) {
  GLctx["scissor"](x0, x1, x2, x3)
}
var _emscripten_glScissor = _glScissor;
function _glShaderBinary(count, shaders, binaryformat, binary, length) {
  GL.recordError(1280)
}
var _emscripten_glShaderBinary = _glShaderBinary;
function _glShaderSource(shader, count, string, length) {
  var source = GL.getSource(shader, count, string, length);
  GLctx.shaderSource(GL.shaders[shader], source)
}
var _emscripten_glShaderSource = _glShaderSource;
function _glStencilFunc(x0, x1, x2) {
  GLctx["stencilFunc"](x0, x1, x2)
}
var _emscripten_glStencilFunc = _glStencilFunc;
function _glStencilFuncSeparate(x0, x1, x2, x3) {
  GLctx["stencilFuncSeparate"](x0, x1, x2, x3)
}
var _emscripten_glStencilFuncSeparate = _glStencilFuncSeparate;
function _glStencilMask(x0) {
  GLctx["stencilMask"](x0)
}
var _emscripten_glStencilMask = _glStencilMask;
function _glStencilMaskSeparate(x0, x1) {
  GLctx["stencilMaskSeparate"](x0, x1)
}
var _emscripten_glStencilMaskSeparate = _glStencilMaskSeparate;
function _glStencilOp(x0, x1, x2) {
  GLctx["stencilOp"](x0, x1, x2)
}
var _emscripten_glStencilOp = _glStencilOp;
function _glStencilOpSeparate(x0, x1, x2, x3) {
  GLctx["stencilOpSeparate"](x0, x1, x2, x3)
}
var _emscripten_glStencilOpSeparate = _glStencilOpSeparate;
function _glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
  if (GL.currentContext.version >= 2) {
    if (GLctx.currentPixelUnpackBufferBinding) {
      GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels)
    } else if (pixels) {
      var heap = heapObjectForWebGLType(type);
      GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap))
    } else {
      GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, null)
    }
    return
  }
  GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null)
}
var _emscripten_glTexImage2D = _glTexImage2D;
function _glTexImage3D(target, level, internalFormat, width, height, depth, border, format, type, pixels) {
  if (GLctx.currentPixelUnpackBufferBinding) {
    GLctx["texImage3D"](target, level, internalFormat, width, height, depth, border, format, type, pixels)
  } else if (pixels) {
    var heap = heapObjectForWebGLType(type);
    GLctx["texImage3D"](target, level, internalFormat, width, height, depth, border, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap))
  } else {
    GLctx["texImage3D"](target, level, internalFormat, width, height, depth, border, format, type, null)
  }
}
var _emscripten_glTexImage3D = _glTexImage3D;
function _glTexParameterf(x0, x1, x2) {
  GLctx["texParameterf"](x0, x1, x2)
}
var _emscripten_glTexParameterf = _glTexParameterf;
function _glTexParameterfv(target, pname, params) {
  var param = GROWABLE_HEAP_F32()[params >> 2];
  GLctx.texParameterf(target, pname, param)
}
var _emscripten_glTexParameterfv = _glTexParameterfv;
function _glTexParameteri(x0, x1, x2) {
  GLctx["texParameteri"](x0, x1, x2)
}
var _emscripten_glTexParameteri = _glTexParameteri;
function _glTexParameteriv(target, pname, params) {
  var param = GROWABLE_HEAP_I32()[params >> 2];
  GLctx.texParameteri(target, pname, param)
}
var _emscripten_glTexParameteriv = _glTexParameteriv;
function _glTexStorage2D(x0, x1, x2, x3, x4) {
  GLctx["texStorage2D"](x0, x1, x2, x3, x4)
}
var _emscripten_glTexStorage2D = _glTexStorage2D;
function _glTexStorage3D(x0, x1, x2, x3, x4, x5) {
  GLctx["texStorage3D"](x0, x1, x2, x3, x4, x5)
}
var _emscripten_glTexStorage3D = _glTexStorage3D;
function _glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels) {
  if (GL.currentContext.version >= 2) {
    if (GLctx.currentPixelUnpackBufferBinding) {
      GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels)
    } else if (pixels) {
      var heap = heapObjectForWebGLType(type);
      GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap))
    } else {
      GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, null)
    }
    return
  }
  var pixelData = null;
  if (pixels)
    pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0);
  GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData)
}
var _emscripten_glTexSubImage2D = _glTexSubImage2D;
function _glTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, pixels) {
  if (GLctx.currentPixelUnpackBufferBinding) {
    GLctx["texSubImage3D"](target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, pixels)
  } else if (pixels) {
    var heap = heapObjectForWebGLType(type);
    GLctx["texSubImage3D"](target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap))
  } else {
    GLctx["texSubImage3D"](target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, null)
  }
}
var _emscripten_glTexSubImage3D = _glTexSubImage3D;
function _glTransformFeedbackVaryings(program, count, varyings, bufferMode) {
  program = GL.programs[program];
  var vars = [];
  for (var i = 0; i < count; i++)
    vars.push(UTF8ToString(GROWABLE_HEAP_I32()[varyings + i * 4 >> 2]));
  GLctx["transformFeedbackVaryings"](program, vars, bufferMode)
}
var _emscripten_glTransformFeedbackVaryings = _glTransformFeedbackVaryings;
function _glUniform1f(location, v0) {
  GLctx.uniform1f(webglGetUniformLocation(location), v0)
}
var _emscripten_glUniform1f = _glUniform1f;
var miniTempWebGLFloatBuffers = [];
function _glUniform1fv(location, count, value) {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniform1fv(webglGetUniformLocation(location), GROWABLE_HEAP_F32(), value >> 2, count);
    return
  }
  if (count <= 288) {
    var view = miniTempWebGLFloatBuffers[count - 1];
    for (var i = 0; i < count; ++i) {
      view[i] = GROWABLE_HEAP_F32()[value + 4 * i >> 2]
    }
  } else {
    var view = GROWABLE_HEAP_F32().subarray(value >> 2, value + count * 4 >> 2)
  }
  GLctx.uniform1fv(webglGetUniformLocation(location), view)
}
var _emscripten_glUniform1fv = _glUniform1fv;
function _glUniform1i(location, v0) {
  GLctx.uniform1i(webglGetUniformLocation(location), v0)
}
var _emscripten_glUniform1i = _glUniform1i;
var miniTempWebGLIntBuffers = [];
function _glUniform1iv(location, count, value) {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniform1iv(webglGetUniformLocation(location), GROWABLE_HEAP_I32(), value >> 2, count);
    return
  }
  if (count <= 288) {
    var view = miniTempWebGLIntBuffers[count - 1];
    for (var i = 0; i < count; ++i) {
      view[i] = GROWABLE_HEAP_I32()[value + 4 * i >> 2]
    }
  } else {
    var view = GROWABLE_HEAP_I32().subarray(value >> 2, value + count * 4 >> 2)
  }
  GLctx.uniform1iv(webglGetUniformLocation(location), view)
}
var _emscripten_glUniform1iv = _glUniform1iv;
function _glUniform1ui(location, v0) {
  GLctx.uniform1ui(webglGetUniformLocation(location), v0)
}
var _emscripten_glUniform1ui = _glUniform1ui;
function _glUniform1uiv(location, count, value) {
  count && GLctx.uniform1uiv(webglGetUniformLocation(location), GROWABLE_HEAP_U32(), value >> 2, count)
}
var _emscripten_glUniform1uiv = _glUniform1uiv;
function _glUniform2f(location, v0, v1) {
  GLctx.uniform2f(webglGetUniformLocation(location), v0, v1)
}
var _emscripten_glUniform2f = _glUniform2f;
function _glUniform2fv(location, count, value) {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniform2fv(webglGetUniformLocation(location), GROWABLE_HEAP_F32(), value >> 2, count * 2);
    return
  }
  if (count <= 144) {
    var view = miniTempWebGLFloatBuffers[2 * count - 1];
    for (var i = 0; i < 2 * count; i += 2) {
      view[i] = GROWABLE_HEAP_F32()[value + 4 * i >> 2];
      view[i + 1] = GROWABLE_HEAP_F32()[value + (4 * i + 4) >> 2]
    }
  } else {
    var view = GROWABLE_HEAP_F32().subarray(value >> 2, value + count * 8 >> 2)
  }
  GLctx.uniform2fv(webglGetUniformLocation(location), view)
}
var _emscripten_glUniform2fv = _glUniform2fv;
function _glUniform2i(location, v0, v1) {
  GLctx.uniform2i(webglGetUniformLocation(location), v0, v1)
}
var _emscripten_glUniform2i = _glUniform2i;
function _glUniform2iv(location, count, value) {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniform2iv(webglGetUniformLocation(location), GROWABLE_HEAP_I32(), value >> 2, count * 2);
    return
  }
  if (count <= 144) {
    var view = miniTempWebGLIntBuffers[2 * count - 1];
    for (var i = 0; i < 2 * count; i += 2) {
      view[i] = GROWABLE_HEAP_I32()[value + 4 * i >> 2];
      view[i + 1] = GROWABLE_HEAP_I32()[value + (4 * i + 4) >> 2]
    }
  } else {
    var view = GROWABLE_HEAP_I32().subarray(value >> 2, value + count * 8 >> 2)
  }
  GLctx.uniform2iv(webglGetUniformLocation(location), view)
}
var _emscripten_glUniform2iv = _glUniform2iv;
function _glUniform2ui(location, v0, v1) {
  GLctx.uniform2ui(webglGetUniformLocation(location), v0, v1)
}
var _emscripten_glUniform2ui = _glUniform2ui;
function _glUniform2uiv(location, count, value) {
  count && GLctx.uniform2uiv(webglGetUniformLocation(location), GROWABLE_HEAP_U32(), value >> 2, count * 2)
}
var _emscripten_glUniform2uiv = _glUniform2uiv;
function _glUniform3f(location, v0, v1, v2) {
  GLctx.uniform3f(webglGetUniformLocation(location), v0, v1, v2)
}
var _emscripten_glUniform3f = _glUniform3f;
function _glUniform3fv(location, count, value) {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniform3fv(webglGetUniformLocation(location), GROWABLE_HEAP_F32(), value >> 2, count * 3);
    return
  }
  if (count <= 96) {
    var view = miniTempWebGLFloatBuffers[3 * count - 1];
    for (var i = 0; i < 3 * count; i += 3) {
      view[i] = GROWABLE_HEAP_F32()[value + 4 * i >> 2];
      view[i + 1] = GROWABLE_HEAP_F32()[value + (4 * i + 4) >> 2];
      view[i + 2] = GROWABLE_HEAP_F32()[value + (4 * i + 8) >> 2]
    }
  } else {
    var view = GROWABLE_HEAP_F32().subarray(value >> 2, value + count * 12 >> 2)
  }
  GLctx.uniform3fv(webglGetUniformLocation(location), view)
}
var _emscripten_glUniform3fv = _glUniform3fv;
function _glUniform3i(location, v0, v1, v2) {
  GLctx.uniform3i(webglGetUniformLocation(location), v0, v1, v2)
}
var _emscripten_glUniform3i = _glUniform3i;
function _glUniform3iv(location, count, value) {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniform3iv(webglGetUniformLocation(location), GROWABLE_HEAP_I32(), value >> 2, count * 3);
    return
  }
  if (count <= 96) {
    var view = miniTempWebGLIntBuffers[3 * count - 1];
    for (var i = 0; i < 3 * count; i += 3) {
      view[i] = GROWABLE_HEAP_I32()[value + 4 * i >> 2];
      view[i + 1] = GROWABLE_HEAP_I32()[value + (4 * i + 4) >> 2];
      view[i + 2] = GROWABLE_HEAP_I32()[value + (4 * i + 8) >> 2]
    }
  } else {
    var view = GROWABLE_HEAP_I32().subarray(value >> 2, value + count * 12 >> 2)
  }
  GLctx.uniform3iv(webglGetUniformLocation(location), view)
}
var _emscripten_glUniform3iv = _glUniform3iv;
function _glUniform3ui(location, v0, v1, v2) {
  GLctx.uniform3ui(webglGetUniformLocation(location), v0, v1, v2)
}
var _emscripten_glUniform3ui = _glUniform3ui;
function _glUniform3uiv(location, count, value) {
  count && GLctx.uniform3uiv(webglGetUniformLocation(location), GROWABLE_HEAP_U32(), value >> 2, count * 3)
}
var _emscripten_glUniform3uiv = _glUniform3uiv;
function _glUniform4f(location, v0, v1, v2, v3) {
  GLctx.uniform4f(webglGetUniformLocation(location), v0, v1, v2, v3)
}
var _emscripten_glUniform4f = _glUniform4f;
function _glUniform4fv(location, count, value) {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniform4fv(webglGetUniformLocation(location), GROWABLE_HEAP_F32(), value >> 2, count * 4);
    return
  }
  if (count <= 72) {
    var view = miniTempWebGLFloatBuffers[4 * count - 1];
    var heap = GROWABLE_HEAP_F32();
    value >>= 2;
    for (var i = 0; i < 4 * count; i += 4) {
      var dst = value + i;
      view[i] = heap[dst];
      view[i + 1] = heap[dst + 1];
      view[i + 2] = heap[dst + 2];
      view[i + 3] = heap[dst + 3]
    }
  } else {
    var view = GROWABLE_HEAP_F32().subarray(value >> 2, value + count * 16 >> 2)
  }
  GLctx.uniform4fv(webglGetUniformLocation(location), view)
}
var _emscripten_glUniform4fv = _glUniform4fv;
function _glUniform4i(location, v0, v1, v2, v3) {
  GLctx.uniform4i(webglGetUniformLocation(location), v0, v1, v2, v3)
}
var _emscripten_glUniform4i = _glUniform4i;
function _glUniform4iv(location, count, value) {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniform4iv(webglGetUniformLocation(location), GROWABLE_HEAP_I32(), value >> 2, count * 4);
    return
  }
  if (count <= 72) {
    var view = miniTempWebGLIntBuffers[4 * count - 1];
    for (var i = 0; i < 4 * count; i += 4) {
      view[i] = GROWABLE_HEAP_I32()[value + 4 * i >> 2];
      view[i + 1] = GROWABLE_HEAP_I32()[value + (4 * i + 4) >> 2];
      view[i + 2] = GROWABLE_HEAP_I32()[value + (4 * i + 8) >> 2];
      view[i + 3] = GROWABLE_HEAP_I32()[value + (4 * i + 12) >> 2]
    }
  } else {
    var view = GROWABLE_HEAP_I32().subarray(value >> 2, value + count * 16 >> 2)
  }
  GLctx.uniform4iv(webglGetUniformLocation(location), view)
}
var _emscripten_glUniform4iv = _glUniform4iv;
function _glUniform4ui(location, v0, v1, v2, v3) {
  GLctx.uniform4ui(webglGetUniformLocation(location), v0, v1, v2, v3)
}
var _emscripten_glUniform4ui = _glUniform4ui;
function _glUniform4uiv(location, count, value) {
  count && GLctx.uniform4uiv(webglGetUniformLocation(location), GROWABLE_HEAP_U32(), value >> 2, count * 4)
}
var _emscripten_glUniform4uiv = _glUniform4uiv;
function _glUniformBlockBinding(program, uniformBlockIndex, uniformBlockBinding) {
  program = GL.programs[program];
  GLctx["uniformBlockBinding"](program, uniformBlockIndex, uniformBlockBinding)
}
var _emscripten_glUniformBlockBinding = _glUniformBlockBinding;
function _glUniformMatrix2fv(location, count, transpose, value) {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniformMatrix2fv(webglGetUniformLocation(location), !!transpose, GROWABLE_HEAP_F32(), value >> 2, count * 4);
    return
  }
  if (count <= 72) {
    var view = miniTempWebGLFloatBuffers[4 * count - 1];
    for (var i = 0; i < 4 * count; i += 4) {
      view[i] = GROWABLE_HEAP_F32()[value + 4 * i >> 2];
      view[i + 1] = GROWABLE_HEAP_F32()[value + (4 * i + 4) >> 2];
      view[i + 2] = GROWABLE_HEAP_F32()[value + (4 * i + 8) >> 2];
      view[i + 3] = GROWABLE_HEAP_F32()[value + (4 * i + 12) >> 2]
    }
  } else {
    var view = GROWABLE_HEAP_F32().subarray(value >> 2, value + count * 16 >> 2)
  }
  GLctx.uniformMatrix2fv(webglGetUniformLocation(location), !!transpose, view)
}
var _emscripten_glUniformMatrix2fv = _glUniformMatrix2fv;
function _glUniformMatrix2x3fv(location, count, transpose, value) {
  count && GLctx.uniformMatrix2x3fv(webglGetUniformLocation(location), !!transpose, GROWABLE_HEAP_F32(), value >> 2, count * 6)
}
var _emscripten_glUniformMatrix2x3fv = _glUniformMatrix2x3fv;
function _glUniformMatrix2x4fv(location, count, transpose, value) {
  count && GLctx.uniformMatrix2x4fv(webglGetUniformLocation(location), !!transpose, GROWABLE_HEAP_F32(), value >> 2, count * 8)
}
var _emscripten_glUniformMatrix2x4fv = _glUniformMatrix2x4fv;
function _glUniformMatrix3fv(location, count, transpose, value) {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniformMatrix3fv(webglGetUniformLocation(location), !!transpose, GROWABLE_HEAP_F32(), value >> 2, count * 9);
    return
  }
  if (count <= 32) {
    var view = miniTempWebGLFloatBuffers[9 * count - 1];
    for (var i = 0; i < 9 * count; i += 9) {
      view[i] = GROWABLE_HEAP_F32()[value + 4 * i >> 2];
      view[i + 1] = GROWABLE_HEAP_F32()[value + (4 * i + 4) >> 2];
      view[i + 2] = GROWABLE_HEAP_F32()[value + (4 * i + 8) >> 2];
      view[i + 3] = GROWABLE_HEAP_F32()[value + (4 * i + 12) >> 2];
      view[i + 4] = GROWABLE_HEAP_F32()[value + (4 * i + 16) >> 2];
      view[i + 5] = GROWABLE_HEAP_F32()[value + (4 * i + 20) >> 2];
      view[i + 6] = GROWABLE_HEAP_F32()[value + (4 * i + 24) >> 2];
      view[i + 7] = GROWABLE_HEAP_F32()[value + (4 * i + 28) >> 2];
      view[i + 8] = GROWABLE_HEAP_F32()[value + (4 * i + 32) >> 2]
    }
  } else {
    var view = GROWABLE_HEAP_F32().subarray(value >> 2, value + count * 36 >> 2)
  }
  GLctx.uniformMatrix3fv(webglGetUniformLocation(location), !!transpose, view)
}
var _emscripten_glUniformMatrix3fv = _glUniformMatrix3fv;
function _glUniformMatrix3x2fv(location, count, transpose, value) {
  count && GLctx.uniformMatrix3x2fv(webglGetUniformLocation(location), !!transpose, GROWABLE_HEAP_F32(), value >> 2, count * 6)
}
var _emscripten_glUniformMatrix3x2fv = _glUniformMatrix3x2fv;
function _glUniformMatrix3x4fv(location, count, transpose, value) {
  count && GLctx.uniformMatrix3x4fv(webglGetUniformLocation(location), !!transpose, GROWABLE_HEAP_F32(), value >> 2, count * 12)
}
var _emscripten_glUniformMatrix3x4fv = _glUniformMatrix3x4fv;
function _glUniformMatrix4fv(location, count, transpose, value) {
  if (GL.currentContext.version >= 2) {
    count && GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, GROWABLE_HEAP_F32(), value >> 2, count * 16);
    return
  }
  if (count <= 18) {
    var view = miniTempWebGLFloatBuffers[16 * count - 1];
    var heap = GROWABLE_HEAP_F32();
    value >>= 2;
    for (var i = 0; i < 16 * count; i += 16) {
      var dst = value + i;
      view[i] = heap[dst];
      view[i + 1] = heap[dst + 1];
      view[i + 2] = heap[dst + 2];
      view[i + 3] = heap[dst + 3];
      view[i + 4] = heap[dst + 4];
      view[i + 5] = heap[dst + 5];
      view[i + 6] = heap[dst + 6];
      view[i + 7] = heap[dst + 7];
      view[i + 8] = heap[dst + 8];
      view[i + 9] = heap[dst + 9];
      view[i + 10] = heap[dst + 10];
      view[i + 11] = heap[dst + 11];
      view[i + 12] = heap[dst + 12];
      view[i + 13] = heap[dst + 13];
      view[i + 14] = heap[dst + 14];
      view[i + 15] = heap[dst + 15]
    }
  } else {
    var view = GROWABLE_HEAP_F32().subarray(value >> 2, value + count * 64 >> 2)
  }
  GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, view)
}
var _emscripten_glUniformMatrix4fv = _glUniformMatrix4fv;
function _glUniformMatrix4x2fv(location, count, transpose, value) {
  count && GLctx.uniformMatrix4x2fv(webglGetUniformLocation(location), !!transpose, GROWABLE_HEAP_F32(), value >> 2, count * 8)
}
var _emscripten_glUniformMatrix4x2fv = _glUniformMatrix4x2fv;
function _glUniformMatrix4x3fv(location, count, transpose, value) {
  count && GLctx.uniformMatrix4x3fv(webglGetUniformLocation(location), !!transpose, GROWABLE_HEAP_F32(), value >> 2, count * 12)
}
var _emscripten_glUniformMatrix4x3fv = _glUniformMatrix4x3fv;
function _glUseProgram(program) {
  program = GL.programs[program];
  GLctx.useProgram(program);
  GLctx.currentProgram = program
}
var _emscripten_glUseProgram = _glUseProgram;
function _glValidateProgram(program) {
  GLctx.validateProgram(GL.programs[program])
}
var _emscripten_glValidateProgram = _glValidateProgram;
function _glVertexAttrib1f(x0, x1) {
  GLctx["vertexAttrib1f"](x0, x1)
}
var _emscripten_glVertexAttrib1f = _glVertexAttrib1f;
function _glVertexAttrib1fv(index, v) {
  GLctx.vertexAttrib1f(index, GROWABLE_HEAP_F32()[v >> 2])
}
var _emscripten_glVertexAttrib1fv = _glVertexAttrib1fv;
function _glVertexAttrib2f(x0, x1, x2) {
  GLctx["vertexAttrib2f"](x0, x1, x2)
}
var _emscripten_glVertexAttrib2f = _glVertexAttrib2f;
function _glVertexAttrib2fv(index, v) {
  GLctx.vertexAttrib2f(index, GROWABLE_HEAP_F32()[v >> 2], GROWABLE_HEAP_F32()[v + 4 >> 2])
}
var _emscripten_glVertexAttrib2fv = _glVertexAttrib2fv;
function _glVertexAttrib3f(x0, x1, x2, x3) {
  GLctx["vertexAttrib3f"](x0, x1, x2, x3)
}
var _emscripten_glVertexAttrib3f = _glVertexAttrib3f;
function _glVertexAttrib3fv(index, v) {
  GLctx.vertexAttrib3f(index, GROWABLE_HEAP_F32()[v >> 2], GROWABLE_HEAP_F32()[v + 4 >> 2], GROWABLE_HEAP_F32()[v + 8 >> 2])
}
var _emscripten_glVertexAttrib3fv = _glVertexAttrib3fv;
function _glVertexAttrib4f(x0, x1, x2, x3, x4) {
  GLctx["vertexAttrib4f"](x0, x1, x2, x3, x4)
}
var _emscripten_glVertexAttrib4f = _glVertexAttrib4f;
function _glVertexAttrib4fv(index, v) {
  GLctx.vertexAttrib4f(index, GROWABLE_HEAP_F32()[v >> 2], GROWABLE_HEAP_F32()[v + 4 >> 2], GROWABLE_HEAP_F32()[v + 8 >> 2], GROWABLE_HEAP_F32()[v + 12 >> 2])
}
var _emscripten_glVertexAttrib4fv = _glVertexAttrib4fv;
function _glVertexAttribDivisor(index, divisor) {
  GLctx["vertexAttribDivisor"](index, divisor)
}
var _emscripten_glVertexAttribDivisor = _glVertexAttribDivisor;
var _glVertexAttribDivisorANGLE = _glVertexAttribDivisor;
var _emscripten_glVertexAttribDivisorANGLE = _glVertexAttribDivisorANGLE;
var _glVertexAttribDivisorARB = _glVertexAttribDivisor;
var _emscripten_glVertexAttribDivisorARB = _glVertexAttribDivisorARB;
var _glVertexAttribDivisorEXT = _glVertexAttribDivisor;
var _emscripten_glVertexAttribDivisorEXT = _glVertexAttribDivisorEXT;
var _glVertexAttribDivisorNV = _glVertexAttribDivisor;
var _emscripten_glVertexAttribDivisorNV = _glVertexAttribDivisorNV;
function _glVertexAttribI4i(x0, x1, x2, x3, x4) {
  GLctx["vertexAttribI4i"](x0, x1, x2, x3, x4)
}
var _emscripten_glVertexAttribI4i = _glVertexAttribI4i;
function _glVertexAttribI4iv(index, v) {
  GLctx.vertexAttribI4i(index, GROWABLE_HEAP_I32()[v >> 2], GROWABLE_HEAP_I32()[v + 4 >> 2], GROWABLE_HEAP_I32()[v + 8 >> 2], GROWABLE_HEAP_I32()[v + 12 >> 2])
}
var _emscripten_glVertexAttribI4iv = _glVertexAttribI4iv;
function _glVertexAttribI4ui(x0, x1, x2, x3, x4) {
  GLctx["vertexAttribI4ui"](x0, x1, x2, x3, x4)
}
var _emscripten_glVertexAttribI4ui = _glVertexAttribI4ui;
function _glVertexAttribI4uiv(index, v) {
  GLctx.vertexAttribI4ui(index, GROWABLE_HEAP_U32()[v >> 2], GROWABLE_HEAP_U32()[v + 4 >> 2], GROWABLE_HEAP_U32()[v + 8 >> 2], GROWABLE_HEAP_U32()[v + 12 >> 2])
}
var _emscripten_glVertexAttribI4uiv = _glVertexAttribI4uiv;
function _glVertexAttribIPointer(index, size, type, stride, ptr) {
  GLctx["vertexAttribIPointer"](index, size, type, stride, ptr)
}
var _emscripten_glVertexAttribIPointer = _glVertexAttribIPointer;
function _glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
  GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr)
}
var _emscripten_glVertexAttribPointer = _glVertexAttribPointer;
function _glViewport(x0, x1, x2, x3) {
  GLctx["viewport"](x0, x1, x2, x3)
}
var _emscripten_glViewport = _glViewport;
function _glWaitSync(sync, flags, timeout_low, timeout_high) {
  var timeout = convertI32PairToI53(timeout_low, timeout_high);
  GLctx.waitSync(GL.syncs[sync], flags, timeout)
}
var _emscripten_glWaitSync = _glWaitSync;
function _emscripten_memcpy_big(dest, src, num) {
  GROWABLE_HEAP_U8().copyWithin(dest, src, src + num)
}
function _emscripten_num_logical_cores() {
  if (ENVIRONMENT_IS_NODE)
    return require("os").cpus().length;
  return navigator["hardwareConcurrency"]
}
function _emscripten_pc_get_function(pc) {
  abort("Cannot use emscripten_pc_get_function without -sUSE_OFFSET_CONVERTER")
}
var emscripten_receive_on_main_thread_js_callArgs = [];
function _emscripten_receive_on_main_thread_js(index, numCallArgs, args) {
  emscripten_receive_on_main_thread_js_callArgs.length = numCallArgs;
  var b = args >> 3;
  for (var i = 0; i < numCallArgs; i++) {
    emscripten_receive_on_main_thread_js_callArgs[i] = GROWABLE_HEAP_F64()[b + i]
  }
  var isEmAsmConst = index < 0;
  var func = !isEmAsmConst ? proxiedFunctionTable[index] : ASM_CONSTS[-index - 1];
  return func.apply(null, emscripten_receive_on_main_thread_js_callArgs)
}
var specialHTMLTargets = [0, typeof document != "undefined" ? document : 0, typeof window != "undefined" ? window : 0];
function findEventTarget(target) {
  try {
    if (!target)
      return window;
    if (typeof target == "number")
      target = specialHTMLTargets[target] || UTF8ToString(target);
    if (target === "#window")
      return window;
    else if (target === "#document")
      return document;
    else if (target === "#screen")
      return screen;
    else if (target === "#canvas")
      return Module["canvas"];
    return typeof target == "string" ? document.getElementById(target) : target
  } catch (e) {
    return null
  }
}
function _emscripten_request_pointerlock(target, deferUntilInEventHandler) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(33, 1, target, deferUntilInEventHandler);
  if (!target)
    target = "#canvas";
  target = findEventTarget(target);
  if (!target)
    return -4;
  if (!target.requestPointerLock) {
    return -1
  }
  var canPerformRequests = JSEvents.canPerformEventHandlerRequests();
  if (!canPerformRequests) {
    if (deferUntilInEventHandler) {
      JSEvents.deferCall(requestPointerLock, 2, [target]);
      return 1
    }
    return -2
  }
  return requestPointerLock(target)
}
function emscripten_realloc_buffer(size) {
  var b = wasmMemory.buffer;
  try {
    wasmMemory.grow(size - b.byteLength + 65535 >>> 16);
    updateMemoryViews();
    return 1
  } catch (e) {}
}
function _emscripten_resize_heap(requestedSize) {
  var oldSize = GROWABLE_HEAP_U8().length;
  requestedSize = requestedSize >>> 0;
  if (requestedSize <= oldSize) {
    return false
  }
  var maxHeapSize = getHeapMax();
  if (requestedSize > maxHeapSize) {
    return false
  }
  let alignUp = (x,multiple)=>x + (multiple - x % multiple) % multiple;
  for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
    var overGrownHeapSize = oldSize + 134217728 / cutDown;
    var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
    var replacement = emscripten_realloc_buffer(newSize);
    if (replacement) {
      return true
    }
  }
  return false
}
function registerKeyEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
  targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
  if (!JSEvents.keyEvent)
    JSEvents.keyEvent = _malloc(176);
  var keyEventHandlerFunc = function(e) {
    var keyEventData = targetThread ? _malloc(176) : JSEvents.keyEvent;
    GROWABLE_HEAP_F64()[keyEventData >> 3] = e.timeStamp;
    var idx = keyEventData >> 2;
    GROWABLE_HEAP_I32()[idx + 2] = e.location;
    GROWABLE_HEAP_I32()[idx + 3] = e.ctrlKey;
    GROWABLE_HEAP_I32()[idx + 4] = e.shiftKey;
    GROWABLE_HEAP_I32()[idx + 5] = e.altKey;
    GROWABLE_HEAP_I32()[idx + 6] = e.metaKey;
    GROWABLE_HEAP_I32()[idx + 7] = e.repeat;
    GROWABLE_HEAP_I32()[idx + 8] = e.charCode;
    GROWABLE_HEAP_I32()[idx + 9] = e.keyCode;
    GROWABLE_HEAP_I32()[idx + 10] = e.which;
    stringToUTF8(e.key || "", keyEventData + 44, 32);
    stringToUTF8(e.code || "", keyEventData + 76, 32);
    stringToUTF8(e.char || "", keyEventData + 108, 32);
    stringToUTF8(e.locale || "", keyEventData + 140, 32);
    if (targetThread)
      JSEvents.queueEventHandlerOnThread_iiii(targetThread, callbackfunc, eventTypeId, keyEventData, userData);
    else if (getWasmTableEntry(callbackfunc)(eventTypeId, keyEventData, userData))
      e.preventDefault()
  };
  var eventHandler = {
    target: findEventTarget(target),
    allowsDeferredCalls: true,
    eventTypeString: eventTypeString,
    callbackfunc: callbackfunc,
    handlerFunc: keyEventHandlerFunc,
    useCapture: useCapture
  };
  JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_keydown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(34, 1, target, userData, useCapture, callbackfunc, targetThread);
  registerKeyEventCallback(target, userData, useCapture, callbackfunc, 2, "keydown", targetThread);
  return 0
}
function _emscripten_set_keypress_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(35, 1, target, userData, useCapture, callbackfunc, targetThread);
  registerKeyEventCallback(target, userData, useCapture, callbackfunc, 1, "keypress", targetThread);
  return 0
}
function _emscripten_set_keyup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(36, 1, target, userData, useCapture, callbackfunc, targetThread);
  registerKeyEventCallback(target, userData, useCapture, callbackfunc, 3, "keyup", targetThread);
  return 0
}
function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop) {
  var browserIterationFunc = getWasmTableEntry(func);
  setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop)
}
function _emscripten_set_main_loop_arg(func, arg, fps, simulateInfiniteLoop) {
  var browserIterationFunc = ()=>getWasmTableEntry(func)(arg);
  setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop, arg)
}
function getBoundingClientRect(e) {
  return specialHTMLTargets.indexOf(e) < 0 ? e.getBoundingClientRect() : {
    "left": 0,
    "top": 0
  }
}
function fillMouseEventData(eventStruct, e, target) {
  GROWABLE_HEAP_F64()[eventStruct >> 3] = e.timeStamp;
  var idx = eventStruct >> 2;
  GROWABLE_HEAP_I32()[idx + 2] = e.screenX;
  GROWABLE_HEAP_I32()[idx + 3] = e.screenY;
  GROWABLE_HEAP_I32()[idx + 4] = e.clientX;
  GROWABLE_HEAP_I32()[idx + 5] = e.clientY;
  GROWABLE_HEAP_I32()[idx + 6] = e.ctrlKey;
  GROWABLE_HEAP_I32()[idx + 7] = e.shiftKey;
  GROWABLE_HEAP_I32()[idx + 8] = e.altKey;
  GROWABLE_HEAP_I32()[idx + 9] = e.metaKey;
  GROWABLE_HEAP_I16()[idx * 2 + 20] = e.button;
  GROWABLE_HEAP_I16()[idx * 2 + 21] = e.buttons;
  GROWABLE_HEAP_I32()[idx + 11] = e["movementX"];
  GROWABLE_HEAP_I32()[idx + 12] = e["movementY"];
  if (Module["canvas"]) {
    var rect = getBoundingClientRect(Module["canvas"]);
    GROWABLE_HEAP_I32()[idx + 15] = e.clientX - rect.left;
    GROWABLE_HEAP_I32()[idx + 16] = e.clientY - rect.top
  } else {
    GROWABLE_HEAP_I32()[idx + 15] = 0;
    GROWABLE_HEAP_I32()[idx + 16] = 0
  }
  var rect = getBoundingClientRect(target);
  GROWABLE_HEAP_I32()[idx + 13] = e.clientX - rect.left;
  GROWABLE_HEAP_I32()[idx + 14] = e.clientY - rect.top
}
function registerMouseEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
  targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
  if (!JSEvents.mouseEvent)
    JSEvents.mouseEvent = _malloc(72);
  target = findEventTarget(target);
  var mouseEventHandlerFunc = function(e=event) {
    fillMouseEventData(JSEvents.mouseEvent, e, target);
    if (targetThread) {
      var mouseEventData = _malloc(72);
      fillMouseEventData(mouseEventData, e, target);
      JSEvents.queueEventHandlerOnThread_iiii(targetThread, callbackfunc, eventTypeId, mouseEventData, userData)
    } else if (getWasmTableEntry(callbackfunc)(eventTypeId, JSEvents.mouseEvent, userData))
      e.preventDefault()
  };
  var eventHandler = {
    target: target,
    allowsDeferredCalls: eventTypeString != "mousemove" && eventTypeString != "mouseenter" && eventTypeString != "mouseleave",
    eventTypeString: eventTypeString,
    callbackfunc: callbackfunc,
    handlerFunc: mouseEventHandlerFunc,
    useCapture: useCapture
  };
  JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_mousedown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(37, 1, target, userData, useCapture, callbackfunc, targetThread);
  registerMouseEventCallback(target, userData, useCapture, callbackfunc, 5, "mousedown", targetThread);
  return 0
}
function _emscripten_set_mouseleave_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(38, 1, target, userData, useCapture, callbackfunc, targetThread);
  registerMouseEventCallback(target, userData, useCapture, callbackfunc, 34, "mouseleave", targetThread);
  return 0
}
function _emscripten_set_mousemove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(39, 1, target, userData, useCapture, callbackfunc, targetThread);
  registerMouseEventCallback(target, userData, useCapture, callbackfunc, 8, "mousemove", targetThread);
  return 0
}
function _emscripten_set_mouseup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(40, 1, target, userData, useCapture, callbackfunc, targetThread);
  registerMouseEventCallback(target, userData, useCapture, callbackfunc, 6, "mouseup", targetThread);
  return 0
}
function registerTouchEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
  targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
  if (!JSEvents.touchEvent)
    JSEvents.touchEvent = _malloc(1696);
  target = findEventTarget(target);
  var touchEventHandlerFunc = function(e) {
    var t, touches = {}, et = e.touches;
    for (var i = 0; i < et.length; ++i) {
      t = et[i];
      t.isChanged = t.onTarget = 0;
      touches[t.identifier] = t
    }
    for (var i = 0; i < e.changedTouches.length; ++i) {
      t = e.changedTouches[i];
      t.isChanged = 1;
      touches[t.identifier] = t
    }
    for (var i = 0; i < e.targetTouches.length; ++i) {
      touches[e.targetTouches[i].identifier].onTarget = 1
    }
    var touchEvent = targetThread ? _malloc(1696) : JSEvents.touchEvent;
    GROWABLE_HEAP_F64()[touchEvent >> 3] = e.timeStamp;
    var idx = touchEvent >> 2;
    GROWABLE_HEAP_I32()[idx + 3] = e.ctrlKey;
    GROWABLE_HEAP_I32()[idx + 4] = e.shiftKey;
    GROWABLE_HEAP_I32()[idx + 5] = e.altKey;
    GROWABLE_HEAP_I32()[idx + 6] = e.metaKey;
    idx += 7;
    var canvasRect = Module["canvas"] ? getBoundingClientRect(Module["canvas"]) : undefined;
    var targetRect = getBoundingClientRect(target);
    var numTouches = 0;
    for (var i in touches) {
      t = touches[i];
      GROWABLE_HEAP_I32()[idx + 0] = t.identifier;
      GROWABLE_HEAP_I32()[idx + 1] = t.screenX;
      GROWABLE_HEAP_I32()[idx + 2] = t.screenY;
      GROWABLE_HEAP_I32()[idx + 3] = t.clientX;
      GROWABLE_HEAP_I32()[idx + 4] = t.clientY;
      GROWABLE_HEAP_I32()[idx + 5] = t.pageX;
      GROWABLE_HEAP_I32()[idx + 6] = t.pageY;
      GROWABLE_HEAP_I32()[idx + 7] = t.isChanged;
      GROWABLE_HEAP_I32()[idx + 8] = t.onTarget;
      GROWABLE_HEAP_I32()[idx + 9] = t.clientX - targetRect.left;
      GROWABLE_HEAP_I32()[idx + 10] = t.clientY - targetRect.top;
      GROWABLE_HEAP_I32()[idx + 11] = canvasRect ? t.clientX - canvasRect.left : 0;
      GROWABLE_HEAP_I32()[idx + 12] = canvasRect ? t.clientY - canvasRect.top : 0;
      idx += 13;
      if (++numTouches > 31) {
        break
      }
    }
    GROWABLE_HEAP_I32()[touchEvent + 8 >> 2] = numTouches;
    if (targetThread)
      JSEvents.queueEventHandlerOnThread_iiii(targetThread, callbackfunc, eventTypeId, touchEvent, userData);
    else if (getWasmTableEntry(callbackfunc)(eventTypeId, touchEvent, userData))
      e.preventDefault()
  };
  var eventHandler = {
    target: target,
    allowsDeferredCalls: eventTypeString == "touchstart" || eventTypeString == "touchend",
    eventTypeString: eventTypeString,
    callbackfunc: callbackfunc,
    handlerFunc: touchEventHandlerFunc,
    useCapture: useCapture
  };
  JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_touchcancel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(41, 1, target, userData, useCapture, callbackfunc, targetThread);
  registerTouchEventCallback(target, userData, useCapture, callbackfunc, 25, "touchcancel", targetThread);
  return 0
}
function _emscripten_set_touchend_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(42, 1, target, userData, useCapture, callbackfunc, targetThread);
  registerTouchEventCallback(target, userData, useCapture, callbackfunc, 23, "touchend", targetThread);
  return 0
}
function _emscripten_set_touchmove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(43, 1, target, userData, useCapture, callbackfunc, targetThread);
  registerTouchEventCallback(target, userData, useCapture, callbackfunc, 24, "touchmove", targetThread);
  return 0
}
function _emscripten_set_touchstart_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(44, 1, target, userData, useCapture, callbackfunc, targetThread);
  registerTouchEventCallback(target, userData, useCapture, callbackfunc, 22, "touchstart", targetThread);
  return 0
}
function registerWebGlEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
  targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
  if (!target)
    target = Module["canvas"];
  var webGlEventHandlerFunc = function(e=event) {
    if (targetThread)
      JSEvents.queueEventHandlerOnThread_iiii(targetThread, callbackfunc, eventTypeId, 0, userData);
    else if (getWasmTableEntry(callbackfunc)(eventTypeId, 0, userData))
      e.preventDefault()
  };
  var eventHandler = {
    target: findEventTarget(target),
    eventTypeString: eventTypeString,
    callbackfunc: callbackfunc,
    handlerFunc: webGlEventHandlerFunc,
    useCapture: useCapture
  };
  JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_webglcontextlost_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(45, 1, target, userData, useCapture, callbackfunc, targetThread);
  registerWebGlEventCallback(target, userData, useCapture, callbackfunc, 31, "webglcontextlost", targetThread);
  return 0
}
function registerWheelEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
  targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
  if (!JSEvents.wheelEvent)
    JSEvents.wheelEvent = _malloc(104);
  var wheelHandlerFunc = function(e=event) {
    var wheelEvent = targetThread ? _malloc(104) : JSEvents.wheelEvent;
    fillMouseEventData(wheelEvent, e, target);
    GROWABLE_HEAP_F64()[wheelEvent + 72 >> 3] = e["deltaX"];
    GROWABLE_HEAP_F64()[wheelEvent + 80 >> 3] = e["deltaY"];
    GROWABLE_HEAP_F64()[wheelEvent + 88 >> 3] = e["deltaZ"];
    GROWABLE_HEAP_I32()[wheelEvent + 96 >> 2] = e["deltaMode"];
    if (targetThread)
      JSEvents.queueEventHandlerOnThread_iiii(targetThread, callbackfunc, eventTypeId, wheelEvent, userData);
    else if (getWasmTableEntry(callbackfunc)(eventTypeId, wheelEvent, userData))
      e.preventDefault()
  };
  var eventHandler = {
    target: target,
    allowsDeferredCalls: true,
    eventTypeString: eventTypeString,
    callbackfunc: callbackfunc,
    handlerFunc: wheelHandlerFunc,
    useCapture: useCapture
  };
  JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_wheel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(46, 1, target, userData, useCapture, callbackfunc, targetThread);
  target = findEventTarget(target);
  if (typeof target.onwheel != "undefined") {
    registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, "wheel", targetThread);
    return 0
  } else {
    return -1
  }
}
function convertFrameToPC(frame) {
  abort("Cannot use convertFrameToPC (needed by __builtin_return_address) without -sUSE_OFFSET_CONVERTER");
  return 0
}
var UNWIND_CACHE = {};
function saveInUnwindCache(callstack) {
  callstack.forEach(frame=>{
    var pc = convertFrameToPC(frame);
    if (pc) {
      UNWIND_CACHE[pc] = frame
    }
  }
  )
}
function jsStackTrace() {
  var error = new Error;
  if (!error.stack) {
    try {
      throw new Error
    } catch (e) {
      error = e
    }
    if (!error.stack) {
      return "(no stack trace available)"
    }
  }
  return error.stack.toString()
}
function _emscripten_stack_snapshot() {
  var callstack = jsStackTrace().split("\n");
  if (callstack[0] == "Error") {
    callstack.shift()
  }
  saveInUnwindCache(callstack);
  UNWIND_CACHE.last_addr = convertFrameToPC(callstack[3]);
  UNWIND_CACHE.last_stack = callstack;
  return UNWIND_CACHE.last_addr
}
function _emscripten_stack_unwind_buffer(addr, buffer, count) {
  var stack;
  if (UNWIND_CACHE.last_addr == addr) {
    stack = UNWIND_CACHE.last_stack
  } else {
    stack = jsStackTrace().split("\n");
    if (stack[0] == "Error") {
      stack.shift()
    }
    saveInUnwindCache(stack)
  }
  var offset = 3;
  while (stack[offset] && convertFrameToPC(stack[offset]) != addr) {
    ++offset
  }
  for (var i = 0; i < count && stack[i + offset]; ++i) {
    GROWABLE_HEAP_I32()[buffer + i * 4 >> 2] = convertFrameToPC(stack[i + offset])
  }
  return i
}
var Fetch = {
  xhrs: {},
  openDatabase: function(dbname, dbversion, onsuccess, onerror) {
    try {
      var openRequest = indexedDB.open(dbname, dbversion)
    } catch (e) {
      return onerror(e)
    }
    openRequest.onupgradeneeded = event=>{
      var db = event.target.result;
      if (db.objectStoreNames.contains("FILES")) {
        db.deleteObjectStore("FILES")
      }
      db.createObjectStore("FILES")
    }
    ;
    openRequest.onsuccess = event=>onsuccess(event.target.result);
    openRequest.onerror = error=>onerror(error)
  },
  staticInit: function() {
    var onsuccess = db=>{
      Fetch.dbInstance = db;
      removeRunDependency("library_fetch_init")
    }
    ;
    var onerror = ()=>{
      Fetch.dbInstance = false;
      removeRunDependency("library_fetch_init")
    }
    ;
    addRunDependency("library_fetch_init");
    Fetch.openDatabase("emscripten_filesystem", 1, onsuccess, onerror)
  }
};
function fetchXHR(fetch, onsuccess, onerror, onprogress, onreadystatechange) {
  var url = GROWABLE_HEAP_U32()[fetch + 8 >> 2];
  if (!url) {
    onerror(fetch, 0, "no url specified!");
    return
  }
  var url_ = UTF8ToString(url);
  var fetch_attr = fetch + 112;
  var requestMethod = UTF8ToString(fetch_attr);
  if (!requestMethod)
    requestMethod = "GET";
  var userData = GROWABLE_HEAP_U32()[fetch + 4 >> 2];
  var fetchAttributes = GROWABLE_HEAP_U32()[fetch_attr + 52 >> 2];
  var timeoutMsecs = GROWABLE_HEAP_U32()[fetch_attr + 56 >> 2];
  var withCredentials = !!GROWABLE_HEAP_U32()[fetch_attr + 60 >> 2];
  var destinationPath = GROWABLE_HEAP_U32()[fetch_attr + 64 >> 2];
  var userName = GROWABLE_HEAP_U32()[fetch_attr + 68 >> 2];
  var password = GROWABLE_HEAP_U32()[fetch_attr + 72 >> 2];
  var requestHeaders = GROWABLE_HEAP_U32()[fetch_attr + 76 >> 2];
  var overriddenMimeType = GROWABLE_HEAP_U32()[fetch_attr + 80 >> 2];
  var dataPtr = GROWABLE_HEAP_U32()[fetch_attr + 84 >> 2];
  var dataLength = GROWABLE_HEAP_U32()[fetch_attr + 88 >> 2];
  var fetchAttrLoadToMemory = !!(fetchAttributes & 1);
  var fetchAttrStreamData = !!(fetchAttributes & 2);
  var fetchAttrSynchronous = !!(fetchAttributes & 64);
  var userNameStr = userName ? UTF8ToString(userName) : undefined;
  var passwordStr = password ? UTF8ToString(password) : undefined;
  var xhr = new XMLHttpRequest;
  xhr.withCredentials = withCredentials;
  xhr.open(requestMethod, url_, !fetchAttrSynchronous, userNameStr, passwordStr);
  if (!fetchAttrSynchronous)
    xhr.timeout = timeoutMsecs;
  xhr.url_ = url_;
  xhr.responseType = "arraybuffer";
  if (overriddenMimeType) {
    var overriddenMimeTypeStr = UTF8ToString(overriddenMimeType);
    xhr.overrideMimeType(overriddenMimeTypeStr)
  }
  if (requestHeaders) {
    for (; ; ) {
      var key = GROWABLE_HEAP_U32()[requestHeaders >> 2];
      if (!key)
        break;
      var value = GROWABLE_HEAP_U32()[requestHeaders + 4 >> 2];
      if (!value)
        break;
      requestHeaders += 8;
      var keyStr = UTF8ToString(key);
      var valueStr = UTF8ToString(value);
      xhr.setRequestHeader(keyStr, valueStr)
    }
  }
  var id = GROWABLE_HEAP_U32()[fetch + 0 >> 2];
  Fetch.xhrs[id] = xhr;
  var data = dataPtr && dataLength ? GROWABLE_HEAP_U8().slice(dataPtr, dataPtr + dataLength) : null;
  function saveResponseAndStatus() {
    var ptr = 0;
    var ptrLen = 0;
    if (xhr.response && fetchAttrLoadToMemory && GROWABLE_HEAP_U32()[fetch + 12 >> 2] === 0) {
      ptrLen = xhr.response.byteLength
    }
    if (ptrLen > 0) {
      ptr = _malloc(ptrLen);
      GROWABLE_HEAP_U8().set(new Uint8Array(xhr.response), ptr)
    }
    GROWABLE_HEAP_U32()[fetch + 12 >> 2] = ptr;
    writeI53ToI64(fetch + 16, ptrLen);
    writeI53ToI64(fetch + 24, 0);
    var len = xhr.response ? xhr.response.byteLength : 0;
    if (len) {
      writeI53ToI64(fetch + 32, len)
    }
    GROWABLE_HEAP_U16()[fetch + 40 >> 1] = xhr.readyState;
    GROWABLE_HEAP_U16()[fetch + 42 >> 1] = xhr.status;
    if (xhr.statusText)
      stringToUTF8(xhr.statusText, fetch + 44, 64)
  }
  xhr.onload = e=>{
    if (!(id in Fetch.xhrs)) {
      return
    }
    saveResponseAndStatus();
    if (xhr.status >= 200 && xhr.status < 300) {
      if (onsuccess)
        onsuccess(fetch, xhr, e)
    } else {
      if (onerror)
        onerror(fetch, xhr, e)
    }
  }
  ;
  xhr.onerror = e=>{
    if (!(id in Fetch.xhrs)) {
      return
    }
    saveResponseAndStatus();
    if (onerror)
      onerror(fetch, xhr, e)
  }
  ;
  xhr.ontimeout = e=>{
    if (!(id in Fetch.xhrs)) {
      return
    }
    if (onerror)
      onerror(fetch, xhr, e)
  }
  ;
  xhr.onprogress = e=>{
    if (!(id in Fetch.xhrs)) {
      return
    }
    var ptrLen = fetchAttrLoadToMemory && fetchAttrStreamData && xhr.response ? xhr.response.byteLength : 0;
    var ptr = 0;
    if (ptrLen > 0 && fetchAttrLoadToMemory && fetchAttrStreamData) {
      ptr = _malloc(ptrLen);
      GROWABLE_HEAP_U8().set(new Uint8Array(xhr.response), ptr)
    }
    GROWABLE_HEAP_U32()[fetch + 12 >> 2] = ptr;
    writeI53ToI64(fetch + 16, ptrLen);
    writeI53ToI64(fetch + 24, e.loaded - ptrLen);
    writeI53ToI64(fetch + 32, e.total);
    GROWABLE_HEAP_U16()[fetch + 40 >> 1] = xhr.readyState;
    if (xhr.readyState >= 3 && xhr.status === 0 && e.loaded > 0)
      xhr.status = 200;
    GROWABLE_HEAP_U16()[fetch + 42 >> 1] = xhr.status;
    if (xhr.statusText)
      stringToUTF8(xhr.statusText, fetch + 44, 64);
    if (onprogress)
      onprogress(fetch, xhr, e);
    if (ptr) {
      _free(ptr)
    }
  }
  ;
  xhr.onreadystatechange = e=>{
    if (!(id in Fetch.xhrs)) {
      runtimeKeepalivePop();
      return
    }
    GROWABLE_HEAP_U16()[fetch + 40 >> 1] = xhr.readyState;
    if (xhr.readyState >= 2) {
      GROWABLE_HEAP_U16()[fetch + 42 >> 1] = xhr.status
    }
    if (onreadystatechange)
      onreadystatechange(fetch, xhr, e)
  }
  ;
  try {
    xhr.send(data)
  } catch (e) {
    if (onerror)
      onerror(fetch, xhr, e)
  }
}
function fetchCacheData(db, fetch, data, onsuccess, onerror) {
  if (!db) {
    onerror(fetch, 0, "IndexedDB not available!");
    return
  }
  var fetch_attr = fetch + 112;
  var destinationPath = GROWABLE_HEAP_U32()[fetch_attr + 64 >> 2];
  if (!destinationPath)
    destinationPath = GROWABLE_HEAP_U32()[fetch + 8 >> 2];
  var destinationPathStr = UTF8ToString(destinationPath);
  try {
    var transaction = db.transaction(["FILES"], "readwrite");
    var packages = transaction.objectStore("FILES");
    var putRequest = packages.put(data, destinationPathStr);
    putRequest.onsuccess = event=>{
      GROWABLE_HEAP_U16()[fetch + 40 >> 1] = 4;
      GROWABLE_HEAP_U16()[fetch + 42 >> 1] = 200;
      stringToUTF8("OK", fetch + 44, 64);
      onsuccess(fetch, 0, destinationPathStr)
    }
    ;
    putRequest.onerror = error=>{
      GROWABLE_HEAP_U16()[fetch + 40 >> 1] = 4;
      GROWABLE_HEAP_U16()[fetch + 42 >> 1] = 413;
      stringToUTF8("Payload Too Large", fetch + 44, 64);
      onerror(fetch, 0, error)
    }
  } catch (e) {
    onerror(fetch, 0, e)
  }
}
function fetchLoadCachedData(db, fetch, onsuccess, onerror) {
  if (!db) {
    onerror(fetch, 0, "IndexedDB not available!");
    return
  }
  var fetch_attr = fetch + 112;
  var path = GROWABLE_HEAP_U32()[fetch_attr + 64 >> 2];
  if (!path)
    path = GROWABLE_HEAP_U32()[fetch + 8 >> 2];
  var pathStr = UTF8ToString(path);
  try {
    var transaction = db.transaction(["FILES"], "readonly");
    var packages = transaction.objectStore("FILES");
    var getRequest = packages.get(pathStr);
    getRequest.onsuccess = event=>{
      if (event.target.result) {
        var value = event.target.result;
        var len = value.byteLength || value.length;
        var ptr = _malloc(len);
        GROWABLE_HEAP_U8().set(new Uint8Array(value), ptr);
        GROWABLE_HEAP_U32()[fetch + 12 >> 2] = ptr;
        writeI53ToI64(fetch + 16, len);
        writeI53ToI64(fetch + 24, 0);
        writeI53ToI64(fetch + 32, len);
        GROWABLE_HEAP_U16()[fetch + 40 >> 1] = 4;
        GROWABLE_HEAP_U16()[fetch + 42 >> 1] = 200;
        stringToUTF8("OK", fetch + 44, 64);
        onsuccess(fetch, 0, value)
      } else {
        GROWABLE_HEAP_U16()[fetch + 40 >> 1] = 4;
        GROWABLE_HEAP_U16()[fetch + 42 >> 1] = 404;
        stringToUTF8("Not Found", fetch + 44, 64);
        onerror(fetch, 0, "no data")
      }
    }
    ;
    getRequest.onerror = error=>{
      GROWABLE_HEAP_U16()[fetch + 40 >> 1] = 4;
      GROWABLE_HEAP_U16()[fetch + 42 >> 1] = 404;
      stringToUTF8("Not Found", fetch + 44, 64);
      onerror(fetch, 0, error)
    }
  } catch (e) {
    onerror(fetch, 0, e)
  }
}
function fetchDeleteCachedData(db, fetch, onsuccess, onerror) {
  if (!db) {
    onerror(fetch, 0, "IndexedDB not available!");
    return
  }
  var fetch_attr = fetch + 112;
  var path = GROWABLE_HEAP_U32()[fetch_attr + 64 >> 2];
  if (!path)
    path = GROWABLE_HEAP_U32()[fetch + 8 >> 2];
  var pathStr = UTF8ToString(path);
  try {
    var transaction = db.transaction(["FILES"], "readwrite");
    var packages = transaction.objectStore("FILES");
    var request = packages.delete(pathStr);
    request.onsuccess = event=>{
      var value = event.target.result;
      GROWABLE_HEAP_U32()[fetch + 12 >> 2] = 0;
      writeI53ToI64(fetch + 16, 0);
      writeI53ToI64(fetch + 24, 0);
      writeI53ToI64(fetch + 32, 0);
      GROWABLE_HEAP_U16()[fetch + 40 >> 1] = 4;
      GROWABLE_HEAP_U16()[fetch + 42 >> 1] = 200;
      stringToUTF8("OK", fetch + 44, 64);
      onsuccess(fetch, 0, value)
    }
    ;
    request.onerror = error=>{
      GROWABLE_HEAP_U16()[fetch + 40 >> 1] = 4;
      GROWABLE_HEAP_U16()[fetch + 42 >> 1] = 404;
      stringToUTF8("Not Found", fetch + 44, 64);
      onerror(fetch, 0, error)
    }
  } catch (e) {
    onerror(fetch, 0, e)
  }
}
function _emscripten_start_fetch(fetch, successcb, errorcb, progresscb, readystatechangecb) {
  runtimeKeepalivePush();
  var fetch_attr = fetch + 112;
  var requestMethod = UTF8ToString(fetch_attr);
  var onsuccess = GROWABLE_HEAP_U32()[fetch_attr + 36 >> 2];
  var onerror = GROWABLE_HEAP_U32()[fetch_attr + 40 >> 2];
  var onprogress = GROWABLE_HEAP_U32()[fetch_attr + 44 >> 2];
  var onreadystatechange = GROWABLE_HEAP_U32()[fetch_attr + 48 >> 2];
  var fetchAttributes = GROWABLE_HEAP_U32()[fetch_attr + 52 >> 2];
  var fetchAttrPersistFile = !!(fetchAttributes & 4);
  var fetchAttrNoDownload = !!(fetchAttributes & 32);
  var fetchAttrReplace = !!(fetchAttributes & 16);
  var fetchAttrSynchronous = !!(fetchAttributes & 64);
  function doCallback(f) {
    if (fetchAttrSynchronous) {
      f()
    } else {
      callUserCallback(f)
    }
  }
  var reportSuccess = (fetch,xhr,e)=>{
    runtimeKeepalivePop();
    doCallback(()=>{
      if (onsuccess)
        getWasmTableEntry(onsuccess)(fetch);
      else if (successcb)
        successcb(fetch)
    }
    )
  }
  ;
  var reportProgress = (fetch,xhr,e)=>{
    doCallback(()=>{
      if (onprogress)
        getWasmTableEntry(onprogress)(fetch);
      else if (progresscb)
        progresscb(fetch)
    }
    )
  }
  ;
  var reportError = (fetch,xhr,e)=>{
    runtimeKeepalivePop();
    doCallback(()=>{
      if (onerror)
        getWasmTableEntry(onerror)(fetch);
      else if (errorcb)
        errorcb(fetch)
    }
    )
  }
  ;
  var reportReadyStateChange = (fetch,xhr,e)=>{
    doCallback(()=>{
      if (onreadystatechange)
        getWasmTableEntry(onreadystatechange)(fetch);
      else if (readystatechangecb)
        readystatechangecb(fetch)
    }
    )
  }
  ;
  var performUncachedXhr = (fetch,xhr,e)=>{
    fetchXHR(fetch, reportSuccess, reportError, reportProgress, reportReadyStateChange)
  }
  ;
  var cacheResultAndReportSuccess = (fetch,xhr,e)=>{
    var storeSuccess = (fetch,xhr,e)=>{
      runtimeKeepalivePop();
      doCallback(()=>{
        if (onsuccess)
          getWasmTableEntry(onsuccess)(fetch);
        else if (successcb)
          successcb(fetch)
      }
      )
    }
    ;
    var storeError = (fetch,xhr,e)=>{
      runtimeKeepalivePop();
      doCallback(()=>{
        if (onsuccess)
          getWasmTableEntry(onsuccess)(fetch);
        else if (successcb)
          successcb(fetch)
      }
      )
    }
    ;
    fetchCacheData(Fetch.dbInstance, fetch, xhr.response, storeSuccess, storeError)
  }
  ;
  var performCachedXhr = (fetch,xhr,e)=>{
    fetchXHR(fetch, cacheResultAndReportSuccess, reportError, reportProgress, reportReadyStateChange)
  }
  ;
  if (requestMethod === "EM_IDB_STORE") {
    var ptr = GROWABLE_HEAP_U32()[fetch_attr + 84 >> 2];
    fetchCacheData(Fetch.dbInstance, fetch, GROWABLE_HEAP_U8().slice(ptr, ptr + GROWABLE_HEAP_U32()[fetch_attr + 88 >> 2]), reportSuccess, reportError)
  } else if (requestMethod === "EM_IDB_DELETE") {
    fetchDeleteCachedData(Fetch.dbInstance, fetch, reportSuccess, reportError)
  } else if (!fetchAttrReplace) {
    fetchLoadCachedData(Fetch.dbInstance, fetch, reportSuccess, fetchAttrNoDownload ? reportError : fetchAttrPersistFile ? performCachedXhr : performUncachedXhr)
  } else if (!fetchAttrNoDownload) {
    fetchXHR(fetch, fetchAttrPersistFile ? cacheResultAndReportSuccess : reportSuccess, reportError, reportProgress, reportReadyStateChange)
  } else {
    return 0
  }
  return fetch
}
var emscripten_webgl_power_preferences = ["default", "low-power", "high-performance"];
function findCanvasEventTarget(target) {
  if (typeof target == "number")
    target = UTF8ToString(target);
  if (!target || target === "#canvas") {
    if (typeof GL != "undefined" && GL.offscreenCanvases["canvas"])
      return GL.offscreenCanvases["canvas"];
    return Module["canvas"]
  }
  if (typeof GL != "undefined" && GL.offscreenCanvases[target])
    return GL.offscreenCanvases[target];
  return findEventTarget(target)
}
function _emscripten_webgl_do_create_context(target, attributes) {
  var a = attributes >> 2;
  var powerPreference = GROWABLE_HEAP_I32()[a + (24 >> 2)];
  var contextAttributes = {
    "alpha": !!GROWABLE_HEAP_I32()[a + (0 >> 2)],
    "depth": !!GROWABLE_HEAP_I32()[a + (4 >> 2)],
    "stencil": !!GROWABLE_HEAP_I32()[a + (8 >> 2)],
    "antialias": !!GROWABLE_HEAP_I32()[a + (12 >> 2)],
    "premultipliedAlpha": !!GROWABLE_HEAP_I32()[a + (16 >> 2)],
    "preserveDrawingBuffer": !!GROWABLE_HEAP_I32()[a + (20 >> 2)],
    "powerPreference": emscripten_webgl_power_preferences[powerPreference],
    "failIfMajorPerformanceCaveat": !!GROWABLE_HEAP_I32()[a + (28 >> 2)],
    majorVersion: GROWABLE_HEAP_I32()[a + (32 >> 2)],
    minorVersion: GROWABLE_HEAP_I32()[a + (36 >> 2)],
    enableExtensionsByDefault: GROWABLE_HEAP_I32()[a + (40 >> 2)],
    explicitSwapControl: GROWABLE_HEAP_I32()[a + (44 >> 2)],
    proxyContextToMainThread: GROWABLE_HEAP_I32()[a + (48 >> 2)],
    renderViaOffscreenBackBuffer: GROWABLE_HEAP_I32()[a + (52 >> 2)]
  };
  var canvas = findCanvasEventTarget(target);
  if (!canvas) {
    return 0
  }
  if (contextAttributes.explicitSwapControl) {
    return 0
  }
  var contextHandle = GL.createContext(canvas, contextAttributes);
  return contextHandle
}
var _emscripten_webgl_create_context = _emscripten_webgl_do_create_context;
function _emscripten_webgl_init_context_attributes(attributes) {
  var a = attributes >> 2;
  for (var i = 0; i < 56 >> 2; ++i) {
    GROWABLE_HEAP_I32()[a + i] = 0
  }
  GROWABLE_HEAP_I32()[a + (0 >> 2)] = GROWABLE_HEAP_I32()[a + (4 >> 2)] = GROWABLE_HEAP_I32()[a + (12 >> 2)] = GROWABLE_HEAP_I32()[a + (16 >> 2)] = GROWABLE_HEAP_I32()[a + (32 >> 2)] = GROWABLE_HEAP_I32()[a + (40 >> 2)] = 1;
  if (ENVIRONMENT_IS_WORKER)
    GROWABLE_HEAP_I32()[attributes + 48 >> 2] = 1
}
function _emscripten_webgl_make_context_current(contextHandle) {
  var success = GL.makeContextCurrent(contextHandle);
  return success ? 0 : -5
}
var ENV = {};
function getExecutableName() {
  return thisProgram || "./this.program"
}
function getEnvStrings() {
  if (!getEnvStrings.strings) {
    var lang = (typeof navigator == "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
    var env = {
      "USER": "web_user",
      "LOGNAME": "web_user",
      "PATH": "/",
      "PWD": "/",
      "HOME": "/home/web_user",
      "LANG": lang,
      "_": getExecutableName()
    };
    for (var x in ENV) {
      if (ENV[x] === undefined)
        delete env[x];
      else
        env[x] = ENV[x]
    }
    var strings = [];
    for (var x in env) {
      strings.push(x + "=" + env[x])
    }
    getEnvStrings.strings = strings
  }
  return getEnvStrings.strings
}
function stringToAscii(str, buffer) {
  for (var i = 0; i < str.length; ++i) {
    GROWABLE_HEAP_I8()[buffer++ >> 0] = str.charCodeAt(i)
  }
  GROWABLE_HEAP_I8()[buffer >> 0] = 0
}
function _environ_get(__environ, environ_buf) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(47, 1, __environ, environ_buf);
  var bufSize = 0;
  getEnvStrings().forEach(function(string, i) {
    var ptr = environ_buf + bufSize;
    GROWABLE_HEAP_U32()[__environ + i * 4 >> 2] = ptr;
    stringToAscii(string, ptr);
    bufSize += string.length + 1
  });
  return 0
}
function _environ_sizes_get(penviron_count, penviron_buf_size) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(48, 1, penviron_count, penviron_buf_size);
  var strings = getEnvStrings();
  GROWABLE_HEAP_U32()[penviron_count >> 2] = strings.length;
  var bufSize = 0;
  strings.forEach(function(string) {
    bufSize += string.length + 1
  });
  GROWABLE_HEAP_U32()[penviron_buf_size >> 2] = bufSize;
  return 0
}
function _fd_close(fd) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(49, 1, fd);
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    FS.close(stream);
    return 0
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
      throw e;
    return e.errno
  }
}
function doReadv(stream, iov, iovcnt, offset) {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
    var ptr = GROWABLE_HEAP_U32()[iov >> 2];
    var len = GROWABLE_HEAP_U32()[iov + 4 >> 2];
    iov += 8;
    var curr = FS.read(stream, GROWABLE_HEAP_I8(), ptr, len, offset);
    if (curr < 0)
      return -1;
    ret += curr;
    if (curr < len)
      break;
    if (typeof offset !== "undefined") {
      offset += curr
    }
  }
  return ret
}
function _fd_read(fd, iov, iovcnt, pnum) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(50, 1, fd, iov, iovcnt, pnum);
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var num = doReadv(stream, iov, iovcnt);
    GROWABLE_HEAP_U32()[pnum >> 2] = num;
    return 0
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
      throw e;
    return e.errno
  }
}
function convertI32PairToI53Checked(lo, hi) {
  return hi + 2097152 >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN
}
function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(51, 1, fd, offset_low, offset_high, whence, newOffset);
  try {
    var offset = convertI32PairToI53Checked(offset_low, offset_high);
    if (isNaN(offset))
      return 61;
    var stream = SYSCALLS.getStreamFromFD(fd);
    FS.llseek(stream, offset, whence);
    tempI64 = [stream.position >>> 0, (tempDouble = stream.position,
    +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
    GROWABLE_HEAP_I32()[newOffset >> 2] = tempI64[0],
    GROWABLE_HEAP_I32()[newOffset + 4 >> 2] = tempI64[1];
    if (stream.getdents && offset === 0 && whence === 0)
      stream.getdents = null;
    return 0
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
      throw e;
    return e.errno
  }
}
function doWritev(stream, iov, iovcnt, offset) {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
    var ptr = GROWABLE_HEAP_U32()[iov >> 2];
    var len = GROWABLE_HEAP_U32()[iov + 4 >> 2];
    iov += 8;
    var curr = FS.write(stream, GROWABLE_HEAP_I8(), ptr, len, offset);
    if (curr < 0)
      return -1;
    ret += curr;
    if (typeof offset !== "undefined") {
      offset += curr
    }
  }
  return ret
}
function _fd_write(fd, iov, iovcnt, pnum) {
  if (ENVIRONMENT_IS_PTHREAD)
    return proxyToMainThread(52, 1, fd, iov, iovcnt, pnum);
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var num = doWritev(stream, iov, iovcnt);
    GROWABLE_HEAP_U32()[pnum >> 2] = num;
    return 0
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
      throw e;
    return e.errno
  }
}
function _getentropy(buffer, size) {
  randomFill(GROWABLE_HEAP_U8().subarray(buffer, buffer + size));
  return 0
}
function arraySum(array, index) {
  var sum = 0;
  for (var i = 0; i <= index; sum += array[i++]) {}
  return sum
}
var MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function addDays(date, days) {
  var newDate = new Date(date.getTime());
  while (days > 0) {
    var leap = isLeapYear(newDate.getFullYear());
    var currentMonth = newDate.getMonth();
    var daysInCurrentMonth = (leap ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR)[currentMonth];
    if (days > daysInCurrentMonth - newDate.getDate()) {
      days -= daysInCurrentMonth - newDate.getDate() + 1;
      newDate.setDate(1);
      if (currentMonth < 11) {
        newDate.setMonth(currentMonth + 1)
      } else {
        newDate.setMonth(0);
        newDate.setFullYear(newDate.getFullYear() + 1)
      }
    } else {
      newDate.setDate(newDate.getDate() + days);
      return newDate
    }
  }
  return newDate
}
function writeArrayToMemory(array, buffer) {
  GROWABLE_HEAP_I8().set(array, buffer)
}
function _strftime(s, maxsize, format, tm) {
  var tm_zone = GROWABLE_HEAP_I32()[tm + 40 >> 2];
  var date = {
    tm_sec: GROWABLE_HEAP_I32()[tm >> 2],
    tm_min: GROWABLE_HEAP_I32()[tm + 4 >> 2],
    tm_hour: GROWABLE_HEAP_I32()[tm + 8 >> 2],
    tm_mday: GROWABLE_HEAP_I32()[tm + 12 >> 2],
    tm_mon: GROWABLE_HEAP_I32()[tm + 16 >> 2],
    tm_year: GROWABLE_HEAP_I32()[tm + 20 >> 2],
    tm_wday: GROWABLE_HEAP_I32()[tm + 24 >> 2],
    tm_yday: GROWABLE_HEAP_I32()[tm + 28 >> 2],
    tm_isdst: GROWABLE_HEAP_I32()[tm + 32 >> 2],
    tm_gmtoff: GROWABLE_HEAP_I32()[tm + 36 >> 2],
    tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
  };
  var pattern = UTF8ToString(format);
  var EXPANSION_RULES_1 = {
    "%c": "%a %b %d %H:%M:%S %Y",
    "%D": "%m/%d/%y",
    "%F": "%Y-%m-%d",
    "%h": "%b",
    "%r": "%I:%M:%S %p",
    "%R": "%H:%M",
    "%T": "%H:%M:%S",
    "%x": "%m/%d/%y",
    "%X": "%H:%M:%S",
    "%Ec": "%c",
    "%EC": "%C",
    "%Ex": "%m/%d/%y",
    "%EX": "%H:%M:%S",
    "%Ey": "%y",
    "%EY": "%Y",
    "%Od": "%d",
    "%Oe": "%e",
    "%OH": "%H",
    "%OI": "%I",
    "%Om": "%m",
    "%OM": "%M",
    "%OS": "%S",
    "%Ou": "%u",
    "%OU": "%U",
    "%OV": "%V",
    "%Ow": "%w",
    "%OW": "%W",
    "%Oy": "%y"
  };
  for (var rule in EXPANSION_RULES_1) {
    pattern = pattern.replace(new RegExp(rule,"g"), EXPANSION_RULES_1[rule])
  }
  var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function leadingSomething(value, digits, character) {
    var str = typeof value == "number" ? value.toString() : value || "";
    while (str.length < digits) {
      str = character[0] + str
    }
    return str
  }
  function leadingNulls(value, digits) {
    return leadingSomething(value, digits, "0")
  }
  function compareByDay(date1, date2) {
    function sgn(value) {
      return value < 0 ? -1 : value > 0 ? 1 : 0
    }
    var compare;
    if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
      if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
        compare = sgn(date1.getDate() - date2.getDate())
      }
    }
    return compare
  }
  function getFirstWeekStartDate(janFourth) {
    switch (janFourth.getDay()) {
    case 0:
      return new Date(janFourth.getFullYear() - 1,11,29);
    case 1:
      return janFourth;
    case 2:
      return new Date(janFourth.getFullYear(),0,3);
    case 3:
      return new Date(janFourth.getFullYear(),0,2);
    case 4:
      return new Date(janFourth.getFullYear(),0,1);
    case 5:
      return new Date(janFourth.getFullYear() - 1,11,31);
    case 6:
      return new Date(janFourth.getFullYear() - 1,11,30)
    }
  }
  function getWeekBasedYear(date) {
    var thisDate = addDays(new Date(date.tm_year + 1900,0,1), date.tm_yday);
    var janFourthThisYear = new Date(thisDate.getFullYear(),0,4);
    var janFourthNextYear = new Date(thisDate.getFullYear() + 1,0,4);
    var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
    var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
    if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
      if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
        return thisDate.getFullYear() + 1
      }
      return thisDate.getFullYear()
    }
    return thisDate.getFullYear() - 1
  }
  var EXPANSION_RULES_2 = {
    "%a": function(date) {
      return WEEKDAYS[date.tm_wday].substring(0, 3)
    },
    "%A": function(date) {
      return WEEKDAYS[date.tm_wday]
    },
    "%b": function(date) {
      return MONTHS[date.tm_mon].substring(0, 3)
    },
    "%B": function(date) {
      return MONTHS[date.tm_mon]
    },
    "%C": function(date) {
      var year = date.tm_year + 1900;
      return leadingNulls(year / 100 | 0, 2)
    },
    "%d": function(date) {
      return leadingNulls(date.tm_mday, 2)
    },
    "%e": function(date) {
      return leadingSomething(date.tm_mday, 2, " ")
    },
    "%g": function(date) {
      return getWeekBasedYear(date).toString().substring(2)
    },
    "%G": function(date) {
      return getWeekBasedYear(date)
    },
    "%H": function(date) {
      return leadingNulls(date.tm_hour, 2)
    },
    "%I": function(date) {
      var twelveHour = date.tm_hour;
      if (twelveHour == 0)
        twelveHour = 12;
      else if (twelveHour > 12)
        twelveHour -= 12;
      return leadingNulls(twelveHour, 2)
    },
    "%j": function(date) {
      return leadingNulls(date.tm_mday + arraySum(isLeapYear(date.tm_year + 1900) ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR, date.tm_mon - 1), 3)
    },
    "%m": function(date) {
      return leadingNulls(date.tm_mon + 1, 2)
    },
    "%M": function(date) {
      return leadingNulls(date.tm_min, 2)
    },
    "%n": function() {
      return "\n"
    },
    "%p": function(date) {
      if (date.tm_hour >= 0 && date.tm_hour < 12) {
        return "AM"
      }
      return "PM"
    },
    "%S": function(date) {
      return leadingNulls(date.tm_sec, 2)
    },
    "%t": function() {
      return "\t"
    },
    "%u": function(date) {
      return date.tm_wday || 7
    },
    "%U": function(date) {
      var days = date.tm_yday + 7 - date.tm_wday;
      return leadingNulls(Math.floor(days / 7), 2)
    },
    "%V": function(date) {
      var val = Math.floor((date.tm_yday + 7 - (date.tm_wday + 6) % 7) / 7);
      if ((date.tm_wday + 371 - date.tm_yday - 2) % 7 <= 2) {
        val++
      }
      if (!val) {
        val = 52;
        var dec31 = (date.tm_wday + 7 - date.tm_yday - 1) % 7;
        if (dec31 == 4 || dec31 == 5 && isLeapYear(date.tm_year % 400 - 1)) {
          val++
        }
      } else if (val == 53) {
        var jan1 = (date.tm_wday + 371 - date.tm_yday) % 7;
        if (jan1 != 4 && (jan1 != 3 || !isLeapYear(date.tm_year)))
          val = 1
      }
      return leadingNulls(val, 2)
    },
    "%w": function(date) {
      return date.tm_wday
    },
    "%W": function(date) {
      var days = date.tm_yday + 7 - (date.tm_wday + 6) % 7;
      return leadingNulls(Math.floor(days / 7), 2)
    },
    "%y": function(date) {
      return (date.tm_year + 1900).toString().substring(2)
    },
    "%Y": function(date) {
      return date.tm_year + 1900
    },
    "%z": function(date) {
      var off = date.tm_gmtoff;
      var ahead = off >= 0;
      off = Math.abs(off) / 60;
      off = off / 60 * 100 + off % 60;
      return (ahead ? "+" : "-") + String("0000" + off).slice(-4)
    },
    "%Z": function(date) {
      return date.tm_zone
    },
    "%%": function() {
      return "%"
    }
  };
  pattern = pattern.replace(/%%/g, "\0\0");
  for (var rule in EXPANSION_RULES_2) {
    if (pattern.includes(rule)) {
      pattern = pattern.replace(new RegExp(rule,"g"), EXPANSION_RULES_2[rule](date))
    }
  }
  pattern = pattern.replace(/\0\0/g, "%");
  var bytes = intArrayFromString(pattern, false);
  if (bytes.length > maxsize) {
    return 0
  }
  writeArrayToMemory(bytes, s);
  return bytes.length - 1
}
function _strftime_l(s, maxsize, format, tm, loc) {
  return _strftime(s, maxsize, format, tm)
}
function _strptime(buf, format, tm) {
  var pattern = UTF8ToString(format);
  var SPECIAL_CHARS = "\\!@#$^&*()+=-[]/{}|:<>?,.";
  for (var i = 0, ii = SPECIAL_CHARS.length; i < ii; ++i) {
    pattern = pattern.replace(new RegExp("\\" + SPECIAL_CHARS[i],"g"), "\\" + SPECIAL_CHARS[i])
  }
  var EQUIVALENT_MATCHERS = {
    "%A": "%a",
    "%B": "%b",
    "%c": "%a %b %d %H:%M:%S %Y",
    "%D": "%m\\/%d\\/%y",
    "%e": "%d",
    "%F": "%Y-%m-%d",
    "%h": "%b",
    "%R": "%H\\:%M",
    "%r": "%I\\:%M\\:%S\\s%p",
    "%T": "%H\\:%M\\:%S",
    "%x": "%m\\/%d\\/(?:%y|%Y)",
    "%X": "%H\\:%M\\:%S"
  };
  for (var matcher in EQUIVALENT_MATCHERS) {
    pattern = pattern.replace(matcher, EQUIVALENT_MATCHERS[matcher])
  }
  var DATE_PATTERNS = {
    "%a": "(?:Sun(?:day)?)|(?:Mon(?:day)?)|(?:Tue(?:sday)?)|(?:Wed(?:nesday)?)|(?:Thu(?:rsday)?)|(?:Fri(?:day)?)|(?:Sat(?:urday)?)",
    "%b": "(?:Jan(?:uary)?)|(?:Feb(?:ruary)?)|(?:Mar(?:ch)?)|(?:Apr(?:il)?)|May|(?:Jun(?:e)?)|(?:Jul(?:y)?)|(?:Aug(?:ust)?)|(?:Sep(?:tember)?)|(?:Oct(?:ober)?)|(?:Nov(?:ember)?)|(?:Dec(?:ember)?)",
    "%C": "\\d\\d",
    "%d": "0[1-9]|[1-9](?!\\d)|1\\d|2\\d|30|31",
    "%H": "\\d(?!\\d)|[0,1]\\d|20|21|22|23",
    "%I": "\\d(?!\\d)|0\\d|10|11|12",
    "%j": "00[1-9]|0?[1-9](?!\\d)|0?[1-9]\\d(?!\\d)|[1,2]\\d\\d|3[0-6]\\d",
    "%m": "0[1-9]|[1-9](?!\\d)|10|11|12",
    "%M": "0\\d|\\d(?!\\d)|[1-5]\\d",
    "%n": "\\s",
    "%p": "AM|am|PM|pm|A\\.M\\.|a\\.m\\.|P\\.M\\.|p\\.m\\.",
    "%S": "0\\d|\\d(?!\\d)|[1-5]\\d|60",
    "%U": "0\\d|\\d(?!\\d)|[1-4]\\d|50|51|52|53",
    "%W": "0\\d|\\d(?!\\d)|[1-4]\\d|50|51|52|53",
    "%w": "[0-6]",
    "%y": "\\d\\d",
    "%Y": "\\d\\d\\d\\d",
    "%%": "%",
    "%t": "\\s"
  };
  var MONTH_NUMBERS = {
    JAN: 0,
    FEB: 1,
    MAR: 2,
    APR: 3,
    MAY: 4,
    JUN: 5,
    JUL: 6,
    AUG: 7,
    SEP: 8,
    OCT: 9,
    NOV: 10,
    DEC: 11
  };
  var DAY_NUMBERS_SUN_FIRST = {
    SUN: 0,
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6
  };
  var DAY_NUMBERS_MON_FIRST = {
    MON: 0,
    TUE: 1,
    WED: 2,
    THU: 3,
    FRI: 4,
    SAT: 5,
    SUN: 6
  };
  for (var datePattern in DATE_PATTERNS) {
    pattern = pattern.replace(datePattern, "(" + datePattern + DATE_PATTERNS[datePattern] + ")")
  }
  var capture = [];
  for (var i = pattern.indexOf("%"); i >= 0; i = pattern.indexOf("%")) {
    capture.push(pattern[i + 1]);
    pattern = pattern.replace(new RegExp("\\%" + pattern[i + 1],"g"), "")
  }
  var matches = new RegExp("^" + pattern,"i").exec(UTF8ToString(buf));
  function initDate() {
    function fixup(value, min, max) {
      return typeof value != "number" || isNaN(value) ? min : value >= min ? value <= max ? value : max : min
    }
    return {
      year: fixup(GROWABLE_HEAP_I32()[tm + 20 >> 2] + 1900, 1970, 9999),
      month: fixup(GROWABLE_HEAP_I32()[tm + 16 >> 2], 0, 11),
      day: fixup(GROWABLE_HEAP_I32()[tm + 12 >> 2], 1, 31),
      hour: fixup(GROWABLE_HEAP_I32()[tm + 8 >> 2], 0, 23),
      min: fixup(GROWABLE_HEAP_I32()[tm + 4 >> 2], 0, 59),
      sec: fixup(GROWABLE_HEAP_I32()[tm >> 2], 0, 59)
    }
  }
  if (matches) {
    var date = initDate();
    var value;
    var getMatch = symbol=>{
      var pos = capture.indexOf(symbol);
      if (pos >= 0) {
        return matches[pos + 1]
      }
      return
    }
    ;
    if (value = getMatch("S")) {
      date.sec = jstoi_q(value)
    }
    if (value = getMatch("M")) {
      date.min = jstoi_q(value)
    }
    if (value = getMatch("H")) {
      date.hour = jstoi_q(value)
    } else if (value = getMatch("I")) {
      var hour = jstoi_q(value);
      if (value = getMatch("p")) {
        hour += value.toUpperCase()[0] === "P" ? 12 : 0
      }
      date.hour = hour
    }
    if (value = getMatch("Y")) {
      date.year = jstoi_q(value)
    } else if (value = getMatch("y")) {
      var year = jstoi_q(value);
      if (value = getMatch("C")) {
        year += jstoi_q(value) * 100
      } else {
        year += year < 69 ? 2e3 : 1900
      }
      date.year = year
    }
    if (value = getMatch("m")) {
      date.month = jstoi_q(value) - 1
    } else if (value = getMatch("b")) {
      date.month = MONTH_NUMBERS[value.substring(0, 3).toUpperCase()] || 0
    }
    if (value = getMatch("d")) {
      date.day = jstoi_q(value)
    } else if (value = getMatch("j")) {
      var day = jstoi_q(value);
      var leapYear = isLeapYear(date.year);
      for (var month = 0; month < 12; ++month) {
        var daysUntilMonth = arraySum(leapYear ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR, month - 1);
        if (day <= daysUntilMonth + (leapYear ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR)[month]) {
          date.day = day - daysUntilMonth
        }
      }
    } else if (value = getMatch("a")) {
      var weekDay = value.substring(0, 3).toUpperCase();
      if (value = getMatch("U")) {
        var weekDayNumber = DAY_NUMBERS_SUN_FIRST[weekDay];
        var weekNumber = jstoi_q(value);
        var janFirst = new Date(date.year,0,1);
        var endDate;
        if (janFirst.getDay() === 0) {
          endDate = addDays(janFirst, weekDayNumber + 7 * (weekNumber - 1))
        } else {
          endDate = addDays(janFirst, 7 - janFirst.getDay() + weekDayNumber + 7 * (weekNumber - 1))
        }
        date.day = endDate.getDate();
        date.month = endDate.getMonth()
      } else if (value = getMatch("W")) {
        var weekDayNumber = DAY_NUMBERS_MON_FIRST[weekDay];
        var weekNumber = jstoi_q(value);
        var janFirst = new Date(date.year,0,1);
        var endDate;
        if (janFirst.getDay() === 1) {
          endDate = addDays(janFirst, weekDayNumber + 7 * (weekNumber - 1))
        } else {
          endDate = addDays(janFirst, 7 - janFirst.getDay() + 1 + weekDayNumber + 7 * (weekNumber - 1))
        }
        date.day = endDate.getDate();
        date.month = endDate.getMonth()
      }
    }
    var fullDate = new Date(date.year,date.month,date.day,date.hour,date.min,date.sec,0);
    GROWABLE_HEAP_I32()[tm >> 2] = fullDate.getSeconds();
    GROWABLE_HEAP_I32()[tm + 4 >> 2] = fullDate.getMinutes();
    GROWABLE_HEAP_I32()[tm + 8 >> 2] = fullDate.getHours();
    GROWABLE_HEAP_I32()[tm + 12 >> 2] = fullDate.getDate();
    GROWABLE_HEAP_I32()[tm + 16 >> 2] = fullDate.getMonth();
    GROWABLE_HEAP_I32()[tm + 20 >> 2] = fullDate.getFullYear() - 1900;
    GROWABLE_HEAP_I32()[tm + 24 >> 2] = fullDate.getDay();
    GROWABLE_HEAP_I32()[tm + 28 >> 2] = arraySum(isLeapYear(fullDate.getFullYear()) ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR, fullDate.getMonth() - 1) + fullDate.getDate() - 1;
    GROWABLE_HEAP_I32()[tm + 32 >> 2] = 0;
    return buf + intArrayFromString(matches[0]).length - 1
  }
  return 0
}
function stringToUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8(str, ret, size);
  return ret
}
function getCFunc(ident) {
  var func = Module["_" + ident];
  return func
}
function ccall(ident, returnType, argTypes, args, opts) {
  var toC = {
    "string": str=>{
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) {
        ret = stringToUTF8OnStack(str)
      }
      return ret
    }
    ,
    "array": arr=>{
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret
    }
  };
  function convertReturnValue(ret) {
    if (returnType === "string") {
      return UTF8ToString(ret)
    }
    if (returnType === "boolean")
      return Boolean(ret);
    return ret
  }
  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0)
          stack = stackSave();
        cArgs[i] = converter(args[i])
      } else {
        cArgs[i] = args[i]
      }
    }
  }
  var ret = func.apply(null, cArgs);
  function onDone(ret) {
    if (stack !== 0)
      stackRestore(stack);
    return convertReturnValue(ret)
  }
  ret = onDone(ret);
  return ret
}
function cwrap(ident, returnType, argTypes, opts) {
  var numericArgs = !argTypes || argTypes.every(type=>type === "number" || type === "boolean");
  var numericRet = returnType !== "string";
  if (numericRet && numericArgs && !opts) {
    return getCFunc(ident)
  }
  return function() {
    return ccall(ident, returnType, argTypes, arguments, opts)
  }
}
PThread.init();
var FSNode = function(parent, name, mode, rdev) {
  if (!parent) {
    parent = this
  }
  this.parent = parent;
  this.mount = parent.mount;
  this.mounted = null;
  this.id = FS.nextInode++;
  this.name = name;
  this.mode = mode;
  this.node_ops = {};
  this.stream_ops = {};
  this.rdev = rdev
};
var readMode = 292 | 73;
var writeMode = 146;
Object.defineProperties(FSNode.prototype, {
  read: {
    get: function() {
      return (this.mode & readMode) === readMode
    },
    set: function(val) {
      val ? this.mode |= readMode : this.mode &= ~readMode
    }
  },
  write: {
    get: function() {
      return (this.mode & writeMode) === writeMode
    },
    set: function(val) {
      val ? this.mode |= writeMode : this.mode &= ~writeMode
    }
  },
  isFolder: {
    get: function() {
      return FS.isDir(this.mode)
    }
  },
  isDevice: {
    get: function() {
      return FS.isChrdev(this.mode)
    }
  }
});
FS.FSNode = FSNode;
FS.staticInit();
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_unlink"] = FS.unlink;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createDevice"] = FS.createDevice;
embind_init_charCodes();
BindingError = Module["BindingError"] = extendError(Error, "BindingError");
InternalError = Module["InternalError"] = extendError(Error, "InternalError");
init_emval();
UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
Module["requestFullscreen"] = function Module_requestFullscreen(lockPointer, resizeCanvas) {
  Browser.requestFullscreen(lockPointer, resizeCanvas)
}
;
Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) {
  Browser.requestAnimationFrame(func)
}
;
Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) {
  Browser.setCanvasSize(width, height, noUpdates)
}
;
Module["pauseMainLoop"] = function Module_pauseMainLoop() {
  Browser.mainLoop.pause()
}
;
Module["resumeMainLoop"] = function Module_resumeMainLoop() {
  Browser.mainLoop.resume()
}
;
Module["getUserMedia"] = function Module_getUserMedia() {
  Browser.getUserMedia()
}
;
Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
  return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes)
}
;
var preloadedImages = {};
var preloadedAudios = {};
var GLctx;
for (var i = 0; i < 32; ++i)
  tempFixedLengthArray.push(new Array(i));
var miniTempWebGLFloatBuffersStorage = new Float32Array(288);
for (var i = 0; i < 288; ++i) {
  miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(0, i + 1)
}
var miniTempWebGLIntBuffersStorage = new Int32Array(288);
for (var i = 0; i < 288; ++i) {
  miniTempWebGLIntBuffers[i] = miniTempWebGLIntBuffersStorage.subarray(0, i + 1)
}
if (!ENVIRONMENT_IS_PTHREAD)
  Fetch.staticInit();
var proxiedFunctionTable = [null, _proc_exit, exitOnMainThread, pthreadCreateProxied, ___syscall_faccessat, ___syscall_fcntl64, ___syscall_fstat64, ___syscall_getcwd, ___syscall_ioctl, ___syscall_lstat64, ___syscall_newfstatat, ___syscall_openat, ___syscall_stat64, __mmap_js, __munmap_js, __setitimer_js, _eglChooseConfig, _eglCreateContext, _eglCreateWindowSurface, _eglDestroyContext, _eglDestroySurface, _eglGetCurrentContext, _eglGetCurrentDisplay, _eglGetCurrentSurface, _eglGetDisplay, _eglInitialize, _eglMakeCurrent, _eglReleaseThread, _eglSwapBuffers, _emscripten_exit_pointerlock, _emscripten_get_canvas_size, _emscripten_get_device_pixel_ratio, _emscripten_get_pointerlock_status, _emscripten_request_pointerlock, _emscripten_set_keydown_callback_on_thread, _emscripten_set_keypress_callback_on_thread, _emscripten_set_keyup_callback_on_thread, _emscripten_set_mousedown_callback_on_thread, _emscripten_set_mouseleave_callback_on_thread, _emscripten_set_mousemove_callback_on_thread, _emscripten_set_mouseup_callback_on_thread, _emscripten_set_touchcancel_callback_on_thread, _emscripten_set_touchend_callback_on_thread, _emscripten_set_touchmove_callback_on_thread, _emscripten_set_touchstart_callback_on_thread, _emscripten_set_webglcontextlost_callback_on_thread, _emscripten_set_wheel_callback_on_thread, _environ_get, _environ_sizes_get, _fd_close, _fd_read, _fd_seek, _fd_write];
var wasmImports = {
  "Eg": HaveOffsetConverter,
  "Dg": ___call_sighandler,
  "K": ___cxa_throw,
  "Cg": ___emscripten_init_main_thread_js,
  "ca": ___emscripten_thread_cleanup,
  "Bg": ___pthread_create_js,
  "Ag": ___syscall_faccessat,
  "ba": ___syscall_fcntl64,
  "zg": ___syscall_getcwd,
  "yg": ___syscall_ioctl,
  "aa": ___syscall_openat,
  "xg": ___syscall_stat64,
  "fa": __embind_register_bigint,
  "tg": __embind_register_bool,
  "sg": __embind_register_emval,
  "_": __embind_register_float,
  "f": __embind_register_function,
  "A": __embind_register_integer,
  "q": __embind_register_memory_view,
  "Z": __embind_register_std_string,
  "H": __embind_register_std_wstring,
  "rg": __embind_register_void,
  "qg": __emscripten_default_pthread_stack_size,
  "pg": __emscripten_err,
  "og": __emscripten_fetch_free,
  "ng": __emscripten_fetch_get_response_headers,
  "mg": __emscripten_fetch_get_response_headers_length,
  "lg": __emscripten_get_now_is_monotonic,
  "kg": __emscripten_notify_mailbox_postmessage,
  "jg": __emscripten_set_offscreencanvas_size,
  "ig": __emscripten_thread_mailbox_await,
  "hg": __emscripten_throw_longjmp,
  "m": __emval_as,
  "x": __emval_call_method,
  "i": __emval_call_void_method,
  "c": __emval_decref,
  "k": __emval_equals,
  "Y": __emval_get_global,
  "h": __emval_get_method_caller,
  "o": __emval_get_property,
  "d": __emval_incref,
  "gg": __emval_new_array,
  "t": __emval_new_cstring,
  "X": __emval_new_object,
  "l": __emval_run_destructors,
  "w": __emval_set_property,
  "g": __emval_take_value,
  "fg": __emval_typeof,
  "eg": __gmtime_js,
  "dg": __localtime_js,
  "cg": __mktime_js,
  "bg": __mmap_js,
  "ag": __munmap_js,
  "W": __setitimer_js,
  "$f": __tzset_js,
  "b": _abort,
  "V": _eglChooseConfig,
  "_f": _eglCreateContext,
  "Zf": _eglCreateWindowSurface,
  "U": _eglDestroyContext,
  "T": _eglDestroySurface,
  "Yf": _eglGetCurrentContext,
  "Xf": _eglGetCurrentDisplay,
  "E": _eglGetCurrentSurface,
  "Wf": _eglGetDisplay,
  "Vf": _eglInitialize,
  "Uf": _eglMakeCurrent,
  "Tf": _eglReleaseThread,
  "Sf": _eglSwapBuffers,
  "Rf": em_severity_log,
  "Qf": _emscripten_asm_const_async_on_main_thread,
  "s": _emscripten_asm_const_int,
  "Pf": _emscripten_asm_const_int_sync_on_main_thread,
  "e": _emscripten_async_call,
  "S": _emscripten_check_blocking_allowed,
  "G": _emscripten_date_now,
  "R": _emscripten_exit_pointerlock,
  "Q": _emscripten_exit_with_live_runtime,
  "Of": _emscripten_get_canvas_size,
  "y": _emscripten_get_device_pixel_ratio,
  "Nf": _emscripten_get_heap_max,
  "p": _emscripten_get_now,
  "Mf": _emscripten_get_pointerlock_status,
  "Lf": _emscripten_glActiveTexture,
  "Kf": _emscripten_glAttachShader,
  "Jf": _emscripten_glBeginQuery,
  "If": _emscripten_glBeginQueryEXT,
  "Hf": _emscripten_glBeginTransformFeedback,
  "Gf": _emscripten_glBindAttribLocation,
  "Ff": _emscripten_glBindBuffer,
  "Ef": _emscripten_glBindBufferBase,
  "Df": _emscripten_glBindBufferRange,
  "Cf": _emscripten_glBindFramebuffer,
  "Bf": _emscripten_glBindRenderbuffer,
  "Af": _emscripten_glBindSampler,
  "zf": _emscripten_glBindTexture,
  "yf": _emscripten_glBindTransformFeedback,
  "xf": _emscripten_glBindVertexArray,
  "wf": _emscripten_glBindVertexArrayOES,
  "vf": _emscripten_glBlendColor,
  "uf": _emscripten_glBlendEquation,
  "tf": _emscripten_glBlendEquationSeparate,
  "sf": _emscripten_glBlendFunc,
  "rf": _emscripten_glBlendFuncSeparate,
  "qf": _emscripten_glBlitFramebuffer,
  "pf": _emscripten_glBufferData,
  "of": _emscripten_glBufferSubData,
  "nf": _emscripten_glCheckFramebufferStatus,
  "mf": _emscripten_glClear,
  "lf": _emscripten_glClearBufferfi,
  "kf": _emscripten_glClearBufferfv,
  "jf": _emscripten_glClearBufferiv,
  "hf": _emscripten_glClearBufferuiv,
  "gf": _emscripten_glClearColor,
  "ff": _emscripten_glClearDepthf,
  "ef": _emscripten_glClearStencil,
  "df": _emscripten_glClientWaitSync,
  "cf": _emscripten_glColorMask,
  "bf": _emscripten_glCompileShader,
  "af": _emscripten_glCompressedTexImage2D,
  "$e": _emscripten_glCompressedTexImage3D,
  "_e": _emscripten_glCompressedTexSubImage2D,
  "Ze": _emscripten_glCompressedTexSubImage3D,
  "Ye": _emscripten_glCopyBufferSubData,
  "Xe": _emscripten_glCopyTexImage2D,
  "We": _emscripten_glCopyTexSubImage2D,
  "Ve": _emscripten_glCopyTexSubImage3D,
  "Ue": _emscripten_glCreateProgram,
  "Te": _emscripten_glCreateShader,
  "Se": _emscripten_glCullFace,
  "Re": _emscripten_glDeleteBuffers,
  "Qe": _emscripten_glDeleteFramebuffers,
  "Pe": _emscripten_glDeleteProgram,
  "Oe": _emscripten_glDeleteQueries,
  "Ne": _emscripten_glDeleteQueriesEXT,
  "Me": _emscripten_glDeleteRenderbuffers,
  "Le": _emscripten_glDeleteSamplers,
  "Ke": _emscripten_glDeleteShader,
  "Je": _emscripten_glDeleteSync,
  "Ie": _emscripten_glDeleteTextures,
  "He": _emscripten_glDeleteTransformFeedbacks,
  "Ge": _emscripten_glDeleteVertexArrays,
  "Fe": _emscripten_glDeleteVertexArraysOES,
  "Ee": _emscripten_glDepthFunc,
  "De": _emscripten_glDepthMask,
  "Ce": _emscripten_glDepthRangef,
  "Be": _emscripten_glDetachShader,
  "Ae": _emscripten_glDisable,
  "ze": _emscripten_glDisableVertexAttribArray,
  "ye": _emscripten_glDrawArrays,
  "xe": _emscripten_glDrawArraysInstanced,
  "we": _emscripten_glDrawArraysInstancedANGLE,
  "ve": _emscripten_glDrawArraysInstancedARB,
  "ue": _emscripten_glDrawArraysInstancedEXT,
  "te": _emscripten_glDrawArraysInstancedNV,
  "se": _emscripten_glDrawBuffers,
  "re": _emscripten_glDrawBuffersEXT,
  "qe": _emscripten_glDrawBuffersWEBGL,
  "pe": _emscripten_glDrawElements,
  "oe": _emscripten_glDrawElementsInstanced,
  "ne": _emscripten_glDrawElementsInstancedANGLE,
  "me": _emscripten_glDrawElementsInstancedARB,
  "le": _emscripten_glDrawElementsInstancedEXT,
  "ke": _emscripten_glDrawElementsInstancedNV,
  "je": _emscripten_glDrawRangeElements,
  "ie": _emscripten_glEnable,
  "he": _emscripten_glEnableVertexAttribArray,
  "ge": _emscripten_glEndQuery,
  "fe": _emscripten_glEndQueryEXT,
  "ee": _emscripten_glEndTransformFeedback,
  "de": _emscripten_glFenceSync,
  "ce": _emscripten_glFinish,
  "be": _emscripten_glFlush,
  "ae": _emscripten_glFramebufferRenderbuffer,
  "$d": _emscripten_glFramebufferTexture2D,
  "_d": _emscripten_glFramebufferTextureLayer,
  "Zd": _emscripten_glFrontFace,
  "Yd": _emscripten_glGenBuffers,
  "Xd": _emscripten_glGenFramebuffers,
  "Wd": _emscripten_glGenQueries,
  "Vd": _emscripten_glGenQueriesEXT,
  "Ud": _emscripten_glGenRenderbuffers,
  "Td": _emscripten_glGenSamplers,
  "Sd": _emscripten_glGenTextures,
  "Rd": _emscripten_glGenTransformFeedbacks,
  "Qd": _emscripten_glGenVertexArrays,
  "Pd": _emscripten_glGenVertexArraysOES,
  "Od": _emscripten_glGenerateMipmap,
  "Nd": _emscripten_glGetActiveAttrib,
  "Md": _emscripten_glGetActiveUniform,
  "Ld": _emscripten_glGetActiveUniformBlockName,
  "Kd": _emscripten_glGetActiveUniformBlockiv,
  "Jd": _emscripten_glGetActiveUniformsiv,
  "Id": _emscripten_glGetAttachedShaders,
  "Hd": _emscripten_glGetAttribLocation,
  "Gd": _emscripten_glGetBooleanv,
  "Fd": _emscripten_glGetBufferParameteri64v,
  "Ed": _emscripten_glGetBufferParameteriv,
  "Dd": _emscripten_glGetError,
  "Cd": _emscripten_glGetFloatv,
  "Bd": _emscripten_glGetFragDataLocation,
  "Ad": _emscripten_glGetFramebufferAttachmentParameteriv,
  "zd": _emscripten_glGetInteger64i_v,
  "yd": _emscripten_glGetInteger64v,
  "xd": _emscripten_glGetIntegeri_v,
  "wd": _emscripten_glGetIntegerv,
  "vd": _emscripten_glGetInternalformativ,
  "ud": _emscripten_glGetProgramBinary,
  "td": _emscripten_glGetProgramInfoLog,
  "sd": _emscripten_glGetProgramiv,
  "rd": _emscripten_glGetQueryObjecti64vEXT,
  "qd": _emscripten_glGetQueryObjectivEXT,
  "pd": _emscripten_glGetQueryObjectui64vEXT,
  "od": _emscripten_glGetQueryObjectuiv,
  "nd": _emscripten_glGetQueryObjectuivEXT,
  "md": _emscripten_glGetQueryiv,
  "ld": _emscripten_glGetQueryivEXT,
  "kd": _emscripten_glGetRenderbufferParameteriv,
  "jd": _emscripten_glGetSamplerParameterfv,
  "id": _emscripten_glGetSamplerParameteriv,
  "hd": _emscripten_glGetShaderInfoLog,
  "gd": _emscripten_glGetShaderPrecisionFormat,
  "fd": _emscripten_glGetShaderSource,
  "ed": _emscripten_glGetShaderiv,
  "dd": _emscripten_glGetString,
  "cd": _emscripten_glGetStringi,
  "bd": _emscripten_glGetSynciv,
  "ad": _emscripten_glGetTexParameterfv,
  "$c": _emscripten_glGetTexParameteriv,
  "_c": _emscripten_glGetTransformFeedbackVarying,
  "Zc": _emscripten_glGetUniformBlockIndex,
  "Yc": _emscripten_glGetUniformIndices,
  "Xc": _emscripten_glGetUniformLocation,
  "Wc": _emscripten_glGetUniformfv,
  "Vc": _emscripten_glGetUniformiv,
  "Uc": _emscripten_glGetUniformuiv,
  "Tc": _emscripten_glGetVertexAttribIiv,
  "Sc": _emscripten_glGetVertexAttribIuiv,
  "Rc": _emscripten_glGetVertexAttribPointerv,
  "Qc": _emscripten_glGetVertexAttribfv,
  "Pc": _emscripten_glGetVertexAttribiv,
  "Oc": _emscripten_glHint,
  "Nc": _emscripten_glInvalidateFramebuffer,
  "Mc": _emscripten_glInvalidateSubFramebuffer,
  "Lc": _emscripten_glIsBuffer,
  "Kc": _emscripten_glIsEnabled,
  "Jc": _emscripten_glIsFramebuffer,
  "Ic": _emscripten_glIsProgram,
  "Hc": _emscripten_glIsQuery,
  "Gc": _emscripten_glIsQueryEXT,
  "Fc": _emscripten_glIsRenderbuffer,
  "Ec": _emscripten_glIsSampler,
  "Dc": _emscripten_glIsShader,
  "Cc": _emscripten_glIsSync,
  "Bc": _emscripten_glIsTexture,
  "Ac": _emscripten_glIsTransformFeedback,
  "zc": _emscripten_glIsVertexArray,
  "yc": _emscripten_glIsVertexArrayOES,
  "xc": _emscripten_glLineWidth,
  "wc": _emscripten_glLinkProgram,
  "vc": _emscripten_glPauseTransformFeedback,
  "uc": _emscripten_glPixelStorei,
  "tc": _emscripten_glPolygonOffset,
  "sc": _emscripten_glProgramBinary,
  "rc": _emscripten_glProgramParameteri,
  "qc": _emscripten_glQueryCounterEXT,
  "pc": _emscripten_glReadBuffer,
  "oc": _emscripten_glReadPixels,
  "nc": _emscripten_glReleaseShaderCompiler,
  "mc": _emscripten_glRenderbufferStorage,
  "lc": _emscripten_glRenderbufferStorageMultisample,
  "kc": _emscripten_glResumeTransformFeedback,
  "jc": _emscripten_glSampleCoverage,
  "ic": _emscripten_glSamplerParameterf,
  "hc": _emscripten_glSamplerParameterfv,
  "gc": _emscripten_glSamplerParameteri,
  "fc": _emscripten_glSamplerParameteriv,
  "ec": _emscripten_glScissor,
  "dc": _emscripten_glShaderBinary,
  "cc": _emscripten_glShaderSource,
  "bc": _emscripten_glStencilFunc,
  "ac": _emscripten_glStencilFuncSeparate,
  "$b": _emscripten_glStencilMask,
  "_b": _emscripten_glStencilMaskSeparate,
  "Zb": _emscripten_glStencilOp,
  "Yb": _emscripten_glStencilOpSeparate,
  "Xb": _emscripten_glTexImage2D,
  "Wb": _emscripten_glTexImage3D,
  "Vb": _emscripten_glTexParameterf,
  "Ub": _emscripten_glTexParameterfv,
  "Tb": _emscripten_glTexParameteri,
  "Sb": _emscripten_glTexParameteriv,
  "Rb": _emscripten_glTexStorage2D,
  "Qb": _emscripten_glTexStorage3D,
  "Pb": _emscripten_glTexSubImage2D,
  "Ob": _emscripten_glTexSubImage3D,
  "Nb": _emscripten_glTransformFeedbackVaryings,
  "Mb": _emscripten_glUniform1f,
  "Lb": _emscripten_glUniform1fv,
  "Kb": _emscripten_glUniform1i,
  "Jb": _emscripten_glUniform1iv,
  "Ib": _emscripten_glUniform1ui,
  "Hb": _emscripten_glUniform1uiv,
  "Gb": _emscripten_glUniform2f,
  "Fb": _emscripten_glUniform2fv,
  "Eb": _emscripten_glUniform2i,
  "Db": _emscripten_glUniform2iv,
  "Cb": _emscripten_glUniform2ui,
  "Bb": _emscripten_glUniform2uiv,
  "Ab": _emscripten_glUniform3f,
  "zb": _emscripten_glUniform3fv,
  "yb": _emscripten_glUniform3i,
  "xb": _emscripten_glUniform3iv,
  "wb": _emscripten_glUniform3ui,
  "vb": _emscripten_glUniform3uiv,
  "ub": _emscripten_glUniform4f,
  "tb": _emscripten_glUniform4fv,
  "sb": _emscripten_glUniform4i,
  "rb": _emscripten_glUniform4iv,
  "qb": _emscripten_glUniform4ui,
  "pb": _emscripten_glUniform4uiv,
  "ob": _emscripten_glUniformBlockBinding,
  "nb": _emscripten_glUniformMatrix2fv,
  "mb": _emscripten_glUniformMatrix2x3fv,
  "lb": _emscripten_glUniformMatrix2x4fv,
  "kb": _emscripten_glUniformMatrix3fv,
  "jb": _emscripten_glUniformMatrix3x2fv,
  "ib": _emscripten_glUniformMatrix3x4fv,
  "hb": _emscripten_glUniformMatrix4fv,
  "gb": _emscripten_glUniformMatrix4x2fv,
  "fb": _emscripten_glUniformMatrix4x3fv,
  "eb": _emscripten_glUseProgram,
  "db": _emscripten_glValidateProgram,
  "cb": _emscripten_glVertexAttrib1f,
  "bb": _emscripten_glVertexAttrib1fv,
  "ab": _emscripten_glVertexAttrib2f,
  "$a": _emscripten_glVertexAttrib2fv,
  "_a": _emscripten_glVertexAttrib3f,
  "Za": _emscripten_glVertexAttrib3fv,
  "Ya": _emscripten_glVertexAttrib4f,
  "Xa": _emscripten_glVertexAttrib4fv,
  "Wa": _emscripten_glVertexAttribDivisor,
  "Va": _emscripten_glVertexAttribDivisorANGLE,
  "Ua": _emscripten_glVertexAttribDivisorARB,
  "Ta": _emscripten_glVertexAttribDivisorEXT,
  "Sa": _emscripten_glVertexAttribDivisorNV,
  "Ra": _emscripten_glVertexAttribI4i,
  "Qa": _emscripten_glVertexAttribI4iv,
  "Pa": _emscripten_glVertexAttribI4ui,
  "Oa": _emscripten_glVertexAttribI4uiv,
  "Na": _emscripten_glVertexAttribIPointer,
  "Ma": _emscripten_glVertexAttribPointer,
  "La": _emscripten_glViewport,
  "Ka": _emscripten_glWaitSync,
  "Ja": _emscripten_memcpy_big,
  "Ia": _emscripten_num_logical_cores,
  "Ha": _emscripten_pc_get_function,
  "Ga": _emscripten_receive_on_main_thread_js,
  "P": _emscripten_request_pointerlock,
  "Fa": _emscripten_resize_heap,
  "Ea": _emscripten_set_keydown_callback_on_thread,
  "Da": _emscripten_set_keypress_callback_on_thread,
  "Ca": _emscripten_set_keyup_callback_on_thread,
  "Ba": _emscripten_set_main_loop,
  "Aa": _emscripten_set_main_loop_arg,
  "za": _emscripten_set_mousedown_callback_on_thread,
  "ya": _emscripten_set_mouseleave_callback_on_thread,
  "xa": _emscripten_set_mousemove_callback_on_thread,
  "wa": _emscripten_set_mouseup_callback_on_thread,
  "va": _emscripten_set_touchcancel_callback_on_thread,
  "ua": _emscripten_set_touchend_callback_on_thread,
  "ta": _emscripten_set_touchmove_callback_on_thread,
  "sa": _emscripten_set_touchstart_callback_on_thread,
  "ra": _emscripten_set_webglcontextlost_callback_on_thread,
  "qa": _emscripten_set_wheel_callback_on_thread,
  "pa": _emscripten_stack_snapshot,
  "oa": _emscripten_stack_unwind_buffer,
  "na": _emscripten_start_fetch,
  "ma": _emscripten_webgl_create_context,
  "la": _emscripten_webgl_init_context_attributes,
  "ka": _emscripten_webgl_make_context_current,
  "wg": _environ_get,
  "vg": _environ_sizes_get,
  "j": _exit,
  "J": _fd_close,
  "$": _fd_read,
  "ga": _fd_seek,
  "I": _fd_write,
  "ja": _getentropy,
  "ia": invoke_i,
  "r": invoke_ii,
  "v": invoke_iii,
  "B": invoke_iiii,
  "O": invoke_iiiii,
  "N": invoke_iiiiii,
  "ea": invoke_iij,
  "n": invoke_vi,
  "z": invoke_vii,
  "D": invoke_viii,
  "u": invoke_viiii,
  "F": invoke_viiiii,
  "ha": invoke_viiiiii,
  "M": invoke_viiiiiiii,
  "a": wasmMemory,
  "ug": _proc_exit,
  "C": _strftime,
  "da": _strftime_l,
  "L": _strptime
};
var asm = createWasm();
var ___wasm_call_ctors = function() {
  return (___wasm_call_ctors = Module["asm"]["Fg"]).apply(null, arguments)
};
var _ResizeViewport = Module["_ResizeViewport"] = function() {
  return (_ResizeViewport = Module["_ResizeViewport"] = Module["asm"]["Hg"]).apply(null, arguments)
}
;
var _Redraw = Module["_Redraw"] = function() {
  return (_Redraw = Module["_Redraw"] = Module["asm"]["Ig"]).apply(null, arguments)
}
;
var _main = Module["_main"] = function() {
  return (_main = Module["_main"] = Module["asm"]["Jg"]).apply(null, arguments)
}
;
var ___getTypeName = Module["___getTypeName"] = function() {
  return (___getTypeName = Module["___getTypeName"] = Module["asm"]["Kg"]).apply(null, arguments)
}
;
var __embind_initialize_bindings = Module["__embind_initialize_bindings"] = function() {
  return (__embind_initialize_bindings = Module["__embind_initialize_bindings"] = Module["asm"]["Lg"]).apply(null, arguments)
}
;
var _emscripten_dispatch_to_thread_ = function() {
  return (_emscripten_dispatch_to_thread_ = Module["asm"]["Mg"]).apply(null, arguments)
};
var _malloc = Module["_malloc"] = function() {
  return (_malloc = Module["_malloc"] = Module["asm"]["Ng"]).apply(null, arguments)
}
;
var _free = function() {
  return (_free = Module["asm"]["Og"]).apply(null, arguments)
};
var _saveSetjmp = function() {
  return (_saveSetjmp = Module["asm"]["saveSetjmp"]).apply(null, arguments)
};
var _pthread_self = Module["_pthread_self"] = function() {
  return (_pthread_self = Module["_pthread_self"] = Module["asm"]["Pg"]).apply(null, arguments)
}
;
var ___errno_location = function() {
  return (___errno_location = Module["asm"]["Qg"]).apply(null, arguments)
};
var __emscripten_tls_init = Module["__emscripten_tls_init"] = function() {
  return (__emscripten_tls_init = Module["__emscripten_tls_init"] = Module["asm"]["Rg"]).apply(null, arguments)
}
;
var _emscripten_builtin_memalign = function() {
  return (_emscripten_builtin_memalign = Module["asm"]["Sg"]).apply(null, arguments)
};
var ___funcs_on_exit = function() {
  return (___funcs_on_exit = Module["asm"]["Tg"]).apply(null, arguments)
};
var __emscripten_timeout = function() {
  return (__emscripten_timeout = Module["asm"]["Ug"]).apply(null, arguments)
};
var _htonl = function() {
  return (_htonl = Module["asm"]["htonl"]).apply(null, arguments)
};
var _htons = function() {
  return (_htons = Module["asm"]["htons"]).apply(null, arguments)
};
var _ntohs = function() {
  return (_ntohs = Module["asm"]["ntohs"]).apply(null, arguments)
};
var _fflush = Module["_fflush"] = function() {
  return (_fflush = Module["_fflush"] = Module["asm"]["Vg"]).apply(null, arguments)
}
;
var __emscripten_thread_init = Module["__emscripten_thread_init"] = function() {
  return (__emscripten_thread_init = Module["__emscripten_thread_init"] = Module["asm"]["Wg"]).apply(null, arguments)
}
;
var __emscripten_thread_crashed = Module["__emscripten_thread_crashed"] = function() {
  return (__emscripten_thread_crashed = Module["__emscripten_thread_crashed"] = Module["asm"]["Xg"]).apply(null, arguments)
}
;
var _emscripten_main_thread_process_queued_calls = function() {
  return (_emscripten_main_thread_process_queued_calls = Module["asm"]["emscripten_main_thread_process_queued_calls"]).apply(null, arguments)
};
var _emscripten_main_runtime_thread_id = function() {
  return (_emscripten_main_runtime_thread_id = Module["asm"]["emscripten_main_runtime_thread_id"]).apply(null, arguments)
};
var __emscripten_run_in_main_runtime_thread_js = function() {
  return (__emscripten_run_in_main_runtime_thread_js = Module["asm"]["Yg"]).apply(null, arguments)
};
var __emscripten_thread_free_data = function() {
  return (__emscripten_thread_free_data = Module["asm"]["Zg"]).apply(null, arguments)
};
var __emscripten_thread_exit = Module["__emscripten_thread_exit"] = function() {
  return (__emscripten_thread_exit = Module["__emscripten_thread_exit"] = Module["asm"]["_g"]).apply(null, arguments)
}
;
var __emscripten_check_mailbox = Module["__emscripten_check_mailbox"] = function() {
  return (__emscripten_check_mailbox = Module["__emscripten_check_mailbox"] = Module["asm"]["$g"]).apply(null, arguments)
}
;
var _setThrew = function() {
  return (_setThrew = Module["asm"]["ah"]).apply(null, arguments)
};
var _emscripten_stack_set_limits = function() {
  return (_emscripten_stack_set_limits = Module["asm"]["bh"]).apply(null, arguments)
};
var stackSave = function() {
  return (stackSave = Module["asm"]["ch"]).apply(null, arguments)
};
var stackRestore = function() {
  return (stackRestore = Module["asm"]["dh"]).apply(null, arguments)
};
var stackAlloc = function() {
  return (stackAlloc = Module["asm"]["eh"]).apply(null, arguments)
};
var ___cxa_is_pointer_type = function() {
  return (___cxa_is_pointer_type = Module["asm"]["fh"]).apply(null, arguments)
};
var dynCall_iiiijij = Module["dynCall_iiiijij"] = function() {
  return (dynCall_iiiijij = Module["dynCall_iiiijij"] = Module["asm"]["gh"]).apply(null, arguments)
}
;
var dynCall_jii = Module["dynCall_jii"] = function() {
  return (dynCall_jii = Module["dynCall_jii"] = Module["asm"]["hh"]).apply(null, arguments)
}
;
var dynCall_viji = Module["dynCall_viji"] = function() {
  return (dynCall_viji = Module["dynCall_viji"] = Module["asm"]["ih"]).apply(null, arguments)
}
;
var dynCall_ji = Module["dynCall_ji"] = function() {
  return (dynCall_ji = Module["dynCall_ji"] = Module["asm"]["jh"]).apply(null, arguments)
}
;
var dynCall_iiiji = Module["dynCall_iiiji"] = function() {
  return (dynCall_iiiji = Module["dynCall_iiiji"] = Module["asm"]["kh"]).apply(null, arguments)
}
;
var dynCall_iij = Module["dynCall_iij"] = function() {
  return (dynCall_iij = Module["dynCall_iij"] = Module["asm"]["lh"]).apply(null, arguments)
}
;
var dynCall_iiji = Module["dynCall_iiji"] = function() {
  return (dynCall_iiji = Module["dynCall_iiji"] = Module["asm"]["mh"]).apply(null, arguments)
}
;
var dynCall_iiij = Module["dynCall_iiij"] = function() {
  return (dynCall_iiij = Module["dynCall_iiij"] = Module["asm"]["nh"]).apply(null, arguments)
}
;
var dynCall_viijii = Module["dynCall_viijii"] = function() {
  return (dynCall_viijii = Module["dynCall_viijii"] = Module["asm"]["oh"]).apply(null, arguments)
}
;
var dynCall_vij = Module["dynCall_vij"] = function() {
  return (dynCall_vij = Module["dynCall_vij"] = Module["asm"]["ph"]).apply(null, arguments)
}
;
var dynCall_vijjj = Module["dynCall_vijjj"] = function() {
  return (dynCall_vijjj = Module["dynCall_vijjj"] = Module["asm"]["qh"]).apply(null, arguments)
}
;
var dynCall_vj = Module["dynCall_vj"] = function() {
  return (dynCall_vj = Module["dynCall_vj"] = Module["asm"]["rh"]).apply(null, arguments)
}
;
var dynCall_viij = Module["dynCall_viij"] = function() {
  return (dynCall_viij = Module["dynCall_viij"] = Module["asm"]["sh"]).apply(null, arguments)
}
;
var dynCall_viiiiij = Module["dynCall_viiiiij"] = function() {
  return (dynCall_viiiiij = Module["dynCall_viiiiij"] = Module["asm"]["th"]).apply(null, arguments)
}
;
var dynCall_iijjiiii = Module["dynCall_iijjiiii"] = function() {
  return (dynCall_iijjiiii = Module["dynCall_iijjiiii"] = Module["asm"]["uh"]).apply(null, arguments)
}
;
var dynCall_jiji = Module["dynCall_jiji"] = function() {
  return (dynCall_jiji = Module["dynCall_jiji"] = Module["asm"]["vh"]).apply(null, arguments)
}
;
var dynCall_iiiiij = Module["dynCall_iiiiij"] = function() {
  return (dynCall_iiiiij = Module["dynCall_iiiiij"] = Module["asm"]["wh"]).apply(null, arguments)
}
;
var dynCall_iiiiijj = Module["dynCall_iiiiijj"] = function() {
  return (dynCall_iiiiijj = Module["dynCall_iiiiijj"] = Module["asm"]["xh"]).apply(null, arguments)
}
;
var dynCall_iiiiiijj = Module["dynCall_iiiiiijj"] = function() {
  return (dynCall_iiiiiijj = Module["dynCall_iiiiiijj"] = Module["asm"]["yh"]).apply(null, arguments)
}
;
var dynCall_jijj = Module["dynCall_jijj"] = function() {
  return (dynCall_jijj = Module["dynCall_jijj"] = Module["asm"]["zh"]).apply(null, arguments)
}
;
var dynCall_vijj = Module["dynCall_vijj"] = function() {
  return (dynCall_vijj = Module["dynCall_vijj"] = Module["asm"]["Ah"]).apply(null, arguments)
}
;
var dynCall_iijjii = Module["dynCall_iijjii"] = function() {
  return (dynCall_iijjii = Module["dynCall_iijjii"] = Module["asm"]["Bh"]).apply(null, arguments)
}
;
var dynCall_viiiji = Module["dynCall_viiiji"] = function() {
  return (dynCall_viiiji = Module["dynCall_viiiji"] = Module["asm"]["Ch"]).apply(null, arguments)
}
;
var dynCall_jiiiiii = Module["dynCall_jiiiiii"] = function() {
  return (dynCall_jiiiiii = Module["dynCall_jiiiiii"] = Module["asm"]["Dh"]).apply(null, arguments)
}
;
var dynCall_jiiiii = Module["dynCall_jiiiii"] = function() {
  return (dynCall_jiiiii = Module["dynCall_jiiiii"] = Module["asm"]["Eh"]).apply(null, arguments)
}
;
var dynCall_iiiij = Module["dynCall_iiiij"] = function() {
  return (dynCall_iiiij = Module["dynCall_iiiij"] = Module["asm"]["Fh"]).apply(null, arguments)
}
;
var dynCall_iiiiiiijiiiiiii = Module["dynCall_iiiiiiijiiiiiii"] = function() {
  return (dynCall_iiiiiiijiiiiiii = Module["dynCall_iiiiiiijiiiiiii"] = Module["asm"]["Gh"]).apply(null, arguments)
}
;
var dynCall_viiiijii = Module["dynCall_viiiijii"] = function() {
  return (dynCall_viiiijii = Module["dynCall_viiiijii"] = Module["asm"]["Hh"]).apply(null, arguments)
}
;
var ___start_em_js = Module["___start_em_js"] = 5822659;
var ___stop_em_js = Module["___stop_em_js"] = 5823182;
function invoke_vi(index, a1) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1)
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0)
      throw e;
    _setThrew(1, 0)
  }
}
function invoke_viii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3)
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0)
      throw e;
    _setThrew(1, 0)
  }
}
function invoke_ii(index, a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1)
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0)
      throw e;
    _setThrew(1, 0)
  }
}
function invoke_vii(index, a1, a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2)
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0)
      throw e;
    _setThrew(1, 0)
  }
}
function invoke_i(index) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)()
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0)
      throw e;
    _setThrew(1, 0)
  }
}
function invoke_iii(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2)
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0)
      throw e;
    _setThrew(1, 0)
  }
}
function invoke_viiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4)
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0)
      throw e;
    _setThrew(1, 0)
  }
}
function invoke_iiiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4)
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0)
      throw e;
    _setThrew(1, 0)
  }
}
function invoke_iiii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3)
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0)
      throw e;
    _setThrew(1, 0)
  }
}
function invoke_viiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8)
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0)
      throw e;
    _setThrew(1, 0)
  }
}
function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5)
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0)
      throw e;
    _setThrew(1, 0)
  }
}
function invoke_viiiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5)
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0)
      throw e;
    _setThrew(1, 0)
  }
}
function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6)
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0)
      throw e;
    _setThrew(1, 0)
  }
}
function invoke_iij(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return dynCall_iij(index, a1, a2, a3)
  } catch (e) {
    stackRestore(sp);
    if (e !== e + 0)
      throw e;
    _setThrew(1, 0)
  }
}
Module["addRunDependency"] = addRunDependency;
Module["removeRunDependency"] = removeRunDependency;
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createDevice"] = FS.createDevice;
Module["FS_unlink"] = FS.unlink;
Module["keepRuntimeAlive"] = keepRuntimeAlive;
Module["wasmMemory"] = wasmMemory;
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;
Module["ExitStatus"] = ExitStatus;
Module["GL"] = GL;
var calledRun;
dependenciesFulfilled = function runCaller() {
  if (!calledRun)
    run();
  if (!calledRun)
    dependenciesFulfilled = runCaller
}
;
function callMain(args=[]) {
  var entryFunction = _main;
  args.unshift(thisProgram);
  var argc = args.length;
  var argv = stackAlloc((argc + 1) * 4);
  var argv_ptr = argv >> 2;
  args.forEach(arg=>{
    GROWABLE_HEAP_I32()[argv_ptr++] = stringToUTF8OnStack(arg)
  }
  );
  GROWABLE_HEAP_I32()[argv_ptr] = 0;
  try {
    var ret = entryFunction(argc, argv);
    exitJS(ret, true);
    return ret
  } catch (e) {
    return handleException(e)
  }
}
function run(args=arguments_) {
  if (runDependencies > 0) {
    return
  }
  if (ENVIRONMENT_IS_PTHREAD) {
    initRuntime();
    startWorker(Module);
    return
  }
  preRun();
  if (runDependencies > 0) {
    return
  }
  function doRun() {
    if (calledRun)
      return;
    calledRun = true;
    Module["calledRun"] = true;
    if (ABORT)
      return;
    initRuntime();
    preMain();
    if (Module["onRuntimeInitialized"])
      Module["onRuntimeInitialized"]();
    if (shouldRunNow)
      callMain(args);
    postRun()
  }
  if (Module["setStatus"]) {
    Module["setStatus"]("Running...");
    setTimeout(function() {
      setTimeout(function() {
        Module["setStatus"]("")
      }, 1);
      doRun()
    }, 1)
  } else {
    doRun()
  }
}
if (Module["preInit"]) {
  if (typeof Module["preInit"] == "function")
    Module["preInit"] = [Module["preInit"]];
  while (Module["preInit"].length > 0) {
    Module["preInit"].pop()()
  }
}
var shouldRunNow = true;
if (Module["noInitialRun"])
  shouldRunNow = false;
run();
