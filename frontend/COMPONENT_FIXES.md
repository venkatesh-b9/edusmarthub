# Component Fixes Guide

## Common Issues and Solutions

### 1. Missing Dependencies
If components are not working, ensure all dependencies are installed:
```bash
cd frontend
npm install
```

### 2. Missing Component Files
All required component files should exist. Check:
- `src/pages/NotFound.tsx` ✓
- `src/contexts/RoleContext.tsx` ✓
- `src/lib/i18n.ts` ✓

### 3. Import Errors
If you see import errors, check:
- Path aliases in `tsconfig.json` or `vite.config.ts`
- Component exports are correct
- All UI components from `@/components/ui/*` are available

### 4. Runtime Errors
Common runtime issues:
- **Socket.io connection**: Check if backend realtime service is running
- **API calls**: Check if backend API is running on correct port
- **Redux store**: Ensure store is properly configured
- **Theme provider**: Check if `next-themes` is installed

### 5. TypeScript Errors
If TypeScript errors occur:
- Run `npm run build` to see all errors
- Fix type mismatches
- Add missing type definitions

## Quick Fixes

### Fix ExportModal Missing Props
```typescript
interface ExportModalProps {
  trigger?: React.ReactNode;
}
```

### Fix Missing Component Exports
Ensure all components have proper default or named exports.

### Fix API Connection
Update `.env` file with correct API URLs:
```
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3001
```

## Testing Components

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Check Console**: Open browser DevTools for errors
4. **Check Network**: Verify API calls are successful

## Component Status

✅ Working:
- Index/Welcome page
- Dashboard layouts
- UI components (shadcn/ui)
- Routing

⚠️ May need fixes:
- Components with API dependencies (need backend running)
- Real-time components (need Socket.io server)
- Charts (need data)

## Next Steps

1. Ensure backend is running
2. Check environment variables
3. Verify all dependencies installed
4. Test each route individually
