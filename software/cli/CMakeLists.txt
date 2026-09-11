cmake_minimum_required(VERSION 3.13)
project(stuttgart C)

enable_testing()

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

add_executable(stuttgart
    src/main.c
    src/stg_proto.c
)

target_include_directories(stuttgart PRIVATE src)

if(MSVC)
    target_compile_options(stuttgart PRIVATE /W4)
else()
    target_compile_options(stuttgart PRIVATE -Wall -Wextra)
endif()

if (WIN32)
    target_sources(stuttgart PRIVATE src/port_win32.c)
else()
    target_sources(stuttgart PRIVATE src/port_posix.c)
endif()

add_executable(test_proto tests/test_proto.c src/stg_proto.c)
target_include_directories(test_proto PRIVATE src)

add_test(NAME proto COMMAND test_proto)