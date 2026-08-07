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
function showError(message) {
    const errors =
        document.getElementById("errors");
    if (!errors) {
        return;
    }
    errors.textContent = message;
    errors.classList.remove("hidden");
}
function populateCountryState() {
    const countrySelect =
        document.getElementById("country");
    const stateSelect =
        document.getElementById("state");
    countrySelect.innerHTML = "";
    stateSelect.innerHTML = "";
    Object.entries(LOCATION_DATA).forEach(([code, country]) => {
        const option =
            document.createElement("option");
        option.value = code;
        option.textContent = country.name;
        countrySelect.appendChild(option);
    });
    loadStates(countrySelect.value);
    countrySelect.addEventListener("change", function () {
        loadStates(this.value);
    });
}
function loadStates(countryCode) {
    const stateSelect =
        document.getElementById("state");
    stateSelect.innerHTML = "";
    const country =
        LOCATION_DATA[countryCode];
    if (!country) {
        return;
    }
    country.states.forEach(function (state) {
        const option =
            document.createElement("option");
        option.value = state.code;
        option.textContent = state.name;
        stateSelect.appendChild(option);
    });
}
window.initializePayment = function(session) {
    log("================================");
    log("initializePayment called");
    log("Order ID: " + session.orderId);
    log("================================");
    window.paymentSession = session;
    
 
    
    const amount = Number(session.amount || 0);
    document.getElementById("amountValue").textContent =
        "$" + amount.toFixed(2);
    const zip = document.getElementById("zip");
    if (zip) {
        
        zip.addEventListener("input", function(){
            this.value = this.value
                .replace(/\D/g,"")
                .slice(0,5);
        });
        
    }
    
    try {
        log("CSIPayJS typeof = " + typeof CSIPayJS);
        log("Creating CSIPay");
        const csipay = CSIPayJS(session.accessToken);
        log("CSIPay created");
        log("Creating components for order: " + session.orderId);
        const components = csipay.components({
            orderId: session.orderId
        });
        log("Components created");
        components.addComponent(
            "cardElement",
            "full-card"
        );
        log("Card component added");
        /*
         * Register payment events ONCE.
         */

            if (typeof LOCATION_DATA !== "undefined") {

        populateCountryState();

    } else {

        log("LOCATION_DATA not loaded.");

    }
        log("Registering payment-success listener");
        csipay.on("payment-complete", function(data) {
            log("================================");
            log("EVENT: payment-complete");
            log("Payload: " + safeStringify(data));
            log("================================");
            document
                .getElementById("errors")
                .classList.add("hidden");
            
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
            showError("❌ " + message);
            
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
                const billingAddress = {
                    street: document.getElementById("street").value.trim(),
                    city: document.getElementById("city").value.trim(),
                    state: document.getElementById("state").value,
                    zip: document.getElementById("zip").value.trim(),
                    
                    country: document.getElementById("country").value
                };
                log("Billing Address:");
                log(JSON.stringify(billingAddress));
                
                window.paymentSession.billingAddress = billingAddress;
                
                document
                    .getElementById("errors")
                    .classList.add("hidden");
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


