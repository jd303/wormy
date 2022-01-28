"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnakeCurvePoint = exports.TextPortion = exports.GradientCircle = exports.BorderedCircle = exports.Circle = exports.SnakeVisualisation = exports.TextVisualisation = exports.VisualisationController = void 0;
/**
 * Class: VisualisationController
 * Contains references to the two canvases and contexts for single-point-of-truth handling,
 * Keeps code DRY.
 */
class VisualisationController {
    constructor(debug) {
        // Main
        this.isInside = false;
        this.circles = [];
        this.textPortions = [];
        // Events and timings
        this.manualSnakeReset = true;
        this.circleLifetime = 1000;
        this.lastDrawPoint = new SnakeCurvePoint(0, 0);
        this.lastMousePoint = new SnakeCurvePoint(0, 0);
        this.currentMousePoint = new SnakeCurvePoint(0, 0);
        // Customisations
        this.circleDrawMinGap = 30;
        this.circleDrawFill = true;
        this.circleDrawFillResolution = 30;
        this.maxPoints = 400; // Limits gradient circles drawing too many fills
        // Main Properties
        this.debug = true;
        // Define Text
        this.fontSizePx = 150;
        this.textLines = [
            // BUILDING
            {
                y: window.innerHeight * 0.33 - this.fontSizePx,
                portions: [
                    { xPerc: 0.033, text: "W E" },
                    { xPerc: 0.27, text: "G E T" },
                    { xPerc: 0.55, text: "S T R" },
                ],
            },
            // BETTER
            {
                y: window.innerHeight * 0.33,
                portions: [
                    { xPerc: 0.44, text: "O" },
                    { xPerc: 0.55, text: "N G" },
                    { xPerc: 0.75, text: "E R" },
                ],
            },
            // FUTURES
            {
                y: window.innerHeight * 0.33 + this.fontSizePx,
                portions: [
                    { xPerc: 0.22, text: "D A" },
                    { xPerc: 0.41, text: "I L" },
                    { xPerc: 0.56, text: "Y" },
                ],
            },
        ];
        // Styles
        this.currentCircleStyle = 0;
        this.circleStyle = BorderedCircle;
        this.fontSize = 150;
        this.fontStyle = `${this.fontSize}px "Open Sans Condensed"`;
        this.textFillStyleClipOutside = "rgba(241, 77, 99, 1)";
        this.textFillStyleSnakeOutside = "rgba(255, 255, 255, 1)";
        this.textFillStyleClipInside = "rgba(241, 77, 99, 1)";
        this.textFillStyleSnakeInside = "rgba(0, 0, 0, 1)";
        if (debug)
            this.performanceTester = new PerformanceTester(this);
    }
    start() {
        this.setEventListeners();
        this.setIsInside(false);
        window.requestAnimationFrame(this.animationFrame.bind(this));
    }
    setIsInside(res) {
        this.isInside = res;
        if (this.isInside) {
            this.circleStyle = BorderedCircle;
            this.currentCircleStyle = 0;
            this.circleDrawMinGap = 30;
            this.circleDrawFill = true;
            this.circleDrawFillResolution = 30;
        }
        else {
            this.circleStyle = GradientCircle;
            this.currentCircleStyle = 1;
            this.circleDrawMinGap = 0;
            this.circleDrawFill = true;
            this.circleDrawFillResolution = 3;
        }
        this.circles = [];
    }
    registerSnake(canvas, ctx) {
        this.canvasSnake = canvas;
        this.ctxSnake = ctx;
        let canvasPosition = this.canvasSnake.getBoundingClientRect();
        this.canvasPagePositionSnake = new SnakeCurvePoint(canvasPosition.x, canvasPosition.y);
    }
    registerText(canvas, ctx) {
        this.canvasText = canvas;
        this.ctxText = ctx;
        let canvasPosition = this.canvasText.getBoundingClientRect();
        this.canvasPagePositionText = new SnakeCurvePoint(canvasPosition.x, canvasPosition.y);
    }
    prepareCanvas(canvas) {
        let canvasWorking = canvas;
        canvasWorking.width = document.body.clientWidth;
        canvasWorking.height = document.body.clientHeight;
        return canvasWorking;
    }
    prepareCanvasContext(canvas, drawMode) {
        const ctx = canvas.getContext("2d");
        if (!ctx || !(ctx instanceof CanvasRenderingContext2D)) {
            throw new Error("Failed to get 2D context Text");
        }
        ctx.globalCompositeOperation = drawMode;
        ctx.font = this.fontStyle;
        return ctx;
    }
    ////////////////////////////////////
    // Setup Event Listeners (consider replacing this with Angularised events)
    setEventListeners() {
        var _a;
        let scope = this;
        (_a = document.querySelector("#switch")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", (event) => {
            this.setIsInside(!this.isInside);
        });
        // Reset on mouse leave
        document.body.addEventListener("mouseleave", (event) => {
            this.manualSnakeReset = true;
        });
        // Update draw on mouse move
        document.body.addEventListener("mousemove", (event) => {
            // Calculate mouse point
            const eventPoint = new SnakeCurvePoint(event.pageX, event.pageY); //.adjustForCanvas(this.canvasPagePositionSnake);
            scope.lastMousePoint = scope.currentMousePoint;
            scope.currentMousePoint = eventPoint;
            let distanceSinceLastDraw = eventPoint.distanceToPoint(scope.lastDrawPoint);
            // Reset for massive distances, or when leaving
            if (distanceSinceLastDraw > 1000 || this.manualSnakeReset) {
                distanceSinceLastDraw = 0;
                scope.lastMousePoint = eventPoint;
                this.manualSnakeReset = false;
            }
            // If we have exceeded the draw minimum gap
            if (distanceSinceLastDraw >= scope.circleDrawMinGap) {
                if (scope.circleDrawFill) {
                    const distanceSinceLastMouse = scope.lastMousePoint.distanceToPoint(scope.currentMousePoint);
                    const steps = distanceSinceLastMouse / scope.circleDrawFillResolution;
                    if (steps >= 2) {
                        for (let i = 0; i <= 1; i += 1 / steps) {
                            let padPoint = scope.lastDrawPoint.pointBetween(scope.currentMousePoint, i);
                            addCircle(this, padPoint);
                        }
                    }
                    else {
                        addCircle(this, eventPoint);
                    }
                }
                else {
                    addCircle(this, eventPoint);
                }
                scope.lastDrawPoint = eventPoint;
            }
            function addCircle(visualisation, point) {
                new scope.circleStyle(visualisation, point);
            }
        });
    }
    // Animation Frame Event Fire
    animationFrame() {
        var _a;
        // Performance Test
        (_a = this.performanceTester) === null || _a === void 0 ? void 0 : _a.test();
        // Main Canvas
        this.snakeVisualisation.draw();
        // Clipped Text Canvas
        this.textVisualisation.draw();
        window.requestAnimationFrame(this.animationFrame.bind(this));
    }
}
exports.VisualisationController = VisualisationController;
/**
 * Class: TextVisualisation
 */
class TextVisualisation {
    constructor(vis, canvas) {
        this.vis = vis;
        vis.registerText(this.vis.prepareCanvas(canvas), this.vis.prepareCanvasContext(canvas, "destination-over"));
        vis.textVisualisation = this;
    }
    draw() {
        // Save the state
        this.vis.ctxText.save();
        // Setup clipping based on arcs
        this.vis.ctxText.clearRect(0, 0, this.vis.canvasText.width, this.vis.canvasText.height);
        this.vis.ctxText.beginPath();
        let path = new Path2D();
        this.vis.circles.forEach((circle) => {
            circle.addClipPath(path);
        });
        this.vis.ctxText.clip(path);
        // Draw text components
        this.vis.ctxText.fillStyle = this.vis.isInside
            ? this.vis.textFillStyleClipInside
            : this.vis.textFillStyleClipOutside;
        this.vis.textPortions.forEach((text) => text.draw(this.vis.ctxText));
        // And finally, restore
        this.vis.ctxText.restore();
    }
}
exports.TextVisualisation = TextVisualisation;
// CLASS: SnakeVisualisation
// Controls the Snake rendering
class SnakeVisualisation {
    ////////////////////////////////////
    // CONSTRUCTOR
    constructor(vis, canvas) {
        this.vis = vis;
        vis.registerSnake(this.vis.prepareCanvas(canvas), this.vis.prepareCanvasContext(canvas, "destination-over"));
        vis.snakeVisualisation = this;
    }
    // Draw circles and text
    draw() {
        this.vis.ctxSnake.clearRect(0, 0, this.vis.canvasSnake.width, this.vis.canvasSnake.height);
        this.vis.circles.forEach((circle) => {
            circle.draw(this.vis.ctxSnake, this.vis);
        });
        // And draw text portions
        this.vis.ctxSnake.fillStyle = this.vis.isInside
            ? this.vis.textFillStyleSnakeInside
            : this.vis.textFillStyleSnakeOutside;
        this.vis.textPortions.forEach((text) => text.draw(this.vis.ctxSnake));
    }
}
exports.SnakeVisualisation = SnakeVisualisation;
class PerformanceTester {
    constructor(visualisationController) {
        this.mouseMoves = {
            0: 0,
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            6: 0,
            7: 0,
            8: 0,
            9: 0,
        };
        this.lastTestSecond = 0;
        this.shouldReset = false;
        this.vis = visualisationController;
    }
    // Test and respond
    test() {
        let second = Math.floor(parseInt(new Date().getTime().toString().substr(-4)) / 1000);
        this.mouseMoves[second] += 1;
        if (second != this.lastTestSecond) {
            console.log(`Perf ${this.mouseMoves[second - 1]} frames, ${this.vis.circles.length}`);
            this.lastTestSecond = second;
        }
        if (second === 0 && this.shouldReset) {
            this.reset();
            this.shouldReset = false;
        }
        if (second >= 9) {
            this.shouldReset = true;
        }
    }
    // Reset every 10 seconds
    reset() {
        Object.keys(this.mouseMoves).forEach((key) => {
            this.mouseMoves[key] = 0;
        });
    }
}
// Circle Class
class Circle {
    constructor(visualisationCon, point) {
        // Default properties
        this.birth = 0;
        this.x = 0;
        this.y = 0;
        this.distanceFromLastMouse = new SnakeCurvePoint(0, 0);
        // Style properties
        this.circleRadius = 75;
        this.circleBorder = 10;
        this.opacity = 1;
        if (visualisationCon.currentMousePoint) {
            this.birth = new Date().getTime();
            this.x = point.x;
            this.y = point.y;
            this.distanceFromLastMouse = new SnakeCurvePoint(visualisationCon.currentMousePoint.x - visualisationCon.lastDrawPoint.x, visualisationCon.currentMousePoint.y - visualisationCon.lastDrawPoint.y);
        }
        // Set Opacity based on y pos (simple, just percentage of canvas)
        let percentageStart = 0.8;
        let percentageCutoff = 0.9;
        let yPercentage = this.y / (visualisationCon.canvasText.height * percentageCutoff);
        if (yPercentage > percentageStart) {
            let remainder = 1 - percentageCutoff;
            let innerPercentage = (yPercentage - percentageCutoff) / remainder;
            this.opacity = 1 - innerPercentage;
        }
        visualisationCon.circles.unshift(this);
        if (visualisationCon.circles.length > visualisationCon.maxPoints) {
            visualisationCon.circles.pop();
        }
    }
    draw(ctx, visualisationCon) { }
    addClipPath(path) {
        let clipPath = new Path2D();
        clipPath.arc(this.x, this.y, this.circleRadius, 0, 2 * Math.PI, false);
        path.addPath(clipPath);
    }
}
exports.Circle = Circle;
class BorderedCircle extends Circle {
    draw(ctx, visualisationCon) {
        if (new Date().getTime() - this.birth < visualisationCon.circleLifetime) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.circleRadius, 0, 2 * Math.PI, false);
            ctx.fillStyle = `rgba(230, 230, 230, ${this.opacity})`;
            ctx.fill();
            ctx.lineWidth = 10;
            ctx.strokeStyle = `rgba(241, 77, 99, ${this.opacity})`;
            ctx.stroke();
        }
        else {
            visualisationCon.circles = visualisationCon.circles.filter((storedCircle) => storedCircle != this);
        }
    }
}
exports.BorderedCircle = BorderedCircle;
class GradientCircle extends Circle {
    constructor() {
        super(...arguments);
        this.opacityAdjust = -0.3;
        this.gradientStop1 = `rgba(231, 29, 54, ${this.opacity + this.opacityAdjust})`;
        this.gradientStop2 = `rgba(229, 255, 94, ${this.opacity + this.opacityAdjust})`;
    }
    draw(ctx, visualisationCon) {
        if (new Date().getTime() - this.birth < visualisationCon.circleLifetime) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.circleRadius, 0, 2 * Math.PI, false);
            // Draw a gradient which spreads further than bounds, so that we can adjust the gradient stops
            const radPart = this.circleRadius * 1.5;
            var gradient = ctx.createLinearGradient(
            /* x1 */ this.x - radPart, // Adjusted by speed mouse moving down
            /* y1 */ this.y - radPart, 
            /* x2 */ this.x + radPart, // Adjusted by speed mouse moving down
            /* y2 */ this.y + radPart);
            // Adjust the gradient based on mouse speed and y direction
            gradient.addColorStop(0.25, this.gradientStop1);
            gradient.addColorStop(0.7, this.gradientStop2);
            ctx.arc(this.x, this.y, this.circleRadius, 0, 2 * Math.PI, false);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
        else {
            visualisationCon.circles = visualisationCon.circles.filter((storedCircle) => storedCircle != this);
        }
    }
}
exports.GradientCircle = GradientCircle;
class TextPortion {
    constructor(visualisationCon, text, point) {
        this.text = "";
        this.x = 0;
        this.y = 0;
        this.fontSize = 0;
        this.font = "";
        this.vis = visualisationCon;
        this.text = text;
        this.x = point.x;
        this.y = point.y;
        this.fontSize = visualisationCon.fontSize;
    }
    draw(ctx) {
        ctx.fillText(this.text, this.x, this.y + this.vis.fontSize);
    }
}
exports.TextPortion = TextPortion;
class SnakeCurvePoint {
    constructor(x, y, expires) {
        this.x = x;
        this.y = y;
        if (expires)
            this.expires = expires;
    }
    get asArray() {
        return [this.x, this.y];
    }
    get asObject() {
        return { x: this.x, y: this.y };
    }
    fromArray(valuesArr) {
        this.x = valuesArr[0];
        this.y = valuesArr[1];
        return this;
    }
    setValues(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    adjustForCanvas(canvasPosition) {
        this.x = this.x - canvasPosition.x;
        this.y = this.y - canvasPosition.y;
        return this;
    }
    distanceToPoint(comparePoint) {
        var a = this.x - comparePoint.x;
        var b = this.y - comparePoint.y;
        return Math.sqrt(a * a + b * b);
    }
    distanceToPointY(comparePoint) {
        return this.y - comparePoint.y;
    }
    pointBetween(comparePoint, percent) {
        return new SnakeCurvePoint(this.x + (comparePoint.x - this.x) * percent, this.y + (comparePoint.y - this.y) * percent);
    }
}
exports.SnakeCurvePoint = SnakeCurvePoint;
//# sourceMappingURL=assets.js.map