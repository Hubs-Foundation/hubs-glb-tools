import { Extension, PropertyType, ExtensionProperty, TextureInfo } from "@gltf-transform/core";

const NAME = "MOZ_lightmap";
export class MozLightmapProperty extends ExtensionProperty {
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
      this.getDiffuseTextureInfo().copy(resolve(other.lightmapTextureInfo.getChild()), resolve);
    }

    return this;
  }

  dispose() {
    this.lightmapTextureInfo.getChild().dispose();
    this.specularGlossinessTextureInfo.getChild().dispose();
    super.dispose();
  }

  getLightmapTexture() {
    return this.lightmapTexture ? this.lightmapTexture.getChild() : null;
  }

  getLightmapTextureInfo() {
    return this.lightmapTexture ? this.lightmapTextureInfo.getChild() : null;
  }

  setLightmapTexture(texture) {
    this.lightmapTexture = this.graph.link("lightmapTexture", this, texture);
    return this;
  }
}

MozLightmapProperty.prototype.propertyType = "MozLightmapProperty";
MozLightmapProperty.prototype.parentTypes = [PropertyType.MATERIAL];
MozLightmapProperty.prototype.extensionName = NAME;
MozLightmapProperty.EXTENSION_NAME = NAME;

export class MozLightmap extends Extension {
  constructionr() {}

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

      // console.log(texInfo, textureDefs[texInfo.index]);

      lightmap.setLightmapTexture(context.textures[textureDefs[texInfo.index].source]);
      context.setTextureInfo(lightmap.getLightmapTextureInfo(), texInfo);

      context.materials[matIndex].setExtension(NAME, lightmap);
    });
    return this;
  }

  write(context) {
    const jsonDoc = context.jsonDoc;

    this.doc
      .getRoot()
      .listMaterials()
      .forEach((material) => {
        const ext = material.getExtension(NAME);
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
MozLightmap.prototype.extensionName = NAME;
MozLightmap.EXTENSION_NAME = NAME;
