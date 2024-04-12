import type {Session, UpdateStream} from "diffusion";
declare const diffusion: any; 

const jsonDataType = diffusion.datatypes.json();
const TopicType = diffusion.topics.TopicType;

export class BindingExperiment {
    private updateStream: UpdateStream;

    constructor(
        private session: Session, 
        private cell: string, 
        private topicPath :string) 
    {
        this.updateStream = this.session.topicUpdate
            .newUpdateStreamBuilder()
            .build(this.topicPath, jsonDataType);
    }

    async bind() {
        console.log(`Binding to ${this.cell}`);

        // Create the topic
        const topicSpec = new diffusion.topics.TopicSpecification(TopicType.JSON);
        await this.session.topics.add(this.topicPath, topicSpec);

        await this.updateStream.validate();

        console.log(`Created topic ${this.topicPath}`);

        // Link to full sample: https://raw.githubusercontent.com/OfficeDev/office-js-snippets/prod/samples/excel/30-events/data-changed.yaml
        await Excel.run(async (context) => {
            const range = context.workbook.worksheets.getActiveWorksheet().getRange(this.cell);
            const binding = context.workbook.bindings.add(range, "Range", "publication.0");
            binding.onDataChanged.add(async(eventArgs) => {
                console.log(`Range ${this.cell} onDataChanged, binding.id = ${eventArgs.binding.id}`);

                const range = context.workbook.bindings.getItem(eventArgs.binding.id).getRange();
                range.load("values");

                await context.sync();
                console.log("values: " + range.values);

                this.updateStream.set(range.values)
            });

            await context.sync();
            console.log(`onDataChanged registered for ${this.cell}`);
        });
    }

}