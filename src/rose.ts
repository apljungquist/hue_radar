import {ColorTuple, hsluvToRgb, lchToRgb} from "hsluv";
import {convert, FloatImage} from "./image";

export const visWeight = (lch: FloatImage): FloatImage => {
    let data = new Array<ColorTuple>(lch.data.length);
    let max = 0;
    for (let i = 0; i < data.length; i++) {
        max = Math.max(max, lch.data[i][1])
    }

    for (let i = 0; i < data.length; i++) {
        data[i] = [
            lch.data[i][1] / max,
            lch.data[i][1] / max,
            lch.data[i][1] / max,
        ]
    }
    return {...lch, data: data}
}
export const visHue = (hsluv: FloatImage): FloatImage => {
    let data = new Array<ColorTuple>(hsluv.data.length);
    for (let i = 0; i < data.length; i++) {
        data[i] = [
            hsluv.data[i][0],
            100,
            50,
        ];
    }
    return convert({...hsluv, data: data}, hsluvToRgb);
}
export const visWeightedHue = (lch: FloatImage): FloatImage => {
    let data = new Array<ColorTuple>(lch.data.length);
    let max = 0;
    for (let i = 0; i < data.length; i++) {
        max = Math.max(max, lch.data[i][1])
    }
    for (let i = 0; i < data.length; i++) {
        data[i] = [
            65,
            lch.data[i][1],
            lch.data[i][2],
        ];
    }
    return convert({...lch, data: data}, lchToRgb);
}
export const roseData = (lch: FloatImage, numPetal: number): Array<number> => {
    let areas = new Array<number>(numPetal).fill(0);
    for (let i = 0; i < lch.data.length; i++) {
        const petalNum = Math.round(lch.data[i][2]/360 * (numPetal - 1));
        // const petalNum = Math.round(hsluv.data[i][0] / 360 * (numPetal - 1));
        const area = lch.data[i][1];
        areas[petalNum] += area;
    }
    return areas;
}