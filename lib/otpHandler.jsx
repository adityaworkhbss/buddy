import { APP_CONFIG } from "../config/appConfigs";

async function sendCustomOtp(phone) {
    const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
    });

    const data = await res.json();

    if (!res.ok || data.error) {
        const errorMessage = data.error || data.message || "Failed to send OTP";
        const error = new Error(errorMessage);
        error.details = data;
        throw error;
    }

    return data;
}

async function verifyCustomOtp(sessionId, otp) {
    try {
        const res = await fetch("/api/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, otp })
        });

        let data;
        try {
            data = await res.json();
        } catch (jsonError) {
            // If JSON parsing fails, return error response
            console.error("Failed to parse response as JSON:", jsonError);
            return {
                success: false,
                message: res.status === 400 
                    ? "Invalid request. Please check your input and try again."
                    : "An error occurred while verifying OTP. Please try again."
            };
        }
        
        // Always return the data, even if status is not ok (400, 500, etc.)
        // The caller will check result.success to handle errors
        // This ensures we get error messages from the API for all status codes
        return data;
    } catch (error) {
        // Handle network errors or other fetch errors
        console.error("Error verifying OTP:", error);
        return {
            success: false,
            message: error.message || "Network error. Please check your connection and try again."
        };
    }
}

export const OTP = {
    sendOtp: (phone) => {
        return sendCustomOtp(phone);
    },

    verifyOtp: (sessionOrConfirmation, otp) => {
        return verifyCustomOtp(sessionOrConfirmation.sessionId, otp);
    },

    isFirebase: false
};
