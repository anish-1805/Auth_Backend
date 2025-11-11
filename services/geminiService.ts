import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn(
        '⚠️  GEMINI_API_KEY not found in environment variables. Chatbot will use fallback responses.'
      );
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Using Gemini 2.0 series - latest and most capable models
      // Available models: gemini-2.0-flash-exp, gemini-2.0-flash-thinking-exp-1219
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
      });
      console.log(
        '✅ Gemini AI initialized successfully with model: gemini-2.0-flash-exp'
      );
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI:', error);
      console.warn('⚠️  Falling back to keyword-based responses');
    }
  }

  async generateResponse(
    userMessage: string,
    userName?: string
  ): Promise<string> {
    // If Gemini is not initialized, return fallback response
    if (!this.model) {
      return this.getFallbackResponse(userMessage);
    }

    try {
      const prompt = this.buildPrompt(userMessage, userName);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return (
        text ||
        'I apologize, but I could not generate a response. Please try again.'
      );
    } catch (error) {
      console.error(
        'Gemini AI error:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return this.getFallbackResponse(userMessage);
    }
  }

  private buildPrompt(userMessage: string, userName?: string): string {
    const greeting = userName ? `The user's name is ${userName}.` : '';

    return `You are a helpful AI assistant integrated into an authentication dashboard. ${greeting}
    
Your role is to:
- Help users with questions about their account
- Provide information about the authentication system
- Answer general questions in a friendly and professional manner
- Keep responses concise and helpful

User message: ${userMessage}

Please provide a helpful and friendly response.`;
  }

  private getFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    // Simple keyword-based responses
    if (
      lowerMessage.includes('hello') ||
      lowerMessage.includes('hi') ||
      lowerMessage.includes('hey')
    ) {
      return 'Hello! 👋 How can I help you today?';
    }

    if (lowerMessage.includes('help')) {
      return "I'm here to help! You can ask me about:\n- Your account information\n- Authentication features\n- General questions\n\nWhat would you like to know?";
    }

    if (lowerMessage.includes('account') || lowerMessage.includes('profile')) {
      return 'You can manage your account settings from the dashboard. You can update your profile, change your password, or view your account details.';
    }

    if (lowerMessage.includes('password')) {
      return 'To change your password, you can use the "Change Password" feature in your account settings. Make sure to use a strong password with a mix of letters, numbers, and special characters.';
    }

    if (lowerMessage.includes('logout') || lowerMessage.includes('sign out')) {
      return 'You can logout by clicking the logout button in the navigation menu. This will securely end your session.';
    }

    if (lowerMessage.includes('thank')) {
      return "You're welcome! Feel free to ask if you need anything else. 😊";
    }

    // Default response
    return (
      'I understand you\'re asking about: "' +
      userMessage +
      '". I\'m here to help! Could you please provide more details or ask a specific question?'
    );
  }

  isAvailable(): boolean {
    return this.model !== null;
  }
}

export default new GeminiService();
