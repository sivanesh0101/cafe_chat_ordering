// Select the mic button element
const micButton = document.getElementById('activate-voice-assistant');

// Function to start voice recognition
function startVoiceRecognition() {
    // Add 'active' class to mic button to change its color
    micButton.classList.add('active');

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-IN';  // Set language to English (India)
    recognition.interimResults = true;

    // When voice recognition produces a result
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript.toLowerCase();
        processOrder(transcript);

        // Remove 'active' class after voice recognition finishes
        micButton.classList.remove('active');
    };

    // Handle errors (e.g., if user cancels voice recognition)
    recognition.onerror = function(event) {
        console.error('Voice recognition error:', event.error);
        // Remove 'active' class if there is an error
        micButton.classList.remove('active');
    };

    recognition.onend = function() {
        // Remove 'active' class when voice recognition ends
        micButton.classList.remove('active');
    };

    // Start the speech recognition process
    recognition.start();
}


function updateChat(sender, message) {
    const chatMessage = document.createElement('div');
    chatMessage.classList.add(sender);
    chatMessage.innerText = message;
    document.getElementById('chat').appendChild(chatMessage);
}

function processOrder(transcript) {
    const items = {
        "cappuccino": 50, 
        "espresso": 60, 
        "cold coffee": 120, 
        "cold mocha": 150, 
        "red velvet cake": 415,
        "filter coffee": 70, 
        "flat white": 40,
        "belgian chocolate": 180,
        "chocolate shake": 200,
        "sandwich": 70,
        "garlic bread": 60,
        "veg burger": 120,
        "veg pizza": 150,
        "cheesecake": 165,
        "vanilla scoop": 165,
        "strawberry cake": 165 
        // Add more items as needed
    };

    let matchedItem = null;
    let quantity = 1;

    // Print user's voice input
    updateChat('user', transcript);

    // Check if the transcript contains an item
    for (const item in items) {
        if (transcript.includes(item)) {
            matchedItem = item;
            break;
        }
    }

    // Check for quantity in transcript (optional)
    const qtyMatch = transcript.match(/\d+/);
    if (qtyMatch) {
        quantity = parseInt(qtyMatch[0]);
    }

    // Check if user finalizes the order
    if (transcript.includes("finalize") || transcript.includes("enough")) {
        finalizeOrder();
        return;
    }

    if (matchedItem) {
        addToOrder(matchedItem, quantity, items[matchedItem]);
        updateChat('app', `Added ${quantity} ${matchedItem} to your order.`);
    } else {
        updateChat('app', "Sorry, item not found.");
    }
}

function addToOrder(itemName, quantity, price) {
    const orderItem = document.createElement('tr');
    orderItem.innerHTML = `<td>${itemName}</td><td>${quantity}</td><td>${price * quantity}</td>`;
    document.getElementById('order-items').appendChild(orderItem);
}

function finalizeOrder() {
    const orderItems = [];
    let totalAmount = 0;

    document.querySelectorAll('#order-items tr').forEach(row => {
        const item = row.querySelector('td:first-child').innerText;
        const quantity = row.querySelector('td:nth-child(2)').innerText;
        const price = parseInt(row.querySelector('td:nth-child(3)').innerText); // Adjust to get the price directly
        orderItems.push({ item_name: item, quantity: parseInt(quantity) });
        totalAmount += price; // Sum up the total amount
    });

    // Corrected URL for the Flask backend
    fetch('http://127.0.0.1:5000/place_order', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ table_number: 1, items: orderItems })
    }) 
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok " + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        updateChat('app', "Your order has been placed successfully!");
        console.log(data);
        
        // Display total amount and generate QR code
        displayTotalAndQRCode(totalAmount);
    })
    .catch(error => {
        updateChat('app', "Sorry, there was an issue placing your order.");
        console.error(error);
    });
}

function displayTotalAndQRCode(total) {
    // Display the total amount
    const totalMessage = document.createElement('div');
    totalMessage.classList.add('app');
    totalMessage.innerText = `Total Amount: ₹${total}`;
    document.getElementById('chat').appendChild(totalMessage);

    // Create a container for the QR code if it doesn't already exist
    let qrCodeContainer = document.getElementById('qr-code');
    if (!qrCodeContainer) {
        qrCodeContainer = document.createElement('div');
        qrCodeContainer.id = 'qr-code';
        document.getElementById('chat').appendChild(qrCodeContainer);
    } else {
        qrCodeContainer.innerHTML = ''; // Clear any previous QR code
    }

    // Create the QR code
    new QRCode(qrCodeContainer, {
        text: `Pay ₹${total} at table 1`, // Customize the payment link as needed
        width: 128,
        height: 128,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}
