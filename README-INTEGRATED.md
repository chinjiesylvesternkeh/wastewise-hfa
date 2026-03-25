# 🌟 Integrated Wellness Platform

A complete wellness ecosystem consisting of three specialized applications unified under a single authentication gateway.

## 🏗️ Architecture

This platform consists of **4 separate applications**:

### 🌐 Main Gateway (Port 3000)
- **Authentication & Authorization** - Centralized login/registration
- **Dashboard** - Unified view of all wellness data  
- **Proxy Router** - Routes authenticated requests to individual apps
- **User Management** - Profile and preferences

### 🏥 Healthcare App (Port 3002)
- **Patient Management** - Complete patient records
- **Appointments** - Scheduling and management
- **Medical Records** - Health metrics, diagnoses, treatments
- **Medications** - Prescription tracking

### 💪 Fitness App (Port 3003)
- **Workout Tracking** - Log exercises and activities
- **Goal Setting** - Fitness objectives and progress
- **Progress Monitoring** - Body measurements and photos
- **User Profiles** - Fitness preferences and history

### 🍽️ Culinary App (Port 3004)
- **Recipe Management** - Create and store recipes
- **Meal Planning** - Weekly meal organization
- **Nutrition Tracking** - Daily food intake logging
- **Dietary Management** - Restrictions and preferences

## 🚀 Quick Start

### 1. Install Dependencies
```bash
node install-all.js
```

### 2. Start All Applications
```bash
node start-all.js
```

### 3. Access the Platform
- **Main Platform**: http://localhost:3000
- **Healthcare**: http://localhost:3002 (requires auth)
- **Fitness**: http://localhost:3003 (requires auth)  
- **Culinary**: http://localhost:3004 (requires auth)

## 🔐 Authentication Flow

1. **Register/Login** at the main gateway (localhost:3000)
2. **Dashboard Access** - View unified wellness data
3. **App Access** - Click to open individual specialized apps
4. **Automatic Authentication** - Token-based access to all apps

## 📱 User Journey

### New Users
1. Visit http://localhost:3000
2. Click "Join Now" 
3. Fill registration form (auto-saves data)
4. Automatic login and redirect to dashboard
5. Access all three wellness apps

### Returning Users  
1. Visit http://localhost:3000
2. Click "Sign In"
3. Auto-filled email (if remembered)
4. Access dashboard and all apps

## 🛠️ Individual App Management

### Start Individual Apps
```bash
# Gateway only
cd main-app && npm start

# Healthcare only  
cd apps/healthcare && npm start

# Fitness only
cd apps/fitness && npm start

# Culinary only
cd apps/culinary && npm start
```

### Development Mode
```bash
# Use nodemon for auto-restart
cd main-app && npm run dev
cd apps/healthcare && npm run dev
cd apps/fitness && npm run dev
cd apps/culinary && npm run dev
```

## 🗄️ Database Structure

Each app uses its own MongoDB database:
- **wellness_gateway** - User authentication
- **healthcare** - Patient and medical data
- **fitness** - Workout and progress data  
- **culinary** - Recipe and nutrition data

## 🔧 Configuration

### Environment Variables
Create `.env` files in each app directory:

```env
# main-app/.env
PORT=3000
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/wellness_gateway

# apps/healthcare/.env  
PORT=3002
MONGODB_URI=mongodb://localhost:27017/healthcare

# apps/fitness/.env
PORT=3003
MONGODB_URI=mongodb://localhost:27017/fitness

# apps/culinary/.env
PORT=3004
MONGODB_URI=mongodb://localhost:27017/culinary
```

## 🌟 Key Features

### ✅ Unified Authentication
- Single sign-on across all apps
- JWT token-based security
- Remember me functionality
- Auto-save registration data

### ✅ Integrated Dashboard
- Cross-app statistics
- Unified wellness overview
- Quick access to all features

### ✅ Specialized Applications
- **Healthcare**: Full EMR functionality
- **Fitness**: Comprehensive tracking
- **Culinary**: Complete nutrition management

### ✅ Modern UI/UX
- Responsive design
- Gradient themes per app
- Smooth transitions
- Mobile-friendly

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **CORS Protection** - Cross-origin request security
- **Helmet.js** - Security headers
- **Input Validation** - Server-side validation
- **Password Hashing** - bcrypt encryption

## 📊 Monitoring & Logs

Each app provides:
- Console logging with app prefixes
- Error handling and reporting
- Health check endpoints
- Performance monitoring

## 🚀 Production Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment
1. Set production environment variables
2. Configure MongoDB connections
3. Set up reverse proxy (nginx)
4. Enable SSL certificates
5. Configure process management (PM2)

## 🤝 Contributing

1. Fork the repository
2. Create feature branches for each app
3. Follow the established architecture
4. Test authentication flow
5. Submit pull requests

## 📝 API Documentation

### Gateway Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `GET /api/auth/profile` - User profile
- `GET /api/dashboard` - Unified dashboard data

### Protected Routes
- `/healthcare/*` - Proxied to healthcare app
- `/fitness/*` - Proxied to fitness app
- `/culinary/*` - Proxied to culinary app

## 🎯 Next Steps

1. **Enhanced Integration** - Cross-app data sharing
2. **Advanced Analytics** - ML-powered insights
3. **Mobile Apps** - React Native applications
4. **API Gateway** - Advanced routing and rate limiting
5. **Microservices** - Container orchestration

---

## 🌟 Success! 

You now have a complete, integrated wellness platform with:
- ✅ Centralized authentication
- ✅ Three specialized applications  
- ✅ Unified dashboard
- ✅ Modern, responsive UI
- ✅ Secure, scalable architecture

**Start exploring your wellness journey at http://localhost:3000** 🚀