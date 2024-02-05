import { z } from "zod"
import { getAuth, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, AuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import "firebaseui/dist/firebaseui.css"
import { useAuthState } from "react-firebase-hooks/auth"

import { app } from "./firebase"
import { Login } from "./Login"

export const LoginFormEntryZ = z.object({ email: z.string().email(), password: z.string() })

const SIGNIN_SUCCESS_URL = "test"
const TERMS_CONDITIONS_URL = "test"
const PRIVACY_POLICY_URL = "test"

export enum Status {
    Loading,
    Success,
    Error
}

export const auth = getAuth(app)

export const TagZ = z.object({
    id: z.number(), created: z.date(), name: z.string(), color: z.string(),
});
export type Tag = z.infer<typeof TagZ>


export const EntryZ = z.object({
    id: z.number(), created: z.date(), start: z.date(), note: z.string(), tags: z.array(TagZ),
});
export type Entry = z.infer<typeof EntryZ>


export const UserZ = z.object({
    uid: z.string(), created: z.coerce.date(), name: z.string(), birth: z.coerce.date(), expYears: z.number(), email: z.string().email(), entries: z.array(EntryZ), tags: z.array(TagZ),
});
export type User = z.infer<typeof UserZ>

export const InitialUserZ = UserZ.partial({ name: true, birth: true, expYears: true, email: true })

const providers: { [index: string]: AuthProvider } = {
    github: new GithubAuthProvider().addScope("read:user"),
    google: new GoogleAuthProvider().addScope("https://www.googleapis.com/auth/userinfo.profile")
}

export const authProvider = async (providerName: string) => {
    if (!(providerName in providers)) { throw Error }
    const user = await signInWithPopup(auth, providers[providerName])
        .then(res => res.user)
    console.log(user)
}

export const authEmailPassword = async (e: z.infer<typeof LoginFormEntryZ>) => {
    const { email, password } = LoginFormEntryZ.parse(e)
    signInWithEmailAndPassword(auth, email, password)
        .catch(() => createUserWithEmailAndPassword(auth, email, password))
        // .then(user => )
}

// export default () => {
//     useEffect(() => {
//         const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth);

//         ui.start("#firebaseui-auth-container", {
//             callbacks: {
//                 signInSuccessWithAuthResult: (authResult, redirectUrl) => {
//                     console.log("Signed in, authResult:", authResult)
//                     window.location.assign(redirectUrl)
//                     return true
//                 },
//                 uiShown: () => { document.getElementById("loader")!.style.display = "none" }
//             },
//             signInSuccessUrl: SIGNIN_SUCCESS_URL,
//             signInOptions: [
//                 {
//                     provider: firebase.auth.GithubAuthProvider.PROVIDER_ID,
//                     scopes: ["read:user"]
//                 },
//                 {
//                     provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
//                     requireDisplayName: true,
//                     disableSignUp: {
//                         status: true
//                     }
//                 }
//             ],
//             tosUrl: TERMS_CONDITIONS_URL,
//             privacyPolicyUrl: () => { window.location.assign(PRIVACY_POLICY_URL) }
//         });
//     }, []);

//     return <>
//         <div id="firebaseui-auth-container"></div>
//         <div id="loader">Loading...</div>
//     </>
// }