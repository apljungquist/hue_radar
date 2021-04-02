import React, {useEffect, useRef, useState} from 'react';
import './App.scss';
import Chart from 'chart.js';

import * as bs from "react-bootstrap";
import {convert, floatImage2imageData, imageData2floatImage} from "./image";
import {ColorTuple, hsluvToRgb, rgbToHsluv, rgbToLch} from "hsluv";
import {roseData, visHue, visWeight, visWeightedHue} from "./rose";

const fallbackURL = process.env.PUBLIC_URL + '/mm5a7753.jpg';

const Canvas = (props: { img: ImageData }) => {
    const img = props.img;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;
        canvas.width = img.width;
        canvas.height = img.height;
        context.putImageData(img, 0, 0);
    })
    return <canvas ref={canvasRef}/>
}

const imageData = (img: HTMLImageElement) => {
    const scale = Math.max(1, img.width * img.height / 5e5);
    const width = Math.floor(img.width / scale);
    const height = Math.floor(img.height / scale);

    let cvs = document.createElement('canvas');
    let ctx = cvs.getContext('2d')!;
    cvs.width = width;
    cvs.height = height;
    ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
    return ctx.getImageData(0, 0, cvs.width, cvs.height);
}

const HueRosePlot = (props: { areas: Array<number>, height: number }) => {
    const numPetal = props.areas.length;
    const hsluvColors: Array<ColorTuple> = Array.from({length: numPetal}, (_, i) => [360 * i / numPetal, 100, 65]);
    const csvColors = Array.from(hsluvColors, (hsluv, _) => {
        const rgb = hsluvToRgb(hsluv);
        const r = Math.round(rgb[0] * 255);
        const g = Math.round(rgb[1] * 255);
        const b = Math.round(rgb[2] * 255);
        return `rgba(${r}, ${g}, ${b}, 1)`;
    });
    const heights = Array.from(props.areas, (a, _) => Math.sqrt(a));
    const data = {
        datasets: [{
            data: Array.from(heights, (v, _) => Math.round(1000 * v) / 1000),
            backgroundColor: csvColors,
            borderColor: csvColors,
            borderWidth: 1,

        }],
        labels: Array.from({length: numPetal}, (_, i) => Math.round(i / numPetal * 360)),
    };
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;
        new Chart(
            context,
            {
                data: data,
                type: 'polarArea',
                options: {
                    layout: {
                        padding: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0
                        }
                    },
                    legend: {
                        display: false,
                    },
                    scale: {
                        display: false,
                    },
                    maintainAspectRatio: false
                },

            }
        );
    })
    return <canvas ref={canvasRef}/>
}

function App() {
    const [file, setFile] = useState(fallbackURL);
    const [ready, setReady] = useState(false);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setReady(false);
            setFile(URL.createObjectURL(e.target.files[0]));
        }
    };
    const handleLoad = (e: Event) => {
        setReady(true);
    };

    let img = new Image();
    img.src = file;
    img.onload = handleLoad;

    const rgb = ready ? imageData2floatImage(imageData(img)) : null;
    const lch = rgb ? convert(rgb, rgbToLch) : null;
    const hsluv = rgb ? convert(rgb, rgbToHsluv) : null;

    return (
        <div className="App">
            <bs.Container>
                <bs.Row className="primary">
                    <bs.Col>
                        <bs.Image src={file} fluid={true}/>
                    </bs.Col>
                    <bs.Col>
                        {(lch) ? <HueRosePlot areas={roseData(lch, 20)} height={img.height}/> : null}
                    </bs.Col>
                </bs.Row>
                <bs.Row className="align-items-center">
                    <bs.Col>
                        <bs.Form.File
                            custom={true}
                            label="Analyze another image"
                            onChange={handleChange}
                        />
                    </bs.Col>
                </bs.Row>
                <bs.Row className={"secondary"}>
                    <bs.Col>
                        <bs.Figure>
                            {lch ? <Canvas img={floatImage2imageData(visWeight(lch))}/> : null}
                            <bs.Figure.Caption>
                                The <b>chroma</b> is used to give more weight to some pixels than others
                            </bs.Figure.Caption>
                        </bs.Figure>
                    </bs.Col>
                    <bs.Col>
                        <bs.Figure>
                            {hsluv ? <Canvas img={floatImage2imageData(visHue(hsluv))}/> : null}
                            <bs.Figure.Caption>
                                The <b>hue</b> is not always obvious from the image.
                            </bs.Figure.Caption>
                        </bs.Figure>
                    </bs.Col>
                    <bs.Col>
                        <bs.Figure>
                            {(lch) ? <Canvas img={floatImage2imageData(visWeightedHue(lch))}/> : null}
                            <bs.Figure.Caption>
                                What the algorithm <em>"sees"</em>.
                            </bs.Figure.Caption>
                        </bs.Figure>
                    </bs.Col>
                </bs.Row>
            </bs.Container>
        </div>
    );
}

export default App;
