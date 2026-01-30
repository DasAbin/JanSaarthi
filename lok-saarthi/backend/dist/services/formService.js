"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormService = void 0;
const ocrService_1 = require("./ocrService");
const llm_1 = require("./llm");
class FormService {
    constructor() {
        this.ocrService = new ocrService_1.OcrService();
    }
    async explainForm(req) {
        const { imagePath, language } = req;
        // Step 1: Extract text from form image
        console.log(`[FormService] Extracting text from: ${imagePath}`);
        const ocrResult = await this.ocrService.extractText({
            filePath: imagePath,
            language
        });
        const { cleanedText, engine } = ocrResult;
        console.log(`[FormService] OCR complete using ${engine}. Text length: ${cleanedText.length}`);
        // Step 2: Use Gemini to analyze form fields
        const languageInstruction = language === "hi"
            ? "Respond in Hindi (हिंदी में जवाब दें)."
            : language === "mr"
                ? "Respond in Marathi (मराठी मध्ये उत्तर द्या)."
                : "Respond in simple English.";
        const prompt = `You are a helpful assistant that explains government form fields to rural citizens in India.
${languageInstruction}

I extracted the following text from a government form:

${cleanedText.slice(0, 6000)}

Analyze this form and identify all the fields that need to be filled.
Return a JSON response with this structure:

{
  "title": "Name of the form (e.g., Aadhaar Application Form)",
  "description": "Brief description of what this form is for",
  "fields": [
    {
      "field": "Field name/label",
      "meaning": "Simple explanation of what this field means and why it's needed",
      "example": "Example of how to fill this field correctly",
      "required": true or false,
      "tips": "Any helpful tip for filling this field"
    }
  ],
  "tips": [
    "General tip 1 for filling this form",
    "General tip 2",
    "Where to submit this form"
  ]
}

Be practical and helpful. Use simple language. Give real examples. Identify at least 5-10 fields if present.`;
        try {
            const jsonStr = await (0, llm_1.askLLM)(prompt, { json: true });
            const result = JSON.parse(jsonStr);
            return {
                title: result.title || "Government Form",
                description: result.description || "Government application form",
                fields: Array.isArray(result.fields) ? result.fields.map((f) => ({
                    field: f.field || "Unknown Field",
                    meaning: f.meaning || "Please fill this field",
                    example: f.example || "N/A",
                    required: f.required !== false,
                    tips: f.tips || ""
                })) : [],
                language,
                tips: Array.isArray(result.tips) ? result.tips : []
            };
        }
        catch (error) {
            console.error("[FormService] Error analyzing form:", error);
            // Fallback: Extract basic field names from OCR text
            const fields = this.extractBasicFields(cleanedText);
            return {
                title: "Government Form",
                description: "Unable to fully analyze form. Here are the detected fields.",
                fields,
                language,
                tips: [
                    "Fill all required fields carefully",
                    "Use black ink pen for handwritten forms",
                    "Keep a photocopy for your records"
                ]
            };
        }
    }
    extractBasicFields(text) {
        const commonFields = [];
        const fieldPatterns = [
            { pattern: /name|नाम|नाव/i, field: "Name / नाम", meaning: "Your full legal name as per documents" },
            { pattern: /father|पिता|वडील/i, field: "Father's Name / पिता का नाम", meaning: "Your father's full name" },
            { pattern: /mother|माता|आई/i, field: "Mother's Name / माता का नाम", meaning: "Your mother's full name" },
            { pattern: /address|पता|पत्ता/i, field: "Address / पता", meaning: "Your residential address" },
            { pattern: /date of birth|dob|जन्म तिथि|जन्म दिनांक/i, field: "Date of Birth / जन्म तिथि", meaning: "Your birth date in DD/MM/YYYY format" },
            { pattern: /mobile|phone|मोबाइल|फोन/i, field: "Mobile Number / मोबाइल नंबर", meaning: "Your 10-digit mobile number" },
            { pattern: /aadhaar|आधार/i, field: "Aadhaar Number / आधार नंबर", meaning: "Your 12-digit Aadhaar number" },
            { pattern: /bank|बैंक|खाता/i, field: "Bank Account / बैंक खाता", meaning: "Your bank account number" },
            { pattern: /ifsc/i, field: "IFSC Code", meaning: "Your bank's IFSC code (on cheque book)" },
            { pattern: /signature|हस्ताक्षर|सही/i, field: "Signature / हस्ताक्षर", meaning: "Your signature or thumb impression" },
            { pattern: /photo|फोटो/i, field: "Photograph / फोटो", meaning: "Recent passport size photo" },
            { pattern: /caste|जाति|जात/i, field: "Caste / जाति", meaning: "Your caste category (SC/ST/OBC/General)" },
            { pattern: /income|आय|उत्पन्न/i, field: "Annual Income / वार्षिक आय", meaning: "Your total yearly income" },
            { pattern: /occupation|व्यवसाय|पेशा/i, field: "Occupation / व्यवसाय", meaning: "Your profession or work" }
        ];
        for (const { pattern, field, meaning } of fieldPatterns) {
            if (pattern.test(text)) {
                commonFields.push({
                    field,
                    meaning,
                    example: "As per your ID documents",
                    required: true,
                    tips: "Match with your official documents"
                });
            }
        }
        // If no fields detected, return generic list
        if (commonFields.length === 0) {
            return [
                { field: "Name", meaning: "Your full name", example: "राम कुमार शर्मा", required: true },
                { field: "Date", meaning: "Today's date", example: "01/01/2024", required: true },
                { field: "Signature", meaning: "Sign here", example: "Your signature", required: true }
            ];
        }
        return commonFields;
    }
}
exports.FormService = FormService;
//# sourceMappingURL=formService.js.map