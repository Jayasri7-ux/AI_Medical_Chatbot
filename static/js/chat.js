/* static/js/chat.js */
document.addEventListener('DOMContentLoaded', function () {
    const chatContainer = document.getElementById('chat-history');
    const queryInput = document.getElementById('query-input');
    const fileInput = document.getElementById('file-upload');
    const submitBtn = document.getElementById('submit-query');
    const voiceBtn = document.getElementById('voice-btn');
    const fileNameDisplay = document.getElementById('file-name-display');
    const uploadArea = document.getElementById('upload-area');
    const sessionList = document.getElementById('session-list');
    const currentSessionTitle = document.getElementById('current-session-title');
    const languageSelector = document.getElementById('language-selector');

    let isRecording = false;
    let recognition;
    let mediaRecorder;
    let audioChunks = [];
    let currentSessionId = null;
    let currentLanguage = 'English';

    const translations = {
        'English': {
            newConversation: 'New Conversation',
            historyTitle: 'History',
            clearHistory: 'Clear All History',
            newConversationTitle: 'New Conversation',
            welcomeMessage: '<p>Welcome to <strong>MediLumina</strong>. I can help you analyze medical reports, documents, or answer your health-related questions. How can I assist you today?</p>',
            typeQuery: 'Type your medical query...',
            sendMessage: 'Send message',
            disclaimer: '<i class="fas fa-info-circle mr-1"></i> For informational purposes only. Consult a medical professional for serious concerns.',
            readyNewConv: "Welcome back! I'm ready for a new conversation. How can I help you with your medical queries today?",
            uploadedDoc: "Uploaded a document for analysis."
        },
        'Telugu': {
            newConversation: 'కొత్త సంభాషణ',
            historyTitle: 'చరిత్ర',
            clearHistory: 'చరిత్ర మొత్తం క్లియర్ చేయండి',
            newConversationTitle: 'కొత్త సంభాషణ',
            welcomeMessage: '<p><strong>MediLumina</strong> కు స్వాగతం. నేను మీ వైద్య నివేదికలను విశ్లేషించగలను లేదా మీ ప్రశ్నలకు సమాధానం ఇవ్వగలను. నేను మీకు ఎలా సహాయపడగలను?</p>',
            typeQuery: 'మీ వైద్య ప్రశ్నను టైప్ చేయండి...',
            sendMessage: 'సందేశం పంపండి',
            disclaimer: '<i class="fas fa-info-circle mr-1"></i> సమాచార ప్రయోజనాల కోసం మాత్రమే. తీవ్రమైన ఆందోళనల కోసం వైద్యుడిని సంప్రదించండి.',
            readyNewConv: "కొత్త సంభాషణకు సిద్ధంగా ఉన్నాను. నేను మీకు నేడు ఎలా సహాయపడగలను?",
            uploadedDoc: "విశ్లేషణ కోసం పత్రం అప్‌లోడ్ చేయబడింది."
        },
        'Hindi': {
            newConversation: 'नई बातचीत',
            historyTitle: 'इतिहास',
            clearHistory: 'पूरा इतिहास मिटाएं',
            newConversationTitle: 'नई बातचीत',
            welcomeMessage: '<p><strong>MediLumina</strong> में आपका स्वागत है। मैं आपकी मेडिकल रिपोर्ट का विश्लेषण करने या आपके स्वास्थ्य संबंधी सवालों के जवाब देने में मदद कर सकता हूँ। मैं आपकी कैसे मदद कर सकता हूँ?</p>',
            typeQuery: 'अपना मेडिकल प्रश्न टाइप करें...',
            sendMessage: 'संदेश भेजें',
            disclaimer: '<i class="fas fa-info-circle mr-1"></i> केवल सूचनात्मक उद्देश्यों के लिए। गंभीर चिंताओं के लिए चिकित्सा पेशेवर से परामर्श लें।',
            readyNewConv: "नई बातचीत के लिए तैयार हूँ। मैं आज आपकी कैसे मदद कर सकता हूँ?",
            uploadedDoc: "विश्लेषण के लिए एक दस्तावेज़ अपलोड किया गया है।"
        }
    };

    function translateUI() {
        const lang = translations[currentLanguage];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (lang[key]) {
                el.innerHTML = lang[key];
            }
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (lang[key]) {
                el.placeholder = lang[key];
            }
        });

        if (typeof recognition !== 'undefined' && recognition) {
            recognition.lang = currentLanguage === 'English' ? 'en-US' : (currentLanguage === 'Telugu' ? 'te-IN' : 'hi-IN');
        }
    }

    if (languageSelector) {
        languageSelector.addEventListener('change', (e) => {
            currentLanguage = e.target.value;
            translateUI();
        });
    }

    // Initialize UI
    translateUI();

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = currentLanguage === 'English' ? 'en-US' : (currentLanguage === 'Telugu' ? 'te-IN' : 'hi-IN');

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            queryInput.value = transcript;
            console.log('Voice recognized:', transcript);
            stopRecording();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            let errorMessage = 'Voice input error';
            if (event.error === 'no-speech') {
                errorMessage = 'No speech detected. Please try again.';
            } else if (event.error === 'audio-capture') {
                errorMessage = 'Microphone not found. Please ensure microphone is connected.';
            } else if (event.error === 'not-allowed') {
                errorMessage = 'Microphone permission denied. Please allow microphone access.';
            } else if (event.error === 'network') {
                errorMessage = 'Network error. Please check your internet connection.';
            }
            alert(errorMessage);
            stopRecording();
        };

        recognition.onend = () => {
            // Ensure recording state is reset when recognition ends
            if (isRecording) {
                isRecording = false;
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                voiceBtn.classList.remove('animate-pulse');
            }
        };
    } else {
        console.warn('Speech Recognition not supported in this browser');
    }

    // Load Session List
    refreshSessions();

    async function refreshSessions() {
        try {
            const response = await fetch('/api/sessions');
            const sessions = await response.json();
            sessionList.innerHTML = '';
            sessions.forEach(session => {
                const item = document.createElement('div');
                item.className = `p-3 rounded-xl cursor-pointer transition-all hover:bg-white/5 text-sm ${currentSessionId === session.id ? 'bg-white/10 text-teal-400 border border-white/10 shadow-sm' : 'text-slate-400'}`;
                item.innerHTML = `
                    <div class="font-medium truncate">${session.title}</div>
                    <div class="text-[10px] opacity-50 mt-1">${new Date(session.timestamp).toLocaleDateString()}</div>
                `;
                item.onclick = () => loadSession(session.id);
                sessionList.appendChild(item);
            });
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    }

    async function loadSession(sessionId) {
        currentSessionId = sessionId;
        try {
            const response = await fetch(`/api/sessions/${sessionId}`);
            const data = await response.json();

            chatContainer.innerHTML = '';
            currentSessionTitle.textContent = data.title;
            currentSessionTitle.classList.remove('hidden');

            data.messages.forEach(msg => appendMessage(msg.role, msg.content, msg.timestamp));
            refreshSessions();
        } catch (error) {
            console.error('Error loading session:', error);
        }
    }

    window.newChat = () => {
        currentSessionId = null;
        const msgHTML = translations[currentLanguage].readyNewConv;
        chatContainer.innerHTML = `
            <div class="chat-bubble ai">
                <div class="prose prose-invert">
                    <p>${msgHTML}</p>
                </div>
            </div>
        `;
        currentSessionTitle.textContent = translations[currentLanguage].newConversationTitle;
        queryInput.value = '';
        refreshSessions();
    };

    function appendMessage(role, content, timestamp) {
        if (!timestamp) timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const wrapper = document.createElement('div');
        wrapper.className = `flex flex-col ${role === 'user' ? 'items-end' : 'items-start'} space-y-1 mb-4 fade-in`;

        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${role} relative group`;

        const inner = document.createElement('div');
        inner.className = 'prose prose-invert max-w-none text-sm';
        inner.innerHTML = role === 'ai' ? marked.parse(content) : content;

        const timeTag = document.createElement('span');
        timeTag.className = 'text-[10px] text-muted px-1';
        timeTag.textContent = timestamp;

        bubble.appendChild(inner);

        if (role === 'ai') {
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'absolute top-2 right-2 p-1.5 text-slate-400 hover:text-teal-400 transition-colors bg-slate-800/80 rounded-md backdrop-blur-sm border border-white/5';
            downloadBtn.innerHTML = '<i class="fas fa-download text-xs"></i>';
            downloadBtn.title = "Download Response";
            downloadBtn.onclick = () => window.downloadText(content, `MediLumina_Response_${timestamp.replace(/[: ]/g, '_')}.txt`);
            bubble.appendChild(downloadBtn);
        }

        wrapper.appendChild(bubble);
        wrapper.appendChild(timeTag);

        chatContainer.appendChild(wrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    window.downloadText = (text, filename) => {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    // File Upload Interactions
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            fileNameDisplay.textContent = `📄 ${file.name}`;
            fileNameDisplay.classList.remove('hidden');
        }
    });

    // Voice Input Toggle
    if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
            if (isRecording) {
                stopRecording();
            } else {
                if (recognition) {
                    startRecording();
                } else if (window.MediaRecorder) {
                    startRecordingFallback();
                } else {
                    alert('Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge for voice input functionality.');
                }
            }
        });
    }

    function startRecording() {
        try {
            isRecording = true;
            voiceBtn.innerHTML = '<i class="fas fa-stop text-red-500"></i>';
            voiceBtn.classList.add('animate-pulse');
            recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            isRecording = false;
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceBtn.classList.remove('animate-pulse');
            alert('Failed to start voice recording. Please try again.');
        }
    }

    async function startRecordingFallback() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('file', audioBlob, 'recording.webm');

                voiceBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-teal-400"></i>';

                try {
                    const response = await fetch('/api/transcribe', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await response.json();
                    if (data.transcript) {
                        queryInput.value = data.transcript;
                    }
                } catch (error) {
                    console.error('Transcription error:', error);
                    alert('Failed to transcribe audio.');
                } finally {
                    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                    voiceBtn.classList.remove('animate-pulse');
                }
            };

            mediaRecorder.start();
            isRecording = true;
            voiceBtn.innerHTML = '<i class="fas fa-stop text-red-500"></i>';
            voiceBtn.classList.add('animate-pulse');
        } catch (error) {
            console.error('Error starting fallback recording:', error);
            alert('Microphone access denied or not available.');
        }
    }

    function stopRecording() {
        isRecording = false;
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceBtn.classList.remove('animate-pulse');

        if (recognition) {
            recognition.stop();
        } else if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }

    // Submit Query
    submitBtn.addEventListener('click', async () => {
        const query = queryInput.value.trim();
        const file = fileInput.files[0];

        if (!query && !file) return;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        appendMessage('user', query || translations[currentLanguage].uploadedDoc);

        const formData = new FormData();
        if (query) formData.append('query', query);
        if (file) formData.append('file', file);
        if (currentSessionId) formData.append('session_id', currentSessionId);
        formData.append('language', currentLanguage);

        try {
            const response = await fetch('/api/upload_and_query', { method: 'POST', body: formData });
            const data = await response.json();

            if (response.ok) {
                currentSessionId = data.session_id;
                appendMessage('ai', data.response, data.timestamp);
                refreshSessions();
            } else {
                appendMessage('ai', `❌ Error: ${data.detail || 'Server error'}`);
            }
        } catch (error) {
            appendMessage('ai', '❌ Connection error. Please check your network.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
            queryInput.value = '';
            fileInput.value = '';
            fileNameDisplay.classList.add('hidden');
        }
    });

    queryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitBtn.click();
        }
    });

    window.clearAllHistory = async () => {
        if (confirm('Are you sure you want to permanently delete all chat history? This cannot be undone.')) {
            try {
                const response = await fetch('/api/sessions', { method: 'DELETE' });
                if (response.ok) {
                    newChat();
                    refreshSessions();
                }
            } catch (error) {
                console.error('Error clearing history:', error);
            }
        }
    };
});
