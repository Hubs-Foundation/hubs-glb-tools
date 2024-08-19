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
## Compression Types
The command `node /bin/cli.js optimize input.glb output.glb --ktx {{compression type}}` is used to optimize a GLB file by applying texture compression using the KTX format. This command supports various compression types, each with different characteristics:

`node /bin/cli.js optimize input.glb output.glb --ktx auto`
Auto: This option automatically selects the compression type based on the texture type. For standard textures, it uses ETC1S compression, which provides a balance between file size and quality. For normal maps, it opts for UASTC compression, which preserves more detail, albeit with a larger file size.

`node /bin/cli.js optimize input.glb output.glb --ktx etc1s`
ETC1S: This compression type is designed to minimize file size, making it ideal for scenarios where storage or bandwidth is a concern. However, it offers lower quality compared to UASTC, which might result in a slight loss of detail in the textures.

`node /bin/cli.js optimize input.glb output.glb --ktx uastc`
UASTC: This option is focused on maintaining higher quality, especially for textures where detail is critical. It results in larger file sizes, but the visual fidelity is significantly better, making it suitable for applications where quality is a priority.