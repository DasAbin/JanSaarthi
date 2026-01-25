import { OcrService } from "./ocrService";
import { GeminiService } from "./embeddings";

export interface FormExplainRequest {
  imagePath: string;
  originalName: string;
  language: string;
}

export interface FormFieldExplanation {
  field: string;
  meaning: string;
  example: string;
  required: boolean;
}

export class FormService {
  private ocrService = new OcrService();
  private gemini = new GeminiService();

  async explainForm(
    req: FormExplainRequest
  ): Promise<{ fields: FormFieldExplanation[] }> {
    const rawText = await this.ocrService.extractText({
      filePath: req.imagePath,
      language: req.language
    });

    const prompt = `
You are reading a scanned government form from India.
Extract likely field labels and explain them in very simple language.

Form OCR text:
${rawText}

Return a JSON array like:
[
  { "field": "Applicant Name", "meaning": "Your full name as per Aadhaar", "example": "Sita Devi", "required": true }
]
`;

    const llmRaw = await this.gemini.generateJson(prompt);

    let parsed: FormFieldExplanation[] = [];
    try {
      parsed = JSON.parse(llmRaw);
    } catch {
      parsed = [
        {
          field: "Applicant Name",
          meaning: "Write your full name as per official ID.",
          example: "Sita Devi",
          required: true
        }
      ];
    }

    return { fields: parsed };
  }
}

