### Hubs Glb Tools
This is the official Hubs Glb tools based on glTF Transform tools which provides fast, reproducible, and lossless control of the low-level details in a 3D model. The API automatically manages array indices and byte offsets, which would otherwise require careful management when editing files.
It allows us to GPU compress the texture using ktx and optimises the glb files without losing the 'Hubs Components' as well



### Installation
1. Clone the repository
`git clone https://github.com/Hubs-Foundation/hubs-glb-tools`
2. Download & Install ktx tools from the [official repository](https://github.com/KhronosGroup/KTX-Software)
3. Change your directory to the cloned folder `cd hubs-glb-tools`, and then run `npm install` with a node version of 18.18


### Usage Instructions
1. Start the tool by running `npm run dist`
2. And in the new terminal instance run the command to generate a new output.glb
`node --no-experimental-fetch bin/cli.js optimize /Users/.../hubs-glb-tools/input.glb /Users/.../output.glb`

Note:
1. It needs absolute glb file's path as the input & output
2. the [--no-experimental-fetch](https://github.com/node-fetch/node-fetch/issues/1566) is required for node versions 18 and up

<!--  TODO: ADD information for different compression types -->
