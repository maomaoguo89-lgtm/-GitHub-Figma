import texture1 from "figma:asset/9f5331598102f1db75f9798bc5792370b464b6f1.png";
import texture2 from "figma:asset/fb884269cc6f847eca45821676b09395b414f950.png";
import texture3 from "figma:asset/82b36c6ff05288adc92d6bff072d613e131ec06d.png";
import texture4 from "figma:asset/0e8987126a11b2ae1b2b1acf9b9ed934dbcc3219.png";
import texture5 from "figma:asset/808f35c54ee109e2a84e4b6add92c2b98c9d8749.png";
import texture6 from "figma:asset/3dc4b7563b53360be6a0f8858b8867411b733226.png";
import texture7 from "figma:asset/269eafb9e80cce3c715a11e2a37f6cc7e37faec4.png";
import texture8 from "figma:asset/3cb77d288667b410987bcd4dbdaa4053d8e7d432.png";

export const CANVAS_TEXTURES: Record<string, string | null> = {
  none: null,
  texture1,
  texture2,
  texture3,
  texture4,
  texture5,
  texture6,
  texture7,
  texture8,
};

export const getTextureUrl = (textureId?: string): string | null => {
  if (!textureId || textureId === 'none') return null;
  return CANVAS_TEXTURES[textureId] || null;
};
