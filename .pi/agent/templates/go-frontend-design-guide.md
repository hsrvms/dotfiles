# Frontend Design Guide

Server-first full-stack Go applications using templ, HTMX, Alpine.js, and Tailwind CSS.

This guide defines the conventions for building the frontend layer. It supplements the Go project conventions and the global engineering rules.

---

## Table of Contents

- [Rendering Philosophy](#rendering-philosophy)
- [Layout System](#layout-system)
- [Page Data](#page-data)
- [Component System](#component-system)
- [Navigation & HTMX Patterns](#navigation--htmx-patterns)
- [Forms & Validation](#forms--validation)
- [Feedback & Notifications](#feedback--notifications)
- [Loading States](#loading-states)
- [CSS & Tailwind Conventions](#css--tailwind-conventions)
- [Dark Mode](#dark-mode)
- [Responsive Design](#responsive-design)
- [Alpine.js Conventions](#alpinejs-conventions)
- [Icons, Fonts & Static Assets](#icons-fonts--static-assets)
- [Error Pages](#error-pages)
- [Accessibility](#accessibility)

---

## Rendering Philosophy

**Server-first.** Every page is rendered on the server as HTML. The client receives a complete, functional page. Interactivity layers on top progressively:

1. **HTML** — the page works without any JavaScript (links, forms, navigation).
2. **HTMX** — upgrades interactions to partial swaps without full page reloads.
3. **Alpine.js** — adds client-only interactivity (dropdowns, modals, tabs) that don't need the server.
4. **Vanilla JS** — only when Alpine can't do it (file uploads with progress, drag-and-drop, chart libraries).

### The Rule

> If an interaction can be handled by the server, it should be. Reach for JavaScript only when the interaction is purely visual or requires browser APIs.

**Good** — deleting a user via HTMX, server returns updated list fragment:

```html
<button hx-delete="/users/123"
        hx-target="closest tr"
        hx-swap="outerHTML"
        hx-confirm="Delete this user?">
    Delete
</button>
```

**Bad** — fetching JSON from a custom API endpoint to render a user card client-side when the server could render it directly:

```html
<!-- Don't do this when templ can render it -->
<div x-data="userCard()" x-init="fetch('/api/users/123').then(...)"></div>
```

---

## Layout System

Two fixed layouts. Pages nest inside them.

### Default Layout

Used for all authenticated pages. Provides the shell: `<head>`, navigation sidebar/header, main content area, footer, toast container.

```templ
// web/templates/layouts/default.templ
package layouts

import "project/internal/server"

templ Default(pd server.PageData) {
    <!DOCTYPE html>
    <html lang="en" class="h-full" x-data="{ dark: false }" x-init="
        dark = localStorage.getItem('theme') === 'dark'
            || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    " x-bind:class="{ 'dark': dark }">
        <head>
            <meta charset="UTF-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>{ pd.Title } — AppName</title>
            if pd.Description != "" {
                <meta name="description" content={ pd.Description }/>
            }
            <meta name="csrf-token" content={ pd.CSRFToken }/>
            <link rel="stylesheet" href="/static/css/output.css"/>
            <link rel="preconnect" href="https://fonts.googleapis.com"/>
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""/>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
            <!-- Icon font loaded in head -->
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lucide-static@latest/font/lucide.css"/>
            <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
            <script src="https://unpkg.com/htmx.org@2.0.4"></script>
            <!-- Page-specific head content -->
            { children... }
        </head>
        <body class="h-full bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 font-sans antialiased">
            <div class="min-h-full">
                @Navigation(pd)
                <main class="py-10">
                    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        @Breadcrumbs(pd.Breadcrumbs)
                        <!-- Page content injected here -->
                        { children... }
                    </div>
                </main>
                @Footer()
            </div>
            @ToastContainer()
        </body>
    </html>
}
```

### Auth Layout

Used for login, register, forgot-password, etc. Minimal — no navigation, no sidebar, centered content.

```templ
// web/templates/layouts/auth.templ
package layouts

import "project/internal/server"

templ Auth(pd server.PageData) {
    <!DOCTYPE html>
    <html lang="en" class="h-full">
        <head>
            <meta charset="UTF-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>{ pd.Title } — AppName</title>
            <link rel="stylesheet" href="/static/css/output.css"/>
            <link rel="preconnect" href="https://fonts.googleapis.com"/>
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""/>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
            <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
            <script src="https://unpkg.com/htmx.org@2.0.4"></script>
        </head>
        <body class="h-full bg-gray-50 dark:bg-gray-950 font-sans antialiased">
            <div class="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div class="sm:mx-auto sm:w-full sm:max-w-md">
                    <!-- Logo -->
                    <h2 class="mt-6 text-center text-2xl font-bold">{ pd.Title }</h2>
                </div>
                <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div class="bg-white dark:bg-gray-900 px-6 py-8 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 sm:rounded-lg sm:px-12">
                        { children... }
                    </div>
                </div>
            </div>
            @ToastContainer()
        </body>
    </html>
}
```

### Where Metadata Lives

| Data               | Where                              | How                                                        |
|--------------------|------------------------------------|------------------------------------------------------------|
| Page title         | `PageData.Title`                   | Handler sets it before rendering                           |
| Meta description   | `PageData.Description`             | Optional, rendered in `<meta>` if non-empty                |
| CSRF token         | `PageData.CSRFToken`               | Middleware injects it, layout renders as `<meta>` tag      |
| Breadcrumbs        | `PageData.Breadcrumbs`             | Handler builds the slice, layout renders via component     |
| Current user       | `PageData.User`                    | Auth middleware populates it                               |
| Flash messages     | Via `HX-Trigger` response headers  | Toast container listens for custom events (see below)      |

---

## Page Data

Every handler constructs a `PageData` struct and passes it to the page template alongside page-specific data.

```go
// internal/server/page.go
package server

import "project/internal/users"

type PageData struct {
    User        *users.User
    CSRFToken   string
    Title       string
    Description string
    Breadcrumbs []Breadcrumb
}

type Breadcrumb struct {
    Label string
    Href  string // empty string = current page (not a link)
}
```

### Handler Usage

```go
func (h *UserHandler) List(c echo.Context) error {
    users, err := h.service.ListUsers(c.Request().Context())
    if err != nil {
        return err
    }

    pd := h.pageData(c, "Users", "Manage user accounts")
    return Render(c, http.StatusOK, pages.UserList(pd, UserListData{
        Users: users,
    }))
}

// pageData is a helper on the handler that builds PageData with common fields
func (h *UserHandler) pageData(c echo.Context, title, description string) server.PageData {
    user, _ := c.Get("user").(*users.User)
    return server.PageData{
        User:        user,
        CSRFToken:   c.Get("csrf").(string),
        Title:       title,
        Description: description,
        Breadcrumbs: []server.Breadcrumb{
            {Label: "Home", Href: "/"},
            {Label: title, Href: ""},
        },
    }
}
```

### Page Template Receives Both

```templ
// web/templates/pages/users/list.templ
package pages

import (
    "project/internal/server"
    "project/internal/users"
    "project/web/templates/layouts"
    "project/web/templates/components"
)

type UserListData struct {
    Users []users.User
}

templ UserList(pd server.PageData, data UserListData) {
    @layouts.Default(pd) {
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold">Users</h1>
            @components.Button(components.ButtonProps{
                Label:   "Add User",
                Href:    "/users/new",
                Variant: "primary",
            })
        </div>
        <div
            id="user-list"
            hx-get="/users/partial?page=2"
            hx-trigger="revealed"
            hx-swap="beforeend"
        >
            for _, u := range data.Users {
                @components.UserCard(components.UserCardProps{User: u})
            }
        </div>
    }
}
```

---

## Component System

### Granularity

A component is any reusable piece of UI that appears more than once or encapsulates a distinct concern. Examples:

- **Button** — single element, many variants
- **FormField** — label + input + error message grouped together
- **UserCard** — a card displaying user info
- **Alert** — success/error/info message
- **Modal** — dialog shell (content passed as children)
- **DataTable** — sortable, paginated table
- **Whole form** — if a complete form (e.g., login form) is used in multiple places

A one-off page section that appears nowhere else is **not** a component — it stays inline in the page template.

### Props Convention

Every component receives a single **Props struct**. The struct is defined in the same file as the component.

```templ
// web/templates/components/button.templ
package components

type ButtonProps struct {
    Label    string
    Href     string // if set, renders <a>; otherwise <button>
    Variant  string // "primary", "secondary", "danger", "ghost"
    Size     string // "sm", "md", "lg"
    Disabled bool
    HTMX     string // raw hx-* attributes string (empty = none)
    Type     string // "submit", "button", "reset" (default: "button")
    Icon     string // icon font class name (empty = none)
}

templ Button(props ButtonProps) {
    if props.Href != "" {
        <a
            href={ props.Href }
            class={ buttonClasses(props.Variant, props.Size, props.Disabled) }
        >
            if props.Icon != "" {
                <i class={ props.Icon }></i>
            }
            { props.Label }
        </a>
    } else {
        <button
            type={ templ.KV("submit", props.Type == "submit"), "button": props.Type == "" || props.Type == "button" }
            disabled={ templ.KV(true, props.Disabled) }
            class={ buttonClasses(props.Variant, props.Size, props.Disabled) }
        >
            if props.Icon != "" {
                <i class={ props.Icon }></i>
            }
            { props.Label }
        </button>
    }
}
```

### Naming

- **PascalCase** for component names: `Button`, `FormField`, `UserCard`, `DataTable`.
- **PascalCase** for props types: `ButtonProps`, `FormFieldProps`.
- **File names** are lowercase: `button.templ`, `form_field.templ`, `user_card.templ`.

### Stateless vs Stateful

**Default: stateless.** Components receive data, render HTML, return. They don't hold state.

```templ
// Stateless — pure render
templ Alert(props AlertProps) {
    <div class={ alertClasses(props.Variant) } role="alert">
        <p>{ props.Message }</p>
    </div>
}
```

**Stateful only when the interaction is purely client-side** — the server has no reason to be involved. These components wrap Alpine `x-data`:

```templ
// Stateful — dropdown tracks open/closed on the client
templ Dropdown(props DropdownProps) {
    <div x-data="{ open: false }" class="relative">
        @Button(ButtonProps{
            Label:   props.Label,
            Variant: "secondary",
        })
        <div
            x-show="open"
            @click.outside="open = false"
            x-transition
            class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black/5"
        >
            for _, item := range props.Items {
                <a
                    href={ item.Href }
                    class="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    { item.Label }
                </a>
            }
        </div>
    </div>
}
```

**When to add Alpine state to a component:**

| Interaction            | Stateful? | Why                                              |
|------------------------|-----------|--------------------------------------------------|
| Dropdown toggle        | Yes       | Purely visual, no server data needed             |
| Modal open/close       | Yes       | UI concern, content can be pre-rendered          |
| Tabs                   | Yes       | Switching visible content, no new data           |
| Form submission        | No        | Needs server validation and persistence          |
| Search results         | No        | Needs server query and data                      |
| Delete with confirmation | No      | Needs server action, HTMX handles it             |
| File upload progress   | Yes (JS)  | Needs browser APIs, Alpine alone isn't enough    |

---

## Navigation & HTMX Patterns

### Full Page Navigation

Standard `<a href>` links trigger full page loads. Use for:

- Cross-section navigation (Home → Settings)
- URLs that must be bookmarkable and shareable
- First visits to heavy pages

### HTMX Partial Swaps

Use `hx-get` / `hx-post` with `hx-target` for interactions within a page section:

```html
<!-- Swap a content region -->
<a hx-get="/users?page=2"
   hx-target="#user-list"
   hx-swap="innerHTML">
    Next Page
</a>
```

### HTMX + Browser History

Add `hx-push-url="true"` to sync the browser URL and history with HTMX swaps. This makes partial swaps bookmarkable and enables back/forward navigation.

```html
<!-- Updates URL to /users?page=2 and adds history entry -->
<a hx-get="/users?page=2"
   hx-target="#user-list"
   hx-swap="innerHTML"
   hx-push-url="true">
    Next Page
</a>
```

### Rules

- **Every URL must work as a full page load.** HTMX enhances it; it doesn't replace it.
- **Use `hx-push-url`** on any interaction that represents a navigation (pagination, filtering, tab switching).
- **Don't use `hx-push-url`** on mutations (create, update, delete) — redirect after those.
- **`hx-swap` defaults:** use `innerHTML` for content regions, `outerHTML` for replacing the element itself (e.g., removing a row after delete).

### The HTMX Request Check

Handlers check the `HX-Request` header to decide what to return:

```go
// internal/server/htmx.go
package server

import "github.com/labstack/echo/v4"

func IsHTMX(c echo.Context) bool {
    return c.Request().Header.Get("HX-Request") == "true"
}

func Render(c echo.Context, status int, t templ.Component) error {
    c.Response().Status = status
    c.Response().Header().Set(echo.HeaderContentType, echo.MIMETextHTMLCharsetUTF8)
    return t.Render(c.Request().Context(), c.Response().Writer)
}
```

In handlers, branch on `IsHTMX` when the same URL serves both full pages and fragments:

```go
func (h *UserHandler) Detail(c echo.Context) error {
    user, err := h.service.GetUser(ctx, id)
    if err != nil {
        return err
    }

    if server.IsHTMX(c) {
        // Return just the content fragment — HTMX swaps it in
        return server.Render(c, http.StatusOK, components.UserDetail(components.UserDetailProps{User: user}))
    }

    // Full page load — wrap in layout
    pd := h.pageData(c, user.Name, "")
    return server.Render(c, http.StatusOK, pages.UserDetail(pd, UserDetailData{User: user}))
}
```

### HTMX Redirects

After mutations, redirect via `HX-Redirect` header for HTMX requests, standard redirect for full page loads:

```go
func (h *UserHandler) Delete(c echo.Context) error {
    if err := h.service.DeleteUser(ctx, id); err != nil {
        return err
    }

    if server.IsHTMX(c) {
        c.Response().Header().Set("HX-Redirect", "/users")
        return c.NoContent(http.StatusOK)
    }
    return c.Redirect(http.StatusSeeOther, "/users")
}
```

---

## Forms & Validation

### Submission

All forms submit via HTMX. No standard `<form>` submissions unless the form works without JS (progressive enhancement).

```templ
templ CreateUserForm(pd server.PageData) {
    <form
        hx-post="/users"
        hx-target="#form-container"
        hx-swap="innerHTML"
        class="space-y-6"
    >
        <input type="hidden" name="_csrf" value={ pd.CSRFToken }/>

        @components.FormField(components.FormFieldProps{
            Name:  "name",
            Label: "Full Name",
            Type:  "text",
        })

        @components.FormField(components.FormFieldProps{
            Name:  "email",
            Label: "Email",
            Type:  "email",
        })

        @components.Button(components.ButtonProps{
            Label:   "Create User",
            Type:    "submit",
            Variant: "primary",
        })
    </form>
}
```

### CSRF Protection

Middleware generates a CSRF token per session. It's injected into `PageData.CSRFToken` and rendered as a hidden field in every form:

```html
<input type="hidden" name="_csrf" value={ pd.CSRFToken }/>
```

The middleware validates `_csrf` on all non-GET requests. This is more secure than header-only CSRF because it doesn't rely on JavaScript to attach headers — the token travels with the form itself.

### Validation Strategy

**Client-first, server-authoritative.**

1. **Client side (Alpine):** Immediate feedback for format errors (empty required field, invalid email format, password too short). No server round-trip needed.
2. **Server side:** Always validates regardless of client validation. Returns the form with field errors on failure.

```templ
// web/templates/components/form_field.templ
package components

import "html/template"

type FormFieldProps struct {
    Name        string
    Label       string
    Type        string // "text", "email", "password", "number", "textarea"
    Value       string
    Error       string // server-side error (empty = no error)
    Required    bool
    Placeholder string
}

templ FormField(props FormFieldProps) {
    <div class="space-y-1">
        <label
            for={ props.Name }
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
            { props.Label }
            if props.Required {
                <span class="text-red-500">*</span>
            }
        </label>

        if props.Type == "textarea" {
            <textarea
                id={ props.Name }
                name={ props.Name }
                placeholder={ props.Placeholder }
                required={ templ.KV(true, props.Required) }
                class={ fieldClasses(props.Error != "") }
                x-model="form.{ props.Name }"
            >{ props.Value }</textarea>
        } else {
            <input
                id={ props.Name }
                name={ props.Name }
                type={ props.Type }
                value={ props.Value }
                placeholder={ props.Placeholder }
                required={ templ.KV(true, props.Required) }
                class={ fieldClasses(props.Error != "") }
                x-model="form.{ props.Name }"
            />
        }

        // Server-side error
        if props.Error != "" {
            <p class="text-sm text-red-600 dark:text-red-400">{ props.Error }</p>
        }
    </div>
}
```

### Server-Side Validation Error Display

On validation failure, the handler re-renders the form with errors populated in `FormFieldProps.Error`. For HTMX requests, return just the form fragment (target swaps the form). For full page loads, return the full page.

```go
func (h *UserHandler) Create(c echo.Context) error {
    params := parseCreateParams(c)
    errors := validateCreateParams(params)

    if len(errors) > 0 {
        if server.IsHTMX(c) {
            return server.Render(c, http.StatusOK, components.CreateUserForm(components.CreateUserFormProps{
                Values: params,
                Errors: errors,
            }))
        }
        pd := h.pageData(c, "Create User", "")
        return server.Render(c, http.StatusOK, pages.CreateUser(pd, CreateUserData{
            Values: params,
            Errors: errors,
        }))
    }

    user, err := h.service.CreateUser(ctx, params)
    if err != nil {
        return err
    }

    // Success — redirect or trigger toast
    if server.IsHTMX(c) {
        c.Response().Header().Set("HX-Redirect", "/users")
        c.Response().Header().Set("HX-Trigger", `{"toast":{"message":"User created","variant":"success"}}`)
        return c.NoContent(http.StatusOK)
    }
    return c.Redirect(http.StatusSeeOther, "/users")
}
```

---

## Feedback & Notifications

### Toast System

Toasts are triggered via HTMX response headers and rendered by Alpine.

**Server side** — set `HX-Trigger` with a custom event:

```go
// Success toast
c.Response().Header().Set("HX-Trigger", `{"toast":{"message":"User created successfully","variant":"success"}}`)

// Error toast
c.Response().Header().Set("HX-Trigger", `{"toast":{"message":"Failed to delete user","variant":"error"}}`)

// Info toast
c.Response().Header().Set("HX-Trigger", `{"toast":{"message":"3 items archived","variant":"info"}}`)
```

**Client side** — the toast container listens for the event:

```templ
// web/templates/components/toast.templ
package components

templ ToastContainer() {
    <div
        x-data="toast()"
        @toast.window="add($event.detail)"
        class="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
        <template x-for="(t, index) in toasts" :key="index">
            <div
                x-show="t.visible"
                x-transition:enter="transition ease-out duration-300"
                x-transition:enter-start="opacity-0 translate-y-2"
                x-transition:enter-end="opacity-100 translate-y-0"
                x-transition:leave="transition ease-in duration-200"
                x-transition:leave-start="opacity-100"
                x-transition:leave-end="opacity-0"
                class="rounded-lg px-4 py-3 shadow-lg text-sm font-medium max-w-sm"
                :class="{
                    'bg-green-600 text-white': t.variant === 'success',
                    'bg-red-600 text-white': t.variant === 'error',
                    'bg-blue-600 text-white': t.variant === 'info',
                }"
            >
                <span x-text="t.message"></span>
            </div>
        </template>
    </div>
}
```

```javascript
// web/static/js/toast.js
function toast() {
    return {
        toasts: [],
        add(detail) {
            const t = {
                message: detail.message,
                variant: detail.variant || 'info',
                visible: true,
            };
            this.toasts.push(t);
            setTimeout(() => { t.visible = false; }, 4000);
            setTimeout(() => {
                this.toasts = this.toasts.filter(x => x !== t);
            }, 4500);
        }
    };
}
```

### Toast Variants

| Variant   | Color     | Use case                                        |
|-----------|-----------|-------------------------------------------------|
| `success` | Green     | CRUD operations completed, settings saved       |
| `error`   | Red       | Operation failed, permission denied             |
| `info`    | Blue      | Bulk actions completed, neutral notifications   |

---

## Loading States

Use `hx-indicator` with CSS to show loading feedback during HTMX requests.

### Inline Spinner

```html
<!-- Spinner appears inside the button during request -->
<button
    hx-post="/users"
    hx-target="#form-container"
    hx-indicator="#create-spinner"
    type="submit"
    class="btn-primary"
>
    Create User
    <span id="create-spinner" class="htmx-indicator">
        <i class="lucide-loader-circle animate-spin"></i>
    </span>
</button>
```

### CSS for htmx-indicator

```css
/* web/static/css/input.css */

/* htmx indicator: hidden by default, visible during request */
.htmx-indicator {
    opacity: 0;
    transition: opacity 200ms ease-in;
}
.htmx-request .htmx-indicator {
    opacity: 1;
}
.htmx-request.htmx-indicator {
    opacity: 1;
}

/* Disable the triggering element during request */
.htmx-request button[type="submit"] {
    opacity: 0.7;
    pointer-events: none;
}
```

### Full Region Loading

For content regions that take time to load, show a skeleton or spinner overlay:

```html
<div
    id="results"
    hx-get="/search?q=query"
    hx-target="#results"
    hx-indicator="#results-loader"
>
    <!-- Results here -->
</div>
<div id="results-loader" class="htmx-indicator flex justify-center py-8">
    <i class="lucide-loader-circle text-2xl animate-spin text-gray-400"></i>
</div>
```

### Rules

- **Every HTMX mutation** (POST, PUT, DELETE, PATCH) must have a loading indicator.
- **Buttons** get an inline spinner next to the label.
- **Content regions** get a centered spinner or skeleton.
- **Disable submit buttons** during request via CSS `pointer-events: none`.
- **Never leave the user wondering** if their click registered.

---

## CSS & Tailwind Conventions

### Mobile First

Write base styles for mobile, then add breakpoints upward:

```html
<!-- Base = mobile, sm/md/lg/xl layer on top -->
<div class="px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
    <h1 class="text-lg font-semibold sm:text-xl lg:text-2xl">Dashboard</h1>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        ...
    </div>
</div>
```

### Design Tokens via theme.extend

Define project-wide tokens in `tailwind.config.js`. Use these tokens — never hardcode hex values or arbitrary pixel sizes in templates.

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./web/templates/**/*.templ",
        "./web/templates/**/*.html",
        "./web/static/js/**/*.js",
    ],
    darkMode: "class",
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"],
            },
            colors: {
                brand: {
                    50:  "#eff6ff",
                    100: "#dbeafe",
                    200: "#bfdbfe",
                    300: "#93c5fd",
                    400: "#60a5fa",
                    500: "#3b82f6",
                    600: "#2563eb",
                    700: "#1d4ed8",
                    800: "#1e40af",
                    900: "#1e3a8a",
                    950: "#172554",
                },
            },
            spacing: {
                "18": "4.5rem",
                "22": "5.5rem",
            },
            borderRadius: {
                "DEFAULT": "0.375rem",
            },
            maxWidth: {
                "page": "80rem",
            },
        },
    },
    plugins: [
        require("@tailwindcss/forms"),
        require("@tailwindcss/typography"),
    ],
}
```

### When to Extract Classes

**Inline utilities** — the default. Most elements use Tailwind classes directly in the template.

**Extract when:**

1. A pattern appears **3+ times** with the same class combination.
2. A class string is **too long to read** in a template (8+ classes).
3. The same element needs **variant support** (button primary/secondary/danger).

**How to extract:**

Prefer Tailwind's `@apply` in a dedicated CSS layer, or create a templ component that encapsulates the classes.

```css
/* web/static/css/input.css — only for heavily reused patterns */
@layer components {
    .btn {
        @apply inline-flex items-center justify-center rounded-md font-medium
               transition-colors focus-visible:outline focus-visible:outline-2
               focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none;
    }
    .btn-primary {
        @apply btn bg-brand-600 text-white hover:bg-brand-700
               focus-visible:outline-brand-600;
    }
    .btn-secondary {
        @apply btn bg-gray-100 text-gray-900 hover:bg-gray-200
               dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700;
    }
    .btn-danger {
        @apply btn bg-red-600 text-white hover:bg-red-700
               focus-visible:outline-red-600;
    }
    .input-field {
        @apply block w-full rounded-md border-0 py-2 px-3
               text-gray-900 dark:text-gray-100 shadow-sm ring-1
               ring-inset ring-gray-300 dark:ring-gray-700
               placeholder:text-gray-400
               focus:ring-2 focus:ring-inset focus:ring-brand-600
               dark:bg-gray-800
               sm:text-sm sm:leading-6;
    }
    .input-error {
        @apply input-field ring-red-500 focus:ring-red-500;
    }
}
```

### Rules

- **Never use `@apply` for one-off styles.** Inline utilities are more readable.
- **Never use `!important`.** If you need to override, restructure the specificity.
- **Use `theme.extend`** for all project colors, fonts, and spacing — don't hardcode `#3b82f6` when `text-brand-500` exists.
- **Keep `input.css` small.** It should only contain `@tailwind` directives, `@layer components` extractions, and rare custom rules.

---

## Dark Mode

Toggle-based with system preference as default.

### How It Works

1. On page load, Alpine checks `localStorage.theme`. If absent, falls back to `prefers-color-scheme`.
2. The `dark` class is toggled on `<html>`.
3. Tailwind's `darkMode: "class"` activates `dark:` variants.

### Toggle Component

```templ
// web/templates/components/theme_toggle.templ
package components

templ ThemeToggle() {
    <button
        @click="dark = !dark; localStorage.setItem('theme', dark ? 'dark' : 'light')"
        class="rounded-md p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label="Toggle dark mode"
    >
        <!-- Sun icon (visible in dark mode) -->
        <i x-show="dark" class="lucide-sun text-lg"></i>
        <!-- Moon icon (visible in light mode) -->
        <i x-show="!dark" class="lucide-moon text-lg"></i>
    </button>
}
```

### Rules

- **Every element** that uses color must have both light and dark variants: `text-gray-900 dark:text-gray-100`.
- **Use semantic colors** from the theme, not raw grays, where possible. This makes dark mode a theme swap rather than a class explosion.
- **Test both modes** before completing any UI task.

---

## Responsive Design

### Breakpoints

| Token | Width  | Typical Target      |
|-------|--------|---------------------|
| (default) | 0px+ | Mobile phones       |
| `sm`  | 640px+ | Large phones, small tablets |
| `md`  | 768px+ | Tablets             |
| `lg`  | 1024px+ | Laptops, desktops   |
| `xl`  | 1280px+ | Large screens       |
| `2xl` | 1536px+ | Wide monitors       |

### Mobile-First Rules

- **Base styles target mobile.** Add `sm:`, `md:`, `lg:` as the screen grows.
- **Hide on mobile, show on desktop:** `hidden md:block` (not `block md:hidden`).
- **Stack on mobile, row on desktop:** `flex flex-col md:flex-row`.
- **Full width on mobile, constrained on desktop:** `w-full md:max-w-md`.

### Common Layout Patterns

```html
<!-- Sidebar: hidden on mobile (toggled by Alpine), always visible on lg+ -->
<aside class="hidden lg:block lg:w-64 lg:shrink-0">
    ...
</aside>

<!-- Mobile menu button: visible on mobile, hidden on lg+ -->
<button class="lg:hidden" @click="mobileMenuOpen = true">
    <i class="lucide-menu"></i>
</button>

<!-- Responsive grid -->
<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    ...
</div>

<!-- Responsive table: card list on mobile, table on md+ -->
<div class="block md:hidden">
    <!-- Mobile: card list -->
    for _, u := range data.Users {
        @components.UserCard(components.UserCardProps{User: u})
    }
</div>
<div class="hidden md:block">
    <!-- Desktop: table -->
    @components.DataTable(components.DataTableProps{...})
</div>
```

---

## Alpine.js Conventions

### Scope

Alpine handles interactions that don't need the server:

- Dropdowns, modals, tabs, accordions
- Show/hide toggles
- Form field interactions (character counters, confirm password match)
- Toast notifications (listening for HTMX events)
- Clipboard copy
- Local state that doesn't persist (search input debounce is borderline — use HTMX with debounce modifier)

### Component Definitions

Define reusable Alpine components in `web/static/js/` and register them globally:

```javascript
// web/static/js/alpine-components.js

document.addEventListener('alpine:init', () => {

    Alpine.data('toast', () => ({
        toasts: [],
        add(detail) {
            const t = { message: detail.message, variant: detail.variant || 'info', visible: true };
            this.toasts.push(t);
            setTimeout(() => { t.visible = false }, 4000);
            setTimeout(() => { this.toasts = this.toasts.filter(x => x !== t) }, 4500);
        }
    }));

    Alpine.data('confirmDialog', () => ({
        open: false,
        message: '',
        resolve: null,
        confirm(msg) {
            this.message = msg;
            this.open = true;
            return new Promise(resolve => { this.resolve = resolve; });
        },
        yes() { this.open = false; this.resolve?.(true); },
        no() { this.open = false; this.resolve?.(false); },
    }));

    Alpine.data('copyToClipboard', () => ({
        copied: false,
        async copy(text) {
            await navigator.clipboard.writeText(text);
            this.copied = true;
            setTimeout(() => { this.copied = false }, 2000);
        }
    }));
});
```

### Inline Alpine

For one-off interactions that aren't worth a named component, use inline `x-data`:

```html
<!-- Simple toggle -->
<div x-data="{ expanded: false }">
    <button @click="expanded = !expanded">Show Details</button>
    <div x-show="expanded" x-collapse>
        ...
    </div>
</div>

<!-- Character counter -->
<div x-data="{ count: 0 }">
    <textarea @input="count = $el.value.length" maxlength="500"></textarea>
    <p x-text="`${count}/500`" class="text-sm text-gray-500"></p>
</div>
```

### Rules

- **No `document.querySelector`** in Alpine components — use `$refs` instead.
- **No `fetch()`** in Alpine to hit your own API — use HTMX for server interactions.
- **Keep state minimal.** If an Alpine component holds more than 3–4 state variables, it's probably trying to be a SPA.
- **Use `x-ref`** for DOM element references, `$el` for the current element.
- **Avoid `$watch`** unless debouncing — prefer `@event` handlers.

---

## Icons, Fonts & Static Assets

### Icons — Icon Font

Use [Lucide icon font](https://lucide.dev/icons/) loaded from CDN.

```html
<!-- In layout <head> -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lucide-static@latest/font/lucide.css"/>
```

Usage in templates:

```html
<i class="lucide-user"></i>
<i class="lucide-settings text-lg"></i>
<i class="lucide-trash-2 text-red-500"></i>
```

**Rules:**

- Reference icons by their Lucide name: `lucide-{name}`.
- Size with Tailwind text classes: `text-sm`, `text-lg`, `text-xl`.
- Color with Tailwind color classes: `text-gray-500`, `text-brand-600`.

### Fonts — Google Fonts

Use Inter (UI text) and JetBrains Mono (code blocks, monospace content).

```html
<!-- In layout <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""/>
<link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
    rel="stylesheet"
/>
```

Applied via `tailwind.config.js` `fontFamily` (see Design Tokens section).

### Images — Object Storage

User-uploaded images and media assets are served from object storage (S3, R2, MinIO, etc.), not from the Go server's static directory.

```go
// internal/config/config.go
type Config struct {
    // ...
    CDNBaseURL string // e.g., "https://cdn.example.com"
}
```

```templ
// Usage in templates
<img
    src={ cfg.CDNBaseURL + "/" + user.AvatarPath }
    alt={ user.Name + " avatar" }
    class="h-10 w-10 rounded-full object-cover"
    loading="lazy"
/>
```

**Rules:**

- **Never serve user uploads** from `web/static/`. Static is for build artifacts only.
- **Always add `loading="lazy"`** to images below the fold.
- **Always add `alt` text** for accessibility.
- **Use `width` and `height`** attributes to prevent layout shift.

### Static Directory

`web/static/` holds only build-time assets:

```
web/static/
    js/
        toast.js
        alpine-components.js
    css/
        input.css       # Tailwind source
        output.css      # Tailwind build output (gitignored or committed)
    favicon.ico
```

---

## Error Pages

Custom templ error pages for all common HTTP errors. The centralized error handler routes to them.

```templ
// web/templates/pages/errors/not_found.templ
package errors

import "project/web/templates/layouts"

templ NotFound(pd server.PageData) {
    @layouts.Default(pd) {
        <div class="text-center py-24">
            <p class="text-6xl font-bold text-gray-300 dark:text-gray-700">404</p>
            <h1 class="mt-4 text-2xl font-semibold">Page not found</h1>
            <p class="mt-2 text-gray-500 dark:text-gray-400">
                The page you're looking for doesn't exist or has been moved.
            </p>
            <div class="mt-8">
                <a href="/" class="text-brand-600 hover:text-brand-700 font-medium">
                    ← Back to home
                </a>
            </div>
        </div>
    }
}
```

### Error Handler Wiring

```go
// internal/server/errors.go
func ErrorHandler(err error, c echo.Context) {
    if c.Response().Committed {
        return
    }

    code := http.StatusInternalServerError
    message := "An unexpected error occurred"

    switch {
    case errors.Is(err, users.ErrNotFound), errors.Is(err, orders.ErrNotFound):
        code = http.StatusNotFound
    case errors.Is(err, users.ErrAlreadyExists):
        code = http.StatusConflict
    case errors.Is(err, auth.ErrUnauthorized):
        code = http.StatusUnauthorized
    case errors.Is(err, auth.ErrForbidden):
        code = http.StatusForbidden
    default:
        var he *echo.HTTPError
        if errors.As(err, &he) {
            code = he.Code
        }
    }

    // Log full error server-side
    c.Logger().Errorf("request error: method=%s path=%s code=%d err=%v",
        c.Request().Method, c.Request().URL.Path, code, err)

    // HTMX requests get a small toast trigger
    if IsHTMX(c) {
        c.Response().Header().Set("HX-Trigger", fmt.Sprintf(
            `{"toast":{"message":%q,"variant":"error"}}`, message))
        c.NoContent(code)
        return
    }

    // Full page error
    pd := server.PageData{Title: http.StatusText(code)}
    switch code {
    case http.StatusNotFound:
        Render(c, code, errorPages.NotFound(pd))
    case http.StatusUnauthorized:
        Render(c, code, errorPages.Unauthorized(pd))
    case http.StatusForbidden:
        Render(c, code, errorPages.Forbidden(pd))
    default:
        Render(c, code, errorPages.InternalError(pd))
    }
}
```

### Error Pages Required

| Status | Page             | Content                                       |
|--------|------------------|-----------------------------------------------|
| 400    | BadRequest       | "Something went wrong with your request"      |
| 401    | Unauthorized     | "Please log in to continue" + login link      |
| 403    | Forbidden        | "You don't have permission"                   |
| 404    | NotFound         | "Page not found" + back link                  |
| 409    | Conflict         | "This resource already exists"                |
| 422    | Unprocessable    | "We couldn't process your input"              |
| 500    | InternalError    | "Something went wrong" (no internal details)  |

---

## Accessibility

### Minimum Requirements

Every page and component must meet these:

- **Semantic HTML.** Use `<nav>`, `<main>`, `<header>`, `<aside>`, `<section>`, `<article>` — not just `<div>` soup.
- **Heading hierarchy.** One `<h1>` per page. Headings nest in order (h1 → h2 → h3). No skipping levels.
- **Alt text.** Every `<img>` has meaningful `alt` text. Decorative images use `alt=""`.
- **Form labels.** Every input has an associated `<label>` with matching `for`/`id`.
- **Focus indicators.** Never set `outline: none` without a replacement `focus-visible` ring. All interactive elements must show a visible focus state.
- **Color contrast.** Text meets WCAG AA (4.5:1 for normal text, 3:1 for large text).
- **ARIA labels.** Icon-only buttons need `aria-label`:

```html
<button @click="delete" aria-label="Delete user">
    <i class="lucide-trash-2"></i>
</button>
```

### Interactive Element Rules

- **Buttons** for actions. **Links** for navigation. Never `<a>` for actions, never `<button>` for navigation.
- **`role="alert"`** on error messages and toast notifications (screen readers announce them).
- **`aria-live="polite"`** on regions updated by HTMX that contain important content.

```html
<div
    id="search-results"
    hx-get="/search"
    hx-target="#search-results"
    aria-live="polite"
>
    ...
</div>
```

### Keyboard Navigation

- All interactive elements reachable via `Tab`.
- Modals trap focus while open.
- `Escape` closes modals, dropdowns, and overlays.
- Custom keybindings use `@keydown` in Alpine:

```html
<div @keydown.escape="open = false">
    ...
</div>
```
