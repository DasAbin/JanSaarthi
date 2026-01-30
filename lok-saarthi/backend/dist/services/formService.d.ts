export type FormField = {
    field: string;
    meaning: string;
    example: string;
    required: boolean;
    tips?: string;
};
export type FormExplainRequest = {
    imagePath: string;
    language: string;
};
export type FormExplainResponse = {
    title: string;
    description: string;
    fields: FormField[];
    language: string;
    tips: string[];
};
export declare class FormService {
    private ocrService;
    explainForm(req: FormExplainRequest): Promise<FormExplainResponse>;
    private extractBasicFields;
}
