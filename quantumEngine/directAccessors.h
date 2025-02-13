/*
** directAccessors -- helpers to generate direct accessor funcs for JS
** Copyright (C) 2022-2025 Tactile Interactive, all rights reserved
*/

// Use proxy JS objects to access fields in C++ objects.
// See how these are used in qGrinder.cpp and qSpace.cpp . Use one of these
// printf macros, in *::formatDirectOffsets(),  for each field from your .h file
// you want to share with JS. You should arrange the fields in the .h file from
// wides (doubles) to narrows (bools or bytes) for safer alignment, or just count bytes.
// Include or omit fields and setters in C++ depending on if you use these macros in
// the JS proxy class, in JS.

// the "Named" variations are for arrays, right now just the Dimensions struct array
// in qSpace. It's a temporary hack until I figure out a better way.
// Whereas you'd say makeDoubleGetter(dx) for the dx double in the main
// object, you'd say makeNamedDoubleGetter(dx0, dimensions[0].dx) for
// the dx double in the embedded array dimensions, 0th element.  See the code.
// Probably I'll have one getter to get the dimension struct and one for
// the variable in it, sometime in the future.

// use for bool field, or anything 1 byte.  probably should rename this all from bool to byte.
#define byteOffset(field)  (int) ((byte *) &this->field - (byte *) this)
#define makeBoolGetter(field)  printf("\tget " #field  "() { return Boolean(this.bytes[%d]); }\n", byteOffset(field));
#define makeBoolSetter(field)  printf("\tset " #field  "(a) { this.bytes[%d] = Boolean(a); }\n", byteOffset(field));

#define makeByteGetter(field)  printf("\tget "  #field  "() { return this.bytes[%d]; }\n", byteOffset(field));
#define makeByteSetter(field)  printf("\tset " #field  "(a) { this.bytes[%d] = a; }\n", byteOffset(field));

// use for a standard C string
#define makeStringPointer(field)  printf("\tget _" #field  "() { return this.pointer + %d; }\n", byteOffset(field));
#define makeNamedStringPointer(name, field)  printf("\tget _" #name  "() { return this.pointer + %d; }\n", byteOffset(field));

// use for int field, or anything 32 bits, like a pointer
#define intOffset(field)  (int) ((int *) &this->field - (int *) this)
#define makeIntGetter(field)  printf("\tget " #field  "() { return this.ints[%d]; }\n", intOffset(field));
#define makeNamedIntGetter(name, field)  printf("\tget " #name  "() { return this.ints[%d]; }\n", intOffset(field));
#define makeIntSetter(field)  printf("\tset " #field  "(a) { this.ints[%d] = a; }\n", intOffset(field));

// Just need this offset in the JS, like so JS can get at the atomics
#define makeIntOffset(field)  printf("\t"  #field  "Offset = %d;\n", intOffset(field));

// like makeIntGetter() but creates a different name so as to not conflict with actual JS field in same class.
// This will return to JS the C++ pointer value, which can be wrapped into a JS e-class.
// No corresponding setter cuz only C++ sets the pointers in constructors or other
#define makePointerGetter(field)  printf("\tget _" #field  "() { return this.ints[%d]; }\n", intOffset(field));

// use for double float field, or anything 64 bits
#define doubleOffset(field)  (int) ((double *) &this->field - (double *) this)
#define makeDoubleGetter(field)  printf("\tget " #field  "() { return this.doubles[%d]; }\n", doubleOffset(field));
#define makeNamedDoubleGetter(name, field)  printf("\tget " #name  "() { return this.doubles[%d]; }\n", doubleOffset(field));
#define makeDoubleSetter(field)  printf("\tset " #field  "(a) { this.doubles[%d] = a; }\n", doubleOffset(field));

// Uncomment only the first line below, for normal operation. When you
// change some field arrangements or sizes for the major objects that
// are proxied in JS, uncomment only the second line, below, to re-calc
// the offsets, in all proxied objects, so all constructors print out JS
// code. Then run in the browser (not C++ cppu tests, they use 64bit
// ptrs).  Turn off timestamps in console if you have them on.
// Take the generated JS and paste it into the corresponding
// JS files, in src/engine, where indicated. Then, do a global
// search/replace the string 'quantumEngine.main.js:2412' or whatever
// your line number is. (if you don't understand, you'll see when you get
// there.) Just change it to '', don't get rid of any
// spaces. You should then have valid JS.  When it all works, you can
// turn off FORMAT_DIRECT_OFFSETS and recompile to get rid of the
// annoying output (which should be harmless anyway).

#define FORMAT_DIRECT_OFFSETS
//#define FORMAT_DIRECT_OFFSETS  formatDirectOffsets()


