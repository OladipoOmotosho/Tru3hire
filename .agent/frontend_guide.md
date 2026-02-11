---
inclusion: always
---

# TrueHire Frontend Guide

## 1. UI Design System

- **Framework**: React + Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React (`lucide-react`)
- **Components**: Radix UI Primitives (via `shadcn/ui` concepts logic)

## 2. Reusable Components

**"Start the use of Reusable components"**

### Principles

1.  **Atomic Design**:
    - **Atoms**: `Button`, `Input`, `Badge` (Smallest units).
    - **Molecules**: `JobCard`, `SearchBar` (Combinations of atoms).
    - **Organisms**: `Navbar`, `ResultsGrid` (Complex sections).
2.  **Composition Pattern**:
    - Components should accept `className` to allow non-breaking overrides.
    - Components should accept `children` when acting as containers.

### Component Template

```tsx
import { cn } from "@/lib/utils"; // tailwind-merge utility

interface TrueButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function TrueButton({
  className,
  variant = "primary",
  ...props
}: TrueButtonProps) {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-light hover:bg-gray-200",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    />
  );
}
```

## 3. Tailwind Usage

- **Colors**: Use semantic names if possible (e.g. `text-primary` vs `text-blue-600`).
- **Spacing**: Use standard scale (`p-4`, `m-2`). Avoid arbitrary values (`p-[13px]`).
- **Responsiveness**: Mobile-first. `w-full md:w-1/2`.

## 4. File Organization

```
packages/frontend/src/
├── components/
│   ├── ui/           # Atoms (Button, Input)
│   ├── jobs/         # Domain components (JobCard)
│   └── shared/       # Layouts (Navbar)
├── pages/            # Page Views
├── lib/
│   └── utils.ts      # Helper functions (cn, formatters)
└── hooks/            # Custom hooks
```
