export class Subscriptions {
    constructor(tableElem, unsubLambda) {
        if (tableElem == null) {
            throw new Error("tableElem cannot be falsey");
        }
        if (unsubLambda == null) {
            throw new Error("unsubLambda cannot be falsey");
        }
        this.tableElem = tableElem;
        this.unsubLambda = unsubLambda;
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

        
        Excel.run(async (context) => {
            const KEY = "subscriptions";
            const newEntry = {
                tm: new Date().getTime(),
                topicPath: topicPath, 
                cell: cell
            };

            const settings = context.workbook.settings;

            const setting = settings.getItemOrNullObject(KEY); // _sigh_
            await context.sync();
    
            if (setting.isNullObject) {
                console.log(`${KEY} is absent`);

                settings.add(KEY, [newEntry]);
                await context.sync();
            } else {
                console.log(`${KEY} is present`);
                setting.load("value");
                await context.sync();

                setting.value.push(newEntry);
                settings.add(KEY, setting.value);
                await context.sync();

                console.log(`setting: ${JSON.stringify(setting.value)}`);
            }
        });


    }

    
}