import { initializeApp } from "firebase/app"

export const firebaseConfig = {
    apiKey: "AIzaSyA-bK7ElDp76XhjTjkpzApULPLV8ZjQna4",
    authDomain: "lifecal-backend.firebaseapp.com",
    projectId: "lifecal-backend",
    storageBucket: "lifecal-backend.appspot.com",
    messagingSenderId: "531017479197",
    appId: "1:531017479197:web:cb03ad0e95beaa447a42f4",
}

export const app = initializeApp(firebaseConfig)
