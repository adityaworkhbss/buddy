import { APP_CONFIG } from "../config/appConfigs";

import { auth, setupRecaptcha } from "./firebase";
import { signInWithPhoneNumber } from "firebase/auth";

async function sendCustomOtp(phone) {
    const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
    });

    return await res.json();
}

async function verifyCustomOtp(sessionId, otp) {
    const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, otp })
    });

    return await res.json();
}

async function sendFirebaseOtp(phone) {
    const recaptcha = setupRecaptcha();
    return await signInWithPhoneNumber(auth, phone, recaptcha);
}

async function verifyFirebaseOtp(confirmation, otp) {
    return await confirmation.confirm(otp);
}

export const OTP = {
    sendOtp: (phone) => {
        return APP_CONFIG.USE_FIREBASE_OTP
            ? sendFirebaseOtp(phone)
            : sendCustomOtp(phone);
    },

    verifyOtp: (sessionOrConfirmation, otp) => {
        return APP_CONFIG.USE_FIREBASE_OTP
            ? verifyFirebaseOtp(sessionOrConfirmation, otp)
            : verifyCustomOtp(sessionOrConfirmation.sessionId, otp);
    },

    isFirebase: APP_CONFIG.USE_FIREBASE_OTP
};
