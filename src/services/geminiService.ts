
import { GoogleGenAI } from '@google/genai';

type GenAIEnv = {
  GEMINI_API_KEY?: string;
  API_KEY?: string;
};

const getAI = () => {
  const env = process.env as GenAIEnv;
  const key = (env['GEMINI_API_KEY'] || env['API_KEY'] || '').trim();
  if (!key || key === 'PLACEHOLDER_API_KEY' || key.includes('PLACEHOLDER')) {
    throw new Error('MISSING_API_KEY');
  }
  return new GoogleGenAI({ apiKey: key });
};

// System Guardian AI Function
export const analyzeRuntimeSession = async (
  interactions: string[],
  networkLogs: string[],
  systemLogs: string[]
) => {
  try {
    const ai = getAI();
    const prompt = `
      You are an Advanced AI Runtime Debugger. You are analyzing a live user session.
      
      1. INTERACTION TRACE (User Actions):
      ${interactions.join('\n')}

      2. NETWORK TELEMETRY (API Calls):
      ${networkLogs.join('\n')}

      3. CONSOLE/SYSTEM LOGS:
      ${systemLogs.join('\n')}

      MISSION:
      Correlate the User Actions with the Network/System logs. 
      Did a specific user action cause a crash or error?
      If there is an error, generate the EXACT CODE CHANGE needed to fix it.
      If the system is healthy, summarize the user flow.

      Output Format:
      **Root Cause:** [Explanation]
      **Impact:** [Low/High]
      **Recommended Fix:** [Code Snippet or Instruction]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    return response.text;
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'MISSING_API_KEY') {
      return '**System Status:** AI Diagnostics Offline.\n\n**Note:** Please set a valid `GEMINI_API_KEY` in your `.env.local` file to enable deep correlation analysis.';
    }
    throw error;
  }
};
