export interface SkillMeta {
  name: string;
  description: string;
  relativePath: string;
  directory: string;
}

export interface SkillDoc extends SkillMeta {
  content: string;
  raw: string;
}

export interface SkillValidationIssue {
  path: string;
  level: "error" | "warn";
  message: string;
}
