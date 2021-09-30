import {
  Extension,
  ImageUtils,
  ImageUtilsFormat,
  PropertyType,
  ReaderContext,
  WriterContext,
  vec2,
} from "@gltf-transform/core";

interface RGBEDef {
  source: number;
}

// TODO this is stubbed out, I think it only matters for metrics but should be fixed
class RGBEImageUtils implements ImageUtilsFormat {
  getSize(buffer: ArrayBuffer): vec2 {
    return [512, 512];
  }
  getChannels(buffer: ArrayBuffer): number {
    return 4;
  }
  getGPUByteLength(buffer: ArrayBuffer): number {
    return 512 * 512 * 8 * 4;
  }
}

const NAME = "MOZ_texture_rgbe";
export class MozTextureRGBE extends Extension {
  public readonly extensionName = NAME;
  public readonly prereadTypes = [PropertyType.TEXTURE];
  public static readonly EXTENSION_NAME = NAME;

  public static register(): void {
    ImageUtils.registerFormat("image/vnd.radiance", new RGBEImageUtils());
  }

  public preread(context: ReaderContext): this {
    // console.log("pre", context.jsonDoc.json.textures);
    context.jsonDoc.json.textures?.forEach((textureDef) => {
      if (textureDef.extensions && textureDef.extensions[NAME]) {
        const def = textureDef.extensions[NAME] as RGBEDef;
        textureDef.source = def.source;
      }
      // console.log("texture", textureDef);
    });
    return this;
  }

  public read(context: ReaderContext): this {
    // console.log("read", context.jsonDoc.json.textures, this.doc.getRoot().listTextures());
    return this;
  }

  public write(context: WriterContext): this {
    const jsonDoc = context.jsonDoc;

    // console.log("write", jsonDoc.json.textures);

    this.doc
      .getRoot()
      .listTextures()
      .forEach((texture) => {
        // console.log("out texture", texture.getName());
        if (texture.getMimeType() === "image/vnd.radiance") {
          const imageIndex = context.imageIndexMap.get(texture);
          const textureDefs = jsonDoc.json.textures || [];
          textureDefs.forEach((textureDef) => {
            if (textureDef.source === imageIndex) {
              textureDef.extensions = textureDef.extensions || {};
              textureDef.extensions[NAME] = { source: textureDef.source };
              delete textureDef.source;
            }
            // console.log(textureDef);
          });
        }
      });

    return this;
  }
}
