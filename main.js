import {Subscriptions} from "./subscriptions.js";
import {BindingExperiment} from "./BindingExperiment.js"

const subscribeForm = document.getElementById('subscribeForm');

Office.onReady( async (info) => {
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
    const subscriptions = new Subscriptions(
        session,
        document.getElementById("subscriptionsTable")
    );

    const bindingExperiment = new BindingExperiment(session, "E1:E1", "excel/cell/E1");
    document.getElementById('bindRangeButton').onclick = async () => {
        await bindingExperiment.bind();
    };

    subscribeForm.addEventListener('submit', (ev) => {
        event.preventDefault(); 
        const formData = new FormData(ev.target);
        const topicPath = formData.get('path');
        const cell = formData.get('cell');

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