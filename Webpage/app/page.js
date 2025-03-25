'use client'
import { useEffect, useState } from "react";

export default function Home() {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/students")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch students");
        return res.json();
      })
      .then((data) => setStudents(data))
      .catch((err) => setError(err.message));
  }, []);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      setFile(droppedFile);
    } else {
      alert("Please upload a valid CSV file.");
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const uploadFile = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/upload-csv/", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        setMessage(result.message);
      } else {
        setMessage(result.detail || "File upload failed.");
      }
    } catch (error) {
      setMessage("Error uploading file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1>Students List</h1>
      {error ? <p style={{ color: "red" }}>Error: {error}</p> : null}
      
      {/* Drag & Drop or Upload CSV Section */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          border: "2px dashed gray",
          padding: "20px",
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        <p>Drag & drop a CSV file here or click to select</p>
        <input type="file" accept=".csv" onChange={handleFileChange} />
      </div>

      <button onClick={uploadFile} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload CSV"}
      </button>

      {message && <p>{message}</p>}

      {/* Students List */}
      <ul>
        {students.map((student, index) => (
          <li key={index}>{JSON.stringify(student)}</li>
        ))}
      </ul>
    </div>
  );
}
