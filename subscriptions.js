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
    }

    
}