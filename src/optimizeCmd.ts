import { NodeIO, Logger, ImageUtils, BufferUtils, Transform } from "@gltf-transform/core";
// import { ao, weld, dedup, inspect } from "@gltf-transform/functions";
import { toktx, Mode, Filter } from "@gltf-transform/cli";
import { HubsComponents } from "./HubsComponents";
import { MozLightmap } from "./MozLightmap";
import { MozTextureRGBE } from "./MozTextureRGBE";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";

import WebSocket from "ws";

import { createServer } from "https";

import express from "express";
import staticFile from "connect-static-file";
import selfsigned from "selfsigned";
import * as fs from "fs";
import * as path from "path";
import cors from "cors";
// import gl from "gl";
//

function createHTTPSConfig() {
  // Generate certs for the local webpack-dev-server.
  if (fs.existsSync(path.join(__dirname, "certs"))) {
    const key = fs.readFileSync(path.join(__dirname, "certs", "key.pem"));
    const cert = fs.readFileSync(path.join(__dirname, "certs", "cert.pem"));
    return { key, cert };
  } else {
    const pems = selfsigned.generate(
      [
        {
          name: "commonName",
          value: "localhost",
        },
      ],
      {
        days: 365,
        keySize: 2048,
        algorithm: "sha256",
        extensions: [
          {
            name: "subjectAltName",
            altNames: [
              {
                type: 2,
                value: "localhost",
              },
              {
                type: 2,
                value: "hubs.local",
              },
            ],
          },
        ],
      }
    );
    fs.mkdirSync(path.join(__dirname, "certs"));
    fs.writeFileSync(path.join(__dirname, "certs", "cert.pem"), pems.cert);
    fs.writeFileSync(path.join(__dirname, "certs", "key.pem"), pems.private);
    return {
      key: pems.private,
      cert: pems.cert,
    };
  }
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function guessImageMimeType(view: DataView): string {
  const magicBuffer = view.buffer.slice(view.byteOffset + 1, view.byteOffset + 7);
  const magic = BufferUtils.decodeText(magicBuffer);
  if (magic.slice(0, 3) === "PNG") {
    return "image/png";
  } else if (magic === "KTX 20") {
    return "image/ktx2";
  } else if (view.getUint8(0) === 0xff && view.getUint8(1) === 0xd8 && view.getUint8(2) === 0xff) {
    return "image/jpeg";
  }

  return "unknown";
}

function fixTextureMimetypes(): Transform {
  // TODO our test scenes seem to have incorrect mimetype. Should be fixing this conditionally with a warning
  return function (doc) {
    doc
      .getRoot()
      .listTextures()
      .forEach((texture) => {
        const guessedType = guessImageMimeType(new DataView(texture.getImage()));
        const mimeType = texture.getMimeType();
        if (guessedType !== "unknown" && guessedType !== mimeType) {
          doc
            .getLogger()
            .warn(
              `Texture ${texture.getName()} set with mime type: ${mimeType} but appears to be ${guessedType}. Fixing.`
            );
          texture.setMimeType(guessedType);
        }
      });
  };
}

function printTextureMem(label: string): Transform {
  return function (doc) {
    let diskSize = 0;
    let memSize = 0;
    doc
      .getRoot()
      .listTextures()
      .forEach((texture, _textureIndex) => {
        const img = texture.getImage();
        diskSize += img.byteLength;
        memSize += ImageUtils.getMemSize(texture.getImage(), texture.getMimeType());
      });
    doc.getLogger().info(`${label}: Disk=${formatBytes(diskSize)} GPU=${formatBytes(memSize)}`);
  };
}

type OptimizeCmdArgs = {
  input: string;
  output: string;
};

type OptimizeCmdOptions = {
  ktx: string;
  serve: boolean;
  watch: boolean;
  servePort: number;
};

async function optimizeFile(inputFile: string, outputFile: string, { logger, texCompressionMode }) {
  logger.info(`Optimizing ${inputFile}...`);

  const io = new NodeIO()
    .registerExtensions(KHRONOS_EXTENSIONS)
    .registerExtensions([HubsComponents, MozLightmap, MozTextureRGBE]);
  const doc = io.read(inputFile);

  const compressTextures =
    texCompressionMode === null ? () => {} : toktx({ mode: texCompressionMode, powerOfTwo: true });

  doc.setLogger(logger);

  // await doc.transform(
  // fixTextureMimetypes()
  // printTextureMem("Uncompressed"),
  // compressTextures,
  // dedup({ textures: false, accessors: true }),
  // weld(),
  // printTextureMem("Compressed")
  // );

  io.write(outputFile, doc);

  logger.info(`Wrote: ${outputFile}`);
}

export async function optimizeCmd({ args, logger, options }) {
  const { input: inputFile, output: outputFile } = args as OptimizeCmdArgs;
  const opts = options as OptimizeCmdOptions;
  const texCompressionMode = opts.ktx ? (opts.ktx === "uastc" ? Mode.UASTC : Mode.ETC1S) : null;

  let wss: WebSocket;
  if (opts.serve) {
    const app = express()
      .use(cors())
      .use("/file.glb", staticFile(outputFile, {}))
      .get("/", (req, res) => {
        res.send('<a href="file.glb">Optimized file</a>');
      });

    const server = createServer(createHTTPSConfig(), app).listen(opts.servePort, () => {
      logger.info(`Serving file at https://localhost:${opts.servePort}/file.glb...`);
    });

    if (opts.watch) {
      wss = new WebSocket.Server({ noServer: true });
      server.on("upgrade", (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (socket) => {
          wss.emit("connection", socket, request);
        });
      });
    }
  }

  async function run() {
    await optimizeFile(inputFile, outputFile, { logger, texCompressionMode });
    if (wss) {
      logger.info("Sending refresh to clients...");
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send("reloadScene");
        }
      });
    }
  }

  if (opts.watch) {
    fs.watchFile(inputFile, function (curr, prev) {
      logger.info("File changed. Re-optimizing...");
      run();
    });
  }

  run();
}
