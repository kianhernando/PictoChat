const params = new URLSearchParams(window.location.search);
const username = params.get('username');
const room = params.get('room');

// send alert if there is no username or room before entering history page
// return to home page if none
if (!username || !room) {
    alert("Missing username or room.");
    window.location.href = "/";
}

// bring user to chat page if back link is clicked
const backLink = document.getElementById("back-link");
if (backLink) {
    backLink.href = `/chat.html?username=${encodeURIComponent(username)}&room=${encodeURIComponent(room)}`;
}

// convert 24hr timestamp from database to 12hr timestamp for UI
function formatTo12Hour(datetimeStr) {
    const [datePart, timePart] = datetimeStr.split('T').join(' ').split(' ');
    const [year, month, day] = datePart.split('-');
    let [hour, minute] = timePart.split(':');

    hour = parseInt(hour, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; // 0 in hour becomes 12

    const formattedDate = `${month}/${day}/${year}`;
    return `${formattedDate}, ${hour}:${minute} ${ampm}`;
}

const list = document.getElementById("history-list");
const emptyMessage = document.getElementById("empty-message");

// fetch message history for user (any room within the past 48 hours)
fetch(`/api/history?username=${encodeURIComponent(username)}`)
    .then(res => res.json())
    .then(data => {
        // if no messages have been sent, show "no messages"
        if (!Array.isArray(data)|| data.length === 0) {
            if (emptyMessage) emptyMessage.style.display = "block";
            return;
        }

        data.forEach(msg => {
            const item = document.createElement("li");

            // change time from 24hr format to 12hr format
            const localTime = formatTo12Hour(msg.created_on);

            // get room name
            const roomName = msg.room || "Unknown";

            // check if drawing message type
            if (msg.type === 2) {
                const label = document.createElement("div");
                label.textContent = `${localTime}, Room ${roomName} | Drawing:`;
                item.appendChild(label);

                const img = document.createElement("img");
                img.src = msg.payload;  // get image url from database
                img.style.maxWidth = "200px";
                item.appendChild(img);
            } else {
                // text message type
                item.textContent = `${localTime}, Room ${roomName} : ${msg.payload}`;
            }

            list.appendChild(item);
        });
    })
    .catch(err => {
        if (list) {
            list.innerHTML = `<li>Error loading history: ${err.message}</li>`;
        }
    });