import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import axios from 'axios';

// Helper to detect Hindi / Devanagari or Hinglish in text
function detectLanguage(text, activeLang = 'en') {
  if (!text) return activeLang;
  // Devanagari Unicode block: \u0900-\u097F
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  
  // Common Hinglish / Romanized Hindi keywords and markers
  const hindiKeywords = [
    'meri', 'mera', 'mere', 'mujhe', 'hum', 'kya', 'hai', 'hain', 'ho', 'kaise', 'karo', 'kare', 'karein',
    'chhatravritti', 'scholarship', 'yojana', 'patrata', 'aavedan', 'padhai', 'batao', 'bataiye',
    'milega', 'milenge', 'kab', 'kaun', 'kitna', 'kitni', 'chahiye', 'dastavez', 'kagaz', 'suchi', 'form', 'namaste'
  ];
  const words = text.toLowerCase().split(/\s+/);
  const matchCount = words.filter(w => hindiKeywords.includes(w)).length;
  const strongHindiMarkers = ['kya', 'kaise', 'chahiye', 'milega', 'milenge', 'batao', 'bataiye', 'meri', 'mera', 'mujhe', 'patrata', 'yojana', 'aavedan', 'chhatravritti'];
  
  if (matchCount >= 2 || words.some(w => strongHindiMarkers.includes(w))) {
    return 'hi';
  }

  // If user explicitly has 'hi' selected in the portal or header, preserve 'hi'
  if (activeLang === 'hi') {
    return 'hi';
  }

  return 'en';
}

export default function EduTribeAssistant() {
  const { language, setLanguage } = useLanguage();
  const lang = language || 'en';
  const setLang = (newLang) => {
    if (typeof setLanguage === 'function') {
      setLanguage(newLang);
    }
  };
  const { user } = useAuth();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice states: 'idle' | 'listening' | 'processing' | 'speaking'
  const [voiceState, setVoiceState] = useState('idle');
  const [speechSupported, setSpeechSupported] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const voicesRef = useRef([]);
  const handleSendRef = useRef(null);
  const currentTranscriptRef = useRef('');
  const silenceTimerRef = useRef(null);

  // Load browser TTS voices
  const populateVoices = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      voicesRef.current = window.speechSynthesis.getVoices();
    }
  };

  // Initialize Speech Recognition & Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';

        recognition.onresult = (event) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; ++i) {
            fullTranscript += event.results[i][0].transcript;
          }
          const trimmed = fullTranscript.trim();
          if (trimmed) {
            currentTranscriptRef.current = trimmed;
            setInput(trimmed); // Immediately update input field in real time

            // Auto-send after 1.8 seconds of silence
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) {}
              }
              const finalQuery = currentTranscriptRef.current.trim();
              if (finalQuery && handleSendRef.current) {
                setVoiceState('processing');
                currentTranscriptRef.current = '';
                handleSendRef.current(finalQuery, 'voice');
              }
            }, 1800);
          }
        };

        recognition.onerror = (e) => {
          console.warn("Speech recognition error:", e.error);
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

          const finalQuery = currentTranscriptRef.current.trim() || input.trim();
          if (finalQuery && (e.error === 'no-speech' || e.error === 'network')) {
            if (handleSendRef.current) {
              setVoiceState('processing');
              currentTranscriptRef.current = '';
              handleSendRef.current(finalQuery, 'voice');
              return;
            }
          }

          if (e.error === 'not-allowed') {
            alert(lang === 'hi'
              ? 'माइक्रोफ़ोन की अनुमति अस्वीकृत है। कृपया ब्राउज़र सेटिंग्स में माइक्रोफ़ोन की अनुमति दें।'
              : 'Microphone permission was denied. Please allow microphone access in your browser.');
          }
          setVoiceState('idle');
        };

        recognition.onend = () => {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          const finalQuery = currentTranscriptRef.current.trim();
          if (finalQuery && handleSendRef.current) {
            setVoiceState('processing');
            currentTranscriptRef.current = '';
            handleSendRef.current(finalQuery, 'voice');
          } else {
            setVoiceState(prev => (prev === 'listening' ? 'idle' : prev));
          }
        };

        recognitionRef.current = recognition;
        setSpeechSupported(true);
      }

      if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
        populateVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = populateVoices;
        }
      }
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  // Synchronize recognition language when user switches language
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    }
  }, [lang]);

  // Update initial welcome message when opened or language changed
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMsg = lang === 'hi'
        ? "👋 नमस्ते! मैं EduTribe असिस्टेंट हूँ।\n\nमैं छात्रवृत्ति, पात्रता, आवश्यक दस्तावेज़ों और आवेदन प्रक्रिया में आपकी सहायता कर सकता हूँ।"
        : "👋 Hello! I'm the EduTribe Assistant.\n\nI can help you understand scholarships, eligibility, documents, and application processes.";
      setMessages([{ id: 'welcome', sender: 'ai', text: welcomeMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }
  }, [lang, messages.length]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, voiceState]);

  // Quick Action Questions
  const quickQuestions = lang === 'hi' ? [
    { label: "मेरी पात्रता जांचें", query: "मैं अपनी पात्रता कैसे जांच सकता हूँ और इसके क्या नियम हैं?" },
    { label: "आवश्यक दस्तावेज़", query: "छात्रवृत्ति आवेदन के लिए कौन से दस्तावेज़ आवश्यक हैं?" },
    { label: "आवेदन कैसे करें?", query: "EduTribe पोर्टल पर आवेदन करने की प्रक्रिया क्या है?" },
    { label: "NFST फेलोशिप क्या है?", query: "NFST फेलोशिप क्या है और इसके क्या लाभ हैं?" },
    { label: "आवेदन की स्थिति", query: "मैं अपने आवेदन की स्थिति कैसे ट्रैक करूँ?" },
    { label: "टॉप क्लास योजना", query: "टॉप क्लास शिक्षा छात्रवृत्ति के क्या लाभ और नियम हैं?" }
  ] : [
    { label: "Check My Eligibility", query: "How do I check my eligibility and what are the key criteria?" },
    { label: "Required Documents", query: "What documents do I need to apply for scholarships?" },
    { label: "How Do I Apply?", query: "What are the step-by-step instructions to submit an application?" },
    { label: "What is NFST?", query: "What is NFST fellowship and what are its benefits?" },
    { label: "Track My Application", query: "How can I track my application status and verification stages?" },
    { label: "Top Class Scheme", query: "What are the benefits and rules for Top Class Education Scholarship?" }
  ];

  const getPageContext = () => {
    const path = location.pathname;
    let pageTitle = "Home / Portal";
    if (path.includes('/eligibility')) pageTitle = "Eligibility Checker";
    else if (path.includes('/applicant')) pageTitle = "Applicant Dashboard & Application Management";
    else if (path.includes('/officer')) pageTitle = "Institute Verification Portal";
    else if (path.includes('/admin')) pageTitle = "Ministry Administrative Portal";

    return {
      current_page: path,
      page_title: pageTitle,
      user_role: user?.role || 'GUEST',
    };
  };

  /**
   * Main send handler:
   * @param {string} messageText - The message to send
   * @param {'text'|'voice'} inputMode - Whether user typed ('text') or used microphone ('voice')
   */
  const handleSend = async (messageText, inputMode = 'text') => {
    const textToSend = (typeof messageText === 'string' ? messageText : input).trim();
    if (!textToSend || isLoading) return;

    // Stop speaking if currently speaking
    stopSpeaking();

    // Auto-detect language of latest message respecting active selection
    const detectedLang = detectLanguage(textToSend, lang);
    if (detectedLang !== lang) {
      setLang(detectedLang);
    }

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: inputMode
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    if (inputMode === 'voice') {
      setVoiceState('processing');
    }

    try {
      const formattedHistory = messages
        .filter(m => m.id !== 'welcome')
        .slice(-6)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          message: m.text
        }));

      const payload = {
        message: textToSend,
        language: detectedLang,
        context: getPageContext(),
        history: formattedHistory,
        input_mode: inputMode
      };

      let response;
      try {
        response = await api.post('/ai/chat/', payload);
      } catch (apiErr) {
        response = await axios.post('/api/ai/chat/', payload);
      }

      const replyText = response.data?.reply || (detectedLang === 'hi' 
        ? "माफ़ कीजिये, अभी जानकारी प्राप्त करने में असमर्थ हूँ।" 
        : "I couldn't retrieve the requested information right now.");

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lang: detectedLang
      };

      setMessages(prev => [...prev, aiMsg]);

      // CRITICAL RULE:
      // If inputMode === 'voice', simultaneously trigger Speech Playback
      if (inputMode === 'voice') {
        playSpeech(replyText, detectedLang);
      } else {
        setVoiceState('idle');
      }

    } catch (error) {
      const errorMsg = detectedLang === 'hi'
        ? "EduTribe असिस्टेंट अस्थायी रूप से अनुपलब्ध है। कृपया कुछ समय बाद पुनः प्रयास करें।"
        : "EduTribe Assistant is temporarily unavailable. Please try again later.";

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: errorMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setVoiceState('idle');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  // Toggle Microphone for Voice Input
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (voiceState === 'speaking') {
      stopSpeaking();
      return;
    }

    if (voiceState === 'listening') {
      // User tapped mic button to stop speaking: send whatever was captured!
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      try {
        recognitionRef.current.stop();
      } catch (e) {}

      const textToSend = currentTranscriptRef.current.trim() || input.trim();
      if (textToSend && handleSendRef.current) {
        setVoiceState('processing');
        currentTranscriptRef.current = '';
        handleSendRef.current(textToSend, 'voice');
      } else {
        setVoiceState('idle');
      }
    } else {
      // Start voice listening
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      currentTranscriptRef.current = '';
      setInput('');

      try {
        recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
        recognitionRef.current.start();
        setVoiceState('listening');
      } catch (err) {
        console.warn("Speech recognition start note:", err);
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              recognitionRef.current.start();
              setVoiceState('listening');
            } catch (e) {}
          }, 150);
        } catch (e) {}
      }
    }
  };

  // Speak text aloud using browser Text-to-Speech (TTS)
  const playSpeech = (text, speechLang = lang) => {
    if (!synthRef.current) {
      setVoiceState('idle');
      return;
    }

    synthRef.current.cancel();

    // Clean markdown formatting for clear speech
    const cleanText = text
      .replace(/[*#_`>]/g, '')
      .replace(/•/g, '')
      .replace(/👉/g, '')
      .replace(/✓/g, '')
      .replace(/ℹ️/g, '')
      .replace(/https?:\/\/\S+/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = speechLang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick appropriate Hindi or English voice
    if (voicesRef.current.length > 0) {
      const targetLang = speechLang === 'hi' ? 'hi' : 'en';
      const matchedVoice = voicesRef.current.find(v => v.lang.startsWith(targetLang) || (speechLang === 'hi' && v.name.toLowerCase().includes('hindi')));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    utterance.onstart = () => {
      setVoiceState('speaking');
    };

    utterance.onend = () => {
      setVoiceState('idle');
    };

    utterance.onerror = () => {
      setVoiceState('idle');
    };

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setVoiceState('idle');
  };

  return (
    <>
      {/* Floating Action Button (Shown when Minimized) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-navy-900 hover:bg-navy-800 text-white p-3 sm:px-5 sm:py-3.5 rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95 border-2 border-blue-400/40 group focus:outline-none focus:ring-4 focus:ring-blue-500/30 cursor-pointer"
          aria-label="Open EduTribe AI Assistant"
          title="Open AI Assistant"
          style={{ backgroundColor: '#0f294a' }}
        >
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-lg shadow-inner group-hover:rotate-12 transition-transform">
            🤖
          </div>
          <div className="text-left hidden sm:block">
            <span className="block text-xs font-semibold text-blue-300 uppercase tracking-wider">
              {lang === 'hi' ? 'एआई सहायता' : 'AI Helpdesk'}
            </span>
            <span className="text-sm font-bold tracking-tight text-white">
              {lang === 'hi' ? 'EduTribe से पूछें' : 'Ask EduTribe'}
            </span>
          </div>
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </button>
      )}

      {/* Chat Window Panel (Expanded State) */}
      {isOpen && (
        <div 
          className="fixed bottom-0 right-0 sm:bottom-4 sm:right-4 z-50 w-full sm:w-[420px] max-w-full sm:max-w-[calc(100vw-2rem)] h-[85vh] sm:h-[min(520px,calc(100vh-2rem))] max-h-[calc(100vh-1rem)] rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl flex flex-col border border-slate-200 overflow-hidden transition-all duration-300 animate-fadeIn"
          style={{ minHeight: '320px' }}
        >
          {/* Header */}
          <div 
            className="text-white px-4 py-3 flex items-center justify-between shadow-md select-none shrink-0"
            style={{ backgroundColor: '#0f294a' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-lg shadow">
                🤖
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  EduTribe Assistant
                  <span className="text-[10px] bg-blue-500/20 text-blue-200 border border-blue-400/30 px-1.5 py-0.5 rounded font-mono font-medium">
                    MoTA AI
                  </span>
                </h2>
                <p className="text-[11px] text-blue-200 font-normal line-clamp-1">
                  {lang === 'hi' ? 'द्विभाषी टेक्स्ट और वॉइस असिस्टेंट' : 'Bilingual Text & Voice Assistant'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <button
                onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                className="text-[11px] font-bold px-2 py-1 rounded bg-blue-950/60 hover:bg-blue-900 border border-blue-400/40 text-blue-200 hover:text-white transition-colors cursor-pointer"
                title="Toggle Language"
              >
                {lang === 'en' ? 'हिंदी' : 'English'}
              </button>

              {/* Minimize / Collapse Button */}
              <button
                onClick={() => {
                  stopSpeaking();
                  if (voiceState === 'listening' && recognitionRef.current) {
                    try { recognitionRef.current.stop(); } catch (e) {}
                    setVoiceState('idle');
                  }
                  setIsOpen(false);
                }}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-colors text-2xl font-bold cursor-pointer"
                aria-label="Minimize chatbot"
                title="Minimize"
              >
                −
              </button>
            </div>
          </div>

          {/* Subheader Status / Context Indicator */}
          <div className="bg-blue-50 border-b border-blue-100 px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-600 shrink-0">
            <span className="flex items-center gap-1.5 text-navy-800 font-medium truncate">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              {lang === 'hi' ? 'सक्रिय पृष्ठ:' : 'Active Page:'} {getPageContext().page_title}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-500 text-[10px] font-medium hidden sm:inline">
                {voiceState === 'speaking' ? '🔊 Speaking' : voiceState === 'listening' ? '🔴 Listening' : 'Govt ST Portal'}
              </span>
              <button
                onClick={() => {
                  stopSpeaking();
                  if (voiceState === 'listening' && recognitionRef.current) {
                    try { recognitionRef.current.stop(); } catch (e) {}
                    setVoiceState('idle');
                  }
                  setIsOpen(false);
                }}
                className="px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-navy-900 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                aria-label="Minimize chatbot"
                title="Minimize"
              >
                <span>−</span>
                <span className="text-[10px] font-medium">{lang === 'hi' ? 'छोटा करें' : 'Minimize'}</span>
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  {msg.text}
                </div>

                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-[10px] text-slate-600 font-sans">
                    {msg.time}
                  </span>
                  {msg.mode === 'voice' && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-medium">
                      🎙️ Spoken
                    </span>
                  )}
                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => {
                        if (voiceState === 'speaking') {
                          stopSpeaking();
                        } else {
                          playSpeech(msg.text, msg.lang || lang);
                        }
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline font-medium"
                      title="Read Aloud"
                    >
                      {voiceState === 'speaking' ? '⏹️ Stop' : '🔊 Listen'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Voice / Thinking Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-2xl rounded-bl-xs text-xs flex items-center gap-2 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                  </div>
                  <span className="font-medium text-slate-600">
                    {voiceState === 'processing'
                      ? (lang === 'hi' ? 'वॉइस प्रोसेस हो रहा है...' : '⏳ Processing voice...')
                      : (lang === 'hi' ? 'EduTribe असिस्टेंट सोच रहा है...' : 'EduTribe Assistant is thinking...')}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Dynamic Voice Status Bar */}
          {voiceState !== 'idle' && (
            <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between text-xs animate-fadeIn shrink-0">
              <div className="flex items-center gap-2">
                {voiceState === 'listening' && (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping"></span>
                    <span className="font-semibold">{lang === 'hi' ? '🔴 सुन रहा हूँ... बोलिए' : '🔴 Listening... Speak now'}</span>
                  </>
                )}
                {voiceState === 'processing' && (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span className="font-semibold">{lang === 'hi' ? 'प्रोसेसिंग...' : 'Processing your voice question...'}</span>
                  </>
                )}
                {voiceState === 'speaking' && (
                  <>
                    <span className="animate-pulse">🔊</span>
                    <span className="font-semibold">{lang === 'hi' ? 'उत्तर बोल रहा हूँ...' : 'Speaking answer aloud...'}</span>
                  </>
                )}
              </div>
              {voiceState === 'speaking' && (
                <button
                  onClick={stopSpeaking}
                  className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer"
                >
                  ⏹ Stop Voice
                </button>
              )}
            </div>
          )}

          {/* Quick Questions Pills */}
          <div className="p-2.5 bg-white border-t border-slate-100 shrink-0">
            <div className="text-[11px] font-semibold text-slate-500 mb-1.5 px-1 flex items-center justify-between">
              <span>{lang === 'hi' ? 'त्वरित प्रश्न:' : 'Suggested Questions:'}</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q.query, 'text')}
                  disabled={isLoading}
                  className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box Footer */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (silenceTimerRef.current) {
                  clearTimeout(silenceTimerRef.current);
                  silenceTimerRef.current = null;
                }
                if (voiceState === 'listening' && recognitionRef.current) {
                  try { recognitionRef.current.stop(); } catch (err) {}
                  const query = currentTranscriptRef.current.trim() || input.trim();
                  currentTranscriptRef.current = '';
                  handleSend(query, 'voice');
                } else {
                  handleSend(input, 'text');
                }
              }}
              className="flex items-center gap-2"
            >
              {/* Voice input microphone button */}
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-base transition-all shrink-0 cursor-pointer ${
                    voiceState === 'listening'
                      ? 'bg-red-500 text-white animate-pulse shadow-md ring-4 ring-red-200'
                      : voiceState === 'speaking'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200'
                  }`}
                  title={
                    voiceState === 'listening' 
                      ? (lang === 'hi' ? 'सुन रहा हूँ... रोकने या भेजने के लिए दबाएँ' : 'Listening... Click to send speech') 
                      : (lang === 'hi' ? 'बोलने के लिए माइक दबाएँ' : 'Tap microphone to speak')
                  }
                  aria-label="Voice input"
                >
                  {voiceState === 'listening' ? '🔴' : voiceState === 'speaking' ? '🔊' : '🎙️'}
                </button>
              )}

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  voiceState === 'listening'
                    ? (lang === 'hi' ? '🔴 सुन रहा हूँ... बोलिए (माइक से भेजें)' : '🔴 Listening... Speak now (tap mic to send)')
                    : (lang === 'hi' ? 'छात्रवृत्ति के बारे में पूछें...' : 'Ask about scholarships, eligibility...')
                }
                disabled={isLoading}
                className="flex-1 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-full px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />

              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                  }
                  if (voiceState === 'listening' && recognitionRef.current) {
                    try { recognitionRef.current.stop(); } catch (err) {}
                    const query = currentTranscriptRef.current.trim() || input.trim();
                    currentTranscriptRef.current = '';
                    handleSend(query, 'voice');
                  } else {
                    handleSend(input, 'text');
                  }
                }}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shrink-0 shadow-sm active:scale-95 cursor-pointer"
                aria-label="Send message"
                title="Send message"
              >
                <svg className="w-4 h-4 transform rotate-90 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
