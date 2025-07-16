
# Contributing to DripMuse

Thank you for your interest in contributing to DripMuse! This guide will help you get started with development and ensure consistency across the codebase.

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- Bun package manager
- Supabase account for backend services

### Development Setup
1. Clone the repository
2. Install dependencies: `bun install`
3. Set up your Supabase project and add environment variables
4. Start the development server: `bun dev`

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and business logic
├── providers/          # Context providers
├── integrations/       # External service integrations
└── test/              # Test utilities and setup
```

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow the existing ESLint configuration
- Use semantic HTML and accessible markup
- Prefer functional components with hooks

### Component Guidelines
- **Single Responsibility**: Each component should have one clear purpose
- **Props Interface**: Always define TypeScript interfaces for props
- **JSDoc Comments**: Document complex components and functions
- **Error Handling**: Use the global error boundary and logger
- **Performance**: Use React.memo for expensive components

Example component structure:
```tsx
interface MyComponentProps {
  /** Description of the prop */
  title: string;
  /** Optional prop with default */
  variant?: 'primary' | 'secondary';
}

/**
 * Component description
 * @param props - Component props
 */
export const MyComponent = ({ title, variant = 'primary' }: MyComponentProps) => {
  // Component logic
  return (
    <div className="component-class">
      {title}
    </div>
  );
};
```

### File Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase starting with 'use' (e.g., `useAuth.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Pages**: PascalCase (e.g., `Dashboard.tsx`)
- **Types**: PascalCase (e.g., `UserTypes.ts`)

### State Management
- Use local state for component-specific data
- Use custom hooks for shared state logic
- Use Supabase for persistent data
- Implement proper loading and error states

### Error Handling
- Use the centralized logger for all errors
- Implement user-friendly error messages
- Use the ErrorBoundary for React errors
- Handle async operations with proper try-catch blocks

### Testing
- Write unit tests for utility functions
- Test custom hooks with React Testing Library
- Focus on testing user interactions and business logic
- Run tests with: `bun test`

### Performance
- Use React.lazy for route-based code splitting
- Implement proper image optimization
- Use the performance cache for expensive operations
- Monitor performance with the PerformanceDashboard (dev only)

## Security Guidelines

### Supabase Security
- Never commit API keys to the repository
- Use environment variables for all secrets
- Implement Row Level Security (RLS) for all tables
- Validate user permissions on the client and server

### Data Handling
- Always validate user input
- Use TypeScript for type safety
- Implement proper error boundaries
- Log security events appropriately

## Commit Guidelines

### Commit Message Format
Use conventional commits:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(auth): add password reset functionality
fix(recommendations): resolve weather filtering bug
docs(api): update Supabase integration guide
```

## Pull Request Process

1. **Create a Feature Branch**: `git checkout -b feat/your-feature-name`
2. **Make Changes**: Follow the coding guidelines
3. **Add Tests**: Ensure your changes are tested
4. **Update Documentation**: Update relevant docs
5. **Run Quality Checks**: `bun lint && bun test`
6. **Create PR**: Use the PR template
7. **Code Review**: Address feedback
8. **Merge**: Squash and merge when approved

## Common Patterns

### Data Fetching
```tsx
const { data, loading, error } = useQuery({
  queryKey: ['resource', id],
  queryFn: () => fetchResource(id),
});

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

### Form Handling
```tsx
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: initialValues,
});

const onSubmit = async (data: FormData) => {
  try {
    await submitData(data);
    toast.success('Success!');
  } catch (error) {
    logger.logError(error, 'FormSubmit');
    toast.error('Something went wrong');
  }
};
```

## Getting Help

- Check existing issues and documentation first
- Join our development Discord (link in README)
- Ask questions in discussions
- Reach out to maintainers for complex issues

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain professional communication

Thank you for contributing to DripMuse! 🎨✨
