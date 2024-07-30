// IInput
export interface IInput {
    id: number;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

// IDestination
export interface IOutput {
    id: number;
    name: string;
}

// IScene
export interface IScene {
    id: number;
    name: string;
    userId: number;
    launcherId: number;
    width: number;
    height: number;    
    inputs: IInput[];
    outputs: IOutput[];
}

// LayoutScene
export class LayoutScene {
    private launcherUID: number = -1;
    private scene_: IScene | null = null;

    public init(scene: IScene) {
        this.launcherUID = scene.launcherId;
        this.scene_ = scene;
    }

    public deinit() {
        
    }

    public get id() : number {
        return this.scene.id;
    }

    public get launcherId() : number {
        return this.scene.launcherId;
    }

    public get scene(): IScene {
        return this.scene_!;
    }

    public addInput(input: IInput) {
        this.scene_?.inputs.push(input);
    }

    public updateInput(inputIndex: number, input: IInput) {
        this.scene_!.inputs[inputIndex!] = input;
    }

    public removeInput(inputIndex: number) {
        this.scene_?.inputs.splice(inputIndex!, 1);       
    }

    public addOutput(output: IOutput) {
        this.scene_?.outputs.push(output);
    }

    public updateOutput(outputIndex: number, output: IOutput) {      
        this.scene_!.outputs[outputIndex!] = output;    
    }

    public removeOutput(outputIndex: number) {        
        this.scene_?.outputs.splice(outputIndex!, 1);
    }    

    public numInputs() : number {
        return this.scene_? this.scene_.inputs.length : 0;
    }

    public numOutputs() : number {
        return this.scene_? this.scene_.outputs.length : 0;
    }
}