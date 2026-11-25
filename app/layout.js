import { Prompt, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const prompt = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-prompt',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-jakarta',
});

export const metadata = {
  title: 'RSU Unity Club | ระบบบริหารจัดการชมรมและกิจกรรม มหาวิทยาลัยรังสิต',
  description: 'ศูนย์รวมคอมมูนิตี้นักศึกษา ค้นหาชมรมและกิจกรรม มหาวิทยาลัยรังสิต',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${prompt.variable} ${jakarta.variable}`}>
      <body className="font-[family-name:var(--font-prompt)] antialiased bg-[#F8FAFC] text-slate-900 selection:bg-[#C81E6E] selection:text-white">
        {children}
      </body>
    </html>
  );
}