---
name: kick-new
description: Create a new project when user wants to start, scaffold, or initialize a new application from a template
---

# Kick New

Create a new project from kick templates.

## When to Use This Skill

Use this skill when the user wants to:

- Create a new project
- Scaffold a new application
- Start a new project from a template
- Initialize a new project

## How to Create a Project

### 1. Check Available Templates First

Before creating a project, check if the requested template exists:

```bash
npx @hacxy/kick@latest list
```

If the project type is unclear, list all available templates and ask the user to choose.

### 2. Create Project

```bash
npx @hacxy/kick@latest new [template] [projectName]
```

### Options

- `-t, --template <template>` - Specify template name
- `--refresh` - Force refresh template cache

### Example

```bash
npx @hacxy/kick@latest new react-web my-app
```

If no template specified, interactive mode will guide you through selection.
