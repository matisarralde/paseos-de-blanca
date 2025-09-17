const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);

exports.callGemini = functions
  .runWith({ secrets: ["GOOGLE_GENAI_API_KEY"] })
  .https.onCall(async (data, context) => {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
      throw new functions.https.HttpsError(
        'internal',
        'GOOGLE_GENAI_API_KEY not configured.'
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro"});

    const prompt = data.prompt;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return { text: text };
  });
