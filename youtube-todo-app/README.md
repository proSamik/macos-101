# YouTube Starter Kit

This Starter kit is created for 30 Day SaaS Crash Course on [YouTube](https://www.youtube.com/watch?v=BranVKjQ5FI&list=PLMwjMVAKOD5D75_XR1LBn3tc6qUZCnmid)


A modern, full-stack Todo application built with Next.js 15, TypeScript, shadcn/ui, and Drizzle ORM. Features a beautiful blue and orange complementary color theme with complete CRUD operations.

## 🚀 Features

- ✅ **Full CRUD Operations** - Create, Read, Update, Delete todos
- 🎨 **Beautiful UI** - Modern design with shadcn/ui components
- 🎯 **Priority Management** - Set todo priorities (Low, Medium, High)
- ✅ **Task Completion** - Mark todos as complete/incomplete
- 📱 **Responsive Design** - Works on desktop and mobile
- 🗄️ **PostgreSQL Database** - Reliable data storage with Drizzle ORM
- 🌐 **Production Ready** - Optimized for Vercel deployment with Neon.com
- 🔧 **TypeScript** - Full type safety throughout the application

## 🏗️ Architecture

### Frontend Architecture
```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── todos/         # Todo CRUD endpoints
│   ├── globals.css        # Global styles & color theme
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── src/
│   ├── components/        # React components
│   │   └── TodoApp.tsx    # Main todo application
│   └── lib/
│       └── db/            # Database configuration
│           ├── index.ts   # Database connection
│           └── schema.ts  # Drizzle schema
└── components/ui/         # shadcn/ui components
```

### Database Schema
```sql
CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  priority TEXT DEFAULT 'medium' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### API Endpoints
- `GET /api/todos` - Fetch all todos
- `POST /api/todos` - Create a new todo
- `GET /api/todos/[id]` - Fetch a specific todo
- `PUT /api/todos/[id]` - Update a todo
- `DELETE /api/todos/[id]` - Delete a todo

### Data Flow
```
User Interface (TodoApp.tsx)
        ↓
   Next.js API Routes (/api/todos)
        ↓
   Drizzle ORM (Database Layer)
        ↓
   PostgreSQL Database
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Package Manager**: pnpm
- **Deployment**: Vercel
- **Database Hosting**: Neon.com (Production)

## 🎨 Color Theme

The application uses a carefully selected complementary color scheme:

- **Primary**: Blue (#3B82F6) - Used for main actions and primary elements
- **Secondary**: Orange (#F97316) - Used for accents and priority indicators
- **Background**: Light gray (#F9FAFB) - Clean, professional background
- **Success**: Green - For completed tasks
- **Danger**: Red - For delete actions and high priority

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- pnpm
- PostgreSQL database (local or Neon.com)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd youtube-todo-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your database configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/todo_app"
   NODE_ENV="sandbox"
   ```

4. **Set up the database**
   ```bash
   # Generate migration files
   pnpm db:generate
   
   # Run migrations
   pnpm db:migrate
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

### Production Setup (Vercel + Neon.com)

1. **Create a Neon.com database**
   - Sign up at [neon.com](https://neon.com)
   - Create a new project
   - Copy the connection string

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel
   ```

3. **Set environment variables in Vercel**
   ```env
   DATABASE_URL="postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require"
   NODE_ENV="production"
   ```

4. **Automatic deployment**
   - The postinstall script will automatically run `pnpm db:generate` and `pnpm db:migrate` in production
   - Every git push to main will trigger a new deployment

## 🗄️ Database Configuration

### Development Environment
- Uses regular PostgreSQL driver
- Local database connection
- Manual migration running

### Production Environment (Neon.com)
- Uses Neon serverless driver for optimal performance
- Connection pooling enabled
- Automatic migrations via postinstall script
- SSL required for security

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `NODE_ENV` | Environment setting | `sandbox` or `production` |

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate migration files |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:push` | Push schema changes |
| `pnpm db:studio` | Open Drizzle Studio |

## 🔧 Development

### Adding New Features

1. **Database Changes**
   - Modify `src/lib/db/schema.ts`
   - Run `pnpm db:generate`
   - Run `pnpm db:migrate`

2. **API Changes**
   - Add/modify routes in `app/api/`
   - Follow RESTful conventions

3. **UI Changes**
   - Update `src/components/TodoApp.tsx`
   - Use shadcn/ui components for consistency

### Code Organization

- **Components**: Reusable UI components in `src/components/`
- **Database**: Schema and connection logic in `src/lib/db/`
- **API Routes**: Next.js API routes in `app/api/`
- **Styles**: Global styles and theme in `app/globals.css`

### Best Practices

- All functions are documented with JSDoc comments
- TypeScript strict mode enabled
- Responsive design principles
- Error handling for all API calls
- Loading states for better UX
- Optimistic updates where appropriate

## 🚀 Deployment

### Vercel Configuration

The `vercel.json` file configures:
- Environment variables
- Function timeouts
- Build commands

### Postinstall Script

The `scripts/postinstall.js` file:
- Only runs in production environments
- Automatically generates and runs migrations
- Provides detailed logging
- Handles errors gracefully

### Database Optimization

Production deployment is optimized for Neon.com:
- Uses serverless driver for better cold start performance
- Connection pooling enabled
- SSL connections required
- Automatic migration handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [shadcn/ui](https://ui.shadcn.com/) for beautiful, accessible components
- [Drizzle ORM](https://orm.drizzle.team/) for the excellent TypeScript ORM
- [Neon.com](https://neon.com/) for serverless PostgreSQL hosting
- [Vercel](https://vercel.com/) for seamless deployment experience