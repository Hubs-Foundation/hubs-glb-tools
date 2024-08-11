import { Program } from "@caporal/core";
import { optimizeCmd } from "optimizeCmd";

const program = new Program();
program
  .version(require("../package.json").version)
  .description("Tool for working with glb files for Hubs")
  .command("optimize", "Optimize a model for Hubs")
  .help("Optimize a model for Hubs")
  .argument("<input>", "input gltf/glb file")
  .argument("<output>", "output gltf/glb file")
  .option(
    "--ktx <compression-format>",
    "Compress textures into KTX2 + Basis with either the specified format, 'none' to prevent compression, or 'auto' to select an appropriate format for the texture type (default)",
    { validator: ["auto", "etc1s", "uastc", "none"], default: "auto" }
  )
  .option("--serve", "serve up the optimized file via an internal webserver on the specified port after optimizing")
  .option("--serve-port <port>", "Port to use for the internal webserver", { default: 7777 })
  .option(
    "-w, --watch",
    "Watch the input file for changes and continously re-optimize it. Also send out a message on the local websocket when used with --serve"
  )
  .option(
    "-d, --draco",
    "Compress with Draco compression"
  )
  .action(optimizeCmd);

// Placeholder for any async init we may need later
const programReady = Promise.resolve();

export { program, programReady };
