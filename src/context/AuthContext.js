import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { setDoc, doc } from 'firebase/firestore';

const UserContext = createContext();


export const AuthContextProvider = ({ children }) => {
    const [user, setUser] = useState({});
    const [highlevelerror, setHighLevelError] = useState(null);

    const createUser = async (name, email, password) => {
        try {
           const { user } = await createUserWithEmailAndPassword(
             auth,
             email,
             password
           );
           await updateProfile(auth.currentUser, {
             displayName: name,
             dateCreated: new Date().toISOString(),
           });
           await setDoc(doc(db, 'users', user.uid), {
             uid: user.uid,
             email: user.email,
             name: user.displayName,
             dateCreated: user.metadata.creationTime,
           });
           setUser(user);
         } catch (error) {
           console.log(error);
         }
     };
   
     const resetPassword = async (email) => {
       return sendPasswordResetEmail(auth, email);
     };
   
      const signIn = (email, password) =>  {
       return signInWithEmailAndPassword(auth, email, password)
      }
   
     const logout = () => {
         return signOut(auth)
     }
   
     useEffect(() => {
       const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
         console.log(currentUser);
         setUser(currentUser);
       });
       return () => {
         unsubscribe();
       };
     }, []);
   
     return (
       <UserContext.Provider value={{ createUser, user, logout, signIn, resetPassword }}>
         {children}
       </UserContext.Provider>
     );
   };
   
   export const UserAuth = () => {
     return useContext(UserContext);
   };
   