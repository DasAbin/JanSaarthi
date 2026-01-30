export type CleanOptions = {
    /** Lines repeated >= this count are treated as headers/footers */
    repeatedLineThreshold?: number;
    /** Max length of a line to consider as header/footer candidate */
    headerFooterMaxLen?: number;
};
export declare class Cleaner {
    clean(text: string, opts?: CleanOptions): string;
}
