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

function showToast(message, type = "success") {

    const toast = document.getElementById("toast");

    toast.className = "toast " + type;

    toast.innerHTML = message.replace(/\n/g, "<br>");

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}

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

            log("Submitting payment...");

            const events = [
                "payment-success",
                "payment-failed",
                "payment-error",
                "success",
                "error",
                "complete",
                "completed",
                "processing",
                "attempt-payment"
            ];

            csipay.on("payment-success", function(data) {

                log("EVENT: payment-success");
                log(JSON.stringify(data));

                showToast(
                    "✅ Payment Successful!",
                    "success"
                );

            });

            csipay.on("payment-failed", function(data) {

                log("EVENT: payment-failed");
                log(JSON.stringify(data));

                let message = "Payment Failed";

                if (data && data.messages && data.messages.length > 0) {
                    message += "\n\n" + data.messages.join("\n");
                }

                showToast(
                    "❌ " + message,
                    "error"
                );

            });

            csipay.processOrder();

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
