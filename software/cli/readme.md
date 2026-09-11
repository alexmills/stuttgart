# Stuttgart Command Line Client

## Install Tools

### macOS

```
brew install cmake
```

### Windows

```
Working on this...
```


## Build

```
cmake -B build
cmake --build build
```

## Test
CTest is enabled for the project

```
cd build && ctest --output-on-failure
```

## Run

```
./build/stuttgart <port> 
```

