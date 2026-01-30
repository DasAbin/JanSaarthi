export type QuizItem = {
    question: string;
    options: string[];
    answerIndex: number;
};
export type Lesson = {
    title: string;
    content: string;
    quiz?: QuizItem[];
};
export type LearningModule = {
    id?: string;
    title: string;
    description: string;
    lessons: Lesson[];
};
export declare class LearnService {
    listModules(): Promise<{
        id: string;
        title: string;
        description: string;
    }[]>;
    getModule(moduleId: string): Promise<LearningModule>;
}
