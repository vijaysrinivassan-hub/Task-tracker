import "./globals.css";

export const metadata = {
  title: "Client Task Tracker",
  description: "Horizontal per-client checklist",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
