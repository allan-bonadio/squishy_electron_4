/*
** directAccessors -- helpers to generate direct accessor funcs for JS
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

// see how these are used in qAvatar.cpp
// use one of these six printf macros for each field from your .h file you want to export.
// You should arrange the fields in the .h file from
// wides (doubles) to narrows (bools) for safer alignment

// use for int field, or anything 1 byte
#define makeBoolOffset(field)  (int) ((bool *) &this->field - (bool *) this)
#define makeBoolGetter(field)  printf("get " #field  "() { return this.bools[%d]; }\n", makeBoolOffset(field));
#define makeBoolSetter(field)  printf("set " #field  "(a) { this.bools[%d] = a; }\n", makeBoolOffset(field));

// use for int field, or anything 32 bits, like a pointer
#define makeIntOffset(field)  (int) ((int *) &this->field - (int *) this)
#define makeIntGetter(field)  printf("get " #field  "() { return this.ints[%d]; }\n", makeIntOffset(field));
#define makeIntSetter(field)  printf("set " #field  "(a) { this.ints[%d] = a; }\n", makeIntOffset(field));

// use for int field, or anything 64 bits
#define makeDoubleOffset(field)  (int) ((double *) &this->field - (double *) this)
#define makeDoubleGetter(field)  printf("get " #field  "() { return this.doubles[%d]; }\n", makeDoubleOffset(field));
#define makeDoubleSetter(field)  printf("set " #field  "(a) { this.doubles[%d] = a; }\n", makeDoubleOffset(field));


