# Component Troubleshooting Guide

## Quick Fixes for Non-Working Components

### 1. **Install Dependencies**
```bash
cd frontend
npm install
```

### 2. **Check Environment Variables**
Create/update `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3001
VITE_AI_SERVICE_URL=http://localhost:5000/api/v1/ai
```

### 3. **Start Backend Services**
```bash
# Terminal 1: Main Backend
cd backend
npm run dev

# Terminal 2: Real-time Service (if needed)
cd backend/realtime-service
npm run dev

# Terminal 3: AI Service (if needed)
cd backend/ai-service
python app.py
```

### 4. **Common Component Issues**

#### Issue: Components Not Rendering
**Solution:**
- Check browser console for errors
- Verify all imports are correct
- Ensure UI components are installed: `npm install @radix-ui/react-*`

#### Issue: API Calls Failing
**Solution:**
- Verify backend is running on port 3000
- Check CORS settings in backend
- Verify API routes match frontend calls

#### Issue: Real-time Features Not Working
**Solution:**
- Ensure Socket.io server is running
- Check WebSocket connection in browser DevTools
- Verify `VITE_SOCKET_URL` is correct

#### Issue: Routing Not Working
**Solution:**
- Check `App.tsx` routes are correct
- Verify `react-router-dom` is installed
- Check for 404 errors in console

#### Issue: Styling Not Applied
**Solution:**
- Verify Tailwind CSS is configured
- Check `index.css` is imported in `main.tsx`
- Ensure `tailwind.config.js` exists

### 5. **Component-Specific Fixes**

#### Dashboard Components
- Ensure Redux store is configured
- Check `store/store.ts` exists
- Verify slices are properly exported

#### Chart Components
- Install recharts: `npm install recharts`
- Check data format matches chart requirements
- Verify responsive container is used

#### Form Components
- Install react-hook-form: `npm install react-hook-form`
- Verify zod validation schemas
- Check form submission handlers

### 6. **TypeScript Errors**
```bash
# Check for TypeScript errors
npm run build

# Fix common issues:
# - Add missing type definitions
# - Fix import paths
# - Add missing props to interfaces
```

### 7. **Build and Test**
```bash
# Development mode
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Component Status Checklist

- [ ] All dependencies installed
- [ ] Environment variables set
- [ ] Backend services running
- [ ] No console errors
- [ ] Routes working
- [ ] API calls successful
- [ ] Real-time features connected
- [ ] Styling applied correctly
- [ ] Forms submitting properly
- [ ] Charts displaying data

## Getting Help

1. Check browser console for errors
2. Check Network tab for failed requests
3. Verify all services are running
4. Check component props are correct
5. Review component logs

## Most Common Fixes

1. **"Module not found"** → Run `npm install`
2. **"Cannot read property"** → Check data structure
3. **"Network error"** → Verify backend is running
4. **"CORS error"** → Check backend CORS settings
5. **"Socket connection failed"** → Verify Socket.io server
