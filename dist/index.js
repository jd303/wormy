"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assets_1 = require("./assets");
let debug = true;
// Using setTimeout is awful, but serves our rapid migration from Angular code to TSC and Webpack
setTimeout(() => {
    let visualisationController = new assets_1.VisualisationController(debug);
    new assets_1.TextVisualisation(visualisationController, document.querySelector("#canvasText"));
    new assets_1.SnakeVisualisation(visualisationController, document.querySelector("#canvasSnake"));
    visualisationController.start();
    // Setup text
    visualisationController.textLines.forEach((textLine) => {
        let y = textLine.y;
        textLine.portions.forEach((text) => {
            let x = text.xPerc * visualisationController.canvasText.width;
            let textPortion = new assets_1.TextPortion(visualisationController, text.text, new assets_1.SnakeCurvePoint(x, y));
            visualisationController.textPortions.push(textPortion);
        });
    });
}, 1000);
//# sourceMappingURL=index.js.map