# fe-interview

A Claude Code skill that acts as a senior frontend tech lead interviewer — analyzes candidate resumes and generates comprehensive, leveled interview question banks with reference answers, follow-up directions, and scoring rubrics. Outputs a beautifully rendered interactive HTML page.

[中文](./README.zh.md)

## Features

- **Resume-driven question generation**: 70% of questions derived from the candidate's actual resume, 30% from industry fundamentals and trends
- **Level-aware**: Automatically determines candidate level (Junior / Mid / Senior / Architect) and adjusts question depth accordingly
- **Full-spectrum coverage**: JavaScript core, TypeScript, React/Vue deep-dive, engineering & build tools, performance optimization, networking & security, CSS, cross-platform, AI + frontend, system design, project deep-dive, behavioral questions
- **2026-current**: Covers React 19 / RSC / React Compiler, TypeScript 5.x, Vite 6, INP metrics, AI-frontend integration, and more
- **Structured answers**: Each question includes intent, reference answer, follow-up directions (good/poor response paths), and scoring criteria
- **Interactive HTML output**: Generates a polished, collapsible HTML page with candidate profile, interview strategy, time allocation, and learning roadmap
- **Scenario-based questioning**: Emphasizes real-world scenarios over rote definitions ("Where did you use closures in your project?" instead of "What is a closure?")

## Installation

```bash
npx skills add hacxy/skills --skill fe-interview
```

## Usage

Provide a candidate's resume (paste text, attach a file, or point to a URL) and ask Claude to generate interview questions:

```
Help me prepare interview questions for this candidate
```

```
Look at this resume and tell me what to ask
```

```
Generate a frontend interview question bank based on this resume
```

The skill will:

1. Analyze the resume to build a candidate profile (level, tech stack, strengths, weaknesses)
2. Generate 15-20 structured interview questions with full answers
3. Render everything into an interactive HTML page and open it in the browser

## Output

The generated HTML page includes:

| Section | Content |
| --- | --- |
| Candidate Profile | Level, tech stack tags, strengths, potential weak areas |
| Interview Strategy | Time allocation bar, key focus areas |
| Question Bank | Categorized questions with collapsible answers, follow-ups, and scoring |
| Learning Roadmap | Prioritized study directions with resource recommendations |

## License

[MIT](LICENSE)

---

> 中文文档请见 [README.zh.md](./README.zh.md)
