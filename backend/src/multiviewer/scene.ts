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

    public get scene(): IScene {
        return this.scene_!;
    }

    public addInput(input: IInput) {
        this.scene_?.inputs.push(input);
    }

    public updateInput(input: IInput) {
        const index = this.scene_?.inputs.findIndex(i => i.id === input.id);
        if(index! >= 0) {
            this.scene_!.inputs[index!] = input;
        }
    }

    public removeInput(inputId: number) {
        const index = this.scene_?.inputs.findIndex(i => i.id === inputId);
        if(index! >= 0) {
            this.scene_?.inputs.splice(index!, 1);
        }
    }

    public addOutput(output: IOutput) {
        this.scene_?.outputs.push(output);
    }

    public updateOutput(output: IOutput) {
        const index = this.scene_?.outputs.findIndex(o => o.id === output.id);
        if(index! >= 0) {
            this.scene_!.outputs[index!] = output;
        }
    }

    public removeOutput(outputId: number) {
        const index = this.scene_?.outputs.findIndex(o => o.id === outputId);
        if(index! >= 0) {
            this.scene_?.outputs.splice(index!, 1);
        }
    }    
}