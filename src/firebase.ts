import { initializeApp } from "firebase/app"

const firebaseConfig = {
    apiKey: "AIzaSyAU7YNgOeToGurqKm8Dk7gthGmqc_QGfbo",
    authDomain: "lifecal.web.app",
    projectId: "lifecal-backend",
    storageBucket: "lifecal-backend.appspot.com",
    messagingSenderId: "531017479197",
    appId: "1:531017479197:web:da88984f47b770027a42f4",
}

export const app = initializeApp(firebaseConfig)
