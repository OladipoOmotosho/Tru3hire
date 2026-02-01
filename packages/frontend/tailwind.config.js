const colors = require("tailwindcss/colors");

module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
    "../shared/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        // Core semantic color tokens mapped to CSS variables

        // NEW: Hero background colors
        "hero-bg": "var(--color-hero-bg)",
        warning: colors.amber,
        success: colors.emerald,
        info: colors.blue,
        "hero-gradient-from": "var(--color-hero-gradient-from)",
        "hero-gradient-via": "var(--color-hero-gradient-via)",
        "hero-gradient-to": "var(--color-hero-gradient-to)",

        // Navbar tokens (map to CSS variables so we can use Tailwind classes)
        nav: "var(--nav-bg)",
        "nav-scrolled": "var(--nav-bg-scrolled)",
        "nav-border": "var(--nav-border)",

        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        card: "var(--color-card)",
        "card-foreground": "var(--color-card-foreground)",

        // Primary / Secondary / Accent / Muted / Destructive
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",

        // Popover / input / ring / border
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        input: "var(--input)",
        "input-background": "var(--input-background)",
        "switch-background": "var(--switch-background)",
        border: "var(--border)",
        ring: "var(--ring)",

        // Glass / decorative tokens
        "glass-light": "var(--glass-light)",
        "glass-dark": "var(--glass-dark)",
        "glass-border-light": "var(--glass-border-light)",
        "glass-border-dark": "var(--glass-border-dark)",

        // Grays (explicit tokens from index.css)
        "gray-dark": "var(--gray-dark)",
        "gray-light": "var(--gray-light)",
        "gray-dada": "var(--gray-dada)",
        "gray-7b7b": "var(--gray-7b7b)",
        "gray-4b": "var(--gray-4b)",
        "gray-5b": "var(--gray-5b)",
        "gray-6b": "var(--gray-6b)",
        "gray-5a": "var(--gray-5a)",
        "gray-e0": "var(--gray-e0)",
        "gray-eb": "var(--gray-eb)",

        // Chart colors (group)
        chart: {
          1: "var(--chart-1, var(--color-chart-1))",
          2: "var(--chart-2, var(--color-chart-2))",
          3: "var(--chart-3, var(--color-chart-3))",
          4: "var(--chart-4, var(--color-chart-4))",
          5: "var(--chart-5, var(--color-chart-5))",
        },

        // Sidebar tokens
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },

        // If you want to expose text shade scales to Tailwind utilities,
        // prefer defining explicit CSS vars in globals.css such as:
        // --text-shade-100, --text-shade-200, ... --text-shade-900
        // Then you can map them here. For now we include a placeholder mapping:
        "text-shade": {
          100: "var(--text-shade-100, var(--color-text-shades-100))",
          200: "var(--text-shade-200, var(--color-text-shades-200))",
          300: "var(--text-shade-300, var(--color-text-shades-300))",
          400: "var(--text-shade-400, var(--color-text-shades-400))",
          500: "var(--text-shade-500, var(--color-text-shades-500))",
          600: "var(--text-shade-600, var(--color-text-shades-600))",
          700: "var(--text-shade-700, var(--color-text-shades-700))",
          800: "var(--text-shade-800, var(--color-text-shades-800))",
          900: "var(--text-shade-900, var(--color-text-shades-900))",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
    },
  },
  plugins: [],
};
