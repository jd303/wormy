import {
  VisualisationController,
  TextVisualisation,
  SnakeVisualisation,
  SnakeCurvePoint,
  TextPortion,
} from "./assets";

let debug = true;

// Using setTimeout is awful, but serves our rapid migration from Angular code to TSC and Webpack
setTimeout(() => {
  let visualisationController = new VisualisationController(debug);
  new TextVisualisation(visualisationController, document.querySelector("#canvasText")!);
  new SnakeVisualisation(visualisationController, document.querySelector("#canvasSnake")!);

  visualisationController.start();

  // Setup text
  visualisationController.textLines.forEach((textLine) => {
    let y = textLine.y;

    textLine.portions.forEach((text) => {
      let x = text.xPerc * visualisationController!.canvasText.width;
      let textPortion = new TextPortion(
        visualisationController!,
        text.text,
        new SnakeCurvePoint(x, y)
      );
      visualisationController!.textPortions.push(textPortion);
    });
  });
}, 1000);
