import React, { useEffect, useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";
import styles from "./FaceRecognition.module.css";

const MODEL_URL = "https://teachablemachine.withgoogle.com/models/2VrhIAjKb/";
const API_URL = "http://localhost:5000";

const FaceRecognition = () => {
  const videoRef = useRef(null);
  const [model, setModel] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [detectedPerson, setDetectedPerson] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // 🔹 Load Face Recognition Model
  useEffect(() => {
    const loadModel = async () => {
      const loadedModel = await tmImage.load(
        `${MODEL_URL}model.json`,
        `${MODEL_URL}metadata.json`
      );
      setModel(loadedModel);
    };

    loadModel();

    // 🔹 Start Webcam Stream
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("❌ Error accessing webcam:", err));
  }, []);

  // 🔹 Fetch Attendance List (For Today)
  const fetchAttendance = async () => {
    try {
      const response = await fetch(`${API_URL}/attendance`);
      const data = await response.json();
      setAttendance(data);
    } catch (error) {
      console.error("❌ Error fetching attendance:", error);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // 🔹 Capture & Recognize Face
  const captureAndPredict = async () => {
    if (!model || !videoRef.current) return;

    const prediction = await model.predict(videoRef.current);
    const highest = prediction.reduce((prev, curr) =>
      prev.probability > curr.probability ? prev : curr
    );

    setDetectedPerson({
      name: highest.className,
      confidence: highest.probability,
    });

    if (highest.className === "No face" || highest.probability < 0.8) {
      setErrorMessage("No valid face detected.");
      return;
    }

    setErrorMessage(null);
    const attendanceRecord = {
      name: highest.className,
      status: "Present",
      confidence: highest.probability.toFixed(2),
      time: new Date().toLocaleTimeString(),
      date: new Date().toISOString().split("T")[0],
    };

    try {
      const response = await fetch(`${API_URL}/mark-attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceRecord),
      });

      const result = await response.json();
      if (response.status === 400) {
        setErrorMessage(result.error);
      } else {
        fetchAttendance();
      }
    } catch (error) {
      console.error("❌ Error sending attendance data:", error);
    }
  };

  return (
    <div className={styles.container}>
      {/* <h1 className={styles.title}>Face Recognition Attendance</h1> */}
      <h1 className="text-white text-2xl font-bold">Face Recognition Attendance</h1>

      {/* Webcam Feed */}
      <div className={styles.videoWrapper}>
        <video ref={videoRef} autoPlay playsInline className={styles.video} />
      </div>

      {/* Mark Attendance Button */}
      <button onClick={captureAndPredict} className={styles.button}>
        Mark Attendance
      </button>

      {/* Error Message */}
      {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

      {/* Recognized Face & Confidence Meter */}
      {detectedPerson && (
        <div className={styles.resultWrapper}>
          <h2>Detected: {detectedPerson.name}</h2>
          <p>Confidence: {Math.round(detectedPerson.confidence * 100)}%</p>
        </div>
      )}

      {/* Attendance List */}
      <div className={styles.attendanceWrapper}>
        <h2>Today's Attendance</h2>
        <ul className={styles.attendanceList}>
          {attendance.map((entry, index) => (
            <li key={index} className={styles.attendanceItem}>
              {entry.name} - {entry.time}
            </li>
          ))}
        </ul>
      </div>

      {/* Download Buttons */}
      <div className={styles.buttonGroup}>
        <button
          onClick={() => window.open(`${API_URL}/export-csv`)}
          className={styles.button}
        >
          Download CSV
        </button>
        <button
          onClick={() => window.open(`${API_URL}/export-pdf`)}
          className={styles.button}
        >
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default FaceRecognition;
