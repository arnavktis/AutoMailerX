// 'use client'
// import { useEffect, useState } from "react";

// export default function Home() {
//   const [students, setStudents] = useState([]);
//   const [error, setError] = useState(null);
//   const [file, setFile] = useState(null);
//   const [uploading, setUploading] = useState(false);
//   const [message, setMessage] = useState("");

//   useEffect(() => {
//     fetch("http://localhost:8000/students")
//       .then((res) => {
//         if (!res.ok) throw new Error("Failed to fetch students");
//         return res.json();
//       })
//       .then((data) => setStudents(data))
//       .catch((err) => setError(err.message));
//   }, []);

//   const handleFileChange = (event) => {
//     setFile(event.target.files[0]);
//   };

//   const handleDrop = (event) => {
//     event.preventDefault();
//     const droppedFile = event.dataTransfer.files[0];
//     if (droppedFile && droppedFile.type === "text/csv") {
//       setFile(droppedFile);
//     } else {
//       alert("Please upload a valid CSV file.");
//     }
//   };

//   const handleDragOver = (event) => {
//     event.preventDefault();
//   };

//   const uploadFile = async () => {
//     if (!file) {
//       alert("Please select a file first.");
//       return;
//     }

//     setUploading(true);
//     setMessage("");

//     const formData = new FormData();
//     formData.append("file", file);

//     try {
//       const response = await fetch("http://localhost:8000/upload-csv/", {
//         method: "POST",
//         body: formData,
//       });

//       const result = await response.json();
//       if (response.ok) {
//         setMessage(result.message);
//       } else {
//         setMessage(result.detail || "File upload failed.");
//       }
//     } catch (error) {
//       setMessage("Error uploading file.");
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div>
//       <h1>Students List</h1>
//       {error ? <p style={{ color: "red" }}>Error: {error}</p> : null}
      
//       {/* Drag & Drop or Upload CSV Section */}
//       <div
//         onDrop={handleDrop}
//         onDragOver={handleDragOver}
//         style={{
//           border: "2px dashed gray",
//           padding: "20px",
//           textAlign: "center",
//           marginBottom: "20px",
//         }}
//       >
//         <p>Drag & drop a CSV file here or click to select</p>
//         <input type="file" accept=".csv" onChange={handleFileChange} />
//       </div>

//       <button onClick={uploadFile} disabled={uploading}>
//         {uploading ? "Uploading..." : "Upload CSV"}
//       </button>

//       {message && <p>{message}</p>}

//       {/* Students List */}
//       <ul>
//         {students.map((student, index) => (
//           <li key={index}>{JSON.stringify(student)}</li>
//         ))}
//       </ul>
//     </div>
//   );
// }


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
        {uploading ? "Uploading..." : "Upload CSV"}
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
              // className="bg-gray-900 p-3 rounded-md shadow-sm overflow-x-auto"
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
    padding: '0.75rem', // equivalent to p-3
    borderRadius: '0.375rem', // equivalent to rounded-md
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)', // equivalent to shadow-sm
    overflowX: 'auto',
  },
};