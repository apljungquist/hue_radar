/* eslint-disable import/no-webpack-loader-syntax */
import React, {useEffect, useRef, useState} from 'react';
import './App.scss';
import Chart from 'chart.js';
import * as bs from "react-bootstrap";
import {ColorTuple, hsluvToRgb} from "hsluv";
import Worker from 'worker-loader!./worker';
import {WorkerApi} from './worker';
import * as Comlink from 'comlink';

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

interface RoseProps {
    areas: Array<number> | number,
}

class HueRoseChart extends React.Component<RoseProps, {}> {
    private ref: React.RefObject<HTMLCanvasElement>;
    private obj: Chart | null;

    constructor(props: RoseProps) {
        super(props);
        this.ref = React.createRef();
        this.obj = null;
    }

    data() {
        const areas = this.props.areas instanceof Array ? this.props.areas : Array.from({length: 12}, (_, i) => i + 1);
        const numPetal = areas.length;
        const hsluvColors: Array<ColorTuple> = Array.from({length: numPetal}, (_, i) => [360 * i / numPetal, 100, 65]);
        const csvColors = Array.from(hsluvColors, (hsluv, _) => {
            const rgb = hsluvToRgb(hsluv);
            const r = Math.round(rgb[0] * 255);
            const g = Math.round(rgb[1] * 255);
            const b = Math.round(rgb[2] * 255);
            return `rgba(${r}, ${g}, ${b}, 1)`;
        });
        const heights = Array.from(areas, (a, _) => Math.sqrt(a));
        return {
            datasets: [{
                data: Array.from(heights, (v, _) => Math.round(1000 * v) / 1000),
                backgroundColor: csvColors,
                borderColor: csvColors,
                borderWidth: 1,

            }],
            labels: Array.from({length: numPetal}, (_, i) => Math.round(i / numPetal * 360)),
        };
    }

    componentDidUpdate() {
        console.log("update");
        if (this.obj) {
            this.obj.data = this.data();
            this.obj.update();
        }
    }

    componentDidMount() {
        console.log("mount");
        this.obj = new Chart(this.ref.current!, {
                data: this.data(),
                type: 'polarArea',
                options: {
                    animation: {
                        duration: 0
                    },
                    legend: {
                        display: false,
                    },
                    scale: {
                        display: false,
                    },
                    maintainAspectRatio: true,
                    responsive: true,
                },

            }
        );
    }

    render() {
        console.log("render");
        return <canvas ref={this.ref}/>;
    }
}

const imageFromSource = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.src = src;
        img.onload = (e: Event) => {
            resolve(img)
        }
    });
}

function App() {
    const numPetal = 20;
    const [file, setFile] = useState(fallbackURL);
    const [w, setW] = useState<ImageData | null>(null);
    const [h, setH] = useState<ImageData | null>(null);
    const [c, setC] = useState<ImageData | null>(null);
    const [p, setP] = useState<Array<number> | number>(numPetal);

    useEffect(() => {
        imageFromSource(file).then((img) => {
            const worker = new Worker();
            const obj = Comlink.wrap<WorkerApi>(worker);
            obj.processImage(
                // transfer not working because ImageData.data.buffer is resolved to ArrayBufferLike
                imageData(img),
                numPetal,
                Comlink.proxy(setW),
                Comlink.proxy(setH),
                Comlink.proxy(setC),
                Comlink.proxy(setP),
            );
        })
    }, [file])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            // TODO: Cancel worker?
            setFile(URL.createObjectURL(e.target.files[0]));
        }
    };

    return (
        <div className="App">
            <bs.Container>
                <bs.Row className="primary">
                    <bs.Col>
                        <bs.Image src={file} fluid={true}/>
                        {/*{img ? <Canvas img={img}/> : null}*/}
                    </bs.Col>
                    <bs.Col>
                        <HueRoseChart areas={p}/>
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
                            {w ? <Canvas img={w}/> : null}
                            <bs.Figure.Caption>
                                The <b>chroma</b> is used to give more weight to some pixels than others
                            </bs.Figure.Caption>
                        </bs.Figure>
                    </bs.Col>
                    <bs.Col>
                        <bs.Figure>
                            {h ? <Canvas img={h}/> : null}
                            <bs.Figure.Caption>
                                The <b>hue</b> is not always obvious from the image.
                            </bs.Figure.Caption>
                        </bs.Figure>
                    </bs.Col>
                    <bs.Col>
                        <bs.Figure>
                            {c ? <Canvas img={c}/> : null}
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
