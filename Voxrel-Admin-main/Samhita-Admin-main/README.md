# Kreactive Admin Frontend

A modern admin dashboard built with Next.js, TypeScript, and Zustand for state management.

## Features

- 🔐 **Authentication System** with Zustand state management
- 📋 **Task Management** with full CRUD operations
- 🎨 **Modern UI** with Tailwind CSS and shadcn/ui components
- 📊 **Analytics Dashboard** with task and user metrics
- 🔄 **Real-time State Management** with Zustand
- 📱 **Responsive Design** for all screen sizes

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **State Management**: Zustand with Immer and Persist middleware
- **UI Components**: shadcn/ui, Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Development**: ESLint, Prettier

## Getting Started

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Update the API URL in your environment:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

3. **Run the development server:**
   ```bash
   bun run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## State Management Architecture

This project implements a modular Zustand state management system inspired by Pinia's architecture:

### Store Structure

```
stores/
├── useUserStore.ts     # User authentication and profile management
├── useTaskStore.ts     # Task CRUD operations and filtering
└── index.ts            # Central store exports
```

### Service Layer

```
services/
├── base.service.ts     # Base HTTP service with common functionality
├── user.service.ts     # User and authentication API calls
└── task.service.ts     # Task management API calls
```

### Type Definitions

```
types/
└── index.ts           # All TypeScript interfaces and types
```

## Usage Examples

### Authentication

```tsx
import { useUserStore } from '@/stores';

function LoginComponent() {
  const { login, isLoading, error, isLoggedIn } = useUserStore();

  const handleLogin = async (credentials) => {
    try {
      await login(credentials);
      // User is automatically redirected after successful login
    } catch (error) {
      // Error handling is managed by the store
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {error && <div className="error">{error}</div>}
      <input type="email" required />
      <input type="password" required />
      <button disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Task Management

```tsx
import { useTaskStore } from '@/stores';

function TaskList() {
  const {
    tasks,
    isLoading,
    fetchTasks,
    updateTaskStatus,
    getPendingTasksCount
  } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div>
      <h2>Tasks ({getPendingTasksCount()} pending)</h2>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        tasks.map(task => (
          <div key={task.id}>
            <h3>{task.title}</h3>
            <select
              value={task.status}
              onChange={(e) => updateTaskStatus(task.id, e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        ))
      )}
    </div>
  );
}
```

### Store Features

#### User Store
- **Authentication**: Login, logout, register, password management
- **Profile Management**: Update user information
- **Persistence**: Automatically saves auth state to localStorage
- **Getters**: `isLoggedIn()`, `isAdmin()`, `getUserInitials()`

#### Task Store
- **CRUD Operations**: Create, read, update, delete tasks
- **Filtering & Search**: Filter by status, priority, assignee
- **Bulk Operations**: Update or delete multiple tasks
- **Analytics**: Get task counts and statistics
- **Getters**: `getTasksByStatus()`, `getPendingTasksCount()`, etc.

## API Integration

The stores use a service layer that handles all API communications:

```typescript
// Example API service usage
const userService = {
  login: (credentials) => Promise<User>,
  getCurrentUser: () => Promise<User>,
  updateProfile: (data) => Promise<User>
};
```

All services extend from `BaseService` which provides:
- Automatic token handling
- Request/response interceptors
- Error handling
- TypeScript support

## Development Commands

```bash
# Development
bun run dev          # Start development server
bun run build        # Build for production
bun run start        # Start production server

# Code Quality
bun run lint         # Run ESLint
bun run lint:fix     # Fix linting issues
bun run prettier     # Check formatting
bun run format       # Format code and fix linting
bun run type-check   # Run TypeScript checks
```

## Project Structure

```
app/
├── (app)/              # Authenticated app routes
│   ├── (task)/         # Task management pages
│   └── layout.tsx      # App layout with sidebar
├── (auth)/             # Authentication pages
│   ├── login/
│   └── layout.tsx      # Auth layout
└── globals.css         # Global styles

components/
├── ui/                 # shadcn/ui components
├── blocks/             # Page-specific components
└── app-sidebar.tsx     # Navigation sidebar

stores/                 # Zustand state management
├── useUserStore.ts
├── useTaskStore.ts
└── index.ts

services/               # API service layer
├── base.service.ts
├── user.service.ts
└── task.service.ts

types/                  # TypeScript definitions
└── index.ts
```

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for all new code
3. Add appropriate error handling
4. Update stores for any new API endpoints
5. Write descriptive commit messages

## License

This project is private and proprietary.