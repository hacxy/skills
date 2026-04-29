import type { SkillDoc, SkillMeta, SkillValidationIssue } from "./types.js";
export declare function discoverSkillFiles(rootDir: string): Promise<string[]>;
export declare function loadSkillFromFile(rootDir: string, filePath: string): Promise<SkillDoc>;
export declare function buildSkillIndex(rootDir: string): Promise<SkillMeta[]>;
export declare function loadSkillByName(rootDir: string, name: string): Promise<SkillDoc | null>;
export declare function searchSkills(index: SkillMeta[], query: string): SkillMeta[];
export declare function validateSkillDocument(doc: SkillDoc): SkillValidationIssue[];
export declare function doctorSkills(rootDir: string): Promise<SkillValidationIssue[]>;
export type { SkillDoc, SkillMeta, SkillValidationIssue } from "./types.js";
