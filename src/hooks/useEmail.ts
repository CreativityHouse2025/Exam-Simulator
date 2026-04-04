import { useState, useCallback } from "react";
import type { SendEmailRequestBody } from "../types";
import { apiFetch } from "../utils/apiFetch";

export function useEmail() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendEmail = useCallback(async (emailRequest: SendEmailRequestBody) => {
        setLoading(true);
        setError(null);

        try {
            const res = await apiFetch("/api/report/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(emailRequest),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to send email");
            }

            const data = await res.json();
            setLoading(false);
            return data; // contains { message, id }
        } catch (err: any) {
            setError(err.message || "Unknown error");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { sendEmail, loading, error };
}
