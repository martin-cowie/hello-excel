const jsonDataType = diffusion.datatypes.json();
const TopicType = diffusion.topics.TopicType;

export class BindingExperiment {
    constructor(session, cell, topicPath) {
        this.session = session;
        this.cell = cell;
        this.topicPath = topicPath;
    }

    async bind() {
        console.log(`Binding to ${this.cell}`);

        // Create the topic
        const topicSpec = new diffusion.topics.TopicSpecification(TopicType.JSON);
        await this.session.topics.add(this.topicPath, topicSpec);

        this.updateStream = this.session.topicUpdate
            .newUpdateStreamBuilder()
            .build(this.topicPath, jsonDataType);

        this.updateStream.validate();

        console.log(`Created topic ${this.topicPath}`);

        // Link to full sample: https://raw.githubusercontent.com/OfficeDev/office-js-snippets/prod/samples/excel/30-events/data-changed.yaml
        await Excel.run(async (context) => {
            const range = context.workbook.worksheets.getActiveWorksheet().getRange(this.cell);
            const binding = context.workbook.bindings.add(range, "Text", "someName0"); //TODO: what value the 3rd argument?
            binding.onDataChanged.add(async(eventArgs) => {
                console.log(`Range ${this.cell} onDataChanged, binding.id = ${eventArgs.binding.id}`);

                const textCell = context.workbook.bindings.getItem(eventArgs.binding.id).getText();

                await context.sync();
                console.log("text: " + textCell.value);

                this.updateStream.set(textCell.value)
            });

            await context.sync();
            console.log(`onDataChanged registered for ${this.cell}`);
        });
    }

}