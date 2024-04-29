import {TopicType, type Session} from "diffusion";
import { Subscription } from "./Subscription.js";
declare const diffusion: any; 

export class Subscriptions {

    constructor(
        private session: Session, 
        private tableElem: HTMLTableElement,
        private pathInput: HTMLInputElement,
        private typeInput: HTMLOutputElement,
        private translationFunctionMenu: HTMLSelectElement,
        private subscriptions: Array<Subscription>,
        private nextSubscriptionId: number
    ) {
        requireNonFalsey(session, "session");
        requireNonFalsey(tableElem, "tableElem");
        requireNonFalsey(pathInput, "pathInput");
        requireNonFalsey(typeInput, "typeInput");
        requireNonFalsey(translationFunctionMenu, "translationFunctionMenu");

        this.subscriptions.forEach(subscription => {
            const row = this.addSubscriptionUIRow(subscription);
            this.doSubscribe(subscription, row);
        });

    }

    static async build(session: Session, 
        tableElem: HTMLTableElement, 
        pathInput: HTMLInputElement, 
        typeInput: HTMLOutputElement,
        translationFunctionMenu: HTMLSelectElement
    ): Promise<Subscriptions> {
        const [subscriptions, nextSubscriptionId] = await Subscriptions.load();
        const result = new Subscriptions(session, tableElem, pathInput, typeInput, translationFunctionMenu, subscriptions, nextSubscriptionId);

        return result;
    }

    /**
     * Create a new Subscription from a cell to a Diffusion topic path.
     * @param topicPath 
     * @param topicType 
     * @param translation
     * @param cell 
     */
    public subscribeTo(topicPath: string, topicType: string, translation: string, cell: string) {
        console.log(`Subscribing ${topicPath} to ${cell}`);

        // Create a binding for the cell
        const bindingId = `subscription.${this.nextSubscriptionId++}`;
        Excel.run(context => {
            const range = context.workbook.worksheets.getActiveWorksheet().getRange(cell);
            const binding = context.workbook.bindings.add(range, "Range", bindingId);
            return context.sync();
        });

        const subscription = new Subscription(topicPath, topicType, translation, bindingId)
        console.log(`Created ${subscription.toString()}`);
        this.subscriptions.push(subscription);

        const row = this.addSubscriptionUIRow(subscription);
        this.doSubscribe(subscription, row);
        Subscriptions.save(this.subscriptions);
    }

    /**
     * @throws Error if the path is not a Path selector
     */
    public async validatePath() {
        console.debug("validatePath");
        // Check the selector is a path selector - 
        // TODO: feedback parsing exception to the UI
        const selector = diffusion.selectors.parse(this.pathInput.value);
        if (selector.type != diffusion.Type.PATH) {
            throw new Error('Can currently handle only Path selector')
        }

        // Fetch the topic, assert it's there. 
        const fetchResult = await this.session.fetchRequest()
            .withValues(diffusion.datatypes.any())
            .fetch(selector);

        console.debug(`Fetched ${fetchResult.size()} topics`);
        if (fetchResult.isEmpty()) {
            throw new Error(`Selector ${selector.toString} matches no topics`);
        }

        // Gather the type - display that in the form
        const firstTopic = fetchResult.results()[0];
        const topicTypeName = getEnumKeyByEnumValue(diffusion.topics.TopicType, firstTopic.type());
        if (typeof topicTypeName === "string") {
            this.typeInput.value = "" + topicTypeName;            
        }
        
        // Consider the range of applicable translation functions
        if (firstTopic.type() === diffusion.topics.TopicType.JSON) {
            this.translationFunctionMenu.innerHTML = "";
            const jsonTranslations = [
                {text: "Identity", value: "identity"}, // TODO: needs proper structuring
                {text: "As row", value: "as-row"},
                {text: "As column", value: "as-column"}
            ];
            jsonTranslations.forEach(item => {
                const elem = document.createElement('option');
                elem.value = item.value;
                elem.textContent = item.text;
                this.translationFunctionMenu.add(elem);
            });
            this.translationFunctionMenu.disabled = false;
        }
    }

    public validateForm(): void {
        console.log('validateForm');
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
        this.session
            .addStream(subscription.topicPath, diffusion.datatypes.json())
            .on('value', subscription.onValueHandler.bind(subscription))

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

            const subscriptions:[Subscription] = setting.value
                .map((sub: any) => Subscription.from(sub))
                .filter((sub: Subscription) => sub.validateBinding());

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

function removeElement<T>(array: T[], elementToRemove: T): T[] {
    const index = array.indexOf(elementToRemove); //TODO: consider more than identity comparison
    if (index > -1) {
        array.splice(index, 1);
    }
    return array;
}

/**
 * Maps an enum invariant to it's key
 * @param myEnum 
 * @param enumValue 
 * @returns the enum key, or null
 */
function getEnumKeyByEnumValue<T extends Record<string, any>>(myEnum: T, enumValue: any): keyof T | null {
    const result = Object.keys(myEnum).find(x => myEnum[x] === enumValue);
    return result ? result as keyof T : null;
}

function requireNonFalsey(value: any, name: string): typeof value {
    if (value == null) {
        throw new Error(`${name} cannot be null or undefined`);
    }
    return value
}
