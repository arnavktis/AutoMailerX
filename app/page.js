'use client'
import { useEffect, useState } from "react";

export default function Home() {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchStudents = async () => {
    try {
      const response = await fetch("https://backend-emailer-csv-1.onrender.com/students");
      if (!response.ok) throw new Error("Failed to fetch students");
      const data = await response.json();
      setStudents(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setStudents([]);
    }
  };

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
      const response = await fetch("https://backend-emailer-csv-1.onrender.com/upload-csv/", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        setMessage(result.message);
        // Fetch students immediately after successful upload
        await fetchStudents();
      } else {
        setMessage(result.detail || "File upload failed.");
      }
    } catch (error) {
      setMessage("Error uploading file.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Students List</h1>
      
      {error && (
        <p className="text-red-500 mb-4">Error: {error}</p>
      )}
      
      {/* Drag & Drop or Upload CSV Section */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-6 hover:border-gray-500 transition-colors"
      >
        <p className="text-gray-600 mb-4">Drag & drop a CSV file here or click to select</p>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange} 
          className="block w-full text-sm text-gray-500 
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-gray-50 file:text-gray-700
            hover:file:bg-gray-100"
        />
      </div>

      <button 
        onClick={uploadFile} 
        disabled={uploading}
        className={`w-full py-2 px-4 rounded ${
          uploading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 text-white hover:bg-blue-600'
        } transition-colors`}
      >
        {uploading ? "Sending Email..." : "Send Email"}
      </button>

      {message && (
        <p className={`mt-4 p-2 rounded ${
          message.includes('error') 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </p>
      )}

      {/* Students List */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Students</h2>
        <ul className="space-y-2">
          {students.map((student, index) => (
            <li 
              key={index} 
              style={styles.listItem}
            >
              {JSON.stringify(student)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const styles = {
  listItem: {
    backgroundColor: '#181818',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    overflowX: 'auto',
  },
};