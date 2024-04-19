import {Subscriptions} from "./Subscriptions.js";
import {BindingExperiment} from "./BindingExperiment.js" //TODO: should I not omit the suffix?
import {RangeExpression} from "./RangeExpression.js";
import type {Session} from "diffusion";
declare const diffusion: any; 

const subscribeForm = document.getElementById('subscribeForm') as HTMLFormElement;

Office.onReady( async (info) => {

    // Load immediately - TODO: make configurable, as per best practices.
    {
        const value = Office.StartupBehavior.load;
        console.log(`calling Office.addin.setStartupBehavior(${value})`);
        await Office.addin.setStartupBehavior(value);
        console.log(`called Office.addin.setStartupBehavior(${value})`);
    }

    configureDropTarget(document.getElementById('path') as HTMLInputElement);
    configureSelectionListener(document.getElementById('cell') as HTMLInputElement);

    console.log("Hello-Excel is ready.")

    const session = await diffusion.connect({
        host: 'ohost.eu.diffusion.cloud',
        port: 443,
        secure: true,
        principal: 'myuser',
        credentials: 'hunter2'
    });

    console.log("Connected with session " + session.sessionId);

    // Subscriptions controller
    const subscriptions = await Subscriptions.build(
        session,
        document.getElementById("subscriptionsTable") as HTMLTableElement
    );

    const bindingExperiment = new BindingExperiment(session, "E1:E1", "excel/cell/E1");
    (document.getElementById('bindRangeButton') as HTMLElement).onclick = async () => {
        await bindingExperiment.bind();
    };

    subscribeForm.addEventListener('submit', (ev) => {
        ev.preventDefault(); 
        const formData = new FormData(ev.target as HTMLFormElement);
        const topicPath = formData.get('path') as string;
        const cell = formData.get('cell') as string;

        console.log(`topicPath=${topicPath}, cell=${cell}`);
        subscriptions.subscribeTo(topicPath, cell);
    });

    subscribeForm.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); 
            this.submit(); 
        }
    });

});

function configureDropTarget(inputElement: HTMLInputElement) {

    const BROWSER_PREFIX = "#/topics/browser/";
    inputElement.ondrop = (ev) => {
        ev.preventDefault();

        if (!ev.dataTransfer) {
            return;
        }
        const items = Array.from(ev.dataTransfer.items);
        const uriListItem = items.find(item => item.kind == 'string' && item.type == 'text/uri-list')

        if (!uriListItem) {
            return;
        }

        uriListItem.getAsString(str => {
            const list = parseUriList(str);
            const url = list.find(uri => uri.protocol.startsWith('http') && uri.hash.startsWith(BROWSER_PREFIX));
            if (url) {
                inputElement.value = url.hash.substring(BROWSER_PREFIX.length);
            }
        });

    }

}

function configureSelectionListener(inputElement: HTMLInputElement) {
    Excel.run((context) => {
        const worksheet = context.workbook.worksheets.getActiveWorksheet(); //TODO: doesn't handle >1 sheet
        worksheet.onSelectionChanged.add(async(ev) => {
            inputElement.value = RangeExpression.parse(ev.address).start;
        });

        return context.sync();

    });
}

/**
 * Parse URI-list content into a list of URI
 * see https://www.iana.org/assignments/media-types/text/uri-list
 * @param uriListStr 
 * @returns 
 */
function parseUriList(uriListStr: string): URL[] {
    return uriListStr.split('\n').filter(s => !s.startsWith('#')).map(s => new URL(s));
}