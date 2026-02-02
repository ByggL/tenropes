type RGB = {
  r: number;
  g: number;
  b: number;
};

function componentToHex(c: number) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex: string) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function floorColor(color: string) {
  var col = hexToRgb(color) as RGB;
  var sat = 0.5;

  var gray = col.r * 0.3086 + col.g * 0.6094 + col.b * 0.082;

  col.r = Math.round(col.r * sat + gray * (1 - sat));
  col.g = Math.round(col.g * sat + gray * (1 - sat));
  col.b = Math.round(col.b * sat + gray * (1 - sat));

  var out = rgbToHex(col.r, col.g, col.b);

  return out;
}

export function isImgUrl(url: string) {
  return /\.(jpg|jpeg|png|webp|avif|gif)$/.test(url);
}
