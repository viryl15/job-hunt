import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Sample job data for testing
    const sampleJobs = [
      {
        source: "test",
        sourceId: "test-001",
        title: "Senior Full Stack Developer",
        company: "TechCorp Inc",
        locations: ["San Francisco, CA", "New York, NY"],
        remote: true,
        url: "https://example.com/jobs/senior-fullstack-1",
        description: "Join our team as a Senior Full Stack Developer working with React, Node.js, and TypeScript. You'll be building scalable web applications and working with modern development practices including CI/CD, containerization, and microservices architecture.",
        salaryMin: 120000,
        salaryMax: 180000,
        currency: "USD",
        tags: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker", "Kubernetes"],
        postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      },
      {
        source: "test",
        sourceId: "test-002", 
        title: "Frontend Engineer - React",
        company: "StartupXYZ",
        locations: ["Remote"],
        remote: true,
        url: "https://example.com/jobs/frontend-react-2",
        description: "We're looking for a passionate Frontend Engineer to join our growing team. You'll work on our customer-facing applications using React, Next.js, and modern frontend tooling.",
        salaryMin: 90000,
        salaryMax: 130000,
        currency: "USD",
        tags: ["React", "Next.js", "JavaScript", "CSS", "Tailwind", "Figma"],
        postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      },
      {
        source: "test",
        sourceId: "test-003",
        title: "DevOps Engineer",
        company: "CloudFirst Solutions",
        locations: ["Austin, TX"],
        remote: false,
        url: "https://example.com/jobs/devops-engineer-3",
        description: "Join our DevOps team to help scale our infrastructure. Experience with AWS, Terraform, and Kubernetes required.",
        salaryMin: 100000,
        salaryMax: 150000,
        currency: "USD", 
        tags: ["AWS", "Terraform", "Kubernetes", "Docker", "Python", "Bash", "Monitoring"],
        postedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
      },
      {
        source: "test",
        sourceId: "test-004",
        title: "Junior Software Developer",
        company: "Learning Labs",
        locations: ["Chicago, IL"],
        remote: true,
        url: "https://example.com/jobs/junior-developer-4", 
        description: "Great opportunity for a junior developer to learn and grow. We'll provide mentorship and training in modern web development practices.",
        tags: ["JavaScript", "HTML", "CSS", "Git", "Node.js"],
        postedAt: new Date().toISOString(),
      },
      {
        source: "test", 
        sourceId: "test-005",
        title: "Principal Software Architect",
        company: "Enterprise Corp",
        locations: ["Seattle, WA"],
        remote: true,
        url: "https://example.com/jobs/principal-architect-5",
        description: "Lead our technical architecture and guide engineering teams in building scalable, distributed systems. 10+ years of experience required.",
        salaryMin: 200000,
        salaryMax: 300000,
        currency: "USD",
        tags: ["Architecture", "Microservices", "Java", "Spring", "Kafka", "Redis", "Leadership"],
        postedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
      }
    ]

    // Send batch ingestion request
    const response = await fetch('http://localhost:3000/api/jobs/ingest', {
      method: 'PUT', // Use PUT for batch ingestion
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sampleJobs)
    })

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Test jobs ingested',
      data: result
    })

  } catch (error) {
    console.error('Test ingestion error:', error)
    return NextResponse.json({
      success: false,
      message: 'Test ingestion failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}