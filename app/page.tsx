import { redirect } from "next/navigation";

/**
 * Root page redirects to chat
 * This ensures users always land on the main chat interface
 */
export default function Home() {
  redirect("/chat");
}
