import {ColorTuple} from "hsluv";

export interface FloatImage {
    data: Array<ColorTuple>,
    height: number,
    width: number,
}

export const imageData2floatImage = (img: ImageData): FloatImage => {
    let data = new Array<ColorTuple>(img.data.length / 4);
    for (let i = 0; i < data.length; i++) {
        data[i] = [
            img.data[4 * i + 0] / 255,
            img.data[4 * i + 1] / 255,
            img.data[4 * i + 2] / 255,
        ];
    }
    return {
        data: data,
        width: img.width,
        height: img.height,
    };
}
export const floatImage2imageData = (img: FloatImage): ImageData => {
    let data = new Uint8ClampedArray(img.data.length * 4);
    for (let i = 0; i < img.data.length; i++) {
        data[4 * i + 0] = 255 * img.data[i][0];
        data[4 * i + 1] = 255 * img.data[i][1];
        data[4 * i + 2] = 255 * img.data[i][2];
        data[4 * i + 3] = 255;
    }
    return new ImageData(
        data,
        img.width,
        img.height,
    );
}


export const convert = (img: FloatImage, func: (tuple: ColorTuple) => ColorTuple): FloatImage => {
    let data = new Array<ColorTuple>(img.data.length);
    for (let i = 0; i < data.length; i++) {
        data[i] = func(img.data[i]);
    }
    return {
        ...img,
        data: data,
    }
}

