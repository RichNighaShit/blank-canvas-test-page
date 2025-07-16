# Code Standards & Conventions

This document outlines the coding standards and conventions used in this project.

## File Naming Conventions

### ✅ Current Standards (Keep these)

- **Components**: PascalCase with descriptive names
  - `UserProfile.tsx`, `WardrobeInsights.tsx`, `StyleRecommendations.tsx`
  - UI Components: `button.tsx`, `card.tsx` (lowercase for base UI)

- **Hooks**: camelCase starting with "use"
  - `useAuth.tsx`, `useErrorHandler.tsx`, `useProfile.tsx`

- **Pages**: PascalCase matching route names
  - `Dashboard.tsx`, `EditProfile.tsx`, `VirtualTryOn.tsx`

- **Utilities & Libs**: camelCase
  - `utils.ts`, `logger.ts`, `performanceMonitor.ts`

### 🔍 Review Required

Some files may need renaming for consistency:

- Check for any snake_case files → convert to camelCase
- Ensure all component files use PascalCase
- Verify hook files start with "use"

## Component Structure Standards

### Standard Component Template

```typescript
/**
 * Component description
 * @param props - Description of props
 */
interface ComponentProps {
  // Props definition
}

const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 1. Hooks
  const [state, setState] = useState();
  const { data } = useCustomHook();

  // 2. Event handlers
  const handleAction = useCallback(() => {
    // handler logic
  }, []);

  // 3. Effects
  useEffect(() => {
    // effect logic
  }, []);

  // 4. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default ComponentName;
```

### Import Order

```typescript
// 1. React imports
import React, { useState, useEffect } from "react";

// 2. External libraries
import { useNavigate } from "react-router-dom";

// 3. UI components
import { Button } from "@/components/ui/button";

// 4. Internal components
import Header from "@/components/Header";

// 5. Hooks and utilities
import { useAuth } from "@/hooks/useAuth";

// 6. Types and interfaces
import type { User } from "@/types";

// 7. Icons (last)
import { User, Settings } from "lucide-react";
```

## Prop Passing Conventions

### ✅ Recommended Patterns

```typescript
// Event handlers: use "on" prefix
interface Props {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  onChange: (value: string) => void;
}

// Boolean props: use descriptive names
interface Props {
  isLoading?: boolean;
  showHeader?: boolean;
  disabled?: boolean;
}

// Data props: use clear, descriptive names
interface Props {
  user: User;
  items: WardrobeItem[];
  configuration: AppConfig;
}
```

### ❌ Avoid These Patterns

```typescript
// Don't use generic names
interface Props {
  data: any; // ❌ Too generic
  callback: Function; // ❌ Use specific function signature
  flag: boolean; // ❌ Use descriptive name
}
```

## Error Handling Standards

### Always Use Error Boundary and Logging

```typescript
// In components that make API calls
const MyComponent = () => {
  const { handleApiError, logUserAction } = useErrorHandler();

  const handleSubmit = async () => {
    try {
      logUserAction("form_submit");
      await api.submitData();
    } catch (error) {
      handleApiError(error, "/api/endpoint");
    }
  };
};
```

### Error Handling in Hooks

```typescript
// Custom hooks should handle their own errors
const useDataFetch = (url: string) => {
  const [data, setData] = useState(null);
  const { handleApiError } = useErrorHandler();

  useEffect(() => {
    fetchData().catch((error) =>
      handleApiError(error, url, {
        context: { hook: "useDataFetch" },
      }),
    );
  }, [url]);

  return { data };
};
```

## Documentation Standards

### JSDoc for Public APIs

````typescript
/**
 * Authenticates user and manages session state
 * @returns Authentication state and user data
 * @example
 * ```tsx
 * const { user, loading } = useAuth();
 * if (loading) return <Spinner />;
 * if (!user) return <Login />;
 * return <Dashboard user={user} />;
 * ```
 */
export const useAuth = () => {
  // implementation
};
````

### Component Documentation

```typescript
/**
 * Displays user wardrobe statistics and insights
 * @param userId - The ID of the user whose wardrobe to display
 * @param onItemClick - Handler for when a wardrobe item is clicked
 * @param showCategories - Whether to display category breakdown
 */
interface WardrobeInsightsProps {
  userId: string;
  onItemClick?: (itemId: string) => void;
  showCategories?: boolean;
}
```

## Performance Standards

### Lazy Loading

```typescript
// Page-level components should be lazy loaded
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Wardrobe = React.lazy(() => import("./pages/Wardrobe"));
```

### Memoization

```typescript
// Expensive calculations
const expensiveValue = useMemo(() => {
  return performHeavyCalculation(data);
}, [data]);

// Event handlers with dependencies
const handleClick = useCallback(
  (id: string) => {
    onItemSelect(id);
  },
  [onItemSelect],
);
```

## Accessibility Standards

### Semantic HTML

```typescript
// Use proper semantic elements
<main>
  <header>
    <h1>Page Title</h1>
    <nav>Navigation</nav>
  </header>
  <article>
    <h2>Section Title</h2>
    <p>Content</p>
  </article>
</main>
```

### ARIA Labels

```typescript
<button
  aria-label="Add item to wardrobe"
  onClick={handleAdd}
>
  <Plus className="w-4 h-4" />
</button>

<input
  aria-describedby="email-help"
  placeholder="Enter email"
/>
<div id="email-help">
  We'll never share your email
</div>
```

## Testing Standards

### Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ComponentName', () => {
  it('renders with required props', () => {
    render(<ComponentName prop="value" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<ComponentName onClick={handleClick} />);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Hook Tests

```typescript
import { renderHook, act } from "@testing-library/react";
import { useCustomHook } from "./useCustomHook";

describe("useCustomHook", () => {
  it("returns initial state", () => {
    const { result } = renderHook(() => useCustomHook());

    expect(result.current.data).toBe(null);
    expect(result.current.loading).toBe(true);
  });
});
```

## Git Commit Standards

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
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

```
feat(auth): add password reset functionality

- Add password reset form component
- Implement email verification flow
- Add error handling for reset failures

Closes #123
```

```
fix(wardrobe): resolve image loading issue

Fixed bug where images wouldn't load on slow connections
by adding proper loading states and error boundaries.
```

## Code Review Checklist

### For Reviewers

- [ ] Code follows naming conventions
- [ ] Components have proper TypeScript types
- [ ] Error handling is implemented
- [ ] Tests are included for new features
- [ ] Documentation is updated
- [ ] No console.log statements in production code
- [ ] Performance considerations addressed
- [ ] Accessibility requirements met

### For Authors

- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript compiles without errors
- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual testing completed
- [ ] Error scenarios tested
- [ ] Documentation updated

## Maintenance Guidelines

### Regular Tasks

1. **Dependencies**: Update dependencies monthly
2. **Linting**: Run linting before commits
3. **Testing**: Maintain test coverage above 80%
4. **Documentation**: Update docs with new features
5. **Performance**: Monitor bundle size and performance metrics

### Code Health Metrics

- TypeScript strict mode enabled
- ESLint warnings addressed
- No unused imports or variables
- Consistent code formatting
- Proper error boundaries in place

This document should be reviewed and updated as the project evolves.
