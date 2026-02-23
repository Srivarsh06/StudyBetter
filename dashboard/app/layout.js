import "./globals.css";

export const metadata = {
  title: "Study Efficiency Tracker",
  description: "Track focus, sessions, and burnout",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
