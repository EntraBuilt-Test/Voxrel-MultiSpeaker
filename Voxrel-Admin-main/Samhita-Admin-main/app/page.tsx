import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to project selection page
  redirect('/projects');
}


