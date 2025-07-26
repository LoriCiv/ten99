import JobBoardPageContent from '@/components/JobBoardPageContent';
import { auth } from "@clerk/nextjs/server";

export default async function JobBoardPage() {
  // We get the userId, which might be null if the user is not logged in.
  const { userId } = await auth();

  // We pass the userId (or null) to the content component.
  return <JobBoardPageContent userId={userId} />;
}