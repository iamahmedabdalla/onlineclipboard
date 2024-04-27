import React, {useState, useEffect} from "react";
import { FaMapMarkerAlt, FaLink, FaCalendarAlt, FaEdit, FaLock, FaSignOutAlt, FaCheckDouble, FaCopyright, FaList, FaArrowAltCircleDown, FaArrowAltCircleLeft, FaArrowLeft } from "react-icons/fa";
import { UserAuth } from "../context/AuthContext";
import {
    collection,
    addDoc,
    onSnapshot,
    deleteDoc,
    doc,
    query,
    where,
    getDoc,
  } from "firebase/firestore";
  import { db, storage } from "../firebase";
  import { message } from "antd";





const Profile = () => {

    const { user, logout } = UserAuth();

    const achievements = [
        { id: 1, name: "Early Adopter", description: "Joined in the first month" },
        { id: 2, name: "Power User", description: "Created 100+ sessions" },
        { id: 3, name: "Prolific Writer", description: "Wrote 1000+ inputs" },
      ];

    const [totalSessions, setTotalSessions] = useState(0);
    const [totalInputs, setTotalInputs] = useState(0);

    useEffect(() => {
        if (user && user.email) {
          const q = query(collection(db, "sessions"), where("owner", "==", user?.email));
          const unsubscribe = onSnapshot(q, (querySnapshot) => {
            let sessions = [];
            let inputs = [];
            querySnapshot.forEach((doc) => {
              sessions.push(doc.data());
              doc.data()?.inputs?.forEach((input) => {
                inputs.push(input);
              });
            });
            setTotalSessions(sessions.length);
            setTotalInputs(inputs.length);
          });
          return () => unsubscribe();
        }
      }, [user]);





  return (
    <div className="container mx-auto px-4 py-8 bg-gray-900 text-gray-100">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Profile</h1>
        <div className="flex items-end space-x-4">
        
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
          onClick={() => window.history.back()}
        >
            <FaArrowLeft className="inline-block mr-2" />
            Back
        </button>

        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none"
          onClick={logout}
        >
          <FaSignOutAlt className="inline-block mr-2" />
          Logout
        </button>
        </div>
      </div>

      <div className="shadow rounded-lg p-6 text-gray-100 bg-gray-800">
        <div className="flex items-center mb-6">
          <img
            src={user.avatarUrl || "https://xsgames.co/randomusers/avatar.php?g=pixel"}
            alt="User Avatar"
            className="w-24 h-24 rounded-full mr-6"
          />
          <div>
            <h2 className="text-2xl font-bold">{user.displayName}</h2>
            <p className="text-gray-300">{user.email}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-300">
            {user.bio || `${user.displayName} hasn't written a bio yet.`}
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="flex items-center">
            <FaMapMarkerAlt className="text-gray-300 mr-2" />
            <span className="text-gray-200">{user.location || "Earth"}</span>
          </div>
          <div className="flex items-center">
            <FaLink className="text-gray-300 mr-2" />
            <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              {user.website || "No website"}
            </a>
          </div>
          <div className="flex items-center">
            <FaCalendarAlt className="text-gray-300 mr-2" />
            <span className="text-gray-200">Joined on {user?.metadata?.creationTime}</span>
          </div>
          <div className="flex items-center">
            <FaList className="text-gray-300 mr-2" />
            <span className="text-gray-200">Last Login {user?.metadata?.lastSignInTime}</span>
          </div>
        </div>

        <div className="mb-6 ">
          <h3 className="text-xl text-gray-300 font-bold mb-2">Activity</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-300">Total Sessions</p>
              <p className="text-2xl font-bold">
                {totalSessions}
                </p>
            </div>
            <div className="bg-gray-900  rounded-lg p-4">
              <p className="text-gray-300">Total Inputs</p>
              <p className="text-2xl font-bold">{
                totalInputs
              }</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl text-gray-300  font-bold mb-2">Achievements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="bg-yellow-900 rounded-lg p-4">
                <h4 className="text-lg font-bold mb-2">{achievement.name}</h4>
                <p className="text-gray-200">{achievement.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          
          <button 
          onClick={() => message.info("Feature not implemented yet")}
          className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 focus:outline-none mr-4">
            <FaEdit className="inline-block mr-2" />
            Edit Profile
          </button>
          <button 
          onClick={() => message.info("Feature not implemented yet")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none">
            <FaLock className="inline-block mr-2" />
            Change Password
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile