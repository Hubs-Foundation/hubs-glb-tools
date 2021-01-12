import { Program } from "@caporal/core";
import { optimizeCmd } from "optimizeCmd";

const program = new Program();
program
  .version(require("../package.json").version)
  .description("Tool for working with glb files for Mozilla Hubs")
  .command("optimize", "Optimize a model for Hubs")
  .help("Optimize a model for Hubs")
  .argument("<input>", "input gltf/glb file")
  .argument("<output>", "output gltf/glb file")
  .option(
    "--ktx <compression-format>",
    "Compress textures into KTX2 + Basis textures with the specified compression format",
    { validator: ["etc1s", "uastc"] }
  )
  .option("--serve", "serve up the optimized file via an internal webserver on the specified port after optimizing")
  .option("--serve-port <port>", "Port to use for the internal webserver", { default: 7777 })
  .option(
    "-w, --watch",
    "Watch the input file for changes and continously re-optimize it. Also send out a message on the local websocket when used with --serve"
  )
  .action(optimizeCmd);

// Placeholder for any async init we may need later
const programReady = Promise.resolve();

export { program, programReady };
