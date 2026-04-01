// TravelAI Chat Application

const API_URL = window.location.origin;
const STORAGE_KEY = 'travelai_chat_history';
const USE_STREAMING = true; // Toggle SSE streaming

const state = {
    userId: localStorage.getItem('travelai_user_id') || generateUserId(),
    messages: [],
    isLoading: false
};

function generateUserId() {
    const id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('travelai_user_id', id);
    return id;
}

// ===== Persistence =====
function saveMessages() {
    const data = { userId: state.userId, messages: state.messages };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadMessages() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (data.userId === state.userId) return data.messages;
    } catch (e) { /* ignore corrupt data */ }
    return null;
}

// DOM Elements
const chatArea = document.getElementById('chat-area');
let welcomeContainer = document.getElementById('welcome-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');
const voiceStatus = document.getElementById('voice-status');
const themeToggle = document.getElementById('theme-toggle');
const newChatBtn = document.getElementById('new-chat-btn');
const themeIconDark = document.getElementById('theme-icon-dark');
const themeIconLight = document.getElementById('theme-icon-light');

// ===== Theme =====
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('travelai_theme', theme);
    if (theme === 'dark') {
        themeIconDark.style.display = '';
        themeIconLight.style.display = 'none';
    } else {
        themeIconDark.style.display = 'none';
        themeIconLight.style.display = '';
    }
}

const savedTheme = localStorage.getItem('travelai_theme') || 'dark';
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
});

// ===== Messages =====
function renderMessage(role, content, data = null, save = true) {
    if (welcomeContainer) {
        welcomeContainer.remove();
        welcomeContainer = null;
    }

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? 'U' : 'AI';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (data && data.results && data.results.length > 0) {
        const textLine = `Showing ${data.mode} options from ${data.source} to ${data.destination} on ${data.date}:`;
        const textNode = document.createElement('div');
        textNode.textContent = textLine;
        textNode.style.marginBottom = '10px';
        contentDiv.appendChild(textNode);

        if (data.booking_ref) {
            const refNode = document.createElement('div');
            refNode.className = 'booking-ref';
            refNode.textContent = `Booking Ref: ${data.booking_ref}`;
            contentDiv.appendChild(refNode);
        }

        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'results-container';

        data.results.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'result-card';

            const info = document.createElement('div');
            info.className = 'result-info';

            const name = document.createElement('div');
            name.className = 'result-name';

            const details = document.createElement('div');
            details.className = 'result-details';

            const timeDiv = document.createElement('div');
            timeDiv.className = 'result-time';

            if (data.mode === 'flight') {
                name.textContent = item.airline;
                details.textContent = `Flight ${item.flight_id}`;
            } else if (data.mode === 'train') {
                name.textContent = item.train_name;
                details.textContent = `${item.class} | ID: ${item.train_id}`;
            } else if (data.mode === 'bus') {
                name.textContent = item.operator;
                details.textContent = `${item.bus_type} | ID: ${item.bus_id}`;
            }

            timeDiv.innerHTML = `${item.departure_time} <span class="arrow">&rarr;</span> ${item.arrival_time}`;

            info.appendChild(name);
            info.appendChild(details);
            info.appendChild(timeDiv);

            const rightSection = document.createElement('div');
            rightSection.className = 'result-right';

            const price = document.createElement('div');
            price.className = 'result-price';
            price.textContent = `Rs.${item.price}`;

            rightSection.appendChild(price);

            if (data.booking_ref) {
                const selectBtn = document.createElement('button');
                selectBtn.className = 'select-btn';
                selectBtn.textContent = 'Select';
                selectBtn.addEventListener('click', () => confirmBooking(data.booking_ref, index, item));
                rightSection.appendChild(selectBtn);
            }

            card.appendChild(info);
            card.appendChild(rightSection);
            cardsContainer.appendChild(card);
        });

        contentDiv.appendChild(cardsContainer);
    } else {
        contentDiv.textContent = content;
    }

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(contentDiv);
    chatArea.appendChild(msgDiv);
    scrollToBottom();

    if (save) {
        state.messages.push({ role, content, data });
        saveMessages();
    }

    return contentDiv; // Return for streaming updates
}

// ===== Streaming Bot Message =====
function createStreamingMessage() {
    if (welcomeContainer) {
        welcomeContainer.remove();
        welcomeContainer = null;
    }

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot';
    msgDiv.id = 'streaming-message';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'AI';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.id = 'streaming-content';
    contentDiv.textContent = '';

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(contentDiv);
    chatArea.appendChild(msgDiv);
    scrollToBottom();

    return contentDiv;
}

function finalizeStreamingMessage(fullText) {
    const streamMsg = document.getElementById('streaming-message');
    if (streamMsg) streamMsg.removeAttribute('id');
    const streamContent = document.getElementById('streaming-content');
    if (streamContent) streamContent.removeAttribute('id');

    state.messages.push({ role: 'bot', content: fullText, data: null });
    saveMessages();
}

// ===== Booking Confirmation =====
async function confirmBooking(bookingRef, selectedIndex, selectedItem) {
    try {
        const response = await fetch(`${API_URL}/bookings/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                booking_ref: bookingRef,
                selected_index: selectedIndex
            })
        });

        const result = await response.json();
        if (response.ok) {
            const modeName = selectedItem.airline || selectedItem.train_name || selectedItem.operator;
            renderMessage('bot', `Booking confirmed! ${modeName} selected for Rs.${selectedItem.price}. Your booking reference is ${bookingRef}. Have a great trip!`);
        } else {
            renderMessage('bot', result.detail || 'Unable to confirm booking. Please try again.');
        }
    } catch (error) {
        renderMessage('bot', 'Unable to connect to the server for confirmation.');
    }
}

function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'AI';
    avatar.style.background = 'var(--bg-tertiary)';
    avatar.style.color = 'var(--accent)';
    avatar.style.border = '1px solid var(--border)';

    const dots = document.createElement('div');
    dots.className = 'typing-dots';
    dots.innerHTML = '<span></span><span></span><span></span>';

    typingDiv.appendChild(avatar);
    typingDiv.appendChild(dots);
    chatArea.appendChild(typingDiv);
    scrollToBottom();
}

function hideTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
}

function scrollToBottom() {
    chatArea.scrollTop = chatArea.scrollHeight;
}

// ===== API (Standard) =====
async function sendMessageStandard(text) {
    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: state.userId, message: text })
        });

        const result = await response.json();
        hideTyping();

        if (result.data && result.data.results) {
            renderMessage('bot', result.reply, result.data);
        } else {
            renderMessage('bot', result.reply);
        }
    } catch (error) {
        hideTyping();
        renderMessage('bot', 'Unable to connect to the server. Please make sure the backend is running.');
    }
}

// ===== API (Streaming via SSE) =====
async function sendMessageStreaming(text) {
    try {
        const response = await fetch(`${API_URL}/chat/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: state.userId, message: text })
        });

        hideTyping();

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamingContent = null;
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line in buffer

            let eventType = '';
            for (const line of lines) {
                if (line.startsWith('event: ')) {
                    eventType = line.slice(7).trim();
                } else if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6);
                    try {
                        const data = JSON.parse(dataStr);

                        if (eventType === 'token') {
                            if (!streamingContent) {
                                streamingContent = createStreamingMessage();
                            }
                            fullText += data.token;
                            streamingContent.textContent = fullText;
                            scrollToBottom();
                        } else if (eventType === 'complete') {
                            renderMessage('bot', data.reply);
                        } else if (eventType === 'results') {
                            if (data.data && data.data.results) {
                                renderMessage('bot', data.reply, data.data);
                            } else {
                                renderMessage('bot', data.reply);
                            }
                        } else if (eventType === 'done') {
                            if (streamingContent && fullText) {
                                finalizeStreamingMessage(fullText);
                            }
                        } else if (eventType === 'error') {
                            renderMessage('bot', data.message || 'Something went wrong.');
                        }
                    } catch (e) {
                        // Skip malformed JSON
                    }
                }
            }
        }

        // Handle any remaining text
        if (streamingContent && fullText && !document.getElementById('streaming-message')) {
            // Already finalized
        } else if (streamingContent && fullText) {
            finalizeStreamingMessage(fullText);
        }

    } catch (error) {
        hideTyping();
        // Fallback to standard API
        await sendMessageStandard(text);
    }
}

// ===== Send Message (router) =====
async function sendMessage(text) {
    if (!text.trim() || state.isLoading) return;

    state.isLoading = true;
    sendBtn.disabled = true;

    renderMessage('user', text);
    messageInput.value = '';
    showTyping();

    if (USE_STREAMING) {
        await sendMessageStreaming(text);
    } else {
        await sendMessageStandard(text);
    }

    state.isLoading = false;
    sendBtn.disabled = false;
    messageInput.focus();
}

// ===== Booking History Panel =====
async function toggleBookingHistory() {
    const existing = document.getElementById('booking-panel');
    if (existing) {
        existing.remove();
        return;
    }

    const panel = document.createElement('div');
    panel.id = 'booking-panel';
    panel.className = 'booking-panel';
    panel.innerHTML = '<div class="booking-panel-header"><h3>My Bookings</h3><button class="close-panel" id="close-booking-panel">&times;</button></div><div class="booking-panel-body"><p class="loading-text">Loading...</p></div>';
    document.querySelector('.app-container').appendChild(panel);

    document.getElementById('close-booking-panel').addEventListener('click', () => panel.remove());

    try {
        const response = await fetch(`${API_URL}/bookings/${state.userId}`);
        const result = await response.json();
        const body = panel.querySelector('.booking-panel-body');

        if (result.bookings && result.bookings.length > 0) {
            body.innerHTML = '';
            result.bookings.forEach(b => {
                const statusClass = b.status === 'confirmed' ? 'status-confirmed' : b.status === 'cancelled' ? 'status-cancelled' : 'status-searched';
                const card = document.createElement('div');
                card.className = 'booking-history-card';
                card.innerHTML = `
                    <div class="bh-header">
                        <span class="bh-ref">${b.booking_ref}</span>
                        <span class="bh-status ${statusClass}">${b.status}</span>
                    </div>
                    <div class="bh-route">${b.source} &rarr; ${b.destination}</div>
                    <div class="bh-details">${b.mode} | ${b.travel_date} | Rs.${b.total_price || '-'}</div>
                `;
                body.appendChild(card);
            });
        } else {
            body.innerHTML = '<p class="no-bookings">No bookings yet. Start by booking a flight, train, or bus!</p>';
        }
    } catch (error) {
        panel.querySelector('.booking-panel-body').innerHTML = '<p class="no-bookings">Unable to load bookings.</p>';
    }
}

// ===== Dynamic Quick Actions =====
async function loadQuickActions() {
    try {
        const response = await fetch(`${API_URL}/quick-actions`);
        const result = await response.json();
        if (result.actions && welcomeContainer) {
            const actionsDiv = welcomeContainer.querySelector('.quick-actions');
            if (actionsDiv) {
                actionsDiv.innerHTML = '';
                result.actions.forEach(action => {
                    const btn = document.createElement('button');
                    btn.className = 'quick-btn';
                    btn.dataset.message = action.message;
                    btn.textContent = action.label;
                    actionsDiv.appendChild(btn);
                });
                attachQuickActions(welcomeContainer);
            }
        }
    } catch (e) {
        // Silently fail — hardcoded actions remain
    }
}

// ===== Event Listeners =====
sendBtn.addEventListener('click', () => {
    sendMessage(messageInput.value);
});

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(messageInput.value);
    }
});

// Quick action buttons
function attachQuickActions(container) {
    container.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            sendMessage(btn.dataset.message);
        });
    });
}
attachQuickActions(document);

// New chat
newChatBtn.addEventListener('click', () => {
    state.userId = generateUserId();
    state.messages = [];
    localStorage.removeItem(STORAGE_KEY);
    chatArea.innerHTML = '';

    const welcome = document.createElement('div');
    welcome.className = 'welcome-container';
    welcome.id = 'welcome-container';
    welcome.innerHTML = `
        <div class="welcome-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
            </svg>
        </div>
        <h2>Welcome to TravelAI</h2>
        <p>Your AI-powered travel assistant. Book flights, trains, buses, or ask travel questions.</p>
        <div class="quick-actions">
            <button class="quick-btn" data-message="Book a flight from Delhi to Mumbai">Book a Flight</button>
            <button class="quick-btn" data-message="Book a train from Bangalore to Chennai">Book a Train</button>
            <button class="quick-btn" data-message="What is the cabin baggage limit for domestic flights?">Baggage Rules</button>
            <button class="quick-btn" data-message="How do I book tatkal tickets on IRCTC?">IRCTC Help</button>
        </div>
    `;
    chatArea.appendChild(welcome);
    welcomeContainer = welcome;
    attachQuickActions(welcome);
    loadQuickActions();
});

// ===== Download Chat =====
function downloadChat() {
    if (state.messages.length === 0) return;

    let text = 'TravelAI Chat Export\n' + '='.repeat(40) + '\n\n';
    state.messages.forEach(msg => {
        const label = msg.role === 'user' ? 'You' : 'TravelAI';
        text += `${label}: ${msg.content}\n\n`;
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'travelai-chat.txt';
    a.click();
    URL.revokeObjectURL(url);
}

document.getElementById('download-chat-btn').addEventListener('click', downloadChat);

// Booking history button
const bookingHistoryBtn = document.getElementById('booking-history-btn');
if (bookingHistoryBtn) {
    bookingHistoryBtn.addEventListener('click', toggleBookingHistory);
}

// ===== Voice =====
const voice = window.voiceInput;

voice.onStart = () => {
    voiceBtn.classList.add('recording');
    voiceStatus.textContent = 'Listening... Speak now';
};

voice.onStop = () => {
    voiceBtn.classList.remove('recording');
    voiceStatus.textContent = '';
};

voice.onResult = (transcript) => {
    messageInput.value = transcript;
    voiceStatus.textContent = '';
    sendMessage(transcript);
};

voice.onError = (message) => {
    voiceStatus.textContent = message;
    setTimeout(() => { voiceStatus.textContent = ''; }, 3000);
};

voiceBtn.addEventListener('click', () => {
    voice.toggle();
});

// ===== Restore previous chat on load =====
const savedMessages = loadMessages();
if (savedMessages && savedMessages.length > 0) {
    savedMessages.forEach(msg => {
        renderMessage(msg.role, msg.content, msg.data, false);
    });
    state.messages = savedMessages;
} else {
    messageInput.focus();
    loadQuickActions();
}
