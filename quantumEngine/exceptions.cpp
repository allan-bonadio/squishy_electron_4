/*
** exceptions -- code to get error message from C++ exception pointer
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

#include <emscripten/bind.h>

//#include <emscripten/bind.h>
//#include <emscripten/bind.h>

// somehow you can't generate a stack trace from inside C++??!?!
// you have to call a JS function to do it.
//EM_JS(void, printStackTrace, (void),
//{
//	// this is a JS string... don't know how to pass it back to C++ so we set a global variable
//	window.cpptackTrace = jsStackTrace();
//}
//);


// this is from https://emscripten.org/docs/porting/Debugging.html#handling-c-exceptions-from-javascript
std::string getCppExceptionMessage(intptr_t exceptionPtr) {
	//printStackTrace();
	return std::string(reinterpret_cast<std::exception *>(exceptionPtr)->what());
}

//EMSCRIPTEN_BINDINGS(Bindings) {
//  emscripten::function("getCppExceptionMessage", &getCppExceptionMessage);
//};

