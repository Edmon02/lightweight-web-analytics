import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Lightweight Web Analytics
        </h1>
        
        <p className="text-lg mb-8 text-center">
          A privacy-focused, self-hostable web analytics platform for Next.js developers
        </p>
        
        <div className="flex justify-center">
          <Link 
            href="/dashboard" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to Dashboard
          </Link>
        </div>
        
        <div className="mt-16 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-3 lg:text-left">
          <div className="group rounded-lg border border-transparent px-5 py-4">
            <h2 className="mb-3 text-2xl font-semibold">
              Privacy-Focused
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Anonymized data collection with no cookies and minimal tracking
            </p>
          </div>

          <div className="group rounded-lg border border-transparent px-5 py-4">
            <h2 className="mb-3 text-2xl font-semibold">
              Lightweight
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              &lt;1KB tracking snippet with minimal impact on page performance
            </p>
          </div>

          <div className="group rounded-lg border border-transparent px-5 py-4">
            <h2 className="mb-3 text-2xl font-semibold">
              Self-Hosted
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Easy deployment with Docker on your own infrastructure
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
