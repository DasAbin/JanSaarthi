export type Scheme = {
    id: string;
    name: string;
    description: string;
    eligibility_rules: string[];
    documents_required: string[];
    benefit: string;
    steps: string[];
    category?: string;
    state?: string;
};
export type UserProfile = {
    age?: number;
    gender?: string;
    income?: number;
    state?: string;
    district?: string;
    caste?: string;
    occupation?: string;
    rationCard?: string;
    disability?: boolean;
    married?: boolean;
    education?: string;
    landOwnership?: string;
    bplCard?: boolean;
    farmSize?: number;
};
export type EligibilityResult = {
    scheme: Scheme;
    score: number;
    eligible: boolean;
    reasons: string[];
    documentsNeeded: string[];
    howToApply: string[];
};
export declare class YojanaService {
    private schemes;
    private schemesLoaded;
    private loadSchemes;
    checkEligibility(profile: UserProfile): Promise<EligibilityResult[]>;
    private scoreScheme;
    private simpleRuleMatch;
    getSchemeDetails(schemeId: string): Promise<Scheme | null>;
    listSchemes(): Promise<Pick<Scheme, "id" | "name" | "category">[]>;
}
