/*
** exceptions -- code to get error message from C++ exception pointer
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

#include <emscripten/bind.h>

// this is from https://emscripten.org/docs/porting/Debugging.html#handling-c-exceptions-from-javascript
std::string getCppExceptionMessage(intptr_t exceptionPtr) {
	return std::string(reinterpret_cast<std::exception *>(exceptionPtr)->what());
}
