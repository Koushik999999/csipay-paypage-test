function send(message) {

    if (window.webkit &&
        window.webkit.messageHandlers &&
        window.webkit.messageHandlers.payPage) {

        window.webkit.messageHandlers.payPage.postMessage(message);

    } else {

        console.log(message);

    }
}

function log(message) {

    send({
        type: "log",
        message: message
    });
}

window.onerror = function(message, source, line, column, error) {

    log("WINDOW ERROR");
    log(String(message));

    if (error) {

        log(error.stack || error.toString());

    }
};

window.onunhandledrejection = function(event) {

    log("PROMISE REJECTION");
    log(String(event.reason));
};

document.addEventListener("DOMContentLoaded", function() {

    log("DOM LOADED");

});

window.initializePayment = function(session) {

    log("initializePayment called");

    window.paymentSession = session;

    try {

        log("Creating CSIPay");

        const csipay = CSIPayJS(session.accessToken);

        log("CSIPay created");

        const components = csipay.components({

            orderId: session.orderId

        });

        log("Components created");

        components.addComponent(
            "cardElement",
            "full-card"
        );

        log("Card component added");

        const form = document.getElementById("paymentForm");

        log("Form = " + (form !== null));

        form.addEventListener("submit", function(event) {

            event.preventDefault();

            log("===== PAY NOW CLICKED =====");

            try {

                log("Calling processOrder()...");
                
                log("processOrder typeof = " + typeof csipay.processOrder);
                log("on typeof = " + typeof csipay.on);

                log("processOrder source:");
                log(String(csipay.processOrder));

                log("on source:");
                log(String(csipay.on));

                const result = csipay.processOrder();

                log("processOrder() returned");

                if (result instanceof Promise) {

                    log("Returned a Promise");

                    result
                        .then(function(value) {

                            log("PROMISE RESOLVED");

                            log(JSON.stringify(value));

                        })
                        .catch(function(error) {

                            log("PROMISE REJECTED");

                            log(error && error.stack ? error.stack : String(error));

                        });

                } else {

                    log("Return value:");

                    log(JSON.stringify(result));

                }

            } catch (e) {

                log("processOrder threw exception");

                log(e && e.stack ? e.stack : String(e));

            }

        });

        log("Submit listener attached");

    } catch (e) {

        log("EXCEPTION");

        log(e.name);

        log(e.message);

        if (e.stack) {

            log(e.stack);

        }

    }

};
