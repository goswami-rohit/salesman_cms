// src/app/home/cemtemChat/layout.tsx

export default function CemtemChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>; // No sidebar, no dashboard layout
}
