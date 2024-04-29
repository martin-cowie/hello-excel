export class Subscription {
    constructor(
        readonly topicPath: string,
        readonly topicType: string,
        readonly translation: string,
        readonly bindingId: string
    ) {
        /* empty */
    }

    public static from(data: any): Subscription {
        return new Subscription(
            data.topicPath, 
            data.topicType,
            data.translation,
            data.bindingId);
    }

    public toJSON() {
        return {
            topicPath: this.topicPath,
            topicType: this.topicType,
            translation: this.topicType,
            bindingId: this.bindingId
        }
    }

    public toString(): string {
        return `Subscription(${this.topicPath} → ${this.translation} → ${this.bindingId})`;
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

    public onValueHandler(topic: string, specification: any, newValue: any, oldValue: any): void {
        const topicValue = JSON.stringify(newValue.get(), null, 2);
        const self = this;

        Excel.run(async context => {
            const binding = context.workbook.bindings.getItem(self.bindingId);
            const range = binding.getRange();
            range.load(["address", "cellCount", "values"]);

            try {
                await context.sync();
            } catch (ex: any) {
                console.log(`Caught exception updating ${self.toString()}`);
                if (ex.code === `InvalidBinding` && 
                    ex.name === "RichApi.Error"
                ) {
                    // The binding was removed

                    //TODO: sign the UI to update
                    // row.remove()
                    // self.unsubscribeFrom(subscription, false);
                    // Subscriptions.save(self.subscriptions);
                    return;    
                } else {
                    throw ex;
                }
            }

            range.values =[[topicValue]];
            return context.sync();
        });
    }

}