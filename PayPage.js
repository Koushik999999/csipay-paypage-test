function send(message) {
    if (
        window.webkit &&
        window.webkit.messageHandlers &&
        window.webkit.messageHandlers.payPage
    ) {
        window.webkit.messageHandlers.payPage.postMessage(message);
    } else {
        console.log(message);
    }
}
function log(message) {
    send({
        type: "log",
        message: String(message)
    });
}
function safeStringify(value) {
    try {
        return JSON.stringify(value);
    } catch (e) {
        return String(value);
    }
}
window.onerror = function(message, source, line, column, error) {
    log("===== WINDOW ERROR =====");
    log("Message: " + message);
    log("Source: " + source);
    log("Line: " + line);
    log("Column: " + column);
    if (error) {
        log("Error: " + (error.stack || error.toString()));
    }
};
window.onunhandledrejection = function(event) {
    log("===== UNHANDLED PROMISE REJECTION =====");
    if (event && event.reason) {
        log(event.reason.stack || String(event.reason));
    } else {
        log("Unknown rejection");
    }
};
document.addEventListener("DOMContentLoaded", function() {
    log("DOM LOADED");
});
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    if (!toast) {
        log("Toast element not found");
        return;
    }
    toast.className = "toast " + type;
    toast.innerHTML = message.replace(/\n/g, "<br>");
    requestAnimationFrame(function() {
        toast.classList.add("show");
    });
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(function() {
        toast.classList.remove("show");
    }, 3500);
}
window.initializePayment = function(session) {
    log("================================");
    log("initializePayment called");
    log("Order ID: " + session.orderId);
    log("================================");
    window.paymentSession = session;
    try {
        log("CSIPayJS typeof = " + typeof CSIPayJS);
        log("Creating CSIPay");

        const config = session.config || {};
        const csipay = CSIPayJS(
            session.accessToken,
            {
                billingAddress: config.billingAddress
            }
        );
        
        
        log("CSIPay keys:");
        log(Object.keys(csipay).join(","));
        log("CSIPay created");
        log("Creating components for order: " + session.orderId);
        
        const componentType = config.component || "full-card";
        const componentOptions = {};
        if (config.billingAddress) {
            componentOptions.billingAddress = config.billingAddress;
        }
        log("Creating component");
        log("Component: " + componentType);
        log("Options: " + safeStringify(componentOptions));
        const components = csipay.components({
            orderId: session.orderId,
            billingAddress: "full"
        });
        
        log("Components keys:");
        log(Object.keys(components).join(","));
        components.addComponent(
            "cardElement",
            componentType
        );
        setTimeout(function(){
            log("================================");
            log("AFTER COMPONENT");
            log("================================");
            log(document.body.innerHTML);
        },3000);
        log("Component added");
        /*
         * Register payment events ONCE.
         */
        log("Registering payment-success listener");
        csipay.on("payment-complete", function(data) {
            log("================================");
            log("EVENT: payment-complete");
            log("Payload: " + safeStringify(data));
            log("================================");
            showToast(
                "✅ Payment Successful!",
                "success"
            );
            
            send({
                type: "payment-complete",
                data: data
            })
            const payButton = document.getElementById("payButton");
            if (payButton) {
                payButton.disabled = false;
                payButton.textContent = "Pay Now";
            }
        });
        log("Registering payment-failed listener");
        csipay.on("payment-failed", function(data) {
            log("================================");
            log("EVENT: payment-failed");
            log("Payload: " + safeStringify(data));
            log("================================");
            let message = "Payment Failed";
            if (
                data &&
                data.messages &&
                data.messages.length > 0
            ) {
                message += "\n\n" + data.messages.join("\n");
            }
            showToast(
                "❌ " + message,
                "error"
            );
            
            send({
                type: "payment-failed",
                data: data
            })
            const payButton = document.getElementById("payButton");
            if (payButton) {
                payButton.disabled = false;
                payButton.textContent = "Pay Now";
            }
        });        /*
         * Additional diagnostic events.
         *
         * These are only diagnostic. If the SDK does not emit them,
         * nothing happens.
         */
        const diagnosticEvents = [
            "payment-error",
            "processing",
            "complete",
            "completed",
            "error"
        ];
        diagnosticEvents.forEach(function(eventName) {
            try {
                csipay.on(eventName, function(data) {
                    log(
                        "DIAGNOSTIC EVENT [" +
                        eventName +
                        "]: " +
                        safeStringify(data)
                    );
                });
            } catch (e) {
                log(
                    "Could not register diagnostic event [" +
                    eventName +
                    "]: " +
                    e.message
                );
            }
        });
        const form = document.getElementById("paymentForm");
        const payButton = document.getElementById("payButton");
        log("Form found = " + (form !== null));
        log("Pay button found = " + (payButton !== null));
        if (!form) {
            log("ERROR: paymentForm not found");
            return;
        }
        form.addEventListener("submit", function(event) {
            event.preventDefault();
            log("================================");
            log("PAY NOW CLICKED");
            log("Order ID: " + session.orderId);
            log("Calling processOrder()");
            log("================================");
            /*
             * Prevent accidental double submission while we're testing.
             */
            if (payButton) {
                payButton.disabled = true;
                payButton.textContent = "Processing...";
            }
            try {
                const result = csipay.processOrder();
                log("processOrder() invoked successfully");
                log("processOrder return type = " + typeof result);
                log("processOrder return value = " + safeStringify(result));
            } catch (e) {
                log("===== processOrder EXCEPTION =====");
                log("Name: " + e.name);
                log("Message: " + e.message);
                if (e.stack) {
                    log(e.stack);
                }
                if (payButton) {
                    payButton.disabled = false;
                    payButton.textContent = "Pay Now";
                }
            }
        });
        log("Submit listener attached");
        log("Payment page initialization COMPLETE");
    } catch (e) {
        log("===== INITIALIZATION EXCEPTION =====");
        log("Name: " + e.name);
        log("Message: " + e.message);
        if (e.stack) {
            log(e.stack);
        }
    }
};


