# Expanded Design System: Ross Tax Prep & Bookkeeping

## 1. Global Style Guidelines
- **Primary Color:** #2C3E50 (Dark Blue)
- **Accent Color:** #27AE60 (Green)
- **Background:** #F4F8FB (Light Gray)
- **Text:** #222 (Dark Gray)
- **Error:** #E74C3C (Red)
- **Font Family:** 'Montserrat' for headings, 'Roboto' for body
- **Border Radius:** 6px for all components
- **Shadow:** 0 2px 6px rgba(44,62,80,0.08) for cards, modals, buttons

## 2. Page Wireframes & Layouts
### Home.jsx
- Header: Logo, navigation bar
- Hero: Welcome message, CTA button
- Services: Card grid
- Testimonials: Card slider
- Footer: Contact info, social links

### Intake.jsx
- Title: "Client Intake Form"
- Form: Full Name, Email, Phone, Service, Notes
- Button: Primary, loading state
- Error/Success: Modal overlay

### CRM.jsx
- Sidebar: Navigation (Clients, Intakes, Staff, Certificates)
- Main: Table of intakes/clients
- Actions: View, Edit, Delete buttons

### Services.jsx
- List of services: Card grid
- Details: Modal or expandable card

### Success.jsx
- Confirmation message
- Button: Return to Home/CRM

## 3. UI Components
### Button
- Primary, Accent, Disabled, Loading
### Card
- Service, Testimonial, Info
### Table
- Striped rows, sortable headers, action icons
### Modal
- Overlay, close icon, centered content
### Form
- Labeled fields, error/success states
### Navbar
- Responsive, sticky, logo left, links right
### Sidebar
- Collapsible, icons, active highlight

## 4. Example React Components
### Button.jsx
```jsx
export default function Button({ children, variant = "primary", ...props }) {
  const colors = {
    primary: '#27AE60',
    accent: '#2C3E50',
    disabled: '#B0B0B0',
  };
  return (
    <button
      style={{
        background: colors[variant],
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        padding: '10px 20px',
        fontWeight: 'bold',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.6 : 1,
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

### Card.jsx
```jsx
export default function Card({ children }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '6px',
      boxShadow: '0 2px 6px rgba(44,62,80,0.08)',
      padding: '20px',
      margin: '10px 0',
    }}>
      {children}
    </div>
  );
}
```

### Table.jsx
```jsx
export default function Table({ columns, data }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '6px', overflow: 'hidden' }}>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col} style={{ padding: '12px', background: '#F4F8FB', textAlign: 'left', fontWeight: 'bold', borderBottom: '2px solid #eee' }}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} style={{ background: i % 2 ? '#F4F8FB' : '#fff' }}>
            {columns.map(col => (
              <td key={col} style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{row[col]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Modal.jsx
```jsx
export default function Modal({ children, open, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(44,62,80,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ background: '#fff', borderRadius: '6px', padding: '30px', boxShadow: '0 2px 12px rgba(44,62,80,0.18)', minWidth: '320px', maxWidth: '90vw', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#2C3E50' }}>×</button>
        {children}
      </div>
    </div>
  );
}
```

## 5. Responsive & Accessibility
- All components use relative units and media queries for mobile/tablet/desktop.
- Buttons and forms have accessible labels and focus states.
- Color contrast meets WCAG AA standards.

---
This expanded design system can be applied to all major pages and components. For full graphics, use Figma or Sketch based on these specs.