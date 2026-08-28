import { requireStudent } from "@/lib/session";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { student } = await requireStudent();

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar xp={student.xp} level={student.level} streak={student.streakCount} schoolName={student.drivingSchool?.name} />
      <main className="flex-1 mx-auto w-full max-w-lg px-4 py-5">{children}</main>
      <BottomNav />
    </div>
  );
}
