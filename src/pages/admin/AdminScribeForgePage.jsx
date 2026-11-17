import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  Upload,
  Link as LinkIcon,
  Layers,
  Play,
  Pause,
  Clock,
  FileText,
  Search,
  Plus,
  Moon,
  Sun,
  Bell,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Download,
  Share2,
  Send,
  Trash2,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Volume2,
  VolumeX,
  FileAudio,
  Radio,
  Sliders,
  Check,
  ChevronRight,
  Loader2,
  X,
  Settings
} from 'lucide-react';
import { toBengaliNumber } from '../../utils/bengaliFormatter.js';
import sweetAlert from '../../utils/sweetAlert.js';
import { useCreateNewsMutation } from '../../store/api/newsApi.js';
import { EDITORIAL_EASE } from '../../components/common/MotionPrimitives.jsx';

// Initial Mock Seed Data matching the screenshot precisely
const INITIAL_TRANSCRIPTS = [
  {
    id: 'tr-1',
    title: 'Ninja Subtitler pro',
    source: 'C:\\Users\\Eagle\\Desktop\\Ninja Subtitler pro.mp4',
    fileName: 'Ninja Subtitler pro.mp4',
    duration: '20:03',
    durationSeconds: 1203,
    timeAgo: '5h ago',
    status: 'Completed',
    wordsCount: 2840,
    language: 'বাংলা (Bengali)',
    speakerCount: 2,
    segments: [
      { time: '00:00:02', speaker: 'বক্তা ১ (উপস্থাপক)', text: 'শুভ অপরাহ্ন দর্শক, আমাদের আজকের বিশেষ আয়োজনে স্বাগত জানাচ্ছি।' },
      { time: '00:00:18', speaker: 'বক্তা ২ (বিশেষজ্ঞ)', text: 'ধন্যবাদ আপনাকে। সমসাময়িক অর্থনীতি ও প্রযুক্তির এই পরিবর্তন নিয়ে কথা বলা খুবই সময়োপযোগী।' },
      { time: '00:00:45', speaker: 'বক্তা ১ (উপস্থাপক)', text: 'আমরা দেখতে পাচ্ছি ডিজিটাল মিডিয়া এবং এআই টুলসের ব্যবহার গণমাধ্যমে আমূল পরিবর্তন এনেছে।' },
      { time: '00:01:20', speaker: 'বক্তা ২ (বিশেষজ্ঞ)', text: 'ঠিক তাই। বিশেষ করে রিয়েলটাইম ট্রানস্ক্রিপশন ও সাবটাইটেলিং এখন সাংবাদিকদের কাজের সময় অর্ধেক কমিয়ে দিয়েছে।' }
    ]
  },
  {
    id: 'tr-2',
    title: 'Ninja Subtitler pro',
    source: 'C:\\Users\\Eagle\\Desktop\\Ninja Subtitler pro.mp4',
    fileName: 'Ninja Subtitler pro.mp4',
    duration: '--:--',
    durationSeconds: 0,
    timeAgo: '5h ago',
    status: 'Failed',
    errorReason: 'অডিও চ্যানেল করাপ্টেড বা অসমর্থিত ফরম্যাট',
    wordsCount: 0,
    language: 'English',
    speakerCount: 0,
    segments: []
  },
  {
    id: 'tr-3',
    title: 'Ninja Subtitler pro',
    source: 'C:\\Users\\Eagle\\Desktop\\Ninja Subtitler pro.mp4',
    fileName: 'Ninja Subtitler pro.mp4',
    duration: '--:--',
    durationSeconds: 0,
    timeAgo: '5h ago',
    status: 'Failed',
    errorReason: 'টাইমআউট: ফাইল আপলোড প্রক্রিয়া ব্যাহত হয়েছিল',
    wordsCount: 0,
    language: 'English',
    speakerCount: 0,
    segments: []
  },
  {
    id: 'tr-4',
    title: '0403',
    source: 'C:\\Users\\Eagle\\Desktop\\0403.mp4',
    fileName: '0403.mp4',
    duration: '00:23',
    durationSeconds: 23,
    timeAgo: '5h ago',
    status: 'Completed',
    wordsCount: 82,
    language: 'বাংলা (Bengali)',
    speakerCount: 1,
    segments: [
      { time: '00:00:01', speaker: 'রিপোর্টার', text: 'রাজধানীর ফার্মগেট এলাকায় মেট্রোরেলের নতুন ওভারপাস উদ্বোধনের প্রস্তুতি চলছে।' },
      { time: '00:00:12', speaker: 'রিপোর্টার', text: 'কর্মকর্তারা জানিয়েছেন, আগামী সপ্তাহ থেকেই সর্বসাধারণের জন্য এটি উন্মুক্ত করে দেওয়া হবে।' }
    ]
  },
  {
    id: 'tr-5',
    title: '0403-copy',
    source: 'C:\\Users\\Eagle\\Desktop\\0403-copy.mp4',
    fileName: '0403-copy.mp4',
    duration: '00:23',
    durationSeconds: 23,
    timeAgo: '8h ago',
    status: 'Completed',
    wordsCount: 82,
    language: 'বাংলা (Bengali)',
    speakerCount: 1,
    segments: [
      { time: '00:00:01', speaker: 'রিপোর্টার', text: 'রাজধানীর ফার্মগেট এলাকায় মেট্রোরেলের নতুন ওভারপাস উদ্বোধনের প্রস্তুতি চলছে।' },
      { time: '00:00:12', speaker: 'রিপোর্টার', text: 'কর্মকর্তারা জানিয়েছেন, আগামী সপ্তাহ থেকেই সর্বসাধারণের জন্য এটি উন্মুক্ত করে দেওয়া হবে।' }
    ]
  }
];

export function AdminScribeForgePage() {
  const authState = useSelector((state) => state.auth || {});
  const [transcripts, setTranscripts] = useState(() => {
    try {
      const stored = localStorage.getItem('daily_prabaho_scribeforge_transcripts');
      return stored ? JSON.parse(stored) : INITIAL_TRANSCRIPTS;
    } catch {
      return INITIAL_TRANSCRIPTS;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'transcribe' | 'batch' | 'live' | 'all' | 'ai_tools' | 'settings'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Completed' | 'Failed'
  const searchInputRef = useRef(null);
  
  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [liveModalOpen, setLiveModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [aiToolsModalOpen, setAiToolsModalOpen] = useState(false);
  const [inspectorItem, setInspectorItem] = useState(null);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadLang, setUploadLang] = useState('bn');
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  // URL Input State
  const [mediaUrl, setMediaUrl] = useState('');
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);

  // Live Microphone State (Web Speech API / SpeechRecognition)
  const [isLiveListening, setIsLiveListening] = useState(false);
  const [liveTranscriptText, setLiveTranscriptText] = useState('');
  const recognitionRef = useRef(null);

  // Inspector & Playback State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);

  const [createNewsMutation, { isLoading: isSendingToCms }] = useCreateNewsMutation();

  // Ctrl+K Global Shortcut Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Simulated Playback Timer advancing segments
  useEffect(() => {
    let interval = null;
    if (isPlayingAudio && inspectorItem?.segments?.length) {
      interval = setInterval(() => {
        setActiveSegmentIndex((prev) => (prev + 1) % inspectorItem.segments.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio, inspectorItem]);

  // Persist transcripts
  const persistTranscripts = (items) => {
    setTranscripts(items);
    try {
      localStorage.setItem('daily_prabaho_scribeforge_transcripts', JSON.stringify(items));
    } catch {
      // Ignore
    }
  };

  // Metrics Math
  const metrics = useMemo(() => {
    const totalCount = transcripts.length;
    const completedList = transcripts.filter((t) => t.status === 'Completed');
    const totalSeconds = completedList.reduce((acc, t) => acc + (t.durationSeconds || 0), 0);
    const totalHours = (totalSeconds / 3600).toFixed(1);
    const totalMinutes = Math.round(totalSeconds / 60);
    const totalWords = completedList.reduce((acc, t) => acc + (t.wordsCount || 0), 0);

    return {
      transcriptsCount: totalCount,
      hoursTranscribed: totalHours,
      totalMinutes,
      wordsProcessed: totalWords,
      aiAnalysesCount: completedList.length
    };
  }, [transcripts]);

  // Search & Status filter
  const filteredTranscripts = useMemo(() => {
    return transcripts.filter((t) => {
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.source.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [transcripts, searchQuery, statusFilter]);

  // Handle Failed Row Interactive Click
  const handleFailedRowClick = async (row) => {
    const { isConfirmed } = await sweetAlert.confirm(
      'ট্রানস্ক্রিপশন ব্যর্থ হয়েছিল',
      `ফাইল: "${row.fileName}"\nকারণ: ${row.errorReason || 'টাইমআউট বা ফাইল ফরম্যাটজনিত ত্রুটি'}\n\nআপনি কি ফাইলটি পুনরায় আপলোড করে ট্রানস্ক্রাইব করতে চান?`,
      'পুনরায় চেষ্টা করুন (Retry)',
      'বাতিল'
    );
    if (isConfirmed) {
      setUploadTitle(row.title);
      setUploadModalOpen(true);
    }
  };

  // Simulated Live Speech for environments without mic permissions
  const handleSimulatedLiveSpeech = () => {
    const demoPhrases = [
      'আজকের সংসদ অধিবেশনে বাজেট নিয়ে গুরুত্বপূর্ণ সিদ্ধান্ত নেওয়া হয়েছে।',
      'আইসিটি মন্ত্রী জানিয়েছেন, গণমাধ্যমে রিয়েলটাইম এআই ব্যবহারে বিশেষ প্রণোদনা থাকবে।',
      'দৈনিক বার্তা প্রবাহের সংবাদকক্ষে ট্রানস্ক্রিপশন সফলভাবে কাজ করছে।'
    ];
    let step = 0;
    setIsLiveListening(true);
    const interval = setInterval(() => {
      if (step < demoPhrases.length) {
        setLiveTranscriptText((prev) => (prev ? `${prev} ${demoPhrases[step]}` : demoPhrases[step]));
        step++;
      } else {
        clearInterval(interval);
        setIsLiveListening(false);
      }
    }, 1200);
  };

  // Handle File Upload & Simulation of Transcription
  const handleStartFileTranscription = async (e) => {
    e?.preventDefault();
    if (!uploadFile && !uploadTitle) {
      await sweetAlert.warning('ফাইল প্রয়োজন', 'অনুগ্রহ করে একটি অডিও বা ভিডিও ফাইল নির্বাচন করুন।');
      return;
    }

    setIsProcessingUpload(true);
    const name = uploadFile ? uploadFile.name : uploadTitle;
    const newId = `tr-${Date.now()}`;

    // Simulate AI Transcription Processing
    setTimeout(async () => {
      const durationSeconds = Math.floor(Math.random() * 120) + 30;
      const mins = Math.floor(durationSeconds / 60);
      const secs = durationSeconds % 60;
      const formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      const newTranscript = {
        id: newId,
        title: uploadTitle || name.replace(/\.[^/.]+$/, ''),
        source: `C:\\Users\\Newsroom\\Desktop\\${name}`,
        fileName: name,
        duration: formattedDuration,
        durationSeconds,
        timeAgo: 'Just now',
        status: 'Completed',
        wordsCount: Math.floor(durationSeconds * 2.4),
        language: uploadLang === 'bn' ? 'বাংলা (Bengali)' : 'English',
        speakerCount: 1,
        segments: [
          { time: '00:00:02', speaker: 'বক্তা ১', text: `অডিও সোর্স থেকে সফলভাবে ট্রানস্ক্রাইব করা হয়েছে (${name})।` },
          { time: '00:00:15', speaker: 'বক্তা ১', text: 'দৈনিক বার্তা প্রবাহের সংবাদ ও মাল্টিমিডিয়া ডেস্কে এই তথ্য সংরক্ষণ করা হয়েছে।' }
        ]
      };

      persistTranscripts([newTranscript, ...transcripts]);
      setIsProcessingUpload(false);
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      await sweetAlert.toast('ট্রানস্ক্রিপশন সম্পন্ন হয়েছে!', 'success', 2200);
    }, 1800);
  };

  // Handle URL Transcription
  const handleStartUrlTranscription = async (e) => {
    e?.preventDefault();
    if (!mediaUrl.trim()) {
      await sweetAlert.warning('ইউআরএল দিন', 'অনুগ্রহ করে ইউটিউব, ভিমিও বা অডিও ফাইল লিঙ্ক দিন।');
      return;
    }

    setIsProcessingUrl(true);
    setTimeout(async () => {
      const newId = `tr-${Date.now()}`;
      const newTranscript = {
        id: newId,
        title: `Online Media Stream (${new URL(mediaUrl.startsWith('http') ? mediaUrl : 'https://' + mediaUrl).hostname})`,
        source: mediaUrl,
        fileName: 'online_stream.mp4',
        duration: '04:15',
        durationSeconds: 255,
        timeAgo: 'Just now',
        status: 'Completed',
        wordsCount: 520,
        language: 'বাংলা (Bengali)',
        speakerCount: 2,
        segments: [
          { time: '00:00:03', speaker: 'বক্তা ১', text: 'অনলাইন মিডিয়া স্ট্রিম থেকে সরাসরি অডিও আলাদা করে ট্রানস্ক্রাইব করা হয়েছে।' },
          { time: '00:00:30', speaker: 'বক্তা ২', text: 'ইউটিউব ও অন্যান্য প্ল্যাটফর্মের বক্তব্য স্বয়ংক্রিয়ভাবে পাঠ্যলিপিতে রূপান্তরিত হয়েছে।' }
        ]
      };

      persistTranscripts([newTranscript, ...transcripts]);
      setIsProcessingUrl(false);
      setUrlModalOpen(false);
      setMediaUrl('');
      await sweetAlert.toast('ইউআরএল ট্রানস্ক্রিপশন সফল হয়েছে!', 'success', 2200);
    }, 2000);
  };

  // Live Web Speech Recognition (Mic to text)
  const toggleLiveMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      sweetAlert.info('ব্রাউজার সাপোর্ট', 'আপনার ব্রাউজারে স্পিচ রিকগনিশন এপিআই সমর্থিত নয়। অনুগ্রহ করে গুগল ক্রোম ব্যবহার করুন।');
      return;
    }

    if (isLiveListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsLiveListening(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'bn-BD';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptChunk = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcriptChunk + ' ';
            } else {
              interim += transcriptChunk;
            }
          }
          setLiveTranscriptText((prev) => (prev ? `${prev} ${final}` : final || interim));
        };

        recognition.onerror = () => {
          setIsLiveListening(false);
        };

        recognition.onend = () => {
          setIsLiveListening(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsLiveListening(true);
      } catch {
        setIsLiveListening(false);
      }
    }
  };

  // Save Live Transcript to Library
  const handleSaveLiveTranscript = () => {
    if (!liveTranscriptText.trim()) return;
    const newId = `tr-${Date.now()}`;
    const newTranscript = {
      id: newId,
      title: `লাইভ মাইক্রোফোন ট্রানস্ক্রিপ্ট (${new Date().toLocaleTimeString('bn-BD')})`,
      source: 'Microphone Live Feed',
      fileName: 'live_recording.wav',
      duration: '01:10',
      durationSeconds: 70,
      timeAgo: 'Just now',
      status: 'Completed',
      wordsCount: liveTranscriptText.trim().split(/\s+/).length,
      language: 'বাংলা (Bengali)',
      speakerCount: 1,
      segments: [
        { time: '00:00:01', speaker: 'মাইক্রোফোন', text: liveTranscriptText.trim() }
      ]
    };

    persistTranscripts([newTranscript, ...transcripts]);
    setLiveModalOpen(false);
    setLiveTranscriptText('');
    sweetAlert.success('সংরক্ষিত হয়েছে!', 'লাইভ বক্তব্য ট্রানস্ক্রিপ্ট হিসেবে সংরক্ষিত হয়েছে।');
  };

  // Send Transcript to News CMS as a Draft Story
  const handleSendTranscriptToNews = async (item) => {
    if (!item?.segments?.length) return;
    const fullText = item.segments.map((s) => `[${s.time}] ${s.speaker}: ${s.text}`).join('\n\n');

    try {
      const payload = {
        title: item.title,
        slug: `interview-${Date.now()}`,
        subheadline: `অডিও/ভিডিও ট্রানস্ক্রিপশন থেকে সংগৃহীত রিপোর্ট (${item.fileName})`,
        summary: item.segments[0]?.text || item.title,
        content: `<p>${fullText.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`,
        category_id: 1,
        status: 'draft',
        is_breaking: false,
        is_featured: false,
        tags: ['Interview', 'Transcription', 'ScribeForge']
      };

      await createNewsMutation(payload).unwrap();
      await sweetAlert.success(
        'সিএমএস-এ খসড়া সংরক্ষিত!',
        'ট্রানস্ক্রিপ্টটি সংবাদ ব্যবস্থাপনা তালিকায় খসড়া (Draft) হিসেবে পাঠানো হয়েছে।'
      );
    } catch {
      await sweetAlert.error('ব্যর্থ হয়েছে', 'সংবাদ ড্রাফট সংরক্ষণ করতে সমস্যা হয়েছে।');
    }
  };

  // Download Transcript (.SRT / .TXT)
  const handleDownloadTranscript = (item, format = 'txt') => {
    let content = '';
    let filename = `${item.title.replace(/[^a-z0-9]/gi, '_')}.${format}`;
    let mimeType = 'text/plain';

    if (format === 'srt') {
      content = item.segments
        .map((s, idx) => `${idx + 1}\n00:${s.time},000 --> 00:${s.time},999\n${s.speaker}: ${s.text}\n`)
        .join('\n');
    } else {
      content = `শিরোনাম: ${item.title}\nসোর্স: ${item.source}\nদৈর্ঘ্য: ${item.duration}\nতারিখ: ${item.timeAgo}\n\n` +
        item.segments.map((s) => `[${s.time}] ${s.speaker}: ${s.text}`).join('\n');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    sweetAlert.toast(`${format.toUpperCase()} ফাইল ডাউনলোড হচ্ছে!`, 'success', 1800);
  };

  // Delete Transcript
  const handleDeleteTranscript = async (id, title) => {
    const { isConfirmed } = await sweetAlert.confirmDelete(
      title,
      `আপনি কি নিশ্চিত যে "${title}" ট্রানস্ক্রিপ্টটি মুছে ফেলতে চান?`
    );
    if (isConfirmed) {
      persistTranscripts(transcripts.filter((t) => t.id !== id));
      if (inspectorItem?.id === id) setInspectorItem(null);
      await sweetAlert.toast('মুছে ফেলা হয়েছে', 'info', 1600);
    }
  };

  return (
    <div className="flex h-full min-h-[85vh] bg-[#0c0d12] text-stone-200 rounded-3xl border border-stone-800 shadow-2xl overflow-hidden font-sans">
      
      {/* 1. LEFT SIDEBAR (Matching the Exact ScribeForge Layout in Image) */}
      <aside className="w-60 bg-[#0e1017] border-r border-stone-800/80 p-5 flex flex-col justify-between shrink-0">
        
        <div className="space-y-6">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-amber-600/30 font-mono">
              SF
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white">ScribeForge</span>
              <span className="text-[10px] text-stone-500 ml-1.5 font-mono">v1.0</span>
            </div>
          </div>

          {/* MAIN NAV SECTION */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 font-mono">
              MAIN
            </span>

            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/25 shadow-xs font-bold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              <Layers className="w-4 h-4 text-orange-400" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 transition-all cursor-pointer"
            >
              <Mic className="w-4 h-4 text-stone-400" />
              <span>Transcribe</span>
            </button>

            <button
              type="button"
              onClick={() => setBatchModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 text-stone-400" />
              <span>Batch Process</span>
            </button>

            <button
              type="button"
              onClick={() => setLiveModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Live</span>
            </button>
          </div>

          {/* LIBRARY NAV SECTION */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 font-mono">
              LIBRARY
            </span>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/25 font-bold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-stone-400" />
                <span>All Transcripts</span>
              </div>
              <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center justify-center font-mono">
                {transcripts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (transcripts[0]) setInspectorItem(transcripts[0]);
                else sweetAlert.info('ট্রানস্ক্রিপ্ট নেই', 'আগে একটি অডিও ফাইল ট্রানস্ক্রাইব করুন।');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>AI Tools</span>
            </button>

            <Link
              to="/admin/settings"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 transition-all"
            >
              <Settings className="w-4 h-4 text-stone-400" />
              <span>Settings</span>
            </Link>
          </div>

        </div>

        {/* Sidebar Footer Link */}
        <div className="pt-4 border-t border-stone-800/60">
          <Link
            to="/admin/news"
            className="flex items-center justify-between text-xs text-stone-400 hover:text-stone-200 font-serif-bn transition-colors"
          >
            <span>সংবাদ সিএমএস-এ ফিরুন</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
          </Link>
        </div>

      </aside>

      {/* 2. MAIN WORKSPACE / DASHBOARD VIEWPORT */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0c0d12] overflow-y-auto">
        
        {/* Top Header Bar */}
        <div className="h-16 px-6 border-b border-stone-800 flex items-center justify-between gap-4 sticky top-0 z-20 bg-[#0c0d12]/95 backdrop-blur-md">
          
          <h2 className="text-base font-bold text-white tracking-wide">
            Dashboard
          </h2>

          {/* Search Bar matching Ctrl+K placeholder */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-stone-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transcripts, projects, tags... Ctrl+K"
              className="w-full pl-9 pr-8 py-2 bg-[#12141c] border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => sweetAlert.toast('ScribeForge ডার্ক স্টুডিও মোড সক্রিয় রয়েছে', 'info', 1800)}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/50 transition-colors cursor-pointer"
              title="ডার্ক মোড সক্রিয়"
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => sweetAlert.toast('সব প্রসেসিং আপডেট হালনাগাদ রয়েছে', 'success', 1800)}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/50 transition-colors cursor-pointer"
              title="নোটিফিকেশন"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* + New Orange Button */}
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New</span>
            </button>

            {/* User Profile Avatar */}
            <button
              type="button"
              onClick={() => sweetAlert.info('ব্যবহারকারী প্রোফাইল', `সংবাদকক্ষ প্রোফাইল: ${authState?.user?.name || 'লুতফর রহমান'} (${authState?.user?.email || 'newsroom@dailyprabaho.com'})`)}
              className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 font-bold text-xs flex items-center justify-center font-mono cursor-pointer"
              title="প্রোফাইল তথ্য"
            >
              {(authState?.user?.name || 'L').charAt(0).toUpperCase()}
            </button>
          </div>

        </div>

        {/* Dashboard Interior Body */}
        <div className="p-6 space-y-6">

          {/* 1. TOP METRIC CARDS (Exact 4 Cards with Accent Line at Top) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: TRANSCRIPTS */}
            <div className="bg-[#12141c] p-5 rounded-2xl border border-stone-800 relative overflow-hidden space-y-1">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500" />
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider font-mono">
                TRANSCRIPTS
              </p>
              <p className="text-2xl font-black text-white font-mono">
                {metrics.transcriptsCount}
              </p>
              <p className="text-[11px] text-stone-400 font-mono">
                +0 this week
              </p>
            </div>

            {/* Card 2: HOURS TRANSCRIBED */}
            <div className="bg-[#12141c] p-5 rounded-2xl border border-stone-800 relative overflow-hidden space-y-1">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-sky-500" />
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider font-mono">
                HOURS TRANSCRIBED
              </p>
              <p className="text-2xl font-black text-sky-400 font-mono">
                {metrics.hoursTranscribed} <span className="text-xs font-normal text-stone-400">hrs</span>
              </p>
              <p className="text-[11px] text-stone-400 font-mono">
                ~{metrics.totalMinutes} min total
              </p>
            </div>

            {/* Card 3: WORDS PROCESSED */}
            <div className="bg-[#12141c] p-5 rounded-2xl border border-stone-800 relative overflow-hidden space-y-1">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider font-mono">
                WORDS PROCESSED
              </p>
              <p className="text-2xl font-black text-emerald-400 font-mono">
                {metrics.wordsProcessed > 0 ? metrics.wordsProcessed.toLocaleString() : '—'}
              </p>
              <p className="text-[11px] text-stone-400 font-mono">
                AI স্পিচ-টু-টেক্সট
              </p>
            </div>

            {/* Card 4: AI ANALYSES */}
            <div className="bg-[#12141c] p-5 rounded-2xl border border-stone-800 relative overflow-hidden space-y-1">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500" />
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider font-mono">
                AI ANALYSES
              </p>
              <p className="text-2xl font-black text-amber-400 font-mono">
                {metrics.aiAnalysesCount > 0 ? metrics.aiAnalysesCount : '—'}
              </p>
              <p className="text-[11px] text-stone-400 font-mono">
                সারসংক্ষেপ ও কীওয়ার্ড
              </p>
            </div>

          </div>

          {/* 2. QUICK ACTIONS (4 Cards with Circular Icons matching Image) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-300 tracking-wide">
              Quick actions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Action 1: Transcribe file */}
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="p-5 rounded-2xl bg-[#12141c] hover:bg-[#161922] border border-stone-800 hover:border-orange-500/40 transition-all text-center space-y-2.5 cursor-pointer group shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-orange-500/15 text-orange-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                    Transcribe file
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Drop audio or video file
                  </p>
                </div>
              </button>

              {/* Action 2: Paste URL */}
              <button
                type="button"
                onClick={() => setUrlModalOpen(true)}
                className="p-5 rounded-2xl bg-[#12141c] hover:bg-[#161922] border border-stone-800 hover:border-sky-500/40 transition-all text-center space-y-2.5 cursor-pointer group shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-sky-500/15 text-sky-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">
                    Paste URL
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    YouTube, Vimeo, 1000+ sites
                  </p>
                </div>
              </button>

              {/* Action 3: Live transcribe */}
              <button
                type="button"
                onClick={() => setLiveModalOpen(true)}
                className="p-5 rounded-2xl bg-[#12141c] hover:bg-[#161922] border border-stone-800 hover:border-emerald-500/40 transition-all text-center space-y-2.5 cursor-pointer group shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Live transcribe
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Real-time from mic
                  </p>
                </div>
              </button>

              {/* Action 4: Batch process */}
              <button
                type="button"
                onClick={() => setBatchModalOpen(true)}
                className="p-5 rounded-2xl bg-[#12141c] hover:bg-[#161922] border border-stone-800 hover:border-purple-500/40 transition-all text-center space-y-2.5 cursor-pointer group shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-purple-500/15 text-purple-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                    Batch process
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Bulk files or playlist
                  </p>
                </div>
              </button>

            </div>
          </div>

          {/* 3. RECENT TRANSCRIPTS TABLE (Matching exact rows and statuses in Image) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-stone-300 tracking-wide">
                  {activeTab === 'all' ? 'All Transcripts Library' : 'Recent transcripts'}
                </h3>
                {activeTab === 'all' && (
                  <span className="text-[10px] text-stone-500 font-mono">
                    (মোট {transcripts.length}টি ফাইল)
                  </span>
                )}
              </div>

              {activeTab === 'all' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="text-xs font-semibold text-stone-400 hover:text-stone-200 flex items-center gap-1 cursor-pointer"
                >
                  ← ড্যাশবোর্ডে ফিরুন
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>View all</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Tabs (All / Completed / Failed) */}
            <div className="flex items-center gap-1.5 pb-1">
              {[
                { id: 'all', label: 'সকল ফাইল' },
                { id: 'Completed', label: 'সম্পন্ন (Completed)' },
                { id: 'Failed', label: 'ব্যর্থ (Failed)' }
              ].map((filterTab) => (
                <button
                  key={filterTab.id}
                  type="button"
                  onClick={() => setStatusFilter(filterTab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === filterTab.id
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 font-bold'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                  }`}
                >
                  {filterTab.label}
                </button>
              ))}
            </div>

            <div className="bg-[#12141c] rounded-2xl border border-stone-800 divide-y divide-stone-800/80 overflow-hidden">
              {filteredTranscripts.map((row) => {
                const isCompleted = row.status === 'Completed';
                return (
                  <div
                    key={row.id}
                    onClick={() => {
                      if (isCompleted) {
                        setInspectorItem(row);
                      } else {
                        handleFailedRowClick(row);
                      }
                    }}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-stone-800/30 transition-colors cursor-pointer group"
                  >
                    {/* Left Play Icon & Title/Path */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isCompleted) {
                            setInspectorItem(row);
                            setIsPlayingAudio(true);
                          } else {
                            handleFailedRowClick(row);
                          }
                        }}
                        className="w-8 h-8 rounded-xl bg-sky-950/40 text-sky-400 flex items-center justify-center shrink-0 border border-sky-800/40 group-hover:scale-105 hover:bg-sky-900/60 transition-transform cursor-pointer"
                        title={isCompleted ? 'প্লে ও ইন্সপেক্ট শুনুন' : 'ব্যর্থ কারণ দেখুন'}
                      >
                        <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                      </button>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                          {row.title}
                        </p>
                        <p className="text-[10px] text-stone-400 font-mono truncate mt-0.5">
                          {row.source}
                        </p>
                      </div>
                    </div>

                    {/* Right Duration, Time & Status Badges */}
                    <div className="flex items-center gap-6 shrink-0">
                      <span className="text-xs font-mono text-stone-400 w-12 text-right">
                        {row.duration}
                      </span>

                      <span className="text-xs text-stone-400 w-16 text-right">
                        {row.timeAgo}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`px-3 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
                          isCompleted
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                            : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
                        }`}
                      >
                        {row.status}
                      </span>

                      {/* Action Menu */}
                      <div className="relative flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCompleted) {
                              setInspectorItem(row);
                            } else {
                              handleFailedRowClick(row);
                            }
                          }}
                          className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
                          title="বিস্তারিত অপশন"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </main>

      {/* 3. MODAL: UPLOAD & TRANSCRIBE FILE */}
      <AnimatePresence>
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#12141c] rounded-3xl border border-stone-800 p-6 space-y-5 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Upload className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold">Transcribe Audio or Video File</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="text-stone-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleStartFileTranscription} className="space-y-4 text-xs">
                {/* File Dropzone */}
                <div className="p-6 rounded-2xl border-2 border-dashed border-stone-700 hover:border-orange-500/60 transition-colors text-center space-y-2 bg-stone-900/40">
                  <Upload className="w-8 h-8 text-stone-400 mx-auto" />
                  <div>
                    <label className="text-orange-400 font-bold hover:underline cursor-pointer">
                      <span>Click to upload</span>
                      <input
                        type="file"
                        accept="audio/*,video/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setUploadFile(e.target.files[0]);
                            if (!uploadTitle) setUploadTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                          }
                        }}
                      />
                    </label>
                    <span className="text-stone-400 ml-1">or drag and drop</span>
                  </div>
                  <p className="text-[10px] text-stone-400">
                    MP4, MP3, WAV, AAC, M4A, WebM (Max 500MB)
                  </p>
                  {uploadFile && (
                    <p className="text-emerald-400 font-bold font-mono pt-1 text-xs">
                      ✓ {uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-stone-300 mb-1">
                    প্রজেক্টের শিরোনাম (Project Title)
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="যেমন: প্রধানমন্ত্রীর সংবাদ সম্মেলন - মার্চ ২০২৬"
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-300 mb-1">ভাষা (Language)</label>
                    <select
                      value={uploadLang}
                      onChange={(e) => setUploadLang(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-200 focus:outline-none"
                    >
                      <option value="bn">বাংলা (Bengali)</option>
                      <option value="en">English</option>
                      <option value="mixed">বাংলা + English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-300 mb-1">স্পিকার শনাক্তকরণ</label>
                    <select className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-200 focus:outline-none">
                      <option value="auto">স্বয়ংক্রিয় (Auto Detect)</option>
                      <option value="1">১ জন বক্তা</option>
                      <option value="2">২ জন (সাক্ষাৎকার)</option>
                      <option value="multiple">একাধিক বক্তা</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessingUpload}
                    className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    {isProcessingUpload ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AI ট্রানস্ক্রাইব করছে...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-200" />
                        <span>Start Transcription</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. MODAL: PASTE URL */}
      <AnimatePresence>
        {urlModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#12141c] rounded-3xl border border-stone-800 p-6 space-y-5 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold">Transcribe from Media URL</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setUrlModalOpen(false)}
                  className="text-stone-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleStartUrlTranscription} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-stone-300 mb-1">
                    ইউআরএল লিঙ্ক (YouTube, Vimeo, etc.)
                  </label>
                  <input
                    type="url"
                    required
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-200 focus:outline-none focus:border-sky-500"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    ইউটিউব ভিডিও, ফেসবুক রিলস বা অডিও পডকাস্টের ইউআরএল সমর্থন করে।
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessingUrl}
                    className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    {isProcessingUrl ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>ইউআরএল থেকে অডিও প্রসেস হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-200" />
                        <span>Fetch & Transcribe</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MODAL: LIVE RECORDING FROM MIC */}
      <AnimatePresence>
        {liveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#12141c] rounded-3xl border border-stone-800 p-6 space-y-5 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Radio className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold">Live Microphone Transcribe</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (isLiveListening) toggleLiveMic();
                    setLiveModalOpen(false);
                  }}
                  className="text-stone-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center space-y-4">
                <button
                  type="button"
                  onClick={toggleLiveMic}
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all cursor-pointer shadow-xl ${
                    isLiveListening
                      ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/40'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30'
                  }`}
                >
                  <Mic className="w-8 h-8" />
                </button>

                <div>
                  <p className="text-xs font-bold">
                    {isLiveListening ? '🎙️ শুনছি... সরাসরি বাংলায় কথা বলুন' : 'মাইক্রোফোন চালু করতে বোতামে চাপুন'}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    ওয়েব স্পিচ এআই স্বয়ংক্রিয়ভাবে আপনার কথা পাঠ্যে রূপান্তর করবে
                  </p>
                </div>

                {/* Live Transcript Stream Box */}
                <div className="min-h-[140px] max-h-48 p-4 rounded-2xl bg-stone-900 border border-stone-800 text-xs text-stone-200 font-serif-bn overflow-y-auto text-left leading-relaxed">
                  {liveTranscriptText || (
                    <span className="text-stone-400 italic">
                      আপনার কথা এখানে তাৎক্ষণিক ট্রানস্ক্রিপ্ট আকারে দেখা যাবে...
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={!liveTranscriptText.trim()}
                    onClick={handleSaveLiveTranscript}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                  >
                    লাইব্রেরিতে সংরক্ষণ করুন
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulatedLiveSpeech}
                    className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold cursor-pointer flex items-center gap-1"
                    title="মাইক্রোফোন ছাড়া টেস্ট ডেমো চালান"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>ডেমো স্পিচ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLiveTranscriptText('')}
                    className="px-3 py-2.5 rounded-xl border border-stone-700 hover:bg-stone-800 text-xs text-stone-300 cursor-pointer"
                  >
                    ক্লিয়ার
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MODAL: BATCH PROCESS */}
      <AnimatePresence>
        {batchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#12141c] rounded-3xl border border-stone-800 p-6 space-y-5 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold">Batch Processing Queue</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="text-stone-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2 text-center">
                  <Layers className="w-7 h-7 text-purple-400 mx-auto" />
                  <p className="font-bold text-stone-200">একাধিক ফাইল কিউতে যুক্ত করুন</p>
                  <p className="text-[11px] text-stone-400">
                    একসাথে ১০টি পর্যন্ত অডিও/ভিডিও ফাইল বা পডকাস্ট সিরিজ ট্রানস্ক্রাইব করার জন্য ব্যাকগ্রাউন্ড কিউ সিস্টেম প্রস্তুত।
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBatchModalOpen(false);
                      setUploadModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer"
                  >
                    ফাইল নির্বাচন করুন
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. TRANSCRIPT INSPECTOR & SUBTITLE STUDIO DRAWER */}
      <AnimatePresence>
        {inspectorItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-4xl bg-[#12141c] rounded-3xl border border-stone-800 p-6 space-y-5 text-white shadow-2xl my-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
                      {inspectorItem.status}
                    </span>
                    <h3 className="text-base font-bold text-white font-serif-bn">
                      {inspectorItem.title}
                    </h3>
                  </div>
                  <p className="text-xs text-stone-400 font-mono">
                    {inspectorItem.source} • দৈর্ঘ্য: {inspectorItem.duration} • শব্দ: {toBengaliNumber(inspectorItem.wordsCount)}টি
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsPlayingAudio(false);
                    setInspectorItem(null);
                  }}
                  className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Interactive Audio Player Simulator Bar */}
              <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    className="w-9 h-9 rounded-full bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center cursor-pointer shadow-md transition-all shrink-0"
                    title={isPlayingAudio ? 'পজ করুন' : 'প্লে করুন'}
                  >
                    {isPlayingAudio ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5 fill-current" />
                    )}
                  </button>
                  <div>
                    <p className="font-bold text-stone-200">
                      {isPlayingAudio ? 'অডিও প্রিভিউ চলছে...' : 'অডিও প্রিভিউ চালু করুন'}
                    </p>
                    <p className="text-[10px] text-stone-400 font-mono">
                      সেগমেন্ট {activeSegmentIndex + 1} / {inspectorItem.segments?.length || 1}
                    </p>
                  </div>
                </div>

                {/* Animated Equalizer Visualizer */}
                <div className="flex items-center gap-1.5 h-5">
                  <span className={`w-1 bg-orange-500 rounded-full transition-all ${isPlayingAudio ? 'animate-bounce h-4' : 'h-1.5 opacity-40'}`}></span>
                  <span className={`w-1 bg-orange-400 rounded-full transition-all ${isPlayingAudio ? 'animate-bounce h-5 delay-75' : 'h-2 opacity-40'}`}></span>
                  <span className={`w-1 bg-amber-400 rounded-full transition-all ${isPlayingAudio ? 'animate-bounce h-3 delay-150' : 'h-1 opacity-40'}`}></span>
                  <span className={`w-1 bg-orange-500 rounded-full transition-all ${isPlayingAudio ? 'animate-bounce h-4.5 delay-100' : 'h-2 opacity-40'}`}></span>
                </div>
              </div>

              {/* Timecoded Synchronized Segments View */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider font-mono">
                  TIMECODED TRANSCRIPT
                </h4>

                <div className="space-y-2">
                  {inspectorItem.segments?.map((seg, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveSegmentIndex(idx)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 text-xs ${
                        activeSegmentIndex === idx
                          ? 'bg-orange-500/10 border-orange-500/40 text-stone-100'
                          : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:bg-stone-800/40'
                      }`}
                    >
                      <span className="px-2 py-0.5 rounded-md bg-stone-800 text-orange-400 font-mono font-bold text-[10px] shrink-0">
                        {seg.time}
                      </span>
                      <div className="flex-1 min-w-0">
                        <strong className="text-stone-200 mr-2 text-[11px] font-serif-bn">
                          {seg.speaker}:
                        </strong>
                        <span className="font-serif-bn leading-relaxed">
                          {seg.text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-4 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                
                {/* Download Options */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadTranscript(inspectorItem, 'srt')}
                    className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-orange-400" />
                    <span>Download .SRT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadTranscript(inspectorItem, 'txt')}
                    className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    <span>Download .TXT</span>
                  </button>
                </div>

                {/* Send to News CMS Draft */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSendingToCms}
                    onClick={() => handleSendTranscriptToNews(inspectorItem)}
                    className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>সংবাদ প্রতিবেদনে রূপান্তর (CMS)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteTranscript(inspectorItem.id, inspectorItem.title)}
                    className="p-2 rounded-xl text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default AdminScribeForgePage;

