"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayoutScene = void 0;
// LayoutScene
class LayoutScene {
    constructor() {
        this.launcherUID = -1;
        this.scene_ = null;
    }
    init(scene) {
        this.launcherUID = scene.launcherId;
        this.scene_ = scene;
    }
    deinit() {
    }
    get id() {
        return this.scene.id;
    }
    get scene() {
        return this.scene_;
    }
    addInput(input) {
        var _a;
        (_a = this.scene_) === null || _a === void 0 ? void 0 : _a.inputs.push(input);
    }
    updateInput(inputIndex, input) {
        this.scene_.inputs[inputIndex] = input;
    }
    removeInput(inputIndex) {
        var _a;
        (_a = this.scene_) === null || _a === void 0 ? void 0 : _a.inputs.splice(inputIndex, 1);
    }
    addOutput(output) {
        var _a;
        (_a = this.scene_) === null || _a === void 0 ? void 0 : _a.outputs.push(output);
    }
    updateOutput(outputIndex, output) {
        this.scene_.outputs[outputIndex] = output;
    }
    removeOutput(outputIndex) {
        var _a;
        (_a = this.scene_) === null || _a === void 0 ? void 0 : _a.outputs.splice(outputIndex, 1);
    }
    numInputs() {
        return this.scene_ ? this.scene_.inputs.length : 0;
    }
    numOutputs() {
        return this.scene_ ? this.scene_.outputs.length : 0;
    }
}
exports.LayoutScene = LayoutScene;
