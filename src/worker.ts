import * as Image from './image'
import * as Comlink from 'comlink';
import * as Hsluv from 'hsluv'
import * as Rose from './rose'

export interface WorkerApi {
    processImage(
        img: ImageData,
        numPetal: number,
        setW: (img: ImageData) => void,
        setH: (img: ImageData) => void,
        setC: (img: ImageData) => void,
        setP: (arr: Array<number>) => void,
    ): void;
}

const api: WorkerApi = {
    processImage(
        img: ImageData,
        numPetal: number,
        setW: (img: ImageData) => void,
        setH: (img: ImageData) => void,
        setC: (img: ImageData) => void,
        setP: (arr: Array<number>) => void,
    ): void {
        const rgb = Image.imageData2floatImage(img);
        const lch = Image.convert(rgb, Hsluv.rgbToLch);
        setP(Rose.roseData(lch, numPetal));
        setW(Image.floatImage2imageData(Rose.visWeight(lch)));
        setC(Image.floatImage2imageData(Rose.visWeightedHue(lch)));
        const hsluv = Image.convert(lch, Hsluv.lchToHsluv);
        setH(Image.floatImage2imageData(Rose.visHue(hsluv)));
    }
};

Comlink.expose(api);