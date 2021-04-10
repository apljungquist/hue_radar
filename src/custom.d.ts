declare module 'worker-loader!*' {
  // This may be inaccurate but it allows the app to compile and types are declared when calling wrap anyway.
  class WebpackWorker extends Worker {
    constructor();
  }
  export = WebpackWorker;
}