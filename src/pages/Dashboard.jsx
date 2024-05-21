import React, { useState, useEffect, useRef } from "react";
import {
  Image,
  message,
  Popconfirm,
  Tooltip,
  Dropdown,
  Switch,
  Spin,
} from "antd";
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
  orderBy,
} from "firebase/firestore";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db, storage } from "../firebase";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const Dashboard = () => {
  const { user, logout } = UserAuth();
  const navigate = useNavigate();

  const [isHidden, setIsHidden] = useState(false);
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
  const [useAI, setUseAI] = useState(true);
  const [answering, setAnswering] = useState(false);
  const genAI = new GoogleGenerativeAI(
    process.env.REACT_APP_GOOGLE_GEMINI_API_KEY
  );

  const AskAI = async ({ Question }) => {
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

      const prompt =
        "Do not use ** or any other HTML tags in your output \n" + Question;

      const result = await chat.sendMessage(prompt);
      const response = result.response;
      const text = response.text();
      // sending the response to the firestore database to apear on the UI
      try {
        await addDoc(collection(db, "sessions", activeSession.id, "inputs"), {
          text: Question + "? A: " + text,
          createdAt: new Date(),
          type: "text",
        });
      } catch (error) {
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

  // uploading images/files
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

  // listing all the sessions
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

  // Adding new session
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
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files).map((file) => ({
      file,
      type: file.type,
    }));
    setUploadedFiles(files);
  };

  // logging out
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
      console.log("Logged out successfully");
    } catch (error) {
      console.log(error.message);
    }
  };

  // adding input to the session
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

  // User is in the UK or not
  const [isUK, setIsUK] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  useEffect(() => {
    const checkLocation = async () => {
      setIsChecking(true);
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      if (data?.country === "GB") {
        setIsUK(true);
      } else {
        setIsUK(false);
      }
      setIsChecking(false);
    };
    checkLocation();
  }, []);

  return (
    <div className="flex bg-slate-900 h-screen w-full">
      {!isHidden && (
        <div className="w-1/5  max-h-screen overflow-auto">
          {!isHidden && (
            <div className="flex">
              <button
                onClick={() => setIsHidden(!isHidden)}
                className="bg-slate-800 p-2 m-2 rounded-lg text-slate-300  hover:bg-slate-700 float-right"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-9 h-9"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d={`${
                      isHidden
                        ? "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
                        : "M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25"
                    }`}
                  />
                </svg>
              </button>
              <button
                className="bg-slate-800 p-2 m-2 rounded-lg text-slate-300  hover:bg-slate-700 float-left"
                onClick={handleNewSession}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-9 h-9"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
              </button>
             
            </div>
          )}

          <div className="overflow-auto h-screen md:bg-slate-900">
            <ul className="p-2">
              {sessions.map((session) => (
                <li
                  key={session.id}
                  onClick={() => handleSessionClick(session)}
                  className={`p-2 bg-slate-700 my-2 text-slate-200 text-xl rounded-lg hover:bg-slate-600 cursor-pointer ${
                    activeSession?.id === session.id ? "bg-slate-500" : ""
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <p className="text-center">
                      <Tooltip title={session.name}>
                        {session.name && session.name.length > 25
                          ? session.name.slice(0, 25) + "..."
                          : session.name}
                      </Tooltip>
                    </p>
                    <button className="m-2" onClick={() => message.info("Do not know what to do with button")}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-6 h-6"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <div className={isHidden ? "bg-slate-900 w-full" : "w-4/5 bg-slate-900"}>
        {/* Content of the second column */}

        <div className="flex flex-col h-full   justify-between w-full ">
          <div className="flex justify-between items-center ">
            <div className="flex justify-start items-center w-full  ">
              {isHidden && (
                <>
                  <button
                    onClick={() => setIsHidden(!isHidden)}
                    className="bg-slate-900 p-2 m-2 rounded-lg text-slate-100 float-left hover:bg-slate-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="w-9 h-9"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d={`${
                          isHidden
                            ? "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
                            : "M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25"
                        }`}
                      />
                    </svg>
                  </button>

                  <button
                    className="bg-slate-900 p-2 m-2 rounded-lg text-slate-100 float-left hover:bg-slate-700"
                    onClick={handleNewSession}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="w-9 h-9"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z"
                      />
                    </svg>
                  </button>
                  
                </>
              )}
              <p className="text-2xl text-bold text-slate-100">
                {activeSession?.name}
              </p>
              {activeSession && (
                <>
                  {!sessionNameEdit ? (
                    <button
                      className="bg-slate-900 p-2 m-2 rounded-lg text-slate-100 float-left hover:bg-slate-700"
                      onClick={() => setSessionNameEdit(true)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-4 h-4"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                        />
                      </svg>
                    </button>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        className="bg-slate-900 p-2 mx-4 rounded-lg text-slate-100 float-left hover:bg-slate-700"
                      />
                      <button
                        onClick={() =>
                          handleSessionNameChange(activeSession.id)
                        }
                        className="bg-blue-700 p-2 m-2 rounded-lg text-slate-100 float-left hover:bg-blue-600"
                      >
                        {" "}
                        Save{" "}
                      </button>
                      <button
                        onClick={() => setSessionNameEdit(false)}
                        className="bg-red-700 p-2 m-2 rounded-lg text-slate-100 float-left hover:bg-red-600"
                      >
                        {" "}
                        Cancel{" "}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-center items-center">
              {activeSession && (
                <Popconfirm
                  title="Are you sure you want to delete this session?"
                  onConfirm={() => deleteSession(activeSession.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <button className="bg-slate-900 p-2 m-2 rounded-lg text-red-100 float-left hover:bg-red-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="w-6 h-6"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                </Popconfirm>
              )}
              <button
                onClick={() => navigate("/profile")}
                className="bg-slate-900 p-2 m-2 rounded-lg text-slate-300  hover:bg-slate-700 float-right"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-9 h-9"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
              </button>

            </div>
          </div>

          {/* Main content */}
          <div className="flex justify-center items-start h-full w-full  overflow-auto">
            {/* <p className="text-2xl">Select a session and start typing...</p> */}

            <div
              ref={outputContainerRef}
              className="flex flex-col bg-slate-900 w-full overflow-scroll h-full"
            >
              {inputDetails.length === 0 ? (
                <div className="flex justify-center w-full items-center h-full">
                  {activeSession === null && (
                    <p className="text-4xl text-slate-100">
                      Select a session and start typing...
                    </p>
                  )}
                  {activeSession !== null && (
                    <p className="text-4xl text-slate-100">
                      New session created. Start typing...
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {inputDetails?.map((input) => (
                    <div
                      className="flex flex-col justify-between items-start p-4 m-4 "
                      key={input.id}
                    >
                      <div className="flex flex-row">
                        <button
                          className="bg-slate-900 p-2 m-2 rounded-lg text-slate-100 float-left hover:bg-slate-700"
                          onClick={() => handleCopyToClipboard(input.text)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-6 h-6"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                            />
                          </svg>
                        </button>
                        <Popconfirm
                          title="Are you sure you want to delete this chat?"
                          onConfirm={() => deleteChat(input.id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <button className="bg-slate-900 p-2 m-2 rounded-lg text-red-100 float-left hover:bg-red-700">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke-width="1.5"
                              stroke="currentColor"
                              class="w-6 h-6"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                              />
                            </svg>
                          </button>
                        </Popconfirm>
                        <button
                          className="bg-slate-900 p-2 m-2 rounded-lg text-slate-100 float-left hover:bg-slate-700"
                          onClick={() => {
                            isUK
                              ? message.error(
                                  "AI is not available in the UK, Use VPN or teleport to another country"
                                )
                              : AskAI({ Question: input.text });
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-6 h-6"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                            />
                          </svg>
                        </button>

                        <button
                          className="bg-slate-900 p-2 m-2 rounded-lg text-slate-100 float-left hover:bg-slate-700"
                          onClick={() => textToSpeech(input.text)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-6 h-6"
                          >
                            {isSpeaking ? (
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
                              />
                            ) : (
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
                              />
                            )}
                          </svg>
                        </button>
                      </div>

                      <div className="flex flex-col justify-between items-start  rounded-lg w-full">
                        {input?.type === "image" && (
                          <Image
                            src={input?.files[0].url}
                            alt="image"
                            width={`100%`}
                            height={`100%`}
                            className="rounded-lg mb-4"
                          />
                        )}

                        {input.type === "application" && (
                          <>
                            {input?.files.map(({ url }, index) => (
                              <div
                                key={index}
                                className="flex flex-col justify-between items-start bg-slate-800 m-2 w-full"
                              >
                                <iframe
                                  src={url}
                                  width="100%"
                                  height="500px"
                                  title="file"
                                />
                              </div>
                            ))}
                          </>
                        )}

                        <p className="text-2xl ml-2 bg-slate-800 p-4 rounded-lg text-slate-400">
                          {input?.type === "text" ? (
                            input.text
                          ) : (
                            <a
                              href={input?.files[0].url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {input?.text}
                            </a>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="flex justify-center items-center p-4 bg-slate-900">
            <div class="flex items-center bg-red-400 w-full rounded-lg">
              <div class="relative w-full">
                <label for="dropzone-file" class="flex items-center w-full">
                  <div class="absolute inset-y-0 start-0 flex items-center ps-3">
                    <input
                      type="file"
                      id="dropzone-file"
                      aria-hidden="true"
                      class="hidden"
                      multiple
                      onChange={handleFileUpload}
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="w-6 h-6 text-slate-300 hover:text-slate-400"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776"
                      />
                    </svg>
                  </div>
                </label>
                <input
                  type="text"
                  class="bg-slate-800 border border-slate-900 text-slate-400 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block w-full ps-10 p-2.5  "
                  placeholder="Enter your text / upload a file"
                  required
                  value={userInput}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  class="absolute inset-y-0 end-7 flex items-center pe-3 text-slate-100 hover:text-slate-400"
                  aria-hidden="true"
                  onClick={() => addInputToSession()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-6 h-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m15 11.25-3-3m0 0-3 3m3-3v7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  class="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-300 hover:text-slate-400"
                  onClick={() => {
                    isUK
                      ? message.error(
                          "AI is not available in the UK, Use VPN or teleport to another country"
                        )
                      : AskAI({ Question: userInput });
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-6 h-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
