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

            log(
                "components keys: " +
                JSON.stringify(Object.keys(components))
            );

            log(
                "csipay keys: " +
                JSON.stringify(Object.keys(csipay))
            );

            for (const key in components) {

                log(
                    "components." +
                    key +
                    " = " +
                    typeof components[key]
                );

            }

            for (const key in csipay) {

                log(
                    "csipay." +
                    key +
                    " = " +
                    typeof csipay[key]
                );

            }

            log("===== END OBJECT DUMP =====");

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
