import React, { useState, useEffect, useRef } from "react";
import { Search, UserCheck, ShieldAlert, LogIn, LogOut, FileText, Phone, Mail, MapPin, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../../lib/api";

type StudentStatusResponse = {
  student: {
    studentId: string;
    fullName: string;
    roomNo: string | null;
    phone: string | null;
    email: string | null;
  };
  referenceDate: string;
  currentGateStatus: "OUTSIDE" | "INSIDE";
  activeLeave: null | {
    LEAVE_ID: number;
    LEAVE_TYPE: string;
    FROM_DATE: string;
    TO_DATE: string;
    REASON: string;
    STATUS: string;
  };
  openLog: null | {
    LOG_ID: number;
    EXIT_TIME: string;
    ENTRY_TIME: string | null;
    STATUS: string;
    LEAVE_ID: number | null;
    EXIT_REMARKS: string | null;
    ENTRY_REMARKS: string | null;
  };
};

export function GateEntryExit() {
  const [searchQuery, setSearchQuery] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<"entry" | "exit" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [studentStatus, setStudentStatus] = useState<StudentStatusResponse | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Camera & OCR Scan States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isScanningActive, setIsScanningActive] = useState(true);
  const [ocrLoading, setOcrLoading] = useState(true);
  const [ocrStatusText, setOcrStatusText] = useState("Initializing Scanner...");
  const [successScanFlash, setSuccessScanFlash] = useState(false);
  const [barcodeSupported, setBarcodeSupported] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isScanningInProgress = useRef(false);
  const detectorRef = useRef<any>(null);

  // Synthesize soft feedback audio beep
  const playBeep = () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880; // High A note
      gainNode.gain.setValueAtTime(0.08, context.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.12); // Short beep
    } catch (err) {
      console.error("Audio Context beep error:", err);
    }
  };

  // 1. Auto-Start camera feed on mount
  useEffect(() => {
    let active = true;
    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Webcam access is restricted to secure origins (HTTPS) or is not supported by your browser.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            advanced: [{ focusMode: "continuous" } as any]
          }
        });
        if (active && videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setCameraActive(true);
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        if (active) {
          setCameraError(err.message || "Webcam access denied or unavailable. Running in manual mode.");
        }
      }
    };
    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 2. Initialize Scanning Engine (Native Barcode Detector with OCR fallback)
  useEffect(() => {
    let active = true;
    const initScanner = async () => {
      try {
        if ("BarcodeDetector" in window) {
          try {
            const formats = await (window as any).BarcodeDetector.getSupportedFormats();
            const targetedFormats = ["qr_code", "code_128", "code_39", "ean_13", "upc_a", "code_93", "codabar", "data_matrix", "itf", "pdf417"];
            const formatsToUse = targetedFormats.filter((f) => formats.includes(f));
            
            if (formatsToUse.length > 0) {
              detectorRef.current = new (window as any).BarcodeDetector({ formats: formatsToUse });
              if (active) {
                setBarcodeSupported(true);
                setOcrLoading(false);
                setOcrStatusText("AI Barcode Active");
                return;
              }
            }
          } catch (barcodeErr) {
            console.warn("BarcodeDetector initialization failed, falling back to OCR:", barcodeErr);
          }
        }

        // Fallback to OCR
        if (active) {
          setOcrStatusText("Loading OCR Engine...");
        }
        if (!(window as any).Tesseract) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/tesseract.js@v4.0.1/dist/tesseract.min.js";
            script.onload = () => resolve();
            script.onerror = (err) => reject(err);
            document.body.appendChild(script);
          });
        }
        if (active) {
          setOcrStatusText("OCR Engine Active");
          setOcrLoading(false);
        }
      } catch (err) {
        console.error("Scanner initialization error:", err);
        if (active) {
          setOcrStatusText("Scanner offline. Type ID manually.");
        }
      }
    };
    initScanner();

    return () => {
      active = false;
    };
  }, []);

  // 3. Continuous background scanning queue
  useEffect(() => {
    if (ocrLoading || !cameraActive || !isScanningActive) return;

    if (barcodeSupported) {
      // Native Barcode Detection Engine (Fast, 250ms polling)
      const interval = setInterval(async () => {
        if (isScanningInProgress.current || !videoRef.current || !detectorRef.current) return;

        isScanningInProgress.current = true;
        setOcrStatusText("Scanning...");

        try {
          const video = videoRef.current;
          // Check if video is loaded and ready
          if (video.readyState >= 2) {
            const barcodes = await detectorRef.current.detect(video);
            if (barcodes && barcodes.length > 0) {
              const detectedText = barcodes[0].rawValue || "";
              const match = detectedText.match(/\b(STU\d+|stu\d+)\b/i);
              if (match) {
                const detectedId = match[0].toUpperCase().trim();
                setOcrStatusText(`Read ID: ${detectedId}!`);
                
                // Trigger visual scan success flash
                setSuccessScanFlash(true);
                setTimeout(() => setSuccessScanFlash(false), 800);

                // Pause scanning
                setIsScanningActive(false);

                // Pop sound
                playBeep();

                // Populate input and run verify query
                setSearchQuery(detectedId);
                await triggerAutoScanSearch(detectedId);
              } else {
                setOcrStatusText("Invalid code format");
              }
            } else {
              setOcrStatusText("Align Barcode/QR...");
            }
          }
        } catch (err) {
          console.error("Barcode Scan Error:", err);
        } finally {
          isScanningInProgress.current = false;
        }
      }, 250);

      return () => clearInterval(interval);
    } else {
      // OCR Character Recognition Fallback (Slower, 1500ms polling)
      const interval = setInterval(async () => {
        if (isScanningInProgress.current || !videoRef.current || !canvasRef.current) return;

        const Tesseract = (window as any).Tesseract;
        if (!Tesseract) return;

        isScanningInProgress.current = true;
        setOcrStatusText("Scanning...");

        try {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext("2d");

          if (context && video.videoWidth && video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Get image from canvas
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

            const result = await Tesseract.recognize(dataUrl, "eng");
            const text = result.data?.text || "";

            // Check for Student ID (e.g. STU001)
            const match = text.match(/\b(STU\d+|stu\d+)\b/i);
            if (match) {
              const detectedId = match[0].toUpperCase().trim();
              setOcrStatusText(`Read ID: ${detectedId}!`);
              
              // Trigger visual scan success flash
              setSuccessScanFlash(true);
              setTimeout(() => setSuccessScanFlash(false), 800);

              // Pause scanning
              setIsScanningActive(false);

              // Pop sound
              playBeep();

              // Populate input and run verify query
              setSearchQuery(detectedId);
              await triggerAutoScanSearch(detectedId);
            } else {
              setOcrStatusText("Align ID Pass...");
            }
          }
        } catch (err) {
          console.error("OCR Scan Error:", err);
        } finally {
          isScanningInProgress.current = false;
        }
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [ocrLoading, cameraActive, isScanningActive, barcodeSupported]);

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const normalizeStudentIdInput = (value: string) => value.toUpperCase().trim();

  const startAutoClearCountdownWithScanResume = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setCountdown(5);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          clearStateWithScanResume();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearState = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setStudentStatus(null);
    setSearchQuery("");
    setRemarks("");
    setError("");
    setSuccess("");
    setCountdown(null);
  };

  const clearStateWithScanResume = () => {
    clearState();
    setIsScanningActive(true);
    setOcrStatusText(barcodeSupported ? "AI Barcode Active" : "OCR Engine Active");
  };

  const loadStudentStatus = async (studentId: string) => {
    const response = await api.get(`/security/student-status/${encodeURIComponent(studentId.trim())}`);
    return response.data;
  };

  const triggerAutoScanSearch = async (detectedId: string) => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
      setCountdown(null);
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setStudentStatus(null);

    try {
      const data = await loadStudentStatus(detectedId);
      setStudentStatus(data);

      // Automated check-out / check-in logic for Daily Outings (no active approved leave)
      if (!data.activeLeave) {
        setLoading(false);
        if (data.currentGateStatus === "INSIDE") {
          setSuccess("Daily Outing detected. Automatically checking student OUT...");
          setTimeout(async () => {
            try {
              const res = await api.post("/security/mark-exit", {
                studentId: data.student.studentId
              });
              setSuccess(res.data?.message || "Student checked OUT successfully!");
              const updatedData = await loadStudentStatus(data.student.studentId);
              setStudentStatus(updatedData);
              startAutoClearCountdownWithScanResume();
            } catch (err: any) {
              setError(err.response?.data?.message || "Failed to automatically mark exit");
              setIsScanningActive(true);
            }
          }, 800);
        } else {
          setSuccess("Daily Return detected. Automatically checking student IN...");
          setTimeout(async () => {
            try {
              const res = await api.post("/security/mark-entry", {
                studentId: data.student.studentId
              });
              setSuccess(res.data?.message || "Student checked IN successfully!");
              const updatedData = await loadStudentStatus(data.student.studentId);
              setStudentStatus(updatedData);
              startAutoClearCountdownWithScanResume();
            } catch (err: any) {
              setError(err.response?.data?.message || "Failed to automatically mark entry");
              setIsScanningActive(true);
            }
          }, 800);
        }
      }
    } catch (err: any) {
      setStudentStatus(null);
      setError(err.response?.data?.message || "Failed to fetch student status");
      setIsScanningActive(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsScanningActive(false); // Pause auto-scan on manual enter
    await triggerAutoScanSearch(searchQuery);
  };

  const handleMarkExit = async () => {
    if (!studentStatus) return;

    setSubmitting("exit");
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/security/mark-exit", {
        studentId: studentStatus.student.studentId,
        remarks: remarks.trim() || undefined,
      });
      setSuccess(response.data?.message || "Student exit marked successfully");
      setRemarks("");
      const updatedData = await loadStudentStatus(studentStatus.student.studentId);
      setStudentStatus(updatedData);
      startAutoClearCountdownWithScanResume();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to mark exit");
    } finally {
      setSubmitting(null);
    }
  };

  const handleMarkEntry = async () => {
    if (!studentStatus) return;

    setSubmitting("entry");
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/security/mark-entry", {
        studentId: studentStatus.student.studentId,
        remarks: remarks.trim() || undefined,
      });
      setSuccess(response.data?.message || "Student entry marked successfully");
      setRemarks("");
      const updatedData = await loadStudentStatus(studentStatus.student.studentId);
      setStudentStatus(updatedData);
      startAutoClearCountdownWithScanResume();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to mark entry");
    } finally {
      setSubmitting(null);
    }
  };

  const student = studentStatus?.student;
  const canExit = studentStatus?.currentGateStatus === "INSIDE";
  const isOutside = studentStatus?.currentGateStatus === "OUTSIDE";

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      
      {/* Left Column: Persistent AI Gate Camera Feed */}
      <div className="md:col-span-5 space-y-4">
        <div className={`bg-slate-900 rounded-2xl overflow-hidden shadow-lg border relative transition-all duration-300 ${
          successScanFlash ? "border-emerald-500 ring-4 ring-emerald-500/20" : "border-slate-800"
        }`}>
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <span className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${cameraActive && isScanningActive ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`}></span>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                AI Scanner Camera
              </span>
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium truncate max-w-[150px]">
              {ocrStatusText}
            </span>
          </div>

          {/* Video Container */}
          <div className="relative aspect-video bg-slate-950 flex items-center justify-center min-h-[220px]">
            {cameraError ? (
              <div className="p-6 text-center text-rose-400 text-sm flex flex-col items-center gap-2">
                <ShieldAlert size={28} />
                <p className="font-medium">{cameraError}</p>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-300 ${cameraActive ? "opacity-100" : "opacity-0"}`}
                />
                
                {/* Visual scanner overlay target guides */}
                {cameraActive && isScanningActive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-32 border-2 border-dashed border-emerald-400/40 rounded-lg flex items-center justify-center relative">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>
                      <span className="text-[9px] text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                        {barcodeSupported ? "Align Barcode / QR" : "Align Student ID"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Loading skeleton */}
                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-500"></div>
                    <span className="text-xs">Initializing webcam feed...</span>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Controls */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={() => setIsScanningActive(!isScanningActive)}
              disabled={ocrLoading || !cameraActive}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors text-center ${
                isScanningActive 
                  ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              {isScanningActive ? "Pause Auto-Scan" : "Resume Auto-Scan"}
            </button>
            <button
              onClick={clearStateWithScanResume}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Hidden Canvas Context for OCR Snapshot capturing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Right Column: Search Input & Student Details Card */}
      <div className="md:col-span-7 space-y-6">
        <form onSubmit={handleSearch} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Student ID Verification</label>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                required
                type="text"
                placeholder="Enter Student ID (e.g. STU101)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(normalizeStudentIdInput(e.target.value))}
                className="pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent w-full transition-all text-lg font-semibold"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-70 flex items-center justify-center shadow-md shadow-slate-200"
            >
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : "Verify"}
            </button>
          </div>
        </form>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">{error}</div>}
        {success && <div className="bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm font-medium">{success}</div>}

        <AnimatePresence>
          {studentStatus && student && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
            >
              <div className={`p-6 border-b flex flex-col md:flex-row gap-5 ${isOutside ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"}`}>
                <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-2xl font-bold shadow-sm">
                  {student.fullName?.charAt(0) || "S"}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">{student.fullName || "Student"}</h3>
                      <p className="text-slate-600 font-semibold mt-1">{student.studentId}</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${isOutside ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-800"}`}>
                      Currently: {isOutside ? "Outside" : "Inside"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-slate-400 shrink-0" />
                      Room {student.roomNo || "N/A"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={15} className="text-slate-400 shrink-0" />
                      {student.phone || "No phone"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={15} className="text-slate-400 shrink-0" />
                      {student.email || "No email"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {isOutside ? (
                  <div className="flex items-center p-4 bg-slate-50 text-slate-700 rounded-xl border border-slate-100">
                    <div className="bg-slate-100 p-2 rounded-lg mr-4 shrink-0">
                      <UserCheck size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Valid Return</h4>
                      <p className="text-sm">
                        Student is currently outside and can be marked back in.
                      </p>
                    </div>
                  </div>
                ) : studentStatus.activeLeave ? (
                  <div className="flex items-center p-4 bg-slate-50 text-slate-700 rounded-xl border border-slate-100">
                    <div className="bg-slate-100 p-2 rounded-lg mr-4 shrink-0">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Leave Approved</h4>
                      <p className="text-sm font-semibold">
                        {studentStatus.activeLeave.LEAVE_TYPE} ({studentStatus.activeLeave.FROM_DATE} to {studentStatus.activeLeave.TO_DATE})
                      </p>
                      <p className="text-xs mt-1 text-slate-500">{studentStatus.activeLeave.REASON || "No reason provided"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center p-4 bg-slate-50 text-slate-700 rounded-xl border border-slate-100">
                    <div className="bg-slate-100 p-2 rounded-lg mr-4 shrink-0">
                      <UserCheck size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Daily Outing</h4>
                      <p className="text-sm">Student is inside and can be checked out for a daily outing.</p>
                    </div>
                  </div>
                )}

                {!studentStatus.activeLeave ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-2 animate-bounce">
                      <UserCheck size={32} />
                    </div>
                    <h4 className="text-xl font-bold text-slate-800">
                      {isOutside ? "Checked OUT Successfully!" : "Checked IN Successfully!"}
                    </h4>
                    <p className="text-slate-500 text-sm">
                      Routine daily outing recorded. The screen will clear automatically to allow the next scan.
                    </p>
                    
                    {countdown !== null && (
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 rounded-full text-slate-700 text-sm font-bold shadow-inner">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span>Next scan in {countdown}s...</span>
                      </div>
                    )}

                    <div className="pt-4">
                      <button
                        onClick={clearStateWithScanResume}
                        className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors shadow-md shadow-slate-200 text-sm"
                      >
                        Clear Now
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Remarks</label>
                      <textarea
                        rows={3}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder={isOutside ? "Optional entry remarks" : "Optional exit remarks"}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
                      />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                      {isOutside ? (
                        <button
                          onClick={handleMarkEntry}
                          disabled={submitting !== null}
                          className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-60 shadow-lg shadow-slate-200 text-lg"
                        >
                          <LogIn size={24} />
                          <span>{submitting === "entry" ? "Marking Entry..." : "Mark Entry"}</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleMarkExit}
                          disabled={!canExit || submitting !== null}
                          className="flex-1 flex items-center justify-center gap-2 py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-200 text-lg"
                        >
                          <LogOut size={24} />
                          <span>{submitting === "exit" ? "Marking Exit..." : "Mark Exit"}</span>
                        </button>
                      )}
                      <button
                        onClick={clearStateWithScanResume}
                        className="px-6 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
