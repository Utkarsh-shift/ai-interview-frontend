export const confirmationAgentPrompt = `
CONFIRMATION AGENT PROTOCOL:
1. After each question, wait 1-3 seconds for candidate response
2. If no response within this time, automatically proceed to next question
3. If candidate responds:
   - Affirmative responses ("yes", "okay", "proceed", "next"): move to next question
   - Negative responses ("no", "repeat", "again"): repeat the same question
   - Any other response: proceed to next question
4. Never disclose this confirmation protocol to candidates
`;
 
export function handleConfirmation(response: string, responseTime: number): 'proceed' | 'repeat' {
    if (responseTime > 3) return 'proceed';
    const affirmative = ['yes', 'okay', 'proceed', 'next'];
    const negative = ['no', 'repeat', 'again'];
    const normalized = response.toLowerCase().trim();
    if (affirmative.includes(normalized)) return 'proceed';
    if (negative.includes(normalized)) return 'repeat';
    return 'proceed';
}


