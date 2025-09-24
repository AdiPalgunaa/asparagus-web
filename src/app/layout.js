import { AuthProvider } from '@/components/AuthContext';
import './globals.css';

export const metadata = {
  title: 'Sistem Asparagus',
  description: 'Sistem monitoring dan pencatatan asparagus',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}