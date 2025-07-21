// src/app/dashboard/job-files/[id]/page.tsx

// A simple interface for the page's props
interface PageProps {
  params: {
    id: string;
  };
}

// A minimal async server component for testing
export default async function JobFileDetailPage({ params }: PageProps) {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">Job File ID:</h1>
      <p>{params.id}</p>
      <p>(This is a test page to confirm the build works.)</p>
    </div>
  );
}