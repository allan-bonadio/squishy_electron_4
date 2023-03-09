var Module = typeof Module != "undefined" ? Module : {};

var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];

var thisProgram = "./this.program";

var quit_ = (status, toThrow) => {
 throw toThrow;
};

var ENVIRONMENT_IS_WEB = typeof window == "object";

var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";

var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";

var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (Module["ENVIRONMENT"]) {
 throw new Error("Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)");
}

var scriptDirectory = "";

function locateFile(path) {
 if (Module["locateFile"]) {
  return Module["locateFile"](path, scriptDirectory);
 }
 return scriptDirectory + path;
}

var read_, readAsync, readBinary, setWindowTitle;

function logExceptionOnExit(e) {
 if (e instanceof ExitStatus) return;
 let toLog = e;
 if (e && typeof e == "object" && e.stack) {
  toLog = [ e, e.stack ];
 }
 err("exiting due to exception: " + toLog);
}

if (ENVIRONMENT_IS_SHELL) {
 if (typeof process == "object" && typeof require === "function" || typeof window == "object" || typeof importScripts == "function") throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
 if (typeof read != "undefined") {
  read_ = function shell_read(f) {
   return read(f);
  };
 }
 readBinary = function readBinary(f) {
  let data;
  if (typeof readbuffer == "function") {
   return new Uint8Array(readbuffer(f));
  }
  data = read(f, "binary");
  assert(typeof data == "object");
  return data;
 };
 readAsync = function readAsync(f, onload, onerror) {
  setTimeout(() => onload(readBinary(f)), 0);
 };
 if (typeof clearTimeout == "undefined") {
  globalThis.clearTimeout = id => {};
 }
 if (typeof scriptArgs != "undefined") {
  arguments_ = scriptArgs;
 } else if (typeof arguments != "undefined") {
  arguments_ = arguments;
 }
 if (typeof quit == "function") {
  quit_ = (status, toThrow) => {
   logExceptionOnExit(toThrow);
   quit(status);
  };
 }
 if (typeof print != "undefined") {
  if (typeof console == "undefined") console = {};
  console.log = print;
  console.warn = console.error = typeof printErr != "undefined" ? printErr : print;
 }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = self.location.href;
 } else if (typeof document != "undefined" && document.currentScript) {
  scriptDirectory = document.currentScript.src;
 }
 if (scriptDirectory.indexOf("blob:") !== 0) {
  scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
 } else {
  scriptDirectory = "";
 }
 if (!(typeof window == "object" || typeof importScripts == "function")) throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
 {
  read_ = url => {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", url, false);
   xhr.send(null);
   return xhr.responseText;
  };
  if (ENVIRONMENT_IS_WORKER) {
   readBinary = url => {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.responseType = "arraybuffer";
    xhr.send(null);
    return new Uint8Array(xhr.response);
   };
  }
  readAsync = (url, onload, onerror) => {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", url, true);
   xhr.responseType = "arraybuffer";
   xhr.onload = () => {
    if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
     onload(xhr.response);
     return;
    }
    onerror();
   };
   xhr.onerror = onerror;
   xhr.send(null);
  };
 }
 setWindowTitle = title => document.title = title;
} else {
 throw new Error("environment detection error");
}

var out = Module["print"] || console.log.bind(console);

var err = Module["printErr"] || console.warn.bind(console);

Object.assign(Module, moduleOverrides);

moduleOverrides = null;

checkIncomingModuleAPI();

if (Module["arguments"]) arguments_ = Module["arguments"];

legacyModuleProp("arguments", "arguments_");

if (Module["thisProgram"]) thisProgram = Module["thisProgram"];

legacyModuleProp("thisProgram", "thisProgram");

if (Module["quit"]) quit_ = Module["quit"];

legacyModuleProp("quit", "quit_");

assert(typeof Module["memoryInitializerPrefixURL"] == "undefined", "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["pthreadMainPrefixURL"] == "undefined", "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["cdInitializerPrefixURL"] == "undefined", "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["filePackagePrefixURL"] == "undefined", "Module.filePackagePrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["read"] == "undefined", "Module.read option was removed (modify read_ in JS)");

assert(typeof Module["readAsync"] == "undefined", "Module.readAsync option was removed (modify readAsync in JS)");

assert(typeof Module["readBinary"] == "undefined", "Module.readBinary option was removed (modify readBinary in JS)");

assert(typeof Module["setWindowTitle"] == "undefined", "Module.setWindowTitle option was removed (modify setWindowTitle in JS)");

assert(typeof Module["TOTAL_MEMORY"] == "undefined", "Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY");

legacyModuleProp("read", "read_");

legacyModuleProp("readAsync", "readAsync");

legacyModuleProp("readBinary", "readBinary");

legacyModuleProp("setWindowTitle", "setWindowTitle");

var IDBFS = "IDBFS is no longer included by default; build with -lidbfs.js";

var PROXYFS = "PROXYFS is no longer included by default; build with -lproxyfs.js";

var WORKERFS = "WORKERFS is no longer included by default; build with -lworkerfs.js";

var NODEFS = "NODEFS is no longer included by default; build with -lnodefs.js";

assert(!ENVIRONMENT_IS_NODE, "node environment detected but not enabled at build time.  Add 'node' to `-sENVIRONMENT` to enable.");

assert(!ENVIRONMENT_IS_SHELL, "shell environment detected but not enabled at build time.  Add 'shell' to `-sENVIRONMENT` to enable.");

var wasmBinary;

if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];

legacyModuleProp("wasmBinary", "wasmBinary");

var noExitRuntime = Module["noExitRuntime"] || true;

legacyModuleProp("noExitRuntime", "noExitRuntime");

if (typeof WebAssembly != "object") {
 abort("no native wasm support detected");
}

function getSafeHeapType(bytes, isFloat) {
 switch (bytes) {
 case 1:
  return "i8";

 case 2:
  return "i16";

 case 4:
  return isFloat ? "float" : "i32";

 case 8:
  return isFloat ? "double" : "i64";

 default:
  assert(0, "getSafeHeapType() invalid bytes=" + bytes);
 }
}

function SAFE_HEAP_STORE(dest, value, bytes, isFloat) {
 if (dest <= 0) abort("segmentation fault storing " + bytes + " bytes to address " + dest);
 if (dest % bytes !== 0) abort("alignment error storing to address " + dest + ", which was expected to be aligned to a multiple of " + bytes);
 if (runtimeInitialized) {
  var brk = _sbrk() >>> 0;
  if (dest + bytes > brk) abort("segmentation fault, exceeded the top of the available dynamic heap when storing " + bytes + " bytes to address " + dest + ". DYNAMICTOP=" + brk);
  assert(brk >= _emscripten_stack_get_base(), "brk >= _emscripten_stack_get_base() (brk=" + brk + ", _emscripten_stack_get_base()=" + _emscripten_stack_get_base() + ")");
  assert(brk <= wasmMemory.buffer.byteLength, "brk <= wasmMemory.buffer.byteLength (brk=" + brk + ", wasmMemory.buffer.byteLength=" + wasmMemory.buffer.byteLength + ")");
 }
 setValue_safe(dest, value, getSafeHeapType(bytes, isFloat));
 return value;
}

function SAFE_HEAP_STORE_D(dest, value, bytes) {
 return SAFE_HEAP_STORE(dest, value, bytes, true);
}

function SAFE_HEAP_LOAD(dest, bytes, unsigned, isFloat) {
 if (dest <= 0) abort("segmentation fault loading " + bytes + " bytes from address " + dest);
 if (dest % bytes !== 0) abort("alignment error loading from address " + dest + ", which was expected to be aligned to a multiple of " + bytes);
 if (runtimeInitialized) {
  var brk = _sbrk() >>> 0;
  if (dest + bytes > brk) abort("segmentation fault, exceeded the top of the available dynamic heap when loading " + bytes + " bytes from address " + dest + ". DYNAMICTOP=" + brk);
  assert(brk >= _emscripten_stack_get_base(), "brk >= _emscripten_stack_get_base() (brk=" + brk + ", _emscripten_stack_get_base()=" + _emscripten_stack_get_base() + ")");
  assert(brk <= wasmMemory.buffer.byteLength, "brk <= wasmMemory.buffer.byteLength (brk=" + brk + ", wasmMemory.buffer.byteLength=" + wasmMemory.buffer.byteLength + ")");
 }
 var type = getSafeHeapType(bytes, isFloat);
 var ret = getValue_safe(dest, type);
 if (unsigned) ret = unSign(ret, parseInt(type.substr(1), 10));
 return ret;
}

function SAFE_HEAP_LOAD_D(dest, bytes, unsigned) {
 return SAFE_HEAP_LOAD(dest, bytes, unsigned, true);
}

function SAFE_FT_MASK(value, mask) {
 var ret = value & mask;
 if (ret !== value) {
  abort("Function table mask error: function pointer is " + value + " which is masked by " + mask + ", the likely cause of this is that the function pointer is being called by the wrong type.");
 }
 return ret;
}

function segfault() {
 abort("segmentation fault");
}

function alignfault() {
 abort("alignment fault");
}

var wasmMemory;

var ABORT = false;

var EXITSTATUS;

function assert(condition, text) {
 if (!condition) {
  abort("Assertion failed" + (text ? ": " + text : ""));
 }
}

var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;

function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
 var endIdx = idx + maxBytesToRead;
 var endPtr = idx;
 while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
 if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
  return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
 }
 var str = "";
 while (idx < endPtr) {
  var u0 = heapOrArray[idx++];
  if (!(u0 & 128)) {
   str += String.fromCharCode(u0);
   continue;
  }
  var u1 = heapOrArray[idx++] & 63;
  if ((u0 & 224) == 192) {
   str += String.fromCharCode((u0 & 31) << 6 | u1);
   continue;
  }
  var u2 = heapOrArray[idx++] & 63;
  if ((u0 & 240) == 224) {
   u0 = (u0 & 15) << 12 | u1 << 6 | u2;
  } else {
   if ((u0 & 248) != 240) warnOnce("Invalid UTF-8 leading byte " + ptrToString(u0) + " encountered when deserializing a UTF-8 string in wasm memory to a JS string!");
   u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
  }
  if (u0 < 65536) {
   str += String.fromCharCode(u0);
  } else {
   var ch = u0 - 65536;
   str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
  }
 }
 return str;
}

function UTF8ToString(ptr, maxBytesToRead) {
 assert(typeof ptr == "number");
 return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
}

function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
 if (!(maxBytesToWrite > 0)) return 0;
 var startIdx = outIdx;
 var endIdx = outIdx + maxBytesToWrite - 1;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) {
   var u1 = str.charCodeAt(++i);
   u = 65536 + ((u & 1023) << 10) | u1 & 1023;
  }
  if (u <= 127) {
   if (outIdx >= endIdx) break;
   heap[outIdx++] = u;
  } else if (u <= 2047) {
   if (outIdx + 1 >= endIdx) break;
   heap[outIdx++] = 192 | u >> 6;
   heap[outIdx++] = 128 | u & 63;
  } else if (u <= 65535) {
   if (outIdx + 2 >= endIdx) break;
   heap[outIdx++] = 224 | u >> 12;
   heap[outIdx++] = 128 | u >> 6 & 63;
   heap[outIdx++] = 128 | u & 63;
  } else {
   if (outIdx + 3 >= endIdx) break;
   if (u > 1114111) warnOnce("Invalid Unicode code point " + ptrToString(u) + " encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).");
   heap[outIdx++] = 240 | u >> 18;
   heap[outIdx++] = 128 | u >> 12 & 63;
   heap[outIdx++] = 128 | u >> 6 & 63;
   heap[outIdx++] = 128 | u & 63;
  }
 }
 heap[outIdx] = 0;
 return outIdx - startIdx;
}

function stringToUTF8(str, outPtr, maxBytesToWrite) {
 assert(typeof maxBytesToWrite == "number", "stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
 return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}

function lengthBytesUTF8(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var c = str.charCodeAt(i);
  if (c <= 127) {
   len++;
  } else if (c <= 2047) {
   len += 2;
  } else if (c >= 55296 && c <= 57343) {
   len += 4;
   ++i;
  } else {
   len += 3;
  }
 }
 return len;
}

var HEAP, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateMemoryViews() {
 var b = wasmMemory.buffer;
 Module["HEAP8"] = HEAP8 = new Int8Array(b);
 Module["HEAP16"] = HEAP16 = new Int16Array(b);
 Module["HEAP32"] = HEAP32 = new Int32Array(b);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
}

assert(!Module["STACK_SIZE"], "STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time");

assert(typeof Int32Array != "undefined" && typeof Float64Array !== "undefined" && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined, "JS engine does not provide full typed array support");

assert(!Module["wasmMemory"], "Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally");

assert(!Module["INITIAL_MEMORY"], "Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically");

var wasmTable;

function writeStackCookie() {
 var max = _emscripten_stack_get_end();
 assert((max & 3) == 0);
 if (max == 0) {
  max += 4;
 }
 SAFE_HEAP_STORE((max >> 2) * 4, 34821223, 4);
 SAFE_HEAP_STORE((max + 4 >> 2) * 4, 2310721022, 4);
}

function checkStackCookie() {
 if (ABORT) return;
 var max = _emscripten_stack_get_end();
 if (max == 0) {
  max += 4;
 }
 var cookie1 = SAFE_HEAP_LOAD((max >> 2) * 4, 4, 1);
 var cookie2 = SAFE_HEAP_LOAD((max + 4 >> 2) * 4, 4, 1);
 if (cookie1 != 34821223 || cookie2 != 2310721022) {
  abort("Stack overflow! Stack cookie has been overwritten at " + ptrToString(max) + ", expected hex dwords 0x89BACDFE and 0x2135467, but received " + ptrToString(cookie2) + " " + ptrToString(cookie1));
 }
}

(function() {
 var h16 = new Int16Array(1);
 var h8 = new Int8Array(h16.buffer);
 h16[0] = 25459;
 if (h8[0] !== 115 || h8[1] !== 99) throw "Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)";
})();

var __ATPRERUN__ = [];

var __ATINIT__ = [];

var __ATMAIN__ = [];

var __ATEXIT__ = [];

var __ATPOSTRUN__ = [];

var runtimeInitialized = false;

function keepRuntimeAlive() {
 return noExitRuntime;
}

function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
 assert(!runtimeInitialized);
 runtimeInitialized = true;
 checkStackCookie();
 ___set_stack_limits(_emscripten_stack_get_base(), _emscripten_stack_get_end());
 callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
 checkStackCookie();
 callRuntimeCallbacks(__ATMAIN__);
}

function postRun() {
 checkStackCookie();
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
 __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
 __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {}

function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}

assert(Math.imul, "This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.fround, "This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.clz32, "This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.trunc, "This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

var runDependencies = 0;

var runDependencyWatcher = null;

var dependenciesFulfilled = null;

var runDependencyTracking = {};

function getUniqueRunDependency(id) {
 var orig = id;
 while (1) {
  if (!runDependencyTracking[id]) return id;
  id = orig + Math.random();
 }
}

function addRunDependency(id) {
 runDependencies++;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (id) {
  assert(!runDependencyTracking[id]);
  runDependencyTracking[id] = 1;
  if (runDependencyWatcher === null && typeof setInterval != "undefined") {
   runDependencyWatcher = setInterval(function() {
    if (ABORT) {
     clearInterval(runDependencyWatcher);
     runDependencyWatcher = null;
     return;
    }
    var shown = false;
    for (var dep in runDependencyTracking) {
     if (!shown) {
      shown = true;
      err("still waiting on run dependencies:");
     }
     err("dependency: " + dep);
    }
    if (shown) {
     err("(end of list)");
    }
   }, 1e4);
  }
 } else {
  err("warning: run dependency added without ID");
 }
}

function removeRunDependency(id) {
 runDependencies--;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (id) {
  assert(runDependencyTracking[id]);
  delete runDependencyTracking[id];
 } else {
  err("warning: run dependency removed without ID");
 }
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}

function abort(what) {
 if (Module["onAbort"]) {
  Module["onAbort"](what);
 }
 what = "Aborted(" + what + ")";
 err(what);
 ABORT = true;
 EXITSTATUS = 1;
 var e = new WebAssembly.RuntimeError(what);
 throw e;
}

var FS = {
 error: function() {
  abort("Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with -sFORCE_FILESYSTEM");
 },
 init: function() {
  FS.error();
 },
 createDataFile: function() {
  FS.error();
 },
 createPreloadedFile: function() {
  FS.error();
 },
 createLazyFile: function() {
  FS.error();
 },
 open: function() {
  FS.error();
 },
 mkdev: function() {
  FS.error();
 },
 registerDevice: function() {
  FS.error();
 },
 analyzePath: function() {
  FS.error();
 },
 loadFilesFromDB: function() {
  FS.error();
 },
 ErrnoError: function ErrnoError() {
  FS.error();
 }
};

Module["FS_createDataFile"] = FS.createDataFile;

Module["FS_createPreloadedFile"] = FS.createPreloadedFile;

var dataURIPrefix = "data:application/octet-stream;base64,";

function isDataURI(filename) {
 return filename.startsWith(dataURIPrefix);
}

function isFileURI(filename) {
 return filename.startsWith("file://");
}

function createExportWrapper(name, fixedasm) {
 return function() {
  var displayName = name;
  var asm = fixedasm;
  if (!fixedasm) {
   asm = Module["asm"];
  }
  assert(runtimeInitialized, "native function `" + displayName + "` called before runtime initialization");
  if (!asm[name]) {
   assert(asm[name], "exported native function `" + displayName + "` not found");
  }
  return asm[name].apply(null, arguments);
 };
}

class EmscriptenEH extends Error {}

class EmscriptenSjLj extends EmscriptenEH {}

class CppException extends EmscriptenEH {
 constructor(excPtr) {
  super(excPtr);
  const excInfo = getExceptionMessage(excPtr);
  this.name = excInfo[0];
  this.message = excInfo[1];
 }
}

var wasmBinaryFile;

wasmBinaryFile = "quantumEngine.wasm";

if (!isDataURI(wasmBinaryFile)) {
 wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary(file) {
 try {
  if (file == wasmBinaryFile && wasmBinary) {
   return new Uint8Array(wasmBinary);
  }
  if (readBinary) {
   return readBinary(file);
  }
  throw "both async and sync fetching of the wasm failed";
 } catch (err) {
  abort(err);
 }
}

function getBinaryPromise(binaryFile) {
 if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
  if (typeof fetch == "function") {
   return fetch(binaryFile, {
    credentials: "same-origin"
   }).then(function(response) {
    if (!response["ok"]) {
     throw "failed to load wasm binary file at '" + binaryFile + "'";
    }
    return response["arrayBuffer"]();
   }).catch(function() {
    return getBinary(binaryFile);
   });
  }
 }
 return Promise.resolve().then(function() {
  return getBinary(binaryFile);
 });
}

function instantiateArrayBuffer(binaryFile, imports, receiver) {
 return getBinaryPromise(binaryFile).then(function(binary) {
  return WebAssembly.instantiate(binary, imports);
 }).then(function(instance) {
  return instance;
 }).then(receiver, function(reason) {
  err("failed to asynchronously prepare wasm: " + reason);
  if (isFileURI(wasmBinaryFile)) {
   err("warning: Loading from a file URI (" + wasmBinaryFile + ") is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing");
  }
  abort(reason);
 });
}

function instantiateAsync(binary, binaryFile, imports, callback) {
 if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && typeof fetch == "function") {
  return fetch(binaryFile, {
   credentials: "same-origin"
  }).then(function(response) {
   var result = WebAssembly.instantiateStreaming(response, imports);
   return result.then(callback, function(reason) {
    err("wasm streaming compile failed: " + reason);
    err("falling back to ArrayBuffer instantiation");
    return instantiateArrayBuffer(binaryFile, imports, callback);
   });
  });
 } else {
  return instantiateArrayBuffer(binaryFile, imports, callback);
 }
}

function createWasm() {
 var info = {
  "env": wasmImports,
  "wasi_snapshot_preview1": wasmImports
 };
 function receiveInstance(instance, module) {
  var exports = instance.exports;
  Module["asm"] = exports;
  wasmMemory = Module["asm"]["memory"];
  assert(wasmMemory, "memory not found in wasm exports");
  updateMemoryViews();
  wasmTable = Module["asm"]["__indirect_function_table"];
  assert(wasmTable, "table not found in wasm exports");
  addOnInit(Module["asm"]["__wasm_call_ctors"]);
  removeRunDependency("wasm-instantiate");
  return exports;
 }
 addRunDependency("wasm-instantiate");
 var trueModule = Module;
 function receiveInstantiationResult(result) {
  assert(Module === trueModule, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
  trueModule = null;
  receiveInstance(result["instance"]);
 }
 if (Module["instantiateWasm"]) {
  try {
   return Module["instantiateWasm"](info, receiveInstance);
  } catch (e) {
   err("Module.instantiateWasm callback failed with error: " + e);
   return false;
  }
 }
 instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult);
 return {};
}

var tempDouble;

var tempI64;

function legacyModuleProp(prop, newName) {
 if (!Object.getOwnPropertyDescriptor(Module, prop)) {
  Object.defineProperty(Module, prop, {
   configurable: true,
   get: function() {
    abort("Module." + prop + " has been replaced with plain " + newName + " (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
   }
  });
 }
}

function ignoredModuleProp(prop) {
 if (Object.getOwnPropertyDescriptor(Module, prop)) {
  abort("`Module." + prop + "` was supplied but `" + prop + "` not included in INCOMING_MODULE_JS_API");
 }
}

function isExportedByForceFilesystem(name) {
 return name === "FS_createPath" || name === "FS_createDataFile" || name === "FS_createPreloadedFile" || name === "FS_unlink" || name === "addRunDependency" || name === "FS_createLazyFile" || name === "FS_createDevice" || name === "removeRunDependency";
}

function missingGlobal(sym, msg) {
 if (typeof globalThis !== "undefined") {
  Object.defineProperty(globalThis, sym, {
   configurable: true,
   get: function() {
    warnOnce("`" + sym + "` is not longer defined by emscripten. " + msg);
    return undefined;
   }
  });
 }
}

missingGlobal("buffer", "Please use HEAP8.buffer or wasmMemory.buffer");

function missingLibrarySymbol(sym) {
 if (typeof globalThis !== "undefined" && !Object.getOwnPropertyDescriptor(globalThis, sym)) {
  Object.defineProperty(globalThis, sym, {
   configurable: true,
   get: function() {
    var msg = "`" + sym + "` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line";
    var librarySymbol = sym;
    if (!librarySymbol.startsWith("_")) {
     librarySymbol = "$" + sym;
    }
    msg += " (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=" + librarySymbol + ")";
    if (isExportedByForceFilesystem(sym)) {
     msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
    }
    warnOnce(msg);
    return undefined;
   }
  });
 }
 unexportedRuntimeSymbol(sym);
}

function unexportedRuntimeSymbol(sym) {
 if (!Object.getOwnPropertyDescriptor(Module, sym)) {
  Object.defineProperty(Module, sym, {
   configurable: true,
   get: function() {
    var msg = "'" + sym + "' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)";
    if (isExportedByForceFilesystem(sym)) {
     msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
    }
    abort(msg);
   }
  });
 }
}

function dbg(text) {
 console.error(text);
}

function qeStarted(max_dimensions, max_label_len) {
 document.addEventListener("DOMContentLoaded", ev => {
  if (!window.startUpFromCpp) {
   debugger;
   throw " 🐣 startUpFromCpp() not available on startup!      🙄  👿 🤢 😵 🤬 😭 😠";
  }
  window.startUpFromCpp(max_dimensions, max_label_len);
 });
 return navigator.hardwareConcurrency;
}

function _emscripten_set_main_loop_timing(mode, value) {
 Browser.mainLoop.timingMode = mode;
 Browser.mainLoop.timingValue = value;
 if (!Browser.mainLoop.func) {
  err("emscripten_set_main_loop_timing: Cannot set timing mode for main loop since a main loop does not exist! Call emscripten_set_main_loop first to set one up.");
  return 1;
 }
 if (!Browser.mainLoop.running) {
  Browser.mainLoop.running = true;
 }
 if (mode == 0) {
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
   var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
   setTimeout(Browser.mainLoop.runner, timeUntilNextTick);
  };
  Browser.mainLoop.method = "timeout";
 } else if (mode == 1) {
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
   Browser.requestAnimationFrame(Browser.mainLoop.runner);
  };
  Browser.mainLoop.method = "rAF";
 } else if (mode == 2) {
  if (typeof setImmediate == "undefined") {
   var setImmediates = [];
   var emscriptenMainLoopMessageId = "setimmediate";
   var Browser_setImmediate_messageHandler = event => {
    if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
     event.stopPropagation();
     setImmediates.shift()();
    }
   };
   addEventListener("message", Browser_setImmediate_messageHandler, true);
   setImmediate = function Browser_emulated_setImmediate(func) {
    setImmediates.push(func);
    if (ENVIRONMENT_IS_WORKER) {
     if (Module["setImmediates"] === undefined) Module["setImmediates"] = [];
     Module["setImmediates"].push(func);
     postMessage({
      target: emscriptenMainLoopMessageId
     });
    } else postMessage(emscriptenMainLoopMessageId, "*");
   };
  }
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
   setImmediate(Browser.mainLoop.runner);
  };
  Browser.mainLoop.method = "immediate";
 }
 return 0;
}

var _emscripten_get_now;

_emscripten_get_now = () => performance.now();

function setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop, arg, noSetTiming) {
 assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
 Browser.mainLoop.func = browserIterationFunc;
 Browser.mainLoop.arg = arg;
 var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
 function checkIsRunning() {
  if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) {
   return false;
  }
  return true;
 }
 Browser.mainLoop.running = false;
 Browser.mainLoop.runner = function Browser_mainLoop_runner() {
  if (ABORT) return;
  if (Browser.mainLoop.queue.length > 0) {
   var start = Date.now();
   var blocker = Browser.mainLoop.queue.shift();
   blocker.func(blocker.arg);
   if (Browser.mainLoop.remainingBlockers) {
    var remaining = Browser.mainLoop.remainingBlockers;
    var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
    if (blocker.counted) {
     Browser.mainLoop.remainingBlockers = next;
    } else {
     next = next + .5;
     Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
    }
   }
   out('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + " ms");
   Browser.mainLoop.updateStatus();
   if (!checkIsRunning()) return;
   setTimeout(Browser.mainLoop.runner, 0);
   return;
  }
  if (!checkIsRunning()) return;
  Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
  if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
   Browser.mainLoop.scheduler();
   return;
  } else if (Browser.mainLoop.timingMode == 0) {
   Browser.mainLoop.tickStartTime = _emscripten_get_now();
  }
  if (Browser.mainLoop.method === "timeout" && Module.ctx) {
   warnOnce("Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!");
   Browser.mainLoop.method = "";
  }
  Browser.mainLoop.runIter(browserIterationFunc);
  checkStackCookie();
  if (!checkIsRunning()) return;
  if (typeof SDL == "object" && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
  Browser.mainLoop.scheduler();
 };
 if (!noSetTiming) {
  if (fps && fps > 0) _emscripten_set_main_loop_timing(0, 1e3 / fps); else _emscripten_set_main_loop_timing(1, 1);
  Browser.mainLoop.scheduler();
 }
 if (simulateInfiniteLoop) {
  throw "unwind";
 }
}

function handleException(e) {
 if (e instanceof ExitStatus || e == "unwind") {
  return EXITSTATUS;
 }
 checkStackCookie();
 if (e instanceof WebAssembly.RuntimeError) {
  if (_emscripten_stack_get_current() <= 0) {
   err("Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to " + 65536 + ")");
  }
 }
 quit_(1, e);
}

function callUserCallback(func) {
 if (ABORT) {
  err("user callback triggered after runtime exited or application aborted.  Ignoring.");
  return;
 }
 try {
  func();
 } catch (e) {
  handleException(e);
 }
}

function safeSetTimeout(func, timeout) {
 return setTimeout(function() {
  callUserCallback(func);
 }, timeout);
}

function warnOnce(text) {
 if (!warnOnce.shown) warnOnce.shown = {};
 if (!warnOnce.shown[text]) {
  warnOnce.shown[text] = 1;
  err(text);
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
   Browser.mainLoop.currentlyRunningMainloop++;
  },
  resume: function() {
   Browser.mainLoop.currentlyRunningMainloop++;
   var timingMode = Browser.mainLoop.timingMode;
   var timingValue = Browser.mainLoop.timingValue;
   var func = Browser.mainLoop.func;
   Browser.mainLoop.func = null;
   setMainLoop(func, 0, false, Browser.mainLoop.arg, true);
   _emscripten_set_main_loop_timing(timingMode, timingValue);
   Browser.mainLoop.scheduler();
  },
  updateStatus: function() {
   if (Module["setStatus"]) {
    var message = Module["statusMessage"] || "Please wait...";
    var remaining = Browser.mainLoop.remainingBlockers;
    var expected = Browser.mainLoop.expectedBlockers;
    if (remaining) {
     if (remaining < expected) {
      Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")");
     } else {
      Module["setStatus"](message);
     }
    } else {
     Module["setStatus"]("");
    }
   }
  },
  runIter: function(func) {
   if (ABORT) return;
   if (Module["preMainLoop"]) {
    var preRet = Module["preMainLoop"]();
    if (preRet === false) {
     return;
    }
   }
   callUserCallback(func);
   if (Module["postMainLoop"]) Module["postMainLoop"]();
  }
 },
 isFullscreen: false,
 pointerLock: false,
 moduleContextCreatedCallbacks: [],
 workers: [],
 init: function() {
  if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
  if (Browser.initted) return;
  Browser.initted = true;
  try {
   new Blob();
   Browser.hasBlobConstructor = true;
  } catch (e) {
   Browser.hasBlobConstructor = false;
   err("warning: no blob constructor, cannot create blobs with mimetypes");
  }
  Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : !Browser.hasBlobConstructor ? err("warning: no BlobBuilder") : null;
  Browser.URLObject = typeof window != "undefined" ? window.URL ? window.URL : window.webkitURL : undefined;
  if (!Module.noImageDecoding && typeof Browser.URLObject == "undefined") {
   err("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
   Module.noImageDecoding = true;
  }
  var imagePlugin = {};
  imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
   return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
  };
  imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
   var b = null;
   if (Browser.hasBlobConstructor) {
    try {
     b = new Blob([ byteArray ], {
      type: Browser.getMimetype(name)
     });
     if (b.size !== byteArray.length) {
      b = new Blob([ new Uint8Array(byteArray).buffer ], {
       type: Browser.getMimetype(name)
      });
     }
    } catch (e) {
     warnOnce("Blob constructor present but fails: " + e + "; falling back to blob builder");
    }
   }
   if (!b) {
    var bb = new Browser.BlobBuilder();
    bb.append(new Uint8Array(byteArray).buffer);
    b = bb.getBlob();
   }
   var url = Browser.URLObject.createObjectURL(b);
   assert(typeof url == "string", "createObjectURL must return a url as a string");
   var img = new Image();
   img.onload = () => {
    assert(img.complete, "Image " + name + " could not be decoded");
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    preloadedImages[name] = canvas;
    Browser.URLObject.revokeObjectURL(url);
    if (onload) onload(byteArray);
   };
   img.onerror = event => {
    out("Image " + url + " could not be decoded");
    if (onerror) onerror();
   };
   img.src = url;
  };
  Module["preloadPlugins"].push(imagePlugin);
  var audioPlugin = {};
  audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
   return !Module.noAudioDecoding && name.substr(-4) in {
    ".ogg": 1,
    ".wav": 1,
    ".mp3": 1
   };
  };
  audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
   var done = false;
   function finish(audio) {
    if (done) return;
    done = true;
    preloadedAudios[name] = audio;
    if (onload) onload(byteArray);
   }
   function fail() {
    if (done) return;
    done = true;
    preloadedAudios[name] = new Audio();
    if (onerror) onerror();
   }
   if (Browser.hasBlobConstructor) {
    try {
     var b = new Blob([ byteArray ], {
      type: Browser.getMimetype(name)
     });
    } catch (e) {
     return fail();
    }
    var url = Browser.URLObject.createObjectURL(b);
    assert(typeof url == "string", "createObjectURL must return a url as a string");
    var audio = new Audio();
    audio.addEventListener("canplaythrough", () => finish(audio), false);
    audio.onerror = function audio_onerror(event) {
     if (done) return;
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
        ret += BASE[curr];
       }
      }
      if (leftbits == 2) {
       ret += BASE[(leftchar & 3) << 4];
       ret += PAD + PAD;
      } else if (leftbits == 4) {
       ret += BASE[(leftchar & 15) << 2];
       ret += PAD;
      }
      return ret;
     }
     audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
     finish(audio);
    };
    audio.src = url;
    safeSetTimeout(function() {
     finish(audio);
    }, 1e4);
   } else {
    return fail();
   }
  };
  Module["preloadPlugins"].push(audioPlugin);
  function pointerLockChange() {
   Browser.pointerLock = document["pointerLockElement"] === Module["canvas"] || document["mozPointerLockElement"] === Module["canvas"] || document["webkitPointerLockElement"] === Module["canvas"] || document["msPointerLockElement"] === Module["canvas"];
  }
  var canvas = Module["canvas"];
  if (canvas) {
   canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || (() => {});
   canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || (() => {});
   canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
   document.addEventListener("pointerlockchange", pointerLockChange, false);
   document.addEventListener("mozpointerlockchange", pointerLockChange, false);
   document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
   document.addEventListener("mspointerlockchange", pointerLockChange, false);
   if (Module["elementPointerLock"]) {
    canvas.addEventListener("click", ev => {
     if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
      Module["canvas"].requestPointerLock();
      ev.preventDefault();
     }
    }, false);
   }
  }
 },
 handledByPreloadPlugin: function(byteArray, fullname, finish, onerror) {
  Browser.init();
  var handled = false;
  Module["preloadPlugins"].forEach(function(plugin) {
   if (handled) return;
   if (plugin["canHandle"](fullname)) {
    plugin["handle"](byteArray, fullname, finish, onerror);
    handled = true;
   }
  });
  return handled;
 },
 createContext: function(canvas, useWebGL, setInModule, webGLContextAttributes) {
  if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx;
  var ctx;
  var contextHandle;
  if (useWebGL) {
   var contextAttributes = {
    antialias: false,
    alpha: false,
    majorVersion: 1
   };
   if (webGLContextAttributes) {
    for (var attribute in webGLContextAttributes) {
     contextAttributes[attribute] = webGLContextAttributes[attribute];
    }
   }
   if (typeof GL != "undefined") {
    contextHandle = GL.createContext(canvas, contextAttributes);
    if (contextHandle) {
     ctx = GL.getContext(contextHandle).GLctx;
    }
   }
  } else {
   ctx = canvas.getContext("2d");
  }
  if (!ctx) return null;
  if (setInModule) {
   if (!useWebGL) assert(typeof GLctx == "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
   Module.ctx = ctx;
   if (useWebGL) GL.makeContextCurrent(contextHandle);
   Module.useWebGL = useWebGL;
   Browser.moduleContextCreatedCallbacks.forEach(function(callback) {
    callback();
   });
   Browser.init();
  }
  return ctx;
 },
 destroyContext: function(canvas, useWebGL, setInModule) {},
 fullscreenHandlersInstalled: false,
 lockPointer: undefined,
 resizeCanvas: undefined,
 requestFullscreen: function(lockPointer, resizeCanvas) {
  Browser.lockPointer = lockPointer;
  Browser.resizeCanvas = resizeCanvas;
  if (typeof Browser.lockPointer == "undefined") Browser.lockPointer = true;
  if (typeof Browser.resizeCanvas == "undefined") Browser.resizeCanvas = false;
  var canvas = Module["canvas"];
  function fullscreenChange() {
   Browser.isFullscreen = false;
   var canvasContainer = canvas.parentNode;
   if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
    canvas.exitFullscreen = Browser.exitFullscreen;
    if (Browser.lockPointer) canvas.requestPointerLock();
    Browser.isFullscreen = true;
    if (Browser.resizeCanvas) {
     Browser.setFullscreenCanvasSize();
    } else {
     Browser.updateCanvasDimensions(canvas);
    }
   } else {
    canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
    canvasContainer.parentNode.removeChild(canvasContainer);
    if (Browser.resizeCanvas) {
     Browser.setWindowedCanvasSize();
    } else {
     Browser.updateCanvasDimensions(canvas);
    }
   }
   if (Module["onFullScreen"]) Module["onFullScreen"](Browser.isFullscreen);
   if (Module["onFullscreen"]) Module["onFullscreen"](Browser.isFullscreen);
  }
  if (!Browser.fullscreenHandlersInstalled) {
   Browser.fullscreenHandlersInstalled = true;
   document.addEventListener("fullscreenchange", fullscreenChange, false);
   document.addEventListener("mozfullscreenchange", fullscreenChange, false);
   document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
   document.addEventListener("MSFullscreenChange", fullscreenChange, false);
  }
  var canvasContainer = document.createElement("div");
  canvas.parentNode.insertBefore(canvasContainer, canvas);
  canvasContainer.appendChild(canvas);
  canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? () => canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null) || (canvasContainer["webkitRequestFullScreen"] ? () => canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null);
  canvasContainer.requestFullscreen();
 },
 requestFullScreen: function() {
  abort("Module.requestFullScreen has been replaced by Module.requestFullscreen (without a capital S)");
 },
 exitFullscreen: function() {
  if (!Browser.isFullscreen) {
   return false;
  }
  var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || function() {};
  CFS.apply(document, []);
  return true;
 },
 nextRAF: 0,
 fakeRequestAnimationFrame: function(func) {
  var now = Date.now();
  if (Browser.nextRAF === 0) {
   Browser.nextRAF = now + 1e3 / 60;
  } else {
   while (now + 2 >= Browser.nextRAF) {
    Browser.nextRAF += 1e3 / 60;
   }
  }
  var delay = Math.max(Browser.nextRAF - now, 0);
  setTimeout(func, delay);
 },
 requestAnimationFrame: function(func) {
  if (typeof requestAnimationFrame == "function") {
   requestAnimationFrame(func);
   return;
  }
  var RAF = Browser.fakeRequestAnimationFrame;
  RAF(func);
 },
 safeSetTimeout: function(func, timeout) {
  return safeSetTimeout(func, timeout);
 },
 safeRequestAnimationFrame: function(func) {
  return Browser.requestAnimationFrame(function() {
   callUserCallback(func);
  });
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
  }[name.substr(name.lastIndexOf(".") + 1)];
 },
 getUserMedia: function(func) {
  if (!window.getUserMedia) {
   window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"];
  }
  window.getUserMedia(func);
 },
 getMovementX: function(event) {
  return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0;
 },
 getMovementY: function(event) {
  return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0;
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
    throw "unrecognized mouse wheel delta mode: " + event.deltaMode;
   }
   break;

  default:
   throw "unrecognized mouse wheel event: " + event.type;
  }
  return delta;
 },
 mouseX: 0,
 mouseY: 0,
 mouseMovementX: 0,
 mouseMovementY: 0,
 touches: {},
 lastTouches: {},
 calculateMouseEvent: function(event) {
  if (Browser.pointerLock) {
   if (event.type != "mousemove" && "mozMovementX" in event) {
    Browser.mouseMovementX = Browser.mouseMovementY = 0;
   } else {
    Browser.mouseMovementX = Browser.getMovementX(event);
    Browser.mouseMovementY = Browser.getMovementY(event);
   }
   if (typeof SDL != "undefined") {
    Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
    Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
   } else {
    Browser.mouseX += Browser.mouseMovementX;
    Browser.mouseY += Browser.mouseMovementY;
   }
  } else {
   var rect = Module["canvas"].getBoundingClientRect();
   var cw = Module["canvas"].width;
   var ch = Module["canvas"].height;
   var scrollX = typeof window.scrollX != "undefined" ? window.scrollX : window.pageXOffset;
   var scrollY = typeof window.scrollY != "undefined" ? window.scrollY : window.pageYOffset;
   assert(typeof scrollX != "undefined" && typeof scrollY != "undefined", "Unable to retrieve scroll position, mouse positions likely broken.");
   if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
    var touch = event.touch;
    if (touch === undefined) {
     return;
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
     Browser.touches[touch.identifier] = coords;
    } else if (event.type === "touchend" || event.type === "touchmove") {
     var last = Browser.touches[touch.identifier];
     if (!last) last = coords;
     Browser.lastTouches[touch.identifier] = last;
     Browser.touches[touch.identifier] = coords;
    }
    return;
   }
   var x = event.pageX - (scrollX + rect.left);
   var y = event.pageY - (scrollY + rect.top);
   x = x * (cw / rect.width);
   y = y * (ch / rect.height);
   Browser.mouseMovementX = x - Browser.mouseX;
   Browser.mouseMovementY = y - Browser.mouseY;
   Browser.mouseX = x;
   Browser.mouseY = y;
  }
 },
 resizeListeners: [],
 updateResizeListeners: function() {
  var canvas = Module["canvas"];
  Browser.resizeListeners.forEach(function(listener) {
   listener(canvas.width, canvas.height);
  });
 },
 setCanvasSize: function(width, height, noUpdates) {
  var canvas = Module["canvas"];
  Browser.updateCanvasDimensions(canvas, width, height);
  if (!noUpdates) Browser.updateResizeListeners();
 },
 windowedWidth: 0,
 windowedHeight: 0,
 setFullscreenCanvasSize: function() {
  if (typeof SDL != "undefined") {
   var flags = SAFE_HEAP_LOAD((SDL.screen >> 2) * 4, 4, 1);
   flags = flags | 8388608;
   SAFE_HEAP_STORE((SDL.screen >> 2) * 4, flags, 4);
  }
  Browser.updateCanvasDimensions(Module["canvas"]);
  Browser.updateResizeListeners();
 },
 setWindowedCanvasSize: function() {
  if (typeof SDL != "undefined") {
   var flags = SAFE_HEAP_LOAD((SDL.screen >> 2) * 4, 4, 1);
   flags = flags & ~8388608;
   SAFE_HEAP_STORE((SDL.screen >> 2) * 4, flags, 4);
  }
  Browser.updateCanvasDimensions(Module["canvas"]);
  Browser.updateResizeListeners();
 },
 updateCanvasDimensions: function(canvas, wNative, hNative) {
  if (wNative && hNative) {
   canvas.widthNative = wNative;
   canvas.heightNative = hNative;
  } else {
   wNative = canvas.widthNative;
   hNative = canvas.heightNative;
  }
  var w = wNative;
  var h = hNative;
  if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
   if (w / h < Module["forcedAspectRatio"]) {
    w = Math.round(h * Module["forcedAspectRatio"]);
   } else {
    h = Math.round(w / Module["forcedAspectRatio"]);
   }
  }
  if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
   var factor = Math.min(screen.width / w, screen.height / h);
   w = Math.round(w * factor);
   h = Math.round(h * factor);
  }
  if (Browser.resizeCanvas) {
   if (canvas.width != w) canvas.width = w;
   if (canvas.height != h) canvas.height = h;
   if (typeof canvas.style != "undefined") {
    canvas.style.removeProperty("width");
    canvas.style.removeProperty("height");
   }
  } else {
   if (canvas.width != wNative) canvas.width = wNative;
   if (canvas.height != hNative) canvas.height = hNative;
   if (typeof canvas.style != "undefined") {
    if (w != wNative || h != hNative) {
     canvas.style.setProperty("width", w + "px", "important");
     canvas.style.setProperty("height", h + "px", "important");
    } else {
     canvas.style.removeProperty("width");
     canvas.style.removeProperty("height");
    }
   }
  }
 }
};

function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = "Program terminated with exit(" + status + ")";
 this.status = status;
}

function callRuntimeCallbacks(callbacks) {
 while (callbacks.length > 0) {
  callbacks.shift()(Module);
 }
}

var wasmTableMirror = [];

function getWasmTableEntry(funcPtr) {
 var func = wasmTableMirror[funcPtr];
 if (!func) {
  if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
  wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
 }
 assert(wasmTable.get(funcPtr) == func, "JavaScript-side Wasm function table mirror is out of date!");
 return func;
}

function exception_decRef(info) {
 if (info.release_ref() && !info.get_rethrown()) {
  var destructor = info.get_destructor();
  if (destructor) {
   getWasmTableEntry(destructor)(info.excPtr);
  }
  ___cxa_free_exception(info.excPtr);
 }
}

function ExceptionInfo(excPtr) {
 this.excPtr = excPtr;
 this.ptr = excPtr - 24;
 this.set_type = function(type) {
  SAFE_HEAP_STORE((this.ptr + 4 >> 2) * 4, type, 4);
 };
 this.get_type = function() {
  return SAFE_HEAP_LOAD((this.ptr + 4 >> 2) * 4, 4, 1);
 };
 this.set_destructor = function(destructor) {
  SAFE_HEAP_STORE((this.ptr + 8 >> 2) * 4, destructor, 4);
 };
 this.get_destructor = function() {
  return SAFE_HEAP_LOAD((this.ptr + 8 >> 2) * 4, 4, 1);
 };
 this.set_refcount = function(refcount) {
  SAFE_HEAP_STORE((this.ptr >> 2) * 4, refcount, 4);
 };
 this.set_caught = function(caught) {
  caught = caught ? 1 : 0;
  SAFE_HEAP_STORE(this.ptr + 12 >> 0, caught, 1);
 };
 this.get_caught = function() {
  return SAFE_HEAP_LOAD(this.ptr + 12 >> 0, 1, 0) != 0;
 };
 this.set_rethrown = function(rethrown) {
  rethrown = rethrown ? 1 : 0;
  SAFE_HEAP_STORE(this.ptr + 13 >> 0, rethrown, 1);
 };
 this.get_rethrown = function() {
  return SAFE_HEAP_LOAD(this.ptr + 13 >> 0, 1, 0) != 0;
 };
 this.init = function(type, destructor) {
  this.set_adjusted_ptr(0);
  this.set_type(type);
  this.set_destructor(destructor);
  this.set_refcount(0);
  this.set_caught(false);
  this.set_rethrown(false);
 };
 this.add_ref = function() {
  var value = SAFE_HEAP_LOAD((this.ptr >> 2) * 4, 4, 0);
  SAFE_HEAP_STORE((this.ptr >> 2) * 4, value + 1, 4);
 };
 this.release_ref = function() {
  var prev = SAFE_HEAP_LOAD((this.ptr >> 2) * 4, 4, 0);
  SAFE_HEAP_STORE((this.ptr >> 2) * 4, prev - 1, 4);
  assert(prev > 0);
  return prev === 1;
 };
 this.set_adjusted_ptr = function(adjustedPtr) {
  SAFE_HEAP_STORE((this.ptr + 16 >> 2) * 4, adjustedPtr, 4);
 };
 this.get_adjusted_ptr = function() {
  return SAFE_HEAP_LOAD((this.ptr + 16 >> 2) * 4, 4, 1);
 };
 this.get_exception_ptr = function() {
  var isPointer = ___cxa_is_pointer_type(this.get_type());
  if (isPointer) {
   return SAFE_HEAP_LOAD((this.excPtr >> 2) * 4, 4, 1);
  }
  var adjusted = this.get_adjusted_ptr();
  if (adjusted !== 0) return adjusted;
  return this.excPtr;
 };
}

function ___cxa_decrement_exception_refcount(ptr) {
 if (!ptr) return;
 exception_decRef(new ExceptionInfo(ptr));
}

function decrementExceptionRefcount(ptr) {
 ___cxa_decrement_exception_refcount(ptr);
}

function withStackSave(f) {
 var stack = stackSave();
 var ret = f();
 stackRestore(stack);
 return ret;
}

function demangle(func) {
 demangle.recursionGuard = (demangle.recursionGuard | 0) + 1;
 if (demangle.recursionGuard > 1) return func;
 return withStackSave(function() {
  try {
   var s = func;
   if (s.startsWith("__Z")) s = s.substr(1);
   var len = lengthBytesUTF8(s) + 1;
   var buf = stackAlloc(len);
   stringToUTF8(s, buf, len);
   var status = stackAlloc(4);
   var ret = ___cxa_demangle(buf, 0, 0, status);
   if (SAFE_HEAP_LOAD((status >> 2) * 4, 4, 0) === 0 && ret) {
    return UTF8ToString(ret);
   }
  } catch (e) {} finally {
   _free(ret);
   if (demangle.recursionGuard < 2) --demangle.recursionGuard;
  }
  return func;
 });
}

function getExceptionMessageCommon(ptr) {
 return withStackSave(function() {
  var type_addr_addr = stackAlloc(4);
  var message_addr_addr = stackAlloc(4);
  ___get_exception_message(ptr, type_addr_addr, message_addr_addr);
  var type_addr = SAFE_HEAP_LOAD((type_addr_addr >> 2) * 4, 4, 1);
  var message_addr = SAFE_HEAP_LOAD((message_addr_addr >> 2) * 4, 4, 1);
  var type = UTF8ToString(type_addr);
  _free(type_addr);
  var message;
  if (message_addr) {
   message = UTF8ToString(message_addr);
   _free(message_addr);
  }
  return [ type, message ];
 });
}

function getExceptionMessage(ptr) {
 return getExceptionMessageCommon(ptr);
}

Module["getExceptionMessage"] = getExceptionMessage;

function getValue(ptr, type = "i8") {
 if (type.endsWith("*")) type = "*";
 switch (type) {
 case "i1":
  return SAFE_HEAP_LOAD(ptr >> 0, 1, 0);

 case "i8":
  return SAFE_HEAP_LOAD(ptr >> 0, 1, 0);

 case "i16":
  return SAFE_HEAP_LOAD((ptr >> 1) * 2, 2, 0);

 case "i32":
  return SAFE_HEAP_LOAD((ptr >> 2) * 4, 4, 0);

 case "i64":
  return SAFE_HEAP_LOAD((ptr >> 2) * 4, 4, 0);

 case "float":
  return SAFE_HEAP_LOAD_D((ptr >> 2) * 4, 4, 0);

 case "double":
  return SAFE_HEAP_LOAD_D((ptr >> 3) * 8, 8, 0);

 case "*":
  return SAFE_HEAP_LOAD((ptr >> 2) * 4, 4, 1);

 default:
  abort("invalid type for getValue: " + type);
 }
}

function getValue_safe(ptr, type = "i8") {
 if (type.endsWith("*")) type = "*";
 switch (type) {
 case "i1":
  return HEAP8[ptr >> 0];

 case "i8":
  return HEAP8[ptr >> 0];

 case "i16":
  return HEAP16[ptr >> 1];

 case "i32":
  return HEAP32[ptr >> 2];

 case "i64":
  return HEAP32[ptr >> 2];

 case "float":
  return HEAPF32[ptr >> 2];

 case "double":
  return HEAPF64[ptr >> 3];

 case "*":
  return HEAPU32[ptr >> 2];

 default:
  abort("invalid type for getValue: " + type);
 }
}

function exception_addRef(info) {
 info.add_ref();
}

function ___cxa_increment_exception_refcount(ptr) {
 if (!ptr) return;
 exception_addRef(new ExceptionInfo(ptr));
}

function incrementExceptionRefcount(ptr) {
 ___cxa_increment_exception_refcount(ptr);
}

function ptrToString(ptr) {
 assert(typeof ptr === "number");
 return "0x" + ptr.toString(16).padStart(8, "0");
}

function setValue(ptr, value, type = "i8") {
 if (type.endsWith("*")) type = "*";
 switch (type) {
 case "i1":
  SAFE_HEAP_STORE(ptr >> 0, value, 1);
  break;

 case "i8":
  SAFE_HEAP_STORE(ptr >> 0, value, 1);
  break;

 case "i16":
  SAFE_HEAP_STORE((ptr >> 1) * 2, value, 2);
  break;

 case "i32":
  SAFE_HEAP_STORE((ptr >> 2) * 4, value, 4);
  break;

 case "i64":
  tempI64 = [ value >>> 0, (tempDouble = value, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ],
  SAFE_HEAP_STORE((ptr >> 2) * 4, tempI64[0], 4), SAFE_HEAP_STORE((ptr + 4 >> 2) * 4, tempI64[1], 4);
  break;

 case "float":
  SAFE_HEAP_STORE_D((ptr >> 2) * 4, value, 4);
  break;

 case "double":
  SAFE_HEAP_STORE_D((ptr >> 3) * 8, value, 8);
  break;

 case "*":
  SAFE_HEAP_STORE((ptr >> 2) * 4, value, 4);
  break;

 default:
  abort("invalid type for setValue: " + type);
 }
}

function setValue_safe(ptr, value, type = "i8") {
 if (type.endsWith("*")) type = "*";
 switch (type) {
 case "i1":
  HEAP8[ptr >> 0] = value;
  break;

 case "i8":
  HEAP8[ptr >> 0] = value;
  break;

 case "i16":
  HEAP16[ptr >> 1] = value;
  break;

 case "i32":
  HEAP32[ptr >> 2] = value;
  break;

 case "i64":
  tempI64 = [ value >>> 0, (tempDouble = value, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ],
  HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
  break;

 case "float":
  HEAPF32[ptr >> 2] = value;
  break;

 case "double":
  HEAPF64[ptr >> 3] = value;
  break;

 case "*":
  HEAPU32[ptr >> 2] = value;
  break;

 default:
  abort("invalid type for setValue: " + type);
 }
}

function jsStackTrace() {
 var error = new Error();
 if (!error.stack) {
  try {
   throw new Error();
  } catch (e) {
   error = e;
  }
  if (!error.stack) {
   return "(no stack trace available)";
  }
 }
 return error.stack.toString();
}

function demangleAll(text) {
 var regex = /\b_Z[\w\d_]+/g;
 return text.replace(regex, function(x) {
  var y = demangle(x);
  return x === y ? x : y + " [" + x + "]";
 });
}

function stackTrace() {
 var js = jsStackTrace();
 if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
 return demangleAll(js);
}

function unSign(value, bits) {
 if (value >= 0) {
  return value;
 }
 return bits <= 32 ? 2 * Math.abs(1 << bits - 1) + value : Math.pow(2, bits) + value;
}

function ___assert_fail(condition, filename, line, func) {
 abort("Assertion failed: " + UTF8ToString(condition) + ", at: " + [ filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function" ]);
}

var exceptionCaught = [];

var uncaughtExceptionCount = 0;

function ___cxa_begin_catch(ptr) {
 var info = new ExceptionInfo(ptr);
 if (!info.get_caught()) {
  info.set_caught(true);
  uncaughtExceptionCount--;
 }
 info.set_rethrown(false);
 exceptionCaught.push(info);
 exception_addRef(info);
 return info.get_exception_ptr();
}

var exceptionLast = 0;

function ___resumeException(ptr) {
 if (!exceptionLast) {
  exceptionLast = ptr;
 }
 throw new CppException(ptr);
}

function ___cxa_find_matching_catch() {
 var thrown = exceptionLast;
 if (!thrown) {
  setTempRet0(0);
  return 0;
 }
 var info = new ExceptionInfo(thrown);
 info.set_adjusted_ptr(thrown);
 var thrownType = info.get_type();
 if (!thrownType) {
  setTempRet0(0);
  return thrown;
 }
 for (var i = 0; i < arguments.length; i++) {
  var caughtType = arguments[i];
  if (caughtType === 0 || caughtType === thrownType) {
   break;
  }
  var adjusted_ptr_addr = info.ptr + 16;
  if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
   setTempRet0(caughtType);
   return thrown;
  }
 }
 setTempRet0(thrownType);
 return thrown;
}

var ___cxa_find_matching_catch_2 = ___cxa_find_matching_catch;

var ___cxa_find_matching_catch_3 = ___cxa_find_matching_catch;

function ___cxa_throw(ptr, type, destructor) {
 var info = new ExceptionInfo(ptr);
 info.init(type, destructor);
 exceptionLast = ptr;
 uncaughtExceptionCount++;
 throw new CppException(ptr);
}

function ___handle_stack_overflow(requested) {
 requested = requested >>> 0;
 var base = _emscripten_stack_get_base();
 var end = _emscripten_stack_get_end();
 abort("stack overflow (Attempt to set SP to " + ptrToString(requested) + ", with stack limits [" + ptrToString(end) + " - " + ptrToString(base) + "]). If you require more stack space build with -sSTACK_SIZE=<bytes>");
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
  throw new TypeError("Unknown type size: " + size);
 }
}

function embind_init_charCodes() {
 var codes = new Array(256);
 for (var i = 0; i < 256; ++i) {
  codes[i] = String.fromCharCode(i);
 }
 embind_charCodes = codes;
}

var embind_charCodes = undefined;

function readLatin1String(ptr) {
 var ret = "";
 var c = ptr;
 while (SAFE_HEAP_LOAD(c, 1, 1)) {
  ret += embind_charCodes[SAFE_HEAP_LOAD(c++, 1, 1)];
 }
 return ret;
}

var awaitingDependencies = {};

var registeredTypes = {};

var typeDependencies = {};

var char_0 = 48;

var char_9 = 57;

function makeLegalFunctionName(name) {
 if (undefined === name) {
  return "_unknown";
 }
 name = name.replace(/[^a-zA-Z0-9_]/g, "$");
 var f = name.charCodeAt(0);
 if (f >= char_0 && f <= char_9) {
  return "_" + name;
 }
 return name;
}

function createNamedFunction(name, body) {
 name = makeLegalFunctionName(name);
 return {
  [name]: function() {
   return body.apply(this, arguments);
  }
 }[name];
}

function extendError(baseErrorType, errorName) {
 var errorClass = createNamedFunction(errorName, function(message) {
  this.name = errorName;
  this.message = message;
  var stack = new Error(message).stack;
  if (stack !== undefined) {
   this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
  }
 });
 errorClass.prototype = Object.create(baseErrorType.prototype);
 errorClass.prototype.constructor = errorClass;
 errorClass.prototype.toString = function() {
  if (this.message === undefined) {
   return this.name;
  } else {
   return this.name + ": " + this.message;
  }
 };
 return errorClass;
}

var BindingError = undefined;

function throwBindingError(message) {
 throw new BindingError(message);
}

var InternalError = undefined;

function throwInternalError(message) {
 throw new InternalError(message);
}

function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
 myTypes.forEach(function(type) {
  typeDependencies[type] = dependentTypes;
 });
 function onComplete(typeConverters) {
  var myTypeConverters = getTypeConverters(typeConverters);
  if (myTypeConverters.length !== myTypes.length) {
   throwInternalError("Mismatched type converter count");
  }
  for (var i = 0; i < myTypes.length; ++i) {
   registerType(myTypes[i], myTypeConverters[i]);
  }
 }
 var typeConverters = new Array(dependentTypes.length);
 var unregisteredTypes = [];
 var registered = 0;
 dependentTypes.forEach((dt, i) => {
  if (registeredTypes.hasOwnProperty(dt)) {
   typeConverters[i] = registeredTypes[dt];
  } else {
   unregisteredTypes.push(dt);
   if (!awaitingDependencies.hasOwnProperty(dt)) {
    awaitingDependencies[dt] = [];
   }
   awaitingDependencies[dt].push(() => {
    typeConverters[i] = registeredTypes[dt];
    ++registered;
    if (registered === unregisteredTypes.length) {
     onComplete(typeConverters);
    }
   });
  }
 });
 if (0 === unregisteredTypes.length) {
  onComplete(typeConverters);
 }
}

function registerType(rawType, registeredInstance, options = {}) {
 if (!("argPackAdvance" in registeredInstance)) {
  throw new TypeError("registerType registeredInstance requires argPackAdvance");
 }
 var name = registeredInstance.name;
 if (!rawType) {
  throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
 }
 if (registeredTypes.hasOwnProperty(rawType)) {
  if (options.ignoreDuplicateRegistrations) {
   return;
  } else {
   throwBindingError("Cannot register type '" + name + "' twice");
  }
 }
 registeredTypes[rawType] = registeredInstance;
 delete typeDependencies[rawType];
 if (awaitingDependencies.hasOwnProperty(rawType)) {
  var callbacks = awaitingDependencies[rawType];
  delete awaitingDependencies[rawType];
  callbacks.forEach(cb => cb());
 }
}

function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": function(wt) {
   return !!wt;
  },
  "toWireType": function(destructors, o) {
   return o ? trueValue : falseValue;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": function(pointer) {
   var heap;
   if (size === 1) {
    heap = HEAP8;
   } else if (size === 2) {
    heap = HEAP16;
   } else if (size === 4) {
    heap = HEAP32;
   } else {
    throw new TypeError("Unknown boolean type size: " + name);
   }
   return this["fromWireType"](heap[pointer >> shift]);
  },
  destructorFunction: null
 });
}

var emval_free_list = [];

var emval_handle_array = [ {}, {
 value: undefined
}, {
 value: null
}, {
 value: true
}, {
 value: false
} ];

function __emval_decref(handle) {
 if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
  emval_handle_array[handle] = undefined;
  emval_free_list.push(handle);
 }
}

function count_emval_handles() {
 var count = 0;
 for (var i = 5; i < emval_handle_array.length; ++i) {
  if (emval_handle_array[i] !== undefined) {
   ++count;
  }
 }
 return count;
}

function get_first_emval() {
 for (var i = 5; i < emval_handle_array.length; ++i) {
  if (emval_handle_array[i] !== undefined) {
   return emval_handle_array[i];
  }
 }
 return null;
}

function init_emval() {
 Module["count_emval_handles"] = count_emval_handles;
 Module["get_first_emval"] = get_first_emval;
}

var Emval = {
 toValue: handle => {
  if (!handle) {
   throwBindingError("Cannot use deleted val. handle = " + handle);
  }
  return emval_handle_array[handle].value;
 },
 toHandle: value => {
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
    var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
    emval_handle_array[handle] = {
     refcount: 1,
     value: value
    };
    return handle;
   }
  }
 }
};

function simpleReadValueFromPointer(pointer) {
 return this["fromWireType"](SAFE_HEAP_LOAD((pointer >> 2) * 4, 4, 0));
}

function __embind_register_emval(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": function(handle) {
   var rv = Emval.toValue(handle);
   __emval_decref(handle);
   return rv;
  },
  "toWireType": function(destructors, value) {
   return Emval.toHandle(value);
  },
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: null
 });
}

function embindRepr(v) {
 if (v === null) {
  return "null";
 }
 var t = typeof v;
 if (t === "object" || t === "array" || t === "function") {
  return v.toString();
 } else {
  return "" + v;
 }
}

function floatReadValueFromPointer(name, shift) {
 switch (shift) {
 case 2:
  return function(pointer) {
   return this["fromWireType"](SAFE_HEAP_LOAD_D((pointer >> 2) * 4, 4, 0));
  };

 case 3:
  return function(pointer) {
   return this["fromWireType"](SAFE_HEAP_LOAD_D((pointer >> 3) * 8, 8, 0));
  };

 default:
  throw new TypeError("Unknown float type: " + name);
 }
}

function __embind_register_float(rawType, name, size) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": function(value) {
   return value;
  },
  "toWireType": function(destructors, value) {
   if (typeof value != "number" && typeof value != "boolean") {
    throw new TypeError('Cannot convert "' + embindRepr(value) + '" to ' + this.name);
   }
   return value;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": floatReadValueFromPointer(name, shift),
  destructorFunction: null
 });
}

function integerReadValueFromPointer(name, shift, signed) {
 switch (shift) {
 case 0:
  return signed ? function readS8FromPointer(pointer) {
   return SAFE_HEAP_LOAD(pointer, 1, 0);
  } : function readU8FromPointer(pointer) {
   return SAFE_HEAP_LOAD(pointer, 1, 1);
  };

 case 1:
  return signed ? function readS16FromPointer(pointer) {
   return SAFE_HEAP_LOAD((pointer >> 1) * 2, 2, 0);
  } : function readU16FromPointer(pointer) {
   return SAFE_HEAP_LOAD((pointer >> 1) * 2, 2, 1);
  };

 case 2:
  return signed ? function readS32FromPointer(pointer) {
   return SAFE_HEAP_LOAD((pointer >> 2) * 4, 4, 0);
  } : function readU32FromPointer(pointer) {
   return SAFE_HEAP_LOAD((pointer >> 2) * 4, 4, 1);
  };

 default:
  throw new TypeError("Unknown integer type: " + name);
 }
}

function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
 name = readLatin1String(name);
 if (maxRange === -1) {
  maxRange = 4294967295;
 }
 var shift = getShiftFromSize(size);
 var fromWireType = value => value;
 if (minRange === 0) {
  var bitshift = 32 - 8 * size;
  fromWireType = value => value << bitshift >>> bitshift;
 }
 var isUnsignedType = name.includes("unsigned");
 var checkAssertions = (value, toTypeName) => {
  if (typeof value != "number" && typeof value != "boolean") {
   throw new TypeError('Cannot convert "' + embindRepr(value) + '" to ' + toTypeName);
  }
  if (value < minRange || value > maxRange) {
   throw new TypeError('Passing a number "' + embindRepr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ", " + maxRange + "]!");
  }
 };
 var toWireType;
 if (isUnsignedType) {
  toWireType = function(destructors, value) {
   checkAssertions(value, this.name);
   return value >>> 0;
  };
 } else {
  toWireType = function(destructors, value) {
   checkAssertions(value, this.name);
   return value;
  };
 }
 registerType(primitiveType, {
  name: name,
  "fromWireType": fromWireType,
  "toWireType": toWireType,
  "argPackAdvance": 8,
  "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0),
  destructorFunction: null
 });
}

function __embind_register_memory_view(rawType, dataTypeIndex, name) {
 var typeMapping = [ Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array ];
 var TA = typeMapping[dataTypeIndex];
 function decodeMemoryView(handle) {
  handle = handle >> 2;
  var heap = HEAPU32;
  var size = heap[handle];
  var data = heap[handle + 1];
  return new TA(heap.buffer, data, size);
 }
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": decodeMemoryView,
  "argPackAdvance": 8,
  "readValueFromPointer": decodeMemoryView
 }, {
  ignoreDuplicateRegistrations: true
 });
}

function __embind_register_std_string(rawType, name) {
 name = readLatin1String(name);
 var stdStringIsUTF8 = name === "std::string";
 registerType(rawType, {
  name: name,
  "fromWireType": function(value) {
   var length = SAFE_HEAP_LOAD((value >> 2) * 4, 4, 1);
   var payload = value + 4;
   var str;
   if (stdStringIsUTF8) {
    var decodeStartPtr = payload;
    for (var i = 0; i <= length; ++i) {
     var currentBytePtr = payload + i;
     if (i == length || SAFE_HEAP_LOAD(currentBytePtr, 1, 1) == 0) {
      var maxRead = currentBytePtr - decodeStartPtr;
      var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
      if (str === undefined) {
       str = stringSegment;
      } else {
       str += String.fromCharCode(0);
       str += stringSegment;
      }
      decodeStartPtr = currentBytePtr + 1;
     }
    }
   } else {
    var a = new Array(length);
    for (var i = 0; i < length; ++i) {
     a[i] = String.fromCharCode(SAFE_HEAP_LOAD(payload + i, 1, 1));
    }
    str = a.join("");
   }
   _free(value);
   return str;
  },
  "toWireType": function(destructors, value) {
   if (value instanceof ArrayBuffer) {
    value = new Uint8Array(value);
   }
   var length;
   var valueIsOfTypeString = typeof value == "string";
   if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
    throwBindingError("Cannot pass non-string to std::string");
   }
   if (stdStringIsUTF8 && valueIsOfTypeString) {
    length = lengthBytesUTF8(value);
   } else {
    length = value.length;
   }
   var base = _malloc(4 + length + 1);
   var ptr = base + 4;
   SAFE_HEAP_STORE((base >> 2) * 4, length, 4);
   if (stdStringIsUTF8 && valueIsOfTypeString) {
    stringToUTF8(value, ptr, length + 1);
   } else {
    if (valueIsOfTypeString) {
     for (var i = 0; i < length; ++i) {
      var charCode = value.charCodeAt(i);
      if (charCode > 255) {
       _free(ptr);
       throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
      }
      SAFE_HEAP_STORE(ptr + i, charCode, 1);
     }
    } else {
     for (var i = 0; i < length; ++i) {
      SAFE_HEAP_STORE(ptr + i, value[i], 1);
     }
    }
   }
   if (destructors !== null) {
    destructors.push(_free, base);
   }
   return base;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: function(ptr) {
   _free(ptr);
  }
 });
}

var UTF16Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf-16le") : undefined;

function UTF16ToString(ptr, maxBytesToRead) {
 assert(ptr % 2 == 0, "Pointer passed to UTF16ToString must be aligned to two bytes!");
 var endPtr = ptr;
 var idx = endPtr >> 1;
 var maxIdx = idx + maxBytesToRead / 2;
 while (!(idx >= maxIdx) && SAFE_HEAP_LOAD(idx * 2, 2, 1)) ++idx;
 endPtr = idx << 1;
 if (endPtr - ptr > 32 && UTF16Decoder) return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
 var str = "";
 for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
  var codeUnit = SAFE_HEAP_LOAD((ptr + i * 2 >> 1) * 2, 2, 0);
  if (codeUnit == 0) break;
  str += String.fromCharCode(codeUnit);
 }
 return str;
}

function stringToUTF16(str, outPtr, maxBytesToWrite) {
 assert(outPtr % 2 == 0, "Pointer passed to stringToUTF16 must be aligned to two bytes!");
 assert(typeof maxBytesToWrite == "number", "stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
 if (maxBytesToWrite === undefined) {
  maxBytesToWrite = 2147483647;
 }
 if (maxBytesToWrite < 2) return 0;
 maxBytesToWrite -= 2;
 var startPtr = outPtr;
 var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
 for (var i = 0; i < numCharsToWrite; ++i) {
  var codeUnit = str.charCodeAt(i);
  SAFE_HEAP_STORE((outPtr >> 1) * 2, codeUnit, 2);
  outPtr += 2;
 }
 SAFE_HEAP_STORE((outPtr >> 1) * 2, 0, 2);
 return outPtr - startPtr;
}

function lengthBytesUTF16(str) {
 return str.length * 2;
}

function UTF32ToString(ptr, maxBytesToRead) {
 assert(ptr % 4 == 0, "Pointer passed to UTF32ToString must be aligned to four bytes!");
 var i = 0;
 var str = "";
 while (!(i >= maxBytesToRead / 4)) {
  var utf32 = SAFE_HEAP_LOAD((ptr + i * 4 >> 2) * 4, 4, 0);
  if (utf32 == 0) break;
  ++i;
  if (utf32 >= 65536) {
   var ch = utf32 - 65536;
   str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
  } else {
   str += String.fromCharCode(utf32);
  }
 }
 return str;
}

function stringToUTF32(str, outPtr, maxBytesToWrite) {
 assert(outPtr % 4 == 0, "Pointer passed to stringToUTF32 must be aligned to four bytes!");
 assert(typeof maxBytesToWrite == "number", "stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
 if (maxBytesToWrite === undefined) {
  maxBytesToWrite = 2147483647;
 }
 if (maxBytesToWrite < 4) return 0;
 var startPtr = outPtr;
 var endPtr = startPtr + maxBytesToWrite - 4;
 for (var i = 0; i < str.length; ++i) {
  var codeUnit = str.charCodeAt(i);
  if (codeUnit >= 55296 && codeUnit <= 57343) {
   var trailSurrogate = str.charCodeAt(++i);
   codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
  }
  SAFE_HEAP_STORE((outPtr >> 2) * 4, codeUnit, 4);
  outPtr += 4;
  if (outPtr + 4 > endPtr) break;
 }
 SAFE_HEAP_STORE((outPtr >> 2) * 4, 0, 4);
 return outPtr - startPtr;
}

function lengthBytesUTF32(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var codeUnit = str.charCodeAt(i);
  if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
  len += 4;
 }
 return len;
}

function __embind_register_std_wstring(rawType, charSize, name) {
 name = readLatin1String(name);
 var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
 if (charSize === 2) {
  decodeString = UTF16ToString;
  encodeString = stringToUTF16;
  lengthBytesUTF = lengthBytesUTF16;
  getHeap = () => HEAPU16;
  shift = 1;
 } else if (charSize === 4) {
  decodeString = UTF32ToString;
  encodeString = stringToUTF32;
  lengthBytesUTF = lengthBytesUTF32;
  getHeap = () => HEAPU32;
  shift = 2;
 }
 registerType(rawType, {
  name: name,
  "fromWireType": function(value) {
   var length = SAFE_HEAP_LOAD((value >> 2) * 4, 4, 1);
   var HEAP = getHeap();
   var str;
   var decodeStartPtr = value + 4;
   for (var i = 0; i <= length; ++i) {
    var currentBytePtr = value + 4 + i * charSize;
    if (i == length || HEAP[currentBytePtr >> shift] == 0) {
     var maxReadBytes = currentBytePtr - decodeStartPtr;
     var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
     if (str === undefined) {
      str = stringSegment;
     } else {
      str += String.fromCharCode(0);
      str += stringSegment;
     }
     decodeStartPtr = currentBytePtr + charSize;
    }
   }
   _free(value);
   return str;
  },
  "toWireType": function(destructors, value) {
   if (!(typeof value == "string")) {
    throwBindingError("Cannot pass non-string to C++ string type " + name);
   }
   var length = lengthBytesUTF(value);
   var ptr = _malloc(4 + length + charSize);
   SAFE_HEAP_STORE((ptr >> 2) * 4, length >> shift, 4);
   encodeString(value, ptr + 4, length + charSize);
   if (destructors !== null) {
    destructors.push(_free, ptr);
   }
   return ptr;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: function(ptr) {
   _free(ptr);
  }
 });
}

function __embind_register_void(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  isVoid: true,
  name: name,
  "argPackAdvance": 0,
  "fromWireType": function() {
   return undefined;
  },
  "toWireType": function(destructors, o) {
   return undefined;
  }
 });
}

var nowIsMonotonic = true;

function __emscripten_get_now_is_monotonic() {
 return nowIsMonotonic;
}

function _abort() {
 abort("native code called abort()");
}

function _emscripten_date_now() {
 return Date.now();
}

function _emscripten_memcpy_big(dest, src, num) {
 HEAPU8.copyWithin(dest, src, src + num);
}

function getHeapMax() {
 return HEAPU8.length;
}

function abortOnCannotGrowMemory(requestedSize) {
 abort("Cannot enlarge memory arrays to size " + requestedSize + " bytes (OOM). Either (1) compile with -sINITIAL_MEMORY=X with X higher than the current value " + HEAP8.length + ", (2) compile with -sALLOW_MEMORY_GROWTH which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with -sABORTING_MALLOC=0");
}

function _emscripten_resize_heap(requestedSize) {
 var oldSize = HEAPU8.length;
 requestedSize = requestedSize >>> 0;
 abortOnCannotGrowMemory(requestedSize);
}

var SYSCALLS = {
 varargs: undefined,
 get: function() {
  assert(SYSCALLS.varargs != undefined);
  SYSCALLS.varargs += 4;
  var ret = SAFE_HEAP_LOAD((SYSCALLS.varargs - 4 >> 2) * 4, 4, 0);
  return ret;
 },
 getStr: function(ptr) {
  var ret = UTF8ToString(ptr);
  return ret;
 }
};

function _fd_close(fd) {
 abort("fd_close called without SYSCALLS_REQUIRE_FILESYSTEM");
}

function convertI32PairToI53Checked(lo, hi) {
 assert(lo == lo >>> 0 || lo == (lo | 0));
 assert(hi === (hi | 0));
 return hi + 2097152 >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN;
}

function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
 return 70;
}

var printCharBuffers = [ null, [], [] ];

function printChar(stream, curr) {
 var buffer = printCharBuffers[stream];
 assert(buffer);
 if (curr === 0 || curr === 10) {
  (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
  buffer.length = 0;
 } else {
  buffer.push(curr);
 }
}

function flush_NO_FILESYSTEM() {
 _fflush(0);
 if (printCharBuffers[1].length) printChar(1, 10);
 if (printCharBuffers[2].length) printChar(2, 10);
}

function _fd_write(fd, iov, iovcnt, pnum) {
 var num = 0;
 for (var i = 0; i < iovcnt; i++) {
  var ptr = SAFE_HEAP_LOAD((iov >> 2) * 4, 4, 1);
  var len = SAFE_HEAP_LOAD((iov + 4 >> 2) * 4, 4, 1);
  iov += 8;
  for (var j = 0; j < len; j++) {
   printChar(fd, SAFE_HEAP_LOAD(ptr + j, 1, 1));
  }
  num += len;
 }
 SAFE_HEAP_STORE((pnum >> 2) * 4, num, 4);
 return 0;
}

function _proc_exit(code) {
 EXITSTATUS = code;
 if (!keepRuntimeAlive()) {
  if (Module["onExit"]) Module["onExit"](code);
  ABORT = true;
 }
 quit_(code, new ExitStatus(code));
}

function exitJS(status, implicit) {
 EXITSTATUS = status;
 checkUnflushedContent();
 if (keepRuntimeAlive() && !implicit) {
  var msg = "program exited (with status: " + status + "), but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)";
  err(msg);
 }
 _proc_exit(status);
}

function getCFunc(ident) {
 var func = Module["_" + ident];
 assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
 return func;
}

function writeArrayToMemory(array, buffer) {
 assert(array.length >= 0, "writeArrayToMemory array must have a length (should be an array or typed array)");
 HEAP8.set(array, buffer);
}

function ccall(ident, returnType, argTypes, args, opts) {
 var toC = {
  "string": str => {
   var ret = 0;
   if (str !== null && str !== undefined && str !== 0) {
    var len = (str.length << 2) + 1;
    ret = stackAlloc(len);
    stringToUTF8(str, ret, len);
   }
   return ret;
  },
  "array": arr => {
   var ret = stackAlloc(arr.length);
   writeArrayToMemory(arr, ret);
   return ret;
  }
 };
 function convertReturnValue(ret) {
  if (returnType === "string") {
   return UTF8ToString(ret);
  }
  if (returnType === "boolean") return Boolean(ret);
  return ret;
 }
 var func = getCFunc(ident);
 var cArgs = [];
 var stack = 0;
 assert(returnType !== "array", 'Return type should not be "array".');
 if (args) {
  for (var i = 0; i < args.length; i++) {
   var converter = toC[argTypes[i]];
   if (converter) {
    if (stack === 0) stack = stackSave();
    cArgs[i] = converter(args[i]);
   } else {
    cArgs[i] = args[i];
   }
  }
 }
 var ret = func.apply(null, cArgs);
 function onDone(ret) {
  if (stack !== 0) stackRestore(stack);
  return convertReturnValue(ret);
 }
 ret = onDone(ret);
 return ret;
}

function cwrap(ident, returnType, argTypes, opts) {
 return function() {
  return ccall(ident, returnType, argTypes, arguments, opts);
 };
}

function AsciiToString(ptr) {
 var str = "";
 while (1) {
  var ch = SAFE_HEAP_LOAD(ptr++ >> 0, 1, 1);
  if (!ch) return str;
  str += String.fromCharCode(ch);
 }
}

Module["requestFullscreen"] = function Module_requestFullscreen(lockPointer, resizeCanvas) {
 Browser.requestFullscreen(lockPointer, resizeCanvas);
};

Module["requestFullScreen"] = function Module_requestFullScreen() {
 Browser.requestFullScreen();
};

Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) {
 Browser.requestAnimationFrame(func);
};

Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) {
 Browser.setCanvasSize(width, height, noUpdates);
};

Module["pauseMainLoop"] = function Module_pauseMainLoop() {
 Browser.mainLoop.pause();
};

Module["resumeMainLoop"] = function Module_resumeMainLoop() {
 Browser.mainLoop.resume();
};

Module["getUserMedia"] = function Module_getUserMedia() {
 Browser.getUserMedia();
};

Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
 return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes);
};

var preloadedImages = {};

var preloadedAudios = {};

embind_init_charCodes();

BindingError = Module["BindingError"] = extendError(Error, "BindingError");

InternalError = Module["InternalError"] = extendError(Error, "InternalError");

init_emval();

function checkIncomingModuleAPI() {
 ignoredModuleProp("fetchSettings");
}

var wasmImports = {
 "__assert_fail": ___assert_fail,
 "__cxa_begin_catch": ___cxa_begin_catch,
 "__cxa_find_matching_catch_2": ___cxa_find_matching_catch_2,
 "__cxa_find_matching_catch_3": ___cxa_find_matching_catch_3,
 "__cxa_throw": ___cxa_throw,
 "__handle_stack_overflow": ___handle_stack_overflow,
 "__resumeException": ___resumeException,
 "_embind_register_bigint": __embind_register_bigint,
 "_embind_register_bool": __embind_register_bool,
 "_embind_register_emval": __embind_register_emval,
 "_embind_register_float": __embind_register_float,
 "_embind_register_integer": __embind_register_integer,
 "_embind_register_memory_view": __embind_register_memory_view,
 "_embind_register_std_string": __embind_register_std_string,
 "_embind_register_std_wstring": __embind_register_std_wstring,
 "_embind_register_void": __embind_register_void,
 "_emscripten_get_now_is_monotonic": __emscripten_get_now_is_monotonic,
 "abort": _abort,
 "alignfault": alignfault,
 "emscripten_date_now": _emscripten_date_now,
 "emscripten_get_now": _emscripten_get_now,
 "emscripten_memcpy_big": _emscripten_memcpy_big,
 "emscripten_resize_heap": _emscripten_resize_heap,
 "fd_close": _fd_close,
 "fd_seek": _fd_seek,
 "fd_write": _fd_write,
 "invoke_ii": invoke_ii,
 "invoke_iii": invoke_iii,
 "invoke_iiii": invoke_iiii,
 "invoke_iiiii": invoke_iiiii,
 "invoke_iiiiii": invoke_iiiiii,
 "invoke_v": invoke_v,
 "invoke_vi": invoke_vi,
 "invoke_vii": invoke_vii,
 "invoke_viii": invoke_viii,
 "invoke_viiii": invoke_viiii,
 "qeStarted": qeStarted,
 "segfault": segfault
};

var asm = createWasm();

var ___wasm_call_ctors = createExportWrapper("__wasm_call_ctors");

var _main = Module["_main"] = createExportWrapper("main");

var _free = Module["_free"] = createExportWrapper("free");

var getTempRet0 = createExportWrapper("getTempRet0");

var ___cxa_free_exception = createExportWrapper("__cxa_free_exception");

var _malloc = createExportWrapper("malloc");

var _avatar_dumpViewBuffer = Module["_avatar_dumpViewBuffer"] = createExportWrapper("avatar_dumpViewBuffer");

var _avatar_getViewBuffer = Module["_avatar_getViewBuffer"] = createExportWrapper("avatar_getViewBuffer");

var _avatar_loadViewBuffer = Module["_avatar_loadViewBuffer"] = createExportWrapper("avatar_loadViewBuffer");

var _qSpace_dumpVoltage = Module["_qSpace_dumpVoltage"] = createExportWrapper("qSpace_dumpVoltage");

var _wave_normalize = Module["_wave_normalize"] = createExportWrapper("wave_normalize");

var _startNewSpace = Module["_startNewSpace"] = createExportWrapper("startNewSpace");

var _addSpaceDimension = Module["_addSpaceDimension"] = createExportWrapper("addSpaceDimension");

var _completeNewSpace = Module["_completeNewSpace"] = createExportWrapper("completeNewSpace");

var _deleteFullSpace = Module["_deleteFullSpace"] = createExportWrapper("deleteFullSpace");

var _getCppExceptionMessage = Module["_getCppExceptionMessage"] = createExportWrapper("getCppExceptionMessage");

var _grinder_initThreadIntegration = Module["_grinder_initThreadIntegration"] = createExportWrapper("grinder_initThreadIntegration");

var _grinder_askForFFT = Module["_grinder_askForFFT"] = createExportWrapper("grinder_askForFFT");

var _grinder_oneFrame = Module["_grinder_oneFrame"] = createExportWrapper("grinder_oneFrame");

var _grinder_copyFromAvatar = Module["_grinder_copyFromAvatar"] = createExportWrapper("grinder_copyFromAvatar");

var _grinder_copyToAvatar = Module["_grinder_copyToAvatar"] = createExportWrapper("grinder_copyToAvatar");

var ___getTypeName = Module["___getTypeName"] = createExportWrapper("__getTypeName");

var __embind_initialize_bindings = Module["__embind_initialize_bindings"] = createExportWrapper("_embind_initialize_bindings");

var ___errno_location = createExportWrapper("__errno_location");

var _fflush = Module["_fflush"] = createExportWrapper("fflush");

var _sbrk = createExportWrapper("sbrk");

var _emscripten_get_sbrk_ptr = createExportWrapper("emscripten_get_sbrk_ptr");

var _setThrew = createExportWrapper("setThrew");

var setTempRet0 = createExportWrapper("setTempRet0");

var _emscripten_stack_init = function() {
 return (_emscripten_stack_init = Module["asm"]["emscripten_stack_init"]).apply(null, arguments);
};

var _emscripten_stack_get_free = function() {
 return (_emscripten_stack_get_free = Module["asm"]["emscripten_stack_get_free"]).apply(null, arguments);
};

var _emscripten_stack_get_base = function() {
 return (_emscripten_stack_get_base = Module["asm"]["emscripten_stack_get_base"]).apply(null, arguments);
};

var _emscripten_stack_get_end = function() {
 return (_emscripten_stack_get_end = Module["asm"]["emscripten_stack_get_end"]).apply(null, arguments);
};

var stackSave = createExportWrapper("stackSave");

var stackRestore = createExportWrapper("stackRestore");

var stackAlloc = createExportWrapper("stackAlloc");

var _emscripten_stack_get_current = function() {
 return (_emscripten_stack_get_current = Module["asm"]["emscripten_stack_get_current"]).apply(null, arguments);
};

var ___cxa_demangle = createExportWrapper("__cxa_demangle");

var ___get_exception_message = Module["___get_exception_message"] = createExportWrapper("__get_exception_message");

var ___cxa_can_catch = createExportWrapper("__cxa_can_catch");

var ___cxa_is_pointer_type = createExportWrapper("__cxa_is_pointer_type");

var ___set_stack_limits = Module["___set_stack_limits"] = createExportWrapper("__set_stack_limits");

var dynCall_jiji = Module["dynCall_jiji"] = createExportWrapper("dynCall_jiji");

var ___start_em_js = Module["___start_em_js"] = 96884;

var ___stop_em_js = Module["___stop_em_js"] = 97255;

function invoke_iii(index, a1, a2) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (!(e instanceof EmscriptenEH)) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vi(index, a1) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1);
 } catch (e) {
  stackRestore(sp);
  if (!(e instanceof EmscriptenEH)) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viii(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (!(e instanceof EmscriptenEH)) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiii(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (!(e instanceof EmscriptenEH)) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vii(index, a1, a2) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (!(e instanceof EmscriptenEH)) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiii(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (!(e instanceof EmscriptenEH)) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (!(e instanceof EmscriptenEH)) throw e;
  _setThrew(1, 0);
 }
}

function invoke_ii(index, a1) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1);
 } catch (e) {
  stackRestore(sp);
  if (!(e instanceof EmscriptenEH)) throw e;
  _setThrew(1, 0);
 }
}

function invoke_v(index) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)();
 } catch (e) {
  stackRestore(sp);
  if (!(e instanceof EmscriptenEH)) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiii(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (!(e instanceof EmscriptenEH)) throw e;
  _setThrew(1, 0);
 }
}

if (ENVIRONMENT_IS_WORKER) {
 function WebGLBuffer(id) {
  this.what = "buffer";
  this.id = id;
 }
 function WebGLProgram(id) {
  this.what = "program";
  this.id = id;
  this.shaders = [];
  this.attributes = {};
  this.attributeVec = [];
  this.nextAttributes = {};
  this.nextAttributeVec = [];
 }
 function WebGLFramebuffer(id) {
  this.what = "frameBuffer";
  this.id = id;
 }
 function WebGLRenderbuffer(id) {
  this.what = "renderBuffer";
  this.id = id;
 }
 function WebGLTexture(id) {
  this.what = "texture";
  this.id = id;
  this.binding = 0;
 }
 function WebGLWorker() {
  this.DEPTH_BUFFER_BIT = 256;
  this.STENCIL_BUFFER_BIT = 1024;
  this.COLOR_BUFFER_BIT = 16384;
  this.POINTS = 0;
  this.LINES = 1;
  this.LINE_LOOP = 2;
  this.LINE_STRIP = 3;
  this.TRIANGLES = 4;
  this.TRIANGLE_STRIP = 5;
  this.TRIANGLE_FAN = 6;
  this.ZERO = 0;
  this.ONE = 1;
  this.SRC_COLOR = 768;
  this.ONE_MINUS_SRC_COLOR = 769;
  this.SRC_ALPHA = 770;
  this.ONE_MINUS_SRC_ALPHA = 771;
  this.DST_ALPHA = 772;
  this.ONE_MINUS_DST_ALPHA = 773;
  this.DST_COLOR = 774;
  this.ONE_MINUS_DST_COLOR = 775;
  this.SRC_ALPHA_SATURATE = 776;
  this.FUNC_ADD = 32774;
  this.BLEND_EQUATION = 32777;
  this.BLEND_EQUATION_RGB = 32777;
  this.BLEND_EQUATION_ALPHA = 34877;
  this.FUNC_SUBTRACT = 32778;
  this.FUNC_REVERSE_SUBTRACT = 32779;
  this.BLEND_DST_RGB = 32968;
  this.BLEND_SRC_RGB = 32969;
  this.BLEND_DST_ALPHA = 32970;
  this.BLEND_SRC_ALPHA = 32971;
  this.CONSTANT_COLOR = 32769;
  this.ONE_MINUS_CONSTANT_COLOR = 32770;
  this.CONSTANT_ALPHA = 32771;
  this.ONE_MINUS_CONSTANT_ALPHA = 32772;
  this.BLEND_COLOR = 32773;
  this.ARRAY_BUFFER = 34962;
  this.ELEMENT_ARRAY_BUFFER = 34963;
  this.ARRAY_BUFFER_BINDING = 34964;
  this.ELEMENT_ARRAY_BUFFER_BINDING = 34965;
  this.STREAM_DRAW = 35040;
  this.STATIC_DRAW = 35044;
  this.DYNAMIC_DRAW = 35048;
  this.BUFFER_SIZE = 34660;
  this.BUFFER_USAGE = 34661;
  this.CURRENT_VERTEX_ATTRIB = 34342;
  this.FRONT = 1028;
  this.BACK = 1029;
  this.FRONT_AND_BACK = 1032;
  this.CULL_FACE = 2884;
  this.BLEND = 3042;
  this.DITHER = 3024;
  this.STENCIL_TEST = 2960;
  this.DEPTH_TEST = 2929;
  this.SCISSOR_TEST = 3089;
  this.POLYGON_OFFSET_FILL = 32823;
  this.SAMPLE_ALPHA_TO_COVERAGE = 32926;
  this.SAMPLE_COVERAGE = 32928;
  this.NO_ERROR = 0;
  this.INVALID_ENUM = 1280;
  this.INVALID_VALUE = 1281;
  this.INVALID_OPERATION = 1282;
  this.OUT_OF_MEMORY = 1285;
  this.CW = 2304;
  this.CCW = 2305;
  this.LINE_WIDTH = 2849;
  this.ALIASED_POINT_SIZE_RANGE = 33901;
  this.ALIASED_LINE_WIDTH_RANGE = 33902;
  this.CULL_FACE_MODE = 2885;
  this.FRONT_FACE = 2886;
  this.DEPTH_RANGE = 2928;
  this.DEPTH_WRITEMASK = 2930;
  this.DEPTH_CLEAR_VALUE = 2931;
  this.DEPTH_FUNC = 2932;
  this.STENCIL_CLEAR_VALUE = 2961;
  this.STENCIL_FUNC = 2962;
  this.STENCIL_FAIL = 2964;
  this.STENCIL_PASS_DEPTH_FAIL = 2965;
  this.STENCIL_PASS_DEPTH_PASS = 2966;
  this.STENCIL_REF = 2967;
  this.STENCIL_VALUE_MASK = 2963;
  this.STENCIL_WRITEMASK = 2968;
  this.STENCIL_BACK_FUNC = 34816;
  this.STENCIL_BACK_FAIL = 34817;
  this.STENCIL_BACK_PASS_DEPTH_FAIL = 34818;
  this.STENCIL_BACK_PASS_DEPTH_PASS = 34819;
  this.STENCIL_BACK_REF = 36003;
  this.STENCIL_BACK_VALUE_MASK = 36004;
  this.STENCIL_BACK_WRITEMASK = 36005;
  this.VIEWPORT = 2978;
  this.SCISSOR_BOX = 3088;
  this.COLOR_CLEAR_VALUE = 3106;
  this.COLOR_WRITEMASK = 3107;
  this.UNPACK_ALIGNMENT = 3317;
  this.PACK_ALIGNMENT = 3333;
  this.MAX_TEXTURE_SIZE = 3379;
  this.MAX_VIEWPORT_DIMS = 3386;
  this.SUBPIXEL_BITS = 3408;
  this.RED_BITS = 3410;
  this.GREEN_BITS = 3411;
  this.BLUE_BITS = 3412;
  this.ALPHA_BITS = 3413;
  this.DEPTH_BITS = 3414;
  this.STENCIL_BITS = 3415;
  this.POLYGON_OFFSET_UNITS = 10752;
  this.POLYGON_OFFSET_FACTOR = 32824;
  this.TEXTURE_BINDING_2D = 32873;
  this.SAMPLE_BUFFERS = 32936;
  this.SAMPLES = 32937;
  this.SAMPLE_COVERAGE_VALUE = 32938;
  this.SAMPLE_COVERAGE_INVERT = 32939;
  this.COMPRESSED_TEXTURE_FORMATS = 34467;
  this.DONT_CARE = 4352;
  this.FASTEST = 4353;
  this.NICEST = 4354;
  this.GENERATE_MIPMAP_HINT = 33170;
  this.BYTE = 5120;
  this.UNSIGNED_BYTE = 5121;
  this.SHORT = 5122;
  this.UNSIGNED_SHORT = 5123;
  this.INT = 5124;
  this.UNSIGNED_INT = 5125;
  this.FLOAT = 5126;
  this.DEPTH_COMPONENT = 6402;
  this.ALPHA = 6406;
  this.RGB = 6407;
  this.RGBA = 6408;
  this.LUMINANCE = 6409;
  this.LUMINANCE_ALPHA = 6410;
  this.UNSIGNED_SHORT_4_4_4_4 = 32819;
  this.UNSIGNED_SHORT_5_5_5_1 = 32820;
  this.UNSIGNED_SHORT_5_6_5 = 33635;
  this.FRAGMENT_SHADER = 35632;
  this.VERTEX_SHADER = 35633;
  this.MAX_VERTEX_ATTRIBS = 34921;
  this.MAX_VERTEX_UNIFORM_VECTORS = 36347;
  this.MAX_VARYING_VECTORS = 36348;
  this.MAX_COMBINED_TEXTURE_IMAGE_UNITS = 35661;
  this.MAX_VERTEX_TEXTURE_IMAGE_UNITS = 35660;
  this.MAX_TEXTURE_IMAGE_UNITS = 34930;
  this.MAX_FRAGMENT_UNIFORM_VECTORS = 36349;
  this.SHADER_TYPE = 35663;
  this.DELETE_STATUS = 35712;
  this.LINK_STATUS = 35714;
  this.VALIDATE_STATUS = 35715;
  this.ATTACHED_SHADERS = 35717;
  this.ACTIVE_UNIFORMS = 35718;
  this.ACTIVE_ATTRIBUTES = 35721;
  this.SHADING_LANGUAGE_VERSION = 35724;
  this.CURRENT_PROGRAM = 35725;
  this.NEVER = 512;
  this.LESS = 513;
  this.EQUAL = 514;
  this.LEQUAL = 515;
  this.GREATER = 516;
  this.NOTEQUAL = 517;
  this.GEQUAL = 518;
  this.ALWAYS = 519;
  this.KEEP = 7680;
  this.REPLACE = 7681;
  this.INCR = 7682;
  this.DECR = 7683;
  this.INVERT = 5386;
  this.INCR_WRAP = 34055;
  this.DECR_WRAP = 34056;
  this.VENDOR = 7936;
  this.RENDERER = 7937;
  this.VERSION = 7938;
  this.NEAREST = 9728;
  this.LINEAR = 9729;
  this.NEAREST_MIPMAP_NEAREST = 9984;
  this.LINEAR_MIPMAP_NEAREST = 9985;
  this.NEAREST_MIPMAP_LINEAR = 9986;
  this.LINEAR_MIPMAP_LINEAR = 9987;
  this.TEXTURE_MAG_FILTER = 10240;
  this.TEXTURE_MIN_FILTER = 10241;
  this.TEXTURE_WRAP_S = 10242;
  this.TEXTURE_WRAP_T = 10243;
  this.TEXTURE_2D = 3553;
  this.TEXTURE = 5890;
  this.TEXTURE_CUBE_MAP = 34067;
  this.TEXTURE_BINDING_CUBE_MAP = 34068;
  this.TEXTURE_CUBE_MAP_POSITIVE_X = 34069;
  this.TEXTURE_CUBE_MAP_NEGATIVE_X = 34070;
  this.TEXTURE_CUBE_MAP_POSITIVE_Y = 34071;
  this.TEXTURE_CUBE_MAP_NEGATIVE_Y = 34072;
  this.TEXTURE_CUBE_MAP_POSITIVE_Z = 34073;
  this.TEXTURE_CUBE_MAP_NEGATIVE_Z = 34074;
  this.MAX_CUBE_MAP_TEXTURE_SIZE = 34076;
  this.TEXTURE0 = 33984;
  this.TEXTURE1 = 33985;
  this.TEXTURE2 = 33986;
  this.TEXTURE3 = 33987;
  this.TEXTURE4 = 33988;
  this.TEXTURE5 = 33989;
  this.TEXTURE6 = 33990;
  this.TEXTURE7 = 33991;
  this.TEXTURE8 = 33992;
  this.TEXTURE9 = 33993;
  this.TEXTURE10 = 33994;
  this.TEXTURE11 = 33995;
  this.TEXTURE12 = 33996;
  this.TEXTURE13 = 33997;
  this.TEXTURE14 = 33998;
  this.TEXTURE15 = 33999;
  this.TEXTURE16 = 34e3;
  this.TEXTURE17 = 34001;
  this.TEXTURE18 = 34002;
  this.TEXTURE19 = 34003;
  this.TEXTURE20 = 34004;
  this.TEXTURE21 = 34005;
  this.TEXTURE22 = 34006;
  this.TEXTURE23 = 34007;
  this.TEXTURE24 = 34008;
  this.TEXTURE25 = 34009;
  this.TEXTURE26 = 34010;
  this.TEXTURE27 = 34011;
  this.TEXTURE28 = 34012;
  this.TEXTURE29 = 34013;
  this.TEXTURE30 = 34014;
  this.TEXTURE31 = 34015;
  this.ACTIVE_TEXTURE = 34016;
  this.REPEAT = 10497;
  this.CLAMP_TO_EDGE = 33071;
  this.MIRRORED_REPEAT = 33648;
  this.FLOAT_VEC2 = 35664;
  this.FLOAT_VEC3 = 35665;
  this.FLOAT_VEC4 = 35666;
  this.INT_VEC2 = 35667;
  this.INT_VEC3 = 35668;
  this.INT_VEC4 = 35669;
  this.BOOL = 35670;
  this.BOOL_VEC2 = 35671;
  this.BOOL_VEC3 = 35672;
  this.BOOL_VEC4 = 35673;
  this.FLOAT_MAT2 = 35674;
  this.FLOAT_MAT3 = 35675;
  this.FLOAT_MAT4 = 35676;
  this.SAMPLER_2D = 35678;
  this.SAMPLER_3D = 35679;
  this.SAMPLER_CUBE = 35680;
  this.VERTEX_ATTRIB_ARRAY_ENABLED = 34338;
  this.VERTEX_ATTRIB_ARRAY_SIZE = 34339;
  this.VERTEX_ATTRIB_ARRAY_STRIDE = 34340;
  this.VERTEX_ATTRIB_ARRAY_TYPE = 34341;
  this.VERTEX_ATTRIB_ARRAY_NORMALIZED = 34922;
  this.VERTEX_ATTRIB_ARRAY_POINTER = 34373;
  this.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING = 34975;
  this.IMPLEMENTATION_COLOR_READ_TYPE = 35738;
  this.IMPLEMENTATION_COLOR_READ_FORMAT = 35739;
  this.COMPILE_STATUS = 35713;
  this.LOW_FLOAT = 36336;
  this.MEDIUM_FLOAT = 36337;
  this.HIGH_FLOAT = 36338;
  this.LOW_INT = 36339;
  this.MEDIUM_INT = 36340;
  this.HIGH_INT = 36341;
  this.FRAMEBUFFER = 36160;
  this.RENDERBUFFER = 36161;
  this.RGBA4 = 32854;
  this.RGB5_A1 = 32855;
  this.RGB565 = 36194;
  this.DEPTH_COMPONENT16 = 33189;
  this.STENCIL_INDEX = 6401;
  this.STENCIL_INDEX8 = 36168;
  this.DEPTH_STENCIL = 34041;
  this.RENDERBUFFER_WIDTH = 36162;
  this.RENDERBUFFER_HEIGHT = 36163;
  this.RENDERBUFFER_INTERNAL_FORMAT = 36164;
  this.RENDERBUFFER_RED_SIZE = 36176;
  this.RENDERBUFFER_GREEN_SIZE = 36177;
  this.RENDERBUFFER_BLUE_SIZE = 36178;
  this.RENDERBUFFER_ALPHA_SIZE = 36179;
  this.RENDERBUFFER_DEPTH_SIZE = 36180;
  this.RENDERBUFFER_STENCIL_SIZE = 36181;
  this.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE = 36048;
  this.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME = 36049;
  this.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL = 36050;
  this.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE = 36051;
  this.COLOR_ATTACHMENT0 = 36064;
  this.DEPTH_ATTACHMENT = 36096;
  this.STENCIL_ATTACHMENT = 36128;
  this.DEPTH_STENCIL_ATTACHMENT = 33306;
  this.NONE = 0;
  this.FRAMEBUFFER_COMPLETE = 36053;
  this.FRAMEBUFFER_INCOMPLETE_ATTACHMENT = 36054;
  this.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = 36055;
  this.FRAMEBUFFER_INCOMPLETE_DIMENSIONS = 36057;
  this.FRAMEBUFFER_UNSUPPORTED = 36061;
  this.ACTIVE_TEXTURE = 34016;
  this.FRAMEBUFFER_BINDING = 36006;
  this.RENDERBUFFER_BINDING = 36007;
  this.MAX_RENDERBUFFER_SIZE = 34024;
  this.INVALID_FRAMEBUFFER_OPERATION = 1286;
  this.UNPACK_FLIP_Y_WEBGL = 37440;
  this.UNPACK_PREMULTIPLY_ALPHA_WEBGL = 37441;
  this.CONTEXT_LOST_WEBGL = 37442;
  this.UNPACK_COLORSPACE_CONVERSION_WEBGL = 37443;
  this.BROWSER_DEFAULT_WEBGL = 37444;
  var commandBuffer = [];
  var nextId = 1;
  var bindings = {
   texture2D: null,
   arrayBuffer: null,
   elementArrayBuffer: null,
   program: null,
   framebuffer: null,
   activeTexture: this.TEXTURE0,
   generateMipmapHint: this.DONT_CARE,
   blendSrcRGB: this.ONE,
   blendSrcAlpha: this.ONE,
   blendDstRGB: this.ZERO,
   blendDstAlpha: this.ZERO,
   blendEquationRGB: this.FUNC_ADD,
   blendEquationAlpha: this.FUNC_ADD,
   enabledState: {}
  };
  var stateDisabledByDefault = [ this.BLEND, this.CULL_FACE, this.DEPTH_TEST, this.DITHER, this.POLYGON_OFFSET_FILL, this.SAMPLE_ALPHA_TO_COVERAGE, this.SAMPLE_COVERAGE, this.SCISSOR_TEST, this.STENCIL_TEST ];
  for (var i in stateDisabledByDefault) {
   bindings.enabledState[stateDisabledByDefault[i]] = false;
  }
  var that = this;
  this.onmessage = function(msg) {
   switch (msg.op) {
   case "setPrefetched":
    {
     WebGLWorker.prototype.prefetchedParameters = msg.parameters;
     WebGLWorker.prototype.prefetchedExtensions = msg.extensions;
     WebGLWorker.prototype.prefetchedPrecisions = msg.precisions;
     removeRunDependency("gl-prefetch");
     break;
    }

   default:
    throw "weird gl onmessage " + JSON.stringify(msg);
   }
  };
  function revname(name) {
   for (var x in that) if (that[x] === name) return x;
   return null;
  }
  this.getParameter = function(name) {
   assert(name);
   if (name in this.prefetchedParameters) return this.prefetchedParameters[name];
   switch (name) {
   case this.TEXTURE_BINDING_2D:
    {
     return bindings.texture2D;
    }

   case this.ARRAY_BUFFER_BINDING:
    {
     return bindings.arrayBuffer;
    }

   case this.ELEMENT_ARRAY_BUFFER_BINDING:
    {
     return bindings.elementArrayBuffer;
    }

   case this.CURRENT_PROGRAM:
    {
     return bindings.program;
    }

   case this.FRAMEBUFFER_BINDING:
    {
     return bindings.framebuffer;
    }

   case this.ACTIVE_TEXTURE:
    {
     return bindings.activeTexture;
    }

   case this.GENERATE_MIPMAP_HINT:
    {
     return bindings.generateMipmapHint;
    }

   case this.BLEND_SRC_RGB:
    {
     return bindings.blendSrcRGB;
    }

   case this.BLEND_SRC_ALPHA:
    {
     return bindings.blendSrcAlpha;
    }

   case this.BLEND_DST_RGB:
    {
     return bindings.blendDstRGB;
    }

   case this.BLEND_DST_ALPHA:
    {
     return bindings.blendDstAlpha;
    }

   case this.BLEND_EQUATION_RGB:
    {
     return bindings.blendEquationRGB;
    }

   case this.BLEND_EQUATION_ALPHA:
    {
     return bindings.blendEquationAlpha;
    }

   default:
    {
     if (bindings.enabledState[name] !== undefined) return bindings.enabledState[name];
     throw "TODO: get parameter " + name + " : " + revname(name);
    }
   }
  };
  this.getExtension = function(name) {
   var i = this.prefetchedExtensions.indexOf(name);
   if (i < 0) return null;
   commandBuffer.push(1, name);
   switch (name) {
   case "EXT_texture_filter_anisotropic":
    {
     return {
      TEXTURE_MAX_ANISOTROPY_EXT: 34046,
      MAX_TEXTURE_MAX_ANISOTROPY_EXT: 34047
     };
    }

   case "WEBGL_draw_buffers":
    {
     return {
      COLOR_ATTACHMENT0_WEBGL: 36064,
      COLOR_ATTACHMENT1_WEBGL: 36065,
      COLOR_ATTACHMENT2_WEBGL: 36066,
      COLOR_ATTACHMENT3_WEBGL: 36067,
      COLOR_ATTACHMENT4_WEBGL: 36068,
      COLOR_ATTACHMENT5_WEBGL: 36069,
      COLOR_ATTACHMENT6_WEBGL: 36070,
      COLOR_ATTACHMENT7_WEBGL: 36071,
      COLOR_ATTACHMENT8_WEBGL: 36072,
      COLOR_ATTACHMENT9_WEBGL: 36073,
      COLOR_ATTACHMENT10_WEBGL: 36074,
      COLOR_ATTACHMENT11_WEBGL: 36075,
      COLOR_ATTACHMENT12_WEBGL: 36076,
      COLOR_ATTACHMENT13_WEBGL: 36077,
      COLOR_ATTACHMENT14_WEBGL: 36078,
      COLOR_ATTACHMENT15_WEBGL: 36079,
      DRAW_BUFFER0_WEBGL: 34853,
      DRAW_BUFFER1_WEBGL: 34854,
      DRAW_BUFFER2_WEBGL: 34855,
      DRAW_BUFFER3_WEBGL: 34856,
      DRAW_BUFFER4_WEBGL: 34857,
      DRAW_BUFFER5_WEBGL: 34858,
      DRAW_BUFFER6_WEBGL: 34859,
      DRAW_BUFFER7_WEBGL: 34860,
      DRAW_BUFFER8_WEBGL: 34861,
      DRAW_BUFFER9_WEBGL: 34862,
      DRAW_BUFFER10_WEBGL: 34863,
      DRAW_BUFFER11_WEBGL: 34864,
      DRAW_BUFFER12_WEBGL: 34865,
      DRAW_BUFFER13_WEBGL: 34866,
      DRAW_BUFFER14_WEBGL: 34867,
      DRAW_BUFFER15_WEBGL: 34868,
      MAX_COLOR_ATTACHMENTS_WEBGL: 36063,
      MAX_DRAW_BUFFERS_WEBGL: 34852,
      drawBuffersWEBGL: function(buffers) {
       that.drawBuffersWEBGL(buffers);
      }
     };
    }

   case "OES_standard_derivatives":
    {
     return {
      FRAGMENT_SHADER_DERIVATIVE_HINT_OES: 35723
     };
    }
   }
   return true;
  };
  this.getSupportedExtensions = function() {
   return this.prefetchedExtensions;
  };
  this.getShaderPrecisionFormat = function(shaderType, precisionType) {
   return this.prefetchedPrecisions[shaderType][precisionType];
  };
  this.enable = function(cap) {
   commandBuffer.push(2, cap);
   bindings.enabledState[cap] = true;
  };
  this.isEnabled = function(cap) {
   return bindings.enabledState[cap];
  };
  this.disable = function(cap) {
   commandBuffer.push(3, cap);
   bindings.enabledState[cap] = false;
  };
  this.clear = function(mask) {
   commandBuffer.push(4, mask);
  };
  this.clearColor = function(r, g, b, a) {
   commandBuffer.push(5, r, g, b, a);
  };
  this.createShader = function(type) {
   var id = nextId++;
   commandBuffer.push(6, type, id);
   return {
    id: id,
    what: "shader",
    type: type
   };
  };
  this.deleteShader = function(shader) {
   if (!shader) return;
   commandBuffer.push(7, shader.id);
  };
  this.shaderSource = function(shader, source) {
   shader.source = source;
   commandBuffer.push(8, shader.id, source);
  };
  this.compileShader = function(shader) {
   commandBuffer.push(9, shader.id);
  };
  this.getShaderInfoLog = function(shader) {
   return "";
  };
  this.createProgram = function() {
   var id = nextId++;
   commandBuffer.push(10, id);
   return new WebGLProgram(id);
  };
  this.deleteProgram = function(program) {
   if (!program) return;
   commandBuffer.push(11, program.id);
  };
  this.attachShader = function(program, shader) {
   program.shaders.push(shader);
   commandBuffer.push(12, program.id, shader.id);
  };
  this.bindAttribLocation = function(program, index, name) {
   program.nextAttributes[name] = {
    what: "attribute",
    name: name,
    size: -1,
    location: index,
    type: "?"
   };
   program.nextAttributeVec[index] = name;
   commandBuffer.push(13, program.id, index, name);
  };
  this.getAttribLocation = function(program, name) {
   if (name in program.attributes) return program.attributes[name].location;
   return -1;
  };
  this.linkProgram = function(program) {
   function getTypeId(text) {
    switch (text) {
    case "bool":
     return that.BOOL;

    case "int":
     return that.INT;

    case "uint":
     return that.UNSIGNED_INT;

    case "float":
     return that.FLOAT;

    case "vec2":
     return that.FLOAT_VEC2;

    case "vec3":
     return that.FLOAT_VEC3;

    case "vec4":
     return that.FLOAT_VEC4;

    case "ivec2":
     return that.INT_VEC2;

    case "ivec3":
     return that.INT_VEC3;

    case "ivec4":
     return that.INT_VEC4;

    case "bvec2":
     return that.BOOL_VEC2;

    case "bvec3":
     return that.BOOL_VEC3;

    case "bvec4":
     return that.BOOL_VEC4;

    case "mat2":
     return that.FLOAT_MAT2;

    case "mat3":
     return that.FLOAT_MAT3;

    case "mat4":
     return that.FLOAT_MAT4;

    case "sampler2D":
     return that.SAMPLER_2D;

    case "sampler3D":
     return that.SAMPLER_3D;

    case "samplerCube":
     return that.SAMPLER_CUBE;

    default:
     throw "not yet recognized type text: " + text;
    }
   }
   function parseElementType(shader, type, obj, vec) {
    var source = shader.source;
    source = source.replace(/\n/g, "|\n");
    var newItems = source.match(new RegExp(type + "\\s+\\w+\\s+[\\w,\\s[\\]]+;", "g"));
    if (!newItems) return;
    newItems.forEach(function(item) {
     var m = new RegExp(type + "\\s+(\\w+)\\s+([\\w,\\s[\\]]+);").exec(item);
     assert(m);
     m[2].split(",").map(function(name) {
      name = name.trim();
      return name.search(/\s/) >= 0 ? "" : name;
     }).filter(function(name) {
      return !!name;
     }).forEach(function(name) {
      var size = 1;
      var open = name.indexOf("[");
      var fullname = name;
      if (open >= 0) {
       var close = name.indexOf("]");
       size = parseInt(name.substring(open + 1, close));
       name = name.substr(0, open);
       fullname = name + "[0]";
      }
      if (!obj[name]) {
       obj[name] = {
        what: type,
        name: fullname,
        size: size,
        location: -1,
        type: getTypeId(m[1])
       };
       if (vec) vec.push(name);
      }
     });
    });
   }
   program.uniforms = {};
   program.uniformVec = [];
   program.attributes = program.nextAttributes;
   program.attributeVec = program.nextAttributeVec;
   program.nextAttributes = {};
   program.nextAttributeVec = [];
   var existingAttributes = {};
   program.shaders.forEach(function(shader) {
    parseElementType(shader, "uniform", program.uniforms, program.uniformVec);
    parseElementType(shader, "attribute", existingAttributes, null);
   });
   for (var attr in existingAttributes) {
    if (!(attr in program.attributes)) {
     var index = program.attributeVec.length;
     program.attributes[attr] = {
      what: "attribute",
      name: attr,
      size: -1,
      location: index,
      type: "?"
     };
     program.attributeVec[index] = attr;
     commandBuffer.push(13, program.id, index, attr);
    }
    program.attributes[attr].size = existingAttributes[attr].size;
    program.attributes[attr].type = existingAttributes[attr].type;
   }
   commandBuffer.push(14, program.id);
  };
  this.getProgramParameter = function(program, name) {
   switch (name) {
   case this.ACTIVE_UNIFORMS:
    return program.uniformVec.length;

   case this.ACTIVE_ATTRIBUTES:
    return program.attributeVec.length;

   case this.LINK_STATUS:
    {
     commandBuffer.push(15, program.id, name);
     return true;
    }

   default:
    throw "bad getProgramParameter " + revname(name);
   }
  };
  this.getActiveAttrib = function(program, index) {
   var name = program.attributeVec[index];
   if (!name) return null;
   return program.attributes[name];
  };
  this.getActiveUniform = function(program, index) {
   var name = program.uniformVec[index];
   if (!name) return null;
   return program.uniforms[name];
  };
  this.getUniformLocation = function(program, name) {
   var fullname = name;
   var index = -1;
   var open = name.indexOf("[");
   if (open >= 0) {
    var close = name.indexOf("]");
    index = parseInt(name.substring(open + 1, close));
    name = name.substr(0, open);
   }
   if (!(name in program.uniforms)) return null;
   var id = nextId++;
   commandBuffer.push(16, program.id, fullname, id);
   return {
    what: "location",
    uniform: program.uniforms[name],
    id: id,
    index: index
   };
  };
  this.getProgramInfoLog = function(shader) {
   return "";
  };
  this.useProgram = function(program) {
   commandBuffer.push(17, program ? program.id : 0);
   bindings.program = program;
  };
  this.uniform1i = function(location, data) {
   if (!location) return;
   commandBuffer.push(18, location.id, data);
  };
  this.uniform1f = function(location, data) {
   if (!location) return;
   commandBuffer.push(19, location.id, data);
  };
  this.uniform3fv = function(location, data) {
   if (!location) return;
   commandBuffer.push(20, location.id, new Float32Array(data));
  };
  this.uniform4f = function(location, x, y, z, w) {
   if (!location) return;
   commandBuffer.push(21, location.id, new Float32Array([ x, y, z, w ]));
  };
  this.uniform4fv = function(location, data) {
   if (!location) return;
   commandBuffer.push(21, location.id, new Float32Array(data));
  };
  this.uniformMatrix4fv = function(location, transpose, data) {
   if (!location) return;
   commandBuffer.push(22, location.id, transpose, new Float32Array(data));
  };
  this.vertexAttrib4fv = function(index, values) {
   commandBuffer.push(23, index, new Float32Array(values));
  };
  this.createBuffer = function() {
   var id = nextId++;
   commandBuffer.push(24, id);
   return new WebGLBuffer(id);
  };
  this.deleteBuffer = function(buffer) {
   if (!buffer) return;
   commandBuffer.push(25, buffer.id);
  };
  this.bindBuffer = function(target, buffer) {
   commandBuffer.push(26, target, buffer ? buffer.id : 0);
   switch (target) {
   case this.ARRAY_BUFFER_BINDING:
    {
     bindings.arrayBuffer = buffer;
     break;
    }

   case this.ELEMENT_ARRAY_BUFFER_BINDING:
    {
     bindings.elementArrayBuffer = buffer;
     break;
    }
   }
  };
  function duplicate(something) {
   if (!something || typeof something == "number") return something;
   if (something.slice) return something.slice(0);
   return new something.constructor(something);
  }
  this.bufferData = function(target, something, usage) {
   commandBuffer.push(27, target, duplicate(something), usage);
  };
  this.bufferSubData = function(target, offset, something) {
   commandBuffer.push(28, target, offset, duplicate(something));
  };
  this.viewport = function(x, y, w, h) {
   commandBuffer.push(29, x, y, w, h);
  };
  this.vertexAttribPointer = function(index, size, type, normalized, stride, offset) {
   commandBuffer.push(30, index, size, type, normalized, stride, offset);
  };
  this.enableVertexAttribArray = function(index) {
   commandBuffer.push(31, index);
  };
  this.disableVertexAttribArray = function(index) {
   commandBuffer.push(32, index);
  };
  this.drawArrays = function(mode, first, count) {
   commandBuffer.push(33, mode, first, count);
  };
  this.drawElements = function(mode, count, type, offset) {
   commandBuffer.push(34, mode, count, type, offset);
  };
  this.getError = function() {
   commandBuffer.push(35);
   return this.NO_ERROR;
  };
  this.createTexture = function() {
   var id = nextId++;
   commandBuffer.push(36, id);
   return new WebGLTexture(id);
  };
  this.deleteTexture = function(texture) {
   if (!texture) return;
   commandBuffer.push(37, texture.id);
   texture.id = 0;
  };
  this.isTexture = function(texture) {
   return texture && texture.what === "texture" && texture.id > 0 && texture.binding;
  };
  this.bindTexture = function(target, texture) {
   switch (target) {
   case that.TEXTURE_2D:
    {
     bindings.texture2D = texture;
     break;
    }
   }
   if (texture) texture.binding = target;
   commandBuffer.push(38, target, texture ? texture.id : 0);
  };
  this.texParameteri = function(target, pname, param) {
   commandBuffer.push(39, target, pname, param);
  };
  this.texImage2D = function(target, level, internalformat, width, height, border, format, type, pixels) {
   if (pixels === undefined) {
    format = width;
    type = height;
    pixels = border;
    assert(pixels instanceof Image);
    assert(internalformat === format && format === this.RGBA);
    assert(type === this.UNSIGNED_BYTE);
    var data = pixels.data;
    width = data.width;
    height = data.height;
    border = 0;
    pixels = new Uint8Array(data.data);
   }
   commandBuffer.push(40, target, level, internalformat, width, height, border, format, type, duplicate(pixels));
  };
  this.compressedTexImage2D = function(target, level, internalformat, width, height, border, pixels) {
   commandBuffer.push(41, target, level, internalformat, width, height, border, duplicate(pixels));
  };
  this.activeTexture = function(texture) {
   commandBuffer.push(42, texture);
   bindings.activeTexture = texture;
  };
  this.getShaderParameter = function(shader, pname) {
   switch (pname) {
   case this.SHADER_TYPE:
    return shader.type;

   case this.COMPILE_STATUS:
    {
     commandBuffer.push(43, shader.id, pname);
     return true;
    }

   default:
    throw "unsupported getShaderParameter " + pname;
   }
  };
  this.clearDepth = function(depth) {
   commandBuffer.push(44, depth);
  };
  this.depthFunc = function(depth) {
   commandBuffer.push(45, depth);
  };
  this.frontFace = function(depth) {
   commandBuffer.push(46, depth);
  };
  this.cullFace = function(depth) {
   commandBuffer.push(47, depth);
  };
  this.readPixels = function(depth) {
   abort("readPixels is impossible, we are async GL");
  };
  this.pixelStorei = function(pname, param) {
   commandBuffer.push(48, pname, param);
  };
  this.depthMask = function(flag) {
   commandBuffer.push(49, flag);
  };
  this.depthRange = function(near, far) {
   commandBuffer.push(50, near, far);
  };
  this.blendFunc = function(sfactor, dfactor) {
   commandBuffer.push(51, sfactor, dfactor);
   bindings.blendSrcRGB = bindings.blendSrcAlpha = sfactor;
   bindings.blendDstRGB = bindings.blendDstAlpha = dfactor;
  };
  this.scissor = function(x, y, width, height) {
   commandBuffer.push(52, x, y, width, height);
  };
  this.colorMask = function(red, green, blue, alpha) {
   commandBuffer.push(53, red, green, blue, alpha);
  };
  this.lineWidth = function(width) {
   commandBuffer.push(54, width);
  };
  this.createFramebuffer = function() {
   var id = nextId++;
   commandBuffer.push(55, id);
   return new WebGLFramebuffer(id);
  };
  this.deleteFramebuffer = function(framebuffer) {
   if (!framebuffer) return;
   commandBuffer.push(56, framebuffer.id);
  };
  this.bindFramebuffer = function(target, framebuffer) {
   commandBuffer.push(57, target, framebuffer ? framebuffer.id : 0);
   bindings.framebuffer = framebuffer;
  };
  this.framebufferTexture2D = function(target, attachment, textarget, texture, level) {
   commandBuffer.push(58, target, attachment, textarget, texture ? texture.id : 0, level);
  };
  this.checkFramebufferStatus = function(target) {
   return this.FRAMEBUFFER_COMPLETE;
  };
  this.createRenderbuffer = function() {
   var id = nextId++;
   commandBuffer.push(59, id);
   return new WebGLRenderbuffer(id);
  };
  this.deleteRenderbuffer = function(renderbuffer) {
   if (!renderbuffer) return;
   commandBuffer.push(60, renderbuffer.id);
  };
  this.bindRenderbuffer = function(target, renderbuffer) {
   commandBuffer.push(61, target, renderbuffer ? renderbuffer.id : 0);
  };
  this.renderbufferStorage = function(target, internalformat, width, height) {
   commandBuffer.push(62, target, internalformat, width, height);
  };
  this.framebufferRenderbuffer = function(target, attachment, renderbuffertarget, renderbuffer) {
   commandBuffer.push(63, target, attachment, renderbuffertarget, renderbuffer ? renderbuffer.id : 0);
  };
  this.debugPrint = function(text) {
   commandBuffer.push(64, text);
  };
  this.hint = function(target, mode) {
   commandBuffer.push(65, target, mode);
   if (target == this.GENERATE_MIPMAP_HINT) bindings.generateMipmapHint = mode;
  };
  this.blendEquation = function(mode) {
   commandBuffer.push(66, mode);
   bindings.blendEquationRGB = bindings.blendEquationAlpha = mode;
  };
  this.generateMipmap = function(target) {
   commandBuffer.push(67, target);
  };
  this.uniformMatrix3fv = function(location, transpose, data) {
   if (!location) return;
   commandBuffer.push(68, location.id, transpose, new Float32Array(data));
  };
  this.stencilMask = function(mask) {
   commandBuffer.push(69, mask);
  };
  this.clearStencil = function(s) {
   commandBuffer.push(70, s);
  };
  this.texSubImage2D = function(target, level, xoffset, yoffset, width, height, format, type, pixels) {
   if (pixels === undefined) {
    var formatTemp = format;
    format = width;
    type = height;
    pixels = formatTemp;
    assert(pixels instanceof Image);
    assert(format === this.RGBA);
    assert(type === this.UNSIGNED_BYTE);
    var data = pixels.data;
    width = data.width;
    height = data.height;
    pixels = new Uint8Array(data.data);
   }
   commandBuffer.push(71, target, level, xoffset, yoffset, width, height, format, type, duplicate(pixels));
  };
  this.uniform3f = function(location, x, y, z) {
   if (!location) return;
   commandBuffer.push(72, location.id, x, y, z);
  };
  this.blendFuncSeparate = function(srcRGB, dstRGB, srcAlpha, dstAlpha) {
   commandBuffer.push(73, srcRGB, dstRGB, srcAlpha, dstAlpha);
   bindings.blendSrcRGB = srcRGB;
   bindings.blendSrcAlpha = srcAlpha;
   bindings.blendDstRGB = dstRGB;
   bindings.blendDstAlpha = dstAlpha;
  };
  this.uniform2fv = function(location, data) {
   if (!location) return;
   commandBuffer.push(74, location.id, new Float32Array(data));
  };
  this.texParameterf = function(target, pname, param) {
   commandBuffer.push(75, target, pname, param);
  };
  this.isContextLost = function() {
   commandBuffer.push(76);
   return false;
  };
  this.isProgram = function(program) {
   return program && program.what === "program";
  };
  this.blendEquationSeparate = function(rgb, alpha) {
   commandBuffer.push(77, rgb, alpha);
   bindings.blendEquationRGB = rgb;
   bindings.blendEquationAlpha = alpha;
  };
  this.stencilFuncSeparate = function(face, func, ref, mask) {
   commandBuffer.push(78, face, func, ref, mask);
  };
  this.stencilOpSeparate = function(face, fail, zfail, zpass) {
   commandBuffer.push(79, face, fail, zfail, zpass);
  };
  this.drawBuffersWEBGL = function(buffers) {
   commandBuffer.push(80, buffers);
  };
  this.uniform1iv = function(location, data) {
   if (!location) return;
   commandBuffer.push(81, location.id, new Int32Array(data));
  };
  this.uniform1fv = function(location, data) {
   if (!location) return;
   commandBuffer.push(82, location.id, new Float32Array(data));
  };
  var theoreticalTracker = new FPSTracker("server (theoretical)");
  var throttledTracker = new FPSTracker("server (client-throttled)");
  function preRAF() {
   if (Math.abs(frameId - clientFrameId) >= 4) {
    return false;
   }
  }
  var postRAFed = false;
  function postRAF() {
   if (commandBuffer.length > 0) {
    postMessage({
     target: "gl",
     op: "render",
     commandBuffer: commandBuffer
    });
    commandBuffer = [];
   }
   postRAFed = true;
  }
  assert(!Browser.doSwapBuffers);
  Browser.doSwapBuffers = postRAF;
  var trueRAF = window.requestAnimationFrame;
  window.requestAnimationFrame = function(func) {
   trueRAF(function() {
    if (preRAF() === false) {
     window.requestAnimationFrame(func);
     return;
    }
    postRAFed = false;
    func();
    if (!postRAFed) {
     postRAF();
    }
   });
  };
 }
 WebGLWorker.prototype.prefetchedParameters = {};
 WebGLWorker.prototype.prefetchedExtensions = {};
 WebGLWorker.prototype.prefetchedPrecisions = {};
 if (typeof console == "undefined") {
  var console = {
   log: function(x) {
    if (typeof dump == "function") dump("log: " + x + "\n");
   },
   debug: function(x) {
    if (typeof dump == "function") dump("debug: " + x + "\n");
   },
   info: function(x) {
    if (typeof dump == "function") dump("info: " + x + "\n");
   },
   warn: function(x) {
    if (typeof dump == "function") dump("warn: " + x + "\n");
   },
   error: function(x) {
    if (typeof dump == "function") dump("error: " + x + "\n");
   }
  };
 }
 function FPSTracker(text) {
  var last = 0;
  var mean = 0;
  var counter = 0;
  this.tick = function() {
   var now = Date.now();
   if (last > 0) {
    var diff = now - last;
    mean = .99 * mean + .01 * diff;
    if (counter++ === 60) {
     counter = 0;
     dump(text + " fps: " + (1e3 / mean).toFixed(2) + "\n");
    }
   }
   last = now;
  };
 }
 function Element() {
  throw "TODO: Element";
 }
 function HTMLCanvasElement() {
  throw "TODO: HTMLCanvasElement";
 }
 function HTMLVideoElement() {
  throw "TODO: HTMLVideoElement";
 }
 var KeyboardEvent = {
  "DOM_KEY_LOCATION_RIGHT": 2
 };
 function PropertyBag() {
  this.addProperty = function() {};
  this.removeProperty = function() {};
  this.setProperty = function() {};
 }
 var IndexedObjects = {
  nextId: 1,
  cache: {},
  add: function(object) {
   object.id = this.nextId++;
   this.cache[object.id] = object;
  }
 };
 function EventListener() {
  this.listeners = {};
  this.addEventListener = function addEventListener(event, func) {
   if (!this.listeners[event]) this.listeners[event] = [];
   this.listeners[event].push(func);
  };
  this.removeEventListener = function(event, func) {
   var list = this.listeners[event];
   if (!list) return;
   var me = list.indexOf(func);
   if (me < 0) return;
   list.splice(me, 1);
  };
  this.fireEvent = function fireEvent(event) {
   event.preventDefault = function() {};
   if (event.type in this.listeners) {
    this.listeners[event.type].forEach(function(listener) {
     listener(event);
    });
   }
  };
 }
 function Image() {
  IndexedObjects.add(this);
  EventListener.call(this);
  var src = "";
  Object.defineProperty(this, "src", {
   set: function(value) {
    src = value;
    assert(this.id);
    postMessage({
     target: "Image",
     method: "src",
     src: src,
     id: this.id
    });
   },
   get: function() {
    return src;
   }
  });
 }
 Image.prototype.onload = function() {};
 Image.prototype.onerror = function() {};
 var HTMLImageElement = Image;
 var window = this;
 var windowExtra = new EventListener();
 for (var x in windowExtra) window[x] = windowExtra[x];
 window.close = function window_close() {
  postMessage({
   target: "window",
   method: "close"
  });
 };
 window.alert = function(text) {
  err("alert forever: " + text);
  while (1) {}
 };
 window.scrollX = window.scrollY = 0;
 window.WebGLRenderingContext = WebGLWorker;
 window.requestAnimationFrame = function() {
  var nextRAF = 0;
  return function(func) {
   var now = Date.now();
   if (nextRAF === 0) {
    nextRAF = now + 1e3 / 60;
   } else {
    while (now + 2 >= nextRAF) {
     nextRAF += 1e3 / 60;
    }
   }
   var delay = Math.max(nextRAF - now, 0);
   setTimeout(func, delay);
  };
 }();
 var webGLWorker = new WebGLWorker();
 var document = new EventListener();
 document.createElement = function document_createElement(what) {
  switch (what) {
  case "canvas":
   {
    var canvas = new EventListener();
    canvas.ensureData = function canvas_ensureData() {
     if (!canvas.data || canvas.data.width !== canvas.width || canvas.data.height !== canvas.height) {
      canvas.data = {
       width: canvas.width,
       height: canvas.height,
       data: new Uint8Array(canvas.width * canvas.height * 4)
      };
      if (canvas === Module["canvas"]) {
       postMessage({
        target: "canvas",
        op: "resize",
        width: canvas.width,
        height: canvas.height
       });
      }
     }
    };
    canvas.getContext = function canvas_getContext(type, attributes) {
     if (canvas === Module["canvas"]) {
      postMessage({
       target: "canvas",
       op: "getContext",
       type: type,
       attributes: attributes
      });
     }
     if (type === "2d") {
      return {
       getImageData: function(x, y, w, h) {
        assert(x == 0 && y == 0 && w == canvas.width && h == canvas.height);
        canvas.ensureData();
        return {
         width: canvas.data.width,
         height: canvas.data.height,
         data: new Uint8Array(canvas.data.data)
        };
       },
       putImageData: function(image, x, y) {
        canvas.ensureData();
        assert(x == 0 && y == 0 && image.width == canvas.width && image.height == canvas.height);
        canvas.data.data.set(image.data);
        if (canvas === Module["canvas"]) {
         postMessage({
          target: "canvas",
          op: "render",
          image: canvas.data
         });
        }
       },
       drawImage: function(image, x, y, w, h, ox, oy, ow, oh) {
        assert(!x && !y && !ox && !oy);
        assert(w === ow && h === oh);
        assert(canvas.width === w || w === undefined);
        assert(canvas.height === h || h === undefined);
        assert(image.width === canvas.width && image.height === canvas.height);
        canvas.ensureData();
        canvas.data.data.set(image.data.data);
        if (canvas === Module["canvas"]) {
         postMessage({
          target: "canvas",
          op: "render",
          image: canvas.data
         });
        }
       }
      };
     } else {
      return webGLWorker;
     }
    };
    canvas.boundingClientRect = {};
    canvas.getBoundingClientRect = function canvas_getBoundingClientRect() {
     return {
      width: canvas.boundingClientRect.width,
      height: canvas.boundingClientRect.height,
      top: canvas.boundingClientRect.top,
      left: canvas.boundingClientRect.left,
      bottom: canvas.boundingClientRect.bottom,
      right: canvas.boundingClientRect.right
     };
    };
    canvas.style = new PropertyBag();
    canvas.exitPointerLock = function() {};
    canvas.width_ = canvas.width_ || 0;
    canvas.height_ = canvas.height_ || 0;
    Object.defineProperty(canvas, "width", {
     set: function(value) {
      canvas.width_ = value;
      if (canvas === Module["canvas"]) {
       postMessage({
        target: "canvas",
        op: "resize",
        width: canvas.width_,
        height: canvas.height_
       });
      }
     },
     get: function() {
      return canvas.width_;
     }
    });
    Object.defineProperty(canvas, "height", {
     set: function(value) {
      canvas.height_ = value;
      if (canvas === Module["canvas"]) {
       postMessage({
        target: "canvas",
        op: "resize",
        width: canvas.width_,
        height: canvas.height_
       });
      }
     },
     get: function() {
      return canvas.height_;
     }
    });
    var style = {
     parentCanvas: canvas,
     removeProperty: function() {},
     setProperty: function() {}
    };
    Object.defineProperty(style, "cursor", {
     set: function(value) {
      if (!style.cursor_ || style.cursor_ !== value) {
       style.cursor_ = value;
       if (style.parentCanvas === Module["canvas"]) {
        postMessage({
         target: "canvas",
         op: "setObjectProperty",
         object: "style",
         property: "cursor",
         value: style.cursor_
        });
       }
      }
     },
     get: function() {
      return style.cursor_;
     }
    });
    canvas.style = style;
    return canvas;
   }

  default:
   throw "document.createElement " + what;
  }
 };
 document.getElementById = function(id) {
  if (id === "canvas" || id === "application-canvas") {
   return Module.canvas;
  }
  throw "document.getElementById failed on " + id;
 };
 document.querySelector = function(id) {
  if (id === "#canvas" || id === "#application-canvas" || id === "canvas" || id === "application-canvas") {
   return Module.canvas;
  }
  throw "document.querySelector failed on " + id;
 };
 document.documentElement = {};
 document.styleSheets = [ {
  cssRules: [],
  insertRule: function(rule, i) {
   this.cssRules.splice(i, 0, rule);
  }
 } ];
 document.URL = "http://worker.not.yet.ready.wait.for.window.onload?fake";
 function Audio() {
  warnOnce("faking Audio elements, no actual sound will play");
 }
 Audio.prototype = new EventListener();
 Object.defineProperty(Audio.prototype, "src", {
  set: function(value) {
   if (value[0] === "d") return;
   this.onerror();
  }
 });
 Audio.prototype.play = function() {};
 Audio.prototype.pause = function() {};
 Audio.prototype.cloneNode = function() {
  return new Audio();
 };
 function AudioContext() {
  warnOnce("faking WebAudio elements, no actual sound will play");
  function makeNode() {
   return {
    connect: function() {},
    disconnect: function() {}
   };
  }
  this.listener = {
   setPosition: function() {},
   setOrientation: function() {}
  };
  this.decodeAudioData = function() {};
  this.createBuffer = makeNode;
  this.createBufferSource = makeNode;
  this.createGain = makeNode;
  this.createPanner = makeNode;
 }
 var screen = {
  width: 0,
  height: 0
 };
 Module.canvas = document.createElement("canvas");
 Module.setStatus = function() {};
 out = function Module_print(x) {
  postMessage({
   target: "stdout",
   content: x
  });
 };
 err = function Module_printErr(x) {
  postMessage({
   target: "stderr",
   content: x
  });
 };
 var frameId = 0;
 var clientFrameId = 0;
 var postMainLoop = Module["postMainLoop"];
 Module["postMainLoop"] = function() {
  if (postMainLoop) postMainLoop();
  postMessage({
   target: "tick",
   id: frameId++
  });
  commandBuffer = [];
 };
 addRunDependency("gl-prefetch");
 addRunDependency("worker-init");
 var messageBuffer = null;
 var messageResenderTimeout = null;
 var calledMain = false;
 if (!Module["postRun"]) Module["postRun"] = [];
 if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
 Module["postRun"].push(() => {
  calledMain = true;
 });
 function messageResender() {
  if (calledMain) {
   assert(messageBuffer && messageBuffer.length > 0);
   messageResenderTimeout = null;
   messageBuffer.forEach(function(message) {
    onmessage(message);
   });
   messageBuffer = null;
  } else {
   messageResenderTimeout = setTimeout(messageResender, 100);
  }
 }
 function onMessageFromMainEmscriptenThread(message) {
  if (!calledMain && !message.data.preMain) {
   if (!messageBuffer) {
    messageBuffer = [];
    messageResenderTimeout = setTimeout(messageResender, 100);
   }
   messageBuffer.push(message);
   return;
  }
  if (calledMain && messageResenderTimeout) {
   clearTimeout(messageResenderTimeout);
   messageResender();
  }
  switch (message.data.target) {
  case "document":
   {
    document.fireEvent(message.data.event);
    break;
   }

  case "window":
   {
    window.fireEvent(message.data.event);
    break;
   }

  case "canvas":
   {
    if (message.data.event) {
     Module.canvas.fireEvent(message.data.event);
    } else if (message.data.boundingClientRect) {
     Module.canvas.boundingClientRect = message.data.boundingClientRect;
    } else throw "ey?";
    break;
   }

  case "gl":
   {
    webGLWorker.onmessage(message.data);
    break;
   }

  case "tock":
   {
    clientFrameId = message.data.id;
    break;
   }

  case "Image":
   {
    var img = IndexedObjects.cache[message.data.id];
    switch (message.data.method) {
    case "onload":
     {
      img.width = message.data.width;
      img.height = message.data.height;
      img.data = {
       width: img.width,
       height: img.height,
       data: message.data.data
      };
      img.complete = true;
      img.onload();
      break;
     }

    case "onerror":
     {
      img.onerror({
       srcElement: img
      });
      break;
     }
    }
    break;
   }

  case "IDBStore":
   {
    assert(message.data.method === "response");
    assert(IDBStore.pending);
    IDBStore.pending(message.data);
    break;
   }

  case "worker-init":
   {
    Module.canvas = document.createElement("canvas");
    screen.width = Module.canvas.width_ = message.data.width;
    screen.height = Module.canvas.height_ = message.data.height;
    Module.canvas.boundingClientRect = message.data.boundingClientRect;
    document.URL = message.data.URL;
    window.fireEvent({
     type: "load"
    });
    removeRunDependency("worker-init");
    break;
   }

  case "custom":
   {
    if (Module["onCustomMessage"]) {
     Module["onCustomMessage"](message);
    } else {
     throw "Custom message received but worker Module.onCustomMessage not implemented.";
    }
    break;
   }

  case "setimmediate":
   {
    if (Module["setImmediates"]) Module["setImmediates"].shift()();
    break;
   }

  default:
   throw "wha? " + message.data.target;
  }
 }
 onmessage = onMessageFromMainEmscriptenThread;
 if (typeof specialHTMLTargets != "undefined") {
  specialHTMLTargets = [ 0, document, window ];
 }
 function postCustomMessage(data) {
  postMessage({
   target: "custom",
   userData: data
  });
 }
}

Module["UTF8ArrayToString"] = UTF8ArrayToString;

Module["ccall"] = ccall;

Module["cwrap"] = cwrap;

Module["AsciiToString"] = AsciiToString;

var missingLibrarySymbols = [ "zeroMemory", "stringToNewUTF8", "emscripten_realloc_buffer", "setErrNo", "inetPton4", "inetNtop4", "inetPton6", "inetNtop6", "readSockaddr", "writeSockaddr", "getHostByName", "getRandomDevice", "traverseStack", "convertPCtoSourceLocation", "readEmAsmArgs", "jstoi_q", "jstoi_s", "getExecutableName", "listenOnce", "autoResumeAudioContext", "dynCallLegacy", "getDynCaller", "dynCall", "runtimeKeepalivePush", "runtimeKeepalivePop", "maybeExit", "asmjsMangle", "asyncLoad", "alignMemory", "mmapAlloc", "HandleAllocator", "getNativeTypeSize", "STACK_SIZE", "STACK_ALIGN", "POINTER_SIZE", "ASSERTIONS", "writeI53ToI64", "writeI53ToI64Clamped", "writeI53ToI64Signaling", "writeI53ToU64Clamped", "writeI53ToU64Signaling", "readI53FromI64", "readI53FromU64", "convertI32PairToI53", "convertU32PairToI53", "uleb128Encode", "sigToWasmTypes", "generateFuncType", "convertJsFunctionToWasm", "getEmptyTableSlot", "updateTableMap", "getFunctionAddress", "addFunction", "removeFunction", "reallyNegative", "strLen", "reSign", "formatString", "intArrayFromString", "intArrayToString", "stringToAscii", "allocateUTF8", "allocateUTF8OnStack", "writeStringToMemory", "writeAsciiToMemory", "getSocketFromFD", "getSocketAddress", "registerKeyEventCallback", "maybeCStringToJsString", "findEventTarget", "findCanvasEventTarget", "getBoundingClientRect", "fillMouseEventData", "registerMouseEventCallback", "registerWheelEventCallback", "registerUiEventCallback", "registerFocusEventCallback", "fillDeviceOrientationEventData", "registerDeviceOrientationEventCallback", "fillDeviceMotionEventData", "registerDeviceMotionEventCallback", "screenOrientation", "fillOrientationChangeEventData", "registerOrientationChangeEventCallback", "fillFullscreenChangeEventData", "registerFullscreenChangeEventCallback", "JSEvents_requestFullscreen", "JSEvents_resizeCanvasForFullscreen", "registerRestoreOldStyle", "hideEverythingExceptGivenElement", "restoreHiddenElements", "setLetterbox", "softFullscreenResizeWebGLRenderTarget", "doRequestFullscreen", "fillPointerlockChangeEventData", "registerPointerlockChangeEventCallback", "registerPointerlockErrorEventCallback", "requestPointerLock", "fillVisibilityChangeEventData", "registerVisibilityChangeEventCallback", "registerTouchEventCallback", "fillGamepadEventData", "registerGamepadEventCallback", "registerBeforeUnloadEventCallback", "fillBatteryEventData", "battery", "registerBatteryEventCallback", "setCanvasElementSize", "getCanvasElementSize", "getEnvStrings", "checkWasiClock", "createDyncallWrapper", "setImmediateWrapped", "clearImmediateWrapped", "polyfillSetImmediate", "getPromise", "makePromise", "makePromiseCallback", "heapObjectForWebGLType", "heapAccessShiftForWebGLHeap", "emscriptenWebGLGet", "computeUnpackAlignedImageSize", "emscriptenWebGLGetTexPixelData", "emscriptenWebGLGetUniform", "webglGetUniformLocation", "webglPrepareUniformLocationsBeforeFirstUse", "webglGetLeftBracePos", "emscriptenWebGLGetVertexAttrib", "writeGLArray", "SDL_unicode", "SDL_ttfContext", "SDL_audio", "GLFW_Window", "runAndAbortIfError", "ALLOC_NORMAL", "ALLOC_STACK", "allocate", "init_embind", "throwUnboundTypeError", "ensureOverloadTable", "exposePublicSymbol", "replacePublicSymbol", "getBasestPointer", "registerInheritedInstance", "unregisterInheritedInstance", "getInheritedInstance", "getInheritedInstanceCount", "getLiveInheritedInstances", "getTypeName", "heap32VectorToArray", "requireRegisteredType", "enumReadValueFromPointer", "runDestructors", "new_", "craftInvokerFunction", "embind__requireFunction", "genericPointerToWireType", "constNoSmartPtrRawPointerToWireType", "nonConstNoSmartPtrRawPointerToWireType", "init_RegisteredPointer", "RegisteredPointer", "RegisteredPointer_getPointee", "RegisteredPointer_destructor", "RegisteredPointer_deleteObject", "RegisteredPointer_fromWireType", "runDestructor", "releaseClassHandle", "detachFinalizer", "attachFinalizer", "makeClassHandle", "init_ClassHandle", "ClassHandle", "ClassHandle_isAliasOf", "throwInstanceAlreadyDeleted", "ClassHandle_clone", "ClassHandle_delete", "ClassHandle_isDeleted", "ClassHandle_deleteLater", "flushPendingDeletes", "setDelayFunction", "RegisteredClass", "shallowCopyInternalPointer", "downcastPointer", "upcastPointer", "validateThis", "getStringOrSymbol", "craftEmvalAllocator", "emval_get_global", "emval_lookupTypes", "emval_allocateDestructors", "emval_addMethodCaller" ];

missingLibrarySymbols.forEach(missingLibrarySymbol);

var unexportedSymbols = [ "run", "UTF8ToString", "stringToUTF8Array", "stringToUTF8", "lengthBytesUTF8", "addOnPreRun", "addOnInit", "addOnPreMain", "addOnExit", "addOnPostRun", "addRunDependency", "removeRunDependency", "FS_createFolder", "FS_createPath", "FS_createDataFile", "FS_createPreloadedFile", "FS_createLazyFile", "FS_createLink", "FS_createDevice", "FS_unlink", "out", "err", "callMain", "abort", "keepRuntimeAlive", "wasmMemory", "stackAlloc", "stackSave", "stackRestore", "getTempRet0", "setTempRet0", "writeStackCookie", "checkStackCookie", "ptrToString", "exitJS", "getHeapMax", "abortOnCannotGrowMemory", "ENV", "ERRNO_CODES", "ERRNO_MESSAGES", "DNS", "Protocols", "Sockets", "timers", "warnOnce", "UNWIND_CACHE", "readEmAsmArgsArray", "handleException", "callUserCallback", "safeSetTimeout", "convertI32PairToI53Checked", "getCFunc", "freeTableIndexes", "functionsInTableMap", "unSign", "setValue", "getValue", "PATH", "PATH_FS", "UTF16Decoder", "UTF16ToString", "stringToUTF16", "lengthBytesUTF16", "UTF32ToString", "stringToUTF32", "lengthBytesUTF32", "writeArrayToMemory", "SYSCALLS", "JSEvents", "specialHTMLTargets", "currentFullscreenStrategy", "restoreOldWindowedStyle", "demangle", "demangleAll", "jsStackTrace", "stackTrace", "ExitStatus", "flush_NO_FILESYSTEM", "dlopenMissingError", "promiseMap", "uncaughtExceptionCount", "exceptionLast", "exceptionCaught", "ExceptionInfo", "exception_addRef", "exception_decRef", "getExceptionMessageCommon", "incrementExceptionRefcount", "decrementExceptionRefcount", "getExceptionMessage", "Browser", "setMainLoop", "wget", "tempFixedLengthArray", "miniTempWebGLFloatBuffers", "GL", "AL", "SDL", "SDL_gfx", "GLUT", "EGL", "GLFW", "GLEW", "IDBStore", "InternalError", "BindingError", "UnboundTypeError", "PureVirtualError", "throwInternalError", "throwBindingError", "extendError", "createNamedFunction", "embindRepr", "registeredInstances", "registeredTypes", "awaitingDependencies", "typeDependencies", "registeredPointers", "registerType", "whenDependentTypesAreResolved", "embind_charCodes", "embind_init_charCodes", "readLatin1String", "getShiftFromSize", "integerReadValueFromPointer", "floatReadValueFromPointer", "simpleReadValueFromPointer", "tupleRegistrations", "structRegistrations", "finalizationRegistry", "detachFinalizer_deps", "deletionQueue", "delayFunction", "char_0", "char_9", "makeLegalFunctionName", "emval_handle_array", "emval_free_list", "emval_symbols", "init_emval", "count_emval_handles", "get_first_emval", "Emval", "emval_newers", "emval_methodCallers", "emval_registeredMethods" ];

unexportedSymbols.forEach(unexportedRuntimeSymbol);

var calledRun;

dependenciesFulfilled = function runCaller() {
 if (!calledRun) run();
 if (!calledRun) dependenciesFulfilled = runCaller;
};

function callMain() {
 assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
 assert(__ATPRERUN__.length == 0, "cannot call main when preRun functions remain to be called");
 var entryFunction = _main;
 var argc = 0;
 var argv = 0;
 try {
  var ret = entryFunction(argc, argv);
  exitJS(ret, true);
  return ret;
 } catch (e) {
  return handleException(e);
 }
}

function stackCheckInit() {
 _emscripten_stack_init();
 writeStackCookie();
}

function run() {
 if (runDependencies > 0) {
  return;
 }
 stackCheckInit();
 preRun();
 if (runDependencies > 0) {
  return;
 }
 function doRun() {
  if (calledRun) return;
  calledRun = true;
  Module["calledRun"] = true;
  if (ABORT) return;
  initRuntime();
  preMain();
  if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
  if (shouldRunNow) callMain();
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout(function() {
   setTimeout(function() {
    Module["setStatus"]("");
   }, 1);
   doRun();
  }, 1);
 } else {
  doRun();
 }
 checkStackCookie();
}

function checkUnflushedContent() {
 var oldOut = out;
 var oldErr = err;
 var has = false;
 out = err = x => {
  has = true;
 };
 try {
  flush_NO_FILESYSTEM();
 } catch (e) {}
 out = oldOut;
 err = oldErr;
 if (has) {
  warnOnce("stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.");
  warnOnce("(this may also be due to not including full filesystem support - try building with -sFORCE_FILESYSTEM)");
 }
}

if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}

var shouldRunNow = false;

if (Module["noInitialRun"]) shouldRunNow = false;

run();
