function log(message) {

    if (window.webkit?.messageHandlers?.payPage) {

        window.webkit.messageHandlers.payPage.postMessage({
            type: "log",
            message
        });

    } else {

        console.log(message);

    }
}

document.addEventListener("DOMContentLoaded", () => {

    log("DOM Loaded");

});

window.initializePayment = function (session) {

    log("Initializing payment page...");

    window.paymentSession = session;

    log("CSIPayJS type = " + typeof CSIPayJS);

    if (!session) {

        log("PaymentSession missing");
        return;

    }

    try {

        log("Before constructor");

        const csipay = CSIPayJS(session.accessToken);

        log("After constructor");

        log("CSIPayJS initialized");

        const components = csipay.components({
            orderId: session.orderId
        });

        log("Components created");

        components.addComponent(
            "cardElement",
            "full-card"
        );

        log("Full Card component added");
        
        document
            .getElementById("paymentForm")
            .addEventListener("submit", function (event) {

                event.preventDefault();

                log("PAY BUTTON CLICKED");
            });

    } catch (e) {

        log("Initialization failed");

        log(e.name);

        log(e.message);

        if (e.stack) {

            log(e.stack);

        }

    }

};
