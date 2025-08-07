import { redirect } from 'next/navigation';

export default function HomePage() {
  // This page simply serves as a redirector. It sends the user to the
  // signed-in home page, which contains the actual dashboard content.
  redirect('/home/signedInHomePage');
}
