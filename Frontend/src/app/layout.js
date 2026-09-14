import './globals.css'
import { Poppins } from 'next/font/google'
import { LanguageProvider } from '@/lib/LanguageContext'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
})

export const metadata = { title: 'Scheme Compass', description: 'Government scheme discovery portal' }

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}