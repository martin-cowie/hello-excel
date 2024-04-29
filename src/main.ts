import {Subscriptions} from "./Subscriptions.js";
import {BindingExperiment} from "./BindingExperiment.js" //TODO: should I not omit the suffix?
import {RangeExpression} from "./RangeExpression.js";
import type {Session} from "diffusion";
import { Subscription } from "./Subscription.js";
declare const diffusion: any; 

const subscribeForm = getTypedElement('subscribeForm', HTMLFormElement);
const pathButton = getTypedElement("path", HTMLInputElement);
const typeInput = getTypedElement('topic-type', HTMLOutputElement);
const subscriptionsTable = getTypedElement("subscriptionsTable", HTMLTableElement);
const translationFunctionMenu = getTypedElement("translation-function-menu", HTMLSelectElement); //TODO: consistent id naming scheme
const cellInput = getTypedElement('cell', HTMLInputElement);

Office.onReady( async (info) => {

    try {
        // Load immediately - TODO: make configurable, as per best practices.
        {
            const value = Office.StartupBehavior.load;
            console.log(`calling Office.addin.setStartupBehavior(${value})`);
            await Office.addin.setStartupBehavior(value);
            console.log(`called Office.addin.setStartupBehavior(${value})`);
        }

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
            subscriptionsTable,
            pathButton,
            typeInput,
            translationFunctionMenu
        );

        // Wire up event handlers - TODO: put these in their own function or method
        pathButton.onblur = async () => {
            subscriptions.validatePath();
        };

        subscribeForm.addEventListener('submit', (ev) => {
            ev.preventDefault(); 
            const formData = new FormData(ev.target as HTMLFormElement);
            const topicPath = formData.get('path') as string;
            const cell = formData.get('cell') as string;
            const translationFunction = formData.get('translation-function-menu') as string;
            const topicType = formData.get('topic-type') as string; //TODO: should be https://docs.diffusiondata.com/docs/6.10.0/js/classes/topictype.html not a string

            console.log(`topicPath=${topicPath}, cell=${cell}, translationFunction=${translationFunction}, topicType=${topicType}`);
            subscriptions.subscribeTo(topicPath, topicType, translationFunction, cell);
        });

        subscribeForm.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); 
                this.submit(); 
            }
        });

        [pathButton, translationFunctionMenu, cellInput].forEach(elem => {
            elem.addEventListener('blur', ev => subscriptions.validateForm());
            elem.addEventListener('keypress', ev => {
                const keyboardEv = ev as KeyboardEvent;
                if (keyboardEv.key == 'Enter') {
                    subscriptions.validateForm();
                }
            });
        });

        configureDropTarget(getTypedElement('path', HTMLInputElement), subscriptions);
        configureSelectionListener(cellInput);
        console.log("Hello-Excel is ready.")
    } catch(ex: any) {
        console.error("Error in initialisation", ex.message);
        console.error("Stack trace: ", ex.stack);

    }
});

function configureDropTarget(inputElement: HTMLInputElement, subscriptions: Subscriptions) {

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
                subscriptions.validatePath();
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

/**
 * Gets the given element, checks it's of the correct type and throws an exception if it's absent or incorrectly typed.
 * @param id 
 * @param constructor 
 * @returns 
 */
function getTypedElement<T extends HTMLElement>(id: string, constructor: { new(): T }): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Element ${id} is absent`);
    }
    if (!(element instanceof constructor)) {
        throw new Error(`Element ${id} is of unexpected type ${constructor.name}`);
    }
    return element;
}
