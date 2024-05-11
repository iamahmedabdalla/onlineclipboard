import React, { useState, useEffect, useRef } from "react";
import {
  FaArrowUp,
  FaBars,
  FaCopy,
  FaEdit,
  FaFile,
  FaMicrochip,
  FaMicrophone,
  FaMicrophoneAltSlash,
  FaRobot,
  FaTimes,
  FaTrash,
  FaUser,
} from "react-icons/fa";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  where,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db, storage } from "../firebase";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { Image, message, Popconfirm, Tooltip, Switch, Spin } from "antd";

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");


const Dashboard = () => {
  const { user, logout } = UserAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [userInput, setUserInput] = useState("");
  const [inputDetails, setInputDetails] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [imagesUrls, setImagesUrls] = useState([]);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [error, setError] = useState(null);
  const outputContainerRef = useRef(null);

  // edit the session name
  const [sessionName, setSessionName] = useState("");
  const [sessionNameEdit, setSessionNameEdit] = useState(false);

  // using AI to answer some question
  const [useAI, setUseAI] = useState(true)
  const [answering, setAnswering] = useState(false)
  const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GOOGLE_GEMINI_API_KEY);

  const AskAI = async ( { Question } ) => {
    if (useAI) {
    setAnswering(true);

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const generationConfig = {
      temperature: 1,
      topK: 0,
      topP: 0.95,
      maxOutputTokens: 8192,
    };
  
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];

    const chat = model.startChat({
      generationConfig,
      safetySettings,
    });
    

    const prompt =  "Do not use ** or any other HTML tags in your output \n" + Question;
    
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    const text = response.text();
    // send the response to the firestore database
    try {
      await addDoc(
        collection(db, "sessions", activeSession.id, "inputs"),
        { text: Question + "? A: " + text, createdAt: new Date(), type: "text" }
      );
    } 
    catch (error) {
      console.log(error.message);
      message.error("Error adding input to session");
    }
    setAnswering(false);
    } else {
      message.error("AI is turned off");
    }
  };

  // using text to speech
  const [isSpeaking, setIsSpeaking] = useState(false);
  const textToSpeech = (text) => {
    if (!isSpeaking) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    } else {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };



  

  useEffect(() => {
    const uploadFiles = async () => {
      const promises = uploadedFiles.map(async ({ file, type }) => {
        const fileType = type.split("/")[0];
        const storageRef = ref(
          storage,
          `users/${user.email}/${fileType}s/${file.name}`
        );
        const uploadTask = uploadBytesResumable(storageRef, file);

        try {
          const snapshot = await uploadTask;
          const downloadURL = await getDownloadURL(snapshot.ref);
          setImagesUrls(downloadURL);
          return { url: downloadURL, type: fileType };

          
          
        } catch (error) {
          console.log(error);
          throw error;
        }
      });

      try {
        const files = await Promise.all(promises);
        console.log("Files uploaded successfully:", files);
        message.success({
          content: "Files uploaded successfully",
          key: "uploading",
          duration: 2,
        });
        // url of the first file uploaded
        setImagesUrls(files.map((file) => file.url));
        setUserInput(uploadedFiles[0].file.name);
      } catch (error) {
        console.log(error);
      }
    };

    if (uploadedFiles?.length > 0) {
      message.loading({ content: "Uploading files...", key: "uploading" });
      uploadFiles();
    }
  }, [uploadedFiles, user.email]);

  useEffect(() => {
    if (user && user?.email) {
      const unsubscribe = onSnapshot(
        query(collection(db, "sessions"), where("owner", "==", user.email)),
        (snapshot) => {
          const sessionsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setSessions(sessionsData);
        }
      );

      return () => {
        unsubscribe();
      };
    } else {
      // message.error("User not found" + user + user.email);
    }
  }, [user]);

  useEffect(() => {
    if (!activeSession) return;

    const unsubscribe = onSnapshot(
      collection(db, "sessions", activeSession.id, "inputs"),
      (snapshot) => {
        const inputDetailsData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((b, a) => b.createdAt - a.createdAt);

        setInputDetails(inputDetailsData);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeSession]);

  useEffect(() => {
    if (outputContainerRef.current) {
      outputContainerRef.current.scrollTop =
        outputContainerRef.current.scrollHeight;
    }
  }, [inputDetails]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNewSession = async () => {
    const newSession = {
      name: `Session ${sessions.length + 1}`,
      createdAt: new Date(),
      owner: user.email,
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
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files).map((file) => ({
      file,
      type: file.type,
    }));
    setUploadedFiles(files);
  };

  const toggleProfilePopup = () => {
    setIsProfilePopupOpen(!isProfilePopupOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
      console.log("Logged out successfully");
    } catch (error) {
      console.log(error.message);
    }
  };

  const addInputToSession = async () => {
    if (!activeSession) {
      message.warning("Please select a session");
      return;
    }
    if (!userInput) {
      message.warning("Please enter something in the input field");
      return;
    }

    const newInput = {
      text: userInput,
      files: uploadedFiles.map(({ file }) => ({
        url: imagesUrls,
        type: file.type,
      })),
      createdAt: new Date(),
      type:
        uploadedFiles.length > 0 ? uploadedFiles[0].type.split("/")[0] : "text",
    };

    // alert("User input: " + userInput);

    try {
      await addDoc(
        collection(db, "sessions", activeSession.id, "inputs"),
        newInput
      );
      setUserInput("");
      setUploadedFiles([]);
    } catch (error) {
      setError(error.message);
      alert("Error adding input to session");
    }
  };

  const deleteChat = async (id) => {
    try {
      await deleteDoc(doc(db, "sessions", activeSession.id, "inputs", id));
    } catch (error) {
      console.log(error.message);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      const sessionRef = doc(db, "sessions", sessionId);
      const sessionDoc = await getDoc(sessionRef);
      if (sessionDoc.exists() && sessionDoc.data().owner === user.email) {
        await deleteDoc(sessionRef);
        console.log("Session deleted successfully");
      } else {
        console.log("Session not found or does not belong to the user");
      }
    } catch (error) {
      console.error("Error deleting session: ", error);
    }
  };

  const handleCopyToClipboard = (text) => {
    if (!navigator.clipboard) {
      message.error("Clipboard API not available");
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => {
        message.success("Copied to clipboard");
      },
      (err) => {
        console.error("Error copying to clipboard:", err);
        message.error("Failed to copy to clipboard");
      }
    );
  };

  const handleSessionNameChange = (sessionId) => {
    const sessionRef = doc(db, "sessions", sessionId);
    setSessionNameEdit(false);
    try {
      setDoc(sessionRef, { name: sessionName }, { merge: true });
    } catch (error) {
      console.log(error.message);
      message.error(error.message);
    }
  };

  return (
    <div className="flex h-screen">
      {answering && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
          <Spin size="large" />
        </div>
      )}
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "w-72" : "w-0"
        } bg-gray-900 text-white fixed top-0 left-0 h-full z-10 transition-all duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between p-4">
          <h2 className="text-xl font-bold">Sessions</h2>
          <button
            className="text-gray-400 hover:text-white focus:outline-none"
            onClick={toggleSidebar}
          >
            {/* {isSidebarOpen ? <FaTimes /> : <FaBars />} */}
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
            <ul className="overflow-y-auto h-3/4">
              {sessions.map((session) => (
                <li
                  key={session.id}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-600 ${
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
                    href="/profile"
                    className="block px-4 py-2 text-white hover:bg-gray-600"
                  >
                    Profile
                  </a>
                  <button
                    className="block w-full text-left px-4 py-2 text-white hover:bg-gray-600"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main Window */}
      <div className="flex-1 bg-gray-900 p-4 ml-72">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl text-gray-300 font-bold">
              {activeSession?.name}
            </h2>
            {activeSession && (
              <>
              <Tooltip title="Edit Session Name">
                <button
                  onClick={() => setSessionNameEdit(!sessionNameEdit)}
                  className="text-gray-400 hover:text-white focus:outline-none"
                >
                  <FaEdit />
                </button>
              </Tooltip>
              <Switch checked={useAI} onChange={(checked) => setUseAI(checked)} />
              
            {/* <span className="text-white">
              Use AI 
            </span>
            <button onClick={AskAI}>Run AI</button>
            <span className="text-red-400"> Debug: AI is {useAI ? "ON" : "OFF"}</span> */}
              </>

            )}
            
            {sessionNameEdit === true && (
              <>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Session Name"
                  className=" px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none"
                />
                <button
                  onClick={() =>
                    sessionName === ""
                      ? message.error("Session name cannot be empty")
                      : handleSessionNameChange(activeSession.id)
                  }
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
                >
                  Save{" "}
                </button>
                <button
                  onClick={() => setSessionNameEdit(false)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {activeSession && (
              
              <Popconfirm
                title="Are you sure you want to delete this session?"
                onConfirm={() => deleteSession(activeSession.id)}
                okText="Yes"
                cancelText="No"
              >
                <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none">
                  Delete
                </button>
              </Popconfirm>
            )}
          </div>
        </div>

        {/* Output Field */}
        <div ref={outputContainerRef} className="mt-4 h-5/6 overflow-y-auto">
          {inputDetails.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              {activeSession === null && (
                <h1 className="text-5xl text-gray-300">
                  Select a session and start typing...
                </h1>
              )}
              {inputDetails.length === 0 && activeSession !== null && (
                <h1 className="text-5xl text-gray-300">No chat available</h1>
              )}
            </div>
          ) : (
            <div className="p-4">
              {inputDetails.map((input) => (
                <div
                  key={input.id}
                  className=" p-2 bg-gray-800 rounded mt-2 flex items-start justify-between"
                >
                  <div className="flex flex-col  w-full space-y-3">
                    {input.type === "image" && (
                      <div className="flex items-center space-x-2">
                        {input.files.map(({ url }, index) => (
                          <Image
                            width={`100%`}
                            src={url}
                            key={index}
                            alt="image"
                          />
                        ))}
                      </div>
                    )}
                    {input.type === "application" && (
                      <div>
                        {input.files.map(({ url }, index) => (
                          <div key={index} className="mt-2">
                            <iframe
                              src={url}
                              width="100%"
                              height="500px"
                              title="file"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-lg text-white break-words">
                      {input.type === "text" ? input.text : <a href={input?.files[0].url} target="_blank" rel="noreferrer">{input?.text}</a>}
                    </p>
                  </div>
                  <div className="flex flex-col p-2 space-y-3">
                    <button
                      className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      onClick={() =>
                        handleCopyToClipboard(
                          input?.type === "text"
                            ? input.text
                            : input.files[0].url
                        )
                      }
                    >
                      <FaCopy />
                    </button>
                    <Popconfirm
                      title="Are you sure you want to delete this chat?"
                      onConfirm={() => deleteChat(input.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <button className="flex w-full justify-center rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                        <FaTrash />
                      </button>
                    </Popconfirm>
                    
                    <button
                      className="flex w-full justify-center rounded-md bg-blue-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      onClick={() => AskAI({ Question: input.text })}
                    >
                      <FaRobot />
                    </button>
                    <button
                      className="flex w-full justify-center rounded-md bg-green-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-green-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      onClick={() => textToSpeech(input.text)}
                    >
                      {isSpeaking ? <FaMicrophoneAltSlash /> : <FaMicrophone />}
                    </button>
                    

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Field */}
        <div className="p-4">
          <div className="flex items-center bottom-0">
            <textarea
              id="user-input"
              type="text"
              value={userInput}
              onChange={handleInputChange}
              placeholder="Enter your text here..."
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none"
            />

            <div className="flex items-center space-x-4">
              <button
                className="px-3 py-3 bg-gray-600 ml-4 text-white hover:bg-lime-700 focus:outline-none rounded-full"
                onClick={() => addInputToSession()}
              >
                <FaArrowUp />
              </button>

              {useAI && (
              <button
                className="px-3 py-3 bg-gray-600 text-white hover:bg-lime-700 focus:outline-none rounded-full"
                onClick={() => AskAI({ Question: userInput })}
              >
                <FaMicrochip />
              </button>
              )}


              <label
                htmlFor="file-upload"
                className="px-3 py-3 bg-gray-600 text-white rounded-full hover:bg-lime-700 focus:outline-none"
              >
                <FaFile />
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  multiple
                />
              </label>
            </div>
          </div>
          {error && <p className="mt-2 text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
