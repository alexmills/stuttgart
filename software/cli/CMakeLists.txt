cmake_minimum_required(VERSION 3.13)
project(stuttgart C)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

add_executable(stuttgart
    src/main.c
)

target_include_directories(stuttgart PRIVATE src)

if(MSVC)
    target_compile_options(stuttgart PRIVATE /W4)
else()
    target_compile_options(stuttgart PRIVATE -Wall -Wextra)
endif()