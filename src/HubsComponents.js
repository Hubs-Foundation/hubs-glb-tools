import { Extension, PropertyType, ExtensionProperty } from "@gltf-transform/core";

const NAME = "MOZ_hubs_components";
export class HubsComponentsProperty extends ExtensionProperty {
  copy(other, resolve) {
    super.copy(other, resolve);
    this.data = other.data;
    return this;
  }
}

HubsComponentsProperty.prototype.propertyType = "HubsComponentsProperty";
HubsComponentsProperty.prototype.parentTypes = [PropertyType.NODE];
HubsComponentsProperty.prototype.extensionName = NAME;
HubsComponentsProperty.EXTENSION_NAME = NAME;

export class HubsComponents extends Extension {
  constructionr() {}

  read(context) {
    const jsonDoc = context.jsonDoc;
    jsonDoc.json.nodes.forEach((nodeDef, nodeIndex) => {
      if (!nodeDef.extensions || !nodeDef.extensions[NAME]) return;

      const prop = new HubsComponentsProperty(this.doc.getGraph(), this);
      prop.data = nodeDef.extensions[NAME];
      context.nodes[nodeIndex].setExtension(NAME, prop);
    });
    return this;
  }

  write(context) {
    const jsonDoc = context.jsonDoc;

    this.doc
      .getRoot()
      .listNodes()
      .forEach((node) => {
        const ext = node.getExtension(NAME);
        if (ext) {
          const nodeIndex = context.nodeIndexMap.get(node);
          const nodeDef = jsonDoc.json.nodes[nodeIndex];
          nodeDef.extensions = nodeDef.extensions || {};
          nodeDef.extensions[NAME] = ext.data;
        }
      });

    return this;
  }
}
HubsComponents.prototype.extensionName = NAME;
HubsComponents.EXTENSION_NAME = NAME;
