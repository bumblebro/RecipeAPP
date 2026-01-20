import * as FileSystem from "expo-file-system/legacy";
import { Audio } from "expo-av";
import { Platform } from "react-native";

// Use the key from .env or fallback (User provided this key in .env)
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY

const GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

export const synthesizeSpeech = async (text: string): Promise<string | null> => {
  try {
    // 1. Create a unique filename based on the text (hash or simplified)
    // Simple hash for filename
    const hash = text.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    const filename = `tts_${Math.abs(hash)}.mp3`;
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;

    // 2. Check cache
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      console.log("TTS: Using cached audio");
      return fileUri;
    }

    // 3. Fetch from Google API
    console.log("TTS: Fetching from Google Cloud...");
    const response = await fetch(`${GOOGLE_TTS_URL}?key=${GOOGLE_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: "en-US",
          // Wavenet voices are higher quality but require billing. 
          // Standard voices are: en-US-Standard-A, en-US-Standard-C (Female), etc.
          name: "en-US-Standard-G", // Standard Female voice (Cheapest tier)
          ssmlGender: "FEMALE",
        },
        audioConfig: {
          audioEncoding: "MP3",
          "speaking_rate": 0.8,

        },
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("TTS API Error:", data.error);
      return null;
    }

    if (!data.audioContent) {
      console.error("TTS: No audio content received");
      return null;
    }

    // 4. Save to file
    await FileSystem.writeAsStringAsync(fileUri, data.audioContent, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return fileUri;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};
