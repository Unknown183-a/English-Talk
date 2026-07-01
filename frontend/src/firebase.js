import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCE4ujjjGt2__Yj9F4JNZ4aqfVZO76Qbpk",
  authDomain: "english-talk-b24183.firebaseapp.com",
  projectId: "english-talk-b24183",
  storageBucket: "english-talk-b24183.firebasestorage.app",
  messagingSenderId: "494415151789",
  appId: "1:494415151789:web:2f5259ae58dacde7ebfc24"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider)
export const logOut = () => signOut(auth)
