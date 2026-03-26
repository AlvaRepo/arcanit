import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        arca: {
          primary: '#1e40af',
          secondary: '#3b82f6',
          accent: '#60a5fa',
        },
      },
    },
  },
  plugins: [],
};

export default config;