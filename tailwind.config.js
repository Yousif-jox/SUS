/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        subtle: 'var(--color-background-subtle)',
        surface: 'var(--color-surface)',
        tint: 'var(--color-surface-tint)',
        ink: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
        faint: 'var(--color-subtle)',
        primary: 'var(--color-primary)',
        'primary-strong': 'var(--color-primary-strong)',
        'primary-deep': 'var(--color-primary-deep)',
        secondary: 'var(--color-secondary)',
        'secondary-foreground': 'var(--color-secondary-foreground)',
        accent: 'var(--color-accent)',
        line: 'var(--color-border)',
        'line-strong': 'var(--color-border-strong)',
        danger: 'var(--color-destructive)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-xxl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      maxWidth: {
        page: '1240px',
      },
    },
  },
  plugins: [],
};
