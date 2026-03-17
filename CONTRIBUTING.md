# Contributing to Meetiva

Thank you for considering contributing to Meetiva! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Bug Reports](#bug-reports)
- [Feature Requests](#feature-requests)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

1. **Fork the repository**
   ```bash
   gh repo fork Viraj0711/Meetiva.ai_pvt
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Meetiva.ai_pvt.git
   cd Meetiva.ai_pvt
   ```

3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Set up the development environment**
   ```bash
   # Install all dependencies from root
   npm install
   
   # Start development server (frontend)
   npm run dev
   
   # Or install frontend dependencies specifically
   npm run install:frontend
   
   # Backend (when available)
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

## Development Workflow

### Frontend Development

```bash
# From root directory
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript errors

# Or from frontend directory
cd frontend
npm run dev
npm run build
```

### Backend Development

```bash
cd backend
uvicorn app.main:app --reload    # Start API server
pytest                           # Run tests
black .                          # Format code
flake8                           # Lint code
```

## Coding Standards

### Frontend (React/TypeScript)

- Use TypeScript for all new files
- Follow React best practices and hooks patterns
- Use functional components over class components
- Implement proper error boundaries
- Write semantic, accessible HTML
- Use Tailwind CSS for styling
- Keep components small and focused (< 200 lines)
- Prefer composition over inheritance
- Write meaningful variable and function names

**Example:**
```typescript
interface UserProfileProps {
  userId: string;
  onUpdate: (user: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  // Component implementation
};
```

### Backend (Python/FastAPI)

- Follow PEP 8 style guide
- Use type hints for all functions
- Write docstrings for classes and functions
- Keep functions small and focused
- Use async/await for I/O operations
- Implement proper error handling
- Write comprehensive tests

**Example:**
```python
from typing import List
from fastapi import HTTPException

async def get_meetings(
    user_id: str,
    limit: int = 10
) -> List[Meeting]:
    """
    Retrieve meetings for a specific user.
    
    Args:
        user_id: Unique identifier for the user
        limit: Maximum number of meetings to return
        
    Returns:
        List of Meeting objects
        
    Raises:
        HTTPException: If user not found
    """
    # Implementation
```

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(auth): add OAuth2 login support

Implement Google and GitHub OAuth2 authentication
for faster user onboarding.

Closes #123
```

```bash
fix(upload): prevent duplicate file uploads

Add deduplication check before processing uploaded
meeting files.
```

```bash
docs(readme): update installation instructions
```

## Pull Request Process

1. **Update your fork**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Ensure code quality**
   - All tests pass
   - No TypeScript/ESLint errors
   - Code is formatted
   - Documentation is updated

3. **Create a pull request**
   - Use a clear, descriptive title
   - Reference related issues
   - Provide a detailed description
   - Include screenshots for UI changes
   - Request review from maintainers

4. **PR Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Unit tests pass
   - [ ] Manual testing completed
   
   ## Screenshots (if applicable)
   
   ## Related Issues
   Fixes #123
   ```

5. **Address review feedback**
   - Respond to comments promptly
   - Make requested changes
   - Re-request review when ready

6. **Merge requirements**
   - Approved by at least one maintainer
   - All CI checks passing
   - No merge conflicts
   - Up to date with base branch

## Bug Reports

Create an issue with the following information:

**Title:** Clear, concise description

**Template:**
```markdown
### Description
A clear description of the bug

### Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

### Expected Behavior
What should happen

### Actual Behavior
What actually happens

### Environment
- OS: [e.g., Windows 11, macOS 13]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.2.3]

### Screenshots
If applicable

### Additional Context
Any other relevant information
```

## Feature Requests

Create an issue with the following information:

**Title:** Feature name

**Template:**
```markdown
### Problem Statement
What problem does this feature solve?

### Proposed Solution
How should this feature work?

### Alternatives Considered
Other approaches you've thought about

### Additional Context
Mockups, examples, related features
```

## Questions?

- Open a [GitHub Discussion](https://github.com/Viraj0711/Meetiva.ai_pvt/discussions)
- Join our community chat (if available)
- Email: support@meetiva.ai

---

**Thank you for contributing to Meetiva!** 
