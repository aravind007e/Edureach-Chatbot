// Vapi Voice Assistant Configuration
export const getVapiAssistantId = (): string => {
  return import.meta.env.VITE_VAPI_ASSISTANT_ID || "3be188b0-a538-47cc-86a7-e3743e291f32";
};

export const getVapiPublicKey = (): string => {
  return import.meta.env.VITE_VAPI_PUBLIC_KEY || "89c8ac73-dfa6-4d65-bf52-fab22fde2291";
};