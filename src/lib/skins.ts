import akRedline from "@/assets/skins/ak-redline.png";
import akMesh from "@/assets/skins/ak-mesh.png";
import akSerpent from "@/assets/skins/ak-fireserpent.png";
import m4Grey from "@/assets/skins/m4-grey.png";
import m4Howl from "@/assets/skins/m4-howl.png";
import karFade from "@/assets/skins/karambit-fade.png";
import karSlaughter from "@/assets/skins/karambit-slaughter.png";
import butterfly from "@/assets/skins/butterfly-gamma.png";
import glovesPurple from "@/assets/skins/gloves-purple.png";
import glovesTan from "@/assets/skins/gloves-tan.png";
import stickerPanther from "@/assets/skins/sticker-panther.png";
import stickerFox from "@/assets/skins/sticker-fox.png";
import p90 from "@/assets/skins/p90-teal.png";
import deagle from "@/assets/skins/deagle.png";

export type Category = "Rifle" | "Faca" | "Luvas" | "Adesivo" | "SMG" | "Pistola";

export interface Skin {
  id: string;
  name: string;
  category: Category;
  image: string;
  wear?: string;
  float?: number;
  stattrak?: boolean;
  discount?: number;
  delivery?: "1m" | "15m";
  price: number;
}

type Row = [string, Category, string, string | undefined, number | undefined, boolean, number | undefined, "1m" | "15m" | undefined, number];

const rows: Row[] = [
  // Entrega instantânea
  ["MP7 | Bloodsport", "SMG", deagle, "MW", 0.0748, false, -3, "1m", 275.93],
  ["P90 | Asiimov Teal", "SMG", p90, "MW", 0.1438, false, -2, "1m", 345.75],
  ["M4A4 | Desolate Space", "Rifle", m4Howl, "MW", 0.147, true, undefined, "1m", 153.69],
  ["★ Karambit | Marble Fade", "Faca", karFade, "FN", 0.0332, true, -2, "1m", 3945.09],
  ["★ Luvas | Tan Leather", "Luvas", glovesTan, "MW", 0.1446, false, -3, "1m", 2968.4],
  ["Desert Eagle | Blue Eagle", "Pistola", deagle, "FN", 0.0028, false, -10, "1m", 169.97],
  ["★ Luvas Esportivas | Vice", "Luvas", glovesPurple, "FT", 0.2253, false, -3, "1m", 1151.77],
  ["★ Luvas | Tan Leather", "Luvas", glovesTan, "MW", 0.1499, false, undefined, "1m", 4334.12],
  // Imagem 2
  ["Sticker | iBUYPOWER (Holo) | Katowice 2014", "Adesivo", stickerPanther, undefined, undefined, false, undefined, undefined, 454998.94],
  ["★ Luvas Esportivas | Pandora's Box", "Luvas", glovesPurple, "FN", 0.0899, false, -46, undefined, 123862.2],
  ["★ Luvas Esportivas | Pandora's Box", "Luvas", glovesPurple, "FN", 0.0895, false, -45, "15m", 125833.83],
  ["★ Luvas Esportivas | Pandora's Box", "Luvas", glovesPurple, "FN", 0.0899, false, undefined, undefined, 429726.0],
  ["★ Karambit | Case Hardened", "Faca", karFade, "BS", 0.7359, false, -3, "1m", 3237.0],
  ["★ Karambit | Case Hardened", "Faca", karFade, "BS", 0.8802, false, -3, undefined, 3285.14],
  ["★ Karambit | Case Hardened", "Faca", karFade, "BS", 0.7323, false, -2, "1m", 3295.29],
  ["★ Karambit | Case Hardened", "Faca", karFade, "BS", 0.8423, false, -2, "1m", 3295.29],
  ["★ Karambit | Case Hardened", "Faca", karFade, "BS", 0.7102, false, -2, "1m", 3295.29],
  ["★ Karambit | Case Hardened", "Faca", karFade, "BS", 0.8348, false, undefined, "15m", 3978.71],
  ["★ Karambit | Case Hardened", "Faca", karFade, "BS", 0.9992, false, undefined, undefined, 4376.03],
  ["★ Karambit | Case Hardened", "Faca", karFade, "BS", 0.5305, false, undefined, undefined, 5055.6],
  // Imagem 3
  ["AK-47 | Fire Serpent", "Rifle", akSerpent, "FN", 0.0678, true, -3, undefined, 25630.12],
  ["AK-47 | Fire Serpent", "Rifle", akSerpent, "FN", 0.0697, true, undefined, undefined, 564964.11],
  ["Sticker | Vox Eminor (Holo) | Katowice 2014", "Adesivo", stickerFox, undefined, undefined, false, undefined, undefined, 130298.99],
  ["M4A4 | Howl", "Rifle", m4Howl, "FN", 0.048, true, undefined, "15m", 187057.2],
  ["★ Faca Borboleta | Gamma Doppler", "Faca", butterfly, "MW", 0.0759, true, -46, "15m", 44938.62],
  ["★ Faca Borboleta | Gamma Doppler", "Faca", butterfly, "MW", 0.073, true, -46, undefined, 45290.24],
  ["AK-47 | Fire Serpent", "Rifle", akSerpent, "FN", 0.0663, false, undefined, "15m", 77548.51],
  ["AK-47 | Fire Serpent", "Rifle", akSerpent, "FN", 0.0391, false, undefined, undefined, 81142.38],
  ["AK-47 | Fire Serpent", "Rifle", akSerpent, "FN", 0.0381, false, undefined, undefined, 98584.2],
  ["★ Karambit | Slaughter", "Faca", karSlaughter, "FN", 0.0618, true, -67, undefined, 25278.0],
  ["★ Faca Borboleta | Gamma Doppler", "Faca", butterfly, "FN", 0.034, false, -51, undefined, 36168.82],
  ["★ Faca Borboleta | Gamma Doppler", "Faca", butterfly, "FN", 0.024, false, -49, undefined, 37911.94],
];

const redline: [number, number, number | undefined, "1m" | "15m"][] = [
  [0.1499, 1521.08, -2, "1m"], [0.1498, 1538.92, -2, "1m"], [0.1395, 1593.02, -2, "1m"],
  [0.1489, 1769.46, undefined, "15m"], [0.1288, 1815.58, undefined, "15m"], [0.1334, 1870.57, undefined, "15m"],
  [0.1497, 1921.13, undefined, "15m"], [0.1485, 2072.54, undefined, "15m"], [0.1179, 2336.24, undefined, "15m"],
  [0.1488, 2708.94, undefined, "15m"], [0.1454, 2780.58, undefined, "15m"], [0.1484, 2873.7, undefined, "15m"],
];
redline.forEach(([f, p, d, del]) => rows.push(["AK-47 | Redline", "Rifle", akRedline, "MW", f, true, d, del, p]));

const mesh: [number, number, boolean][] = [
  [0.3078, 178.51, false], [0.3553, 202.22, true], [0.2852, 226.19, true], [0.379, 252.53, true],
  [0.2233, 252.73, false], [0.1995, 273.0, true], [0.2482, 273.91, false], [0.3541, 292.57, false],
  [0.1538, 292.67, false], [0.3831, 298.03, false], [0.3778, 303.29, false], [0.3753, 306.22, true],
  [0.2378, 348.84, true], [0.327, 353.89, true], [0.3755, 353.89, true], [0.1678, 363.95, true],
  [0.3571, 379.17, false], [0.2759, 404.45, true], [0.2433, 404.45, false], [0.3592, 424.57, true],
  [0.2376, 432.1, false], [0.2481, 435.44, false], [0.2627, 436.5, false], [0.2131, 437.11, false],
];
mesh.forEach(([f, p, fast]) => rows.push(["AK-47 | Slate", "Rifle", akMesh, "FT", f, false, undefined, fast ? "15m" : undefined, p]));

const m4: [number, number, boolean][] = [
  [0.0297, 761.37, true], [0.0282, 866.88, false], [0.0197, 920.07, true], [0.0505, 957.88, true],
  [0.0103, 991.4, false], [0.0209, 1129.17, false], [0.0331, 1238.62, false], [0.0518, 1383.62, false],
  [0.0536, 1547.01, true], [0.033, 1638.67, false], [0.0874, 1685.18, false], [0.0804, 1708.79, false],
];
m4.forEach(([f, p, fast]) => rows.push(["M4A1-S | Printstream", "Rifle", m4Grey, "FN", f, false, undefined, fast ? "15m" : undefined, p]));

export const skins: Skin[] = rows.map(([name, category, image, wear, float, stattrak, discount, delivery, price], i) => ({
  id: `s${i + 1}`, name, category, image, wear, float, stattrak, discount, delivery, price,
}));

export const INSTANT_COUNT = 8;

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
