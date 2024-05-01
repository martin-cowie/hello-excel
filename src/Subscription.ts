import { TopicSpecification } from "diffusion";
import {Translations} from "./Translations.js";
import {clip, isRectangular} from "./Common.js"

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

    public onValueHandler(topic: string, specification: TopicSpecification, newValue: diffusion.JSON, oldValue: diffusion.JSON): void {

        // This is the translation function
        const cellValueMatrix = Translations.get("To row")!.translate(newValue);

        if (!isRectangular(cellValueMatrix)) {
            console.debug('translation output is not rectangular!');
            //Todo: throw an event
        }
        
        const self = this;
        Excel.run(async context => {
            const binding = context.workbook.bindings.getItem(self.bindingId);
            const range = binding.getRange();
            range.load(["address", "cellCount", "values", "columnCount", "rowCount"]);

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

            range.values = clip(cellValueMatrix, range.rowCount, range.columnCount);
            return context.sync();
        });
    }



}