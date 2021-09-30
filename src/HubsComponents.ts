import {
  Extension,
  PropertyType,
  ExtensionProperty,
  WriterContext,
  ReaderContext,
  TextureInfo,
  Texture,
  Node,
  Material,
  Property,
} from "@gltf-transform/core";
import { PropertyResolver } from "@gltf-transform/core/dist/properties";

const NAME = "MOZ_hubs_components";
export class HubsComponentsProperty extends ExtensionProperty {
  public readonly propertyType = "HubsComponentsProperty";
  public readonly parentTypes = [PropertyType.NODE, PropertyType.SCENE, PropertyType.MATERIAL];
  public readonly extensionName = NAME;

  data: any;

  copy(other: this, resolve: PropertyResolver<Property>) {
    super.copy(other, resolve);
    this.data = other.data;

    return this;
  }
}

export class HubsComponents extends Extension {
  public readonly extensionName = NAME;
  public static readonly EXTENSION_NAME = NAME;

  read(context: ReaderContext): this {
    const jsonDoc = context.jsonDoc;

    const copyComponents = (defType: string) => {
      return (def, i) => {
        if (!def.extensions || !def.extensions[NAME]) return;

        const prop = new HubsComponentsProperty(this.doc.getGraph(), this);
        prop.data = def.extensions[NAME];

        for (const componentName in prop.data) {
          const props = prop.data[componentName];
          for (const propName in props) {
            const value = props[propName];
            const linkType = value?.__mhc_link_type;
            if (linkType && value.index !== undefined) {
              // console.log("Loading link", value, typeof props[propName]);
              if (linkType === "texture") {
                context.setTextureInfo(new TextureInfo(this.doc.getGraph()), props[propName]);
              }
              props[propName] = context[`${linkType}s`][value.index];
            }
          }
        }

        context[defType][i].setExtension(NAME, prop);
      };
    };

    jsonDoc.json.nodes.forEach(copyComponents("nodes"));
    jsonDoc.json.scenes.forEach(copyComponents("scenes"));
    // jsonDoc.json.materials.forEach(copyComponents("materials"));

    return this;
  }

  write(context: WriterContext) {
    this.doc
      .getRoot()
      .listNodes()
      .forEach((node) => {
        const ext = node.getExtension(NAME) as HubsComponentsProperty;
        if (ext) {
          this.copyComponentData("nodes", context, ext.data, context.nodeIndexMap.get(node));
        }
      });

    this.doc
      .getRoot()
      .listScenes()
      .forEach((scene, i) => {
        const ext = scene.getExtension(NAME) as HubsComponentsProperty;
        if (ext) {
          this.copyComponentData("scenes", context, ext.data, i);
        }
      });

    return this;
  }

  copyComponentData(defType: string, context: WriterContext, data: any, idx: number) {
    const jsonDoc = context.jsonDoc;

    for (const componentName in data) {
      const props = data[componentName];
      for (const propName in props) {
        const value = props[propName];
        // TODO check other link types
        if (value instanceof Texture) {
          // TODO something about this does not work correctly if 2 textures point at the same image.
          // console.log("linking back texture");
          props[propName] = context.createTextureInfoDef(value, new TextureInfo(this.doc.getGraph()));
          props[propName].__mhc_link_type = "texture";
          // console.log(props);
        } else if (value instanceof Node) {
          // console.log("linking back node");
          props[propName] = {
            index: context.nodeIndexMap.get(value),
            __mhc_link_type: "node",
          };
          // console.log(props);
        } else if (value instanceof Material) {
          // console.log("linking back material");
          props[propName] = {
            index: context.materialIndexMap.get(value),
            __mhc_link_type: "material",
          };
          // console.log(props);
        }
      }
    }

    const def = jsonDoc.json[defType][idx];
    def.extensions = def.extensions || {};
    def.extensions[NAME] = data;
  }
}
