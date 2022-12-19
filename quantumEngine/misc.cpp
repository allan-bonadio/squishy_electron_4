/*
** time  -- timing utils
** Copyright (C) 2022-2022 Tactile Interactive, all rights reserved
*/

#include <ctime>


// return elapsed real time since last page reload, in seconds, only for tracing
// seems like it's down to miliseconds or even a bit smaller
double getTimeDouble(void)
{
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return ts.tv_sec + ts.tv_nsec / 1e9;
}

