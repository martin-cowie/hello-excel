export class Subscriptions {

    KEY = "subscriptions";

    constructor(tableElem, unsubLambda) {
        if (tableElem == null) {
            throw new Error("tableElem cannot be falsey");
        }
        if (unsubLambda == null) {
            throw new Error("unsubLambda cannot be falsey");
        }
        this.tableElem = tableElem;
        this.unsubLambda = unsubLambda;

        // Load subscriptions from settings
    }

    addSubscription(topicPath, cell) {
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
            this.unsubLambda(topicPath, cell);
        }

        this.save(topicPath, cell);
    }

    save(topicPath, cell) {

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
    
}