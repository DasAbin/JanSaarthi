export type OcrPage = {
    pageNumber: number;
    text: string;
};
export type OcrResult = {
    rawText: string;
    cleanedText: string;
    pages: OcrPage[];
    engine: "paddleocr" | "gemini_vision";
};
export type OcrRequest = {
    filePath: string;
    language: string;
};
export declare class OcrService {
    private cleaner;
    extractText(req: OcrRequest): Promise<OcrResult>;
}
