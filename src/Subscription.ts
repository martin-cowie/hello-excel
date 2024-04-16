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
    

    /**
     * @returns true if this Subscription holds a valid binding
     */
    public async validateBinding(): Promise<boolean> {
        return await Excel.run(async (context) => {
            var binding = context.workbook.bindings.getItemOrNullObject(this.bindingId);
            binding.load('id');
            await context.sync();
    
            return !binding.isNullObject;
        })
    }

}