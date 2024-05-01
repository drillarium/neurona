// IComponent
export interface IComponent {
    uid: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

// IDestination
export interface IDestination {
    uid: string;
}

// ILayout
export interface ILayout {
    uid: string;
    width: number;
    height: number;
    components: IComponent[];
    destinations: IDestination[];
}

// MultiviewerScene
export class MultiviewerScene {
    private launcherUID: string = "";
    private layout_: ILayout | null = null;

    public init(launcherUID: string, layout: ILayout) {
        this.launcherUID = launcherUID;
        this.layout_ = layout;
    }

    public get uid() : string {
        return this.layout? this.layout.uid : "";
    }

    public get layout(): ILayout {
        return this.layout_!;
    }

    public addComponent(component: IComponent) {
        this.layout_?.components.push(component);
    }

    public updateComponent(component: IComponent) {
        const index = this.layout_?.components.findIndex(c => c.uid === component.uid);
        if(index! >= 0) {
            this.layout_!.components[index!] = component;
        }
    }

    public removeComponent(componentUID: string) {
        const index = this.layout_?.components.findIndex(c => c.uid === componentUID);
        if(index! >= 0) {
            this.layout_?.components.splice(index!, 1);
        }
    }

    public addDestination(destination: IDestination) {
        this.layout_?.destinations.push(destination);
    }

    public updateDestination(destination: IDestination) {
        const index = this.layout_?.destinations.findIndex(c => c.uid === destination.uid);
        if(index! >= 0) {
            this.layout_!.destinations[index!] = destination;
        }
    }

    public removeDestination(destinationUID: string) {
        const index = this.layout_?.destinations.findIndex(d => d.uid === destinationUID);
        if(index! >= 0) {
            this.layout_?.destinations.splice(index!, 1);
        }
    }    
}