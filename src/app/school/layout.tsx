import { requireInstructor } from "@/lib/session";
import { prisma } from "@/lib/db";
import { SchoolTopBar } from "@/components/layout/SchoolTopBar";

export default async function SchoolLayout({ children }: { children: React.ReactNode }) {
  const { school } = await requireInstructor();
  const seatsUsed = await prisma.studentProfile.count({ where: { drivingSchoolId: school.id } });

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      <SchoolTopBar schoolName={school.name} code={school.code} seatsUsed={seatsUsed} seats={school.license?.seats ?? 0} />
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
