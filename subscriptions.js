export class Subscriptions {

    constructor(session, tableElem) {
        if (session == null) {
            throw new Error("session cannot be falsey");
        }
        if (tableElem == null) {
            throw new Error("tableElem cannot be falsey");
        }
        this.session = session;
        this.tableElem = tableElem;

        this.#load()
    }

    subscribeTo(topicPath, cell) {
        console.log(`Subscribing ${topicPath} to ${cell}`);

        this.#doSubscribe(topicPath, cell);

        this.#addSubscriptionUIRow(topicPath, cell);

        this.#save(topicPath, cell);
    }

    #unsubscribeFrom(topicPath, cell) {
        console.log(`Unsubscribe from ${topicPath}, ${cell}`);

        this.session.unsubscribe(topicPath);

        Excel.run(context => {
            context.workbook.worksheets.getActiveWorksheet().getRange(cell).values = [[]];
            return context.sync();
        });        
    }

    /**
     * Subscribe to the topic, and wire updates to the cell
     * @param {*} topicPath 
     * @param {*} cell 
     */
    #doSubscribe(topicPath, cell) {
        this.session
            .addStream(topicPath, diffusion.datatypes.json())
            .on('value', function(topic, specification, newValue, oldValue) {
                const topicValue = JSON.stringify(newValue.get(), null, 2);
               
                Excel.run(context => {
                    context.workbook.worksheets.getActiveWorksheet().getRange(cell).values = [[topicValue]];
                    return context.sync();
                });

            });

        // Subscribe to the topic
        this.session.select(topicPath);
    }

    /**
     * Update the UI with a new subscription
     * @param {*} topicPath 
     * @param {*} cell 
     */

    #addSubscriptionUIRow(topicPath, cell) {
        // Create a row, and add it to the table
        const row = this.tableElem.insertRow(-1);
        const pathTD = row.insertCell();
        pathTD.innerHTML = topicPath;

        const cellTD = row.insertCell();
        cellTD.innerHTML = cell;

        const unsubTD = row.insertCell();
        unsubTD.innerHTML = "🔴";
        unsubTD.classList.add("pointAtMe")
        unsubTD.onclick = () => {
            row.remove();
            this.#unsubscribeFrom(topicPath, cell);
            //TODO: remove this subscription from settings
        }

    }

    // Settings keys
    KEY = "subscriptions";

    /**
     * Save a new subscription to the workbook settings
     * @param {*} topicPath 
     * @param {*} cell 
     */
    #save(topicPath, cell) {

        Excel.run(async (context) => {
            const newEntry = {
                tm: new Date().getTime(),
                topicPath: topicPath, 
                cell: cell
            };

            const settings = context.workbook.settings;
            const setting = settings.getItemOrNullObject(this.KEY); // _sigh_
            await context.sync();
    
            if (setting.isNullObject) {
                settings.add(this.KEY, [newEntry]);
                await context.sync();
            } else {
                setting.load("value");
                await context.sync();

                setting.value.push(newEntry);
                settings.add(this.KEY, setting.value);
                await context.sync();
            }
        });        
    }

    #load() {
        Excel.run(async (context) =>{
            const settings = context.workbook.settings;
            const setting = settings.getItemOrNullObject(this.KEY);
            await context.sync();

            if (!setting.isNullObject) {
                setting.load("value");
                await context.sync();

                const subscriptions = setting.value;

                console.log(`Loaded subscriptions: ${subscriptions.length}`);

                subscriptions.forEach(sub => {
                    this.#doSubscribe(sub.topicPath, sub.cell);
                    this.#addSubscriptionUIRow(sub.topicPath, sub.cell);
                });

            } else {
                console.log(`Loaded no subscriptions`);

            }
        });
    }
    
}