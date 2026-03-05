import { OnboardingGuard } from "@/components/onboarding-guard";
import { LoginWelcomeCard } from "@/components/login-welcome-card";
import { SidebarNav } from "@/components/sidebar-nav";
import { TopBar } from "@/components/top-bar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session-token";

export default async function SaaSLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const session = verifySessionToken(token);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="relative min-h-screen pb-8">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] blur-3xl" />
        <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-[color-mix(in_srgb,#24597f_22%,transparent)] blur-3xl" />
      </div>

      <SidebarNav />

      <div className="lg:pl-72">
        <OnboardingGuard />
        <LoginWelcomeCard />
        <TopBar />
        <main className="px-4 pt-5 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
