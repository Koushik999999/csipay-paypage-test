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
    log("populateCountryState()");
    log("typeof LOCATION_DATA = " + typeof LOCATION_DATA);
    const countrySelect = document.getElementById("country");
    const stateSelect = document.getElementById("state");
    log("countrySelect = " + (countrySelect != null));
    log("stateSelect = " + (stateSelect != null));
    countrySelect.innerHTML = "";
    stateSelect.innerHTML = "";
    const countries = Object.entries(LOCATION_DATA);
    log("Country count = " + countries.length);
    countries.forEach(([code, country]) => {
        log("Adding country = " + country.name);
        const option = document.createElement("option");
        option.value = code;
        option.textContent = country.name;
        countrySelect.appendChild(option);
    });
    log("Country options = " + countrySelect.options.length);
    loadStates(countrySelect.value);
    countrySelect.addEventListener("change", function () {
        loadStates(this.value);
    });
}
function updateAddressFields(level) {
    document.getElementById("baseAddressFields").style.display =
        "grid";
    document.getElementById("partialAddressFields").style.display =
        level === "base" ? "none" : "grid";
    document.getElementById("fullAddressFields").style.display =
        level === "full" ? "grid" : "none";
}
function loadStates(countryCode) {
    log("loadStates(" + countryCode + ")");
    const stateSelect = document.getElementById("state");
    stateSelect.innerHTML = "";
    const country = LOCATION_DATA[countryCode];
    if (!country) {
        log("Country not found");
        return;
    }
    log("State count = " + country.states.length);
    country.states.forEach(function(state) {
        const option = document.createElement("option");
        option.value = state.code;
        option.textContent = state.name;
        stateSelect.appendChild(option);
    });
    log("State options = " + stateSelect.options.length);
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
    
    const addressLevel = document.getElementById("addressLevel");
    updateAddressFields(addressLevel.value);
    addressLevel.addEventListener( "change",
                                  function () {
        updateAddressFields(this.value);
    }
                                  );
    
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
                log("Billing Address:");
                log(JSON.stringify(billingAddress));
                            
                document
                    .getElementById("errors")
                    .classList.add("hidden");
                
                const level =
                    document.getElementById("addressLevel").value;
                const billingAddress = {};
                if (level === "full") {
                    billingAddress.street =
                        document.getElementById("addressLine1").value.trim();
                    billingAddress.street2 =
                        document.getElementById("addressLine2").value.trim();
                }
                if (level === "full" || level === "partial") {
                    billingAddress.city =
                        document.getElementById("city").value.trim();
                    billingAddress.state =
                        document.getElementById("state").value;
                }
                billingAddress.zip =
                    document.getElementById("zip").value.trim();
                billingAddress.country =
                    document.getElementById("country").value;

                window.paymentSession.billingAddress = billingAddress;

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



