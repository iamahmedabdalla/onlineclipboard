import React, { useState, useEffect } from "react";
import { FaBars, FaTimes, FaUpload, FaUser } from "react-icons/fa";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db, storage } from "../firebase";

const Dashboard = () => {
  const { user, logout } = UserAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [userInput, setUserInput] = useState("");
  const [inputDetails, setInputDetails] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "sessions"), (snapshot) => {
      const sessionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSessions(sessionsData);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNewSession = async () => {
    const newSession = {
      name: `Session ${sessions.length + 1}`,
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, "sessions"), newSession);
    setActiveSession({ id: docRef.id, ...newSession });
    setUserInput("");
    setUploadedFiles([]);
  };

  const handleSessionClick = (session) => {
    setActiveSession(session);
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const handleRefreshFiles = () => {
    // Logic to refresh the displayed files
    // You can make an API call or update the state based on your requirements
    console.log("Refreshing files...");
  };

  const toggleProfilePopup = () => {
    setIsProfilePopupOpen(!isProfilePopupOpen);
  };

  const handleLogout = () => {
    try {
      logout();
      navigate("/login");
      console.log("Logged out successfully");
    } catch (error) {
      console.log(error.message);
    }
  };

  const addInputToSession = async () => {
    if (!activeSession) {
      alert("Please select a session first");
      return;
    }

    const newInput = {
      text: userInput,
      createdAt: new Date(),
    };

    try {
      await addDoc(
        collection(db, "sessions", activeSession.id, "inputs"),
        newInput
      );
      setUserInput("");
    } catch (error) {
      setError(error.message);
    }
  };

  // fetching session input details
  // fetching session input details
  useEffect(() => {
    if (!activeSession) return;

    const unsubscribe = onSnapshot(
      collection(db, "sessions", activeSession.id, "inputs"),
      (snapshot) => {
        let inputDetailsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort the data in descending order by createdAt time
        inputDetailsData = inputDetailsData.sort(
          (b, a) => b.createdAt - a.createdAt
        );

        setInputDetails(inputDetailsData);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeSession]);

  const deleteChat = async (id) => {
    try {
      await deleteDoc(doc(db, "sessions", activeSession.id, "inputs", id));
    } catch (error) {
      console.log(error.message);
    }
  }

  const deleteSession = async (sessionId) => {
    const confirmation = window.confirm("Are you sure you want to delete this session?");
    if (confirmation) {
      try {
        await deleteDoc(doc(db, "sessions", sessionId));
        console.log("Session deleted successfully");
      } catch (error) {
        console.error("Error deleting session: ", error);
      }
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "w-72" : "w-0"
        } bg-gray-800 text-white fixed top-0 left-0 h-full z-10 transition-all duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between p-4">
          <h2 className="text-xl font-bold">Sessions</h2>
          <button
            className="text-gray-400 hover:text-white focus:outline-none"
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
        {isSidebarOpen && (
          <>
            <button
              className="w-full text-left px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 focus:outline-none"
              onClick={handleNewSession}
            >
              New Session
            </button>
            <ul className="mt-4">
              {sessions.map((session) => (
                <li
                  key={session.id}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-600  ${
                    activeSession?.id === session.id ? "bg-gray-700" : ""
                  }`}
                  onClick={() => handleSessionClick(session)}
                >
                  {session.name}
                </li>
              ))}
            </ul>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaUser className="text-gray-400 mr-2" />
                  <span>{user?.displayName}</span>
                </div>
                <button
                  className="text-gray-400 hover:text-white focus:outline-none"
                  onClick={toggleProfilePopup}
                >
                  <FaBars />
                </button>
              </div>
              {isProfilePopupOpen && (
                <div className="mt-2 bg-gray-700 rounded shadow">
                  <a
                    href="#"
                    className="block px-4 py-2 text-white hover:bg-gray-600"
                  >
                    Profile
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-white hover:bg-gray-600"
                    onClick={handleLogout}
                  >
                    Logout
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main Window */}
      <div className="flex-1 p-4  ml-72">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {activeSession?.name}
            </h2>
          <div className="flex items-center space-x-4">
            {/* <button
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
            onClick={handleRefreshFiles}
          >
            Refresh
          </button> */}
            {activeSession && (
            <button 
            onClick={() => deleteSession(activeSession?.id)}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none">
              Delete
            </button>
            )}
          </div>
        </div>
        {/* Output Field */}
        <div className="mt-4 rounded shadow h-5/6 overflow-y-auto">
            {inputDetails.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                <h1 className="text-5xl text-gray-300">Start typing...</h1>
                </div>
            ) : (
               
                <div className="p-4">
                    {inputDetails.map((input) => (
                        <div key={input.id} className="bg-gray-700 p-2 rounded mt-2 flex items-center justify-between">
                        <p className="text-white">{input.text}</p>
                        <button 
                        onClick={() => deleteChat(input.id)}
                        className="ml-3 text-red-500 hover:text-red-600 focus:outline-none"
                        >Delete</button>

                        </div>
                    ))}
                </div>
            )}
        </div>
        {/* Input Field */}

        <div className="p-4 h-1/6">
          <div className="flex items-center bottom-0 ">
            <textarea
              id="user-input"
              type="text"
              value={userInput}
              onChange={handleInputChange}
              placeholder="Enter your text here..."
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none"
            />

            {userInput !== "" && (
              <button
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none"
                onClick={addInputToSession}
              >
                Send
              </button>
            )}
          </div>
          <div className="mt-4">
            {uploadedFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between bg-gray-200 p-2 rounded mt-2"
              >
                <div className="flex items-center">
                  <FaUpload className="text-gray-600 mr-2" />
                  <span>{file.name}</span>
                </div>
                <button className="text-red-500 hover:text-red-600 focus:outline-none">
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
