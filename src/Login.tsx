import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import firebase from "firebase/compat/app";
import * as firebaseui from "firebaseui"
import { auth } from "./firebase"
import "firebaseui/dist/firebaseui.css"

export const SIGNIN_SUCCESS_URL = "test"
const TERMS_CONDITIONS_URL = "test"
const PRIVACY_POLICY_URL = "test"

export default () => {
    useEffect(() => {
        const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth);

        ui.start("#firebaseui-auth-div", {
            callbacks: {
                signInSuccessWithAuthResult: function (authResult, redirectUrl) {                    
                    // TODO
                    return true
                },
                // uiShown: function () {
                //     document.getElementById("loader")!.style.display = "none";
                // }
            },
            signInSuccessUrl: SIGNIN_SUCCESS_URL,
            signInOptions: [
                {
                    provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
                    requireDisplayName: true,
                    disableSignUp: {
                        status: true
                    }
                }
            ],
            tosUrl: TERMS_CONDITIONS_URL,
            privacyPolicyUrl: function () {
                window.location.assign(PRIVACY_POLICY_URL);
            }
        });
    }, []);

    return <div id="firebaseui-auth-div"></div>
}