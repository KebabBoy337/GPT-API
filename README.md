# xNode GPT

A modern, dark-themed ChatGPT interface built with Next.js, TypeScript, and SQLite. Features user authentication, chat history, model selection, image uploads, and proper markdown formatting.

## Features

- 🔐 **User Authentication** - Registration and login with JWT tokens
- 👥 **User Limit** - Maximum 10 users (configurable)
- 💬 **Chat History** - Persistent chat storage and management
- 🤖 **Model Selection** - Support for GPT-3.5, GPT-4, and GPT-4 Vision
- 🖼️ **Image Upload** - Upload images for GPT-4 Vision analysis
- 📝 **Markdown Formatting** - Proper code syntax highlighting and formatting
- 🌙 **Dark Theme** - Modern, sleek dark interface
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite3
- **Authentication**: JWT with bcrypt
- **AI Integration**: OpenAI API
- **Markdown**: React Markdown with syntax highlighting
- **Icons**: Lucide React

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# JWT Secret for authentication
JWT_SECRET=your_jwt_secret_here

# Database path
DATABASE_PATH=./database.sqlite

# Maximum number of users allowed
MAX_USERS=10

# Next.js
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 3. Run the Application

For development:
```bash
npm run dev
```

For production:
```bash
npm run build
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. **Registration**: Create an account (limited to 10 users)
2. **Login**: Sign in with your credentials
3. **New Chat**: Click "New Chat" to start a conversation
4. **Model Selection**: Choose from available GPT models
5. **Image Upload**: Upload images for GPT-4 Vision analysis
6. **Chat History**: View and manage your previous conversations

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/[id]` - Get chat messages
- `DELETE /api/chats/[id]` - Delete chat
- `POST /api/chats/[id]/messages` - Send message

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password_hash` - Bcrypt hashed password
- `created_at` - Timestamp

### Chats Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `title` - Chat title
- `model` - GPT model used
- `created_at` - Timestamp
- `updated_at` - Last updated timestamp

### Messages Table
- `id` - Primary key
- `chat_id` - Foreign key to chats
- `role` - 'user' or 'assistant'
- `content` - Message content
- `image_url` - Optional image URL
- `created_at` - Timestamp

## Deployment on Ubuntu

1. **Install Node.js and npm**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Clone and setup the project**:
```bash
git clone <your-repo>
cd gpt-api
npm install
```

3. **Configure environment variables**:
```bash
cp env.example .env.local
nano .env.local
```

4. **Build and start**:
```bash
npm run build
npm start
```

5. **Use PM2 for production** (optional):
```bash
sudo npm install -g pm2
pm2 start npm --name "xnode-gpt" -- start
pm2 save
pm2 startup
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- HTTP-only cookies
- Input validation
- SQL injection protection
- Rate limiting ready

## License

MIT License
