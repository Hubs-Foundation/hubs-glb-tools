import {
  Extension,
  PropertyType,
  ExtensionProperty,
  TextureInfo,
  Link,
  TextureLink,
  WriterContext,
  Texture,
  TextureChannel,
} from "@gltf-transform/core";

const { R, G, B } = TextureChannel;

const NAME = "MOZ_lightmap";
export class MozLightmapProperty extends ExtensionProperty {
  public readonly propertyType = "MozLightmapProperty";
  public readonly parentTypes = [PropertyType.MATERIAL];
  public readonly extensionName = NAME;

  lightmapTextureInfo: Link<this, TextureInfo>;
  texCoord: any;
  intensity: any;
  lightmapTexture: TextureLink;

  constructor(graph, extension) {
    super(graph, extension);
    this.lightmapTextureInfo = this.graph.link("lightmapTextureInfo", this, new TextureInfo(this.graph));
  }

  copy(other, resolve) {
    super.copy(other, resolve);

    this.texCoord = other.texCoord;
    this.intensity = other.intensity;

    if (other.lightmapTexture) {
      this.setLightmapTexture(resolve(other.lightmapTexture.getChild()));
      // this.getDiffuseTextureInfo().copy(resolve(other.lightmapTextureInfo.getChild()), resolve);
    }

    return this;
  }

  dispose() {
    this.lightmapTextureInfo.getChild().dispose();
    // this.specularGlossinessTextureInfo.getChild().dispose();
    super.dispose();
  }

  getLightmapTexture() {
    return this.lightmapTexture ? this.lightmapTexture.getChild() : null;
  }

  getLightmapTextureInfo() {
    return this.lightmapTexture ? this.lightmapTextureInfo.getChild() : null;
  }

  setLightmapTexture(texture: Texture | null): this {
    this.lightmapTexture = this.graph.linkTexture("lightmapTexture", R | G | B, this, texture);
    return this;
  }
}

export class MozLightmap extends Extension {
  public readonly extensionName = NAME;
  public static readonly EXTENSION_NAME = NAME;

  read(context) {
    const jsonDoc = context.jsonDoc;
    const materialDefs = jsonDoc.json.materials || [];
    const textureDefs = jsonDoc.json.textures || [];

    materialDefs.forEach((matDef, matIndex) => {
      if (!matDef.extensions || !matDef.extensions[NAME]) return;

      const texInfo = matDef.extensions[NAME];

      if (textureDefs[texInfo.index] === undefined) {
        console.log("invalid lightmap index", texInfo);
        return this;
      }

      const lightmap = new MozLightmapProperty(this.doc.getGraph(), this);
      lightmap.intensity = texInfo.intensity;
      lightmap.texCoord = texInfo.texCoord;

      const lightmapTextureDef = textureDefs[texInfo.index];

      lightmap.setLightmapTexture(context.textures[lightmapTextureDef.source]);
      context.setTextureInfo(lightmap.getLightmapTextureInfo(), texInfo);

      context.materials[matIndex].setExtension(NAME, lightmap);
    });
    return this;
  }

  write(context: WriterContext) {
    const jsonDoc = context.jsonDoc;

    this.doc
      .getRoot()
      .listMaterials()
      .forEach((material) => {
        const ext = material.getExtension(NAME) as MozLightmapProperty;
        if (ext) {
          const materialIndex = context.materialIndexMap.get(material);
          const materialDef = jsonDoc.json.materials[materialIndex];
          materialDef.extensions = materialDef.extensions || {};

          materialDef.extensions[NAME] = {
            intensity: ext.intensity,
          };

          if (ext.getLightmapTexture()) {
            const texture = ext.getLightmapTexture();
            const textureInfo = ext.getLightmapTextureInfo();
            Object.assign(materialDef.extensions[NAME], context.createTextureInfoDef(texture, textureInfo));
          }

          // console.log(materialDef);
          // const matIndex = context.materialIndexMap.get(mat);
          // const matDef = jsonDoc.json.materials[matIndex];
          // matDef.extensions = matDef.extensions || {};
          // matDef.extensions[NAME] = ext.data;
          // matDef.extensions[NAME].index = context.imageIndexMap.get(ext.img);
          // console.log(ext.img, ext.data);
        }
      });

    return this;
  }
}
