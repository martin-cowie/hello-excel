export class Subscription {
    constructor(
        readonly topicPath: string,
        readonly bindingId: string
    ) {

    }

    public static from(data: any): Subscription {
        return new Subscription(
            data.topicPath, 
            data.bindingId);
    }

    public toJSON() {
        return {
            topicPath: this.topicPath,
            bindingId: this.bindingId
        }
    }

    public toString(): string {
        return `Subscription(${this.topicPath} → ${this.bindingId})`;
    }

}