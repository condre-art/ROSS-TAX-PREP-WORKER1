# Mini Design Package: Ross Tax Prep & Bookkeeping

## 1. Wireframes

### Home Page
- Header: Logo, navigation (Home, Services, CRM, Contact)
- Hero section: Welcome message, call-to-action button
- Services overview: Cards for Tax Prep, Bookkeeping, IRS Help
- Footer: Contact info, social links

### Intake Form Page
- Title: "Client Intake Form"
- Form fields: Full Name, Email, Phone, Service, Notes
- Submit button (primary color)
- Success message modal

### CRM Dashboard
- Sidebar: Navigation (Clients, Intakes, Staff, Certificates)
- Main area: Table/list of intakes/clients
- Action buttons: View, Edit, Delete

## 2. Color Palette
- Primary: #2C3E50 (Dark Blue)
- Accent: #27AE60 (Green)
- Background: #F4F8FB (Light Gray)
- Text: #222 (Dark Gray)
- Error: #E74C3C (Red)

## 3. Typography
- Headings: 'Montserrat', sans-serif, bold
- Body: 'Roboto', sans-serif, regular
- Button: Uppercase, bold

## 4. UI Component Sketches
- Button: Rounded corners, solid fill (primary/accent), hover shadow
- Card: White background, subtle shadow, rounded corners
- Table: Striped rows, clear headers, action icons
- Modal: Centered, overlay background, close icon
- Form: Labeled fields, error messages in red, success in green

## 5. Example Component (React)
```jsx
// Button.jsx
export default function Button({ children, ...props }) {
  return (
    <button
      style={{
        background: '#27AE60',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        padding: '10px 20px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(44,62,80,0.08)',
        textTransform: 'uppercase',
      }}
      {...props}
    >
      {children}
    </button>
  );
}
```

---
This package provides a clean, professional look for your app. For full graphics, use Figma or draw based on these specs.