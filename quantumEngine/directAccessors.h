/*
** directAccessors -- helpers to generate direct accessor funcs for JS
** Copyright (C) 2022-2023 Tactile Interactive, all rights reserved
*/

// See how these are used in qGrinder.cpp and qSpace.cpp . Use one of these
// printf macros, in *::formatDirectOffsets(),  for each field from your .h file
// you want to export to JS. You should arrange the fields in the .h file from
// wides (doubles) to narrows (bools) for safer alignment, or just count bytes.
// Include or omit fields and setters depending on if you use these macros in
// the JS proxy class.

// use for bool field, or anything 1 byte
#define byteOffset(field)  (int) ((byte *) &this->field - (byte *) this)
#define makeBoolGetter(field)  printf("\tget " #field  "() { return this.bools[%d]; }\n", byteOffset(field));
#define makeBoolSetter(field)  printf("\tset " #field  "(a) { this.bools[%d] = a; }\n", byteOffset(field));

// use for a standard C string
#define makeStringPointer(field)  printf("\tget _" #field  "() { return this.pointer + %d; }\n", byteOffset(field));
#define makeNamedStringPointer(name, field)  printf("\tget _" #name  "() { return this.pointer + %d; }\n", byteOffset(field));

// use for int field, or anything 32 bits, like a pointer
#define intOffset(field)  (int) ((int *) &this->field - (int *) this)
#define makeIntGetter(field)  printf("\tget " #field  "() { return this.ints[%d]; }\n", intOffset(field));
#define makeNamedIntGetter(name, field)  printf("\tget " #name  "() { return this.ints[%d]; }\n", intOffset(field));
#define makeIntSetter(field)  printf("\tset " #field  "(a) { this.ints[%d] = a; }\n", intOffset(field));

// Just need this offset
#define makeOffset(field)  printf("\t"  #field  "Offset = %d;\n", intOffset(field));

// like makeIntGetter() but creates a different name so as to not conflict with actual JS field in same class.
// This will return to JS the C++ pointer value, which can be wrapped into a JS class.
// No corresponding setter cuz only C++ sets the pointers in constructors or other
#define makePointerGetter(field)  printf("\tget _" #field  "() { return this.ints[%d]; }\n", intOffset(field));

// use for double float field, or anything 64 bits
#define doubleOffset(field)  (int) ((double *) &this->field - (double *) this)
#define makeDoubleGetter(field)  printf("\tget " #field  "() { return this.doubles[%d]; }\n", doubleOffset(field));
#define makeDoubleSetter(field)  printf("\tset " #field  "(a) { this.doubles[%d] = a; }\n", doubleOffset(field));


// Uncomment only the first line below, for normal operation. When you change
// some field arrangements or sizes for the major objects that are proxied in
// JS, uncomment only the second line, below, to re-calc the offsets, in all
// proxied objects, so all constructors print out JS code. Then run in the
// browser (not C++ cppu tests, they use 64bit ptrs), and take the generated JS
// and paste it into the corresponding JS files, in src/engine, where indicated.
// (you'll have to global search/replace out 'quantumEngine.main.js:2412' or
// whatever it is)

#define FORMAT_DIRECT_OFFSETS
//#define FORMAT_DIRECT_OFFSETS  formatDirectOffsets()
