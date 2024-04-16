import type {Session} from "diffusion";
import { Subscription } from "./Subscription.js";
declare const diffusion: any; 

function removeElement<T>(array: T[], elementToRemove: T): T[] {
    const index = array.indexOf(elementToRemove); //TODO: consider more than identity comparison
    if (index > -1) {
        array.splice(index, 1);
    }
    return array;
}

export class Subscriptions {

    constructor(
        private session: Session, 
        private tableElem: HTMLTableElement,
        private subscriptions: Array<Subscription>,
        private nextSubscriptionId: number
    ) {
        if (session == null) {
            throw new Error("session cannot be falsey");
        }
        if (tableElem == null) {
            throw new Error("tableElem cannot be falsey");
        }

        this.subscriptions.forEach(subscription => {
            const row = this.addSubscriptionUIRow(subscription);
            this.doSubscribe(subscription, row);
        });

    }

    static async build(session: Session, tableElem: HTMLTableElement): Promise<Subscriptions> {
        const [subscriptions, nextSubscriptionId] = await Subscriptions.load();
        const result = new Subscriptions(session, tableElem, subscriptions, nextSubscriptionId);

        return result;
    }

    /**
     * Create a new Subscription from a cell to a Diffusion topic path.
     * @param topicPath 
     * @param cell 
     */
    public subscribeTo(topicPath: string, cell: string) {
        console.log(`Subscribing ${topicPath} to ${cell}`);

        // Create a binding for the cell
        const bindingId = `subscription.${this.nextSubscriptionId++}`;
        Excel.run(context => {
            const range = context.workbook.worksheets.getActiveWorksheet().getRange(cell);
            const binding = context.workbook.bindings.add(range, "Range", bindingId);
            return context.sync();
        });

        const subscription = new Subscription(topicPath, bindingId)
        console.log(`Created ${subscription.toString()}`);
        this.subscriptions.push(subscription);

        const row = this.addSubscriptionUIRow(subscription);
        this.doSubscribe(subscription, row);
        Subscriptions.save(this.subscriptions);
    }

    /**
     * Remove the subscription, update Add-in state and optionally clear the affected cell(s).
     * @param subscription 
     * @param updateWorkbook if true the affected cells are cleared
     */
    private unsubscribeFrom(subscription: Subscription, updateWorkbook: boolean = true) {
        console.log(`Unsubscribe from ${subscription.toString()}`);
        removeElement(this.subscriptions, subscription);
        this.session.unsubscribe(subscription.topicPath);

        if (updateWorkbook) {
            Excel.run(context => {
                context.workbook.bindings.getItem(subscription.bindingId).getRange().clear();
                try {
                    return context.sync();
                } catch (ex) {
                    /* do nothing */
                }
                return context.sync();
            });        
        }
    }

    /**
     * Subscribe to the topic, and wire updates to the binding
     */
    private async doSubscribe(subscription: Subscription, row: HTMLTableRowElement) {
        const self = this;

        this.session
            .addStream(subscription.topicPath, diffusion.datatypes.json())
            .on('value', function(topic: string, specification: any, newValue: any, oldValue: any) {
                const topicValue = JSON.stringify(newValue.get(), null, 2);
              

                Excel.run(async context => {
                    const binding = context.workbook.bindings.getItem(subscription.bindingId);
                    const range = binding.getRange();
                    range.load(["address", "cellCount", "values"]);

                    try {
                        await context.sync();
                    } catch (ex: any) {
                        console.log(`Caught exception updating ${subscription.toString()}`);
                        if (ex.code === `InvalidBinding` && 
                            ex.name === "RichApi.Error"
                        ) {
                            // The binding was removed
                            row.remove()
                            self.unsubscribeFrom(subscription, false);
                            Subscriptions.save(self.subscriptions);
                            return;    
                        } else {
                            throw ex;
                        }
                    }

                    range.values =[[topicValue]];
                    return context.sync();
                });

            });

        // Subscribe to the topic
        this.session.select(subscription.topicPath);
    }

    /**
     * Update the UI with a new subscription
     * @param {*} topicPath 
     * @param {*} cell 
     */
    private addSubscriptionUIRow(subscription: Subscription): HTMLTableRowElement {
        // Create a row, and add it to the table
        const row = this.tableElem.insertRow(-1);
        const pathTD = row.insertCell();
        pathTD.innerHTML = subscription.topicPath;

        const cellTD = row.insertCell();
        cellTD.innerHTML = subscription.bindingId;

        const unsubTD = row.insertCell();
        unsubTD.innerHTML = "🔴";
        unsubTD.classList.add("pointAtMe")
        unsubTD.onclick = () => {
            row.remove();
            this.unsubscribeFrom(subscription);
            Subscriptions.save(this.subscriptions);
        }
        return row;
    }

    // Settings keys
    private static KEY = "subscriptions";

    /**
     * Save subscription to the workbook settings
     */
    private static save(subscriptions: Array<Subscription>) {
        Excel.run(async (context) => {
            const settings = context.workbook.settings;
            const saveData = subscriptions.map((subscription) => subscription.toJSON());
            settings.add(this.KEY, saveData);
            await context.sync();
        });        
    }

    /**
     * Load the subscriptions.
     * @returns a tuple of the subscriptions and next subscription number
     */
    private static async load(): Promise<[Array<Subscription>, number]> {
        return await Excel.run(async (context) =>{
            const settings = context.workbook.settings;
            const setting = settings.getItemOrNullObject(this.KEY);
            await context.sync();

            if (setting.isNullObject) {
                console.log(`Found no subscriptions`);
                return [[], 0];
            }

            setting.load("value");
            await context.sync();

            const subscriptions:[Subscription] = setting.value.map((sub: any) => 
                Subscription.from(sub)
            );
            console.log(`Loaded ${subscriptions.map(s => s.toString()).join(", ")}`);

            // TODO: validate bindings

            // Find the next subscription number
            const nextSubNumber = 1 + subscriptions.map(sub => {
                const parts = sub.bindingId.split('.');
                return parseInt(parts[parts.length - 1], 10);
            })
            .reduce((max: number, num: number) => {
                return isNaN(num) ? max : Math.max(max, num);
            }, 0);
    
            return [subscriptions, nextSubNumber];
        });
    }
    
}