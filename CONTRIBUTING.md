# Contributing to Style Assistant

Welcome to the Style Assistant project! This guide will help you get started with contributing to our wardrobe management and style recommendation application.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Guidelines](#development-guidelines)
- [Code Standards](#code-standards)
- [Component Guidelines](#component-guidelines)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm, yarn, or pnpm
- Git

### Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd style-assistant
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open http://localhost:8080 in your browser

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, cards, etc.)
│   └── ...             # Feature-specific components
├── hooks/              # Custom React hooks
├── pages/              # Page components for routing
├── lib/                # Utility functions and configurations
├── integrations/       # External service integrations (Supabase)
└── main.tsx           # Application entry point
```

### Key Directories

- **`components/ui/`**: Base design system components built with Radix UI and Tailwind CSS
- **`components/`**: Feature-specific components (WardrobeInsights, StyleRecommendations, etc.)
- **`hooks/`**: Custom hooks for state management, authentication, and data fetching
- **`pages/`**: Route-level components that compose the application screens
- **`lib/`**: Utilities, logging, error handling, and configuration

## Development Guidelines

### Framework & Libraries

- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Supabase** for backend services
- **Lucide React** for icons

### State Management

- Use React's built-in state management (useState, useContext)
- Custom hooks for complex state logic
- Supabase for server state management

## Code Standards

### File Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.tsx`, `WardrobeInsights.tsx`)
- **Hooks**: camelCase starting with "use" (e.g., `useAuth.tsx`, `useErrorHandler.tsx`)
- **Utilities**: camelCase (e.g., `logger.ts`, `utils.ts`)
- **Pages**: PascalCase (e.g., `Dashboard.tsx`, `EditProfile.tsx`)

### Code Style

- Use TypeScript for all new code
- Follow ESLint rules (run `npm run lint`)
- Use functional components with hooks
- Prefer named exports over default exports for utilities
- Use default exports for components

### TypeScript Guidelines

```typescript
// ✅ Good: Proper interface definition
interface UserProfileProps {
  user: User;
  onUpdate: (data: ProfileData) => void;
  loading?: boolean;
}

// ✅ Good: Proper function typing
const handleSubmit = async (data: FormData): Promise<void> => {
  // implementation
};

// ❌ Avoid: Using 'any' type
const handleData = (data: any) => { ... };
```

### Import Organization

```typescript
// 1. React and React-related imports
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// 2. UI components
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

// 3. Custom components
import Header from "@/components/Header";
import WardrobeInsights from "@/components/WardrobeInsights";

// 4. Hooks and utilities
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";

// 5. Icons (keep together at the end)
import { User, Settings, Star } from "lucide-react";
```

## Component Guidelines

### Component Structure

```typescript
/**
 * Component description and purpose
 * @param prop1 - Description of prop1
 * @param prop2 - Description of prop2
 */
interface ComponentProps {
  prop1: string;
  prop2?: boolean;
}

const MyComponent: React.FC<ComponentProps> = ({ prop1, prop2 = false }) => {
  // 1. Hooks (useState, useEffect, custom hooks)
  const [state, setState] = useState<StateType>(initialValue);
  const { user } = useAuth();

  // 2. Event handlers
  const handleClick = useCallback(() => {
    // implementation
  }, [dependencies]);

  // 3. Effects
  useEffect(() => {
    // effect logic
  }, [dependencies]);

  // 4. Render
  return (
    <div className="component-container">
      {/* JSX content */}
    </div>
  );
};

export default MyComponent;
```

### Styling Guidelines

- Use Tailwind CSS utility classes
- Leverage the design system tokens defined in `tailwind.config.ts`
- Use the `cn()` utility for conditional classes
- Keep component-specific styles in the component file

```typescript
// ✅ Good: Using design system and utility function
<Button
  className={cn(
    "w-full",
    { "opacity-50": loading }
  )}
  variant="primary"
>
  Submit
</Button>

// ✅ Good: Using design system colors
<div className="bg-background text-foreground border border-border">
  Content
</div>
```

## Error Handling

### Using the Error Handling System

Always use the provided error handling utilities:

```typescript
import { useErrorHandler } from "@/hooks/useErrorHandler";

const MyComponent = () => {
  const { handleError, handleApiError, logUserAction } = useErrorHandler();

  const handleSubmit = async (data: FormData) => {
    try {
      logUserAction("form_submit", { component: "MyComponent" });
      const result = await api.submitData(data);
      // success handling
    } catch (error) {
      handleApiError(error, "/api/submit", {
        context: { component: "MyComponent", action: "submit" },
      });
    }
  };
};
```

### Error Boundary Usage

- The app includes a global error boundary
- For component-specific error boundaries, wrap critical sections:

```typescript
<ErrorBoundary fallback={<CustomErrorFallback />}>
  <CriticalComponent />
</ErrorBoundary>
```

## Testing

### Component Testing

```typescript
// Example test structure
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent prop1="test" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    const handleClick = jest.fn();
    render(<MyComponent onAction={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint
```

## Pull Request Process

### Before Submitting

1. **Test your changes**: Ensure all existing tests pass and add tests for new features
2. **Lint your code**: Run `npm run lint` and fix any issues
3. **Check TypeScript**: Run `npm run typecheck` (if available)
4. **Test the build**: Run `npm run build` to ensure production build works

### PR Guidelines

1. **Clear title and description**: Explain what the PR does and why
2. **Small, focused changes**: Keep PRs focused on a single feature or fix
3. **Include tests**: Add appropriate tests for new functionality
4. **Update documentation**: Update README or other docs if needed
5. **Screenshots**: Include screenshots for UI changes

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Tests pass locally
- [ ] New tests added (if applicable)
- [ ] Manual testing completed

## Screenshots (if applicable)

Include screenshots for UI changes
```

## Common Patterns

### Data Fetching with Error Handling

```typescript
const useDataFetch = (endpoint: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { handleApiError } = useErrorHandler();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get(endpoint);
        setData(response.data);
      } catch (error) {
        handleApiError(error, endpoint);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, handleApiError]);

  return { data, loading };
};
```

### Form Handling

```typescript
const useForm = () => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const { handleError } = useErrorHandler();

  const handleSubmit = async (onSubmit: (data: any) => Promise<void>) => {
    try {
      await onSubmit(values);
    } catch (error) {
      handleError(error, "Failed to submit form");
    }
  };

  return { values, errors, handleSubmit };
};
```

## Getting Help

- Check existing issues and discussions
- Review the codebase for similar implementations
- Ask questions in team chat or create an issue
- Refer to the documentation for Tailwind CSS, Radix UI, and Supabase

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Supabase Documentation](https://supabase.com/docs)

Thank you for contributing! 🎉
