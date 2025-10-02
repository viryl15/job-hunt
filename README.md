# Job Hunt PWA

A privacy-first, automated job application system for developers.

## 🎯 Vision

Automate the tedious parts of job hunting while keeping you in control:

- **Smart Job Discovery**: Auto-scrape and score jobs from multiple sources
- **Automated Applications**: Send personalized applications via Gmail API  
- **Intelligent Pipeline**: Track applications from leads to interviews
- **Privacy-Conscious**: Self-hosted, you control your data
- **Developer-Focused**: Built for remote work and tech skills

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Visit http://localhost:3000
```

## 📁 Architecture

```
apps/web/                 # Next.js 14 PWA
├── src/app/             # App Router pages
├── src/components/      # React components  
├── src/lib/            # Database & utilities
└── public/             # Static assets
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Database**: MySQL with direct mysql2 queries
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **PWA**: Service worker, manifest.json

## 📊 Current Status

✅ **Foundation Complete**
- Landing page and dashboard UI
- Job ingestion with scoring algorithm  
- MySQL database with optimized schema
- Search and filtering functionality

🔄 **In Progress**
- Gmail API integration for automated applications
- Application workflow and tracking
- Email templates and follow-up system

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
