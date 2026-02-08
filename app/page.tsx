import Link from "next/link";

export default function Home() {
  return (
    <main className="home-shell">
      <div className="panel">
        <p className="eyebrow">Luka Mission Control</p>
        <h1>Dashboard</h1>
        <p>
          Convex-backed activity feed, weekly calendar, and global search over
          signals plus docs.
        </p>
        <Link className="button" href="/dashboard">
          Open Dashboard
        </Link>
      </div>
    </main>
  );
}
