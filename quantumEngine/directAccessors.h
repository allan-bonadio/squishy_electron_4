/*
** directAccessors -- helpers to generate direct accessor funcs for JS
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

// see how these are used in qAvatar.cpp and qWave.cpp
// use one of these printf macros for each field from your .h file you want to export.
// You should arrange the fields in the .h file from
// wides (doubles) to narrows (bools) for safer alignment.
// Include or omit fields and setters as appropriate when you use these macros in a

// use for bool field, or anything 1 byte
#define byteOffset(field)  (int) ((bool *) &this->field - (bool *) this)
#define makeBoolGetter(field)  printf("get " #field  "() { return this.bools[%d]; }\n", byteOffset(field));
#define makeBoolSetter(field)  printf("set " #field  "(a) { this.bools[%d] = a; }\n", byteOffset(field));

// use for a standard C string
#define makeStringPointer(field)  printf("get _" #field  "() { return this.pointer + %d; }\n", byteOffset(field));

// use for int field, or anything 32 bits, like a pointer
#define intOffset(field)  (int) ((int *) &this->field - (int *) this)
#define makeIntGetter(field)  printf("get " #field  "() { return this.ints[%d]; }\n", intOffset(field));
#define makeIntSetter(field)  printf("set " #field  "(a) { this.ints[%d] = a; }\n", intOffset(field));

// like makeIntGetter() but creates a different name so as to not conflict with actual JS field in same class.
// This will return to JS the C++ pointer value, which can be wrapped into a JS class.
// No corresponding setter cuz only C++ sets the pointers in constructors or other
#define makePointerGetter(field)  printf("get _" #field  "() { return this.ints[%d]; }\n", intOffset(field));

// use for double float field, or anything 64 bits
#define doubleOffset(field)  (int) ((double *) &this->field - (double *) this)
#define makeDoubleGetter(field)  printf("get " #field  "() { return this.doubles[%d]; }\n", doubleOffset(field));
#define makeDoubleSetter(field)  printf("set " #field  "(a) { this.doubles[%d] = a; }\n", doubleOffset(field));


