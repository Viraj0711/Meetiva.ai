# Custom Select Component Usage Guide

## Overview
The new `Select` component provides a fully styled, custom dropdown that matches your SaaS dashboard theme with complete control over hover, active, and focus states.

## Color System
- **Primary Blue**: #2F80ED
- **Active Background**: #E6F0FA
- **Hover Background**: #F2F7FD
- **Border**: #DDE6F0
- **Background**: #FFFFFF
- **Text Primary**: #333333
- **Text Secondary**: #828282
- **Focus Ring**: rgba(47, 128, 237, 0.15)

## Import

```tsx
import { Select } from '@/components/ui/Select';
// or
import { Select } from '@/components/ui';
```

## Basic Usage

```tsx
import { Select } from '@/components/ui/Select';

const [status, setStatus] = useState('all');

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

<Select
  options={statusOptions}
  value={status}
  onChange={setStatus}
  placeholder="Select status..."
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `options` | `SelectOption[]` | Yes | - | Array of options with `value` and `label` |
| `value` | `string` | Yes | - | Currently selected value |
| `onChange` | `(value: string) => void` | Yes | - | Callback when selection changes |
| `placeholder` | `string` | No | `'Select...'` | Placeholder text when no option selected |
| `className` | `string` | No | - | Additional CSS classes |
| `disabled` | `boolean` | No | `false` | Disable the select |

## SelectOption Interface

```tsx
interface SelectOption {
  value: string;
  label: string;
}
```

## Examples

### Action Items Page - Status Filter

**Replace this:**
```tsx
<select
  className="w-full px-3 py-2 border rounded-md bg-white"
  value={filterStatus}
  onChange={(e) => setFilterStatus(e.target.value)}
>
  <option value="all">All Status</option>
  <option value="pending">Pending</option>
  <option value="in-progress">In Progress</option>
  <option value="completed">Completed</option>
</select>
```

**With this:**
```tsx
<Select
  options={[
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ]}
  value={filterStatus}
  onChange={setFilterStatus}
  placeholder="Select status..."
/>
```

### Priority Filter

```tsx
const priorityOptions = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

<Select
  options={priorityOptions}
  value={filterPriority}
  onChange={setFilterPriority}
/>
```

### With Custom Width

```tsx
<Select
  className="w-64"
  options={options}
  value={value}
  onChange={setValue}
/>
```

### Disabled State

```tsx
<Select
  options={options}
  value={value}
  onChange={setValue}
  disabled={true}
/>
```

## Features

✅ **Fully Styled**: Complete control over all states (hover, active, focus)
✅ **Keyboard Accessible**: Click outside to close, ESC to close
✅ **Smooth Animations**: 200ms transitions matching your theme
✅ **Rounded Corners**: 10px border radius for modern look
✅ **Focus Ring**: Subtle blue ring matching design system
✅ **Check Icons**: Selected items show checkmark
✅ **Chevron Animation**: Rotates when dropdown opens
✅ **Responsive**: Works on all screen sizes
✅ **Dark Mode Ready**: Includes dark mode styles

## Migration Guide

### Before (Native Select)
```tsx
<select value={value} onChange={(e) => setValue(e.target.value)}>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</select>
```

### After (Custom Select)
```tsx
<Select
  options={[
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
  ]}
  value={value}
  onChange={setValue}
/>
```

## Native Select Fallback

If you need to keep using native `<select>` elements (for forms, etc.), they will automatically get the themed styling from `index.css`. However, note that native select dropdown options have limited styling support across browsers.

Native select styling includes:
- Themed colors matching design system
- Hover effects on the select itself
- Focus ring
- Rounded corners (10px)
- Custom chevron icon

But native options cannot be fully styled in most browsers, so the custom `Select` component is recommended for the best user experience.

## Notes

- The custom Select component uses divs and buttons for full styling control
- It includes click-outside-to-close functionality
- Selected state shows a checkmark icon
- Dropdown has smooth fade-in animation
- Maximum height of 60 (15rem) with scrolling for long lists
