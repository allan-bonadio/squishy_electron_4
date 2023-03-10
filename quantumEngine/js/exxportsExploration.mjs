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



macOS error code: -31059



exports
Object { __wasm_call_ctors: 38(), main: 43(), __em_js__qeStarted: WebAssembly.Global, __indirect_function_table: WebAssembly.Table, free: 248(), getTempRet0: 258(), __cxa_free_exception: 1094(), malloc: 247(), avatar_dumpViewBuffer: 108(), avatar_getViewBuffer: 109(), … }
__cxa_can_catch: function 1135()
__cxa_demangle: function 279()
__cxa_free_exception: function 1094()
__cxa_is_pointer_type: function 1136()
__em_js__qeStarted: WebAssembly.Global { value: 96964 }
__errno_location: function 163()
__getTypeName: function 146()
__get_exception_message: function 1090()
__indirect_function_table: WebAssembly.Table { length: 301 }
__set_stack_limits: function 1161()
__start_em_js: WebAssembly.Global { value: 96964 }
__stop_em_js: WebAssembly.Global { value: 97335 }
__wasm_call_ctors: function 38()
_embind_initialize_bindings: function 147()
addSpaceDimension: function 114()
avatar_dumpViewBuffer: function 108()
avatar_getViewBuffer: function 109()
avatar_loadViewBuffer: function 110()
completeNewSpace: function 115()
deleteFullSpace: function 116()
dynCall_jiji: function 1163()
emscripten_get_sbrk_ptr: function 254()
emscripten_stack_get_base: function 1153()
emscripten_stack_get_current: function 1159()
emscripten_stack_get_end: function 1154()
emscripten_stack_get_free: function 1152()
emscripten_stack_init: function 1151()
emscripten_wasm_worker_initialize: function 1155()
fflush: function 1160()
free: function 248()
getCppExceptionMessage: function 124()
getTempRet0: function 258()
grinder_askForFFT: function 138()
grinder_copyFromAvatar: function 140()
grinder_copyToAvatar: function 141()
grinder_initThreadIntegration: function 136()
grinder_oneFrame: function 139()
main: function 43()
malloc: function 247()
qSpace_dumpVoltage: function 111()
sbrk: function 255()
setTempRet0: function 257()
setThrew: function 256()
stackAlloc: function 1158()
stackRestore: function 1157()
stackSave: function 1156()
startNewSpace: function 113()
wave_normalize: function 112()



bubbles: false
cancelBubble: false
cancelable: true
colno: 7
composed: false
currentTarget: Worker
defaultPrevented: false
error: null
eventPhase: 2
explicitOriginalTarget: Worker
filename: "http://localhost:6600/qEng/quantumEngine.thread.js"
isTrusted: true
lineno: 75
message: "ReferenceError: wasm is not defined"
originalTarget: Worker
returnValue: true
srcElement: Worker
target: Worker
timeStamp: 139072
type: "error"
<get isTrusted()>: isTrusted()
<prototype>: ErrorEventPrototype

holy shit, this worked!!  exported function!!
"___set_stack_limits"


give up on these; prob exp funcs
"_assert_fail",
"_handle_stack_overflow",
"_memory",
"_segfault",
"__set_stack_limits",=instance.exports.__indirect_function_table
"emscripten_stack_init",
"__emscripten_stack_get_free",
"emscripten_stack_get_base",
"__emscripten_stack_get_end",
"_createExportWrapper",
"_indirect_function_table",=instance.exports.__indirect_function_table
"_wasm_call_ctors"

not even exp funcs:
"assert_fail",
"__emscripten_stack_get_base",
"__emscripten_stack_get_end",
"emscripten_stack_get_free",
"emscripten_stack_init",
"indirect_function_table",
"segfault",
"set_stack_limits",=instance.exports.__indirect_function_table
"wasm_call_ctors"=instance.exports.__indirect_function_table



i think this is JS:
"createExportWrapper",
"handle_stack_overflow",

prob doesn't even 4exist
"memory",


warning: invalid item in EXPORTED_RUNTIME_METHODS: __assert_fail
warning: invalid item in EXPORTED_RUNTIME_METHODS: __handle_stack_overflow
warning: invalid item in EXPORTED_RUNTIME_METHODS: memory
warning: invalid item in EXPORTED_RUNTIME_METHODS: segfault
warning: invalid item in EXPORTED_RUNTIME_METHODS: ___set_stack_limits
warning: invalid item in EXPORTED_RUNTIME_METHODS: _emscripten_stack_init
warning: invalid item in EXPORTED_RUNTIME_METHODS: _emscripten_stack_get_free
warning: invalid item in EXPORTED_RUNTIME_METHODS: _emscripten_stack_get_base
warning: invalid item in EXPORTED_RUNTIME_METHODS: _emscripten_stack_get_end
warning: invalid item in EXPORTED_RUNTIME_METHODS: createExportWrapper
warning: invalid item in EXPORTED_RUNTIME_METHODS: __indirect_function_table
warning: invalid item in EXPORTED_RUNTIME_METHODS: __wasm_call_ctors

warning: invalid item in EXPORTED_RUNTIME_METHODS: _assert_fail
warning: invalid item in EXPORTED_RUNTIME_METHODS: _handle_stack_overflow
warning: invalid item in EXPORTED_RUNTIME_METHODS: _memory
warning: invalid item in EXPORTED_RUNTIME_METHODS: _segfault
warning: invalid item in EXPORTED_RUNTIME_METHODS: __set_stack_limits
warning: invalid item in EXPORTED_RUNTIME_METHODS: emscripten_stack_init
warning: invalid item in EXPORTED_RUNTIME_METHODS: __emscripten_stack_get_free
warning: invalid item in EXPORTED_RUNTIME_METHODS: emscripten_stack_get_base
warning: invalid item in EXPORTED_RUNTIME_METHODS: __emscripten_stack_get_end
warning: invalid item in EXPORTED_RUNTIME_METHODS: _createExportWrapper
warning: invalid item in EXPORTED_RUNTIME_METHODS: _indirect_function_table
warning: invalid item in EXPORTED_RUNTIME_METHODS: _wasm_call_ctors


what's this do?  Do I need it?

---------------------------------- more


quantumEngine.lib.js:27 _embind_register_void unimplemented
---
$embind_init_builtin() @ bind.cpp:120
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_bool unimplemented
---
$embind_init_builtin() @ bind.cpp:122
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_integer unimplemented
---
$embind_init_builtin() @ bind.cpp:70
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_integer unimplemented
---
$embind_init_builtin() @ bind.cpp:70
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_integer unimplemented
---
$embind_init_builtin() @ bind.cpp:70
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_integer unimplemented
---
$embind_init_builtin() @ bind.cpp:70
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_integer unimplemented
---
$embind_init_builtin() @ bind.cpp:70
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_integer unimplemented
---
$embind_init_builtin() @ bind.cpp:70
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_integer unimplemented
---
$embind_init_builtin() @ bind.cpp:70
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_integer unimplemented
---
$embind_init_builtin() @ bind.cpp:70
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_integer unimplemented
---
$embind_init_builtin() @ bind.cpp:70
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_bigint unimplemented
---
$legalfunc$_embind_register_bigint @ fflush.c:45
$embind_init_builtin() @ bind.cpp:76
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_bigint unimplemented
---
$legalfunc$_embind_register_bigint @ fflush.c:45
$embind_init_builtin() @ bind.cpp:76
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_float unimplemented
---
$embind_init_builtin() @ bind.cpp:82
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_float unimplemented
---
$embind_init_builtin() @ bind.cpp:82
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_std_string unimplemented
---
$embind_init_builtin() @ bind.cpp:145
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_std_string unimplemented
---
$embind_init_builtin() @ bind.cpp:146
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_std_wstring unimplemented
---
$embind_init_builtin() @ bind.cpp:148
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_std_wstring unimplemented
---
$embind_init_builtin() @ bind.cpp:149
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_std_wstring unimplemented
---
$embind_init_builtin() @ bind.cpp:150
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_emval unimplemented
---
$embind_init_builtin() @ bind.cpp:151
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_memory_view unimplemented
---
$embind_init_builtin() @ bind.cpp:113
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_memory_view unimplemented
---
$embind_init_builtin() @ bind.cpp:113
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_memory_view unimplemented
---
$embind_init_builtin() @ bind.cpp:113
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_memory_view unimplemented
---
$embind_init_builtin() @ bind.cpp:113
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_memory_view unimplemented
---
$embind_init_builtin() @ bind.cpp:113
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_memory_view unimplemented
---
$embind_init_builtin() @ bind.cpp:113
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_memory_view unimplemented
---
$embind_init_builtin() @ bind.cpp:113
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_memory_view unimplemented
---
$embind_init_builtin() @ bind.cpp:113
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_memory_view unimplemented
---
$embind_init_builtin() @ bind.cpp:113
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_memory_view unimplemented
---
$embind_init_builtin() @ bind.cpp:113
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_memory_view unimplemented
---
$embind_init_builtin() @ bind.cpp:113
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_memory_view unimplemented
---
$embind_init_builtin() @ bind.cpp:113
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_memory_view unimplemented
---
$embind_init_builtin() @ bind.cpp:113
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_memory_view unimplemented
---
$embind_init_builtin() @ bind.cpp:113
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_memory_view unimplemented
---
$embind_init_builtin() @ bind.cpp:113
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_memory_view unimplemented
---
$embind_init_builtin() @ bind.cpp:113
$_GLOBAL__sub_I_bind.cpp @ bind.h:259
$__wasm_call_ctors @ quantumEngine.wasm:0x107e

quantumEngine.lib.js:27 _embind_register_memory_view unimplemented


5200 2 65196
__stdio_write.c:17 1 65200 2 65196
eThread.js:63 eThread:  ⛏ got a gotItGoinOn message:  {verb: 'gotItGoinOn', name: 'thread_0', serial: 0}
3__stdio_write.c:17 1 65200 2 65196
eThread.js:67 eThread #0  ⛏ gotItGoinOn
70465__stdio_write.c:17 1 65200 2 65196



